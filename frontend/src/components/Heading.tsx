import { FunctionComponent, PropsWithChildren } from 'react'

export const Heading: FunctionComponent<PropsWithChildren> = (props) => {
  return (
    <h1 className='text-3xl mb-4'>
      {props.children}
    </h1>
  )
}
