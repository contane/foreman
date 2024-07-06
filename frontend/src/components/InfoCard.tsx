import { FunctionComponent, PropsWithChildren } from 'react'
import { ColoredSkeleton } from './ColoredSkeleton.js'

export const InfoCard: FunctionComponent<PropsWithChildren<{
  title?: string
}>> = (props) => {
  return (
    <div className='mb-2 px-4 py-2 rounded bg-[#2b2d30]'>
      <dt className='text-sm text-gray-200'>{props.title ?? <ColoredSkeleton />}</dt>
      <dd className='mt-1 text-white-900 font-semibold'>{props.children ?? <ColoredSkeleton />}</dd>
    </div>
  )
}
