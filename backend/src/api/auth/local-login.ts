import type { FastifyPluginAsync } from 'fastify'
import { authenticateLocal, type LocalStrategyRequestBody } from '../../auth/local-strategy.js'

export interface LocalLoginRoute {
  Body: LocalStrategyRequestBody
  Reply: {}
}

export const localLoginAuthRoute = (): FastifyPluginAsync => async (app) => {
  app.post<LocalLoginRoute>('/', { preValidation: authenticateLocal() }, () => {
    return {}
  })
}
