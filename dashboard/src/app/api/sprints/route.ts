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
  const items = Array.isArray(body) ? body : [body]

  const monthKeys = [...new Set(items.map((item) => item.month_key).filter(Boolean))]

  for (const monthKey of monthKeys) {
    const { data: existing, error: existingError } = await supabase
      .from('sprints')
      .select('name')
      .eq('month_key', monthKey)

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    const existingNames = new Set((existing || []).map((sprint) => sprint.name))
    const incomingNames = new Set(
      items
        .filter((item) => item.month_key === monthKey)
        .map((item) => item.name)
        .filter((name) => name && !existingNames.has(name))
    )

    if (existingNames.size + incomingNames.size > 2) {
      return NextResponse.json({ error: 'Solo se permiten 2 sprints por mes' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('sprints')
    .upsert(items, { onConflict: 'name,month_key' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
