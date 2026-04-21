'use client'

interface SensorCardProps {
  title: string
  value: number | null
  unit: string
  icon: 'heart' | 'temperature' | 'flow' | 'water'
  connected: boolean
  color: 'destructive' | 'orange' | 'primary' | 'accent'
}

const icons = {
  heart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  temperature: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  ),
  flow: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  water: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  ),
}

const colorClasses = {
  destructive: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-500',
  },
  primary: {
    bg: 'bg-primary/20',
    text: 'text-primary',
  },
  accent: {
    bg: 'bg-accent/20',
    text: 'text-accent',
  },
}

export default function SensorCard({ title, value, unit, icon, connected, color }: SensorCardProps) {
  const colorClass = colorClasses[color]
  
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClass.bg} flex items-center justify-center`}>
          <svg className={`w-6 h-6 ${colorClass.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </div>
        {!connected && (
          <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
            Offline
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      
      {connected && value !== null ? (
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${colorClass.text}`}>
            {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-muted-foreground">--</span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
      )}
      
      {!connected && icon !== 'water' && (
        <p className="mt-2 text-xs text-muted-foreground">
          Connect Arduino to view data
        </p>
      )}
    </div>
  )
}
