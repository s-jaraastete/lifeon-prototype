-- ARTP: Análisis de Riesgo de la Tarea Planificada

ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS source_matrix_id TEXT NULL;

COMMENT ON COLUMN iper_matrices.source_matrix_id IS 'Matriz origen cuando este registro es borrador clonado para actualización';

-- ---------------------------------------------------------------------------
-- energy_types
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS energy_types (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_energy_types_system_code
    ON energy_types (code) WHERE organization_id IS NULL AND is_system = true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_energy_types_org_code
    ON energy_types (organization_id, code) WHERE organization_id IS NOT NULL;

INSERT INTO energy_types (id, organization_id, code, label, is_system, active) VALUES
    ('energy_sys_electrica', NULL, 'electrica', 'Eléctrica', true, true),
    ('energy_sys_mecanica', NULL, 'mecanica', 'Mecánica', true, true),
    ('energy_sys_hidraulica', NULL, 'hidraulica', 'Hidráulica', true, true),
    ('energy_sys_neumatica', NULL, 'neumatica', 'Neumática', true, true),
    ('energy_sys_termica', NULL, 'termica', 'Térmica', true, true),
    ('energy_sys_quimica', NULL, 'quimica', 'Química', true, true),
    ('energy_sys_gravitacional', NULL, 'gravitacional', 'Gravitacional', true, true),
    ('energy_sys_presion', NULL, 'presion', 'Presión', true, true),
    ('energy_sys_almacenada', NULL, 'almacenada', 'Energía almacenada', true, true),
    ('energy_sys_otra', NULL, 'otra', 'Otra', true, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- org_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    description TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    origin TEXT NOT NULL DEFAULT 'manual'
        CHECK (origin IN ('manual', 'iper', 'artp')),
    iper_matrix_id TEXT REFERENCES iper_matrices(id) ON DELETE SET NULL,
    iper_task_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_tasks_org_name_process
    ON org_tasks (organization_id, normalized_name, COALESCE(process_id, ''));

-- ---------------------------------------------------------------------------
-- artp_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE RESTRICT,
    current_version_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_artp_documents_org ON artp_documents(organization_id);

-- ---------------------------------------------------------------------------
-- artp_versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_versions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    artp_document_id TEXT NOT NULL REFERENCES artp_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador', 'en_revision', 'vigente', 'archivado')),
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE RESTRICT,
    task_name TEXT NOT NULL,
    supervisor_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE (artp_document_id, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_artp_versions_one_vigente
    ON artp_versions (artp_document_id) WHERE status = 'vigente';

CREATE INDEX IF NOT EXISTS idx_artp_versions_org ON artp_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_artp_versions_doc ON artp_versions(artp_document_id);

ALTER TABLE artp_documents
    ADD CONSTRAINT artp_documents_current_version_fkey
    FOREIGN KEY (current_version_id) REFERENCES artp_versions(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Child planning tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_version_positions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE CASCADE,
    position_id TEXT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    UNIQUE (version_id, position_id)
);

CREATE TABLE IF NOT EXISTS artp_steps (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    description TEXT NOT NULL,
    tools TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (version_id, sequence)
);

CREATE TABLE IF NOT EXISTS artp_step_energies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES artp_steps(id) ON DELETE CASCADE,
    energy_type_id TEXT NOT NULL REFERENCES energy_types(id) ON DELETE RESTRICT,
    UNIQUE (step_id, energy_type_id)
);

CREATE TABLE IF NOT EXISTS artp_step_hazards (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES artp_steps(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    catalog_code TEXT,
    classification TEXT CHECK (classification IS NULL OR classification IN (
        'Seguridad', 'Emergencias', 'Higiénicos', 'Psicosociales', 'Músculo-esquelético'
    )),
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_step_risks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hazard_id TEXT NOT NULL REFERENCES artp_step_hazards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    catalog_code TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_step_controls (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id TEXT NOT NULL REFERENCES artp_step_risks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    control_type TEXT NOT NULL CHECK (control_type IN (
        'Eliminar / Sustituir',
        'Controles de Ingeniería',
        'Controles Administrativos',
        'Elementos de Protección Personal (EPP)'
    )),
    is_critical BOOLEAN NOT NULL DEFAULT false,
    verification_question TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_iper_links (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
    artp_document_id TEXT NOT NULL REFERENCES artp_documents(id) ON DELETE CASCADE,
    iper_matrix_id TEXT NOT NULL REFERENCES iper_matrices(id) ON DELETE CASCADE,
    task_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'propuesta_pendiente'
        CHECK (status IN ('vinculada', 'propuesta_pendiente')),
    proposed_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artp_iper_links_matrix ON artp_iper_links(iper_matrix_id);

-- ---------------------------------------------------------------------------
-- Executions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_executions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    artp_version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_ejecucion', 'detenida', 'completada')),
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    specific_location TEXT,
    supervisor_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    starts_on DATE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    environment_ok BOOLEAN,
    environment_notes TEXT,
    people_as_planned BOOLEAN,
    tools_as_planned BOOLEAN,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_artp_executions_org ON artp_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_artp_executions_version ON artp_executions(artp_version_id);

CREATE TABLE IF NOT EXISTS artp_execution_changes (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('personas', 'entorno', 'herramientas')),
    description TEXT NOT NULL,
    undesired_event TEXT,
    additional_control TEXT,
    responsible_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    implementation_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artp_execution_checks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL REFERENCES artp_step_controls(id) ON DELETE RESTRICT,
    answer TEXT CHECK (answer IS NULL OR answer IN ('si', 'no', 'no_aplica')),
    note TEXT,
    answered_by_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    UNIQUE (execution_id, control_id)
);

CREATE TABLE IF NOT EXISTS artp_execution_participants (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    fit_to_work BOOLEAN,
    alert_ok BOOLEAN,
    fit_declared_at TIMESTAMPTZ,
    alert_declared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (execution_id, member_id)
);

CREATE TABLE IF NOT EXISTS artp_acknowledgements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL REFERENCES artp_execution_participants(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    artp_version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE RESTRICT,
    member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL,
    content_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'confirmado')),
    signed_at TIMESTAMPTZ,
    signature_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (execution_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.artp_version_is_editable(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM artp_versions v
    WHERE v.id = p_version_id
      AND v.status IN ('borrador', 'en_revision')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_member_id_for_auth(p_org_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id FROM organization_members m
  WHERE m.organization_id = p_org_id
    AND m.auth_user_id = auth.uid()
    AND m.status = 'Activo'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_read_artp_version(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
  v_status TEXT;
  v_cargo TEXT;
BEGIN
  SELECT organization_id, status INTO v_org, v_status
  FROM artp_versions WHERE id = p_version_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;

  SELECT cargo_id INTO v_cargo FROM organization_members
  WHERE organization_id = v_org AND auth_user_id = auth.uid() AND status = 'Activo'
  LIMIT 1;

  IF v_status = 'vigente' AND v_cargo IS NOT NULL AND EXISTS (
    SELECT 1 FROM artp_version_positions vp
    WHERE vp.version_id = p_version_id AND vp.position_id = v_cargo
  ) THEN RETURN true; END IF;

  IF EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN artp_execution_participants p ON p.execution_id = e.id
    JOIN organization_members m ON m.id = p.member_id
    WHERE e.artp_version_id = p_version_id AND m.auth_user_id = auth.uid()
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_read_artp_execution(p_execution_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
BEGIN
  SELECT organization_id INTO v_org FROM artp_executions WHERE id = p_execution_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM artp_execution_participants p
    JOIN organization_members m ON m.id = p.member_id
    WHERE p.execution_id = p_execution_id AND m.auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN organization_members m ON m.id = e.supervisor_member_id
    WHERE e.id = p_execution_id AND m.auth_user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.build_artp_version_snapshot(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_steps JSONB := '[]'::jsonb;
  v_positions JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('positionId', vp.position_id)), '[]'::jsonb)
  INTO v_positions FROM artp_version_positions vp WHERE vp.version_id = p_version_id;

  SELECT COALESCE(jsonb_agg(step_json ORDER BY (step_json->>'sequence')::int), '[]'::jsonb)
  INTO v_steps
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'sequence', s.sequence,
      'description', s.description,
      'tools', s.tools,
      'energies', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', et.id, 'code', et.code, 'label', et.label)), '[]'::jsonb)
        FROM artp_step_energies se JOIN energy_types et ON et.id = se.energy_type_id
        WHERE se.step_id = s.id
      ),
      'hazards', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'name', h.name, 'classification', h.classification,
          'risks', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'id', r.id, 'name', r.name,
              'controls', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'id', c.id, 'description', c.description, 'controlType', c.control_type,
                  'isCritical', c.is_critical, 'verificationQuestion', c.verification_question
                )), '[]'::jsonb)
                FROM artp_step_controls c WHERE c.risk_id = r.id
              )
            )), '[]'::jsonb)
            FROM artp_step_risks r WHERE r.hazard_id = h.id
          )
        )), '[]'::jsonb)
        FROM artp_step_hazards h WHERE h.step_id = s.id
      )
    ) AS step_json
    FROM artp_steps s WHERE s.version_id = p_version_id
  ) sub;

  RETURN jsonb_build_object(
    'kind', 'artp',
    'documentId', v_doc.id,
    'documentName', v_doc.name,
    'documentCode', v_doc.code,
    'versionId', v_ver.id,
    'versionNumber', v_ver.version_number,
    'taskName', v_ver.task_name,
    'positions', v_positions,
    'steps', v_steps
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE energy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_version_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_energies ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_iper_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "energy_types_select" ON energy_types FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));

