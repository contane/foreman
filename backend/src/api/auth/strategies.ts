import { FastifyPluginAsync } from 'fastify'
import { AuthStrategy } from '../../auth/common.js'

export interface StrategiesRoute {
  Reply: string[]
}

export const strategiesAuthRoute = (strategies: AuthStrategy[]): FastifyPluginAsync => async (app) => {
  // route is not authenticated - provides a list of available strategies to log in with

  app.get<StrategiesRoute>('/', async () => {
    return strategies
  })
}
