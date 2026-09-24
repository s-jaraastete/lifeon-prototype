-- Document deliveries: asignación, snapshot y toma de conocimiento (Mobile + Web)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.evaluation_matches_cargo(ev_cargo text, target_cargo text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN ev_cargo IS NULL OR target_cargo IS NULL OR trim(target_cargo) = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM unnest(regexp_split_to_array(trim(ev_cargo), '[,/;•]')) AS t(token)
      WHERE lower(trim(token)) = lower(trim(target_cargo))
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.filter_hazards_for_cargo(hazards jsonb, target_cargo text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(ev ORDER BY ordinality),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(hazards, '[]'::jsonb)) WITH ORDINALITY AS t(ev, ordinality)
  WHERE public.evaluation_matches_cargo(ev->>'cargo', target_cargo);
$$;

CREATE OR REPLACE FUNCTION public.hash_jsonb_content(payload jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(payload::text, 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignee_member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    assignee_auth_user_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('irl', 'technical_document')),
    source_id TEXT NOT NULL,
    cargo_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    cargo_name TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    work_center_name TEXT,
    title TEXT NOT NULL,
    document_code TEXT,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT NOT NULL,
    source_updated_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pendiente_revision'
        CHECK (status IN ('pendiente_revision', 'pendiente_firma', 'firmado', 'anulado')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signed_by_auth_user_id UUID,
    signature_path TEXT,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_deliveries_org ON document_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_deliveries_assignee_auth ON document_deliveries(assignee_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_document_deliveries_status ON document_deliveries(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_document_deliveries_open_assignment
    ON document_deliveries (source_type, source_id, assignee_member_id)
    WHERE status IN ('pendiente_revision', 'pendiente_firma');

DROP TRIGGER IF EXISTS trg_document_deliveries_updated_at ON document_deliveries;
CREATE TRIGGER trg_document_deliveries_updated_at
    BEFORE UPDATE ON document_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_signed_document_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('firmado', 'anulado') THEN
        IF NEW.content_snapshot IS DISTINCT FROM OLD.content_snapshot
            OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
            OR NEW.assignee_member_id IS DISTINCT FROM OLD.assignee_member_id
            OR NEW.assignee_auth_user_id IS DISTINCT FROM OLD.assignee_auth_user_id
            OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
            OR NEW.signed_by_auth_user_id IS DISTINCT FROM OLD.signed_by_auth_user_id
            OR NEW.source_type IS DISTINCT FROM OLD.source_type
            OR NEW.source_id IS DISTINCT FROM OLD.source_id
        THEN
            RAISE EXCEPTION 'No se puede modificar un registro firmado o anulado';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_signed_document_delivery ON document_deliveries;
CREATE TRIGGER trg_protect_signed_document_delivery
    BEFORE UPDATE ON document_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_signed_document_delivery();

ALTER TABLE document_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_deliveries_select" ON document_deliveries
    FOR SELECT TO authenticated
    USING (
        assignee_auth_user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_org_editor(organization_id))
    );

REVOKE INSERT, UPDATE, DELETE ON document_deliveries FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for signature evidence
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'acknowledgement-evidence',
    'acknowledgement-evidence',
    false,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ack_evidence_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[1] IS NOT NULL
        AND public.is_org_member((storage.foldername(name))[1])
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "ack_evidence_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND (
            (storage.foldername(name))[2] = auth.uid()::text
            OR public.is_org_editor((storage.foldername(name))[1])
        )
    );

CREATE POLICY "ack_evidence_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[2] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "ack_evidence_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND public.is_org_editor((storage.foldername(name))[1])
    );

-- ---------------------------------------------------------------------------
-- RPC: get_my_irl
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_irl()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_result jsonb := '[]'::jsonb;
    v_member record;
    v_mat record;
    v_filtered jsonb;
    v_wc_display text;
    v_sort_key int;
    v_entry jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    FOR v_member IN
        SELECT
            m.id AS member_id,
            m.organization_id,
            m.cargo_id,
            m.work_center_id,
            p.name AS cargo_name,
            o.name AS org_name
        FROM organization_members m
        LEFT JOIN positions p ON p.id = m.cargo_id
        LEFT JOIN organizations o ON o.id = m.organization_id
        WHERE m.auth_user_id = v_uid
          AND m.status = 'Activo'
          AND m.cargo_id IS NOT NULL
          AND p.name IS NOT NULL
    LOOP
        FOR v_mat IN
            SELECT im.*, wc.name AS wc_fk_name
            FROM iper_matrices im
            LEFT JOIN work_centers wc ON wc.id = im.work_center_id
            WHERE im.organization_id = v_member.organization_id
              AND im.status = 'Vigente'
        LOOP
            v_filtered := public.filter_hazards_for_cargo(v_mat.hazards, v_member.cargo_name);
            IF jsonb_array_length(v_filtered) = 0 THEN
                CONTINUE;
            END IF;

            v_wc_display := COALESCE(v_mat.wc_fk_name, v_mat.work_center, '');
            v_sort_key := CASE
                WHEN v_member.work_center_id IS NOT NULL
                     AND v_mat.work_center_id = v_member.work_center_id THEN 0
                WHEN v_member.work_center_id IS NOT NULL THEN 1
                ELSE 0
            END;

            v_entry := jsonb_build_object(
                'memberId', v_member.member_id,
                'organizationId', v_member.organization_id,
                'organizationName', v_member.org_name,
                'matrixId', v_mat.id,
                'matrixCode', v_mat.code,
                'matrixTitle', v_mat.title,
                'workCenterId', v_mat.work_center_id,
                'workCenterName', v_wc_display,
                'cargoId', v_member.cargo_id,
                'cargoName', v_member.cargo_name,
                'matrixUpdatedAt', v_mat.updated_at,
                'sortKey', v_sort_key,
                'evaluations', v_filtered
            );
            v_result := v_result || jsonb_build_array(v_entry);
        END LOOP;
    END LOOP;

    IF jsonb_array_length(v_result) = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN (
        SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'sortKey')::int, elem->>'matrixCode'), '[]'::jsonb)
        FROM jsonb_array_elements(v_result) AS elem
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: assign_document
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_document(
    p_organization_id text,
    p_source_type text,
    p_source_id text,
    p_assignee_member_id text,
    p_cargo_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_assignee record;
    v_snapshot jsonb;
    v_hash text;
    v_title text;
    v_code text;
    v_source_updated timestamptz;
    v_wc_id text;
    v_wc_name text;
    v_cargo_id text;
    v_cargo_name text;
    v_new_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;
    IF NOT public.is_org_editor(p_organization_id) THEN
        RAISE EXCEPTION 'Sin permiso para asignar documentos';
    END IF;
    IF p_source_type NOT IN ('irl', 'technical_document') THEN
        RAISE EXCEPTION 'Tipo de documento inválido';
    END IF;

    SELECT m.*, p.name AS position_name, wc.name AS wc_name
    INTO v_assignee
    FROM organization_members m
    LEFT JOIN positions p ON p.id = m.cargo_id
    LEFT JOIN work_centers wc ON wc.id = m.work_center_id
    WHERE m.id = p_assignee_member_id
      AND m.organization_id = p_organization_id
      AND m.status = 'Activo';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trabajador no encontrado o inactivo';
    END IF;
    IF v_assignee.auth_user_id IS NULL THEN
        RAISE EXCEPTION 'El trabajador no tiene cuenta de acceso vinculada';
    END IF;

    v_cargo_id := v_assignee.cargo_id;
    v_cargo_name := COALESCE(p_cargo_name, v_assignee.position_name);
    v_wc_id := v_assignee.work_center_id;
    v_wc_name := v_assignee.wc_name;

    IF p_source_type = 'irl' THEN
        DECLARE
            v_mat record;
            v_filtered jsonb;
        BEGIN
            SELECT * INTO v_mat
            FROM iper_matrices
            WHERE id = p_source_id
              AND organization_id = p_organization_id
              AND status = 'Vigente';

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Matriz IRL no vigente o no encontrada';
            END IF;
            IF v_cargo_name IS NULL OR trim(v_cargo_name) = '' THEN
                RAISE EXCEPTION 'Cargo requerido para envío de IRL';
            END IF;

            v_filtered := public.filter_hazards_for_cargo(v_mat.hazards, v_cargo_name);
            IF jsonb_array_length(v_filtered) = 0 THEN
                RAISE EXCEPTION 'No hay evaluaciones para el cargo indicado';
            END IF;

            v_wc_name := COALESCE(v_wc_name, (
                SELECT name FROM work_centers WHERE id = v_mat.work_center_id
            ), v_mat.work_center);

            v_snapshot := jsonb_build_object(
                'kind', 'irl',
                'matrixId', v_mat.id,
                'matrixCode', v_mat.code,
                'matrixTitle', v_mat.title,
                'workCenterName', v_wc_name,
                'cargoName', v_cargo_name,
                'responsible', v_mat.responsible,
                'evaluations', v_filtered
            );
            v_title := 'IRL — ' || v_cargo_name;
            v_code := 'IRL-' || v_mat.code || '-' || upper(left(v_cargo_name, 3));
            v_source_updated := v_mat.updated_at;
        END;
    ELSE
        DECLARE
            v_doc record;
        BEGIN
            SELECT * INTO v_doc
            FROM technical_documents
            WHERE id = p_source_id
              AND organization_id = p_organization_id
              AND status = 'Vigente';

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Documento técnico no vigente o no encontrado';
            END IF;

            v_snapshot := jsonb_build_object(
                'kind', 'technical_document',
                'documentId', v_doc.id,
                'documentType', v_doc.document_type,
                'name', v_doc.name,
                'content', v_doc.content
            );
            v_title := v_doc.name;
            v_code := v_doc.document_type || '-' || v_doc.id;
            v_source_updated := v_doc.updated_at;
        END;
    END IF;

    v_hash := public.hash_jsonb_content(v_snapshot);

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
        p_organization_id,
        p_assignee_member_id,
        v_assignee.auth_user_id,
        p_source_type,
        p_source_id,
        v_cargo_id,
        v_cargo_name,
        v_wc_id,
        v_wc_name,
        v_title,
        v_code,
        v_snapshot,
        v_hash,
        v_source_updated,
        'pendiente_revision',
        v_uid
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mark_document_opened
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_document_opened(p_delivery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF v_row.assignee_auth_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
        RETURN;
    END IF;
    IF v_row.opened_at IS NULL THEN
        UPDATE document_deliveries
        SET opened_at = clock_timestamp()
        WHERE id = p_delivery_id;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: confirm_document_review (pendiente_firma)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirm_document_review(p_delivery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF v_row.assignee_auth_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_row.status = 'pendiente_revision' THEN
        UPDATE document_deliveries
        SET status = 'pendiente_firma'
        WHERE id = p_delivery_id;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register_acknowledgement
-- ---------------------------------------------------------------------------

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
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: void_document_delivery
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.void_document_delivery(
    p_delivery_id uuid,
    p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF NOT public.is_org_editor(v_row.organization_id) THEN
        RAISE EXCEPTION 'Sin permiso';
    END IF;
    IF v_row.status = 'anulado' THEN
        RETURN;
    END IF;

    UPDATE document_deliveries
    SET
        status = 'anulado',
        voided_at = clock_timestamp(),
        voided_by = auth.uid(),
        void_reason = p_reason
    WHERE id = p_delivery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_irl() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_document(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_document_opened(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_document_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_acknowledgement(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_document_delivery(uuid, text) TO authenticated;
