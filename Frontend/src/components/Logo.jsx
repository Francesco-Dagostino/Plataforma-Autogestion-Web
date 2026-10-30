// Identidad "Jornada": una J construida con el trazo de un reloj y un cuadrado ámbar como marca de hora.
const MARK_PATH = 'M58 12H72V62A36 36 0 0 1 0 62H14A22 22 0 0 0 58 62Z'

// color: sobre fondo claro u oscuro (el azul se aclara solo en el tema oscuro)
// negative: sobre el azul de la marca | mono: una sola tinta (hereda el color del texto)
const variants = {
  color: { mark: 'var(--logo-mark)', square: '#F2A541', nameColor: 'var(--logo-mark)' },
  negative: { mark: '#FFFFFF', square: '#F2A541', nameColor: '#FFFFFF' },
  mono: { mark: 'currentColor', square: 'currentColor', nameColor: 'currentColor' },
}

export function LogoMark({ variant = 'color', height = 40, title }) {
  const colors = variants[variant] ?? variants.color
  const decorative = !title

  return (
    <svg
      width={(height * 84) / 100}
      height={height}
      viewBox="-6 4 84 100"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? 'true' : undefined}
      className="shrink-0"
    >
      <path d={MARK_PATH} style={{ fill: colors.mark }} />
      <rect x="0" y="40" width="14" height="14" style={{ fill: colors.square }} />
    </svg>
  )
}

// Isotipo + nombre. `markHeight` define el tamaño; el nombre se escala con él.
export function Logo({ variant = 'color', markHeight = 32, className = '' }) {
  const colors = variants[variant] ?? variants.color

  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: markHeight * 0.3 }}>
      <LogoMark variant={variant} height={markHeight} />
      <span
        className="font-bold leading-none"
        style={{ fontSize: markHeight * 0.72, letterSpacing: '-0.03em', color: colors.nameColor }}
      >
        Jornada
      </span>
    </span>
  )
}
