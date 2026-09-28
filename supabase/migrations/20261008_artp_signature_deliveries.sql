-- ARTP en revisión: crear entregas móviles (document_deliveries) para trabajadores y supervisor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE document_deliveries DROP CONSTRAINT IF EXISTS document_deliveries_source_type_check;
ALTER TABLE document_deliveries ADD CONSTRAINT document_deliveries_source_type_check
  CHECK (source_type IN ('irl', 'technical_document', 'artp'));

CREATE OR REPLACE FUNCTION public.hash_jsonb_content(payload jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(payload::text, 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.apply_artp_signature_to_planning(
  p_version_id TEXT,
  p_member_id TEXT,
  p_assignee_role TEXT,
  p_signature_path TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_planning JSONB;
  v_workers JSONB;
  v_wc JSONB;
  v_signed JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_signed := jsonb_build_object(
    'signatureStoragePath', p_signature_path,
    'signedAt', to_jsonb(clock_timestamp())
  );

  IF p_assignee_role IN ('supervisor', 'worker_and_supervisor') THEN
    v_wc := COALESCE(v_planning->'workContext', '{}'::jsonb);
    v_wc := v_wc || v_signed;
    v_planning := jsonb_set(v_planning, '{workContext}', v_wc, true);
  END IF;

  IF p_assignee_role IN ('worker', 'worker_and_supervisor') THEN
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem->>'memberId' = p_member_id THEN elem || v_signed
          ELSE elem
        END
      ),
      '[]'::jsonb
    )
    INTO v_workers
    FROM jsonb_array_elements(COALESCE(v_planning->'workers', '[]'::jsonb)) AS elem;

    v_planning := jsonb_set(v_planning, '{workers}', v_workers, true);
  END IF;

  UPDATE artp_versions
  SET
    content_snapshot = jsonb_set(
      COALESCE(content_snapshot, '{}'::jsonb),
      '{planning}',
      v_planning,
      true
    ),
    updated_at = NOW()
  WHERE id = p_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_artp_version_signature_deliveries(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snap JSONB;
  v_planning JSONB;
  v_workers JSONB;
  v_worker JSONB;
  v_member_id TEXT;
  v_assignee organization_members%ROWTYPE;
  v_uid uuid := auth.uid();
  v_hash TEXT;
  v_title TEXT;
  v_code TEXT;
  v_delivery_snap JSONB;
  v_supervisor_id TEXT;
  v_target_members TEXT[] := ARRAY[]::TEXT[];
  v_existing UUID;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versión no encontrada';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT public.is_org_editor(v_ver.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  IF v_ver.status <> 'en_revision' THEN
    RETURN;
  END IF;

  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;
  v_snap := COALESCE(v_ver.content_snapshot, public.build_artp_version_snapshot(p_version_id));
  v_planning := COALESCE(v_snap->'planning', '{}'::jsonb);
  v_workers := COALESCE(v_planning->'workers', '[]'::jsonb);
  v_hash := public.hash_jsonb_content(v_snap);
  v_title := 'ARTP — ' || COALESCE(NULLIF(trim(v_ver.task_name), ''), v_doc.name, 'Tarea');
  v_code := COALESCE(NULLIF(trim(v_doc.code), ''), 'ARTP') || '-V' || v_ver.version_number::text;

  FOR v_worker IN SELECT value FROM jsonb_array_elements(v_workers) AS t(value)
  LOOP
    v_member_id := NULLIF(trim(v_worker->>'memberId'), '');
    IF v_member_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_assignee
    FROM organization_members m
    WHERE m.id = v_member_id
      AND m.organization_id = v_ver.organization_id
      AND m.status = 'Activo';

    IF NOT FOUND OR v_assignee.auth_user_id IS NULL THEN
      CONTINUE;
    END IF;

    v_target_members := array_append(v_target_members, v_member_id);

    v_delivery_snap := v_snap || jsonb_build_object(
      'assigneeRole', 'worker',
      'assigneeWorkerId', v_worker->>'id'
    );

    SELECT id INTO v_existing
    FROM document_deliveries
    WHERE source_type = 'artp'
      AND source_id = p_version_id
      AND assignee_member_id = v_member_id
      AND status = 'firmado'
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      UPDATE document_deliveries
      SET
        title = v_title,
        document_code = v_code,
        content_snapshot = v_delivery_snap,
        content_hash = v_hash,
        updated_at = NOW()
      WHERE id = v_existing;
    ELSE
    SELECT id INTO v_existing
    FROM document_deliveries
    WHERE source_type = 'artp'
      AND source_id = p_version_id
      AND assignee_member_id = v_member_id
      AND status IN ('pendiente_revision', 'pendiente_firma')
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      UPDATE document_deliveries
      SET
        title = v_title,
        document_code = v_code,
        content_snapshot = v_delivery_snap,
        content_hash = v_hash,
        cargo_id = v_assignee.cargo_id,
        cargo_name = (
          SELECT name FROM positions WHERE id = v_assignee.cargo_id
        ),
        work_center_id = v_assignee.work_center_id,
        work_center_name = (
          SELECT name FROM work_centers WHERE id = v_assignee.work_center_id
        ),
        updated_at = NOW()
      WHERE id = v_existing;
    ELSE
      INSERT INTO document_deliveries (
        organization_id,
        assignee_member_id,
        assignee_auth_user_id,
        source_type,
        source_id,
        cargo_id,
        cargo_name,
        work_center_id,
        work_center_name,
        title,
        document_code,
        content_snapshot,
        content_hash,
        source_updated_at,
        status,
        assigned_by
      ) VALUES (
        v_ver.organization_id,
        v_member_id,
        v_assignee.auth_user_id,
        'artp',
        p_version_id,
        v_assignee.cargo_id,
        (SELECT name FROM positions WHERE id = v_assignee.cargo_id),
        v_assignee.work_center_id,
        (SELECT name FROM work_centers WHERE id = v_assignee.work_center_id),
        v_title,
        v_code,
        v_delivery_snap,
        v_hash,
        v_ver.updated_at,
        'pendiente_revision',
        v_uid
      );
    END IF;
    END IF;
  END LOOP;

  v_supervisor_id := NULLIF(trim(v_planning->'workContext'->>'supervisorMemberId'), '');
  IF v_supervisor_id IS NOT NULL THEN
    SELECT * INTO v_assignee
    FROM organization_members m
    WHERE m.id = v_supervisor_id
      AND m.organization_id = v_ver.organization_id
      AND m.status = 'Activo';

    IF FOUND AND v_assignee.auth_user_id IS NOT NULL THEN
      IF NOT (v_supervisor_id = ANY (v_target_members)) THEN
        v_target_members := array_append(v_target_members, v_supervisor_id);
      END IF;

      v_delivery_snap := v_snap || jsonb_build_object(
        'assigneeRole',
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM jsonb_array_elements(v_workers) AS w
            WHERE NULLIF(trim(w.value->>'memberId'), '') = v_supervisor_id
          ) THEN 'worker_and_supervisor'
          ELSE 'supervisor'
        END
      );

      SELECT id INTO v_existing
      FROM document_deliveries
      WHERE source_type = 'artp'
        AND source_id = p_version_id
        AND assignee_member_id = v_supervisor_id
        AND status = 'firmado'
      LIMIT 1;

      IF v_existing IS NOT NULL THEN
        UPDATE document_deliveries
        SET
          title = v_title,
          document_code = v_code,
          content_snapshot = v_delivery_snap,
          content_hash = v_hash,
          updated_at = NOW()
        WHERE id = v_existing;
      ELSE
      SELECT id INTO v_existing
      FROM document_deliveries
      WHERE source_type = 'artp'
        AND source_id = p_version_id
        AND assignee_member_id = v_supervisor_id
        AND status IN ('pendiente_revision', 'pendiente_firma')
      LIMIT 1;

      IF v_existing IS NOT NULL THEN
        UPDATE document_deliveries
        SET
          title = v_title,
          document_code = v_code,
          content_snapshot = v_delivery_snap,
          content_hash = v_hash,
          updated_at = NOW()
        WHERE id = v_existing;
      ELSE
        INSERT INTO document_deliveries (
          organization_id,
          assignee_member_id,
          assignee_auth_user_id,
          source_type,
          source_id,
          cargo_id,
          cargo_name,
          work_center_id,
          work_center_name,
          title,
          document_code,
          content_snapshot,
          content_hash,
          source_updated_at,
          status,
          assigned_by
        ) VALUES (
          v_ver.organization_id,
          v_supervisor_id,
          v_assignee.auth_user_id,
          'artp',
          p_version_id,
          v_assignee.cargo_id,
          (SELECT name FROM positions WHERE id = v_assignee.cargo_id),
          v_assignee.work_center_id,
          (SELECT name FROM work_centers WHERE id = v_assignee.work_center_id),
          v_title,
          v_code,
          v_delivery_snap,
          v_hash,
          v_ver.updated_at,
          'pendiente_revision',
          v_uid
        );
      END IF;
      END IF;
    END IF;
  END IF;

  UPDATE document_deliveries
  SET
    status = 'anulado',
    voided_at = clock_timestamp(),
    voided_by = v_uid,
    void_reason = 'Ya no figura en la planificación ARTP'
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status IN ('pendiente_revision', 'pendiente_firma')
    AND NOT (assignee_member_id = ANY (v_target_members));
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

  PERFORM public.sync_artp_version_signature_deliveries(p_version_id);
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
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_artp_version_signature_deliveries(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_artp_signature_to_planning(TEXT, TEXT, TEXT, TEXT) TO authenticated;
