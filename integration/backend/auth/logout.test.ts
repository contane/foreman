import assert from 'node:assert'
import { cleanup, startTestServer } from '../../fixtures.js'

describe('/api/auth/logout', () => {
  afterEach(async () => await cleanup())

  it('returns 200 if called without a session', async () => {
    const { origin } = await startTestServer()

    // Note: This sets a cookie, but its contents indicate a missing session.
    const response = await fetch(`${origin}/api/auth/logout`, { method: 'POST' })
    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')
    // TODO set SameSite=Strict
    const setCookie = response.headers.getSetCookie()
    assert.ok(setCookie.length === 1)
    assert.match(setCookie[0], /^session=[^;]+; Max-Age=86400; Path=\/api; HttpOnly; SameSite=Lax$/)
    assert.deepStrictEqual(await response.json(), {})

    // user should not have a session
    const meResponse = await fetch(`${origin}/api/auth/me`, { method: 'GET' })
    assert.strictEqual(meResponse.status, 403)
  })

  it('invalidates an existing session', async () => {
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

    const loginResponse = await fetch(`${origin}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"username":"test-user","password":"test-password"}'
    })
    assert.strictEqual(loginResponse.status, 200)

    const sessionCookie = loginResponse.headers.getSetCookie().at(0)
    assert.ok(sessionCookie?.startsWith('session='))
    const session = sessionCookie?.split(';').at(0)?.split('=').at(1)
    assert.ok(session != null)

    // validate session
    const meResponse = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `session=${session}` }
    })
    assert.strictEqual(meResponse.status, 200)

    // logout
    const logoutResponse = await fetch(`${origin}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `session=${session}` }
    })
    assert.strictEqual(logoutResponse.status, 200)
    assert.strictEqual(logoutResponse.headers.get('Content-Type'), 'application/json; charset=utf-8')
    // TODO set SameSite=Strict
    const setCookie = logoutResponse.headers.getSetCookie()
    assert.ok(setCookie.length === 1)
    assert.match(setCookie[0], /^session=[^;]+; Max-Age=86400; Path=\/api; HttpOnly; SameSite=Lax$/)
    assert.deepStrictEqual(await logoutResponse.json(), {})

    const sessionCookie2 = setCookie.at(0)?.split(';').at(0)?.split('=').at(1)
    assert.ok(sessionCookie2 != null)
    assert.notStrictEqual(sessionCookie2, session)

    // session should be invalidated
    const meResponse2 = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: `session=${sessionCookie2}` }
    })
    assert.strictEqual(meResponse2.status, 403)
  })
})
