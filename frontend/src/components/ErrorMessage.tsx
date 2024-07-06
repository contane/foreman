import { FunctionComponent, PropsWithChildren } from 'react'

export const ErrorMessage: FunctionComponent<PropsWithChildren> = (props) => {
  return (
    <div className='my-4 p-4 bg-red-900 text-white rounded border-l-4 border-l-orange-600'>
      {props.children}
    </div>
  )
}
