import crypto from 'crypto'
import queryString from 'query-string'
import fetch from 'isomorphic-unfetch'
import ws from 'isomorphic-ws'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { v4 } from 'uuid'

export type UnPromise<T> = T extends Promise<infer U> ? U : T

export type AnyObject = { [x: string]: string | number | boolean }

export type AccountType = 'main' | 'trade' | 'margin'

export type GetAccountsInput = {
  currency?: string
  type?: AccountType
}

export type RequestType = 'public' | 'private'

export type Methods = 'GET' | 'POST' | 'DELETE'

export type AccountBalance = {
  id: string
  currency: string
  type: AccountType
  balance: string
  available: string
  holds: string
}
export type Response<T> = {
  code: string
  data: T | null
}
export type Result<T> =
  | {
      status: typeof OK
      data: T
      reason: null
      reasonCode: string
    }
  | {
      status: typeof NOTOK
      data: null
      reason: string
      reasonCode: string
    }
export type OrderSide = 'buy' | 'sell'
export type LIMIT = 'limit'
export type MARKET = 'market'
export type OrderType = LIMIT | MARKET
export type STP = 'CN' | 'CO' | 'CB' | 'DC'
export type TradeType = 'TRADE' | 'MARGIN_TRADE'
export type TimeInForce = 'GTC' | 'GTT' | 'IOC' | 'FOK'

export type LimitOrderConfig = {
  type: LIMIT
  /** price per base currency */
  price: string
  /** amount of base currency to buy or sell */
  size: string
  /** GTC, GTT, IOC, or FOK (default is GTC), read Time In Force. */
  timeInForce?: TimeInForce
  /** cancel after n seconds, requires timeInForce to be GTT */
  cancelAfter?: number
  /** Post only flag, invalid when timeInForce is IOC or FOK */
  postOnly?: boolean
  /** Order will not be displayed in the order book */
  hidden?: boolean
  /** Only aportion of the order is displayed in the order book */
  iceberg?: boolean
  /** The maximum visible size of an iceberg order */
  visibleSize?: string
}
export type MarketOrderConfig =
  | {
      type: MARKET
      /** Desired amount in base currency */
      size: string
    }
  | {
      type: MARKET
      /** The desired amount of quote currency to use */
      funds: string
    }

export type CommonOrderConfig = {
  /** Unique order id created by users to identify their orders, e.g. UUID. */
  clientOid: string
  /** buy or sell */
  side: OrderSide
  /** a valid trading symbol code. e.g. ETH-BTC */
  symbol: string
  /** limit or market (default is limit) */
  type?: OrderType
  /** remark for the order, length cannot exceed 100 utf8 characters */
  remark?: string
  /** self trade prevention, CN, CO, CB or DC */
  stp?: STP
  /** The type of trading : TRADE（Spot Trade）, MARGIN_TRADE (Margin Trade). Default is TRADE */
  tradeType?: TradeType
  /** Tags */
  tags?: string
} & (MarketOrderConfig | LimitOrderConfig)

export type OrderResponse = {
  orderId: string
}

export type CanceledOrderResponse = {
  cancelledOrderIds: string[]
}

export type MarketSymbol = {
  symbol: string
  name: string
  baseCurrency: string
  quoteCurrency: string
  market: string
  baseMinSize: string
  quoteMinSize: string
  baseMaxSize: string
  quoteMaxSize: string
  baseIncrement: string
  quoteIncrement: string
  priceIncrement: string
  feeCurrency: string
  enableTrading: boolean
  isMarginEnabled: boolean
  priceLimitRate: string
  minFunds: string
}

export type OrderActiveStatus = 'active' | 'done'

export type StopType = 'entry' | 'loss'

export type KucoinOrder = {
  id: string
  symbol: string
  opType: 'DEAL'
  type: OrderType
  side: OrderSide
  price: string
  size: string
  funds: string
  dealFunds: string
  dealSize: string
  fee: string
  feeCurrency: string
  stp: STP
  stop: StopType
  stopTriggered: boolean
  stopPrice: string
  timeInForce: TimeInForce
  postOnly: boolean
  hidden: boolean
  iceberg: boolean
  visibleSize: string
  cancelAfter: number
  channel: string
  clientOid: string
  remark: string
  tags: string
  isActive: boolean
  cancelExist: boolean
  createdAt: number
  tradeType: TradeType
}
export type Paginated<T> = {
  currentPage: number
  pageSize: number
  totalNum: number
  totalPage: number
  items: T
}
export type ListOrders = Paginated<KucoinOrder[]>

