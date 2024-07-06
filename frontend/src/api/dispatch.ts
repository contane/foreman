import { ApiRoute, FetchState, useApiFetcher } from './fetch.js'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type ApiDispatchHook<T extends {}, Args extends unknown[]> = FetchState<T> & {
  dispatch: (...args: Args) => void
  inProgress: boolean
}

/**
 * A hook with a dispatch function that will send a request to the API and update the state with the response.
 * This hook is intended for requests that trigger actions or cause data to change on the server.
 *
 * @param route The route to dispatch to.
 * @returns An object with a dispatch method, and the current state of the request.
 */
export function useApiDispatch <T extends {}, Args extends unknown[]> (route: ApiRoute<T, Args>): ApiDispatchHook<T, Args> {
  const fetcher = useApiFetcher<T>()
  const [inProgress, setInProgress] = useState(false)

  // when the dispatch hook is unmounted, abort any pending requests
  const abortController = useMemo(() => new AbortController(), [])
  useEffect(() => {
    return () => {
      abortController.abort()
      setInProgress(false)
    }
  }, [abortController])

  const dispatch = useCallback<ApiDispatchHook<T, Args>['dispatch']>((...args) => {
    const { url, method, body } = route.request(...args)
    setInProgress(true)
    fetcher.fetch({ url, method, body }, route, abortController.signal, () => {
      setInProgress(false)
    })
  }, [fetcher, route, abortController])

  return { ...fetcher, dispatch, inProgress }
}