CREATE POLICY "energy_types_insert_org" ON energy_types FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND is_system = false AND is_org_editor(organization_id));

CREATE POLICY "org_tasks_member" ON org_tasks FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_documents_member" ON artp_documents FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
CREATE POLICY "artp_documents_editor" ON artp_documents FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_documents_update" ON artp_documents FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id)) WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_documents_delete" ON artp_documents FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

CREATE POLICY "artp_versions_select" ON artp_versions FOR SELECT TO authenticated
  USING (can_read_artp_version(id));
CREATE POLICY "artp_versions_editor_insert" ON artp_versions FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_versions_editor_update" ON artp_versions FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id) AND status IN ('borrador', 'en_revision'))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_child_select" ON artp_version_positions FOR SELECT TO authenticated
  USING (can_read_artp_version(version_id));
CREATE POLICY "artp_child_editor" ON artp_version_positions FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND artp_version_is_editable(version_id))
  WITH CHECK (is_org_editor(organization_id) AND artp_version_is_editable(version_id));

CREATE POLICY "artp_steps_select" ON artp_steps FOR SELECT TO authenticated
  USING (can_read_artp_version(version_id));
CREATE POLICY "artp_steps_editor" ON artp_steps FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND artp_version_is_editable(version_id))
  WITH CHECK (is_org_editor(organization_id) AND artp_version_is_editable(version_id));

