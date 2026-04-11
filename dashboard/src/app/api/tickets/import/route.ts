import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { resolveTicketCategory } from '@/lib/ticket-category-utils'

type TicketImportRow = Record<string, unknown>

type TicketUpsertQuery = {
  upsert: (
    values: TicketImportRow[],
    options: { onConflict: string }
  ) => {
    select: () => Promise<{ data: TicketImportRow[] | null; error: { message: string } | null }>
  }
}

export async function POST(request: NextRequest) {
  const { rows } = await request.json()

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const normalizedRows = rows.map((row) => ({
    ...row,
    category: resolveTicketCategory(row),
  }))

  const ticketTable = supabase.from('tickets') as unknown as TicketUpsertQuery
  const { data, error } = await ticketTable
    .upsert(normalizedRows, { onConflict: 'order_number' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    imported: data?.length || 0,
    message: `${data?.length || 0} tickets importados correctamente`,
  })
}
