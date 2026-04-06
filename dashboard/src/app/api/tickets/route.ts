import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  let query = supabase.from('tickets').select('*')

  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const status = params.get('status')
  const priority = params.get('priority')
  const requester = params.get('requester')
  const category = params.get('category')
  const resolvedBy = params.get('resolvedBy')

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (requester) query = query.eq('requester', requester)
  if (category) query = query.eq('category', category)
  if (resolvedBy) query = query.eq('resolved_by', resolvedBy)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('tickets')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