export type Liquidity = 'taker' | 'maker'

export type Fill = {
  symbol: string
  tradeId: string
  orderId: string
  counterOrderId: string
  side: OrderSide
  price: string
  size: string
  funds: string
  type: OrderType
  fee: string
  feeCurrency: string
  stop: StopType
  liquidity: Liquidity
  forceTaker: boolean
  createdAt: number
  tradeType: TradeType
}
export type ListFills = Paginated<Fill[]>

export type Ticker = {
  sequence: string
  bestAsk: string
  size: string
  price: string
  bestBidSize: string
  bestBid: string
  bestAskSize: string
  time: number
}

export type AllTicker = {
  time: number
  ticker: ExtendedTicker[]
}

export type ExtendedTicker = {
  symbol: string // symbol
  symbolName: string // Name of trading pairs, it would change after renaming
  buy: string // bestAsk
  sell: string // bestBid
  changeRate: string // 24h change rate
  changePrice: string // 24h change price
  high: string // 24h highest price
  low: string // 24h lowest price
  vol: string // 24h volume，the aggregated trading volume in BTC
  volValue: string // 24h total, the trading volume in quote currency of last 24 hours
  last: string // last price
  averagePrice: string // 24h average transaction price yesterday
  takerFeeRate: string // Basic Taker Fee
  makerFeeRate: string // Basic Maker Fee
  takerCoefficient: string // Taker Fee Coefficient
  makerCoefficient: string // Maker Fee Coefficient
}

export type WSTokenResponse = {
  token: string
  instanceServers: {
    endpoint: string
    exncrypt: boolean
    protocol: string
    pingInterval: number
    pingTimeout: number
  }[]
}

export type WSTypes = 'message' | 'ack' | 'welcome'

export enum WSSubjectEnum {
  trade = 'trade.ticker',
  orderChange = 'orderChange',
  balance = 'account.balance',
}

export enum WSTypesEnum {
  message = 'message',
  ack = 'ack',
  welcome = 'welcome',
}

export enum WSMessageTopicEnum {
  tickerAll = '/market/ticker:all',
  orderChange = '/spotMarket/tradeOrders',
  balance = '/account/balance',
}

export type WSTickerMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.tickerAll
  subject: WSSubjectEnum.trade
  data: WSTicker
}

export type WSBalance = {
  total: string // total balance
  available: string // available balance
  availableChange: string // the change of available balance
  currency: string // currency
  hold: string // hold amount
  holdChange: string // the change of hold balance
  relationEvent: string //relation event
  relationEventId: string // relation event id
  relationContext: {
    symbol: string
    tradeId: string // the trade Id when order is executed
    orderId: string
  }
  time: string
}

export type WSBalanceMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.balance
  subject: WSSubjectEnum.balance
  data: WSBalance
}

export type WSWelcomeMessage = {
  type: WSTypesEnum.welcome
  id: string
}

export type WSAckMessage = {
  type: WSTypesEnum.ack
  id: string
}

export type WSUpdateOrder = {
  symbol: string
  orderType: OrderType
  side: OrderSide
  orderId: string
  type: 'open' | 'match' | 'filled' | 'canceled' | 'update'
  /** time in nanoseconds */
  orderTime: number
  size: string
  oldSize?: string
  filledSize: string
  price: string
  clientOid: string
  remainSize: string
  status: 'open' | 'match' | 'done'
  /** time in nanoseconds */
  ts: number
  liquidity: Liquidity
  matchPrice?: string
  matchSize?: string
}

export type WSOrderChangeMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.orderChange
  subject: WSSubjectEnum.orderChange
  channelType: RequestType
  data: WSUpdateOrder
}

export type WSMessage =
  | WSAckMessage
  | WSTickerMessage
  | WSWelcomeMessage
  | WSOrderChangeMessage
  | WSBalanceMessage

export type WSTicker = {
  bestAsk: string
  bestAskSize: string
  bestBid: string
  bestBidSize: string
  price: string
  sequence: string
  size: string
  time: number
}

