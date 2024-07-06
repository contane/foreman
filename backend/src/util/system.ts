// If the memory constraint is reported to be > 1 TB, it is likely that the process is not constrained.
const MAX_CONSTRAINED_MEMORY = 1024 * 1024 * 1024 * 1024

/**
 * Returns the available memory in bytes if the process is constrained, otherwise undefined.
 *
 * @param reserve The amount of memory to subtract from the available memory for other purposes.
 */
export function getAvailableMemory (reserve = 0): number | undefined {
  // Note: process.constrainedMemory() returns UINT64_MAX if the process is not constrained.
  // See https://docs.libuv.org/en/v1.x/misc.html#c.uv_get_constrained_memory
  // It is important that we don't return a gigantic number here, as the scrypt algorithm doesn't allow it.
  const constrainedMemory = process.constrainedMemory()
  if (constrainedMemory != null && constrainedMemory > 0 && constrainedMemory <= MAX_CONSTRAINED_MEMORY) {
    const memoryUsage = process.memoryUsage.rss()
    return Math.max(0, constrainedMemory - memoryUsage - reserve)
  }
  return undefined
}
