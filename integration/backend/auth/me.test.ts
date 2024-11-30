import assert from 'node:assert'
import { cleanup, startTestServer } from '../../fixtures.js'

describe('/api/auth/me', () => {
  afterEach(async () => await cleanup())

  it('requires authentication', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/api/auth/me`, { method: 'GET' })
    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.headers.get('Content-Type')?.toLowerCase(), 'application/json; charset=utf-8')
    assert.deepStrictEqual(await response.json(), { error: 'Forbidden' })
  })
})
