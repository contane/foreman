import { ApiCallError, ApiRoute } from './fetch.js'
import type {
  CronJobRoute,
  JobPodsRoute,
  JobsRoute,
  JobsItemRoute,
  LocalLoginRoute,
  LogoutRoute,
  MeRoute,
  PodLogsRoute,
  PodProgressRoute,
  StrategiesRoute,
  TriggerRoute
} from 'backend/routes'

export type TriggerJobOptions = TriggerRoute['Body']

// helper for better type inference
const route = <T extends {}, Args extends unknown[]> (route: ApiRoute<T, Args>): ApiRoute<T, Args> => route

export const api = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  userInfo: route({
    request: () => ({ url: 'auth/me' }),
    transformResponse: async (response): Promise<MeRoute['Reply'] | false> => await response.json(),
    transformError: (error) => {
      if (error instanceof ApiCallError && error.statusCode === 403) {
        return false
      }
      return error
    }
  }),

  authStrategies: route({
    request: () => ({ url: 'auth/strategies' }),
    transformResponse: async (response): Promise<StrategiesRoute['Reply']> => await response.json()
  }),

  localLogin: route({
    request: (body: LocalLoginRoute['Body']) => ({ url: 'auth/local', method: 'POST', body }),
    transformResponse: async (response): Promise<LocalLoginRoute['Reply']> => await response.json()
  }),

  logout: route({
    request: () => ({ url: 'auth/logout', method: 'POST' }),
    transformResponse: async (response): Promise<LogoutRoute['Reply']> => await response.json()
  }),

  cronJob: route({
    request: () => ({ url: 'cronjob' }),
    transformResponse: async (response): Promise<CronJobRoute['Reply']> => await response.json()
  }),

  jobs: route({
    request: () => ({ url: 'jobs' }),
    transformResponse: async (response): Promise<JobsRoute['Reply']> => await response.json()
  }),

  job: route({
    request: (job: {
      namespace: string
      name: string
    }) => ({ url: `jobs/${encodeURIComponent(job.namespace)}/${encodeURIComponent(job.name)}` }),
    transformResponse: async (response): Promise<JobsItemRoute['Reply']> => await response.json()
  }),

  podsForJob: route({
    request: (job: {
      namespace: string
      name: string
    }) => ({ url: `job-pods/${encodeURIComponent(job.namespace)}/${encodeURIComponent(job.name)}` }),
    transformResponse: async (response): Promise<JobPodsRoute['Reply']> => await response.json()
  }),

  podLogs: route({
    request: (pod: {
      namespace: string
      name: string
    }, options?: {
      pretty?: boolean
    }) => {
      const searchParams = new URLSearchParams()
      if (options?.pretty != null) {
        searchParams.set('pretty', options.pretty.toString())
      }
      return {
        url: `pod-logs/${encodeURIComponent(pod.namespace)}/${encodeURIComponent(pod.name)}?${searchParams.toString()}`
      }
    },
    transformResponse: async (response): Promise<PodLogsRoute['Reply']> => await response.text()
  }),

  podProgress: route({
    request: (pod: {
      namespace: string
      name: string
    }) => ({ url: `pod-progress/${encodeURIComponent(pod.namespace)}/${encodeURIComponent(pod.name)}` }),
    transformResponse: async (response): Promise<PodProgressRoute['Reply']> => await response.json()
  }),

  triggerJob: route({
    request: (options: TriggerJobOptions) => ({ url: 'trigger', method: 'POST', body: options }),
    transformResponse: async (response): Promise<TriggerRoute['Reply']> => await response.json()
  })
}
