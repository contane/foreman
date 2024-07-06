import { CronJobController } from './controllers/cronjob.js'
import { JobController } from './controllers/job.js'
import { PodController } from './controllers/pod.js'
import { KubernetesApi } from './kubernetes/api.js'
import { LogsController } from './controllers/logs.js'
import { TriggerController } from './controllers/trigger.js'
import { BackendConfig } from './index.js'

export interface Controllers {
  cronJobController: CronJobController
  jobController: JobController
  podController: PodController
  logsController: LogsController
  triggerController: TriggerController
}

export function createControllers (k8s: KubernetesApi, config: BackendConfig): Controllers {
  const cronJobController = new CronJobController(k8s, config.cronJob)
  const jobController = new JobController(k8s, cronJobController)
  const podController = new PodController(k8s, jobController)
  const logsController = new LogsController(k8s, podController)
  const triggerController = new TriggerController(k8s, cronJobController, jobController)

  return {
    cronJobController,
    jobController,
    podController,
    logsController,
    triggerController
  }
}
