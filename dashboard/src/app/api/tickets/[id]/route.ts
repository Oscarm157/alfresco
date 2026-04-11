import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { resolveTicketCategory } from '@/lib/ticket-category-utils'

type TicketRow = Record<string, unknown> & {
  id?: string
  category?: string | null
  description?: string | null
  service_type?: string | null
  notes?: string | null
}

type TicketSelectQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: TicketRow; error: { message: string } | null }>
    }
  }
}

type TicketUpdateQuery = {
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => {
      select: () => {
        single: () => Promise<{ data: TicketRow; error: { message: string } | null }>
      }
    }
  }
}

type TicketDeleteQuery = {
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticketTable = supabase.from('tickets') as unknown as TicketSelectQuery
  const { data, error } = await ticketTable
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  const ticket = data as TicketRow
  return NextResponse.json({
    ...ticket,
    category: resolveTicketCategory(ticket),
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const ticketSelectTable = supabase.from('tickets') as unknown as TicketSelectQuery
  const { data: existingTicket, error: existingError } = await ticketSelectTable
    .select('*')
    .eq('id', id)
    .single()

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 404 })

  const mergedTicket = {
    ...(existingTicket as TicketRow),
    ...body,
  }

  const payload = {
    ...body,
    category: resolveTicketCategory(mergedTicket),
    updated_at: new Date().toISOString(),
  }

  const ticketUpdateTable = supabase.from('tickets') as unknown as TicketUpdateQuery
  const { data, error } = await ticketUpdateTable
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ticket = data as TicketRow
  return NextResponse.json({
    ...ticket,
    category: resolveTicketCategory(ticket),
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticketDeleteTable = supabase.from('tickets') as unknown as TicketDeleteQuery
  const { error } = await ticketDeleteTable
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
