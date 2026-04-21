'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

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

interface ProfilePanelProps {
  profile: Profile | null
  user: User
  onUpdate: (data: Partial<Profile>) => Promise<{ error: unknown }>
}

const sportTypes = [
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Swimming',
  'Running',
  'Cycling',
  'CrossFit',
  'Weightlifting',
  'Boxing',
  'MMA',
  'Other',
]

export default function ProfilePanel({ profile, user, onUpdate }: ProfilePanelProps) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    age: profile?.age?.toString() || '',
    weight: profile?.weight?.toString() || '',
    height: profile?.height?.toString() || '',
    sport_type: profile?.sport_type || '',
    team_name: profile?.team_name || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await onUpdate({
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      age: formData.age ? parseInt(formData.age) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      sport_type: formData.sport_type || null,
      team_name: formData.team_name || null,
    })

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-accent/10 border border-accent/20 text-accent' 
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          } text-sm`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {profile?.first_name || profile?.last_name 
                ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                : 'Athlete'}
            </h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="25"
                />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-2">
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="75.0"
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-foreground mb-2">
                  Height (cm)
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="180.0"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sport_type" className="block text-sm font-medium text-foreground mb-2">
                  Sport
                </label>
                <select
                  id="sport_type"
                  name="sport_type"
                  value={formData.sport_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a sport</option>
                  {sportTypes.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="team_name" className="block text-sm font-medium text-foreground mb-2">
                  Team Name
                </label>
                <input
                  id="team_name"
                  name="team_name"
                  type="text"
                  value={formData.team_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your team name"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    age: profile?.age?.toString() || '',
                    weight: profile?.weight?.toString() || '',
                    height: profile?.height?.toString() || '',
                    sport_type: profile?.sport_type || '',
                    team_name: profile?.team_name || '',
                  })
                }}
                className="px-6 py-3 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">First Name</p>
                <p className="text-foreground">{profile?.first_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                <p className="text-foreground">{profile?.last_name || '-'}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Age</p>
                <p className="text-foreground">{profile?.age ? `${profile.age} years` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weight</p>
                <p className="text-foreground">{profile?.weight ? `${profile.weight} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Height</p>
                <p className="text-foreground">{profile?.height ? `${profile.height} cm` : '-'}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sport</p>
                <p className="text-foreground">{profile?.sport_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Team</p>
                <p className="text-foreground">{profile?.team_name || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
