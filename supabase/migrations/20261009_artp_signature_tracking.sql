-- Seguimiento de firmas ARTP, lectura para firmantes y publicación automática al completar.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.can_read_artp_version(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
  v_status TEXT;
  v_cargo TEXT;
BEGIN
  SELECT organization_id, status INTO v_org, v_status
  FROM artp_versions WHERE id = p_version_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM document_deliveries d
    WHERE d.source_type = 'artp'
      AND d.source_id = p_version_id
      AND d.assignee_auth_user_id = auth.uid()
      AND d.status <> 'anulado'
  ) THEN
    RETURN true;
  END IF;

  SELECT cargo_id INTO v_cargo FROM organization_members
  WHERE organization_id = v_org AND auth_user_id = auth.uid() AND status = 'Activo'
  LIMIT 1;

  IF v_status = 'vigente' AND v_cargo IS NOT NULL AND EXISTS (
    SELECT 1 FROM artp_version_positions vp
    WHERE vp.version_id = p_version_id AND vp.position_id = v_cargo
  ) THEN RETURN true; END IF;

  IF EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN artp_execution_participants p ON p.execution_id = e.id
    JOIN organization_members m ON m.id = p.member_id
    WHERE e.artp_version_id = p_version_id AND m.auth_user_id = auth.uid()
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_artp_version_core(
  p_version_id TEXT,
  p_require_editor BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF p_require_editor AND NOT public.is_org_editor(v_ver.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;
  v_hash := encode(extensions.digest(convert_to(v_snap::text, 'UTF8'), 'sha256'), 'hex');

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

CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.publish_artp_version_core(p_version_id, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.try_auto_publish_artp_if_fully_signed(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_pending INT;
  v_signed INT;
BEGIN
  SELECT status INTO v_status FROM artp_versions WHERE id = p_version_id;
  IF v_status IS DISTINCT FROM 'en_revision' THEN
    RETURN;
  END IF;

  SELECT
    count(*) FILTER (WHERE status IN ('pendiente_revision', 'pendiente_firma')),
    count(*) FILTER (WHERE status = 'firmado')
  INTO v_pending, v_signed
  FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status <> 'anulado';

  IF COALESCE(v_signed, 0) < 1 OR COALESCE(v_pending, 0) > 0 THEN
    RETURN;
  END IF;

  PERFORM public.publish_artp_version_core(p_version_id, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_artp_signature_progress(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signers JSONB;
  v_pending INT;
  v_total INT;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id)
     AND NOT EXISTS (
       SELECT 1 FROM artp_versions v
       WHERE v.id = p_version_id AND public.is_org_editor(v.organization_id)
     ) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'memberId', d.assignee_member_id,
    'name', m.name,
    'role', COALESCE(d.content_snapshot->>'assigneeRole', 'worker'),
    'status', d.status,
    'signedAt', d.signed_at
  ) ORDER BY m.name), '[]'::jsonb)
  INTO v_signers
  FROM document_deliveries d
  JOIN organization_members m ON m.id = d.assignee_member_id
  WHERE d.source_type = 'artp'
    AND d.source_id = p_version_id
    AND d.status <> 'anulado';

  SELECT
    count(*) FILTER (WHERE status IN ('pendiente_revision', 'pendiente_firma')),
    count(*)
  INTO v_pending, v_total
  FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status <> 'anulado';

  RETURN jsonb_build_object(
    'signers', v_signers,
    'pending', COALESCE(v_pending, 0),
    'total', COALESCE(v_total, 0),
    'allSigned', COALESCE(v_total, 0) > 0 AND COALESCE(v_pending, 0) = 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_artp_documents()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t) ORDER BY t."assignedAt" DESC)
    FROM (
      SELECT
        v.id AS "versionId",
        v.task_name AS "taskName",
        v.version_number AS "versionNumber",
        v.status AS "documentStatus",
        d.id AS "deliveryId",
        d.status AS "mySignatureStatus",
        COALESCE(d.content_snapshot->>'assigneeRole', 'worker') AS "assigneeRole",
        d.title AS title,
        d.assigned_at AS "assignedAt"
      FROM document_deliveries d
      JOIN artp_versions v ON v.id = d.source_id
      WHERE d.source_type = 'artp'
        AND d.assignee_auth_user_id = v_uid
        AND d.status <> 'anulado'
    ) t
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.register_acknowledgement(
  p_delivery_id uuid,
  p_signature_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row document_deliveries%ROWTYPE;
  v_uid uuid := auth.uid();
  v_expected_prefix text;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF p_signature_path IS NULL OR trim(p_signature_path) = '' THEN
    RAISE EXCEPTION 'Ruta de firma requerida';
  END IF;

  SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega no encontrada';
  END IF;
  IF v_row.assignee_auth_user_id <> v_uid THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
    RAISE EXCEPTION 'La entrega no está pendiente de firma';
  END IF;

  v_expected_prefix := v_row.organization_id || '/' || v_uid::text || '/';
  IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
    RAISE EXCEPTION 'Ruta de firma inválida';
  END IF;

  UPDATE document_deliveries
  SET
    status = 'firmado',
    signed_at = clock_timestamp(),
    signed_by_auth_user_id = v_uid,
    signature_path = p_signature_path
  WHERE id = p_delivery_id;

  IF v_row.source_type = 'artp' THEN
    v_role := COALESCE(v_row.content_snapshot->>'assigneeRole', 'worker');
    PERFORM public.apply_artp_signature_to_planning(
      v_row.source_id,
      v_row.assignee_member_id,
      v_role,
      p_signature_path
    );
    PERFORM public.try_auto_publish_artp_if_fully_signed(v_row.source_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_artp_signature_progress(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_artp_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_artp_version(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.publish_artp_version_core(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.try_auto_publish_artp_if_fully_signed(TEXT) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM artp_versions WHERE status = 'en_revision'
  LOOP
    PERFORM public.try_auto_publish_artp_if_fully_signed(r.id);
  END LOOP;
END;
$$;
