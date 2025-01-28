import crypto from 'crypto'
import queryString from 'query-string'
import fetch from 'isomorphic-unfetch'
import ws from 'isomorphic-ws'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { v4 } from 'uuid'
import { IdMute, IdMutex } from './mutex'

const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const mutex = new IdMutex()

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

export type FuturesAccountDetails = {
  accountEquity: number
  unrealisedPNL: number
  marginBalance: number
  positionMargin: number
  orderMargin: number
  frozenFunds: number
  availableBalance: number
  currency: string
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
  reduceOnly?: boolean
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
  reduceOnly?: boolean
  dealValue?: string
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

export type Position = {
  id: string
  symbol: string
  autoDeposit: boolean
  maintMarginReq: number
  riskLimit: number
  realLeverage: number
  crossMode: boolean
  delevPercentage: number
  openingTimestamp: number
  currentTimestamp: number
  currentQty: number
  currentCost: number
  currentComm: number
  unrealisedCost: number
  realisedGrossCost: number
  realisedCost: number
  isOpen: boolean
  markPrice: number
  markValue: number
  posCost: number
  posCross: number
  posInit: number
  posComm: number
  posLoss: number
  posMargin: number
  posMaint: number
  maintMargin: number
  realisedGrossPnl: number
  realisedPnl: number
  unrealisedPnl: number
  unrealisedPnlPcnt: number
  unrealisedRoePcnt: number
  avgEntryPrice: number
  liquidationPrice: number
  bankruptPrice: number
  settleCurrency: number
  maintainMargin: number
  userId: number
  riskLimitLevel: number
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

export type WSTokenResponseToUse = {
  url: string
  server: {
    endpoint: string
    exncrypt: boolean
    protocol: string
    pingInterval: number
    pingTimeout: number
  }
}

export type WSTypes = 'message' | 'ack' | 'welcome'

export enum WSSubjectEnum {
  trade = 'trade.ticker',
  orderChange = 'orderChange',
  balance = 'account.balance',
  klines = 'trade.candles.update',
  futuresBalance = 'availableBalance.change',
  ticker = 'ticker',
  position = 'position.change',
}

export enum WSTypesEnum {
  message = 'message',
  ack = 'ack',
  welcome = 'welcome',
}

export enum WSMessageTopicEnum {
  tickerAll = '/market/ticker:all',
  orderChange = '/spotMarket/tradeOrdersV2',
  balance = '/account/balance',
  klines = '/market/candles:',
  futuresBalance = '/contractAccount/wallet',
  futuresTicker = '/contractMarket/ticker:',
  futuresOrder = '/contractMarket/tradeOrders',
  futuresPosition = '/contract/position:',
}

export type FuturesBalanceWsMessageData = {
  availableBalance: number
  holdBalance: number
  currency: string
  timestamp: number
}

export type WSFuturesBalanceMessage = {
  topic: WSMessageTopicEnum.futuresBalance
  subject: WSSubjectEnum.futuresBalance
  data: FuturesBalanceWsMessageData
  type: WSMessageTopicEnum.futuresBalance
}

export type WSFuturesTickerMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresTicker
  subject: WSSubjectEnum.ticker
  data: FuturesFullTicker
}

export type FuturesPosition = {
  realisedGrossPnl: number
  symbol: string
  crossMode: boolean
  liquidationPrice: number
  posLoss: number
  avgEntryPrice: number
  unrealisedPnl: number
  markPrice: number
  posMargin: number
  autoDeposit: boolean
  riskLimit: number
  unrealisedCost: number
  posComm: number
  posMaint: number
  posCost: number
  maintMarginReq: number
  bankruptPrice: number
  realisedCost: number
  markValue: number
  posInit: number
  realisedPnl: number
  maintMargin: number
  realLeverage: number
  changeReason: 'liquidation' //changeReason:marginChange、positionChange、liquidation、autoAppendMarginStatusChange、adl
  currentCost: number
  openingTimestamp: number
  currentQty: number
  delevPercentage: number
  currentComm: number
  realisedGrossCost: number
  isOpen: boolean
  posCross: number
  currentTimestamp: number
  unrealisedRoePcnt: number
  unrealisedPnlPcnt: number
  settleCurrency: string
}

export type WSFuturesPositionMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresPosition
  subject: WSSubjectEnum.position
  data: FuturesPosition
}

export type WSFuturesOrderMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresOrder
  subject: WSSubjectEnum.orderChange
  data: FuturesOrder
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
  type: 'open' | 'match' | 'filled' | 'canceled' | 'update' | 'received'
  /** time in nanoseconds */
  orderTime: number
  size: string
  oldSize?: string
  filledSize: string
  price: string
  clientOid: string
  remainSize: string
  status: 'open' | 'match' | 'done' | 'new'
  /** time in nanoseconds */
  ts: number
  liquidity: Liquidity
  matchPrice?: string
  matchSize?: string
  tradeId?: string
}

