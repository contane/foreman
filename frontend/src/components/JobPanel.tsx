import { FunctionComponent } from 'react'
import { StatusDot } from './StatusDot.js'
import { ColoredSkeleton } from './ColoredSkeleton.js'
import { Link } from 'react-router-dom'
import { DateTime } from 'luxon'
import { Annotation } from './Annotation.js'
import { faPaintRoller } from '@fortawesome/free-solid-svg-icons'

export const JobPanel: FunctionComponent<{
  namespace: string | undefined
  name: string | undefined
  manual: boolean
  status: 'success' | 'failure' | 'active' | undefined
  startTime: string | undefined
}> = (props) => {
  if (props.namespace == null || props.name == null) {
    return (
      <div className='block mb-2 p-4 bg-[#2b2d30] border-2 border-[#43454a] rounded'>
        <div className='flex items-center'>
          <StatusDot status={props.status} />
          <div className='ml-2 flex-1'>
            <ColoredSkeleton className='block' />
          </div>
        </div>
        <ColoredSkeleton />
      </div>
    )
  }

  return (
    <Link
      to={`/jobs/${props.namespace}/${props.name}`}
      className='block mb-2 p-4 bg-[#2b2d30] border-2 border-[#43454a] rounded hocus:border-white/25'
    >
      <div className='flex items-center'>
        <StatusDot status={props.status} />
        <span className='ml-2'>{props.namespace}/{props.name}</span>
      </div>
      <div className='text-gray-200 text-sm'>
        {props.startTime != null ? DateTime.fromISO(props.startTime).toRelative() : <ColoredSkeleton />}
        {props.manual && (
        <Annotation icon={faPaintRoller} text='Manual' />
        )}
      </div>
    </Link>
  )
}
