const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button className={`${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
