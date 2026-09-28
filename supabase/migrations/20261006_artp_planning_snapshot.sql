-- Preserve planning metadata (antecedentes, gestión de cambios, firmas) in published snapshots
CREATE OR REPLACE FUNCTION public.build_artp_version_snapshot(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_steps JSONB := '[]'::jsonb;
  v_positions JSONB := '[]'::jsonb;
  v_planning JSONB := '{}'::jsonb;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('positionId', vp.position_id)), '[]'::jsonb)
  INTO v_positions FROM artp_version_positions vp WHERE vp.version_id = p_version_id;

  SELECT COALESCE(jsonb_agg(step_json ORDER BY (step_json->>'sequence')::int), '[]'::jsonb)
  INTO v_steps
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'sequence', s.sequence,
      'description', s.description,
      'tools', s.tools,
      'energies', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', et.id, 'code', et.code, 'label', et.label)), '[]'::jsonb)
        FROM artp_step_energies se JOIN energy_types et ON et.id = se.energy_type_id
        WHERE se.step_id = s.id
      ),
      'hazards', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'name', h.name, 'classification', h.classification,
          'risks', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'id', r.id, 'name', r.name,
              'controls', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'id', c.id, 'description', c.description, 'controlType', c.control_type,
                  'isCritical', c.is_critical, 'verificationQuestion', c.verification_question
                )), '[]'::jsonb)
                FROM artp_step_controls c WHERE c.risk_id = r.id
              )
            )), '[]'::jsonb)
            FROM artp_step_risks r WHERE r.hazard_id = h.id
          )
        )), '[]'::jsonb)
        FROM artp_step_hazards h WHERE h.step_id = s.id
      )
    ) AS step_json
    FROM artp_steps s WHERE s.version_id = p_version_id
  ) sub;

  RETURN jsonb_build_object(
    'kind', 'artp',
    'documentId', v_doc.id,
    'documentName', v_doc.name,
    'documentCode', v_doc.code,
    'versionId', v_ver.id,
    'versionNumber', v_ver.version_number,
    'taskName', v_ver.task_name,
    'positions', v_positions,
    'steps', v_steps,
    'planning', v_planning
  );
END;
$$;
