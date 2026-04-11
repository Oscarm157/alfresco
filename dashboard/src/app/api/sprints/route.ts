import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

type SprintNameRow = {
  name: string
}

type SprintUpsertInput = {
  month_key?: string
  name?: string
  [key: string]: unknown
}

type SprintUpsertQuery = {
  upsert: (
    values: SprintUpsertInput[],
    options: { onConflict: string }
  ) => {
    select: () => Promise<{ data: SprintUpsertInput[] | null; error: { message: string } | null }>
  }
}

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
  const items = (Array.isArray(body) ? body : [body]) as SprintUpsertInput[]

  const monthKeys = [...new Set(items.map((item) => item.month_key).filter((monthKey): monthKey is string => Boolean(monthKey)))]

  for (const monthKey of monthKeys) {
    const { data: existing, error: existingError } = await supabase
      .from('sprints')
      .select('name')
      .eq('month_key', monthKey)

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    const existingRows = (existing || []) as SprintNameRow[]
    const existingNames = new Set(existingRows.map((sprint) => sprint.name))
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

  const sprintQuery = supabase.from('sprints') as unknown as SprintUpsertQuery

  const { data, error } = await sprintQuery
    .upsert(items, { onConflict: 'name,month_key' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
