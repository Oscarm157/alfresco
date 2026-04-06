import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const monthKey = request.nextUrl.searchParams.get('month')

  let query = supabase.from('sprints').select('*').order('name', { ascending: true })
  if (monthKey) query = query.eq('month_key', monthKey)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('sprints')
    .upsert(body, { onConflict: 'name,month_key' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
