import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== '' && 
           supabaseAnonKey !== '' &&
           supabaseUrl.includes('supabase.co'))
}

// Create Supabase client only if configured
let supabaseClient: SupabaseClient | null = null

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

export const supabase = supabaseClient

// Mock functions for demo mode
export const mockTaxis = [
  { id: '1', driver_name: 'أحمد محمد', plate_number: '12-34567', car_make_model: 'Toyota Camry 2022', phone: '+962791234567', distance: 500 },
  { id: '2', driver_name: 'خالد عبدالله', plate_number: '23-45678', car_make_model: 'Hyundai Sonata 2021', phone: '+962792345678', distance: 800 },
  { id: '3', driver_name: 'محمد حسن', plate_number: '34-56789', car_make_model: 'Kia K5 2023', phone: '+962793456789', distance: 1200 },
]

export const mockRequest = {
  id: 'demo-request-123',
  status: 'pending' as const,
  created_at: new Date().toISOString(),
  driver: null as any,
  passenger_location: { lat: 31.9539, lng: 35.9106 },
  destination_location: { lat: 31.9600, lng: 35.9200 }
}
