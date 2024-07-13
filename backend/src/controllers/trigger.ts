import { KubernetesApi } from '../kubernetes/api.js'
import { CronJobController } from './cronjob.js'
import assert from 'node:assert'
import { randomBytes } from 'node:crypto'
import { V1Job } from '@kubernetes/client-node'
import { ForemanAnnotations, ForemanLabels } from '../metadata.js'
import { JobController } from './job.js'

export class TriggerController {
  constructor (
    private readonly k8s: KubernetesApi,
    private readonly cronJobController: CronJobController,
    private readonly jobController: JobController
  ) {
  }

  async trigger (options: {
    repositoryScope?: string
    debugLogging?: boolean
  }, user: {
    username: string
    strategy: string
  }): Promise<V1Job> {
    const cronJob = await this.cronJobController.getCronJob()
    assert.ok(cronJob?.metadata?.name != null)

    const annotations: Record<string, string> = {}
    annotations[ForemanAnnotations.Manual] = 'true'
    annotations[ForemanAnnotations.TriggeredBy] = `${user.strategy}:${user.username}`

    const env: Record<string, string> = {}

    if (options.repositoryScope != null) {
      env.RENOVATE_AUTODISCOVER_FILTER = options.repositoryScope
      annotations[ForemanAnnotations.RepositoryScope] = options.repositoryScope
    }

    if (options.debugLogging === true) {
      env.LOG_LEVEL = 'debug'
      annotations[ForemanAnnotations.DebugLogging] = 'true'
    }

    // Ensure we can attribute the job to the cronjob later
    const labels: Record<string, string> = {}
    labels[ForemanLabels.CronJob] = cronJob.metadata.name

    const result = await this.k8s.triggerCronJob({
      cronJob,
      jobName: `${cronJob.metadata.name}-foreman-${randomId()}`,
      annotations,
      labels,
      env
    })

    // Avoid 404 errors when the client immediately tries to list the job
    this.jobController.invalidateCache(cronJob)

    return result
  }
}

/**
 * Generate 6 random lowercase characters for use in a job name.
 */
function randomId (): string {
  return randomBytes(16).toString('base64').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)
}
