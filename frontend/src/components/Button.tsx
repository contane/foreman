import { FunctionComponent, PropsWithChildren } from 'react'
import clsx from 'clsx'

export const Button: FunctionComponent<PropsWithChildren<{
  as?: 'button' | 'a'
  type?: 'button' | 'submit'
  href?: string
  disabled?: boolean
  onClick?: () => void
  title?: string
}>> = (props) => {
  if (props.as === 'a') {
    return (
      <a
        onClick={props.onClick}
        href={props.href}
        className={clsx(
          'inline-block px-8 py-2 rounded border-2 border-transparent select-none',
          props.disabled === true ? 'bg-gray-700' : 'bg-blue-700 hocus:border-blue-400'
        )}
        title={props.title}
      >
        {props.children}
      </a>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={clsx(
        'inline-block px-8 py-2 rounded border-2 border-transparent',
        props.disabled === true ? 'bg-gray-700' : 'bg-blue-700 hocus:border-blue-400'
      )}
      title={props.title}
    >
      {props.children}
    </button>
  )
}
