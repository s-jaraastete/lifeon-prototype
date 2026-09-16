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
