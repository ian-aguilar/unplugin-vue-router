
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

/// <reference types="unplugin-vue-router/client" />

import type {
  _RouterTyped,
  RouteRecordInfo,
  RouterLinkTyped,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  _ParamValue,
  _ParamValueOneOrMore,
  _ParamValueZeroOrMore,
  _ParamValueZeroOrOne,
} from 'unplugin-vue-router'

declare module '@vue-router/routes' {
  export interface RouteNamedMap {
    '/[...path]': RouteRecordInfo<'/[...path]', '/:path(.*)', { path: _ParamValue<true> }, { path: _ParamValue<false> }>,
    '/[name]': RouteRecordInfo<'/[name]', '/:name', { name: _ParamValue<true> }, { name: _ParamValue<false> }>,
    '/about': RouteRecordInfo<'/about', '/about', Record<never, never>, Record<never, never>>,
    '/articles': RouteRecordInfo<'/articles', '/articles', Record<never, never>, Record<never, never>>,
    '/articles/[id]+': RouteRecordInfo<'/articles/[id]+', '/articles/:id+', { id: _ParamValueOneOrMore<true> }, { id: _ParamValueOneOrMore<false> }>,
    '/articles/[id]': RouteRecordInfo<'/articles/[id]', '/articles/:id', { id: _ParamValue<true> }, { id: _ParamValue<false> }>,
    '/articles/': RouteRecordInfo<'/articles/', '/articles/', Record<never, never>, Record<never, never>>,
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/multiple-[a]-[b]-params': RouteRecordInfo<'/multiple-[a]-[b]-params', '/multiple-:a-:b-params', { a: _ParamValue<true>, b: _ParamValue<true> }, { a: _ParamValue<false>, b: _ParamValue<false> }>,
    '/my-optional-[[slug]]': RouteRecordInfo<'/my-optional-[[slug]]', '/my-optional-:slug?', { slug?: _ParamValueZeroOrOne<true> }, { slug?: _ParamValueZeroOrOne<false> }>,
    '/partial-[name]': RouteRecordInfo<'/partial-[name]', '/partial-:name', { name: _ParamValue<true> }, { name: _ParamValue<false> }>,
    '/users/[id]': RouteRecordInfo<'/users/[id]', '/users/:id', { id: _ParamValue<true> }, { id: _ParamValue<false> }>,
    '/users/edit': RouteRecordInfo<'/users/edit', '/users/edit', Record<never, never>, Record<never, never>>,
    '/users/': RouteRecordInfo<'/users/', '/users/', Record<never, never>, Record<never, never>>,
    '/n-[[n]]/': RouteRecordInfo<'/n-[[n]]/', '/n-:n?/', Record<never, never>, Record<never, never>>,
    '/n-[[n]]/[[more]]+/[final]': RouteRecordInfo<'/n-[[n]]/[[more]]+/[final]', '/n-:n?/:more*/:final', { final: _ParamValue<true> }, { final: _ParamValue<false> }>,
    '/n-[[n]]/[[more]]+/': RouteRecordInfo<'/n-[[n]]/[[more]]+/', '/n-:n?/:more*/', Record<never, never>, Record<never, never>>,
    '/deep/nesting/works/[[files]]+': RouteRecordInfo<'/deep/nesting/works/[[files]]+', '/deep/nesting/works/:files*', { files?: _ParamValueZeroOrMore<true> }, { files?: _ParamValueZeroOrMore<false> }>,
    '/deep/nesting/works/too': RouteRecordInfo<'/deep/nesting/works/too', '/deep/nesting/works/too', Record<never, never>, Record<never, never>>,
  }
}

declare module '@vue-router' {
  import type { RouteNamedMap } from '@vue-router/routes'

  export function useRoute<Name extends keyof RouteNamedMap = keyof RouteNamedMap>(name?: Name): RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[Name]

  export type RouterTyped = _RouterTyped<RouteNamedMap>
  export function useRouter(): RouterTyped
}

declare module 'vue' {
  import type { RouteNamedMap } from '@vue-router/routes'

  export interface GlobalComponents {
    RouterLink: RouterLinkTyped<RouteNamedMap>
  }
}
