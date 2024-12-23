import { pino } from 'pino'
import { KubernetesApi } from '../../src/kubernetes/api.js'
import { ApiException, KubeConfig, V1CronJob } from '@kubernetes/client-node'
import assert from 'node:assert'
import { fastify, type FastifyInstance } from 'fastify'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TLS_CERT_PATH = path.join(__dirname, '..', 'fixtures', 'cert.pem')
const TLS_KEY_PATH = path.join(__dirname, '..', 'fixtures', 'key.pem')

const TEST_TOKEN = 'foreman-k8s-token'

function assertEqualResources (actual: any, expected: any): void {
  // Check for deep strict equality but ignore undefined values
  const a = JSON.parse(JSON.stringify(actual))
  const e = JSON.parse(JSON.stringify(expected))
  assert.deepStrictEqual(a, e)
}

function assertNoSensitiveData (thing: unknown): void {
  const seen = new Set()

  // Recursively check for sensitive data in an object/array.
  // Specifically, this looks for the Authorization header and its value.
  const recurse = (value: unknown, path: string): void => {
    if (seen.has(value)) {
      return
    }
    seen.add(value)
    if (typeof value === 'object' && value != null) {
      for (const key in value) {
        if (key.toLowerCase() === 'authorization') {
          assert.fail(`Sensitive data found at ${path}.${key}`)
        }
        recurse((value as any)[key], `${path}.${key}`)
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => recurse(item, `${path}[${i}]`))
    } else if (typeof value === 'string') {
      if (value.toLowerCase().includes('authorization') || value.includes(TEST_TOKEN)) {
        assert.fail(`Sensitive data found at ${path}`)
      }
    }
  }

  recurse(thing, '')

  // Be extra sure by checking the stringified version for the auth token
  const str = JSON.stringify(thing)
  if (str.includes(TEST_TOKEN)) {
    assert.fail('Sensitive data found in stringified object')
  }
}

