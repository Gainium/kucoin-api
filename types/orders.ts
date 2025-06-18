/**
 * Order-related types for the KucoinApi client
 */

export type LIMIT = 'limit'
export type MARKET = 'market'
export type OrderType = LIMIT | MARKET

export type OrderSide = 'buy' | 'sell'
export type OrderSide_LT = 'BUY' | 'SELL'

export type OrderActiveStatus = 'active' | 'done'

export type TradeType = 'TRADE' | 'MARGIN_TRADE'

export type FuturesOrderType_LT = 'LIMIT' | 'MARKET'

export type OrderStatus_LT = 'CANCELED' | 'FILLED' | 'NEW' | 'PARTIALLY_FILLED'

export type STP = 'CN' | 'CO' | 'CB' | 'DC'

export type TimeInForce = 'GTC' | 'GTT' | 'IOC' | 'FOK'

export type StopType = 'entry' | 'loss'

export type Liquidity = 'taker' | 'maker'

export interface CommonOrderConfig {
  clientOid: string
  side: OrderSide
  symbol: string
  price?: string
  size?: string
  funds?: string
  type?: string
  timeInForce?: string
  remark?: string
  stp?: string
  tradeType?: TradeType
  reduceOnly?: boolean
  tags?: string
}

export interface OrderResponse {
  orderId: string
}

export interface CanceledOrderResponse {
  cancelledOrderIds: string[]
}

export interface KucoinOrder {
  id: string
  symbol: string
  opType: string
  type: OrderType
  side: string
  price: string
  size: string
  funds: string
  dealFunds: string
  dealSize: string
  fee: string
  feeCurrency: string
  stp: string
  timeInForce: string
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
  tradeType: string
  status: string
  reduceOnly?: boolean
  dealValue?: string
}

export interface ListOrders {
  currentPage: number
  pageSize: number
  totalNum: number
  totalPage: number
  items: KucoinOrder[]
}

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

export interface ListFills {
  currentPage: number
  pageSize: number
  totalNum: number
  totalPage: number
  items: Fill[]
}

export interface ExecutionReport {
  eventType: 'executionReport'
  eventTime: number
  symbol: string
  clientOrderId: string
  side: string
  orderType: string
  timeInForce?: string
  orderQuantity?: string
  price: string
  stopPrice?: string
  icebergQuantity?: string
  orderTime: number
  orderStatus: string
  orderId: string
  orderCreationTime?: number
  creationTime?: number
  quantity?: string
  quoteOrderQuantity?: string
  cummulativeQuoteQuantity?: string
  lastExecutedQuantity?: string
  lastExecutedPrice?: string
  commissionAsset?: string
  commissionAmount?: string
  orderTradeTime?: number
  tradeId?: number
  originalClientOrderId?: string
  totalQuoteTradeQuantity: string
  totalTradeQuantity: string
  uniqueMessageId: string
  newClientOrderId?: string
}

export interface FuturesOrder {
  symbol: string
  side: string
  orderId: string
  clientOrderId: string
  price: string
  origQty: string
  executedQty: string
  cummulativeQuoteQty: string
  status: string
  timeInForce: string
  type: OrderType
  reduceOnly: boolean
  positionSide: string
  closePosition: boolean
  selfTradePreventionMode: string
  stopPrice: string
  workingType: string
  priceProtect: boolean
  origType: string
  updateTime: number
}
