import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { badRequest, forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import { prettifyLogs } from '../renovate/prettify-logs.js'
import { enums, optional, type } from 'superstruct'
import { WeakCache } from '../util/cache.js'
import { Mutex } from '../util/mutex.js'

export interface PodLogsRoute {
  Reply: string
}

const logsQuerystringSchema = type({
  pretty: optional(enums(['true', 'false']))
})

export const podLogsRoute = ({ logsController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  // Prettifying is an expensive operation. Cache the results, and only allow one prettification at a time.
  // The latter helps if multiple clients request the same logs at the same time since no
  const prettyLogsCache = new WeakCache<{ data: string }>(5000)
  const prettyLogsMutex = new Mutex()

  app.get<PodLogsRoute & {
    Params: {
      namespace: string
      name: string
    }
  }>('/:namespace/:name', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const [err, query] = logsQuerystringSchema.validate(request.query, { coerce: true })
    if (err != null) {
      return await badRequest(reply)
    }
    const logs = await logsController.getPodLogs({ namespace: request.params.namespace, name: request.params.name })
    if (logs == null) {
      return await notFound(reply)
    }
    if (query.pretty === 'true') {
      let unlock
      try {
        unlock = await prettyLogsMutex.lock()
        const result = await prettyLogsCache.lazyCompute([request.params.namespace, request.params.name], async () => {
          return {
            data: await prettifyLogs(logs)
          }
        })
        return result?.data
      } finally {
        unlock?.()
      }
    }
    return logs
  })
}
