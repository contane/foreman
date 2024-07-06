import { KubernetesApi } from '../kubernetes/api.js'
import { JobController } from './job.js'
import { StrongCache } from '../util/cache.js'
import assert from 'node:assert'
import { V1Pod } from '@kubernetes/client-node'

export class PodController {
  private readonly cache = new StrongCache<V1Pod[]>(5000)

  constructor (
    private readonly k8s: KubernetesApi,
    private readonly jobController: JobController
  ) {
  }

  async getPodsForJob (job: {
    namespace: string
    name: string
  }): Promise<V1Pod[] | undefined> {
    // Input must relate to an existing job
    if (await this.jobController.findJob(job) == null) {
      return undefined
    }
    return await this.cache.lazyCompute([job.namespace, job.name], async () => {
      return await this.k8s.getPodsForJob(job)
    })
  }

  async listAllPods (): Promise<V1Pod[]> {
    const jobs = await this.jobController.getJobsFromCronJob()
    if (jobs == null) {
      return []
    }
    const result: V1Pod[] = []
    for (const job of jobs) {
      assert.ok(job.metadata?.namespace != null)
      assert.ok(job.metadata?.name != null)
      const pods = await this.getPodsForJob({
        namespace: job.metadata.namespace,
        name: job.metadata.name
      })
      if (pods != null) {
        result.push(...pods)
      }
    }
    return result
  }

  async findPod (podMetadata: {
    namespace: string
    name: string
  }): Promise<V1Pod | undefined> {
    for (const pod of await this.listAllPods()) {
      if (pod.metadata?.namespace === podMetadata.namespace && pod.metadata?.name === podMetadata.name) {
        return pod
      }
    }
    return undefined
  }
}
