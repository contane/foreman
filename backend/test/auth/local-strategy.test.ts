import { makeLocalStrategy } from '../../src/auth/local-strategy.js'
import assert from 'node:assert'

describe('auth/local-strategy.ts', () => {
  describe('makeLocalStrategy()', () => {
    it('has name "local"', async () => {
      const strategy = await makeLocalStrategy({ username: 'admin', password: 'password' })
      assert.strictEqual(strategy.name, 'local')
    })

    it('denies access if the admin user has no password', async () => {
      const mockRequest = {
        body: {
          username: 'admin',
          password: ''
        }
      }
      const strategy = await makeLocalStrategy({ username: 'admin', password: '' })
      const promise = new Promise<void>((resolve, reject) => {
        strategy.fail = () => resolve()
        strategy.success = () => reject(new Error('should not have succeeded'))
      })
      strategy.authenticate(mockRequest as any)
      await promise
    })

    it('denies access if the username is incorrect', async () => {
      const mockRequest = {
        body: {
          username: 'aaaaa',
          password: 'password'
        }
      }
      const strategy = await makeLocalStrategy({ username: 'admin', password: 'password' })
      const promise = new Promise<void>((resolve, reject) => {
        strategy.fail = () => resolve()
        strategy.success = () => reject(new Error('should not have succeeded'))
      })
      strategy.authenticate(mockRequest as any)
      await promise
    })

    it('denies access if the password is incorrect', async () => {
      const mockRequest = {
        body: {
          username: 'admin',
          password: 'wrongpassword'
        }
      }
      const strategy = await makeLocalStrategy({ username: 'admin', password: 'password' })
      const promise = new Promise<void>((resolve, reject) => {
        strategy.fail = () => resolve()
        strategy.success = () => reject(new Error('should not have succeeded'))
      })
      strategy.authenticate(mockRequest as any)
      await promise
    })

    it('allows access if the username and password are correct', async () => {
      const mockRequest = {
        body: {
          username: 'admin',
          password: 'password'
        }
      }
      const strategy = await makeLocalStrategy({ username: 'admin', password: 'password' })
      const promise = new Promise<void>((resolve, reject) => {
        strategy.fail = () => reject(new Error('should not have failed'))
        strategy.success = (user, info) => {
          assert.deepStrictEqual(user, {
            strategy: 'local',
            username: 'admin',
            createdAt: user.createdAt
          })
          assert.ok(Math.abs(user.createdAt - Date.now()) < 1000)
          assert.strictEqual(info, undefined)
          resolve()
        }
      })
      strategy.authenticate(mockRequest as any)
      await promise
    })
  })
})
