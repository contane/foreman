import { FunctionComponent, PropsWithChildren } from 'react'
import { Card } from './Card.js'

export const InfoCard: FunctionComponent<PropsWithChildren<{
  title: string
}>> = (props) => {
  return (
    <Card>
      <div className='text-sm text-gray-200'>{props.title}</div>
      <div className='mt-2 text-white-900 font-semibold'>{props.children}</div>
    </Card>
  )
}
