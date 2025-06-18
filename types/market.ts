/**
 * Market data types for KucoinApi client
 */

export interface MiniTicker {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  c: string // Close price
  o: string // Open price
  h: string // High price
  l: string // Low price
  v: string // Total traded base asset volume
  q: string // Total traded quote asset volume
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

export interface FuturesFullTicker extends FullTicker {
  lastPrice: string
  lastQuantity: string
}

export type Kline = string[][]

export interface Ticker {
  sequence: string
  price: string
  size: string
  bestBid: string
  bestBidSize: string
  bestAsk: string
  bestAskSize: string
  time: number
}

export interface AllTicker {
  time: number
  ticker: {
    symbol: string
    symbolName: string
    buy: string
    sell: string
    changeRate: string
    changePrice: string
    high: string
    low: string
    vol: string
    volValue: string
    last: string
    averagePrice: string
    takerFeeRate: string
    makerFeeRate: string
    takerCoefficient: string
    makerCoefficient: string
  }[]
}

export interface KucoinSymbol {
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

export interface FuturesKucoinSymbols {
  symbol: string
  rootSymbol: string
  type: string
  firstOpenDate: number
  expireDate: number | null
  settleDate: number | null
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
  settlementFee: number | null
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
  status: string
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
