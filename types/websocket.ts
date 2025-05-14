/**
 * WebSocket-related types for KucoinApi client
 */

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

export interface WSTicker {
  bestAsk: string
  bestAskSize: string
  bestBid: string
  bestBidSize: string
  price: string
  sequence: string
  size: string
  time: number
}

export interface ConvertedWsTicker {
  symbol: string
  bestAsk: string
  bestAskSize: string
  bestBid: string
  bestBidSize: string
  price: string
  sequence: string
  size: string
  time: number
}

export interface WSBalance {
  total: string
  available: string
  availableChange: string
  currency: string
  hold: string
  holdChange: string
  relationEvent: string
  relationEventId: string
  relationContext: {
    symbol: string
    tradeId: string
    orderId: string
  }
  time: string
}

export interface WSWelcomeMessage {
  type: WSTypesEnum.welcome
  id: string
}

export interface WSAckMessage {
  type: WSTypesEnum.ack
  id: string
}

export interface WSTickerMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.tickerAll
  subject: WSSubjectEnum.trade
  data: WSTicker
}

export interface WSBalanceMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.balance
  subject: WSSubjectEnum.balance
  data: WSBalance
}

export interface WSUpdateOrder {
  symbol: string
  orderType: string
  side: string
  orderId: string
  type: 'open' | 'match' | 'filled' | 'canceled' | 'update' | 'received'
  orderTime: number
  size: string
  oldSize?: string
  filledSize: string
  price: string
  clientOid: string
  remainSize: string
  status: 'open' | 'match' | 'done' | 'new'
  ts: number
  liquidity: string
  matchPrice?: string
  matchSize?: string
  tradeId?: string
}

export interface WSOrderChangeMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.orderChange
  subject: WSSubjectEnum.orderChange
  channelType: string
  data: WSUpdateOrder
}

export interface WSKlinesUpdate {
  symbol: string
  candles: string[]
  time: number
  interval: string
}

export interface WSKlines {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.klines
  subject: WSSubjectEnum.klines
  data: WSKlinesUpdate
}

export interface FuturesBalanceWsMessageData {
  availableBalance: number
  holdBalance: number
  currency: string
  timestamp: number
}

export interface WSFuturesBalanceMessage {
  topic: WSMessageTopicEnum.futuresBalance
  subject: WSSubjectEnum.futuresBalance
  data: FuturesBalanceWsMessageData
  type: WSMessageTopicEnum.futuresBalance
}

export interface WSFuturesTickerMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresTicker
  subject: WSSubjectEnum.ticker
  data: {
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
}

export interface FuturesPosition {
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
  changeReason: 'liquidation'
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

export interface WSFuturesPositionMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresPosition
  subject: WSSubjectEnum.position
  data: FuturesPosition
}

export interface WSFuturesOrderMessage {
  type: WSTypesEnum.message
  topic: WSMessageTopicEnum.futuresOrder
  subject: WSSubjectEnum.orderChange
  data: {
    orderId: string
    symbol: string
    type: 'open' | 'match' | 'filled' | 'canceled' | 'update' | 'received'
    feeType: string
    matchSize: string
    matchPrice: string
    orderType: string
    side: string
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
    ts: number
    liquidity: string
  }
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
