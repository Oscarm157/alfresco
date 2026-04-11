import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

type SprintTaskPointsRow = {
  story_points: number | null
  status: string | null
}

type SprintTaskRow = {
  sprint_name: string
  month_key: string
}

type SprintUpdateQuery = {
  update: (
    values: { dev_sp_delivered: number }
  ) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

type SprintTaskInsertQuery = {
  insert: (
    values: Record<string, unknown>[]
  ) => {
    select: () => Promise<{ data: SprintTaskRow[] | null; error: { message: string } | null }>
  }
}

type SprintTaskInsertSingleQuery = {
  insert: (
    value: Record<string, unknown>
  ) => {
    select: () => {
      single: () => Promise<{ data: SprintTaskRow; error: { message: string } | null }>
    }
  }
}

async function syncSprintDeliveredPoints(sprintName: string, monthKey: string) {
  const { data: tasks, error: tasksError } = await supabase
    .from('sprint_tasks')
    .select('story_points, status')
    .eq('sprint_name', sprintName)
    .eq('month_key', monthKey)

  if (tasksError) {
    throw new Error(tasksError.message)
  }

  const taskRows = (tasks || []) as SprintTaskPointsRow[]

  const deliveredPoints = taskRows
    .filter((task) => task.status === 'completada')
    .reduce((sum, task) => sum + (task.story_points || 0), 0)

  const sprintTable = supabase.from('sprints') as unknown as SprintUpdateQuery

  const { error: sprintError } = await sprintTable
    .update({ dev_sp_delivered: deliveredPoints })
    .eq('name', sprintName)
    .eq('month_key', monthKey)

  if (sprintError) {
    throw new Error(sprintError.message)
  }
}

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
    const sprintTasksTable = supabase.from('sprint_tasks') as unknown as SprintTaskInsertQuery
    const { data, error } = await sprintTasksTable.insert(body as Record<string, unknown>[]).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const insertedTasks = data || []
    const sprintPairs = [...new Set(insertedTasks.map((task) => `${task.sprint_name}::${task.month_key}`))]
    for (const pair of sprintPairs) {
      const [sprintName, monthKey] = pair.split('::')
      await syncSprintDeliveredPoints(sprintName, monthKey)
    }
    return NextResponse.json(insertedTasks, { status: 201 })
  }

  const sprintTasksTable = supabase.from('sprint_tasks') as unknown as SprintTaskInsertSingleQuery
  const { data, error } = await sprintTasksTable.insert(body as Record<string, unknown>).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await syncSprintDeliveredPoints(data.sprint_name, data.month_key)
  return NextResponse.json(data, { status: 201 })
}
