import { FastifyPluginAsync } from 'fastify'
import { forbidden } from '../errors.js'
import { authenticateSession } from '../../auth/common.js'

export interface MeRoute {
  Reply: {
    username: string
    strategy: string
  }
}

export const meAuthRoute = (): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<MeRoute>('/', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    return {
      username: request.user.username,
      strategy: request.user.strategy
    }
  })
}
