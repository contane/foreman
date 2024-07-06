import { FastifyPluginAsync } from 'fastify'
import { authenticateOidc } from '../../auth/oidc-strategy.js'
import { AuthStrategy } from '../../auth/common.js'

export const oidcAuthRoute = (): FastifyPluginAsync => async (app) => {
  app.get('/', authenticateOidc())

  app.get('/callback', authenticateOidc({
    successRedirect: '/',
    failureRedirect: '/login?login_error=' + AuthStrategy.OIDC
  }))
}
