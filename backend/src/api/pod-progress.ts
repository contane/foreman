import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import { extractProgress, ProgressItem } from '../renovate/progress.js'
import { BackendConfig } from '../backend-config.js'

export interface PodProgressRoute {
  Reply: ProgressItem[]
}

export const podProgressRoute = ({ logsController }: Controllers, config: BackendConfig): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<PodProgressRoute & {
    Params: {
      namespace: string
      name: string
    }
  }>('/:namespace/:name', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const logs = await logsController.getPodLogs({ namespace: request.params.namespace, name: request.params.name })
    if (logs == null) {
      return await notFound(reply)
    }
    const progress = extractProgress(logs, { repositoryBaseUrl: config.gitlab.host })
    if (progress == null) {
      // In case the log cannot be parsed, progress is unavailable, so return a 404.
      return await notFound((reply))
    }
    return progress
  })
}
