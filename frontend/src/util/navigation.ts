import { useMediaQuery } from '@uidotdev/usehooks'

/**
 * A hook that returns whether the mobile navigation experience should be used.
 */
export function useMobileNavigation (): boolean {
  // 768px is the breakpoint for Tailwind's "md" screen size.
  // The negation (vs. using max-width) is intentional to match Tailwind when the screen is exactly 768px wide.
  return !useMediaQuery('only screen and (min-width: 768px)')
}
