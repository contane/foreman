import assert from 'node:assert'
import { cleanup, startTestServer } from './fixtures.js'

describe('frontend', () => {
  afterEach(async () => await cleanup())

  it('serves index.html by default', async () => {
    const { origin } = await startTestServer()

    for (const path of ['/', '/index.html', '/foo', '/foo/bar']) {
      const getResponse = await fetch(`${origin}${path}`)
      assert.strictEqual(getResponse.status, 200)

      const text = await getResponse.text()
      assert.ok(text.includes('<title>Foreman</title>'))

      // should set proper headers
      const { headers } = getResponse
      assert.strictEqual(headers.get('Content-Security-Policy'), "default-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
      assert.strictEqual(headers.get('X-Frame-Options'), 'DENY')
      assert.strictEqual(headers.get('X-Content-Type-Options'), 'nosniff')
      assert.strictEqual(headers.get('Referrer-Policy'), 'no-referrer')
      assert.strictEqual(headers.get('Cache-Control'), 'public, max-age=0')
      assert.strictEqual(headers.get('Content-Type'), 'text/html; charset=UTF-8')

      // should also respond to HEAD requests
      const headResponse = await fetch(`${origin}${path}`, { method: 'HEAD' })
      assert.strictEqual(headResponse.status, 200)
      assert.strictEqual(headResponse.headers.get('Content-Type'), headers.get('Content-Type'))
      assert.strictEqual(headResponse.headers.get('Content-Length'), headers.get('Content-Length'))
    }
  })

  it('has no inline scripts or styles', async () => {
    // Inline CSS/JS is a security risk, and is disallowed by the Content Security Policy.

    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/`)
    assert.strictEqual(response.status, 200)

    const text = await response.text()

    // script tags with content (vs. references to external scripts)
    assert.doesNotMatch(text, /<script[^>]*>[^<]+<\/script>/i)
    // inline event handlers
    assert.doesNotMatch(text, /\bon[a-z]+=/i)
    // style tags
    assert.doesNotMatch(text, /<style/i)
    // style attributes
    assert.doesNotMatch(text, /style=/i)
  })

  it('references external scripts and styles', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/`)
    assert.strictEqual(response.status, 200)

    const text = await response.text()

    const stylesheet = text.match(/<link[^>]*\shref="([^"]+)"/i)
    assert.ok(stylesheet)
    assert.match(stylesheet[1], /^\/assets\/index-.+\.css$/)

    const script = text.match(/<script[^>]*\ssrc="([^"]+)"/i)
    assert.ok(script)
    assert.match(script[1], /^\/assets\/index-.+\.js$/)
  })

  it('serves static files', async () => {
    const { origin } = await startTestServer()

    const favicon = await fetch(`${origin}/assets/favicon.ico`)
    assert.strictEqual(favicon.status, 200)
    assert.strictEqual(favicon.headers.get('Content-Type'), 'image/vnd.microsoft.icon')

    const robots = await fetch(`${origin}/robots.txt`)
    assert.strictEqual(robots.status, 200)
    assert.strictEqual(robots.headers.get('Content-Type'), 'text/plain; charset=UTF-8')
    assert.strictEqual(await robots.text(), 'User-agent: *\nDisallow: /\n')

    const webmanifest = await fetch(`${origin}/assets/manifest.webmanifest`)
    assert.strictEqual(webmanifest.status, 200)
    assert.strictEqual(webmanifest.headers.get('Content-Type'), 'application/manifest+json')
  })

  it('responds with 404 for unexpected request methods', async () => {
    const { origin } = await startTestServer()

    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      for (const path of ['/', '/index.html', '/foo', '/foo/bar', '/assets/favicon.ico']) {
        const response = await fetch(`${origin}${path}`, { method })
        assert.strictEqual(response.status, 404)
        assert.strictEqual(response.headers.get('Content-Type'), 'application/json; charset=utf-8')
        assert.deepStrictEqual(await response.json(), { error: 'Not Found' })
      }
    }
  })

  it('responds with 400 for unknown request methods', async () => {
    const { origin } = await startTestServer()

    const response = await fetch(`${origin}/`, { method: 'MYRANDOMMETHOD' })
    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(await response.json(), {
      error: 'Bad Request',
      message: 'Client Error',
      statusCode: 400
    })
  })
})
