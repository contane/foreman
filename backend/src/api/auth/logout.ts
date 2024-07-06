import { FastifyPluginAsync } from 'fastify'
import { authenticateSession } from '../../auth/common.js'

export interface LogoutRoute {
  Body: {}
  Reply: {}
}

export const logoutAuthRoute = (): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.post<LogoutRoute>('/', async (request, reply) => {
    await request.logout()
    return {}
  })
}
