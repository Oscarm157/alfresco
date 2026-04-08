import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { inferTicketCategory } from '@/lib/ticket-categorization'

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
  return NextResponse.json(
    (data || []).map((ticket) => ({
      ...ticket,
      category: inferTicketCategory({
        category: ticket.category,
        description: ticket.description,
        serviceType: ticket.service_type,
        notes: ticket.notes,
      }),
    }))
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const payload = {
    ...body,
    category: inferTicketCategory({
      category: body.category,
      description: body.description,
      serviceType: body.service_type,
      notes: body.notes,
    }),
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
