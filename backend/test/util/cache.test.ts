import { StrongCache, WeakCache } from '../../src/util/cache.js'
import assert from 'node:assert'
import { setTimeout as delay } from 'node:timers/promises'

describe('util/cache.ts', () => {
  describe('StrongCache', () => {
    it('returns undefined by default', () => {
      const cache = new StrongCache<string>(50)
      assert.strictEqual(cache.lookup([]), undefined)
      assert.strictEqual(cache.lookup(['key']), undefined)
      assert.strictEqual(cache.lookup(['foo', 'bar']), undefined)
    })

    it('stores and retrieves values', () => {
      const cache = new StrongCache<string>(50)
      cache.store([], '1337')
      cache.store(['key'], '1338')
      cache.store(['foo', 'bar'], '1339')
      cache.store(['foo', 'baz'], '1340')
      assert.strictEqual(cache.lookup([]), '1337')
      assert.strictEqual(cache.lookup(['key']), '1338')
      assert.strictEqual(cache.lookup(['foo', 'bar']), '1339')
      assert.strictEqual(cache.lookup(['foo', 'baz']), '1340')
    })

    it('expires values', async () => {
      const cache = new StrongCache<string>(100)
      cache.store(['foo'], '1337')
      await delay(50)
      cache.store(['bar'], '1338')
      assert.strictEqual(cache.lookup(['foo']), '1337')
      assert.strictEqual(cache.lookup(['bar']), '1338')
      await delay(75)
      assert.strictEqual(cache.lookup(['foo']), undefined)
      assert.strictEqual(cache.lookup(['bar']), '1338')
    })

    it('can be invalidated', () => {
      const cache = new StrongCache<string>(50)
      cache.store(['foo', 'bar'], '1337')
      cache.store(['foo', 'baz'], '1338')
      cache.invalidate(['foo', 'bar'])
      assert.strictEqual(cache.lookup(['foo', 'bar']), undefined)
      assert.strictEqual(cache.lookup(['foo', 'baz']), '1338')
      cache.invalidate(['something', 'else'])
      assert.strictEqual(cache.lookup(['foo', 'baz']), '1338')
    })

    describe('#lazyCompute()', () => {
      it('does not compute if cached', async () => {
        const cache = new StrongCache<string>(50)
        cache.store(['foo'], '1337')
        let computeCalled = false
        const foo = await cache.lazyCompute(['foo'], async () => {
          computeCalled = true
          return undefined
        })
        assert.strictEqual(foo, '1337')
        assert.strictEqual(computeCalled, false)
      })

      it('computes if not cached', async () => {
        const cache = new StrongCache<string>(50)
        let computeCalled = false
        const bar = await cache.lazyCompute(['bar'], async () => {
          computeCalled = true
          return '1338'
        })
        assert.strictEqual(bar, '1338')
        assert.strictEqual(computeCalled, true)
        // should store the computed value
        assert.strictEqual(cache.lookup(['bar']), '1338')
      })

      it('computes if expired', async () => {
        const cache = new StrongCache<string>(50)
        cache.store(['foo'], '1337')
        await delay(75)
        let computeCalled = false
        const foo = await cache.lazyCompute(['foo'], async () => {
          computeCalled = true
          return '1339'
        })
        assert.strictEqual(foo, '1339')
        assert.strictEqual(computeCalled, true)
        assert.strictEqual(cache.lookup(['foo']), '1339')
      })
    })
  })

  describe('WeakCache', () => {
    /*
     * Due to this class relying on garbage collection, the tests we can perform are limited.
     * It would be possible to run Node.js with the --expose-gc flag and manually trigger garbage collection,
     * but this might be unreliable.
     */

    it('stores and retrieves values', () => {
      // Keep each value referenced, so they are not garbage collected during the test :^)
      const cache = new WeakCache<{ foo: string }>(50)
      const entry1 = { foo: '1337' }
      const entry2 = { foo: '1338' }
      cache.store(['entry1'], entry1)
      cache.store(['entry2'], entry2)
      assert.strictEqual(cache.lookup(['entry1']), entry1)
      assert.strictEqual(cache.lookup(['entry2']), entry2)
    })

    it('expires values', async () => {
      const cache = new WeakCache<{ foo: string }>(50)
      const entry1 = { foo: '1337' }
      const entry2 = { foo: '1338' }
      cache.store(['entry1'], entry1)
      cache.store(['entry2'], entry2)
      await delay(75)
      assert.strictEqual(cache.lookup(['entry1']), undefined)
      assert.strictEqual(cache.lookup(['entry2']), undefined)
    })
  })
})
