-- Datos iniciales LifeOn (cuentas de prueba / multi-tenant)
-- Ejecutar después de las migraciones 20260911–20260925

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51-200', 'Activo'),
  ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_rene', 'Ramos Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_alex', 'Ordenes Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_carlos', 'Subiabre Ingeniería SpA', 'Construcción', '21-50', 'Activo')
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
  ('org_gonzalo_b', 'org_gonzalo_b', '{"onboardingCompleted":false}'::jsonb),
  ('org_rene', 'org_rene', '{"onboardingCompleted":false}'::jsonb),
  ('org_alex', 'org_alex', '{"onboardingCompleted":false}'::jsonb),
  ('org_carlos', 'org_carlos', '{"onboardingCompleted":false}'::jsonb)
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
  ('mem_demo_sergio', 'org_demo', 'demo_sergio', 'sergio.jara@lifeon.cl', 'Sergio A. Jara Astete', 'Sergio A.', 'Jara Astete', 'Administrador', 'Activo', '{}'::jsonb),
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
SELECT 'plan_' || o.id, o.id, 'Programa Anual', 'Activo'
FROM organizations o
ON CONFLICT (id) DO NOTHING;
