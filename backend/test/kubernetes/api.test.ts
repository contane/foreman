import pino from 'pino'
import { KubernetesApi } from '../../src/kubernetes/api.js'
import { HttpError, KubeConfig, V1CronJob } from '@kubernetes/client-node'
import assert from 'node:assert'
import { fastify, FastifyInstance } from 'fastify'

function assertEqualResources (actual: any, expected: any): void {
  // Check for deep strict equality but ignore undefined values
  const a = JSON.parse(JSON.stringify(actual))
  const e = JSON.parse(JSON.stringify(expected))
  assert.deepStrictEqual(a, e)
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
          server: `http://127.0.0.1:${testPort}`
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
          name: 'test-user'
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
      _mockApi = fastify()
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
          assert.ok(err instanceof HttpError)
          assert.deepStrictEqual(Object.keys(err), ['response', 'body', 'statusCode', 'name'])
          assert.strictEqual(err.response, undefined)
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
          assert.ok(err instanceof HttpError)
          assert.deepStrictEqual(Object.keys(err), ['response', 'body', 'statusCode', 'name'])
          assert.strictEqual(err.response, undefined)
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
          assert.ok(err instanceof HttpError)
          assert.deepStrictEqual(Object.keys(err), ['response', 'body', 'statusCode', 'name'])
          assert.strictEqual(err.response, undefined)
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
          assert.ok(err instanceof HttpError)
          assert.deepStrictEqual(Object.keys(err), ['response', 'body', 'statusCode', 'name'])
          assert.strictEqual(err.response, undefined)
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
          assert.ok(err instanceof HttpError)
          assert.deepStrictEqual(Object.keys(err), ['response', 'body', 'statusCode', 'name'])
          assert.strictEqual(err.response, undefined)
        }
      })
    })
  })
})
