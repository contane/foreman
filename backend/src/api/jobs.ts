import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import { V1Job } from '@kubernetes/client-node'
import assert from 'node:assert'
import { DEFAULT_NAMESPACE } from '../kubernetes/api.js'
import { ForemanAnnotations } from '../metadata.js'

interface JobsItem {
  namespace: string
  name: string
  manual: boolean
  settings: {
    repositoryScope?: string
    debugLogging?: boolean
  }
  triggeredBy?: {
    username: string
    strategy: string
  }
  status?: 'success' | 'failure' | 'active'
  startTime?: string
  completionTime?: string
}

export interface JobsRoute {
  Reply: JobsItem[]
}

export interface JobsItemRoute {
  Params: {
    namespace: string
    name: string
  }
  Reply: JobsItem
}

function project (job: V1Job): JobsItem {
  assert.ok(job.metadata?.name != null)

  const isFailure = typeof job.status?.failed === 'number' && job.status.failed > 0
  const isSuccess = typeof job.status?.succeeded === 'number' && job.status.succeeded > 0
  const isActive = typeof job.status?.active === 'number' && job.status.active > 0

  const isManual = job.metadata?.annotations?.[ForemanAnnotations.Manual] === 'true'
  const repositoryScope = job.metadata?.annotations?.[ForemanAnnotations.RepositoryScope]
  const debugLogging = job.metadata?.annotations?.[ForemanAnnotations.DebugLogging] != null
    ? job.metadata.annotations[ForemanAnnotations.DebugLogging] === 'true'
    : undefined
  const triggeredBy = job.metadata?.annotations?.[ForemanAnnotations.TriggeredBy] != null
    ? parseLogin(job.metadata.annotations[ForemanAnnotations.TriggeredBy])
    : undefined

  return {
    namespace: job.metadata.namespace ?? DEFAULT_NAMESPACE,
    name: job.metadata.name,
    manual: isManual,
    settings: {
      repositoryScope,
      debugLogging
    },
    triggeredBy,
    status: isSuccess ? 'success' : isFailure ? 'failure' : isActive ? 'active' : undefined,
    startTime: job.status?.startTime?.toISOString(),
    completionTime: job.status?.completionTime?.toISOString()
  }
}

interface UserDescriptor {
  username: string
  strategy: string
}

function parseLogin (login: string): UserDescriptor {
  const [strategy, username] = login.split(':')
  return { strategy: strategy ?? '', username: username ?? '' }
}

export const jobsRoute = ({ jobController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<JobsRoute>('/', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const jobs = await jobController.getJobsFromCronJob()
    if (jobs == null) {
      return await notFound(reply)
    }
    return jobs.map(project).sort((a, b) => {
      // sort newest jobs first
      return (b.startTime ?? '').localeCompare(a.startTime ?? '', 'en-US')
    })
  })

  app.get<JobsItemRoute>('/:namespace/:name', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const job = await jobController.findJob({ namespace: request.params.namespace, name: request.params.name })
    if (job == null) {
      return await notFound(reply)
    }
    return project(job)
  })
}
