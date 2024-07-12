import { FunctionComponent, PropsWithChildren } from 'react'
import clsx from 'clsx'

export const Card: FunctionComponent<PropsWithChildren<{
  className?: string
}>> = (props) => {
  return (
    <div className={clsx(
      'my-2 p-4 rounded bg-[#2b2d30]',
      props.className
    )}
    >
      {props.children}
    </div>
  )
}