CREATE POLICY "artp_step_energies_select" ON artp_step_energies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM artp_steps s WHERE s.id = step_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_energies_editor" ON artp_step_energies FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_hazards_select" ON artp_step_hazards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM artp_steps s WHERE s.id = step_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_hazards_editor" ON artp_step_hazards FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_risks_select" ON artp_step_risks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_risks_editor" ON artp_step_risks FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_controls_select" ON artp_step_controls FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_controls_editor" ON artp_step_controls FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_iper_links_member" ON artp_iper_links FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_executions_select" ON artp_executions FOR SELECT TO authenticated
  USING (can_read_artp_execution(id));
CREATE POLICY "artp_executions_editor" ON artp_executions FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_execution_changes_select" ON artp_execution_changes FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_changes_editor" ON artp_execution_changes FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_execution_checks_select" ON artp_execution_checks FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_checks_write" ON artp_execution_checks FOR ALL TO authenticated
  USING (can_read_artp_execution(execution_id))
  WITH CHECK (can_read_artp_execution(execution_id));

CREATE POLICY "artp_execution_participants_select" ON artp_execution_participants FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_participants_editor" ON artp_execution_participants FOR ALL TO authenticated
  USING (is_org_editor(organization_id) OR (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = member_id AND m.auth_user_id = auth.uid()
    ) AND EXISTS (SELECT 1 FROM artp_executions e WHERE e.id = execution_id AND e.status = 'pendiente')
  ))
  WITH CHECK (is_org_editor(organization_id) OR (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = member_id AND m.auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "artp_acknowledgements_select" ON artp_acknowledgements FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));