describe('kubernetes/api.ts', () => {
  describe('KubernetesApi', () => {
    const nullLog = pino({ level: 'silent' })

    const testPort = 56443

    const kubeConfig = new KubeConfig()
    kubeConfig.loadFromOptions({
      clusters: [
        {
          name: 'test-cluster',
          server: `https://127.0.0.1:${testPort}`,
          skipTLSVerify: true
        }
      ],
      contexts: [
        {
          name: 'test-context',
          cluster: 'test-cluster',
          user: 'test-user'
        }
      ],
      users: [
        {
          name: 'test-user',
          token: TEST_TOKEN
        }
      ],
      currentContext: 'test-context'
    })

    let _mockApi: FastifyInstance | undefined

    afterEach(async () => {
      await _mockApi?.close()
      _mockApi = undefined
    })

    async function mockApi (registerRoutes: (app: FastifyInstance) => void): Promise<void> {
      assert.strictEqual(_mockApi, undefined, 'mockApi() called twice')
      _mockApi = fastify({
        https: {
          cert: await readFile(TLS_CERT_PATH, 'utf8'),
          key: await readFile(TLS_KEY_PATH, 'utf8')
        }
      })
      registerRoutes(_mockApi)
      await _mockApi.listen({ host: '127.0.0.1', port: testPort })
    }

    describe('#getCronJob()', () => {
      it('returns the API resource', async () => {
        const resource = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob'
          }
        })
        await mockApi((app) => {
          app.get('/apis/batch/v1/namespaces/test-ns/cronjobs/test-cronjob', async () => resource)
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.getCronJob({ namespace: 'test-ns', name: 'test-cronjob' })
        assertEqualResources(result, resource)
      })

      it('returns undefined for 404 responses', async () => {
        await mockApi((app) => {
          app.get('/apis/batch/v1/namespaces/test-ns/cronjobs/test-cronjob', async (req, reply) => {
            return await reply.code(404).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.getCronJob({ namespace: 'test-ns', name: 'test-cronjob' })
        assert.strictEqual(result, undefined)
      })

      it('does not include sensitive data in thrown errors', async () => {
        await mockApi((app) => {
          app.get('/apis/batch/v1/namespaces/test-ns/cronjobs/test-cronjob', async (req, reply) => {
            return await reply.code(403).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        try {
          await api.getCronJob({ namespace: 'test-ns', name: 'test-cronjob' })
          assert.fail('Expected an error')
        } catch (err) {
          assertNoSensitiveData(err)
          assert.ok(err instanceof ApiException, 'Expected an ApiException')
        }
      })
    })

    describe('#getJobs()', () => {
      it('returns the API resources', async () => {
        const resource = {
          apiVersion: 'batch/v1',
          kind: 'JobList',
          items: [
            {
              apiVersion: 'batch/v1',
              kind: 'Job',
              metadata: {
                namespace: 'test-ns',
                name: 'test-job-1'
              }
            },
            {
              apiVersion: 'batch/v1',
              kind: 'Job',
              metadata: {
                namespace: 'test-ns',
                name: 'test-job-2'
              }
            }
          ]
        }
        await mockApi((app) => {
          app.get('/apis/batch/v1/namespaces/test-ns/jobs', async () => resource)
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.getJobs({ namespace: 'test-ns' })
        assertEqualResources(result, resource.items)
      })

      it('does not include sensitive data in thrown errors', async () => {
        await mockApi((app) => {
          app.get('/apis/batch/v1/namespaces/test-ns/jobs', async (req, reply) => {
            return await reply.code(403).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        try {
          await api.getJobs({ namespace: 'test-ns' })
          assert.fail('Expected an error')
        } catch (err) {
          assertNoSensitiveData(err)
          assert.ok(err instanceof ApiException, 'Expected an ApiException')
        }
      })
    })

    describe('#getPodsForJob()', () => {
      it('returns the API resources', async () => {
        const resource = {
          apiVersion: 'v1',
          kind: 'PodList',
          items: [
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                namespace: 'test-ns',
                name: 'test-pod-1'
              }
            },
            {
              apiVersion: 'v1',
              kind: 'Pod',
              metadata: {
                namespace: 'test-ns',
                name: 'test-pod-2'
              }
            }
          ]
        }
        await mockApi((app) => {
          app.get('/api/v1/namespaces/test-ns/pods', async (req, reply) => {
            assert.deepStrictEqual({ ...(req.query as any) }, {
              labelSelector: 'job-name=test-job'
            })
            return await reply.send(resource)
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.getPodsForJob({ namespace: 'test-ns', name: 'test-job' })
        assertEqualResources(result, resource.items)
      })

      it('does not include sensitive data in thrown errors', async () => {
        await mockApi((app) => {
          app.get('/api/v1/namespaces/test-ns/pods', async (req, reply) => {
            return await reply.code(403).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        try {
          await api.getPodsForJob({ namespace: 'test-ns', name: 'test-job' })
          assert.fail('Expected an error')
        } catch (err) {
          assertNoSensitiveData(err)
          assert.ok(err instanceof ApiException, 'Expected an ApiException')
        }
      })
    })

    describe('#getPodLogs()', () => {
      it('returns the string', async () => {
        const resource = 'test-log'
        await mockApi((app) => {
          app.get('/api/v1/namespaces/test-ns/pods/test-pod/log', async () => resource)
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.getPodLogs({ namespace: 'test-ns', name: 'test-pod' })
        assert.strictEqual(result, resource)
      })

      it('does not include sensitive data in thrown errors', async () => {
        await mockApi((app) => {
          app.get('/api/v1/namespaces/test-ns/pods/test-pod/log', async (req, reply) => {
            return await reply.code(403).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        try {
          await api.getPodLogs({ namespace: 'test-ns', name: 'test-pod' })
          assert.fail('Expected an error')
        } catch (err) {
          assertNoSensitiveData(err)
          assert.ok(err instanceof ApiException, 'Expected an ApiException')
        }
      })
    })

    describe('#triggerCronJob()', () => {
      it('creates a job from the CronJob spec', async () => {
        const cronJob = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob'
          },
          spec: {
            jobTemplate: {
              metadata: {
                namespace: 'test-ns'
              },
              spec: {
                template: {
                  spec: {
                    containers: [
                      {
                        name: 'test-container',
                        image: 'test-image'
                      }
                    ]
                  }
                }
              }
            }
          }
        })
        const job = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'Job',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob-12345',
            annotations: {},
            labels: {}
          },
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: 'test-container',
                    image: 'test-image',
                    env: []
                  }
                ]
              }
            },
            ttlSecondsAfterFinished: 3600
          }
        })
        await mockApi((app) => {
          app.post('/apis/batch/v1/namespaces/test-ns/jobs', async (req) => {
            const body = req.body as any
            assertEqualResources(body, {
              ...job,
              apiVersion: undefined,
              kind: undefined
            })
            return job
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.triggerCronJob({
          cronJob,
          jobName: 'test-cronjob-12345',
          annotations: {},
          labels: {},
          env: {}
        })
        assertEqualResources(result, job)
      })

      it('sets annotations, labels, and env', async () => {
        const cronJob = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob'
          },
          spec: {
            jobTemplate: {
              metadata: {
                namespace: 'test-ns',
                annotations: {
                  'pre-existing-annotation': 'pre-existing-annotation-value'
                },
                labels: {
                  'pre-existing-label': 'pre-existing-label-value'
                }
              },
              spec: {
                template: {
                  spec: {
                    containers: [
                      {
                        name: 'test-container',
                        image: 'test-image',
                        env: [
                          {
                            name: 'PRE_EXISTING_ENV',
                            value: 'pre-existing-env-value'
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
          }
        })
        const job = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'Job',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob-12345',
            annotations: {
              'pre-existing-annotation': 'pre-existing-annotation-value',
              'test-annotation': 'test-value'
            },
            labels: {
              'pre-existing-label': 'pre-existing-label-value',
              'test-label': 'test-value'
            }
          },
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: 'test-container',
                    image: 'test-image',
                    env: [
                      {
                        name: 'PRE_EXISTING_ENV',
                        value: 'pre-existing-env-value'
                      },
                      {
                        name: 'TEST_ENV',
                        value: 'test-env-value'
                      }
                    ]
                  }
                ]
              }
            },
            ttlSecondsAfterFinished: 3600
          }
        })
        await mockApi((app) => {
          app.post('/apis/batch/v1/namespaces/test-ns/jobs', async (req) => {
            const body = req.body as any
            assertEqualResources(body, {
              ...job,
              apiVersion: undefined,
              kind: undefined
            })
            return job
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        const result = await api.triggerCronJob({
          cronJob,
          jobName: 'test-cronjob-12345',
          annotations: {
            'test-annotation': 'test-value'
          },
          labels: {
            'test-label': 'test-value'
          },
          env: {
            TEST_ENV: 'test-env-value'
          }
        })
        assertEqualResources(result, job)
      })

      it('does not include sensitive data in thrown errors', async () => {
        const cronJob = Object.assign(new V1CronJob(), {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          metadata: {
            namespace: 'test-ns',
            name: 'test-cronjob'
          },
          spec: {
            jobTemplate: {
              metadata: {
                namespace: 'test-ns'
              },
              spec: {
                template: {
                  spec: {
                    containers: []
                  }
                }
              }
            }
          }
        })
        await mockApi((app) => {
          app.post('/apis/batch/v1/namespaces/test-ns/jobs', async (req, reply) => {
            return await reply.code(403).send({})
          })
        })
        const api = await KubernetesApi.create(nullLog, { kubeConfig })
        try {
          await api.triggerCronJob({
            cronJob,
            jobName: 'test-cronjob-12345',
            annotations: {},
            labels: {},
            env: {}
          })
          assert.fail('Expected an error')
        } catch (err) {
          assertNoSensitiveData(err)
          assert.ok(err instanceof ApiException, 'Expected an ApiException')
        }
      })
    })
  })
})
