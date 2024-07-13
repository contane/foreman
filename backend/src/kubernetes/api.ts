import k8s, { HttpError, V1CronJob, V1EnvVar, V1Job, V1Pod } from '@kubernetes/client-node'
import assert from 'node:assert'
import { BaseLogger } from 'pino'

export const DEFAULT_NAMESPACE = 'default'

export interface KubernetesApiOptions {
  kubeConfig: k8s.KubeConfig
}

export class KubernetesApi {
  constructor (
    private readonly log: BaseLogger,
    private readonly coreApi: k8s.CoreV1Api,
    private readonly batchApi: k8s.BatchV1Api
  ) {
  }

  static async create (log: BaseLogger, options: KubernetesApiOptions): Promise<KubernetesApi> {
    const kubeConfig = options.kubeConfig
    const coreApi = kubeConfig.makeApiClient(k8s.CoreV1Api)
    const batchApi = kubeConfig.makeApiClient(k8s.BatchV1Api)
    return new KubernetesApi(log, coreApi, batchApi)
  }

  private async request <T> (fn: () => Promise<T>): Promise<T> {
    // The Kubernetes client throws HTTP errors that contain the request and response headers.
    // This is a security risk if the error is logged, so we catch and rethrow the error without these objects.
    try {
      return await fn()
    } catch (err) {
      if (err instanceof HttpError) {
        // Force TypeScript to cause an error if the response property is missing
        ((err satisfies { response: object }) as any).response = undefined
      }
      throw err
    }
  }

  async getCronJob (options: {
    namespace: string
    name: string
  }): Promise<V1CronJob | undefined> {
    this.log.debug({ options }, 'k8s_getCronJob')
    return await this.request(async () => {
      try {
        const result = await this.batchApi.readNamespacedCronJob(options.name, options.namespace)
        return result.body
      } catch (err) {
        if (err instanceof HttpError && err.statusCode === 404) {
          this.log.warn({ options }, 'k8s_getCronJob: not found')
          return undefined
        }
        throw err
      }
    })
  }

  async getJobs (options: {
    namespace: string
  }): Promise<V1Job[] | undefined> {
    this.log.debug({ options }, 'k8s_getJobs')
    const result = await this.request(async () => {
      return await this.batchApi.listNamespacedJob(options.namespace)
    })
    return result.body.items.map((item) => ({
      ...item,
      kind: result.body.kind?.replace(/List$/, ''),
      apiVersion: result.body.apiVersion
    }))
  }

  async getPodsForJob (options: {
    namespace: string
    name: string
  }): Promise<V1Pod[]> {
    this.log.debug({ options }, 'k8s_getPodsForJob')
    const labelSelector = `job-name=${options.name}`
    const result = await this.request(async () => {
      return await this.coreApi.listNamespacedPod(options.namespace, undefined, undefined, undefined, undefined, labelSelector)
    })
    return result.body.items.map((item) => ({
      ...item,
      kind: result.body.kind?.replace(/List$/, ''),
      apiVersion: result.body.apiVersion
    }))
  }

  async getPodLogs (options: {
    namespace: string
    name: string
  }): Promise<string> {
    this.log.debug({ options }, 'k8s_getPodLogs')
    const result = await this.request(async () => {
      return await this.coreApi.readNamespacedPodLog(options.name, options.namespace)
    })
    return result.body
  }

  async triggerCronJob (options: {
    cronJob: V1CronJob
    jobName: string
    annotations?: Record<string, string>
    labels?: Record<string, string>
    env: Record<string, string>
  }): Promise<V1Job> {
    assert.ok(options.cronJob.metadata?.namespace != null)
    assert.ok(options.cronJob.metadata?.name != null)
    const { name, namespace } = options.cronJob.metadata
    assert.ok(options.cronJob.spec?.jobTemplate?.metadata != null)
    this.log.info({
      options: {
        namespace,
        name,
        jobName: options.jobName,
        env: JSON.stringify(options.env)
      }
    }, 'k8s_triggerCronJob')
    let jobBody = options.cronJob.spec.jobTemplate
    jobBody = applyMetadataName(jobBody, options.jobName)
    jobBody = applyMetadataAnnotations(jobBody, options.annotations ?? {})
    jobBody = applyMetadataLabels(jobBody, options.labels ?? {})
    jobBody = applyEnvToJobContainers(jobBody, options.env)
    // Cleanup job after 1 hour
    jobBody = applyTtl(jobBody, 60 * 60)
    const result = await this.request(async () => {
      return await this.batchApi.createNamespacedJob(namespace, jobBody)
    })
    return result.body
  }
}

function applyMetadataAnnotations (jobBody: k8s.V1Job, annotations: Record<string, string>): k8s.V1Job {
  return {
    ...jobBody,
    metadata: {
      ...jobBody.metadata,
      annotations: {
        ...jobBody.metadata?.annotations,
        ...annotations
      }
    }
  }
}

function applyMetadataLabels (jobBody: k8s.V1Job, labels: Record<string, string>): k8s.V1Job {
  return {
    ...jobBody,
    metadata: {
      ...jobBody.metadata,
      labels: {
        ...jobBody.metadata?.labels,
        ...labels
      }
    }
  }
}

function applyMetadataName (jobBody: k8s.V1Job, name: string): k8s.V1Job {
  return {
    ...jobBody,
    metadata: {
      ...jobBody.metadata,
      name
    }
  }
}

function applyEnvToJobContainers (jobBody: k8s.V1Job, env: Record<string, string>): k8s.V1Job {
  if (jobBody.spec?.template?.spec?.containers == null) {
    // No containers to apply env to
    return jobBody
  }
  return {
    ...jobBody,
    spec: {
      ...jobBody.spec,
      template: {
        ...jobBody.spec.template,
        spec: {
          ...jobBody.spec.template.spec,
          containers: jobBody.spec.template.spec.containers.map((container) => ({
            ...container,
            env: mergeEnv(container.env ?? [], env)
          }))
        }
      }
    }
  }
}

function applyTtl (jobBody: k8s.V1Job, ttlSecondsAfterFinished: number): k8s.V1Job {
  if (jobBody.spec == null) {
    return jobBody
  }
  return {
    ...jobBody,
    spec: {
      ...jobBody.spec,
      ttlSecondsAfterFinished
    }
  }
}

function mergeEnv (env: V1EnvVar[], newEnv: Record<string, string>): V1EnvVar[] {
  // Remove env vars that will be overwritten, then add new env vars
  return env.filter((envVar) => newEnv[envVar.name] == null)
    .concat(Object.entries(newEnv).map(([name, value]) => ({ name, value })))
}
