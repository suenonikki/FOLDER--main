'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Header from './header'
import SensorCard from './sensor-card'
import ActivityPanel from './activity-panel'
import ProfilePanel from './profile-panel'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  age: number | null
  weight: number | null
  height: number | null
  sport_type: string | null
  team_name: string | null
  avatar_url: string | null
}

interface SensorReading {
  id: string
  heart_rate: number | null
  body_temp: number | null
  flow_rate: number | null
  water_consumed: number | null
  device_connected: boolean
  recorded_at: string
}

interface ActivityLog {
  id: string
  activity_type: string
  flow_rate_avg: number | null
  duration_minutes: number | null
  total_water_ml: number | null
  notes: string | null
  created_at: string
}

interface DashboardClientProps {
  user: User
  profile: Profile | null
  latestSensor: SensorReading | null
  activityLogs: ActivityLog[]
}

export default function DashboardClient({ 
  user, 
  profile: initialProfile, 
  latestSensor: initialSensor,
  activityLogs: initialActivityLogs
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState(initialProfile)
  const [sensorData, setSensorData] = useState(initialSensor)
  const [activityLogs, setActivityLogs] = useState(initialActivityLogs)
  const [arduinoConnected, setArduinoConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard')

  // Simulate Arduino connection check
  const checkArduinoConnection = useCallback(async () => {
    // In production, this would check WebSocket/Serial connection to Arduino
    // For now, we check if there's a recent sensor reading (within last 30 seconds)
    if (sensorData && sensorData.device_connected) {
      const lastReading = new Date(sensorData.recorded_at)
      const now = new Date()
      const diffSeconds = (now.getTime() - lastReading.getTime()) / 1000
      setArduinoConnected(diffSeconds < 30)
    } else {
      setArduinoConnected(false)
    }
  }, [sensorData])

  useEffect(() => {
    checkArduinoConnection()
    const interval = setInterval(checkArduinoConnection, 5000)
    return () => clearInterval(interval)
  }, [checkArduinoConnection])

  // Subscribe to real-time sensor updates
  useEffect(() => {
    const channel = supabase
      .channel('sensor_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setSensorData(payload.new as SensorReading)
          setArduinoConnected(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id])

  // Subscribe to activity log updates
  useEffect(() => {
    const channel = supabase
      .channel('activity_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setActivityLogs(prev => [payload.new as ActivityLog, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleProfileUpdate = async (updatedProfile: Partial<Profile>) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null)
    }
    return { error }
  }

  const handleLogActivity = async (activityData: {
    activity_type: string
    flow_rate_avg: number | null
    duration_minutes: number | null
    total_water_ml: number | null
    notes: string | null
  }) => {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        ...activityData,
      })

    if (!error) {
      router.refresh()
    }
    return { error }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <SensorCard
                  title="Heart Rate"
                  value={arduinoConnected && sensorData?.heart_rate ? sensorData.heart_rate : null}
                  unit="BPM"
                  icon="heart"
                  connected={arduinoConnected}
                  color="destructive"
                />
                <SensorCard
                  title="Body Temperature"
                  value={arduinoConnected && sensorData?.body_temp ? sensorData.body_temp : null}
                  unit="°C"
                  icon="temperature"
                  connected={arduinoConnected}
                  color="orange"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <SensorCard
                  title="Flow Rate"
                  value={arduinoConnected && sensorData?.flow_rate ? sensorData.flow_rate : null}
                  unit="mL/min"
                  icon="flow"
                  connected={arduinoConnected}
                  color="primary"
                />
                <SensorCard
                  title="Total Water Consumed"
                  value={sensorData?.water_consumed ?? 0}
                  unit="mL"
                  icon="water"
                  connected={true}
                  color="accent"
                />
              </div>
              
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${arduinoConnected ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm font-medium text-foreground">
                    Arduino Status: {arduinoConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {!arduinoConnected && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Connect your Arduino device to see real-time heart rate and body temperature data.
                  </p>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <ActivityPanel 
                activityLogs={activityLogs}
                flowRate={sensorData?.flow_rate}
                arduinoConnected={arduinoConnected}
                onLogActivity={handleLogActivity}
              />
            </div>
          </div>
        ) : (
          <ProfilePanel 
            profile={profile}
            user={user}
            onUpdate={handleProfileUpdate}
          />
        )}
      </main>
    </div>
  )
}