export type WSOrderChangeMessage = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.orderChange
  subject: WSSubjectEnum.orderChange
  channelType: RequestType
  data: WSUpdateOrder
}

export type WSKlinesUpdate = {
  symbol: string
  candles: string[]
  /** time in ns */
  time: number
  interval: string
}

export type WSKlines = {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.klines
  subject: WSSubjectEnum.klines
  data: WSKlinesUpdate
}

export type WSMessage =
  | WSAckMessage
  | WSTickerMessage
  | WSWelcomeMessage
  | WSOrderChangeMessage
  | WSBalanceMessage
  | WSKlines
  | WSFuturesBalanceMessage
  | WSFuturesTickerMessage
  | WSFuturesOrderMessage
  | WSFuturesPositionMessage

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

export type FuturesKucoinSymbols = {
  symbol: string
  rootSymbol: string
  type: string
  firstOpenDate: number
  expireDate: Date
  settleDate: Date
  baseCurrency: string
  quoteCurrency: string
  settleCurrency: string
  maxOrderQty: number
  maxPrice: number
  lotSize: number
  tickSize: number
  indexPriceTickSize: number
  multiplier: number
  initialMargin: number
  maintainMargin: number
  maxRiskLimit: number
  minRiskLimit: number
  riskStep: number
  makerFeeRate: number
  takerFeeRate: number
  takerFixFee: number
  makerFixFee: number
  settlementFee: number
  isDeleverage: boolean
  isQuanto: boolean
  isInverse: boolean
  markMethod: string
  fairMethod: string
  fundingBaseSymbol: string
  fundingQuoteSymbol: string
  fundingRateSymbol: string
  indexSymbol: string
  settlementSymbol: string
  status: 'Open' | 'Closed'
  fundingFeeRate: number
  predictedFundingFeeRate: number
  openInterest: string
  turnoverOf24h: number
  volumeOf24h: number
  markPrice: number
  indexPrice: number
  lastTradePrice: number
  nextFundingRateTime: number
  maxLeverage: number
  sourceExchanges: string[]
  premiumsSymbol1M: string
  premiumsSymbol8H: string
  fundingBaseSymbol1M: string
  fundingQuoteSymbol1M: string
  lowPrice: number
  highPrice: number
  priceChgPct: number
  priceChg: number
  supportCross?: boolean
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
  uniqueMessageId?: string
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

export interface FullTicker {
  eventType: string
  eventTime: number
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvg: string
  prevDayClose: string
  curDayClose: string
  closeTradeQuantity: string
  bestBid: string
  bestBidQnt: string
  bestAsk: string
  bestAskQnt: string
  open: string
  high: string
  low: string
  volume: string
  volumeQuote: string
  openTime: number
  closeTime: number
  firstTradeId: number
  lastTradeId: number
  totalTrades: number
}

export interface FuturesFullTicker {
  symbol: string
  sequence: number
  side: string
  price: string
  size: number
  tradeId: string
  bestBidSize: number
  bestBidPrice: string
  bestAskPrice: string
  bestAskSize: number
  ts: number
}

export interface FuturesOrder {
  orderId: string
  symbol: string
  type: 'open' | 'match' | 'filled' | 'canceled' | 'update' | 'received'
  feeType: string
  matchSize: string
  matchPrice: string
  orderType: OrderType
  side: OrderSide
  price: string
  size: string
  remainSize: string
  filledSize: string
  canceledSize: string
  tradeId: string
  clientOid: string
  orderTime: number
  oldSize: string
  status: 'open' | 'match' | 'done' | 'new'
  /** time in nanoseconds */
  ts: number
  liquidity: Liquidity
}

export type Kline = string[][]

const SUCCESS_CODE = '200000'

const HANDLE_MESSAGE = 'handleMessage'

/*const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}*/

type APIKeyResponse = {
  remark: string
  apiKey: string
  apiVersion: number
  permission: string
  createdAt: number
  uid: number
  isMaster: boolean
}

type AffiliateUserRebateInformation = {
  m1Uid: string
  rcode: string
  m2Uid: string
  amount: string
  rebate: string
  cashBack: string
  offset: string
}

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
      timer: NodeJS.Timer | null
      lastPing: number | null
      lastPong: number | null
      checkPong: NodeJS.Timer | null
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
  private handleLog(...args: any[]) {
    console.log(new Date(), ` | ${args}`)
  }
  set onError(bool: boolean) {
    this._onError = bool
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
      if (this.broker) {
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
    Get Account Detail - Futures
    GET /api/v1/account-overview
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
    Place a new order
    POST /api/v1/orders
    Details for market order vs. limit order and params see https://docs.kucoin.com/#place-a-new-order
    */
  public async placeFuturesOrder(
    params: CommonOrderConfig & { leverage: number },
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
    Get api key
    GET /api/v1/user/api-key
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
    Get Affiliate User Rebate Information
    GET /api/v2/affiliate/inviter/statisticsv
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
    Get Symbols List
    GET /api/v2/symbols
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
    Get Futures Symbols List
    GET /api/v1/contracts/active
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
    List orders
    GET /api/v1/orders
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
    List orders
    GET /api/v1/orders
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
    Get an order
    GET /api/v1/orders/<order-id>
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
    Get an order by client ID
    GET /api/v1/orders/byClientOid
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
    Cancel an order by client ID
    DELETE /api/v1/orders/client-order/{clientOid}
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
    Cancel an order by order ID
    DELETE /api/v1/orders/{orderId}
    */
  public async cancelFuturesOrderByOrderId(params: { id: string }) {
    return await this.sendRequest<{
      cancelledOrderIds: string[]
    }>(`/api/v1/orders/${params.id}`, 'DELETE', {}, 'private', true)
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
    Get Ticker
    GET /api/v1/market/orderbook/level1?symbol=<symbol>
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
    Get Positions
    GET /api/v1/positions
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
    Get Position by symbol
    GET /api/v1/positions
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
  /*  
    Get Klines
    GET /api/v1/market/candles
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
    Get Klines
    GET /api/v1/kline/query
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
          clearInterval(this.sockets[type].timer)
        }
        if (this.sockets[type].checkPong) {
          //@ts-ignore
          clearInterval(this.sockets[type].checkPong)
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
                clearInterval(this.sockets[type].timer as NodeJS.Timer)
              }
            }
            //@ts-ignore
            w._ws.ping()
            this.sockets[type].lastPing = Date.now()
            this.sockets[type].checkPong = setTimeout(async () => {
              if (!this.sockets[type].ws?.OPEN) {
                if (this.sockets[type].checkPong) {
                  clearInterval(this.sockets[type].checkPong as NodeJS.Timer)
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
  private handleWsMessage(msg: WSMessage) {
    if (msg.type === WSTypesEnum.welcome) {
      this.handleLog(`Welcome WS Kucoin ${msg.id}`)
    }
    if (msg.type === WSTypesEnum.ack) {
      this.handleLog(`Ack WS Kucoin ${msg.id}`)
    }
  }
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
  private closeWs(type: RequestType) {
    this.sockets[type].ws?.close(1000, 'Close by demand')
    if (this.sockets[type].timer) {
      clearInterval(this.sockets[type].timer as NodeJS.Timer)
    }
    if (this.sockets[type].checkPong) {
      clearInterval(this.sockets[type].checkPong as NodeJS.Timer)
    }
    this.sockets[type].topics.clear()
    this.sockets[type] = this.defaultWs()[type]
  }
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
  public ws(token?: WSTokenResponseToUse) {
    return {
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
              callback(this.convertWsTicker(msg))
            }
          }
          const topic = `/market/ticker:${symbols.join(',')}`
          await this.getWs('public', undefined, token, onError)
          this.handleSubscribe('public', topic, thisCb)
          return () => this.handleUnsubscribe('public', topic)
        }
      },
      tickerAll: async (
        callback: (msg: FullTicker) => void | Promise<void>,
        onError?: (msg: string) => void,
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
        await this.getWs('public', undefined, token, onError)
        this.handleSubscribe('public', topic, thisCb)
        return () => this.handleUnsubscribe('public', topic)
      },
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
            const o = this.convertOrderUpdate(msg.data)
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
      balance: async (
        callback: (msg: OutboundAccountPosition) => void | Promise<void>,
        onError?: (msg: string) => void,
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
        await this.getWs('private', undefined, token, onError)
        this.handleSubscribe('private', topic, thisCb)
        return () => this.handleUnsubscribe('private', topic)
      },
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
            if (this.lastData.get(msg.topic) === msg.data.time) {
              return
            }
            this.lastData.set(msg.topic, msg.data.time)
            callback({ ...msg.data, interval: msg.topic.split('_')[1] })
          }
        }
        const topic = `/market/candles:${params.symbol}_${params.type}`
        await this.getWs('public', undefined, token, onError)
        this.handleSubscribe('public', topic, thisCb)
        return () => this.handleUnsubscribe('public', topic)
      },
      ws: () => {
        return {
          public: this.sockets['public'],
        }
      },
    }
  }
}

export default KucoinApi
