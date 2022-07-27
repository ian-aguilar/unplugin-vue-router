import {
  RouteLocationNormalizedLoaded,
  LocationQuery,
  Router,
  RouteRecordName,
  useRoute,
  useRouter,
} from 'vue-router'
import type { Ref, ToRefs } from 'vue'
import {
  createOrUpdateDataCacheEntry,
  DataLoaderCacheEntry,
  isCacheExpired,
  transferData,
} from './dataCache'
import { _RouteMapGeneric } from '../codegen/generateRouteMap'

export interface DefineLoaderOptions {
  /**
   * How long should we wait to consider the fetched data expired. Amount in ms. Defaults to 5 minutes. A value of 0
   * means no cache while a value of `Infinity` means cache forever.
   */
  cacheTime?: number
}

const DEFAULT_DEFINE_LOADER_OPTIONS: Required<DefineLoaderOptions> = {
  cacheTime: 1000 * 5,
  // cacheTime: 1000 * 60 * 5,
}

export interface DefineLoaderFn<T> {
  (route: RouteLocationNormalizedLoaded): T extends Promise<any>
    ? T
    : Promise<T>
}

export function defineLoader<P extends Promise<any>>(
  name: RouteRecordName,
  loader: DefineLoaderFn<P>,
  options?: DefineLoaderOptions
): DataLoader<Awaited<P>>
export function defineLoader<P extends Promise<any>>(
  loader: DefineLoaderFn<P>,
  options?: DefineLoaderOptions
): DataLoader<Awaited<P>>
export function defineLoader<P extends Promise<any>>(
  nameOrLoader: RouteRecordName | ((route: RouteLocationNormalizedLoaded) => P),
  _loaderOrOptions?: DefineLoaderOptions | DefineLoaderFn<P>,
  opts?: DefineLoaderOptions
): DataLoader<Awaited<P>> {
  // TODO: make it DEV only and remove the first argument in production mode
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<P>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts
  const options = { ...DEFAULT_DEFINE_LOADER_OPTIONS, ...opts }

  const dataLoader: DataLoader<Awaited<P>> = (() => {
    const route = useRoute()
    const entry = cache.get(useRouter())

    // TODO: is blocking

    // TODO: dev only
    // TODO: detect if this happens during HMR or if the loader is wrongly being used without being exported by a route we are navigating to
    if (!entry) {
      if (import.meta.hot) {
        // reload the page if the loader is new and we have no way to
        // TODO: test with webpack
        import.meta.hot.invalidate()
      }
      // with HMR, if the user changes the script section, there is a new cache entry
      // we need to transfer the old cache and call refresh
      throw new Error('No cache entry: reloading the page')
    }

    const { data, pending, error } = entry

    function refresh() {
      pending.value = true
      error.value = null
      return loader(route)
        .then((_data) => {
          transferData(entry!, _data)
        })
        .catch((err) => {
          error.value = err
        })
        .finally(() => {
          pending.value = false
        })
    }

    function invalidate() {
      entry!.when = 0
    }

    const commonData: _DataLoaderResult = {
      pending,
      error,
      refresh,
      invalidate,
    }

    return Object.assign(commonData, data)
  }) as DataLoader<Awaited<P>>

  const cache = new WeakMap<Router, DataLoaderCacheEntry<Awaited<P>>>()

  let pendingPromise: Promise<void> | undefined | null
  // add the context as one single object
  dataLoader._ = {
    loader,
    cache,
    load(route, router) {
      let entry = cache.get(router)

      const isDifferentRoute = needsToFetchAgain(entry, route)

      // the request was already made
      if (pendingPromise && !needsToFetchAgain) return pendingPromise

      if (
        !entry ||
        // TODO: isExpired time
        // TODO: pass settings to isExpired so we can also have a never-cache option
        isCacheExpired(entry, options) ||
        isDifferentRoute
      ) {
        if (entry) {
          entry.pending.value = true
          entry.error.value = null
        }
        // TODO: ensure others useUserData() (loaders) can be called with a similar approach as pinia
        // TODO: error handling + refactor to do it in refresh
        const [trackedRoute, params, query] = trackRoute(route)
        const thisPromise = (pendingPromise = loader(trackedRoute)
          .then((data) => {
            if (pendingPromise === thisPromise) {
              entry = createOrUpdateDataCacheEntry(entry, data, params, query)
              cache.set(router, entry)
            }
          })
          .catch((err) => {
            if (entry) {
              entry.error.value = err
            }
            return Promise.reject(err)
          })
          .finally(() => {
            if (pendingPromise === thisPromise) {
              // if an error happen we still have no valid entry and therefor no cache to save
              // if (entry) {
              //   entry.paramReads = paramReads
              //   entry.queryReads = queryReads
              // }
              // reset the pending promise
              pendingPromise = null
              if (entry) {
                entry.pending.value = false
              }
            }
          }))

        return thisPromise
      }
      // this allows us to know that this was requested
      return (pendingPromise = Promise.resolve().finally(
        () => (pendingPromise = null)
      ))
    },
  }
  dataLoader[IsLoader] = true

  return dataLoader
}

