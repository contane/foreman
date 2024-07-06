type Unlock = () => void

/**
 * Implementation of a mutex. Calling lock() will wait until the mutex is unlocked, then lock it and return a function
 * that can be called to unlock it again.
 */
export class Mutex {
  private currentPromise = Promise.resolve()

  async lock (): Promise<Unlock> {
    // Note about async functions, such as this one:
    // "Top-level code, up to and including the first await expression (if there is one), is run synchronously."
    // - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

    // Obtain a Promise that can be resolved at a later time.
    let unlock: () => void
    const nextPromise = new Promise<void>((resolve) => {
      unlock = () => resolve()
    })

    // currentPromise resolves when the previous lock holder unlocks the mutex, at which point we can lock it,
    // and return a function to unlock it again.
    const returnedPromise = this.currentPromise.then(() => unlock)

    // Once lock() has been called, the caller is in queue to get the lock, and subsequent calls must wait for it.
    this.currentPromise = nextPromise

    return await returnedPromise
  }
}
