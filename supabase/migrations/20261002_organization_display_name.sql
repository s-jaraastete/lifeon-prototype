-- Nombre de organización: preferencias de onboarding prevalecen sobre organizations.name

CREATE OR REPLACE FUNCTION public.organization_display_name(p_org_id text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(op.preferences->>'organizationName'), ''),
    NULLIF(trim(o.name), ''),
    'Empresa'
  )
  FROM organizations o
  LEFT JOIN organization_preferences op
    ON op.id = CASE WHEN p_org_id = 'org_demo' THEN 'default_org' ELSE p_org_id END
  WHERE o.id = p_org_id;
$$;

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
            public.organization_display_name(m.organization_id) AS org_name
        FROM organization_members m
        LEFT JOIN positions p ON p.id = m.cargo_id
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
