import { CronJobController } from './cronjob.js'
import { KubernetesApi } from '../kubernetes/api.js'
import assert from 'node:assert'
import { StrongCache } from '../util/cache.js'
import { V1CronJob, V1Job } from '@kubernetes/client-node'
import { ForemanLabels } from '../metadata.js'

export class JobController {
  private readonly cache = new StrongCache<V1Job[]>(5000)

  constructor (
    private readonly k8s: KubernetesApi,
    private readonly cronJobController: CronJobController
  ) {
  }

  async getJobsFromCronJob (): Promise<V1Job[] | undefined> {
    const cronJob = await this.cronJobController.getCronJob()
    if (cronJob == null) {
      return undefined
    }

    const namespace = cronJob.metadata?.namespace
    assert.ok(namespace != null)

    return await this.cache.lazyCompute([namespace], async () => {
      const jobs = await this.k8s.getJobs({
        namespace
      })
      // Ensure the job is associated with the cronjob
      return jobs?.filter((job) => {
        // manually-triggered jobs
        if (job.metadata?.labels?.[ForemanLabels.CronJob] === cronJob.metadata?.name) {
          return true
        }
        // direct owner reference
        return job.metadata?.ownerReferences?.some((ref) => {
          return ref.controller === true &&
            ref.apiVersion === cronJob.apiVersion &&
            ref.kind === cronJob.kind &&
            ref.name === cronJob.metadata?.name
        }) === true
      })
    })
  }

  async findJob (job: {
    namespace: string
    name: string
  }): Promise<V1Job | undefined> {
    const jobs = await this.getJobsFromCronJob()
    if (jobs == null) {
      return undefined
    }
    return jobs.find(j => j.metadata?.namespace === job.namespace && j.metadata?.name === job.name)
  }

  invalidateCache (cronJob: V1CronJob): void {
    const namespace = cronJob.metadata?.namespace
    if (namespace != null) {
      this.cache.invalidate([namespace])
    }
  }
}
