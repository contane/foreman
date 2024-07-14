import { KubernetesApi } from '../kubernetes/api.js'
import { PodController } from './pod.js'
import { WeakCache } from '../util/cache.js'
import { Mutex } from '../util/mutex.js'

export class LogsController {
  // The log strings may be large, so we use a weak cache to allow them to be garbage collected.
  // However, it's impossible to create a WeakRef to a string, so we wrap the string in an object.
  private readonly cache = new WeakCache<{ data: string }>(5000)

  // Only allow fetching one log at a time.
  private readonly mutex = new Mutex()

  constructor (
    private readonly k8s: KubernetesApi,
    private readonly podController: PodController
  ) {
  }

  async getPodLogs (pod: {
    namespace: string
    name: string
  }): Promise<string | undefined> {
    let unlock
    try {
      unlock = await this.mutex.lock()
      // Input must relate to an existing pod
      const podItem = await this.podController.findPod(pod)
      if (podItem == null) {
        return undefined
      }
      // Requesting logs for a pod that is starting is invalid and will result in a 400 error.
      if (podItem.status?.phase === 'Pending' || podItem.status?.phase === 'Unknown') {
        return undefined
      }
      const result = await this.cache.lazyCompute([pod.namespace, pod.name], async () => {
        return {
          data: await this.k8s.getPodLogs(pod)
        }
      })
      return result?.data
    } finally {
      unlock?.()
    }
  }
}
