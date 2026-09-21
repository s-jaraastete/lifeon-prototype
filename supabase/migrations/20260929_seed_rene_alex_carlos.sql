-- Cuentas de prueba vacías: René, Alex, Carlos

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_rene', 'Ramos Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_alex', 'Ordenes Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_carlos', 'Subiabre Ingeniería SpA', 'Construcción', '21-50', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();

INSERT INTO organization_preferences (id, organization_id, preferences)
VALUES
  ('org_rene', 'org_rene', '{"onboardingCompleted":false}'::jsonb),
  ('org_alex', 'org_alex', '{"onboardingCompleted":false}'::jsonb),
  ('org_carlos', 'org_carlos', '{"onboardingCompleted":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  updated_at = NOW();

INSERT INTO organization_members (
  id, organization_id, user_id, email, name, first_name, last_name, role, status, permissions
)
VALUES
  ('mem_user_rene', 'org_rene', 'user_rene', 'rene.ramos@safetyclub.cl', 'René Ramos', 'René', 'Ramos', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_alex', 'org_alex', 'user_alex', 'alex.ordenes@safetyclub.cl', 'Alex Ordenes', 'Alex', 'Ordenes', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_carlos', 'org_carlos', 'user_carlos', 'carlos.subiabre@safetyclub.cl', 'Carlos Subiabre', 'Carlos', 'Subiabre', 'Administrador', 'Activo', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO preventive_plans (id, organization_id, name, status)
VALUES
  ('plan_org_rene', 'org_rene', 'Programa Anual', 'Activo'),
  ('plan_org_alex', 'org_alex', 'Programa Anual', 'Activo'),
  ('plan_org_carlos', 'org_carlos', 'Programa Anual', 'Activo')
ON CONFLICT (id) DO NOTHING;
