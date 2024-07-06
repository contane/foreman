import assert from 'node:assert'

export interface Cache<T extends {}> {
  store: (key: string[], value: T) => void
  lookup: (key: string[]) => T | undefined
  invalidate: (key: string[]) => void
  lazyCompute: (key: string[], compute: () => PromiseLike<T | undefined>) => Promise<T | undefined>
}

interface CacheEntry<T> {
  readonly key: string[]
  readonly value: T
  readonly createdAt: number
}

abstract class BaseCache<T extends {}, TStored extends {}> implements Cache<T> {
  private readonly entries: Array<CacheEntry<TStored>> = []

  constructor (
    private readonly duration: number
  ) {
    assert.ok(duration > 0)
  }

  abstract store (key: string[], value: T): void

  abstract lookup (key: string[]): T | undefined

  invalidate (key: string[]): void {
    const index = this.findIndex(key)
    if (index != null) {
      this.entries.splice(index, 1)
    }
  }

  async lazyCompute (key: string[], compute: () => PromiseLike<T | undefined>): Promise<T | undefined> {
    const cached = this.lookup(key)
    if (cached != null) {
      return cached
    }
    const value = await compute()
    if (value == null) {
      return undefined
    }
    this.store(key, value)
    return value
  }

  protected baseStore (key: string[], value: TStored): void {
    const entry = {
      key,
      value,
      createdAt: Date.now()
    }
    const index = this.findIndex(key)
    if (index != null) {
      this.entries[index] = entry
    } else {
      this.entries.push(entry)
    }
  }

  protected baseLookup (key: string[]): TStored | undefined {
    const index = this.findIndex(key)
    return index != null ? this.entries[index].value : undefined
  }

  private findIndex (key: string[]): number | undefined {
    const now = Date.now()
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]
      // remove expired entries
      if (entry.createdAt + this.duration < now) {
        this.entries.splice(i, 1)
        i--
        continue
      }
      // find matching entry
      if (entry.key.length === key.length && entry.key.every((value, index) => value === key[index])) {
        return i
      }
    }
    return undefined
  }
}

/**
 * A cache implementation that stores entries in memory for a given duration.
 */
export class StrongCache<T extends {}> extends BaseCache<T, T> {
  override store (key: string[], value: T): void {
    super.baseStore(key, value)
  }

  override lookup (key: string[]): T | undefined {
    return super.baseLookup(key)
  }
}

/**
 * A cache implementation that stores weak references to entries in memory for a given duration.
 * This cache is useful for caching large objects that should be allowed to be garbage collected.
 */
export class WeakCache<T extends object> extends BaseCache<T, WeakRef<T>> {
  override store (key: string[], value: T): void {
    super.baseStore(key, new WeakRef(value))
  }

  override lookup (key: string[]): T | undefined {
    const value = super.baseLookup(key)
    return value?.deref()
  }
}
