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
