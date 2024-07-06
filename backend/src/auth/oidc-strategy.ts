import { custom, Issuer, Strategy as OpenIdStrategy, TokenSet, UserinfoResponse } from 'openid-client'
import { AuthStrategy, User } from './common.js'
import { AuthenticateOptions } from '@fastify/passport/dist/AuthenticationRoute.js'
import { RouteHandlerMethod } from 'fastify'
import fastifyPassport from '@fastify/passport'

export const authenticateOidc = (options?: AuthenticateOptions): RouteHandlerMethod => fastifyPassport.authenticate(AuthStrategy.OIDC, options)

export async function makeOidcStrategy (options: {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<OpenIdStrategy<User>> {
  const issuerUrl = options.issuer.includes('.well-known')
    ? options.issuer
    : new URL('/.well-known/openid-configuration', options.issuer).toString()

  const issuer = await Issuer.discover(issuerUrl)

  const client = new issuer.Client({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    redirect_uris: [options.redirectUri],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_basic'
  })

  // There are some really slow OIDC providers out there.
  client[custom.http_options] = () => {
    return { timeout: 30_000 }
  }

  return new OpenIdStrategy({
    client,
    params: {
      scope: 'openid email'
    }
  }, (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: User) => void) => {
    if (tokenset.expired()) {
      done(new Error('Token expired'))
      return
    }
    const claims = tokenset.claims()
    const username = claims.email ?? userinfo.email
    if (username == null) {
      done(new Error('No username or email provided'))
      return
    }
    done(null, {
      strategy: AuthStrategy.OIDC,
      username,
      createdAt: Date.now()
    })
  })
}
