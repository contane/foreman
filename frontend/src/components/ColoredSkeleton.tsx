import { FunctionComponent } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export const ColoredSkeleton: FunctionComponent<{
  className?: string
  width?: string | number
}> = (props) => {
  return (
    <Skeleton width={props.width} className={props.className} baseColor='#353639' highlightColor='#43454a' />
  )
}
