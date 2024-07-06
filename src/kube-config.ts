import k8s from '@kubernetes/client-node'
import { Config } from './config.js'
import { BaseLogger } from 'pino'

export function loadKubeConfig (log: BaseLogger, config: Config): k8s.KubeConfig {
  const from = config.kubeConfig.source
  log.info('kubeconfig_load', { from })

  const kubeConfig = kubeConfigFromSource(from)
  validateKubeConfig(kubeConfig)

  // set the current context if specified
  const context: string | undefined = config.kubeConfig.context
  if (context != null) {
    log.info({ context }, 'kubeconfig_set_context')
    if (kubeConfig.getContextObject(context) == null) {
      throw new Error(`Unknown KubeConfig context: "${context}"`)
    }
    kubeConfig.setCurrentContext(context)
  }

  log.info({ context: kubeConfig.getCurrentContext() satisfies string }, 'kubeconfig_loaded')

  return kubeConfig
}

function kubeConfigFromSource (source: Config['kubeConfig']['source']): k8s.KubeConfig {
  const kubeConfig = new k8s.KubeConfig()

  switch (source) {
    case 'file':
      kubeConfig.loadFromDefault()
      return kubeConfig
    case 'in-cluster':
      kubeConfig.loadFromCluster()
      return kubeConfig
  }
}

function validateKubeConfig (kubeConfig: k8s.KubeConfig): void {
  if (kubeConfig.getCurrentCluster() == null) {
    throw new Error('No current cluster in kubeconfig')
  }
  if (kubeConfig.getContexts().length === 0) {
    throw new Error('No contexts in kubeconfig')
  }
}
