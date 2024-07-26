import { fastify, FastifyInstance } from 'fastify'
import { makeOidcStrategy } from '../../src/auth/oidc-strategy.js'
import assert from 'node:assert'
import { Strategy } from 'openid-client'

describe('auth/oidc-strategy.ts', () => {
  describe('makeOidcStrategy()', () => {
    let app: FastifyInstance | undefined

    afterEach(async () => {
      await app?.close()
      app = undefined
    })

    it('performs issuer discovery', async () => {
      app = fastify()
      let called = false
      app.get('/.well-known/openid-configuration', async (req, reply) => {
        called = true
        return { issuer: 'http://127.0.0.1:58080' }
      })
      await app.listen({ host: '127.0.0.1', port: 58080 })
      const strategy = await makeOidcStrategy({
        issuer: 'http://127.0.0.1:58080',
        clientId: 'foobar',
        clientSecret: 'bazqux',
        redirectUri: 'http://localhost:3000/oidc/callback'
      })
      assert.ok(strategy instanceof Strategy)
      assert.ok(called)
    })

    it('accepts issuer URL with full .well-known path', async () => {
      app = fastify()
      let called = false
      app.get('/.well-known/openid-configuration', async (req, reply) => {
        called = true
        return { issuer: 'http://127.0.0.1:58080' }
      })
      await app.listen({ host: '127.0.0.1', port: 58080 })
      const strategy = await makeOidcStrategy({
        issuer: 'http://127.0.0.1:58080/.well-known/openid-configuration',
        clientId: 'foobar',
        clientSecret: 'bazqux',
        redirectUri: 'http://localhost:3000/oidc/callback'
      })
      assert.ok(strategy instanceof Strategy)
      assert.ok(called)
    })

    it('redirects unauthenticated users to the OIDC provider', async () => {
      app = fastify()
      app.get('/.well-known/openid-configuration', async (req, reply) => {
        return {
          // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
          issuer: 'http://127.0.0.1:58080',
          authorization_endpoint: 'http://127.0.0.1:58080/authorize',
          token_endpoint: 'http://127.0.0.1:58080/token',
          jwks_uri: 'http://127.0.0.1:58080/jwks',
          response_types_supported: ['code']
        }
      })
      await app.listen({ host: '127.0.0.1', port: 58080 })
      const strategy = await makeOidcStrategy({
        issuer: 'http://127.0.0.1:58080',
        clientId: 'foobar',
        clientSecret: 'bazqux',
        redirectUri: 'http://localhost:3000/oidc/callback'
      })
      const mockRequest = {
        method: 'GET',
        url: '/',
        body: {},
        session: {}
      }
      const promise = new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        strategy.error = (err: any) => reject(err)
        strategy.fail = () => reject(new Error('should not have failed'))
        strategy.success = () => reject(new Error('should not have succeeded'))
        strategy.pass = () => reject(new Error('should not have passed'))
        strategy.redirect = (url: string) => {
          const urlObj = new URL(url)
          assert.strictEqual(urlObj.origin, 'http://127.0.0.1:58080')
          assert.strictEqual(urlObj.pathname, '/authorize')
          assert.strictEqual(urlObj.searchParams.get('client_id'), 'foobar')
          assert.strictEqual(urlObj.searchParams.get('response_type'), 'code')
          assert.strictEqual(urlObj.searchParams.get('redirect_uri'), 'http://localhost:3000/oidc/callback')
          resolve()
        }
      })
      strategy.authenticate(mockRequest as any)
      await promise
    })
  })
})
