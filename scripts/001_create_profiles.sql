-- HydroFlow Profiles Table
-- This table stores user profile data linked to Supabase Auth

-- Create profiles table with reference to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  age INTEGER,
  weight NUMERIC(5,2),
  activity_level TEXT DEFAULT 'moderate',
  daily_goal INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own data
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- Create sensor_data table for storing Arduino sensor readings
CREATE TABLE IF NOT EXISTS public.sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bpm INTEGER,
  temperature NUMERIC(4,1),
  flow_rate NUMERIC(6,2),
  humidity NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sensor_data
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sensor_data_select_own" ON public.sensor_data 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sensor_data_insert_own" ON public.sensor_data 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create hydration_logs table to track water intake from flow sensor
CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  source TEXT DEFAULT 'flow_sensor',
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for hydration_logs
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hydration_logs_select_own" ON public.hydration_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "hydration_logs_insert_own" ON public.hydration_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
