/**
 * Common types used across the KucoinApi client
 */

import { OK, NOTOK } from './constants'

export type AnyObject = Record<string, any>

export type UnPromise<T> = T extends Promise<infer U> ? U : T

export type Methods = 'GET' | 'POST' | 'DELETE' | 'PUT'

export type RequestType = 'private' | 'public'

export interface Result<T> {
  status: typeof OK | typeof NOTOK
  data: T | null
  reason: string | null
  reasonCode: string
}