export type Fee = {
  symbol: string
  makerFeeRate: string
  takerFeeRate: string
}

export type BaseFee = Pick<Fee, 'makerFeeRate' | 'takerFeeRate'>

export type KucoinSymbol = {
  symbol: string
  name: string
  baseCurrency: string
  quoteCurrency: string
  feeCurrency: string
  market: string
  baseMinSize: string
  quoteMinSize: string
  baseMaxSize: string
  quoteMaxSize: string
  baseIncrement: string
  quoteIncrement: string
  priceIncrement: string
  priceLimitRate: string
  minFunds: string
  isMarginEnabled: boolean
  enableTrading: boolean
}

export type ConvertedWsTicker = { symbol: string } & WSTicker

export const OK = 'OK'

export const NOTOK = 'NOTOK'

export interface AssetBalance {
  asset: string
  free: string
  locked: string
}

export interface OutboundAccountPosition {
  balances: AssetBalance[]
  eventTime: number
  eventType: 'outboundAccountPosition'
  lastAccountUpdate: number
}

export interface BalanceUpdate {
  asset: string
  balanceDelta: string
  clearTime: number
  eventTime: number
  eventType: 'balanceUpdate'
}

export type OrderStatus_LT = 'CANCELED' | 'FILLED' | 'NEW' | 'PARTIALLY_FILLED'

export type FuturesOrderType_LT = 'LIMIT' | 'MARKET'

export type OrderSide_LT = 'BUY' | 'SELL'

export interface ExecutionReport {
  creationTime: number // Order creation time
  eventTime: number
  eventType: 'executionReport'
  newClientOrderId: string // Client order ID
  orderId: number | string // Order ID
  orderStatus: OrderStatus_LT // Current order status
  orderTime: number // Transaction time
  orderType: FuturesOrderType_LT // Order type
  originalClientOrderId: string | null // Original client order ID; This is the ID of the order being canceled
  price: string // Order price
  quantity: string // Order quantity
  side: OrderSide_LT // Side
  symbol: string // Symbol
  totalQuoteTradeQuantity: string // Cumulative quote asset transacted quantity
  totalTradeQuantity: string // Cumulative filled quantity
}

export type UserDataStreamEvent =
  | OutboundAccountPosition
  | ExecutionReport
  | BalanceUpdate

export interface MiniTicker {
  eventType: string
  eventTime: number
  symbol: string
  curDayClose: string
  open: string
  high: string
  low: string
  volume: string
  volumeQuote: string
}

const SUCCESS_CODE = '200000'

const HANDLE_MESSAGE = 'handleMessage'

