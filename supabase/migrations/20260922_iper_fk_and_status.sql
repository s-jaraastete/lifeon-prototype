ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_wc ON iper_matrices(work_center_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_area ON iper_matrices(area_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_org_status ON iper_matrices(organization_id, status);
