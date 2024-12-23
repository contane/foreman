import { fastify, type FastifyInstance } from 'fastify'
import { makeOidcStrategy } from '../../src/auth/oidc-strategy.js'
import assert from 'node:assert'
import { Strategy as OpenIdStrategy } from 'openid-client/passport'
import { Authenticator } from '../../src/fastifyPassport.js'
import { AuthStrategy } from '../../src/auth/common.js'

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
        redirectUri: 'http://localhost:3000/oidc/callback',
        allowInsecureRequests: true
      })
      assert.ok(strategy instanceof OpenIdStrategy)
      assert.ok(called)
    })

    it('disallows insecure requests by default', async () => {
      try {
        await makeOidcStrategy({
          issuer: 'http://127.0.0.1:58080',
          clientId: 'foobar',
          clientSecret: 'bazqux',
          redirectUri: 'http://localhost:3000/oidc/callback'
        })
      } catch (err: unknown) {
        assert.ok(err != null && (err as any).message.toLowerCase().includes('https'))
        return
      }
      assert.fail('Expected an error')
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
        redirectUri: 'http://localhost:3000/oidc/callback',
        allowInsecureRequests: true
      })
      assert.ok(strategy instanceof OpenIdStrategy)
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
      const passport = new Authenticator()
      passport.use(await makeOidcStrategy({
        issuer: 'http://127.0.0.1:58080',
        clientId: 'foobar',
        clientSecret: 'bazqux',
        redirectUri: 'http://localhost:3000/oidc/callback',
        allowInsecureRequests: true
      }) as any)
      const strategy = passport.strategy(AuthStrategy.OIDC)
      assert.ok(strategy != null)
      const mockRequest = {
        method: 'GET',
        url: '/',
        body: {},
        session: {},
        res: {
          redirect: (url: string) => {
            assert.fail(`Unexpected redirect to ${url}`)
          },
          status: (code: number) => {
            assert.fail(`Unexpected status code ${code}`)
          }
        }
      }
      const promise = new Promise<void>((resolve, reject) => {
        (strategy as any).error = () => reject(new Error('should not have errored'));
        (strategy as any).fail = () => reject(new Error('should not have failed'));
        (strategy as any).success = () => reject(new Error('should not have succeeded'));
        (strategy as any).pass = () => reject(new Error('should not have passed'));
        (strategy as any).redirect = (url: string) => {
          const urlObj = new URL(url)
          assert.strictEqual(urlObj.origin, 'http://127.0.0.1:58080')
          assert.strictEqual(urlObj.pathname, '/authorize')
          assert.strictEqual(urlObj.searchParams.get('client_id'), 'foobar')
          assert.strictEqual(urlObj.searchParams.get('response_type'), 'code')
          assert.strictEqual(urlObj.searchParams.get('redirect_uri'), 'http://localhost:3000/oidc/callback')
          resolve()
        }
      })
      strategy.authenticate.call(strategy as any, mockRequest as any, {})
      await promise
    })
  })
})
