'use server'

import { recordPoolActivity } from "@/lib/pool-activity"

export async function logPoolActivity(data: {
    activity_type: 'DEPOSIT' | 'WITHDRAW',
    role: 'TAKER' | 'ABSORBER' | 'OPERATOR',
    amount: string, // Keep as string to avoid precision loss on transfer, convert in lib if needed
    tx_hash: string,
    description: string
}) {
    await recordPoolActivity({
        activity_type: data.activity_type,
        role: data.role,
        amount: parseFloat(data.amount),
        asset: 'CRO',
        tx_hash: data.tx_hash,
        description: data.description
    })
    
    return { success: true }
}
