import { KubernetesApi } from '../kubernetes/api.js'
import { StrongCache } from '../util/cache.js'
import { BackendConfig } from '../index.js'
import { V1CronJob } from '@kubernetes/client-node'

export class CronJobController {
  private readonly cache = new StrongCache<V1CronJob>(5000)

  constructor (
    private readonly k8s: KubernetesApi,
    private readonly config: BackendConfig['cronJob']
  ) {
  }

  async getCronJob (): Promise<V1CronJob | undefined> {
    return await this.cache.lazyCompute([], async () => {
      return await this.k8s.getCronJob({
        namespace: this.config.namespace,
        name: this.config.name
      })
    })
  }
}