REVOKE INSERT, UPDATE, DELETE ON artp_acknowledgements FROM authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_artp_version_detail
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_artp_version_detail(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snapshot JSONB;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  IF v_ver.status IN ('vigente', 'archivado') AND v_ver.content_snapshot IS NOT NULL
     AND v_ver.content_snapshot <> '{}'::jsonb THEN
    v_snapshot := v_ver.content_snapshot;
  ELSE
    v_snapshot := public.build_artp_version_snapshot(p_version_id);
  END IF;

  RETURN jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'name', v_doc.name, 'code', v_doc.code, 'description', v_doc.description
    ),
    'version', jsonb_build_object(
      'id', v_ver.id, 'versionNumber', v_ver.version_number, 'status', v_ver.status,
      'taskName', v_ver.task_name, 'contentHash', v_ver.content_hash, 'publishedAt', v_ver.published_at
    ),
    'content', v_snapshot
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: publish_artp_version
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_snap := public.build_artp_version_snapshot(p_version_id);
  v_hash := encode(digest(v_snap::text, 'sha256'), 'hex');

  UPDATE artp_versions SET status = 'archivado', updated_at = NOW()
  WHERE artp_document_id = v_ver.artp_document_id AND status = 'vigente';

  UPDATE artp_versions SET
    status = 'vigente',
    content_snapshot = v_snap,
    content_hash = v_hash,
    published_at = clock_timestamp(),
    updated_at = NOW()
  WHERE id = p_version_id;

  UPDATE artp_documents SET current_version_id = p_version_id, updated_at = NOW()
  WHERE id = v_ver.artp_document_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: clone_artp_version (new draft from vigente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clone_artp_version(p_source_version_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src artp_versions%ROWTYPE;
  v_new_id TEXT;
  v_num INTEGER;
  r RECORD;
  new_step_id TEXT;
  old_step_id TEXT;
  new_hazard_id TEXT;
  old_hazard_id TEXT;
  new_risk_id TEXT;
  old_risk_id TEXT;
BEGIN
  SELECT * INTO v_src FROM artp_versions WHERE id = p_source_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_src.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_src.status <> 'vigente' THEN RAISE EXCEPTION 'Solo se versiona desde vigente'; END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_num FROM artp_versions WHERE artp_document_id = v_src.artp_document_id;
  v_new_id := p_source_version_id || '_v' || v_num;

  INSERT INTO artp_versions (
    id, organization_id, artp_document_id, version_number, status,
    work_center_id, area_id, process_id, subprocess_id, org_task_id, task_name,
    supervisor_member_id, created_by
  ) VALUES (
    v_new_id, v_src.organization_id, v_src.artp_document_id, v_num, 'borrador',
    v_src.work_center_id, v_src.area_id, v_src.process_id, v_src.subprocess_id,
    v_src.org_task_id, v_src.task_name, v_src.supervisor_member_id, auth.uid()
  );

  INSERT INTO artp_version_positions (id, organization_id, version_id, position_id)
  SELECT id || '_c' || v_num, organization_id, v_new_id, position_id
  FROM artp_version_positions WHERE version_id = p_source_version_id;

  FOR r IN SELECT id FROM artp_steps WHERE version_id = p_source_version_id ORDER BY sequence LOOP
    old_step_id := r.id;
    new_step_id := old_step_id || '_c' || v_num;
    INSERT INTO artp_steps (id, organization_id, version_id, sequence, description, tools)
    SELECT new_step_id, organization_id, v_new_id, sequence, description, tools
    FROM artp_steps WHERE id = old_step_id;

    INSERT INTO artp_step_energies (id, organization_id, step_id, energy_type_id)
    SELECT id || '_c' || v_num, organization_id, new_step_id, energy_type_id
    FROM artp_step_energies WHERE step_id = old_step_id;

    FOR r IN SELECT id FROM artp_step_hazards WHERE step_id = old_step_id LOOP
      old_hazard_id := r.id;
      new_hazard_id := old_hazard_id || '_c' || v_num;
      INSERT INTO artp_step_hazards SELECT new_hazard_id, organization_id, new_step_id, name, catalog_code, classification, source
      FROM artp_step_hazards WHERE id = old_hazard_id;

      FOR r IN SELECT id FROM artp_step_risks WHERE hazard_id = old_hazard_id LOOP
        old_risk_id := r.id;
        new_risk_id := old_risk_id || '_c' || v_num;
        INSERT INTO artp_step_risks SELECT new_risk_id, organization_id, new_hazard_id, name, catalog_code, source
        FROM artp_step_risks WHERE id = old_risk_id;

        INSERT INTO artp_step_controls (id, organization_id, risk_id, description, control_type, is_critical, verification_question, source)
        SELECT id || '_c' || v_num, organization_id, new_risk_id, description, control_type, is_critical, verification_question, source
        FROM artp_step_controls WHERE risk_id = old_risk_id;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: transition_artp_execution
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_artp_execution(p_execution_id TEXT, p_target_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exec artp_executions%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_part RECORD;
  v_ctrl RECORD;
  v_chk artp_execution_checks%ROWTYPE;
BEGIN
  SELECT * INTO v_exec FROM artp_executions WHERE id = p_execution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ejecución no encontrada'; END IF;
  IF NOT public.is_org_editor(v_exec.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;

  SELECT * INTO v_ver FROM artp_versions WHERE id = v_exec.artp_version_id;

  IF p_target_status = 'en_ejecucion' THEN
    IF v_exec.status <> 'pendiente' THEN RAISE EXCEPTION 'Estado inválido'; END IF;
    IF NOT EXISTS (SELECT 1 FROM artp_execution_participants WHERE execution_id = p_execution_id) THEN
      RAISE EXCEPTION 'Se requiere al menos un participante';
    END IF;
    FOR v_part IN SELECT * FROM artp_execution_participants WHERE execution_id = p_execution_id LOOP
      IF v_part.fit_to_work IS DISTINCT FROM true OR v_part.alert_ok IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Participantes deben declarar condición y alerta';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM artp_acknowledgements a
        WHERE a.execution_id = p_execution_id AND a.member_id = v_part.member_id
          AND a.status = 'confirmado' AND a.content_hash = v_ver.content_hash
      ) THEN
        RAISE EXCEPTION 'Falta toma de conocimiento confirmada';
      END IF;
    END LOOP;
    IF v_exec.environment_ok IS DISTINCT FROM true AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'entorno' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Condiciones de entorno no verificadas';
    END IF;
    IF v_exec.people_as_planned = false AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'personas' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Gestión del cambio de personas pendiente';
    END IF;
    IF v_exec.tools_as_planned = false AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'herramientas' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Gestión del cambio de herramientas pendiente';
    END IF;
    FOR v_ctrl IN
      SELECT c.* FROM artp_step_controls c
      JOIN artp_step_risks r ON r.id = c.risk_id
      JOIN artp_step_hazards h ON h.id = r.hazard_id
      JOIN artp_steps s ON s.id = h.step_id
      WHERE s.version_id = v_exec.artp_version_id AND c.is_critical = true
    LOOP
      SELECT * INTO v_chk FROM artp_execution_checks
      WHERE execution_id = p_execution_id AND control_id = v_ctrl.id;
      IF v_chk.answer IS NULL OR v_chk.answer <> 'si' THEN
        RAISE EXCEPTION 'Controles críticos sin verificar';
      END IF;
    END LOOP;
    UPDATE artp_executions SET status = 'en_ejecucion', started_at = clock_timestamp(), updated_at = NOW()
    WHERE id = p_execution_id;
  ELSIF p_target_status = 'completada' THEN
    IF v_exec.status NOT IN ('en_ejecucion', 'detenida') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
    UPDATE artp_executions SET status = 'completada', ended_at = clock_timestamp(), updated_at = NOW()
    WHERE id = p_execution_id;
  ELSIF p_target_status = 'detenida' THEN
    UPDATE artp_executions SET status = 'detenida', updated_at = NOW() WHERE id = p_execution_id;
  ELSE
    RAISE EXCEPTION 'Transición no soportada';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register_artp_acknowledgement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_artp_acknowledgement(
    p_ack_id TEXT,
    p_signature_path TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ack artp_acknowledgements%ROWTYPE;
  v_exec artp_executions%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_uid uuid := auth.uid();
  v_expected_prefix text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_ack FROM artp_acknowledgements WHERE id = p_ack_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registro no encontrado'; END IF;
  SELECT * INTO v_exec FROM artp_executions WHERE id = v_ack.execution_id;
  IF v_exec.status <> 'pendiente' THEN RAISE EXCEPTION 'Ejecución no admite firma'; END IF;
  IF v_ack.auth_user_id <> v_uid THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = v_ack.artp_version_id;
  IF v_ver.content_hash IS DISTINCT FROM v_ack.content_hash THEN
    RAISE EXCEPTION 'Versión del ARTP no coincide';
  END IF;
  v_expected_prefix := v_ack.organization_id || '/' || v_uid::text || '/';
  IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
    RAISE EXCEPTION 'Ruta de firma inválida';
  END IF;
  UPDATE artp_acknowledgements SET
    status = 'confirmado',
    signed_at = clock_timestamp(),
    signature_path = p_signature_path
  WHERE id = p_ack_id;
END;
$$;

-- RPC: ensure_artp_acknowledgement (creates pending row for participant)
CREATE OR REPLACE FUNCTION public.ensure_artp_acknowledgement(
    p_execution_id TEXT,
    p_member_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exec artp_executions%ROWTYPE;
    v_ver artp_versions%ROWTYPE;
    v_uid uuid := auth.uid();
    v_part_id TEXT;
    v_ack_id TEXT;
    v_auth uuid;
BEGIN
    SELECT * INTO v_exec FROM artp_executions WHERE id = p_execution_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ejecución no encontrada'; END IF;
    SELECT * INTO v_ver FROM artp_versions WHERE id = v_exec.artp_version_id;
    SELECT auth_user_id INTO v_auth FROM organization_members WHERE id = p_member_id;
    IF v_auth IS NULL OR v_auth <> v_uid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    v_part_id := p_execution_id || '_' || p_member_id;
    INSERT INTO artp_execution_participants (id, organization_id, execution_id, member_id)
    VALUES (v_part_id, v_exec.organization_id, p_execution_id, p_member_id)
    ON CONFLICT (execution_id, member_id) DO NOTHING;
    v_ack_id := v_part_id || '_ack';
    INSERT INTO artp_acknowledgements (
        id, organization_id, participant_id, execution_id, artp_version_id,
        member_id, auth_user_id, content_hash, status
    ) VALUES (
        v_ack_id, v_exec.organization_id, v_part_id, p_execution_id, v_ver.id,
        p_member_id, v_uid, v_ver.content_hash, 'pendiente'
    )
    ON CONFLICT (execution_id, member_id) DO UPDATE SET content_hash = EXCLUDED.content_hash
    RETURNING id INTO v_ack_id;
    RETURN v_ack_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_artp_acknowledgement(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.publish_artp_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_artp_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_artp_execution(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_artp_acknowledgement(TEXT, TEXT) TO authenticated;
