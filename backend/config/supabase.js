import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const connectDB = async () => {
  try {
    // Test the connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist yet, which is fine
      throw error;
    }
    
    console.log("Supabase connected successfully");
    return true;
  } catch (error) {
    console.error("Error connecting to Supabase: " + error.message);
    console.log("Please make sure to click 'Connect to Supabase' button to set up the database connection.");
    return false;
  }
};