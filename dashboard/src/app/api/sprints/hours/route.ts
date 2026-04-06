import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const monthKey = request.nextUrl.searchParams.get('month')

  let query = supabase.from('sprint_hours').select('*').order('date', { ascending: true })
  if (monthKey) query = query.eq('month_key', monthKey)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { rows } = await request.json()

  if (!rows?.length) return NextResponse.json({ error: 'No rows' }, { status: 400 })

  const { data, error } = await supabase.from('sprint_hours').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: data?.length || 0 })
}
