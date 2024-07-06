import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import { V1Pod } from '@kubernetes/client-node'
import assert from 'node:assert'
import { DEFAULT_NAMESPACE } from '../kubernetes/api.js'

interface JobPodsItem {
  namespace: string
  name: string
  status?: 'active' | 'success' | 'failure'
  startTime?: string
}

export interface JobPodsRoute {
  Reply: JobPodsItem[]
}

function project (pod: V1Pod): JobPodsItem {
  assert.ok(pod.metadata?.name != null)

  const isFailure = pod.status?.phase === 'Failed'
  const isSuccess = pod.status?.phase === 'Succeeded'
  const isActive = pod.status?.phase === 'Running'

  return {
    namespace: pod.metadata.namespace ?? DEFAULT_NAMESPACE,
    name: pod.metadata.name,
    status: isFailure ? 'failure' : isSuccess ? 'success' : isActive ? 'active' : undefined,
    startTime: pod.status?.startTime?.toISOString()
  }
}

export const jobPodsRoute = ({ podController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<JobPodsRoute & { Params: {
    namespace: string
    name: string
  } }>('/:namespace/:name', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const pods = await podController.getPodsForJob({ namespace: request.params.namespace, name: request.params.name })
    if (pods == null) {
      return await notFound(reply)
    }
    return pods.map(project)
  })
}
