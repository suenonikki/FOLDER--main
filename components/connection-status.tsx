"use client"

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdate: Date | null
}

export function ConnectionStatus({ isConnected, lastUpdate }: ConnectionStatusProps) {
  const formatLastUpdate = () => {
    if (!lastUpdate) return "Never"
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      isConnected 
        ? "bg-green-500/10 border-green-500/30" 
        : "bg-amber-500/10 border-amber-500/30"
    }`}>
      <div className={`relative w-3 h-3 ${isConnected ? "bg-green-500" : "bg-amber-500"} rounded-full`}>
        {isConnected && (
          <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isConnected ? "text-green-400" : "text-amber-400"}`}>
          {isConnected ? "Arduino IDE Connected" : "Arduino IDE Disconnected"}
        </p>
        <p className="text-xs text-muted-foreground">
          Last update: {formatLastUpdate()}
        </p>
      </div>
      {!isConnected && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          Connect your Arduino to see real-time data
        </div>
      )}
    </div>
  )
}
