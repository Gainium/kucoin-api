/**
 * Account-related types for KucoinApi client
 */

export type AccountType = 'main' | 'trade' | 'margin'

export interface GetAccountsInput {
  currency?: string
  type?: string
}

export interface AccountBalance {
  id: string
  currency: string
  type: string
  balance: string
  available: string
  holds: string
}

export interface FuturesAccountDetails {
  accountEquity: number
  unrealisedPNL: number
  marginBalance: number
  positionMargin: number
  orderMargin: number
  frozenFunds: number
  availableBalance: number
  currency: string
}

export interface APIKeyResponse {
  remark: string
  apiKey: string
  apiVersion: number
  permission: string
  createdAt: number
  uid: number
  isMaster: boolean
}

export interface OutboundAccountPosition {
  eventType: 'outboundAccountPosition'
  eventTime: number
  lastAccountUpdate: number
  balances: {
    asset: string
    free: string
    locked: string
  }[]
}

export interface BalanceUpdate {
  eventType: 'balanceUpdate'
  eventTime: number
  asset: string
  balanceDelta: string
  clearTime: number
}

export interface UserDataStreamEvent {
  accountEveryTime?: number
  eventType: string
  eventTime: number
}

export interface WSTokenResponse {
  instanceServers: [
    {
      endpoint: string
      protocol: string
      encrypt: boolean
      pingInterval: number
      pingTimeout: number
    },
  ]
  token: string
}

export interface WSTokenResponseToUse {
  url: string
  server: {
    pingInterval: number
    pingTimeout: number
  }
}

export interface Position {
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
  unrealisedPnl: number
  unrealisedPnlPcnt: number
  unrealisedRoePcnt: number
  avgEntryPrice: number
  liquidationPrice: number
  bankruptPrice: number
  settleCurrency: string
  isInverse: boolean
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
  realisedRollingPnl: number
  realisedPnlPcnt: number
  realisedRoePcnt: number
  unrealisedPnlPcnt24h: number
  unrealisedRoePcnt24h: number
}

export interface Fee {
  symbol: string
  takerFeeRate: string
  makerFeeRate: string
}

export interface BaseFee {
  takerFeeRate: string
  makerFeeRate: string
}

export interface AffiliateUserRebateInformation {
  inviterCode: string
  inviteDate: number
  invitedUser: string
  level: string
  invitedUserCount: number
  rebate: number
  rebateCurrency: string
  rebateTime: number
}
