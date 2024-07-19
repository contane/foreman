import assert from 'node:assert'
import { cleanup, startTestServer } from '../fixtures.js'

describe('/api/trigger', () => {
  afterEach(async () => await cleanup())

  it('requires authentication', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/api/trigger`, { method: 'POST' })
    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')
    assert.deepStrictEqual(await response.json(), { error: 'Forbidden' })
  })
})
