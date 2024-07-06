import { FunctionComponent } from 'react'
import clsx from 'clsx'

export const StatusDot: FunctionComponent<{
  status: 'success' | 'failure' | 'active' | undefined
}> = (props) => {
  if (props.status === 'active') {
    return (
      <span className='relative inline-block h-3 w-3'>
        <span className='absolute h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping' />
        <span className='absolute h-full w-full rounded-full bg-blue-500' />
      </span>
    )
  }

  return (
    <span className={clsx(
      'inline-block rounded-full h-3 w-3',
      props.status === 'success' && 'bg-green-500',
      props.status === 'failure' && 'bg-red-500',
      props.status == null && 'bg-gray-500 animate-pulse'
    )}
    />
  )
}
