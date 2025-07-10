/**
 * KucoinApi - A comprehensive TypeScript client for the Kucoin API
 *
 * Provides access to both spot and futures trading, account management,
 * market data, and WebSocket feeds.
 *
 * @author Maksym Shamko (https://github.com/maksymshamko)
 * @organization Gainium (https://github.com/Gainium)
 * @license MIT
 */
// External
import crypto from 'crypto'
import queryString from 'query-string'
import fetch from 'isomorphic-unfetch'
import ws from 'isomorphic-ws'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { v4 } from 'uuid'

// Internal
import { IdMute, IdMutex, sleep } from './utils'

// Import types
import {
  AnyObject,
  UnPromise,
  Methods,
  RequestType,
  Result,
  OK,
  NOTOK,
  SUCCESS_CODE,
  HANDLE_MESSAGE,
  GetAccountsInput,
  AccountBalance,
  FuturesAccountDetails,
  Position,
  OutboundAccountPosition,
  WSTokenResponse,
  WSTokenResponseToUse,
  Fee,
  BaseFee,
  AffiliateUserRebateInformation,
  APIKeyResponse,
  OrderActiveStatus,
  OrderSide,
  TradeType,
  CommonOrderConfig,
  OrderResponse,
  CanceledOrderResponse,
  KucoinOrder,
  ListOrders,
  ListFills,
  ExecutionReport,
  Ticker,
  AllTicker,
  FullTicker,
  Kline,
  KucoinSymbol,
  FuturesKucoinSymbols,
  WSSubjectEnum,
  WSTypesEnum,
  WSMessageTopicEnum,
  WSTickerMessage,
  WSBalanceMessage,
  WSUpdateOrder,
  WSOrderChangeMessage,
  WSKlines,
  WSFuturesBalanceMessage,
  WSFuturesTickerMessage,
  WSFuturesOrderMessage,
  WSFuturesPositionMessage,
  WSMessage,
  FuturesPosition,
  WSBalance,
  WSKlinesUpdate,
  SwtichMarginModeInput,
} from './types'

const mutex = new IdMutex()

/**
 * KucoinAPI Client
 *
 * Comprehensive client for the Kucoin cryptocurrency exchange API.
 * Provides methods for accessing both spot and futures markets,
 * managing accounts, placing and canceling orders, and subscribing
 * to real-time data through WebSocket connections.
 */
class KucoinApi {
  private key: string
  private secret: string
  private passphrase: string
  private url: string
  private futuresUrl: string
  private sockets: {
    [x in RequestType]: {
      ws: ReconnectingWebSocket | null
      pingInterval: number | null
      pingTimeout: number | null
      cb: { fn: (msg: WSMessage) => any; topics: string[]; signature: string }[]
      pending: boolean
      callOnConnect: ((...args: []) => any)[]
      timer: NodeJS.Timeout | null
      lastPing: number | null
      lastPong: number | null
      checkPong: NodeJS.Timeout | null
      topics: Set<string>
      tunnelId?: string
      onError?: (msg: string) => void
      pingError: number
    }
  }
  private orderFills: {
    orderId: string
    fills: { price: string; qty: string; tradeId: string }[]
  }[]
  private lastData: Map<string, number> = new Map()
  private _onError = true

  /**
   * Create a new KucoinApi client
   *
   * @param params - Optional configuration parameters including API credentials
   * @param broker - Optional broker configuration for partner programs
   */
  constructor(
    params?: {
      key?: string
      secret?: string
      passphrase?: string
    },
    private broker?: {
      spot: {
        id: string
        secret: string
      }
      futures: {
        id: string
        secret: string
      }
    },
  ) {
    this.key = params?.key || ''
    this.secret = params?.secret || ''
    this.passphrase = params?.passphrase || ''
    this.url = 'https://api.kucoin.com'
    this.futuresUrl = 'https://api-futures.kucoin.com'
    this.sockets = this.defaultWs()
    this.handleWsMessage = this.handleWsMessage.bind(this)
    this.orderFills = []
  }

  /**
   * Log handler for internal messages
   *
   * @param args - Arguments to log
   * @private
   */
  private handleLog(...args: any[]) {
    console.log(new Date(), ` | ${args}`)
  }

  /**
   * Set error handling mode
   *
   * @param bool - Whether to enable error handling
   */
  set onError(bool: boolean) {
    this._onError = bool
  }

  /**
   * Creates default WebSocket configuration
   *
   * @returns Default WebSocket configuration
   * @private
   */
  private defaultWs() {
    return {
      public: {
        ws: null,
        pingInterval: null,
        pingTimeout: null,
        cb: [],
        pending: false,
        callOnConnect: [],
        timer: null,
        lastPing: null,
        lastPong: null,
        checkPong: null,
        topics: new Set<string>(),
        onError: () => null,
        pingError: 0,
      },
      private: {
        ws: null,
        pingInterval: null,
        pingTimeout: null,
        cb: [],
        pending: false,
        callOnConnect: [],
        timer: null,
        lastPing: null,
        checkPong: null,
        lastPong: null,
        topics: new Set<string>(),
        onError: () => null,
        pingError: 0,
      },
    }
  }

