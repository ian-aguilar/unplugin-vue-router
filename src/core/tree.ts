import type { Options } from '../options'
import { createTreeLeafValue } from './treeLeafValue'
import type { TreeLeafValue } from './treeLeafValue'
import { trimExtension } from './utils'
import { CustomRouteBlock } from './customBlock'

export class TreeLeaf {
  /**
   * value of the node
   */
  value: TreeLeafValue
  /**
   * children of the node
   */
  children: Map<string, TreeLeaf> = new Map()

  /**
   * Parent node.
   */
  parent?: TreeLeaf

  /**
   * Plugin options taken into account by the tree.
   */
  options: Options

  constructor(options: Options, filePath: string, parent?: TreeLeaf) {
    this.options = options
    this.parent = parent
    this.value = createTreeLeafValue(filePath, parent?.value)
  }

  /**
   * Adds a path to the tree
   *
   * @param path - route path of the file
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path) {
    const { tail, segment, viewName, isComponent } = splitFilePath(path)

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(this.options, segment, this))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.filePaths.set(viewName, filePath)
    }

    if (tail) {
      child.insert(tail, filePath)
    }
    return child
  }

  mergeCustomRouteBlock(routeBlock: CustomRouteBlock | undefined) {
    if (!routeBlock) return

    this.value.name = routeBlock.name
    if (routeBlock.path != null) {
      this.value.path = routeBlock.path
      this.value.pathSegment = routeBlock.path
    }
    this.value.meta = routeBlock.meta
  }

  getSortedChildren() {
    return Array.from(this.children.values()).sort((a, b) =>
      a.value.path.localeCompare(b.value.path)
    )
  }

  remove(path: string) {
    const { tail, segment, viewName, isComponent } = splitFilePath(path)

    const child = this.children.get(segment)
    if (!child) {
      throw new Error(
        `Cannot Delete "${path}". "${segment}" not found at "${this.value.path}".`
      )
    }

    if (tail) {
      child.remove(tail)
      // if the child doesn't create any route
      if (child.children.size === 0 && child.value.filePaths.size === 0) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      if (isComponent) {
        child.value.filePaths.delete(viewName)
      }
      // this is the file we wanted to remove
      if (child.children.size === 0 && child.value.filePaths.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  isRoot() {
    return this.value.path === '/' && !this.value.filePaths.size
  }

  toString(): string {
    return `${this.value}${
      this.value.filePaths.size
        ? ` 📄(${Array.from(this.value.filePaths.keys()).join('|')})`
        : ''
    }`
  }
}

export function createPrefixTree(options: Options) {
  return new TreeLeaf(options, '')
}

/**
 * Splits a path into by finding the first '/' and returns the tail and segment. If it has an extension, it removes it.
 * If it contains a named view, it returns the view name as well (otherwise it's default).
 *
 * @param filePath - filePath to split
 */
function splitFilePath(filePath: string) {
  const slashPos = filePath.indexOf('/')
  let head = slashPos < 0 ? filePath : filePath.slice(0, slashPos)
  const tail = slashPos < 0 ? '' : filePath.slice(slashPos + 1)

  let segment = head
  // only the last segment can be a filename with an extension
  if (!tail) {
    segment = trimExtension(head)
  }
  let viewName = 'default'

  const namedSeparatorPos = segment.indexOf('@')

  if (namedSeparatorPos > 0) {
    viewName = segment.slice(namedSeparatorPos + 1)
    segment = segment.slice(0, namedSeparatorPos)
  }

  const isComponent = segment !== head

  return {
    segment,
    tail,
    viewName,
    isComponent,
  }
}
