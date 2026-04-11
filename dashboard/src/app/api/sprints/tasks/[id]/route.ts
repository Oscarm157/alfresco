import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

type SprintTaskPointsRow = {
  story_points: number | null
  status: string | null
}

type SprintTaskKeyRow = {
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

type SprintTaskUpdateQuery = {
  update: (
    values: Record<string, unknown>
  ) => {
    eq: (column: string, value: string) => {
      select: () => {
        single: () => Promise<{ data: SprintTaskKeyRow; error: { message: string } | null }>
      }
    }
  }
}

type SprintTaskSelectQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: SprintTaskKeyRow; error: { message: string } | null }>
    }
  }
}

type SprintTaskDeleteQuery = {
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const sprintTasksTable = supabase.from('sprint_tasks') as unknown as SprintTaskUpdateQuery

  const { data, error } = await sprintTasksTable
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await syncSprintDeliveredPoints(data.sprint_name, data.month_key)
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sprintTasksTable = supabase.from('sprint_tasks') as unknown as SprintTaskSelectQuery

  const { data: existingTask, error: existingTaskError } = await sprintTasksTable
    .select('sprint_name, month_key')
    .eq('id', id)
    .single()

  if (existingTaskError) return NextResponse.json({ error: existingTaskError.message }, { status: 500 })

  const sprintTasksDeleteTable = supabase.from('sprint_tasks') as unknown as SprintTaskDeleteQuery
  const { error } = await sprintTasksDeleteTable.delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncSprintDeliveredPoints(existingTask.sprint_name, existingTask.month_key)
  return NextResponse.json({ success: true })
}
