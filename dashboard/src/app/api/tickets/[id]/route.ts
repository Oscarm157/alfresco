import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { inferTicketCategory } from '@/lib/ticket-categorization'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({
    ...data,
    category: inferTicketCategory({
      category: data.category,
      description: data.description,
      serviceType: data.service_type,
      notes: data.notes,
    }),
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const payload = {
    ...body,
    category: inferTicketCategory({
      category: body.category,
      description: body.description,
      serviceType: body.service_type,
      notes: body.notes,
    }),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
