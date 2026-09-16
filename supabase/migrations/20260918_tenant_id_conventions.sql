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
