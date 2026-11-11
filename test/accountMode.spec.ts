import { describe, it } from 'mocha'
import { expect } from 'chai'
import KucoinApi from '../KucoinApi'

describe('getAccountMode', () => {
  it('asks the UTA account-mode endpoint as a private spot-host request', async () => {
    const api = new KucoinApi({ key: 'k', secret: 's', passphrase: 'p' })
    const calls: unknown[][] = []
    ;(api as any).sendRequest = async (...args: unknown[]) => {
      calls.push(args)
      return {
        status: 'OK',
        data: {
          selfAccountMode: 'UNIFIED',
          unifiedSubAccount: [],
          classicSubAccount: [],
        },
        reason: null,
        reasonCode: '200000',
      }
    }
    const res = await api.getAccountMode()
    expect(calls).to.have.length(1)
    const [endpoint, method, params, type, futures] = calls[0]
    expect(endpoint).to.equal('/api/ua/v2/account/mode')
    expect(method).to.equal('GET')
    expect(params).to.deep.equal({})
    expect(type).to.equal('private')
    expect(futures).to.equal(undefined)
    expect(res.data?.selfAccountMode).to.equal('UNIFIED')
  })
})