class KucoinApi {
  private key: string
  private secret: string
  private passphrase: string
  private url: string
  private sockets: {
    [x in RequestType]: {
      ws: ReconnectingWebSocket | null
      pingInterval: number | null
      pingTimeout: number | null
      cb: { fn: (msg: WSMessage) => any; topic: string }[]
      pending: boolean
      callOnConnect: ((...args: []) => any)[]
      timer: NodeJS.Timer | null
      lastPing: number | null
      lastPong: number | null
      checkPong: NodeJS.Timer | null
    }
  }
  private orderFills: {
    orderId: string
    fills: { price: string; qty: string }[]
  }[]
  constructor(params?: {
    key?: string
    secret?: string
    passphrase?: string
    environment?: 'live' | 'sandbox'
  }) {
    this.key = params?.key || ''
    this.secret = params?.secret || ''
    this.passphrase = params?.passphrase || ''
    this.url = 'https://api.kucoin.com'
    if (params?.environment === 'sandbox') {
      this.url = 'https://openapi-sandbox.kucoin.com'
    }
    this.sockets = this.defaultWs()
    this.handleWsMessage = this.handleWsMessage.bind(this)
    this.orderFills = []
  }
  private handleLog(...args: any[]) {
    console.log(new Date(), ` | ${args}`)
  }
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
      },
    }
  }
  private sign(
    endpoint: string,
    params: AnyObject,
    method: Methods,
    type: RequestType,
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
    }
    return headers
  }
  private formatQuery(queryObj: AnyObject) {
    if (JSON.stringify(queryObj).length !== 2) {
      return '?' + queryString.stringify(queryObj)
    } else {
      return ''
    }
  }
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
  private async sendRequest<T>(
    endpoint: string,
    method: Methods,
    params: AnyObject,
    type: RequestType,
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
    const url = `${this.url}${endpoint}${
      method === 'POST' ? '' : this.formatQuery(params)
    }`
    const config = {
      method,
      body: method === 'POST' ? JSON.stringify(params) : undefined,
      headers: this.sign(endpoint, params, method, type),
    }
    try {
      const result = await fetch(url, config)
      return await this.handleResult(result)
    } catch (e) {
      return {
        status: NOTOK,
        data: null,
        reason: `${(e as any).message}: ${(e as any).cause.message}`,
        reasonCode: (e as any).cause.errno,
      }
    }
  }
  /* 
    List Accounts
    GET /api/v1/accounts
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
    Place a new order
    POST /api/v1/orders
    Details for market order vs. limit order and params see https://docs.kucoin.com/#place-a-new-order
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
    Cancel an order
    DELETE /api/v1/orders/<order-id>
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
    Get Symbols List
    GET /api/v1/symbols
    */
  public async getSymbols() {
    return await this.sendRequest<KucoinSymbol[]>(
      '/api/v1/symbols',
      'GET',
      {},
      'public',
    )
  }
  /* 
    List orders
    GET /api/v1/orders
    */
  public async getOrders(params: {
    status: OrderActiveStatus
    symbol: string
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
    Get an order
    GET /api/v1/orders/<order-id>
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
    Get an order by client ID
    GET /api/v1/order/client-order/{clientOid}
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
    Cancel an order by client ID
    DELETE /api/v1/order/client-order/{clientOid}
    */
  public async cancelOrderByClientId(params: { id: string }) {
    return await this.sendRequest<{
      cancelledOrderId: string
      clientOid: string
    }>(`/api/v1/order/client-order/${params.id}`, 'DELETE', {}, 'private')
  }
  /* 
    List Fills
    GET /api/v1/fills
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
    Get Ticker
    GET /api/v1/market/orderbook/level1?symbol=<symbol>
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
    Get All Tickers
    GET /api/v1/market/allTickers
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
    Get Fee
    GET /api/v1/trade-fees?symbols=[symbols]
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
    Get Base Fee
    GET /api/v1/base-fee
    */
  public async getBaseFees() {
    return await this.sendRequest<BaseFee>(
      `/api/v1/base-fee`,
      'GET',
      {},
      'private',
    )
  }
  private async getWsUrl(type: RequestType) {
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
      const { token, instanceServers } = result.data
      const [server] = instanceServers
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
  private openSocket(url: string, type: RequestType) {
    const rws = new ReconnectingWebSocket(url, [], {
      WebSocket: ws,
      connectionTimeout: 4e3,
      debug: false,
      maxReconnectionDelay: 10e3,
      maxRetries: Infinity,
      minReconnectionDelay: 4e3,
    })

    rws.addEventListener('open', () => {
      //@ts-ignore
      if (rws._ws.on) {
        //@ts-ignore
        rws._ws.on('ping', () => rws._ws.pong(() => null))
        //@ts-ignore
        rws._ws.on('pong', () => {
          this.sockets[type].lastPong = Date.now()
        })
      }
    })
    return rws
  }
  private async connectWS(type: RequestType) {
    const token = await this.getWsUrl(type)
    if (token) {
      const w = this.openSocket(token.url, type)
      w.onerror = (msg) => {
        this.handleLog('Kucoin WS Error', msg)
      }
      w.onopen = () => {
        this.handleLog('Kucoin WS started')
        this.sockets[type].lastPing = 0
        this.sockets[type].lastPong = 0
        if (this.sockets[type].timer) {
          //@ts-ignore
          clearInterval(this.sockets[type].timer)
        }
        if (this.sockets[type].checkPong) {
          //@ts-ignore
          clearInterval(this.sockets[type].checkPong)
        }
        if (this.sockets[type].cb.length > 0) {
          console.log(
            this.sockets[type].cb.length,
            ' subscribers exist',
            this.sockets[type].cb,
          )
          for (const s of this.sockets[type].cb) {
            this.handleSubscribe(type, s.topic, s.fn)
          }
        }

        this.sockets[type].timer = setInterval(() => {
          //@ts-ignore
          w._ws.ping()
          this.sockets[type].lastPing = Date.now()
          this.sockets[type].checkPong = setTimeout(async () => {
            const diff =
              this.sockets[type].lastPong && this.sockets[type].lastPing
                ? (this.sockets[type].lastPong || 0) -
                  (this.sockets[type].lastPing || 0)
                : token.server.pingTimeout * 1000
            if (diff > token.server.pingTimeout || diff < 0) {
              this.handleLog(`Ping-pong timeout exceeded ${diff}ms`)
              const subscribers = this.sockets[type].cb
              this.closeWs(type)
              await this.getWs(type)
              for (const s of subscribers) {
                this.handleSubscribe(type, s.topic, s.fn)
              }
            }
          }, token.server.pingTimeout)
        }, token.server.pingInterval)
      }
      w.onclose = () => {
        this.handleLog('Kucoin WS closed')
      }
      return w
    }
  }
  private convertWsTicker(msg: WSTickerMessage): MiniTicker {
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
    }
  }
  private handleWsMessage(msg: WSMessage) {
    if (msg.type === WSTypesEnum.welcome) {
      this.handleLog(`Welcome WS Kucoin ${msg.id}`)
    }
    if (msg.type === WSTypesEnum.ack) {
      this.handleLog(`Ack WS Kucoin ${msg.id}`)
    }
  }
  private async getWs(type: RequestType, retry?: (...args: any[]) => any) {
    if (this.sockets[type].ws) {
      return this.sockets[type].ws
    } else {
      if (!this.sockets[type].pending) {
        this.sockets[type].pending = true
        const ws = await this.connectWS(type)
        if (ws) {
          ws.onmessage = (msg) => {
            for (const cb of this.sockets[type].cb) {
              const json = JSON.parse(msg.data) as WSMessage
              cb.fn(json)
            }
          }
          this.sockets[type] = {
            ...this.sockets[type],
            ws,
            pingInterval: 0,
            pingTimeout: 0,
            cb: [{ fn: this.handleWsMessage, topic: HANDLE_MESSAGE }],
            pending: false,
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
      } else {
        if (retry) {
          this.sockets[type].callOnConnect.push(retry)
        }
      }
    }
  }
  private closeWs(type: RequestType) {
    this.sockets[type].ws?.close(1000, 'Close by demand')
    if (this.sockets[type].timer) {
      clearInterval(this.sockets[type].timer as NodeJS.Timer)
    }
    if (this.sockets[type].checkPong) {
      clearInterval(this.sockets[type].checkPong as NodeJS.Timer)
    }
    this.sockets[type] = this.defaultWs()[type]
  }
  private async handleUnsubscribe(type: RequestType, topic: string) {
    this.sockets[type].cb = this.sockets[type].cb.filter(
      (c) => c.topic !== topic,
    )
    if (this.sockets[type].ws) {
      this.sockets[type].ws?.send(
        JSON.stringify({
          id: Date.now(),
          type: 'unsubscribe',
          topic,
          response: true,
        }),
      )
    }
    if (
      ((this.sockets[type].cb.length === 1 &&
        this.sockets[type].cb[0].topic === HANDLE_MESSAGE) ||
        this.sockets[type].cb.length === 0) &&
      this.sockets[type].ws
    ) {
      this.closeWs(type)
    }
  }
  private async handleSubscribe(
    type: RequestType,
    topic: string,
    cbToSet: (msg: WSMessage) => any,
  ) {
    if (this.sockets[type]) {
      if (this.sockets[type].ws) {
        this.sockets[type].ws?.send(
          JSON.stringify({
            id: Date.now(),
            type: 'subscribe',
            topic,
            privateChannel: type === 'private',
            response: true,
          }),
        )
        if (!this.sockets[type].cb.find((c) => c.topic === topic)) {
          this.sockets[type].cb.push({ fn: cbToSet, topic })
        }
      } else if (!this.sockets[type].ws && this.sockets[type].pending) {
        this.sockets[type].callOnConnect.push(() =>
          this.handleSubscribe(type, topic, cbToSet),
        )
      }
    }
  }
  private convertOrderUpdate(msg: WSUpdateOrder): ExecutionReport {
    let find = this.orderFills.find((o) => o.orderId === msg.orderId)
    if (!find) {
      find = { orderId: msg.orderId, fills: [] }
    }
    if (find) {
      find.fills.push({
        price: msg.matchPrice || '0',
        qty: msg.matchSize || '0',
      })
    }
    const totalTradeQuantity = find.fills.reduce(
      (acc, v) => acc + parseFloat(v.qty),
      0,
    )
    const totalQuoteTradeQuantity = find.fills.reduce(
      (acc, v) => acc + parseFloat(v.price) * parseFloat(v.qty),
      0,
    )
    const convertTime = (ts: number) => Math.round(ts / 1000000)
    if (msg.status === 'done') {
      this.orderFills = this.orderFills.filter((f) => f.orderId !== msg.orderId)
    } else {
      this.orderFills = [
        ...this.orderFills.filter((f) => f.orderId !== msg.orderId),
        find,
      ]
    }
    return {
      creationTime: convertTime(msg.orderTime),
      eventTime: convertTime(msg.ts),
      eventType: 'executionReport',
      newClientOrderId: msg.clientOid,
      orderId: msg.orderId,
      orderTime: convertTime(msg.ts),
      orderStatus:
        msg.type === 'match' && msg.status === 'match'
          ? 'PARTIALLY_FILLED'
          : (msg.type === 'canceled' &&
              msg.status === 'done' &&
              msg.filledSize !== '0') ||
            (msg.type === 'filled' && msg.status === 'done')
          ? 'FILLED'
          : msg.type === 'open' && msg.status === 'open'
          ? 'NEW'
          : 'CANCELED',
      orderType: msg.orderType === 'limit' ? 'LIMIT' : 'MARKET',
      originalClientOrderId: msg.clientOid,
      price:
        msg.price ||
        `${
          totalTradeQuantity !== 0
            ? totalQuoteTradeQuantity / totalTradeQuantity
            : 0
        }`,
      quantity: msg.size || msg.filledSize || '0',
      side: msg.side === 'buy' ? 'BUY' : 'SELL',
      symbol: msg.symbol,
      totalQuoteTradeQuantity: `${totalQuoteTradeQuantity}`,
      totalTradeQuantity: `${totalTradeQuantity}`,
    }
  }
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
  public ws() {
    return {
      ticker: async (
        symbols: string[],
        callback: (msg: MiniTicker) => void | Promise<void>,
      ) => {
        if (symbols.length > 0) {
          const thisCb = (msg: WSMessage) => {
            if (
              msg.type === WSTypesEnum.message &&
              msg.subject === WSSubjectEnum.trade
            ) {
              callback(this.convertWsTicker(msg))
            }
          }
          const topic = `/market/ticker:${symbols.join(',')}`
          await this.getWs('public')
          this.handleSubscribe('public', topic, thisCb)
          return () => this.handleUnsubscribe('public', topic)
        }
      },
      tickerAll: async (
        callback: (msg: MiniTicker) => void | Promise<void>,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.tickerAll
          ) {
            callback(this.convertWsTicker(msg))
          }
        }
        const topic = `/market/ticker:all`
        await this.getWs('public')
        this.handleSubscribe('public', topic, thisCb)
        return () => this.handleUnsubscribe('public', topic)
      },
      order: async (
        callback: (msg: ExecutionReport) => void | Promise<void>,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.orderChange &&
            msg.subject === WSSubjectEnum.orderChange
          ) {
            callback(this.convertOrderUpdate(msg.data))
          }
        }
        const topic = `/spotMarket/tradeOrders`
        await this.getWs('private')
        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },
      balance: async (
        callback: (msg: OutboundAccountPosition) => void | Promise<void>,
      ) => {
        const thisCb = (msg: WSMessage) => {
          if (
            msg.type === WSTypesEnum.message &&
            msg.topic === WSMessageTopicEnum.balance &&
            msg.subject === WSSubjectEnum.balance &&
            msg.data.relationEvent.indexOf('trade') !== -1
          ) {
            callback(this.convertBalanceUpdate(msg.data))
          }
        }
        const topic = `/account/balance`
        await this.getWs('private')
        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },
    }
  }
}

export default KucoinApi
