"use client"

interface HydrationCardProps {
  flowRate: number | null
  waterConsumed: number
  dailyGoal: number
  isConnected: boolean
}

export function HydrationCard({ flowRate, waterConsumed, dailyGoal, isConnected }: HydrationCardProps) {
  const percentage = Math.min((waterConsumed / dailyGoal) * 100, 100)
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Hydration Level</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? "bg-green-500/20 text-green-400" 
            : "bg-muted text-muted-foreground"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
          {isConnected ? "Flow Monitor Active" : "Flow Monitor Offline"}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-52 h-52">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="104"
              cy="104"
              r="90"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="104"
              cy="104"
              r="90"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-500"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">
              {Math.round(waterConsumed)}
            </span>
            <span className="text-sm text-muted-foreground">/ {dailyGoal} ml</span>
            <span className="text-lg font-semibold text-primary mt-1">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Flow Rate Display */}
      <div className="mt-6 p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Flow Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {isConnected && flowRate !== null ? (
                <>
                  {flowRate.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">L/min</span>
                </>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Today&apos;s Goal</p>
          <p className="text-lg font-semibold text-foreground">{dailyGoal} ml</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-lg font-semibold text-foreground">{Math.max(0, dailyGoal - waterConsumed)} ml</p>
        </div>
      </div>
    </div>
  )
}
