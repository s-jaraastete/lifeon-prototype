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
