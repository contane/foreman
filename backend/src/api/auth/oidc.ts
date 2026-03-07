import type { FastifyPluginAsync } from 'fastify'
import { authenticateOidc } from '../../auth/oidc-strategy.js'
import { AuthStrategy } from '../../auth/common.js'

export const oidcAuthRoute = (): FastifyPluginAsync => async (app) => {
  app.get('/', {
    preValidation: authenticateOidc()
  }, async (_req, reply) => {
    if (!reply.sent) {
      reply.code(204).send()
    }
  })

  app.get('/callback', {
    preValidation: authenticateOidc({
      successRedirect: '/',
      failureRedirect: '/login?login_error=' + AuthStrategy.OIDC
    })
  }, async (_req, reply) => {
    if (!reply.sent) {
      reply.code(204).send()
    }
  })
}
