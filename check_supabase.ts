
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("Checking connection to:", supabaseUrl)
    const { data, error } = await supabase.from('pool_activity').select('*').limit(1)
    
    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Success! Data:", data)
    }
}

check()