  /**
   * Sign a request to the Kucoin API
   *
   * @param endpoint - API endpoint
   * @param params - Request parameters
   * @param method - HTTP method
   * @param type - Request type (public/private)
   * @param futures - Whether this is a futures request
   * @returns Headers with authentication information
   * @private
   */
  private sign(
    endpoint: string,
    params: AnyObject,
    method: Methods,
    type: RequestType,
    futures: boolean,
  ) {
    const headers: { [x: string]: string } = {
      'Content-Type': 'application/json',
    }
    if (type === 'private') {
      const nonce = Date.now() + ''
      let strForSign = ''
      if (method === 'GET' || method === 'DELETE') {
        strForSign = nonce + method + endpoint + this.formatQuery(params)
      } else {
        strForSign = nonce + method + endpoint + JSON.stringify(params)
      }
      const signatureResult = crypto
        .createHmac('sha256', this.secret)
        .update(strForSign)
        .digest('base64')
      const passphraseResult = crypto
        .createHmac('sha256', this.secret)
        .update(this.passphrase)
        .digest('base64')
      headers['KC-API-SIGN'] = signatureResult
      headers['KC-API-TIMESTAMP'] = nonce
      headers['KC-API-KEY'] = this.key
      headers['KC-API-PASSPHRASE'] = passphraseResult
      headers['KC-API-KEY-VERSION'] = '2'
      if (this.broker?.futures?.secret || this.broker?.spot?.secret) {
        headers['KC-API-PARTNER'] = futures
          ? this.broker.futures.id
          : this.broker.spot.id
        headers['KC-API-PARTNER-SIGN'] = crypto
          .createHmac(
            'sha256',
            futures ? this.broker.futures.secret : this.broker.spot.secret,
          )
          .update(`${nonce}${headers['KC-API-PARTNER']}${this.key}`)
          .digest('base64')
      }
    }
    return headers
  }

  /**
   * Format query parameters for URL
   *
   * @param queryObj - Query parameters object
   * @returns Formatted query string
   * @private
   */
  private formatQuery(queryObj: AnyObject) {
    if (JSON.stringify(queryObj).length !== 2) {
      return '?' + queryString.stringify(queryObj)
    } else {
      return ''
    }
  }

  /**
   * Handle API response
   *
   * @param result - Fetch result
   * @returns Processed result with status
   * @private
   */
  private async handleResult<T>(
    result: UnPromise<ReturnType<typeof fetch>>,
  ): Promise<Result<T>> {
    const text = await result.text()
    if (result.ok) {
      const res = JSON.parse(text) as {
        code: string
        data: T | null
        msg?: string
      }
      if (res.code === SUCCESS_CODE) {
        if (res.data) {
          return {
            status: OK,
            data: res.data,
            reason: null,
            reasonCode: res.code,
          }
        }
        return {
          status: NOTOK,
          data: null,
          reason: 'No data found',
          reasonCode: '2',
        }
      }
      return {
        status: NOTOK,
        data: null,
        reason: res.msg || '',
        reasonCode: res.code,
      }
    }
    const error: { msg?: string; code?: string } = {}
    try {
      const json = JSON.parse(text)
      error.msg = json.msg
      error.code = json.code
    } catch (e) {
      error.msg = result.statusText
      error.code = `${result.status}`
    }
    return {
      status: NOTOK,
      data: null,
      reason: error.msg || '',
      reasonCode: error.code || '',
    }
  }

  /**
   * Send a request to the Kucoin API
   *
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param params - Request parameters
   * @param type - Request type (public/private)
   * @param futures - Whether this is a futures request
   * @param count - Retry count
   * @returns API response
   * @private
   */
  private async sendRequest<T>(
    endpoint: string,
    method: Methods,
    params: AnyObject,
    type: RequestType,
    futures = false,
    count = 1,
  ): Promise<Result<T>> {
    if (
      type === 'private' &&
      (this.key === '' || this.secret === '' || this.passphrase === '')
    ) {
      return {
        status: NOTOK,
        data: null,
        reason: 'API keys and passphrase must be set',
        reasonCode: '1',
      }
    }
    const url = `${futures ? this.futuresUrl : this.url}${endpoint}${
      method === 'POST' ? '' : this.formatQuery(params)
    }`
    const config = {
      method,
      body: method === 'POST' ? JSON.stringify(params) : undefined,
      headers: this.sign(endpoint, params, method, type, !!futures),
    }
    try {
      const result = await fetch(url, config)
      return await this.handleResult(result)
    } catch (e) {
      if (
        `${(e as any)?.message}`
          .toLowerCase()
          .indexOf('fetch failed'.toLowerCase()) !== -1 &&
        count < 5
      ) {
        await sleep(200)
        return await this.sendRequest<T>(
          endpoint,
          method,
          params,
          type,
          futures,
          count + 1,
        )
      }
      return {
        status: NOTOK,
        data: null,
        reason: `${(e as any).message}: ${(e as any).cause.message}`,
        reasonCode: (e as any).cause.errno,
      }
    }
  }

  /*
   * Get Account Detail - Futures
   * GET /api/v1/account-overview
   */
  /**
   * Get futures account details
   *
   * @param params - Query parameters
   * @returns Futures account details
   */
  public async getFuturesAccounts(params: GetAccountsInput = {}) {
    return await this.sendRequest<FuturesAccountDetails>(
      `/api/v1/account-overview`,
      'GET',
      params,
      'private',
      true,
    )
  }

  /*
   * Switch Margin Mode - Futures
   * GET /api/v2/position/changeMarginMode
   */
  /**
   * Modify the margin mode of the current symbol.
   *
   * @param params - Query parameters
   * @returns Margin mode
   */
  public async changeMarginMode(params: SwtichMarginModeInput) {
    return await this.sendRequest<SwtichMarginModeInput>(
      `/api/v2/position/changeMarginMode`,
      'POST',
      params,
      'private',
      true,
    )
  }

  /*
   * List Accounts
   * GET /api/v1/accounts
   */
  /**
   * Get list of user accounts
   *
   * @param params - Query parameters
   * @returns List of account balances
   */
  public async getAccounts(params: GetAccountsInput = {}) {
    return await this.sendRequest<AccountBalance[]>(
      '/api/v1/accounts',
      'GET',
      params,
      'private',
    )
  }

  /*
   * Place a new order
   * POST /api/v1/orders
   * Details for market order vs. limit order and params see https://docs.kucoin.com/#place-a-new-order
   */
  /**
   * Place a new spot order
   *
   * @param params - Order parameters
   * @returns Order placement result
   */
  public async placeOrder(params: CommonOrderConfig) {
    return await this.sendRequest<OrderResponse>(
      '/api/v1/orders',
      'POST',
      params,
      'private',
    )
  }

