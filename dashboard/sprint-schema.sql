-- ============================================
-- MÓDULO SPRINTS / APPROPIA — SCHEMA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla de registros de horas (detalle diario de Appropia)
CREATE TABLE sprint_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sprint TEXT NOT NULL,
  hours NUMERIC(4,1) NOT NULL,
  detail TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('implementacion', 'soporte', 'deuda_tecnica', 'mantenimiento')),
  assignee TEXT NOT NULL,
  month_key TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sprint_hours_date ON sprint_hours(date);
CREATE INDEX idx_sprint_hours_sprint ON sprint_hours(sprint);
CREATE INDEX idx_sprint_hours_task_type ON sprint_hours(task_type);
CREATE INDEX idx_sprint_hours_month_key ON sprint_hours(month_key);

-- 2. Tabla de sprints (resumen por sprint con story points)
CREATE TABLE sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  month_key TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  dev_sp_committed INT DEFAULT 20,
  dev_sp_delivered INT DEFAULT 0,
  maintenance_sp_committed INT DEFAULT 4,
  maintenance_sp_delivered INT DEFAULT 0,
  notes TEXT,
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, month_key)
);

-- 3. RLS abierto
ALTER TABLE sprint_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select" ON sprint_hours FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON sprint_hours FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON sprint_hours FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete" ON sprint_hours FOR DELETE USING (true);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all select" ON sprints FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON sprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON sprints FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete" ON sprints FOR DELETE USING (true);
