// Supabase client configuration
// CRITICAL: This file must NEVER throw at module-init time.
// A top-level throw crashes the entire JS bundle before React mounts → blank white page.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Export a flag so APP_Root can show a setup screen instead of crashing
export const supabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseKey &&
  supabaseKey !== 'your-anon-key-here'
);

// Always create the client - even with empty strings it won't throw here.
// Actual API calls will fail gracefully and be caught by try/catch in services.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
