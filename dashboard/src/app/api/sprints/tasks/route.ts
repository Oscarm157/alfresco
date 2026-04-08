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
    const { data, error } = await supabase.from('sprint_tasks').insert(body).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const sprintPairs = [...new Set(data.map((task) => `${task.sprint_name}::${task.month_key}`))]
    for (const pair of sprintPairs) {
      const [sprintName, monthKey] = pair.split('::')
      await syncSprintDeliveredPoints(sprintName, monthKey)
    }
    return NextResponse.json(data, { status: 201 })
  }

  const { data, error } = await supabase.from('sprint_tasks').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await syncSprintDeliveredPoints(data.sprint_name, data.month_key)
  return NextResponse.json(data, { status: 201 })
}
