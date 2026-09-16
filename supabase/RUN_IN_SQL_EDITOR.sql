-- LifeOn: ejecutar en Supabase → SQL Editor (Run)
-- Proyecto: gezcblnyteijkckabkyh


-- ========== schema.sql ==========
-- =========================================================================
-- LIFEON: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Ejecutar este script completo en el SQL Editor de Supabase (1-Click Run)
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN PARA ACTUALIZAR TIMESTAMP AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- TABLA 1: PREFERENCIAS ORGANIZACIONALES (ONBOARDING, SECTOR, VEP / 5X5)
-- =========================================================================
CREATE TABLE IF NOT EXISTS organization_preferences (
    id TEXT PRIMARY KEY DEFAULT 'default_org',
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_org_preferences_updated_at ON organization_preferences;
CREATE TRIGGER trg_org_preferences_updated_at
    BEFORE UPDATE ON organization_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 2: ESTRUCTURA ORGANIZACIONAL (ÁREAS, PROCESOS Y SUBPROCESOS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS org_structure (
    id TEXT PRIMARY KEY DEFAULT 'default_structure',
    areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_org_structure_updated_at ON org_structure;
CREATE TRIGGER trg_org_structure_updated_at
    BEFORE UPDATE ON org_structure
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 3: DOCUMENTOS PREVENTIVOS Y AUDITORÍAS NORMATIVAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS preventive_docs (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    regulatory_basis TEXT,
    version TEXT DEFAULT 'v1.0',
    status TEXT NOT NULL DEFAULT 'Vigente',
    author TEXT,
    approver TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    days_remaining INTEGER,
    source TEXT DEFAULT 'Plantilla del Sistema',
    has_file BOOLEAN DEFAULT false,
    file_name TEXT,
    file_size TEXT,
    content_sections JSONB DEFAULT '[]'::jsonb,
    audit_checklist JSONB DEFAULT '[]'::jsonb,
    audit_score INTEGER DEFAULT 0,
    audit_status TEXT NOT NULL DEFAULT 'Sin Auditar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_preventive_docs_updated_at ON preventive_docs;
CREATE TRIGGER trg_preventive_docs_updated_at
    BEFORE UPDATE ON preventive_docs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 4: MATRICES IPER
-- =========================================================================
CREATE TABLE IF NOT EXISTS iper_matrices (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    area TEXT,
    work_center TEXT,
    responsible TEXT,
    status TEXT NOT NULL DEFAULT 'Borrador',
    progress INTEGER DEFAULT 0,
    total_risks INTEGER DEFAULT 0,
    critical_risks INTEGER DEFAULT 0,
    last_review TEXT,
    next_review TEXT,
    hazards JSONB DEFAULT '[]'::jsonb,
    acknowledgements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_iper_matrices_updated_at ON iper_matrices;
CREATE TRIGGER trg_iper_matrices_updated_at
    BEFORE UPDATE ON iper_matrices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) - MODO PRUEBAS / DESARROLLO
-- Permite lectura y escritura transparente para el rol anon (clave pública)
-- =========================================================================
ALTER TABLE organization_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE iper_matrices ENABLE ROW LEVEL SECURITY;

-- Políticas para organization_preferences
DROP POLICY IF EXISTS "Permitir todo en organization_preferences" ON organization_preferences;
CREATE POLICY "Permitir todo en organization_preferences" 
    ON organization_preferences FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para org_structure
DROP POLICY IF EXISTS "Permitir todo en org_structure" ON org_structure;
CREATE POLICY "Permitir todo en org_structure" 
    ON org_structure FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para preventive_docs
DROP POLICY IF EXISTS "Permitir todo en preventive_docs" ON preventive_docs;
CREATE POLICY "Permitir todo en preventive_docs" 
    ON preventive_docs FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para iper_matrices
DROP POLICY IF EXISTS "Permitir todo en iper_matrices" ON iper_matrices;
CREATE POLICY "Permitir todo en iper_matrices" 
    ON iper_matrices FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Notificación de éxito
COMMENT ON TABLE organization_preferences IS 'Almacena la configuración y preferencias de Onboarding de LifeOn';
COMMENT ON TABLE org_structure IS 'Almacena la estructura organizacional (Áreas, Procesos y Subprocesos)';
COMMENT ON TABLE preventive_docs IS 'Almacena documentos de Planificación y Documentación Preventiva y sus auditorías';
COMMENT ON TABLE iper_matrices IS 'Almacena matrices de identificación de peligros y evaluación de riesgos IPER';


-- ========== 20260911_org_structure_tables.sql ==========
-- =========================================================================
-- LIFEON: MIGRACIÓN ESTRUCTURAL ORGANIZACIONAL Y MULTI-TENANT
-- Archivo: 20260911_org_structure_tables.sql
-- Descripción:
--   Define el modelo relacional normalizado para Estructura Organizacional:
--   organizations -> work_centers -> areas -> processes -> subprocesses
--   organizations -> positions (Cargos transversales de la organización)
--   organizations -> organization_members (Membresías de usuarios en org)
--   Incluye claves foráneas, índices de aislamiento por tenant, soft deletes y RLS.
-- =========================================================================

-- 1. EXTENSIONES Y FUNCIONES AUXILIARES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLA: ORGANIZACIONES (TENANTS)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    rut TEXT,
    industry TEXT,
    size TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar organizaciones base si no existen para compatibilidad
INSERT INTO organizations (id, name, industry, size, status)
VALUES
    ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51 a 100 trabajadores', 'Activo'),
    ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1 a 10 trabajadores', 'Activo')
ON CONFLICT (id) DO UPDATE 
SET updated_at = NOW();

-- 3. TABLA: CENTROS DE TRABAJO (WORK CENTERS)
CREATE TABLE IF NOT EXISTS work_centers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_centers_org ON work_centers(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_work_centers_org_name ON work_centers(organization_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_work_centers_updated_at ON work_centers;
CREATE TRIGGER trg_work_centers_updated_at
    BEFORE UPDATE ON work_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABLA: ÁREAS
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_org ON areas(organization_id);
CREATE INDEX IF NOT EXISTS idx_areas_work_center ON areas(work_center_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_areas_workcenter_name ON areas(organization_id, work_center_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_areas_updated_at ON areas;
CREATE TRIGGER trg_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. TABLA: PROCESOS
CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processes_org ON processes(organization_id);
CREATE INDEX IF NOT EXISTS idx_processes_area ON processes(area_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_processes_area_name ON processes(area_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_processes_updated_at ON processes;
CREATE TRIGGER trg_processes_updated_at
    BEFORE UPDATE ON processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. TABLA: SUBPROCESOS (OPCIONALES)
CREATE TABLE IF NOT EXISTS subprocesses (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subprocesses_org ON subprocesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_subprocesses_process ON subprocesses(process_id);

DROP TRIGGER IF EXISTS trg_subprocesses_updated_at ON subprocesses;
CREATE TRIGGER trg_subprocesses_updated_at
    BEFORE UPDATE ON subprocesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. TABLA: CARGOS (CATÁLOGO TRANSVERSAL DE ORGANIZACIÓN)
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    dotation_total INTEGER NOT NULL DEFAULT 1,
    dotation_male INTEGER NOT NULL DEFAULT 0,
    dotation_female INTEGER NOT NULL DEFAULT 0,
    dotation_other INTEGER NOT NULL DEFAULT 0,
    sensitive_workers_count INTEGER NOT NULL DEFAULT 0,
    disabled_workers_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Validación de coherencia de dotación
    CONSTRAINT chk_position_dotation CHECK (
        dotation_total >= (dotation_male + dotation_female + dotation_other)
    )
);

CREATE INDEX IF NOT EXISTS idx_positions_org ON positions(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_org_name ON positions(organization_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;
CREATE TRIGGER trg_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. TABLA: USUARIOS Y MEMBRESÍAS DE ORGANIZACIÓN
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    cargo_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'Lector' CHECK (role IN ('Administrador', 'Editor', 'Lector')),
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Invitado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON organization_members(organization_id, email);

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON organization_members;
CREATE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subprocesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- En entorno de desarrollo y pruebas locales con clave anónima:
-- Permitir acceso transparente manteniendo aislamiento a nivel de consulta por organization_id.
CREATE POLICY "Permitir acceso autenticado y anónimo a organizations" ON organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a work_centers" ON work_centers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a areas" ON areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a processes" ON processes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a subprocesses" ON subprocesses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a positions" ON positions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a organization_members" ON organization_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ========== 20260916_iper_acknowledgements.sql ==========
-- IRL: Toma de conocimiento / envío por trabajador (por matriz)
ALTER TABLE iper_matrices
  ADD COLUMN IF NOT EXISTS acknowledgements JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN iper_matrices.acknowledgements IS 'Registros de envío y toma de conocimiento del IRL por trabajador y cargo';


-- ========== 20260917_apr_ai_usage_and_cache.sql ==========
-- APR Virtual IA: rate limiting and suggestion cache

CREATE TABLE IF NOT EXISTS apr_ai_usage (
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'day')),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id, window_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_usage_org_day
    ON apr_ai_usage (org_id, window_type, window_start);

CREATE TABLE IF NOT EXISTS apr_ai_suggestion_cache (
    cache_key TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_expires
    ON apr_ai_suggestion_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_org
    ON apr_ai_suggestion_cache (org_id);


-- ========== 20260918_tenant_id_conventions.sql ==========
-- Multi-tenant por prefijo de id (LifeOn dashboard cuentas de prueba)
-- No añade columnas organization_id: el aislamiento se hace en la app.
--
-- organization_preferences.id  → org_sergio | org_luis | default_org (demo)
-- org_structure.id           → structure_org_sergio | default_structure (demo)
-- iper_matrices.id             → org_sergio_m-imp-… | org_demo_… | MA-… (demo seed)
-- preventive_docs.id           → org_sergio_DOC-01 | DOC-01 (legacy demo)
--
-- Verificar datos por cuenta (SQL Editor):
--
-- SELECT id FROM organization_preferences ORDER BY id;
-- SELECT id FROM org_structure ORDER BY id;
-- SELECT id, title FROM iper_matrices WHERE id LIKE 'org_sergio_%' ORDER BY updated_at DESC;
-- SELECT id, title FROM preventive_docs WHERE id LIKE 'org_sergio_%' ORDER BY code;

COMMENT ON TABLE organization_preferences IS 'Una fila por organización (id = orgId). Demo usa default_org.';
COMMENT ON TABLE org_structure IS 'Una fila por organización (id = structure_<orgId>). Demo usa default_structure.';
COMMENT ON TABLE preventive_docs IS 'Documentos preventivos; ids con prefijo <orgId>_ salvo plantillas demo DOC-*';
COMMENT ON TABLE iper_matrices IS 'Matrices IPER; ids con prefijo <orgId>_ para cuentas reales';


-- ========== 20260919_seed_missing_organizations.sql ==========
-- Seed organizations for all LifeOn test accounts (missing from initial migration)

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();


-- ========== 20260920_profiles_and_member_auth.sql ==========
-- Profiles + extended organization_members for Auth linkage

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_path TEXT,
    personal_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS identification_type TEXT,
    ADD COLUMN IF NOT EXISTS identification_number TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organization_members ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_org_email_active
    ON organization_members (organization_id, lower(email))
    WHERE status IN ('Activo', 'Invitado');

CREATE INDEX IF NOT EXISTS idx_org_members_auth_user ON organization_members(auth_user_id);

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS logo_path TEXT;


-- ========== 20260921_tenant_columns_legacy.sql ==========
-- organization_id on legacy blob tables

ALTER TABLE organization_preferences
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE organization_preferences
SET organization_id = CASE
    WHEN id = 'default_org' THEN 'org_demo'
    ELSE id
END
WHERE organization_id IS NULL;

ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE iper_matrices
SET organization_id = CASE
    WHEN id LIKE 'org\_%' THEN split_part(id, '_', 1) || '_' || split_part(id, '_', 2)
    WHEN id LIKE 'MA-%' OR id ~ '^[0-9]+$' THEN 'org_demo'
    ELSE NULL
END
WHERE organization_id IS NULL;

ALTER TABLE preventive_docs
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE preventive_docs
SET organization_id = CASE
    WHEN id LIKE 'org\_%' THEN split_part(id, '_', 1) || '_' || split_part(id, '_', 2)
    WHEN id LIKE 'DOC-%' THEN 'org_demo'
    ELSE NULL
END
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_org ON iper_matrices(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_docs_org ON preventive_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_preferences_org ON organization_preferences(organization_id);


-- ========== 20260922_iper_fk_and_status.sql ==========
ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_wc ON iper_matrices(work_center_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_area ON iper_matrices(area_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_org_status ON iper_matrices(organization_id, status);


-- ========== 20260923_preventive_plan_tables.sql ==========
CREATE TABLE IF NOT EXISTS preventive_plans (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Programa Anual',
    year INTEGER,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Archivado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_preventive_plans_org_active
    ON preventive_plans(organization_id) WHERE status = 'Activo';

CREATE TABLE IF NOT EXISTS preventive_activities (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES preventive_plans(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    category TEXT NOT NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    area_name TEXT,
    responsible_user_id TEXT,
    responsible_user_name TEXT,
    responsible_position_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    responsible_position_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    periodicity TEXT NOT NULL,
    applicability TEXT,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    weight NUMERIC NOT NULL DEFAULT 1,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preventive_activities_org ON preventive_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_activities_plan ON preventive_activities(plan_id);

CREATE TABLE IF NOT EXISTS preventive_evidence (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES preventive_activities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preventive_evidence_activity ON preventive_evidence(activity_id);

DROP TRIGGER IF EXISTS trg_preventive_plans_updated_at ON preventive_plans;
CREATE TRIGGER trg_preventive_plans_updated_at
    BEFORE UPDATE ON preventive_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_preventive_activities_updated_at ON preventive_activities;
CREATE TRIGGER trg_preventive_activities_updated_at
    BEFORE UPDATE ON preventive_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE preventive_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_evidence ENABLE ROW LEVEL SECURITY;


-- ========== 20260924_technical_documents.sql ==========
CREATE TABLE IF NOT EXISTS technical_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Borrador',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_documents_org ON technical_documents(organization_id);

DROP TRIGGER IF EXISTS trg_technical_documents_updated_at ON technical_documents;
CREATE TRIGGER trg_technical_documents_updated_at
    BEFORE UPDATE ON technical_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE technical_documents ENABLE ROW LEVEL SECURITY;


-- ========== 20260925_storage_buckets.sql ==========
-- Storage buckets (run in Supabase SQL editor if storage schema not available via migration)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('organization-logos', 'organization-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('program-evidence', 'program-evidence', false, 52428800, NULL),
  ('technical-documents', 'technical-documents', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;


-- ========== bootstrap_open_rls_new_tables.sql ==========
-- Políticas abiertas para tablas nuevas hasta vincular Supabase Auth (migración 20260926).
-- Permite que la app con anon key persista datos como en el esquema legado.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles',
    'preventive_plans',
    'preventive_activities',
    'preventive_evidence',
    'technical_documents'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "bootstrap_open_%s" ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "bootstrap_open_%s" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ========== bootstrap_data.sql ==========
-- Datos iniciales LifeOn (cuentas de prueba / multi-tenant)
-- Ejecutar después de las migraciones 20260911–20260925

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51-200', 'Activo'),
  ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();

INSERT INTO organization_preferences (id, organization_id, preferences)
VALUES
  ('default_org', 'org_demo', '{"onboardingCompleted":false}'::jsonb),
  ('org_luis', 'org_luis', '{"onboardingCompleted":false}'::jsonb),
  ('org_sergio', 'org_sergio', '{"onboardingCompleted":false}'::jsonb),
  ('org_aldo', 'org_aldo', '{"onboardingCompleted":false}'::jsonb),
  ('org_gonzalo_c', 'org_gonzalo_c', '{"onboardingCompleted":false}'::jsonb),
  ('org_gonzalo_b', 'org_gonzalo_b', '{"onboardingCompleted":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  preferences = organization_preferences.preferences || EXCLUDED.preferences,
  updated_at = NOW();

INSERT INTO organization_members (
  id, organization_id, user_id, email, name, first_name, last_name, role, status, permissions
)
VALUES
  ('mem_user_luis', 'org_luis', 'user_luis', 'luis.godoy@safetyclub.cl', 'Luis Godoy', 'Luis', 'Godoy', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_sergio', 'org_sergio', 'user_sergio', 'sergio.jara@safetyclub.cl', 'Sergio Jara', 'Sergio', 'Jara', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_aldo', 'org_aldo', 'user_aldo', 'aldo.berrios@safetyclub.cl', 'Aldo Berríos', 'Aldo', 'Berríos', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_gonzalo_c', 'org_gonzalo_c', 'user_gonzalo_c', 'gonzalo.cabrera@safetyclub.cl', 'Gonzalo Cabrera', 'Gonzalo', 'Cabrera', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_gonzalo_b', 'org_gonzalo_b', 'user_gonzalo_b', 'gonzalo.beristain@safetyclub.cl', 'Gonzalo Beristain', 'Gonzalo', 'Beristain', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_demo_sergio', 'org_demo', 'demo_sergio', 'sergio.jara@lifeon.cl', 'Sergio A. Jara Astete', 'Sergio A.', 'Jara Astete', 'Administrador', 'Activo', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO preventive_plans (id, organization_id, name, status)
SELECT 'plan_' || o.id, o.id, 'Programa Anual', 'Activo'
FROM organizations o
ON CONFLICT (id) DO NOTHING;

