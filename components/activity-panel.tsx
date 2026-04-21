'use client'

import { useState } from 'react'

interface ActivityLog {
  id: string
  activity_type: string
  flow_rate_avg: number | null
  duration_minutes: number | null
  total_water_ml: number | null
  notes: string | null
  created_at: string
}

interface ActivityPanelProps {
  activityLogs: ActivityLog[]
  flowRate: number | null | undefined
  arduinoConnected: boolean
  onLogActivity: (data: {
    activity_type: string
    flow_rate_avg: number | null
    duration_minutes: number | null
    total_water_ml: number | null
    notes: string | null
  }) => Promise<{ error: unknown }>
}

const activityTypes = [
  'Training',
  'Competition',
  'Recovery',
  'Warm-up',
  'Cool-down',
  'Rest',
]

export default function ActivityPanel({ 
  activityLogs, 
  flowRate, 
  arduinoConnected,
  onLogActivity 
}: ActivityPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    activity_type: 'Training',
    duration_minutes: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Activity is based on flow rate, not manual water intake
    const { error } = await onLogActivity({
      activity_type: formData.activity_type,
      flow_rate_avg: arduinoConnected ? flowRate ?? null : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      total_water_ml: null, // Will be calculated from flow rate sensor
      notes: formData.notes || null,
    })

    if (!error) {
      setFormData({ activity_type: 'Training', duration_minutes: '', notes: '' })
      setShowForm(false)
    }
    setLoading(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          {showForm ? 'Cancel' : 'Log Activity'}
        </button>
      </div>

      {!arduinoConnected && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Connect your Arduino to automatically track flow rate during activities.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg bg-muted/30 border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Activity Type
            </label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {activityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="e.g., 30"
              className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {arduinoConnected && flowRate && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                Current Flow Rate: <span className="font-semibold">{flowRate.toFixed(1)} mL/min</span>
              </p>
              <p className="text-xs text-primary/70 mt-1">
                This will be recorded with your activity
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about your activity..."
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Activity'}
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activityLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activities logged yet. Start tracking your hydration journey!
          </p>
        ) : (
          activityLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">{log.activity_type}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(log.created_at)} at {formatTime(log.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {log.duration_minutes && (
                  <span>{log.duration_minutes} min</span>
                )}
                {log.flow_rate_avg && (
                  <span className="text-primary">{log.flow_rate_avg.toFixed(1)} mL/min avg</span>
                )}
                {log.total_water_ml && (
                  <span className="text-accent">{log.total_water_ml.toFixed(0)} mL</span>
                )}
              </div>
              {log.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{log.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
