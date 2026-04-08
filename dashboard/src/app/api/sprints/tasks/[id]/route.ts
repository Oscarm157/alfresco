import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

async function syncSprintDeliveredPoints(sprintName: string, monthKey: string) {
  const { data: tasks, error: tasksError } = await supabase
    .from('sprint_tasks')
    .select('story_points, status')
    .eq('sprint_name', sprintName)
    .eq('month_key', monthKey)

  if (tasksError) {
    throw new Error(tasksError.message)
  }

  const deliveredPoints = (tasks || [])
    .filter((task) => task.status === 'completada')
    .reduce((sum, task) => sum + (task.story_points || 0), 0)

  const { error: sprintError } = await supabase
    .from('sprints')
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

  const { data, error } = await supabase
    .from('sprint_tasks')
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
  const { data: existingTask, error: existingTaskError } = await supabase
    .from('sprint_tasks')
    .select('sprint_name, month_key')
    .eq('id', id)
    .single()

  if (existingTaskError) return NextResponse.json({ error: existingTaskError.message }, { status: 500 })

  const { error } = await supabase.from('sprint_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncSprintDeliveredPoints(existingTask.sprint_name, existingTask.month_key)
  return NextResponse.json({ success: true })
}