  /*
   * Place a new order
   * POST /api/v1/orders
   * Details for market order vs. limit order and params see https://docs.kucoin.com/#place-a-new-order
   */
  /**
   * Place a new futures order
   *
   * @param params - Order parameters including leverage and margin mode
   * @returns Order placement result
   */
  public async placeFuturesOrder(
    params: CommonOrderConfig & {
      leverage: number
      marginMode: 'ISOLATED' | 'CROSS'
    },
  ) {
    return await this.sendRequest<OrderResponse>(
      '/api/v1/orders',
      'POST',
      params,
      'private',
      true,
    )
  }

  /*
   * Cancel an order
   * DELETE /api/v1/orders/<order-id>
   */
  /**
   * Cancel an existing spot order
   *
   * @param params - Order parameters
   * @returns Cancellation result
   */
  public async cancelOrder(params: { id: string }) {
    return await this.sendRequest<CanceledOrderResponse>(
      `/api/v1/orders/${params.id}`,
      'DELETE',
      {},
      'private',
    )
  }

  /*
   * Get api key
   * GET /api/v1/user/api-key
   */
  /**
   * Get user API key information
   *
   * @returns API key information
   */
  public async getApiKey() {
    return await this.sendRequest<APIKeyResponse>(
      `/api/v1/user/api-key`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get Affiliate User Rebate Information
   * GET /api/v2/affiliate/inviter/statisticsv
   */
  /**
   * Get information about affiliate user rebates
   *
   * @param params - Date parameters
   * @returns Affiliate rebate information
   */
  public async getAffiliateUserRebateInformation(params: {
    date: string
    offset?: number
  }) {
    return await this.sendRequest<AffiliateUserRebateInformation[]>(
      `/api/v2/affiliate/inviter/statistics`,
      'GET',
      params,
      'private',
    )
  }

  /*
   * Get Symbols List
   * GET /api/v2/symbols
   */
  /**
   * Get list of available trading symbols
   *
   * @returns List of symbols
   */
  public async getSymbols() {
    return await this.sendRequest<KucoinSymbol[]>(
      '/api/v2/symbols',
      'GET',
      {},
      'public',
    )
  }

  /*
   * Get Futures Symbols List
   * GET /api/v1/contracts/active
   */
  /**
   * Get list of available futures contracts
   *
   * @returns List of futures symbols
   */
  public async getFuturesSymbols() {
    return await this.sendRequest<FuturesKucoinSymbols[]>(
      '/api/v1/contracts/active',
      'GET',
      {},
      'public',
      true,
    )
  }

  /*
   * List orders
   * GET /api/v1/orders
   */
  /**
   * Get list of spot orders
   *
   * @param params - Query parameters
   * @returns List of orders
   */
  public async getOrders(params: {
    status?: OrderActiveStatus
    symbol?: string
    side?: OrderSide
    tradeType: TradeType
  }) {
    return await this.sendRequest<ListOrders>(
      '/api/v1/orders',
      'GET',
      params,
      'private',
    )
  }

  /*
   * List orders
   * GET /api/v1/orders
   */
  /**
   * Get list of futures orders
   *
   * @param params - Query parameters
   * @returns List of futures orders
   */
  public async getFuturesOrders(params: {
    status?: OrderActiveStatus
    symbol?: string
    side?: OrderSide
  }) {
    return await this.sendRequest<ListOrders>(
      '/api/v1/orders',
      'GET',
      params,
      'private',
      true,
    )
  }

  /*
   * Get an order
   * GET /api/v1/orders/<order-id>
   */
  /**
   * Get details of a specific spot order by ID
   *
   * @param params - Order ID parameters
   * @returns Order details
   */
  public async getOrderById(params: { id: string }) {
    return await this.sendRequest<KucoinOrder>(
      `/api/v1/orders/${params.id}`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get an order
   * GET /api/v1/orders/<order-id>
   */
  /**
   * Get details of a specific futures order by ID
   *
   * @param params - Order ID parameters
   * @returns Futures order details
   */
  public async getFuturesOrderById(params: { id: string }) {
    return await this.sendRequest<KucoinOrder>(
      `/api/v1/orders/${params.id}`,
      'GET',
      {},
      'private',
      true,
    )
  }

  /*
   * Get an order by client ID
   * GET /api/v1/order/client-order/{clientOid}
   */
  /**
   * Get details of a spot order by client order ID
   *
   * @param params - Client order ID parameters
   * @returns Order details
   */
  public async getOrderByClientId(params: { id: string }) {
    return await this.sendRequest<KucoinOrder>(
      `/api/v1/order/client-order/${params.id}`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get an order by client ID
   * GET /api/v1/orders/byClientOid
   */
  /**
   * Get details of a futures order by client order ID
   *
   * @param params - Client order ID parameters
   * @returns Futures order details
   */
  public async getFuturesOrderByClientId(params: { clientOid: string }) {
    return await this.sendRequest<KucoinOrder>(
      `/api/v1/orders/byClientOid`,
      'GET',
      params,
      'private',
      true,
    )
  }

  /*
   * Cancel an order by client ID
   * DELETE /api/v1/orders/client-order/{clientOid}
   */
  /**
   * Cancel a futures order by client ID
   *
   * @param params - Client order ID and symbol parameters
   * @returns Cancellation result
   */
  public async cancelFuturesOrderByClientId(params: {
    id: string
    symbol: string
  }) {
    return await this.sendRequest<{
      clientOid: string
    }>(
      `/api/v1/orders/client-order/${params.id}`,
      'DELETE',
      { symbol: params.symbol },
      'private',
      true,
    )
  }

  /*
   * Cancel an order by order ID
   * DELETE /api/v1/orders/{orderId}
   */
  /**
   * Cancel a futures order by order ID
   *
   * @param params - Order ID parameters
   * @returns Cancellation result
   */
  public async cancelFuturesOrderByOrderId(params: { id: string }) {
    return await this.sendRequest<{
      cancelledOrderIds: string[]
    }>(`/api/v1/orders/${params.id}`, 'DELETE', {}, 'private', true)
  }

  /*
   * Cancel an order by client ID
   * DELETE /api/v1/order/client-order/{clientOid}
   */
  /**
   * Cancel a spot order by client ID
   *
   * @param params - Client order ID parameters
   * @returns Cancellation result
   */
  public async cancelOrderByClientId(params: { id: string }) {
    return await this.sendRequest<{
      cancelledOrderId: string
      clientOid: string
    }>(`/api/v1/order/client-order/${params.id}`, 'DELETE', {}, 'private')
  }

  /*
   * List Fills
   * GET /api/v1/fills
   */
  /**
   * Get list of order fills/executions
   *
   * @param params - Order ID parameters
   * @returns List of fills
   */
  public async listFills(params: { orderId: string }) {
    return await this.sendRequest<ListFills>(
      '/api/v1/fills',
      'GET',
      params || {},
      'private',
    )
  }

  /*
   * Get Ticker
   * GET /api/v1/market/orderbook/level1?symbol=<symbol>
   */
  /**
   * Get current ticker for a symbol
   *
   * @param symbol - Market symbol
   * @returns Ticker data
   */
  public async getTicker(symbol: string) {
    return await this.sendRequest<Ticker>(
      `/api/v1/market/orderbook/level1?symbol=${symbol}`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get Ticker
   * GET /api/v1/market/orderbook/level1?symbol=<symbol>
   */
  /**
   * Get current futures ticker for a symbol
   *
   * @param params - Symbol parameters
   * @returns Futures ticker data
   */
  public async getFuturesTicker(params: { symbol: string }) {
    return await this.sendRequest<Ticker>(
      `/api/v1/ticker`,
      'GET',
      params,
      'public',
      true,
    )
  }

  /*
   * Get Positions
   * GET /api/v1/positions
   */
  /**
   * Get all futures positions
   *
   * @returns List of positions
   */
  public async getFuturesPositions() {
    return await this.sendRequest<Position[]>(
      `/api/v1/positions`,
      'GET',
      {},
      'private',
      true,
    )
  }

  /*
   * Get Position by symbol
   * GET /api/v1/positions
   */
  /**
   * Get futures position for a specific symbol
   *
   * @param params - Symbol parameters
   * @returns Position details
   */
  public async getFuturesPositionBySymbol(params: { symbol: string }) {
    return await this.sendRequest<Position>(
      `/api/v1/position`,
      'GET',
      params,
      'private',
      true,
    )
  }

  /*
   * Get All Tickers
   * GET /api/v1/market/allTickers
   */
  /**
   * Get tickers for all symbols
   *
   * @returns All tickers data
   */
  public async getAllTickers() {
    return await this.sendRequest<AllTicker>(
      `/api/v1/market/allTickers`,
      'GET',
      {},
      'public',
    )
  }

  /*
   * Get Fee
   * GET /api/v1/trade-fees?symbols=[symbols]
   */
  /**
   * Get trading fees for specific symbols
   *
   * @param symbols - List of symbols
   * @returns Fee information
   */
  public async getFees(symbols: string[]) {
    return await this.sendRequest<Fee[]>(
      `/api/v1/trade-fees?symbols=${symbols.join(',')}`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get Base Fee
   * GET /api/v1/base-fee
   */
  /**
   * Get base fee information
   *
   * @returns Base fee data
   */
  public async getBaseFees() {
    return await this.sendRequest<BaseFee>(
      `/api/v1/base-fee`,
      'GET',
      {},
      'private',
    )
  }

  /*
   * Get Klines
   * GET /api/v1/market/candles
   */
  /**
   * Get candlestick data for spot markets
   *
   * @param params - Kline parameters
   * @returns Candlestick data
   */
  public async getKlines(params: {
    symbol: string
    startAt: number
    endAt: number
    type: string
  }) {
    return await this.sendRequest<Kline>(
      `/api/v1/market/candles`,
      'GET',
      params,
      'public',
    )
  }

  /*
   * Get Klines
   * GET /api/v1/kline/query
   */
  /**
   * Get candlestick data for futures markets
   *
   * @param params - Kline parameters
   * @returns Futures candlestick data
   */
  public async getFuturesKlines(params: {
    symbol: string
    startAt?: number
    endAt?: number
    granularity: number
  }) {
    return await this.sendRequest<Kline>(
      `/api/v1/kline/query`,
      'GET',
      params,
      'public',
      true,
    )
  }

  /**
   * Get WebSocket token and URL
   *
   * @param type - Request type (public/private)
   * @returns WebSocket connection details
   */
  public async getWsUrl(type: RequestType) {
    let url = '/api/v1/bullet-public'
    if (type === 'private') {
      url = '/api/v1/bullet-private'
    }
    const result = await this.sendRequest<WSTokenResponse>(
      url,
      'POST',
      {},
      type,
    )
    if (result.status === OK) {
      const { token, instanceServers } = result.data ?? {}
      const [server] = instanceServers ?? []
      if (server) {
        return {
          url: `${server.endpoint}?token=${token}&[connectId=${v4()}]`,
          server,
        }
      }
    } else {
      throw new Error(`${result.reason} | ${result.reasonCode}`)
    }
  }

  /**
   * Open a WebSocket connection
   *
   * @param url - WebSocket URL
   * @param type - Request type (public/private)
   * @returns WebSocket instance
   * @private
   */
  private openSocket(url: string, type: RequestType) {
    const rws = new ReconnectingWebSocket(url, [], {
      WebSocket: ws,
      connectionTimeout: 4e3,
      debug: false,
      maxReconnectionDelay: 10e3,
      maxRetries: 10,
      minReconnectionDelay: 4e3,
    })

    rws.addEventListener('open', () => {
      if (typeof window === 'undefined') {
        //@ts-ignore
        if (rws._ws.on) {
          //@ts-ignore
          rws._ws.on('ping', () => rws._ws.pong(() => null))
          //@ts-ignore
          rws._ws.on('pong', () => {
            this.sockets[type].lastPong = Date.now()
          })
        }
      }
    })
    return rws
  }

  /**
   * Connect to WebSocket
   *
   * @param type - Request type (public/private)
   * @param tokenToUse - Optional WebSocket token
   * @param onError - Error callback
   * @returns WebSocket instance
   * @private
   */
  private async connectWS(
    type: RequestType,
    tokenToUse?: WSTokenResponseToUse,
    onError?: (msg: string) => void,
  ) {
    const token = tokenToUse || (await this.getWsUrl(type))
    if (token) {
      const w = this.openSocket(token.url, type)
      w.onerror = (e) => {
        const msg = `Kucoin WS Error, reason: ${e.message}`
        this.handleLog(msg)
        throw new Error(msg)
      }
      w.onopen = async () => {
        this.handleLog(`Kucoin WS started, retry ${w.retryCount}`)
        this.sockets[type].lastPing = 0
        this.sockets[type].lastPong = 0
        if (this.sockets[type].timer) {
          //@ts-ignore
          clearInterval(this.sockets[type].timer as NodeJS.Timeout)
        }
        if (this.sockets[type].checkPong) {
          //@ts-ignore
          clearInterval(this.sockets[type].checkPong as NodeJS.Timeout)
        }
        if (this.sockets[type].cb.length > 0) {
          /*console.log(
            this.sockets[type].cb.length,
            ' subscribers exist',
            this.sockets[type].cb,
          )*/
          for (const s of this.sockets[type].cb) {
            this.handleSubscribe(type, s.topics, s.fn)
            await sleep(2500)
          }
        }
        if (typeof window === 'undefined') {
          this.sockets[type].timer = setInterval(() => {
            if (!this.sockets[type].ws?.OPEN) {
              if (this.sockets[type].timer) {
                //@ts-ignore
                clearInterval(this.sockets[type].timer)
              }
            }
            //@ts-ignore
            w._ws.ping()
            this.sockets[type].lastPing = Date.now()
            this.sockets[type].checkPong = setTimeout(async () => {
              if (!this.sockets[type].ws?.OPEN) {
                if (this.sockets[type].checkPong) {
                  clearInterval(this.sockets[type].checkPong as NodeJS.Timeout)
                }
              }
              const diff =
                this.sockets[type].lastPong && this.sockets[type].lastPing
                  ? (this.sockets[type].lastPong || 0) -
                    (this.sockets[type].lastPing || 0)
                  : token.server.pingTimeout * 1000
              if (diff > token.server.pingTimeout || diff < 0) {
                this.sockets[type].pingError += 1
                if (
                  this.sockets[type].pingError >= 5 &&
                  onError &&
                  this.onError
                ) {
                  onError(`Ping error ${this.sockets[type].pingError} times`)
                  const subscribers = this.sockets[type].cb
                  this.closeWs(type)
                  await this.getWs(type, undefined, undefined, onError)
                  for (const s of subscribers) {
                    this.handleSubscribe(type, s.topics, s.fn)
                  }
                }
                /* this.sockets[type].topics.clear()
                this.sockets[type].ws?.reconnect() */
              }
            }, token.server.pingTimeout)
          }, token.server.pingInterval)
        }
      }
      w.onclose = (e) => {
        const msg = `Kucoin WS closed, code: ${e.code}, reason: ${e.reason}, retry: ${w.retryCount}`
        this.handleLog(msg)
        const fn = this.sockets[type].onError
        if (fn && this._onError) {
          fn(msg)
        }
        this.sockets[type].topics.clear()
      }

      return w
    }
  }

  /**
   * Convert WebSocket ticker message to FullTicker
   *
   * @param msg - WebSocket ticker message
   * @returns Converted ticker data
   * @private
   */
  private convertWsTicker(msg: WSTickerMessage): FullTicker {
    return {
      eventType: '24hrMiniTicker',
      eventTime: msg.data.time,
      curDayClose: msg.data.price,
      open: msg.data.price,
      high: msg.data.price,
      low: msg.data.price,
      volume: msg.data.size,
      volumeQuote: msg.data.size,
      symbol:
        msg.subject === WSSubjectEnum.trade
          ? msg.topic.split(':')[1]
          : msg.subject,
      priceChange: '',
      priceChangePercent: '',
      weightedAvg: '',
      prevDayClose: '',
      closeTradeQuantity: '',
      bestBid: msg.data.bestBid,
      bestAsk: msg.data.bestAsk,
      bestAskQnt: msg.data.bestAskSize,
      bestBidQnt: msg.data.bestBidSize,
      openTime: msg.data.time,
      closeTime: msg.data.time,
      firstTradeId: 0,
      lastTradeId: 0,
      totalTrades: 0,
    }
  }

  /**
   * Convert futures WebSocket ticker message to FullTicker
   *
   * @param msg - Futures WebSocket ticker message
   * @returns Converted futures ticker data
   * @private
   */
  private convertWsFuturesTicker(msg: WSFuturesTickerMessage): FullTicker {
    const time = Math.floor(msg.data.ts / 1000 / 1000)
    return {
      eventType: '24hrMiniTicker',
      eventTime: time,
      curDayClose: msg.data.price,
      open: msg.data.price,
      high: msg.data.price,
      low: msg.data.price,
      volume: `${msg.data.size}`,
      volumeQuote: `${msg.data.size}`,
      symbol: msg.topic.split(':')[1],

      priceChange: '',
      priceChangePercent: '',
      weightedAvg: '',
      prevDayClose: '',
      closeTradeQuantity: '',
      bestBid: msg.data.bestBidPrice,
      bestAsk: msg.data.bestAskPrice,
      bestAskQnt: `${msg.data.bestAskSize}`,
      bestBidQnt: `${msg.data.bestBidSize}`,
      openTime: time,
      closeTime: time,
      firstTradeId: 0,
      lastTradeId: 0,
      totalTrades: 0,
    }
  }

  /**
   * Handle WebSocket messages
   *
   * @param msg - WebSocket message
   * @private
   */
  private handleWsMessage(msg: WSMessage) {
    if (msg.type === WSTypesEnum.welcome) {
      this.handleLog(`Welcome WS Kucoin ${msg.id}`)
    } else if (msg.type === WSTypesEnum.ack) {
      this.handleLog(`Ack WS Kucoin ${msg.id}`)
    } else if (msg.type !== WSTypesEnum.message) {
      let m = ''
      let error = ''
      try {
        m = JSON.stringify(msg)
      } catch (e) {
        m = `${msg}`
        error = `${e}`
      }
      this.handleLog(`Unknown WS Kucoin ${m}${error ? ` | e: ${error}` : ''}`)
    }
  }

  /**
   * Get WebSocket instance
   *
   * @param type - Request type (public/private)
   * @param retry - Retry callback
   * @param token - WebSocket token
   * @param onError - Error callback
   * @returns WebSocket instance
   * @private
   */
  private async getWs(
    type: RequestType,
    retry?: (...args: any[]) => any,
    token?: WSTokenResponseToUse,
    onError?: (msg: string) => void,
  ) {
    if (this.sockets[type].ws) {
      return this.sockets[type].ws
    }
    if (!this.sockets[type].pending) {
      this.sockets[type].pending = true
      try {
        const ws = await this.connectWS(type, token, onError)
        if (ws) {
          ws.onmessage = (msg) => {
            for (const cb of this.sockets[type].cb) {
              const json = JSON.parse(msg.data) as WSMessage
              //@ts-ignore
              /* if (json.topic !== '/market/ticker:all') {
                console.log(json)
              } */
              cb.fn(json)
            }
          }
          this.sockets[type] = {
            ...this.sockets[type],
            ws,
            pingInterval: 0,
            pingTimeout: 0,
            cb: [
              {
                fn: this.handleWsMessage,
                topics: [HANDLE_MESSAGE],
                signature: HANDLE_MESSAGE,
              },
            ],
            pending: false,
            onError,
          }
          for (const call of this.sockets[type].callOnConnect) {
            await call()
            this.sockets[type].callOnConnect = this.sockets[
              type
            ].callOnConnect.filter((c) => c !== call)
          }

          return ws
        }
        this.sockets[type].pending = false
      } catch {
        this.sockets[type].pending = false
      }
    } else {
      if (retry) {
        this.sockets[type].callOnConnect.push(retry)
      }
    }
  }

  /**
   * Close WebSocket connection
   *
   * @param type - Request type (public/private)
   * @private
   */
  private closeWs(type: RequestType) {
    this.sockets[type].ws?.close(1000, 'Close by demand')
    if (this.sockets[type].timer) {
      clearInterval(this.sockets[type].timer as NodeJS.Timeout)
    }
    if (this.sockets[type].checkPong) {
      clearInterval(this.sockets[type].checkPong as NodeJS.Timeout)
    }
    this.sockets[type].topics.clear()
    this.sockets[type] = this.defaultWs()[type]
  }

  /**
   * Handle unsubscribing from WebSocket topics
   *
   * @param type - Request type (public/private)
   * @param _topics - Topics to unsubscribe from
   * @private
   */
  @IdMute(mutex, () => 'unsubscribe')
  private async handleUnsubscribe(
    type: RequestType,
    _topics: string | string[],
  ) {
    const topics = Array.isArray(_topics) ? _topics : [_topics]
    const signature = topics.join(',')
    this.sockets[type].cb = this.sockets[type].cb.filter(
      (c) => c.signature !== signature,
    )
    for (const topic of topics) {
      if (this.sockets[type].ws) {
        const id = +new Date() * Math.random()
        this.sockets[type].ws?.send(
          JSON.stringify({
            id: `${type}@${topic}@${id}`,
            type: 'unsubscribe',
            topic,
            response: true,
          }),
        )
        this.sockets[type].topics.delete(topic)
      }
    }
    if (
      ((this.sockets[type].cb.length === 1 &&
        this.sockets[type].cb[0]?.topics?.[0] === HANDLE_MESSAGE) ||
        this.sockets[type].cb.length === 0) &&
      this.sockets[type].ws
    ) {
      this.closeWs(type)
    }
  }

  /**
   * Subscribe to WebSocket topics
   *
   * @param type - Request type (public/private)
   * @param topics - Topics to subscribe to
   * @private
   */
  @IdMute(
    mutex,
    (_type: unknown, topics: string[]) => `subscribeTopics${topics.join(',')}`,
  )
  private async subscribeTopics(type: RequestType, topics: string[]) {
    for (const topic of topics) {
      const id = +new Date() * Math.random()
      this.sockets[type].ws?.send(
        JSON.stringify({
          id: `${type}@${topic}@${id}`,
          type: 'subscribe',
          topic,
          privateChannel: type === 'private',
          response: true,
        }),
      )
      await sleep(200)
    }
  }

  /**
   * Handle subscribing to WebSocket topics
   *
   * @param type - Request type (public/private)
   * @param _topics - Topics to subscribe to
   * @param cbToSet - Callback function
   * @param count - Retry count
   * @private
   */
  @IdMute(mutex, () => 'subscribe')
  private async handleSubscribe(
    type: RequestType,
    _topics: string | string[],
    cbToSet: (msg: WSMessage) => any,
    count = 0,
  ) {
    if (`${_topics}` === HANDLE_MESSAGE) {
      return
    }
    let topics = Array.isArray(_topics) ? _topics : [_topics]
    if (this.sockets[type]) {
      const open =
        this.sockets[type].ws?.readyState === this.sockets[type].ws?.OPEN

      if (this.sockets[type].ws && open) {
        /* if (this.sockets[type].topics.size === 300) {
          this.handleLog('Cannot connect more than 300')
          return
        } */
        topics = topics.filter((topic) => !this.sockets[type].topics.has(topic))
        /* if (this.sockets[type].topics.has(topic)) {
          this.handleLog(`Connection already exist ${topic}`)
          return
        } */
        if (!topics.length) {
          return
        }
        topics.forEach((t) => this.sockets[type].topics.add(t))
        const signature = topics.join(',')
        if (!this.sockets[type].cb.find((c) => c.signature === signature)) {
          this.sockets[type].cb.push({ fn: cbToSet, topics, signature })
        }
        this.subscribeTopics(type, topics)
      } else if (
        (!this.sockets[type].ws && this.sockets[type].pending) ||
        (this.sockets[type].ws && !open)
      ) {
        this.sockets[type].callOnConnect.push(() =>
          this.handleSubscribe(type, _topics, cbToSet),
        )
        if (count < 5) {
          setTimeout(
            () => this.handleSubscribe(type, _topics, cbToSet, count + 1),
            2000,
          )
        }
      }
    }
  }

  /**
   * Convert order update to execution report
   *
   * @param msg - Order update message
   * @returns Execution report
   * @private
   */
  private convertOrderUpdate(msg: WSUpdateOrder): ExecutionReport | undefined {
    let find = this.orderFills.find((o) => o.orderId === msg.orderId)
    if (!find) {
      find = { orderId: msg.orderId, fills: [] }
    }
    if (find && msg.tradeId) {
      if (!find.fills.find((t) => t.tradeId === msg.tradeId)) {
        find.fills.push({
          price: msg.matchPrice || '0',
          qty: msg.matchSize || '0',
          tradeId: msg.tradeId,
        })
      }
    }
    const totalTradeQuantity =
      msg.filledSize && +msg.price && msg.orderType === 'limit'
        ? +msg.filledSize
        : find.fills.reduce((acc, v) => acc + parseFloat(v.qty), 0) ||
          (msg.filledSize ? +msg.filledSize : 0)
    const totalQuoteTradeQuantity =
      msg.filledSize && +msg.price && msg.orderType === 'limit'
        ? +msg.filledSize * +msg.price
        : find.fills.reduce(
            (acc, v) => acc + parseFloat(v.price) * parseFloat(v.qty),
            0,
          ) || (msg.filledSize ? +msg.filledSize * +msg.price : 0)
    const convertTime = (ts: number) => Math.round(ts / 1000000)
    if (msg.status === 'done') {
      this.orderFills = this.orderFills.filter((f) => f.orderId !== msg.orderId)
    } else {
      this.orderFills = [
        ...this.orderFills.filter((f) => f.orderId !== msg.orderId),
        find,
      ]
    }
    const openStatuses = ['open', 'new']
    const openTypes = ['open', 'received']
    let price =
      msg.price ||
      `${
        totalTradeQuantity !== 0
          ? totalQuoteTradeQuantity / totalTradeQuantity
          : 0
      }`
    if (isNaN(+price)) {
      price = '0'
    }
    return {
      clientOrderId: msg.clientOid,
      creationTime: msg.orderTime,
      eventTime: convertTime(msg.ts),
      eventType: 'executionReport',
      newClientOrderId: msg.clientOid,
      orderId: msg.orderId,
      orderTime: convertTime(msg.ts),
      orderStatus:
        (msg.type === 'canceled' &&
          msg.status === 'done' &&
          `${msg.filledSize}` !== '0') ||
        (msg.type === 'filled' && msg.status === 'done') ||
        (msg.type === 'match' && msg.status === 'done') ||
        (msg.type === 'match' &&
          msg.status === 'match' &&
          `${msg.remainSize}` === '0')
          ? 'FILLED'
          : (msg.type === 'match' && msg.status === 'match') ||
              (msg.type === 'match' && msg.status === 'open') ||
              (openTypes.includes(msg.type) &&
                openStatuses.includes(msg.status) &&
                msg.filledSize &&
                `${msg.filledSize}` !== '0')
            ? 'PARTIALLY_FILLED'
            : openTypes.includes(msg.type) && openStatuses.includes(msg.status)
              ? 'NEW'
              : 'CANCELED',
      orderType: msg.orderType === 'limit' ? 'LIMIT' : 'MARKET',
      originalClientOrderId: msg.clientOid,
      price,
      quantity: msg.size || msg.filledSize || '0',
      side: msg.side === 'buy' ? 'BUY' : 'SELL',
      symbol: msg.symbol,
      totalQuoteTradeQuantity: `${totalQuoteTradeQuantity}`,
      totalTradeQuantity: `${totalTradeQuantity}`,
      uniqueMessageId: Object.entries(msg)
        .map(([k, v]) => `${k}:${v}`)
        .join(','),
    }
  }

  /**
   * Convert balance update to account position
   *
   * @param msg - Balance update message
   * @returns Account position
   * @private
   */
  private convertBalanceUpdate(msg: WSBalance): OutboundAccountPosition {
    return {
      eventTime: parseFloat(msg.time),
      eventType: 'outboundAccountPosition',
      lastAccountUpdate: 0,
      balances: [
        { asset: msg.currency, free: msg.available, locked: msg.hold },
      ],
    }
  }

  /**
   * Convert futures balance update to account position
   *
   * @param msg - Futures balance update message
   * @returns Account position
   * @private
   */
  private convertFuturesBalanceUpdate(
    msg: WSFuturesBalanceMessage,
  ): OutboundAccountPosition {
    return {
      eventTime: msg.data.timestamp,
      eventType: 'outboundAccountPosition',
      lastAccountUpdate: 0,
      balances: [
        {
          asset: msg.data.currency,
          free: `${msg.data.availableBalance}`,
          locked: `${msg.data.holdBalance}`,
        },
      ],
    }
  }

  /**
   * WebSocket API access methods
   *
   * @param token - Optional WebSocket token
   * @returns WebSocket methods
   */
  public ws(token?: WSTokenResponseToUse) {
    return {
      /**
       * Subscribe to ticker updates for specific symbols
       *
       * @param symbols - Symbols to subscribe to
       * @param callback - Ticker callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      ticker: async (
        symbols: string[],
        callback: (msg: FullTicker) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        if (symbols.length > 0) {
          const thisCb = (msg: WSMessage) => {
            if (
              msg.type === WSTypesEnum.message &&
              msg.subject === WSSubjectEnum.trade
            ) {
              callback(this.convertWsTicker(msg as WSTickerMessage))
            }
          }
          const topic = `/market/ticker:${symbols.join(',')}`
          await this.getWs('public', undefined, token, onError)
          this.handleSubscribe('public', topic, thisCb)
          return () => this.handleUnsubscribe('public', topic)
        }
      },

      /**
       * Subscribe to all ticker updates
       *
       * @param callback - Ticker callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      tickerAll: async (
        callback: (msg: FullTicker) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.tickerAll
          ) {
            callback(this.convertWsTicker(msg as WSTickerMessage))
          }
        }
        const topic = `/market/ticker:all`
        await this.getWs('public', undefined, token, onError)
        this.handleSubscribe('public', topic, thisCb)
        return () => this.handleUnsubscribe('public', topic)
      },

      /**
       * Subscribe to futures ticker updates
       *
       * @param symbols - Symbols to subscribe to
       * @param callback - Ticker callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      futuresTicker: async (
        symbols: string[],
        callback: (msg: FullTicker) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            (msg as WSFuturesTickerMessage).subject === WSSubjectEnum.ticker &&
            (msg as WSFuturesTickerMessage).topic.startsWith(
              WSMessageTopicEnum.futuresTicker,
            )
          ) {
            callback(this.convertWsFuturesTicker(msg as WSFuturesTickerMessage))
          }
        }
        const topics = symbols.map(
          (symbol) => `/contractMarket/ticker:${symbol}`,
        )
        await this.getWs('public', undefined, token, onError)
        this.handleSubscribe('public', topics, thisCb)
        return () => this.handleUnsubscribe('public', topics)
      },

      /**
       * Subscribe to futures position updates
       *
       * @param symbols - Symbols to subscribe to
       * @param callback - Position callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      futuresPositions: async (
        symbols: string[],
        callback: (msg: FuturesPosition) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            (msg as WSFuturesPositionMessage).subject ===
              WSSubjectEnum.position &&
            (msg as WSFuturesPositionMessage).topic.startsWith(
              WSMessageTopicEnum.futuresPosition,
            ) &&
            (msg as WSFuturesPositionMessage).data.changeReason ===
              'liquidation'
          ) {
            callback((msg as WSFuturesPositionMessage).data)
          }
        }
        const topics = symbols.map((symbol) => `/contract/position:${symbol}`)
        await this.getWs('private', undefined, token, onError)
        this.handleSubscribe('private', topics, thisCb)
        return () => this.handleUnsubscribe('private', topics)
      },

      /**
       * Subscribe to order updates
       *
       * @param callback - Order callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      order: async (
        callback: (msg: ExecutionReport) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.orderChange &&
            msg.subject === WSSubjectEnum.orderChange
          ) {
            const o = this.convertOrderUpdate(
              (msg as WSOrderChangeMessage).data,
            )
            if (o) {
              callback(o)
            }
          }
        }
        const topic = `/spotMarket/tradeOrdersV2`
        await this.getWs('private', undefined, token, onError)

        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },

      /**
       * Subscribe to futures order updates
       *
       * @param callback - Order callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      futuresOrder: async (
        callback: (msg: ExecutionReport) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            (msg as WSFuturesOrderMessage).topic ===
              WSMessageTopicEnum.futuresOrder &&
            (msg as WSFuturesOrderMessage).subject === WSSubjectEnum.orderChange
          ) {
            const o = this.convertOrderUpdate(
              (msg as WSFuturesOrderMessage).data,
            )
            if (o) {
              callback(o)
            }
          }
        }
        const topic = `/contractMarket/tradeOrders`
        await this.getWs('private', undefined, token, onError)

        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },

      /**
       * Subscribe to balance updates
       *
       * @param callback - Balance callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      balance: async (
        callback: (msg: OutboundAccountPosition) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.balance &&
            msg.subject === WSSubjectEnum.balance &&
            (msg as WSBalanceMessage).data.relationEvent.indexOf('trade') !== -1
          ) {
            callback(this.convertBalanceUpdate((msg as WSBalanceMessage).data))
          }
        }
        const topic = `/account/balance`
        await this.getWs('private', undefined, token, onError)
        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },

      /**
       * Subscribe to futures balance updates
       *
       * @param callback - Balance callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      futuresBalance: async (
        callback: (msg: OutboundAccountPosition) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            (msg as WSFuturesBalanceMessage).topic ===
              WSMessageTopicEnum.futuresBalance &&
            (msg as WSFuturesBalanceMessage).subject ===
              WSSubjectEnum.futuresBalance
          ) {
            callback(
              this.convertFuturesBalanceUpdate(msg as WSFuturesBalanceMessage),
            )
          }
        }
        const topic = `/contractAccount/wallet`
        await this.getWs('private', undefined, token, onError)
        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },

      /**
       * Subscribe to kline/candlestick updates
       *
       * @param params - Kline parameters
       * @param callback - Kline callback
       * @param onError - Error callback
       * @returns Unsubscribe function
       */
      klines: async (
        params: { symbol: string; type: string },
        callback: (msg: WSKlinesUpdate) => void | Promise<void>,
        onError?: (msg: string) => void,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.subject === WSSubjectEnum.klines
          ) {
            if (this.lastData.get(msg.topic) === (msg as WSKlines).data.time) {
              return
            }
            this.lastData.set(msg.topic, (msg as WSKlines).data.time)
            callback({
              ...(msg as WSKlines).data,
              interval: msg.topic.split('_')[1],
            })
          }
        }
        const topic = `/market/candles:${params.symbol}_${params.type}`
        await this.getWs('public', undefined, token, onError)
        this.handleSubscribe('public', topic, thisCb)
        return () => this.handleUnsubscribe('public', topic)
      },

      /**
       * Get direct access to WebSocket instance
       *
       * @returns WebSocket objects
       */
      ws: () => {
        return {
          public: this.sockets['public'],
        }
      },
    }
  }
}

export default KucoinApi
