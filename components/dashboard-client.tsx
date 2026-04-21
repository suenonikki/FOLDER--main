'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const DAILY_GOAL = 1000
const hydrationEmojis = ['💧', '🥤', '💦', '🚰', '🧊', '🌊']

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
}

interface SensorData {
  heart_rate: number | null
  body_temp: number | null
  flow_rate: number | null
  device_connected: boolean
}

interface ActivityLog {
  id: string
  time: string
  title: string
  details: string
}

interface FlowDataPoint {
  time: number
  flow: number
}

export default function DashboardClient({ user }: { user: User }) {
  const [activePage, setActivePage] = useState<'home' | 'activity' | 'profile'>('home')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [waterIntake, setWaterIntake] = useState(0)
  const [sensorData, setSensorData] = useState<SensorData>({
    heart_rate: null,
    body_temp: null,
    flow_rate: null,
    device_connected: false
  })
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0)
  const [emojiAnimating, setEmojiAnimating] = useState(false)
  const [waitingDots, setWaitingDots] = useState('')
  const [flowData, setFlowData] = useState<FlowDataPoint[]>([])
  const [showAlert, setShowAlert] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [editProfile, setEditProfile] = useState({
    first_name: '',
    last_name: '',
    age: '',
    weight: '',
    height: '',
    sport_type: '',
    team_name: ''
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setEditProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          sport_type: data.sport_type || '',
          team_name: data.team_name || ''
        })
      }
    }
    fetchProfile()
  }, [user.id, supabase])

  useEffect(() => {
    async function fetchSensorData() {
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
      const { data } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', thirtySecondsAgo)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) {
        setSensorData({
          heart_rate: data.heart_rate,
          body_temp: data.body_temp,
          flow_rate: data.flow_rate,
          device_connected: true
        })
        setFlowData(prev => {
          const newPoint = { time: Date.now(), flow: data.flow_rate || 0 }
          return [...prev, newPoint].slice(-13)
        })
      } else {
        setSensorData(prev => ({ ...prev, device_connected: false }))
      }
    }
    
    fetchSensorData()
    const interval = setInterval(fetchSensorData, 5000)
    return () => clearInterval(interval)
  }, [user.id, supabase])

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiAnimating(true)
      setTimeout(() => setCurrentEmojiIndex(prev => (prev + 1) % hydrationEmojis.length), 250)
      setTimeout(() => setEmojiAnimating(false), 500)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitingDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good Morning'
    if (hour >= 12 && hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const addActivity = useCallback((title: string, details: string) => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    setActivityLog(prev => [{
      id: crypto.randomUUID(),
      time: `Today, ${timeStr}`,
      title,
      details
    }, ...prev].slice(0, 10))
  }, [])

  const addWater = (amount: number) => {
    const oldValue = waterIntake
    const newValue = Math.max(0, Math.min(DAILY_GOAL, waterIntake + amount))
    setWaterIntake(newValue)
    
    if (amount > 0 && newValue > oldValue) {
      addActivity('Water Added', `Added ${newValue - oldValue}ml to daily intake`)
    } else if (amount < 0 && newValue < oldValue) {
      addActivity('Water Removed', `Removed ${oldValue - newValue}ml from daily intake`)
    }
    
    if (newValue >= DAILY_GOAL && oldValue < DAILY_GOAL) {
      setTimeout(() => addActivity('Goal Reached!', `Congratulations! You reached your ${DAILY_GOAL}ml daily goal`), 100)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: editProfile.first_name || null,
        last_name: editProfile.last_name || null,
        age: editProfile.age ? parseInt(editProfile.age) : null,
        weight: editProfile.weight ? parseFloat(editProfile.weight) : null,
        height: editProfile.height ? parseFloat(editProfile.height) : null,
        sport_type: editProfile.sport_type || null,
        team_name: editProfile.team_name || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        first_name: editProfile.first_name || null,
        last_name: editProfile.last_name || null,
        age: editProfile.age ? parseInt(editProfile.age) : null,
        weight: editProfile.weight ? parseFloat(editProfile.weight) : null,
        height: editProfile.height ? parseFloat(editProfile.height) : null,
        sport_type: editProfile.sport_type || null,
        team_name: editProfile.team_name || null
      } : null)
      addActivity('Profile Updated', 'Your profile information has been saved')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const percentage = Math.round((waterIntake / DAILY_GOAL) * 100)
  const flowTotal = flowData.reduce((sum, d) => sum + d.flow * 2, 0)
  const flowPercentage = Math.min(100, Math.round((flowTotal / DAILY_GOAL) * 100))
  const flowRemaining = Math.max(0, DAILY_GOAL - flowTotal)
  const flowEvents = flowData.filter(d => d.flow > 0).length

  const chartPoints = flowData.length > 0 
    ? flowData.map((d, i) => {
        const x = 50 + (i * (550 / Math.max(flowData.length - 1, 1)))
        const y = 120 - (d.flow / 100) * 110
        return `${x},${y}`
      }).join(' ')
    : ''
  
  const areaPoints = chartPoints && flowData.length > 1
    ? `50,120 ${chartPoints} ${50 + ((flowData.length - 1) * (550 / Math.max(flowData.length - 1, 1)))},120`
    : ''

  const inputStyle = "w-full px-4 py-3 border border-[#e0e0e0] rounded-xl text-sm bg-white text-[#333333] placeholder:text-[#999999] focus:outline-none focus:border-[#275CCC] focus:shadow-[0_0_0_3px_rgba(39,92,204,0.1)] transition-all"

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5E4CF' }}>
      <main className="pb-24">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {/* Top Navigation */}
          <div className="flex justify-between items-center mb-8 pb-3 border-b-2 border-[#275CCC]/10">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePage('home')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                  activePage === 'home'
                    ? 'bg-[#275CCC] text-[#F5E4CF] shadow-lg shadow-[#275CCC]/30'
                    : 'bg-white text-[#6b7280] hover:bg-[#275CCC] hover:text-[#F5E4CF] hover:-translate-y-0.5'
                }`}
              >
                Home
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActivePage('activity')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                  activePage === 'activity'
                    ? 'bg-[#275CCC] text-[#F5E4CF] shadow-lg shadow-[#275CCC]/30'
                    : 'bg-white text-[#6b7280] hover:bg-[#275CCC] hover:text-[#F5E4CF] hover:-translate-y-0.5'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActivePage('profile')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                  activePage === 'profile'
                    ? 'bg-[#275CCC] text-[#F5E4CF] shadow-lg shadow-[#275CCC]/30'
                    : 'bg-white text-[#6b7280] hover:bg-[#275CCC] hover:text-[#F5E4CF] hover:-translate-y-0.5'
                }`}
              >
                Profile
              </button>
            </div>
          </div>

          {/* HOME PAGE */}
          {activePage === 'home' && (
            <div className="animate-[fadeIn_0.3s_ease-in]">
              <div className="mb-8">
                <p className="text-sm text-[#6b7280] mb-1">{getGreeting()}, {profile?.first_name || 'User'}</p>
                <h1 className="text-2xl font-bold text-[#1a1a2e]">
                  Stay Hydrated{' '}
                  <span className={`inline-block ${emojiAnimating ? 'animate-[emojiSwap_0.5s_cubic-bezier(0.4,0,0.2,1)]' : ''}`}>
                    {hydrationEmojis[currentEmojiIndex]}
                  </span>
                </h1>
              </div>

              {showAlert && (
                <div className="flex gap-3 p-4 mb-6 rounded-2xl bg-[#275CCC]/10 animate-[slideIn_0.3s_ease-out]">
                  <div className="w-8 h-8 rounded-full bg-[#275CCC] flex items-center justify-center flex-shrink-0 text-lg">
                    {sensorData.device_connected ? '💧' : '📡'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#1a1a2e] mb-1">
                      {sensorData.device_connected ? 'Flow Sensor Active' : 'Flow Sensor Status'}
                    </div>
                    <div className="text-sm text-[#6b7280]">
                      {sensorData.device_connected 
                        ? `Flow detected: ${flowTotal}ml consumed. ${flowRemaining}ml remaining.`
                        : 'Awaiting flow sensor connection...'}
                    </div>
                  </div>
                  <button onClick={() => setShowAlert(false)} className="text-[#6b7280] hover:text-[#1a1a2e] text-2xl font-bold">×</button>
                </div>
              )}

              {/* Combined Card */}
              <div className="rounded-3xl p-6 shadow-lg mb-6 flex flex-col lg:flex-row gap-6" style={{ background: 'linear-gradient(to bottom, #d4edfc, #a8d4f5)' }}>
                <div className="lg:w-52 flex flex-col">
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-[#275CCC]">Water Intake</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">{waterIntake}ml</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#6b7280]">Goal</p>
                      <p className="font-semibold text-[#1a1a2e]">{DAILY_GOAL}ml</p>
                    </div>
                  </div>

                  <div className="relative w-32 h-52 mx-auto mb-4 rounded-2xl border-4 border-white/70 bg-white/30 shadow-inner overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 transition-all duration-700" style={{ height: `${percentage}%`, background: 'linear-gradient(to bottom, #5ba8e6, #275CCC)' }}>
                      <svg className="absolute -top-0.5 left-0 w-full h-4" viewBox="0 0 100 15" preserveAspectRatio="none">
                        <path d="M0,8 Q25,0 50,8 T100,8 L100,15 L0,15 Z" fill="#5ba8e6" style={{ animation: 'wave 2s ease-in-out infinite' }}/>
                      </svg>
                      <div className="absolute w-2 h-2 rounded-full bg-white/30 left-3 bottom-2" style={{ animation: 'float 2s ease-in-out infinite' }} />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 right-4 bottom-4" style={{ animation: 'float 2.5s ease-in-out infinite 0.5s' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white drop-shadow-md z-10">{percentage}%</div>
                  </div>

                  <div className="flex gap-4 justify-center items-center">
                    <button onClick={() => addWater(-100)} className="w-12 h-12 rounded-full bg-white/60 text-[#275CCC] text-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-transform">−</button>
                    <button onClick={() => addWater(250)} className="w-14 h-14 rounded-full bg-[#275CCC] text-[#F5E4CF] text-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-transform">+</button>
                    <button onClick={() => addWater(100)} className="w-12 h-12 rounded-full bg-white/60 text-[#275CCC] text-sm font-semibold shadow-md hover:scale-105 active:scale-95 transition-transform">+100</button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-[#275CCC] uppercase tracking-wide">Flow Rate Monitor</p>
                      <p className="text-2xl font-bold text-[#1a1a2e] mb-2">Real-time Water Flow</p>
                      <p className="text-xs text-[#6b7280] font-medium">Sensor data visualization</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#6b7280] uppercase tracking-wide font-medium">Current Flow</p>
                      <p className="text-2xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? `${sensorData.flow_rate || 0}ml/s` : '--ml/s'}</p>
                      <p className="text-xs text-[#6b7280] mt-1">{sensorData.device_connected ? 'Connected' : 'Awaiting sensor'}</p>
                    </div>
                  </div>

                  <div className="relative w-full h-72 bg-white/50 rounded-2xl p-5 border-2 border-white/30">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
                      <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                      <text x="5" y="20" fontSize="10" fill="#6b7280" dy="0.3em">100</text>
                      <text x="5" y="50" fontSize="10" fill="#6b7280" dy="0.3em">75</text>
                      <text x="5" y="80" fontSize="10" fill="#6b7280" dy="0.3em">50</text>
                      <text x="5" y="110" fontSize="10" fill="#6b7280" dy="0.3em">25</text>
                      <text x="5" y="135" fontSize="10" fill="#6b7280" dy="0.3em">ml/s</text>
                      <line x1="40" y1="10" x2="40" y2="120" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                      <line x1="40" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                      <defs>
                        <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#5ba8e6" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#275CCC" stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>
                      {areaPoints && <polygon points={areaPoints} fill="url(#chart-gradient)"/>}
                      {chartPoints && <polyline points={chartPoints} fill="none" stroke="#275CCC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
                      {flowData.map((d, i) => {
                        const x = 50 + (i * (550 / Math.max(flowData.length - 1, 1)))
                        const y = 120 - (d.flow / 100) * 110
                        return <circle key={i} cx={x} cy={y} r="4" fill="#275CCC" stroke="white" strokeWidth="2"/>
                      })}
                      <text x="50" y="140" fontSize="10" fill="#6b7280" textAnchor="start">0h</text>
                      <text x="150" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">4h</text>
                      <text x="250" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">8h</text>
                      <text x="350" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">12h</text>
                      <text x="450" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">16h</text>
                      <text x="550" y="140" fontSize="10" fill="#6b7280" textAnchor="middle">20h</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sensor Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex gap-2 mb-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#ef4444] flex items-center justify-center">❤️</div>
                    <span className="text-sm text-[#6b7280]">Heart Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1a1a2e]">{sensorData.device_connected && sensorData.heart_rate ? sensorData.heart_rate : '--'}</p>
                  <p className="text-sm text-[#6b7280]">BPM</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex gap-2 mb-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-[#fed7aa] text-[#f59e0b] flex items-center justify-center">🌡️</div>
                    <span className="text-sm text-[#6b7280]">Body Temp</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1a1a2e]">{sensorData.device_connected && sensorData.body_temp ? sensorData.body_temp : '--'}</p>
                  <p className="text-sm text-[#6b7280]">°C</p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl bg-white p-5 shadow-sm mt-6">
                <h3 className="font-semibold text-[#1a1a2e] mb-4">{"Today's Summary (Flow Sensor)"}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? `${flowPercentage}%` : '--'}</p>
                    <p className="text-xs text-[#6b7280]">Hydration</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? `${flowTotal}ml` : '--'}</p>
                    <p className="text-xs text-[#6b7280]">Flow Detected</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? `${flowRemaining}ml` : '--'}</p>
                    <p className="text-xs text-[#6b7280]">Remaining</p>
                  </div>
                </div>
                <p className="text-center text-xs text-[#6b7280] mt-3">{sensorData.device_connected ? 'Flow sensor connected' : 'Connect flow sensor to track actual consumption'}</p>
              </div>

              {/* Connected Devices */}
              <h2 className="text-lg font-semibold text-[#1a1a2e] mt-6 mb-4">Connected Devices</h2>
              <div className="mb-6">
                {sensorData.device_connected ? (
                  <div className="rounded-2xl bg-[#e8d4bd] p-4 flex items-center gap-4 border border-white/30">
                    <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center text-2xl flex-shrink-0">📡</div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-[#1a1a2e] mb-1">Arduino Flow Sensor</p>
                      <p className="text-xs text-[#6b7280]">HydroFlow Monitor v1.0</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[#6b7280]">🔋 100%</span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#10b981]/10 text-[#10b981] text-xs font-semibold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        Connected
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#e8d4bd] p-8 text-center border border-white/30">
                    <p className="text-base font-semibold text-[#6b7280]">Waiting for a device<span>{waitingDots}</span></p>
                    <p className="text-xs text-[#6b7280] mt-2">No devices connected yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY PAGE */}
          {activePage === 'activity' && (
            <div className="animate-[fadeIn_0.3s_ease-in]">
              <div className="mb-8">
                <p className="text-sm text-[#6b7280] mb-1">Your Daily Activities</p>
                <h1 className="text-2xl font-bold text-[#1a1a2e]">Activity Log</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {activityLog.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-2xl shadow-sm text-center border-l-4 border-[#275CCC]">
                    <p className="font-semibold text-[#6b7280]">No activities yet</p>
                    <p className="text-sm text-[#6b7280] mt-1">Start tracking your water intake on the Home page</p>
                  </div>
                ) : (
                  activityLog.map(activity => (
                    <div key={activity.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-[#275CCC]">
                      <p className="text-xs text-[#6b7280] mb-2 uppercase tracking-wide">{activity.time}</p>
                      <p className="text-base font-semibold text-[#1a1a2e] mb-1">{activity.title}</p>
                      <p className="text-sm text-[#6b7280]">{activity.details}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-[#1a1a2e] mb-4">Flow Sensor Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? flowEvents : '--'}</p>
                    <p className="text-xs text-[#6b7280]">Flow Events</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{sensorData.device_connected ? `${flowTotal}ml` : '--'}</p>
                    <p className="text-xs text-[#6b7280]">Total Volume</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1a1a2e]">{DAILY_GOAL}ml</p>
                    <p className="text-xs text-[#6b7280]">Daily Goal</p>
                  </div>
                </div>
                <p className="text-center text-xs text-[#6b7280] mt-3">{sensorData.device_connected ? 'Sensor connected' : 'Awaiting sensor connection'}</p>
              </div>
            </div>
          )}

          {/* PROFILE PAGE */}
          {activePage === 'profile' && (
            <div className="animate-[fadeIn_0.3s_ease-in]">
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl mb-6 shadow-sm flex-col sm:flex-row text-center sm:text-left">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #275CCC, #5ba8e6)' }}>🏃</div>
                <div>
                  <p className="text-sm text-[#6b7280] mb-1">{getGreeting()}</p>
                  <h2 className="text-xl font-semibold text-[#1a1a2e]">{profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : 'Athlete'}</h2>
                  <p className="text-sm text-[#6b7280]">{profile?.email || user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#275CCC]">{profile?.age || '--'}</p>
                  <p className="text-xs text-[#6b7280] uppercase tracking-wide">Age</p>
                </div>
                <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#275CCC]">{profile?.weight ? `${profile.weight}kg` : '--'}</p>
                  <p className="text-xs text-[#6b7280] uppercase tracking-wide">Weight</p>
                </div>
                <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#275CCC]">{profile?.height ? `${profile.height}cm` : '--'}</p>
                  <p className="text-xs text-[#6b7280] uppercase tracking-wide">Height</p>
                </div>
                <div className="bg-white p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-2xl font-bold text-[#275CCC]">{profile?.sport_type || '--'}</p>
                  <p className="text-xs text-[#6b7280] uppercase tracking-wide">Sport</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-[#1a1a2e] mb-4">Edit Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">First Name</label>
                      <input type="text" value={editProfile.first_name} onChange={e => setEditProfile(prev => ({ ...prev, first_name: e.target.value }))} className={inputStyle} placeholder="First name"/>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Last Name</label>
                      <input type="text" value={editProfile.last_name} onChange={e => setEditProfile(prev => ({ ...prev, last_name: e.target.value }))} className={inputStyle} placeholder="Last name"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Age</label>
                      <input type="number" value={editProfile.age} onChange={e => setEditProfile(prev => ({ ...prev, age: e.target.value }))} className={inputStyle} placeholder="Age"/>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Weight (kg)</label>
                      <input type="number" step="0.1" value={editProfile.weight} onChange={e => setEditProfile(prev => ({ ...prev, weight: e.target.value }))} className={inputStyle} placeholder="Weight"/>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Height (cm)</label>
                      <input type="number" step="0.1" value={editProfile.height} onChange={e => setEditProfile(prev => ({ ...prev, height: e.target.value }))} className={inputStyle} placeholder="Height"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Sport Type</label>
                      <select value={editProfile.sport_type} onChange={e => setEditProfile(prev => ({ ...prev, sport_type: e.target.value }))} className={inputStyle + " cursor-pointer"}>
                        <option value="">Select sport</option>
                        <option value="Running">Running</option>
                        <option value="Cycling">Cycling</option>
                        <option value="Swimming">Swimming</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Football">Football</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Gym">Gym</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1a1a2e] block mb-1.5">Team Name</label>
                      <input type="text" value={editProfile.team_name} onChange={e => setEditProfile(prev => ({ ...prev, team_name: e.target.value }))} className={inputStyle} placeholder="Team name (optional)"/>
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3.5 px-6 bg-[#275CCC] text-white rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#275CCC]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>

              <button onClick={handleLogout} className="w-full mt-4 py-3 px-6 bg-[#e74c3c] text-white rounded-xl text-sm font-semibold hover:bg-[#c0392b] transition-colors">
                Log Out
              </button>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes emojiSwap {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          40% { transform: translateY(-8px) scale(1.1); opacity: 0; }
          60% { transform: translateY(8px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-5px) translateY(2px); }
        }
      `}</style>
    </div>
  )
}
