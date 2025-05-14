/**
 * Mutex Utility
 *
 * This file provides utilities for handling concurrent operations in an asynchronous context.
 * It includes a string-based mutex implementation and a method decorator for easy application
 * of mutual exclusion to class methods.
 *
 * The primary use case is for WebSocket subscriptions and API requests where we need to ensure
 * that operations for the same resource (identified by a string ID) are properly sequenced.
 *
 * @author https://github.com/nas156
 * @organization Gainium (https://github.com/Gainium)
 * @license MIT
 */

/**
 * Mutex implementation for managing concurrent access to resources based on string identifiers.
 * This utility helps prevent race conditions in async operations by ensuring that operations
 * with the same ID are executed sequentially.
 */
export class IdMutex {
  private lockMap: Map<string, { queue: Array<() => void>; locked: boolean }> =
    new Map()

  /**
   * Acquires a lock for the specified ID
   *
   * @param id - Unique identifier for the resource to lock
   * @returns Promise that resolves when the lock is acquired
   */
  lock(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.lockMap.get(id)?.locked) {
        this.lockMap.get(id)?.queue.push(resolve)
      } else {
        if (!this.lockMap.get(id)) {
          this.lockMap.set(id, { queue: [], locked: true })
        }
        const get = this.lockMap.get(id)
        if (get) {
          get.locked = true
        }
        resolve()
      }
    })
  }

  /**
   * Releases a lock for the specified ID and resolves the next queued promise if any
   *
   * @param id - Unique identifier for the resource to unlock
   */
  release(id: string) {
    const resolve = this.lockMap.get(id)?.queue.shift()
    if (resolve) {
      resolve()
    } else {
      this.lockMap.delete(id)
    }
  }

  /**
   * Clears all locks and queued operations
   */
  clear() {
    this.lockMap = new Map()
  }
}

/**
 * Method decorator that provides mutual exclusion for class methods based on a generated ID.
 * Ensures that methods with the same computed ID cannot execute concurrently.
 *
 * @param mutex - The mutex instance to use for locking
 * @param getId - Function that generates a unique ID from the method arguments
 * @returns Method decorator function
 * @example
 * ```typescript
 * // Example usage:
 * class ApiClient {
 *   private mutex = new IdMutex();
 *
 *   @IdMute(mutex, (symbol) => `subscribe_${symbol}`)
 *   async subscribe(symbol: string) {
 *     // This method cannot be called concurrently with the same symbol
 *   }
 * }
 * ```
 */
export function IdMute(mutex: IdMutex, getId: (...args: any[]) => string) {
  return (
    _target: unknown,
    _propertyKey: PropertyKey,
    descriptor: PropertyDescriptor,
  ) => {
    const fn = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      const id = getId(...args)
      return mutex
        .lock(id)
        .then(() => fn.apply(this, args))
        .then((res) => {
          mutex.release(id)
          return res
        })
        .catch((e) => {
          mutex.release(id)
          throw e
        })
    }
  }
}
