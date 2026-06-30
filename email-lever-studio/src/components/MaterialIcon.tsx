type MaterialIconProps = {
  name: string
  filled?: boolean
  className?: string
  size?: number
}

export function MaterialIcon({
  name,
  filled,
  className = '',
  size = 20,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  )
}
