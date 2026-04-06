import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const monthKey = request.nextUrl.searchParams.get('month')
  const sprintName = request.nextUrl.searchParams.get('sprint')

  let query = supabase.from('sprint_tasks').select('*').order('inserted_at', { ascending: true })
  if (monthKey) query = query.eq('month_key', monthKey)
  if (sprintName) query = query.eq('sprint_name', sprintName)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (Array.isArray(body)) {
    const { data, error } = await supabase.from('sprint_tasks').insert(body).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  const { data, error } = await supabase.from('sprint_tasks').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
