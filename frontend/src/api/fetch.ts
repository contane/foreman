import { useCallback, useState } from 'react'

export class ApiCallError extends Error {
  constructor (
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiCallError'
  }
}

export interface FetchTransform<T extends {}> {
  transformResponse: (response: Response) => PromiseLike<T>
  transformError?: (error: Error) => Error | T
}

export interface ApiRoute<T extends {}, Args extends unknown[]> extends FetchTransform<T> {
  request: (...args: Args) => RequestDescriptor
}

export interface RequestDescriptor {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  body?: object
}

export interface FetchState<T extends {}> {
  data: T | undefined
  error: Error | undefined
}

export type FetchHook<T extends {}> = FetchState<T> & {
  fetch: (req: RequestDescriptor, transform: FetchTransform<T>, signal: AbortSignal | undefined, cb?: () => void) => void
  reset: () => void
}

export function useApiFetcher <T extends {}> (): FetchHook<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: undefined,
    error: undefined
  })

  const fetch = useCallback<FetchHook<T>['fetch']>((req, transform, signal, cb) => {
    sendRequest(req, signal)
      .then(async (response): Promise<T> => {
        // the response is not an error
        return await transform.transformResponse(response)
      })
      .catch(async (error) => {
        // the response is an error, but may still become a valid response via the transform
        const transformed: T | Error = transform.transformError?.(error) ?? error
        if (transformed instanceof Error) {
          throw transformed
        }
        return transformed
      })
      .then(async (data) => {
        // all transforms are applied and the response is valid
        if (signal?.aborted === true) return
        setState((state) => ({
          ...state,
          data,
          error: undefined
        }))
      })
      .catch(async (error) => {
        // all transforms are applied and the response is an error
        if (signal?.aborted === true) return
        setState((state) => ({
          ...state,
          data: undefined,
          error
        }))
      })
      .finally(() => {
        cb?.()
      })
  }, [])

  const reset = useCallback<FetchHook<T>['reset']>(() => {
    setState({
      data: undefined,
      error: undefined
    })
  }, [])

  return { ...state, fetch, reset }
}

async function sendRequest (request: RequestDescriptor, signal?: AbortSignal): Promise<Response> {
  const { url, method, body } = request
  const init: RequestInit = { method, credentials: 'include', signal }
  if ((method === 'POST' || method === 'PUT') && body != null) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  const response = await fetch(`/api/${url}`, init)
  if (!response.ok) {
    throw await toApiCallError(response)
  }
  return response
}

async function toApiCallError (response: Response): Promise<Error> {
  const body = await response.json()
  if (typeof body?.error === 'string') {
    return new ApiCallError(response.status, body.error)
  }
  return new Error(`unknown error (status=${response.status})`)
}
