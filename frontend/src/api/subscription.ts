import { useEffect } from 'react'
import { ApiRoute, FetchState, useApiFetcher } from './fetch.js'

export type ApiSubscriptionHook<T extends {}> = FetchState<T> & {
  loading: boolean
}

export interface SubscriptionOptions {
  interval?: number
}

/**
 * A hook for subscribing to an API route. This hook will send regular GET requests to keep the data up to date.
 * The route must be a nilpotent GET request.
 *
 * @param options Options for the subscription.
 * @param route The route to subscribe to.
 * @param args The arguments to pass to the route.
 * @returns An object with the current state of the request.
 */
export function useApiSubscription <T extends {}, Args extends unknown[]> (
  options: SubscriptionOptions,
  route: ApiRoute<T, Args>,
  ...args: Args
): ApiSubscriptionHook<T> {
  const fetcher = useApiFetcher<T>()

  const { url, method, body } = route.request(...args)

  const { fetch, reset } = fetcher

  // Start with empty data and error initially, and every time the arguments change.
  useEffect(() => {
    reset()
  }, [reset, route, url, method, body])

  // Subscribe to the route.
  useEffect(() => {
    // Prevent subscriptions to non-nilpotent routes.
    if (method != null && method !== 'GET') {
      return
    }
    let abortController: AbortController | undefined
    function update (): void {
      abortController?.abort()
      abortController = new AbortController()
      fetch({ url }, route, abortController.signal)
    }
    update()
    const interval = setInterval(update, options.interval ?? 60_000)
    return () => {
      abortController?.abort()
      clearInterval(interval)
    }
  }, [fetch, options.interval, route, url, method, body])

  const loading = fetcher.data == null && fetcher.error == null

  return { ...fetcher, loading }
}
