import assert from 'node:assert'
import { cleanup, startTestServer } from '../../fixtures.js'

describe('/api/auth/strategies', () => {
  afterEach(async () => await cleanup())

  it('returns empty array if not strategies are enabled', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/api/auth/strategies`, { method: 'GET' })
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')

    const strategies = await response.json()
    assert.deepStrictEqual(strategies, [])
  })

  it('includes local login if enabled', async () => {
    const { origin } = await startTestServer({
      config (input) {
        return {
          ...input,
          auth: {
            ...input.auth,
            local: {
              enabled: true,
              username: 'test',
              password: 'test'
            }
          }
        }
      }
    })

    const response = await fetch(`${origin}/api/auth/strategies`, { method: 'GET' })
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')

    const strategies = await response.json()
    assert.deepStrictEqual(strategies, ['local'])
  })
})
