const VARIANTS = {
  confirmed: 'bg-green-100 text-green-800',
  pending:   'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700 line-through',
  completed: 'bg-slate-200 text-slate-700',
  blocked:   'bg-gray-200 text-gray-600',
  room:      'bg-blue-100 text-blue-800',
  desk:      'bg-violet-100 text-violet-800',
}

const LABELS = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
  blocked:   'Bloqueado',
  room:      'Sala',
  desk:      'Escritorio',
}

export default function Badge({ variant, label, className = '' }) {
  const cls = VARIANTS[variant] ?? 'bg-gray-100 text-gray-700'
  const text = label ?? LABELS[variant] ?? variant
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {text}
    </span>
  )
}
