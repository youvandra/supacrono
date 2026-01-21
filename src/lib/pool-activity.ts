
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function recordPoolActivity(activity: {
    activity_type: 'OPEN_TRADE' | 'CLOSE_TRADE' | 'DEPOSIT' | 'WITHDRAW',
    role?: 'TAKER' | 'ABSORBER' | 'OPERATOR',
    amount?: number | string,
    asset?: string,
    tx_hash?: string,
    description?: string,
    pnl?: number
}) {
    if (!supabaseUrl || !supabaseKey) {
        console.warn("Supabase credentials missing. Skipping activity record.")
        return
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const { error } = await supabase
            .from('pool_activity')
            .insert({
                ...activity,
                asset: activity.asset || 'CRO',
                created_at: new Date().toISOString()
            })

        if (error) {
            console.error("Failed to record pool activity:", error)
        } else {
            console.log(`Pool activity recorded: ${activity.activity_type}`)
        }
    } catch (e) {
        console.error("Error recording pool activity:", e)
    }
}

export async function getRecentPoolActivity(limit = 10) {
    if (!supabaseUrl || !supabaseKey) return []

    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const { data, error } = await supabase
            .from('pool_activity')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error("Failed to fetch pool activity:", error)
            return []
        }
        return data
    } catch (e) {
        console.error("Error fetching pool activity:", e)
        return []
    }
}
