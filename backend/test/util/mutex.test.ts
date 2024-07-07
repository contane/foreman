import { Mutex } from '../../src/util/mutex.js'
import assert from 'node:assert'

describe('util/mutex.ts', () => {
  describe('Mutex', () => {
    it('serializes access to a critical section', async () => {
      let locked = false
      const mutex = new Mutex()
      const unlock = await mutex.lock()
      locked = true
      setTimeout(() => {
        unlock()
        locked = false
      }, 100)
      const unlock2 = await mutex.lock()
      assert.strictEqual(locked, false)
      unlock2()
    })

    it('resolves in the order of lock calls', async () => {
      const mutex = new Mutex()
      let order = ''
      const promises: Array<Promise<any>> = []
      promises.push(mutex.lock().then((unlock) => {
        order += '1'
        setTimeout(unlock, 50)
      }))
      promises.push(mutex.lock().then((unlock) => {
        order += '2'
        setTimeout(unlock, 50)
      }))
      promises.push(mutex.lock().then((unlock) => {
        order += '3'
        setTimeout(unlock, 50)
      }))
      await Promise.all(promises)
      assert.strictEqual(order, '123')
    })
  })
})