function needsToFetchAgain(
  entry: DataLoaderCacheEntry<any> | undefined | null,
  route: RouteLocationNormalizedLoaded
) {
  return (
    entry &&
    (!includesParams(route.params, entry.params) ||
      !includesParams(route.query, entry.query))
  )
}

// FIXME: this exists in vue-router
/**
 * Returns true if `inner` is a subset of `outer`
 *
 * @param outer - the bigger params
 * @param inner - the smaller params
 */
function includesParams(
  outer: LocationQuery,
  inner: Partial<LocationQuery>
): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outerValue = outer[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false
    } else if (!innerValue || !outerValue) {
      // if one of them is undefined, we need to check if the other is undefined too
      if (innerValue !== outerValue) return false
    } else {
      if (
        !Array.isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      )
        return false
    }
  }

  return true
}

const IsLoader = Symbol()

export interface DataLoader<T> {
  (): _DataLoaderResult & ToRefs<T>

  [IsLoader]: true

  /**
   * Internal context for the loader.
   * @internal
   */
  _: _DataLoaderInternals<T>
}

/**
 * Holds internal state of a loader.
 *
 * @internal
 */
export interface _DataLoaderInternals<T> {
  // the loader passed to defineLoader
  loader: (route: RouteLocationNormalizedLoaded) => Promise<T>

  /**
   * Loads the data from the cache if possible, otherwise loads it from the loader and awaits it.
   */
  load: (route: RouteLocationNormalizedLoaded, router: Router) => Promise<void>

  /**
   * The data loaded by the loader associated with the router instance. As one router instance can only be used for one
   * app, it ensures the cache is not shared among requests.
   */
  cache: WeakMap<Router, DataLoaderCacheEntry<T>>
}

export interface _DataLoaderResult {
  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  // TODO: allow delaying pending? maybe

  /**
   * Error if there was an error.
   */
  error: Ref<any> // any is simply more convenient for errors

  /**
   * Refresh the data. Returns a promise that resolves when the data is refreshed.
   */
  refresh: () => Promise<void>

  /**
   * Invalidates the data so it is reloaded on the next request.
   */
  invalidate: () => void
}

export function isDataLoader(loader: any): loader is DataLoader<unknown> {
  return loader && loader[IsLoader]
}

function trackRoute(route: RouteLocationNormalizedLoaded) {
  const [params, paramReads] = trackReads(route.params)
  const [query, queryReads] = trackReads(route.query)
  return [
    {
      ...route,
      params,
      query,
    },
    paramReads,
    queryReads,
  ] as const
}

function trackReads<T extends Record<string, any>>(obj: T) {
  const reads: Partial<T> = {}
  return [
    new Proxy(obj, {
      get(target, p: Extract<keyof T, string>, receiver) {
        const value = Reflect.get(target, p, receiver)
        reads[p] = value
        return value
      },
    }),
    reads,
  ] as const
}
