import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const { rows } = await request.json()

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tickets')
    .upsert(rows, { onConflict: 'order_number' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    imported: data?.length || 0,
    message: `${data?.length || 0} tickets importados correctamente`,
  })
}
