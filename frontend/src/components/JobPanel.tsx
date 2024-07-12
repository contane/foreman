import { FunctionComponent } from 'react'
import { StatusDot } from './StatusDot.js'
import { ColoredSkeleton } from './ColoredSkeleton.js'
import { DateTime } from 'luxon'
import { Annotation } from './Annotation.js'
import { faPaintRoller } from '@fortawesome/free-solid-svg-icons'
import { Card } from './Card.js'
import { LinkCard } from './LinkCard.js'

export const JobPanel: FunctionComponent<{
  namespace: string | undefined
  name: string | undefined
  manual: boolean
  status: 'success' | 'failure' | 'active' | undefined
  startTime: string | undefined
}> = (props) => {
  if (props.namespace == null || props.name == null) {
    return (
      <Card>
        <div className='flex items-center'>
          <StatusDot status={props.status} />
          <div className='ml-2 flex-1'>
            <ColoredSkeleton className='block' />
          </div>
        </div>
        <ColoredSkeleton />
      </Card>
    )
  }

  return (
    <LinkCard to={`/jobs/${props.namespace}/${props.name}`}>
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
    </LinkCard>
  )
}
