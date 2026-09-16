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
