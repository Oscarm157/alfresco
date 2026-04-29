import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { inferTicketCategory, resolveTicketCategory, ticketMatchesCategory } from '@/lib/ticket-category-utils'

type TicketRow = Record<string, unknown> & {
  category?: string | null
  description?: string | null
  service_type?: string | null
  notes?: string | null
}

type TicketInsertQuery = {
  insert: (values: Record<string, unknown>) => {
    select: () => {
      single: () => Promise<{ data: TicketRow; error: { message: string } | null }>
    }
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const EXCLUDED_IDS = [
    '9ce4666d-00a4-4606-9531-9d0e5edce488',
    'eca5d366-45a2-4ed1-be53-510ba2b64e8a',
    '22d945ff-ff47-48af-9df8-312732f9b604',
    'f9dfa7f9-b6c1-4c06-95a9-ece5538f1a91',
    '595a5f0c-df19-4b55-9928-d523aed0c101',
    '8ffd4a2e-0da8-40c1-b859-aba59e25ea85',
  ]

  let query = supabase.from('tickets').select('*').not('id', 'in', `(${EXCLUDED_IDS.join(',')})`)


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
  if (resolvedBy) query = query.eq('resolved_by', resolvedBy)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalizedTickets = ((data || []) as TicketRow[]).map((ticket) => ({
    ...ticket,
    category: resolveTicketCategory(ticket),
  }))

  return NextResponse.json(normalizedTickets.filter((ticket) => ticketMatchesCategory(ticket, category)))
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

  const ticketTable = supabase.from('tickets') as unknown as TicketInsertQuery
  const { data, error } = await ticketTable
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
