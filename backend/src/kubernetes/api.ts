import { ApiException, BatchV1Api, CoreV1Api, type KubeConfig, type V1CronJob, type V1EnvVar, type V1Job, type V1Pod } from '@kubernetes/client-node'
import assert from 'node:assert'
import type { BaseLogger } from 'pino'

export const DEFAULT_NAMESPACE = 'default'

export interface KubernetesApiOptions {
  kubeConfig: KubeConfig
}

export class KubernetesApi {
  constructor (
    private readonly log: BaseLogger,
    private readonly coreApi: CoreV1Api,
    private readonly batchApi: BatchV1Api
  ) {
  }

  static async create (log: BaseLogger, options: KubernetesApiOptions): Promise<KubernetesApi> {
    const kubeConfig = options.kubeConfig
    const coreApi = kubeConfig.makeApiClient(CoreV1Api)
    const batchApi = kubeConfig.makeApiClient(BatchV1Api)
    return new KubernetesApi(log, coreApi, batchApi)
  }

  async getCronJob (options: {
    namespace: string
    name: string
  }): Promise<V1CronJob | undefined> {
    this.log.debug({ options }, 'k8s_getCronJob')
    try {
      return await this.batchApi.readNamespacedCronJob({
        namespace: options.namespace,
        name: options.name
      })
    } catch (err) {
      if (err instanceof ApiException && err.code === 404) {
        this.log.warn({ options }, 'k8s_getCronJob: not found')
        return undefined
      }
      throw err
    }
  }

  async getJobs (options: {
    namespace: string
  }): Promise<V1Job[] | undefined> {
    this.log.debug({ options }, 'k8s_getJobs')
    const result = await this.batchApi.listNamespacedJob(options)
    return result.items.map((item) => ({
      ...item,
      kind: result.kind?.replace(/List$/, ''),
      apiVersion: result.apiVersion
    }))
  }

  async getPodsForJob (options: {
    namespace: string
    name: string
  }): Promise<V1Pod[]> {
    this.log.debug({ options }, 'k8s_getPodsForJob')
    const labelSelector = `job-name=${options.name}`
    const result = await this.coreApi.listNamespacedPod({
      namespace: options.namespace,
      labelSelector
    })
    return result.items.map((item) => ({
      ...item,
      kind: result.kind?.replace(/List$/, ''),
      apiVersion: result.apiVersion
    }))
  }

  async getPodLogs (options: {
    namespace: string
    name: string
  }): Promise<string> {
    this.log.debug({ options }, 'k8s_getPodLogs')
    return await this.coreApi.readNamespacedPodLog({
      namespace: options.namespace,
      name: options.name
    })
  }

  async triggerCronJob (options: {
    cronJob: V1CronJob
    jobName: string
    annotations?: Record<string, string>
    labels?: Record<string, string>
    env: Record<string, string>
  }): Promise<V1Job> {
    assert.ok(options.cronJob.metadata?.namespace != null)
    assert.ok(options.cronJob.metadata.name != null)
    const { name, namespace } = options.cronJob.metadata
    assert.ok(options.cronJob.spec?.jobTemplate.metadata != null)
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
    return await this.batchApi.createNamespacedJob({
      namespace,
      body: jobBody
    })
  }
}

function applyMetadataAnnotations (jobBody: V1Job, annotations: Record<string, string>): V1Job {
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

function applyMetadataLabels (jobBody: V1Job, labels: Record<string, string>): V1Job {
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

function applyMetadataName (jobBody: V1Job, name: string): V1Job {
  return {
    ...jobBody,
    metadata: {
      ...jobBody.metadata,
      name
    }
  }
}

function applyEnvToJobContainers (jobBody: V1Job, env: Record<string, string>): V1Job {
  if (jobBody.spec?.template.spec?.containers == null) {
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

function applyTtl (jobBody: V1Job, ttlSecondsAfterFinished: number): V1Job {
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

function mergeEnv (env: V1EnvVar[], newEnv: Partial<Record<string, string>>): V1EnvVar[] {
  // Remove env vars that will be overwritten, then add new env vars
  return env.filter((envVar) => newEnv[envVar.name] == null)
    .concat(Object.entries(newEnv).map(([name, value]) => ({ name, value })))
}
