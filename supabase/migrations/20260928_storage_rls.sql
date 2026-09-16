-- Storage RLS (requires is_org_member from 20260926)

CREATE POLICY "avatars_own_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "org_logos_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'organization-logos' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'organization-logos' AND public.is_org_editor((storage.foldername(name))[1]));

CREATE POLICY "program_evidence_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'program-evidence' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'program-evidence' AND public.is_org_editor((storage.foldername(name))[1]));

CREATE POLICY "technical_docs_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'technical-documents' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'technical-documents' AND public.is_org_editor((storage.foldername(name))[1]));
