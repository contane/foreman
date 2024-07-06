import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { badRequest, forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import pinoPretty from 'pino-pretty'
import { Writable } from 'node:stream'
import { enums, optional, type } from 'superstruct'
import { WeakCache } from '../util/cache.js'

export interface PodLogsRoute {
  Reply: string
}

const logsQuerystringSchema = type({
  pretty: optional(enums(['true', 'false']))
})

export const podLogsRoute = ({ logsController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  // Prettifying is an expensive operation. Cache the results.
  const prettyLogsCache = new WeakCache<{ data: string }>(5000)

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
      const result = await prettyLogsCache.lazyCompute([request.params.namespace, request.params.name], async () => {
        return {
          data: await prettifyLogs(logs)
        }
      })
      return result?.data
    }
    return logs
  })
}

async function prettifyLogs (logs: string): Promise<string> {
  // TODO: This consumes a lot of memory. We should use streaming instead.
  // TODO: There should be a way for clients to request logs over WebSocket instead of polling.
  const chunks: string[] = []
  const prettyLogs = pinoPretty({
    translateTime: true,
    ignore: 'v,name,pid,hostname,logContext',
    colorize: false,
    destination: new Writable({
      write (chunk, enc, cb) {
        chunks.push(chunk.toString())
        cb()
      }
    })
  })
  // Process the string in chunks to avoid blocking the event loop.
  for (const chunk of chunked(logs)) {
    await new Promise<void>((resolve) => {
      if (!prettyLogs.write(chunk, 'utf8')) {
        prettyLogs.once('drain', resolve)
      } else {
        setImmediate(resolve)
      }
    })
  }
  await new Promise<void>((resolve) => prettyLogs.end(resolve))
  return chunks.join('')
}

function * chunked (str: string, size = 4096): Iterable<string> {
  for (let i = 0; i < str.length; i += size) {
    yield str.slice(i, i + size)
  }
}
