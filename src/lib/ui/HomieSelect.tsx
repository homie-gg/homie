import React from 'react'
import ReactSelect, {
  components,
  ControlProps,
  PlaceholderProps,
  MultiValueRemoveProps,
  SingleValueProps,
  MenuProps,
  Props as ReactSelectProps,
} from 'react-select'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import styles from './HomieSelect.module.scss'
import SelectChevronDownIcon from '@/lib/ui/SelectChevronDownIcon'

export type Option = {
  value?: string | undefined
  label?: string | undefined
}

type Props = {
  controlClassName?: string
  icon?: React.ReactNode
  showIndicator?: boolean
} & ReactSelectProps<
  {
    value?: string | undefined
    label?: string | undefined
  },
  boolean,
  any
>

const Menu = ({ className, ...props }: MenuProps<Option>) => {
  return (
    <components.Menu
      className={clsx(styles['select-menu'], className)}
      {...props}
    >
      {props.children}
    </components.Menu>
  )
}

const Control = ({
  className,
  children,
  ...props
}: ControlProps<Option, boolean>) => {
  // @ts-ignore
  const { controlClassName = '', icon = null } = props.selectProps

  return (
    <components.Control
      className={clsx(className, controlClassName, styles['select-control'])}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </components.Control>
  )
}

const Placeholder = ({
  className,
  ...props
}: PlaceholderProps<Option, false>) => (
  <components.Placeholder
    className={clsx(className, styles['select-placeholder'])}
    {...props}
  />
)

const IndicatorsContainer = () => {
  return (
    <span className={styles['select-indicator']}>
      <SelectChevronDownIcon />
    </span>
  )
}

const SingleValue = ({
  children,
  className,
  ...props
}: SingleValueProps<Option>) => (
  <components.SingleValue
    className={clsx(styles['single-value'], className)}
    {...props}
  >
    {children}
  </components.SingleValue>
)

const MultiValueRemove = ({
  children: _children,
  ...props
}: MultiValueRemoveProps<Option>) => (
  <components.MultiValueRemove {...props}>
    <span className="w-full h-full inline-flex items-center justify-center bg-primary-light text-primary cursor-pointer py-1 px-1.5 rounded-r">
      <XIcon className="w-3 h-auto" />
    </span>
  </components.MultiValueRemove>
)

const Select: React.FC<Props> = ({
  id,
  className,
  controlClassName = '',
  icon,
  showIndicator = true,
  ...props
}) => {
  return (
    <ReactSelect
      components={{
        Menu,
        Control,
        Placeholder,
        IndicatorsContainer: showIndicator ? IndicatorsContainer : () => <></>,
        SingleValue,
        MultiValueRemove,
      }}
      styles={{
        multiValueLabel: (base) => ({
          ...base,
          color: 'hsl(var(--primary))',
          fontSize: '14px',
          backgroundColor: 'hsl(var(--primary-light))',
        }),
        multiValueRemove: (base) => ({
          ...base,
          padding: '0px',
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: 'hsl(var(--primary))',
          fontSize: '16px',
          lineHeight: '20px',
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 8,
        colors: {
          ...theme.colors,
          primary: 'hsl(var(--secondary))',
        },
      })}
      {...(id ? { inputId: id } : {})}
      className={clsx(styles.select, className)}
      // @ts-ignore
      icon={icon}
      controlClassName={controlClassName}
      {...props}
    />
  )
}

export default Select
