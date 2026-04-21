import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// This endpoint receives data from Arduino IDE via HTTP
// The Arduino should send POST requests with sensor data

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      heart_rate, 
      body_temp, 
      flow_rate, 
      user_token // Arduino should send the user's auth token
    } = body

    // If no user token provided, try to get from cookies (web client)
    const supabase = await createClient()
    
    let userId: string | null = null

    if (user_token) {
      // Verify the token from Arduino
      const { data: { user }, error } = await supabase.auth.getUser(user_token)
      if (!error && user) {
        userId = user.id
      }
    } else {
      // Try cookie-based auth (for web client polling)
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        userId = user.id
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Please provide a valid user_token from your Arduino device"
      }, { status: 401 })
    }

    // Store sensor reading
    const { data, error } = await supabase
      .from("sensor_readings")
      .insert({
        user_id: userId,
        heart_rate: heart_rate || null,
        body_temp: body_temp || null,
        flow_rate: flow_rate || null,
        device_connected: true,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: "Sensor data recorded successfully"
    })
  } catch {
    return NextResponse.json({ 
      error: "Invalid request body",
      expected_format: {
        heart_rate: "number (BPM)",
        body_temp: "number (Celsius)",
        flow_rate: "number (L/min)",
        user_token: "string (optional, for Arduino auth)"
      }
    }, { status: 400 })
  }
}

// GET - Check connection status and get latest reading
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the latest reading within the last 30 seconds (device is "connected")
  const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
  
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("user_id", user.id)
    .gte("recorded_at", thirtySecondsAgo)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single()

  const isConnected = !error && data !== null

  return NextResponse.json({ 
    connected: isConnected,
    data: data || null,
    message: isConnected ? "Arduino connected" : "Arduino not connected - no recent data"
  })
}
