CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.get_artp_version_detail(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snapshot JSONB;
  v_planning JSONB;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);

  IF v_ver.status IN ('vigente', 'archivado') AND v_ver.content_snapshot IS NOT NULL
     AND v_ver.content_snapshot <> '{}'::jsonb THEN
    v_snapshot := v_ver.content_snapshot;
  ELSE
    v_snapshot := public.build_artp_version_snapshot(p_version_id);
    IF v_planning <> '{}'::jsonb THEN
      v_snapshot := v_snapshot || jsonb_build_object('planning', v_planning);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'name', v_doc.name, 'code', v_doc.code, 'description', v_doc.description
    ),
    'version', jsonb_build_object(
      'id', v_ver.id, 'versionNumber', v_ver.version_number, 'status', v_ver.status,
      'taskName', v_ver.task_name, 'contentHash', v_ver.content_hash, 'publishedAt', v_ver.published_at
    ),
    'content', v_snapshot
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;
  v_hash := encode(digest(v_snap::text, 'sha256'), 'hex');

  UPDATE artp_versions SET status = 'archivado', updated_at = NOW()
  WHERE artp_document_id = v_ver.artp_document_id AND status = 'vigente';

  UPDATE artp_versions SET
    status = 'vigente',
    content_snapshot = v_snap,
    content_hash = v_hash,
    published_at = clock_timestamp(),
    updated_at = NOW()
  WHERE id = p_version_id;

  UPDATE artp_documents SET current_version_id = p_version_id, updated_at = NOW()
  WHERE id = v_ver.artp_document_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_artp_version_for_signatures(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status <> 'borrador' THEN
    RAISE EXCEPTION 'Solo borradores pueden enviarse a firma';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;

  UPDATE artp_versions SET
    status = 'en_revision',
    content_snapshot = v_snap,
    updated_at = NOW()
  WHERE id = p_version_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_artp_version_for_signatures(TEXT) TO authenticated;
