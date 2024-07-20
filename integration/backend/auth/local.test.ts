import assert from 'node:assert'
import { cleanup, startTestServer } from '../../fixtures.js'

describe('/api/auth/local', () => {
  afterEach(async () => await cleanup())

  it('returns 404 if local login not configured', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/api/auth/local`, { method: 'POST' })
    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')
    assert.deepStrictEqual(await response.json(), { error: 'Not Found' })
  })

  it('returns 400 for invalid body schema', async () => {
    const { origin } = await startTestServer({
      config (input) {
        return {
          ...input,
          auth: {
            ...input.auth,
            local: {
              enabled: true,
              username: 'test-user',
              password: 'test-password'
            }
          }
        }
      }
    })

    const bodies = [
      '{}',
      '{"username":"test-user"}',
      '{"password":"test-password"}',
      '{"username":"user-test","password":null}'
    ]

    for (const body of bodies) {
      const response = await fetch(`${origin}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })
      assert.strictEqual(response.status, 400)
      // TODO respond with JSON instead of plain text
      assert.strictEqual(response.headers.get('Content-Type'), 'text/plain; charset=utf-8')
      assert.strictEqual(await response.text(), 'Bad Request')
    }
  })

  it('returns 401 for invalid credentials', async () => {
    const { origin } = await startTestServer({
      config (input) {
        return {
          ...input,
          auth: {
            ...input.auth,
            local: {
              enabled: true,
              username: 'test-user',
              password: 'test-password'
            }
          }
        }
      }
    })

    const bodies = [
      '{"username":"user-test","password":"password-test"}',
      '{"username":"test-user","password":"password-test"}',
      '{"username":"test-user ","password":"test-password"}',
      '{"username":"test-user","password":"test-password "}'
    ]

    for (const body of bodies) {
      const response = await fetch(`${origin}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })
      assert.strictEqual(response.status, 401)
      // TODO respond with JSON instead of plain text
      assert.strictEqual(response.headers.get('Content-Type'), 'text/plain; charset=utf-8')
      assert.deepStrictEqual(await response.text(), 'Unauthorized')
    }
  })

  it('creates a session for valid credentials', async () => {
    const { origin } = await startTestServer({
      config (input) {
        return {
          ...input,
          auth: {
            ...input.auth,
            local: {
              enabled: true,
              username: 'test-user',
              password: 'test-password'
            }
          }
        }
      }
    })

    const response = await fetch(`${origin}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"username":"test-user","password":"test-password"}'
    })
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')
    // TODO set SameSite=Strict
    const setCookie = response.headers.getSetCookie()
    assert.ok(setCookie.length === 1)
    assert.match(setCookie[0], /^session=[^;]+; Max-Age=86400; Path=\/api; HttpOnly; SameSite=Lax$/)
    assert.deepStrictEqual(await response.json(), {})
  })
})
