import * as openid from 'openid-client'
import { Strategy as OpenIdStrategy } from 'openid-client/passport'
import { AuthStrategy, type User } from './common.js'
import type { AuthenticateOptions } from '@fastify/passport/dist/AuthenticationRoute.js'
import type { RouteHandlerMethod } from 'fastify'
import { fastifyPassport } from '../fastifyPassport.js'

export const authenticateOidc = (options?: AuthenticateOptions): RouteHandlerMethod => fastifyPassport.authenticate(AuthStrategy.OIDC, options)

interface OidcOptions {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string

  /**
   * @deprecated This option is only provided for testing purposes.
   */
  allowInsecureRequests?: boolean
}

export async function makeOidcStrategy (options: OidcOptions): Promise<OpenIdStrategy> {
  const issuerUrl = options.issuer.includes('.well-known')
    ? new URL(options.issuer)
    : new URL('/.well-known/openid-configuration', options.issuer)

  const config = await openid.discovery(issuerUrl, options.clientId, options.clientSecret, undefined, {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    execute: options.allowInsecureRequests === true ? [openid.allowInsecureRequests] : undefined,
    timeout: 30_000
  })

  type TokenSet = openid.TokenEndpointResponse & openid.TokenEndpointResponseHelpers

  const verify = async (tokenset: TokenSet): Promise<User> => {
    const expiresIn = tokenset.expiresIn()
    if (expiresIn != null && expiresIn < 1) {
      throw new Error('Token expired')
    }

    const claims = tokenset.claims()
    if (claims == null) {
      throw new Error('No claims provided')
    }

    let username = claims.email
    if (username == null) {
      const userInfo = await openid.fetchUserInfo(config, tokenset.access_token, claims.sub)
      username = userInfo.email
    }
    if (username == null || typeof username !== 'string') {
      throw new Error('No username or email provided, or it is not a string')
    }

    return {
      strategy: AuthStrategy.OIDC,
      username,
      createdAt: Date.now()
    }
  }

  const strategy = new OpenIdStrategy({
    name: AuthStrategy.OIDC,
    config,
    callbackURL: options.redirectUri,
    scope: 'openid email'
  }, (tokenset: TokenSet, done: (err: any, user?: User) => void) => {
    verify(tokenset)
      .then((user: User) => done(null, user))
      .catch((err: unknown) => done(err))
  })

  // openid-client for some reason ignores the fact that we provided a full callback URL and instead manipulates it
  // based on the request URL, which may be completely wrong in case of a reverse proxy. This is a workaround.
  // https://github.com/panva/openid-client/issues/733
  // https://github.com/panva/openid-client/discussions/741
  strategy.currentUrl = function (request) {
    const callbackUrl = new URL(options.redirectUri)
    const currentUrl = OpenIdStrategy.prototype.currentUrl.call(this, request)
    currentUrl.protocol = callbackUrl.protocol
    currentUrl.host = callbackUrl.host
    return currentUrl
  }

  return strategy
}
