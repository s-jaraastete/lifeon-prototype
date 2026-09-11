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
