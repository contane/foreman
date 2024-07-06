import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { memo } from 'react'

/**
 * Use this component whenever you need an icon.
 *
 * This is simply a memoized (cached) version of FontAwesomeIcon for performance reasons.
 * FontAwesomeIcon is coded very inefficiently and each icon takes 1ms or longer PER RENDER.
 * With this component, the problem is reduced.
 */
const Icon = memo(FontAwesomeIcon)
export default Icon
