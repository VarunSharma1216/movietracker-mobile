// src/supabase.js

import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Your Supabase configuration - using environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file and app.json extra config.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export auth helper
export const auth = supabase.auth