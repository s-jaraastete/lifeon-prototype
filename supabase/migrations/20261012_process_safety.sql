-- Seguridad de Procesos: actividades de implementación por elemento (1-20) e historial de avance.
-- Pilares y elementos son constantes en código (types/processSafety.ts).

-- ---------------------------------------------------------------------------
-- ps_activities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ps_activities (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    element_number SMALLINT NOT NULL CHECK (element_number BETWEEN 1 AND 20),
    phase TEXT NOT NULL
        CHECK (phase IN ('Preparación', 'Operación', 'Monitoreo y revisión')),
    code TEXT,
    title TEXT NOT NULL,
    responsible TEXT,
    planned_start DATE,
    planned_end DATE,
    progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    sort_order INT NOT NULL DEFAULT 0,
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ps_activities_dates_chk
        CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_end >= planned_start)
);

CREATE INDEX IF NOT EXISTS idx_ps_activities_org_element
    ON ps_activities (organization_id, element_number, sort_order);

DROP TRIGGER IF EXISTS trg_ps_activities_updated_at ON ps_activities;
CREATE TRIGGER trg_ps_activities_updated_at
    BEFORE UPDATE ON ps_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- ps_progress_log: un registro por actividad y día (gana el último cambio del día)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ps_progress_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES ps_activities(id) ON DELETE CASCADE,
    progress SMALLINT NOT NULL CHECK (progress BETWEEN 0 AND 100),
    recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_ps_progress_log_activity_day UNIQUE (activity_id, recorded_on)
);

CREATE INDEX IF NOT EXISTS idx_ps_progress_log_org ON ps_progress_log (organization_id, recorded_on);

-- El historial se escribe en la base para que ningún cliente pueda omitirlo.
CREATE OR REPLACE FUNCTION ps_log_activity_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.progress IS NOT DISTINCT FROM OLD.progress THEN
    RETURN NEW;
  END IF;
  INSERT INTO ps_progress_log (organization_id, activity_id, progress, recorded_on, recorded_by)
  VALUES (NEW.organization_id, NEW.id, NEW.progress, CURRENT_DATE, auth.uid())
  ON CONFLICT (activity_id, recorded_on)
  DO UPDATE SET progress = EXCLUDED.progress, recorded_by = EXCLUDED.recorded_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_activities_progress_log ON ps_activities;
CREATE TRIGGER trg_ps_activities_progress_log
    AFTER INSERT OR UPDATE OF progress ON ps_activities
    FOR EACH ROW EXECUTE FUNCTION ps_log_activity_progress();

-- ---------------------------------------------------------------------------
-- RLS: miembros leen, editores escriben. El log solo se lee (lo escribe el trigger).
-- ---------------------------------------------------------------------------
ALTER TABLE ps_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_progress_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps_activities_select" ON ps_activities;
CREATE POLICY "ps_activities_select" ON ps_activities FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "ps_activities_insert" ON ps_activities;
CREATE POLICY "ps_activities_insert" ON ps_activities FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
DROP POLICY IF EXISTS "ps_activities_update" ON ps_activities;
CREATE POLICY "ps_activities_update" ON ps_activities FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id)) WITH CHECK (is_org_editor(organization_id));
DROP POLICY IF EXISTS "ps_activities_delete" ON ps_activities;
CREATE POLICY "ps_activities_delete" ON ps_activities FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

DROP POLICY IF EXISTS "ps_progress_log_select" ON ps_progress_log;
CREATE POLICY "ps_progress_log_select" ON ps_progress_log FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
