-- Nueva versión de un ARTP vigente: copia el documento formal (snapshot + pasos),
-- sin firmas, y lo deja como borrador actual para editarlo.

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
  v_built_steps INT;
  v_stored_steps INT;
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
    v_built_steps := COALESCE(
      CASE WHEN jsonb_typeof(v_snapshot->'steps') = 'array'
        THEN jsonb_array_length(v_snapshot->'steps') ELSE 0 END,
      0
    );
    v_stored_steps := COALESCE(
      CASE WHEN jsonb_typeof(v_ver.content_snapshot->'steps') = 'array'
        THEN jsonb_array_length(v_ver.content_snapshot->'steps') ELSE 0 END,
      0
    );
    IF v_built_steps = 0 AND v_stored_steps > 0 THEN
      v_snapshot := v_ver.content_snapshot;
    END IF;
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

CREATE OR REPLACE FUNCTION public.clone_artp_version(p_source_version_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src artp_versions%ROWTYPE;
  v_new_id TEXT;
  v_num INTEGER;
  v_snap JSONB;
  v_planning JSONB;
  v_workers JSONB;
  v_steps JSONB := '[]'::jsonb;
  v_id_map JSONB := '{}'::jsonb;
  v_answers JSONB := '{}'::jsonb;
  v_step JSONB;
  v_hazards JSONB;
  v_hazard JSONB;
  v_risks JSONB;
  v_risk JSONB;
  v_controls JSONB;
  v_control JSONB;
  v_old TEXT;
  v_new TEXT;
  v_tools TEXT[];
  step_rec RECORD;
  hazard_rec RECORD;
  risk_rec RECORD;
  control_rec RECORD;
  energy_rec RECORD;
  answer_rec RECORD;
  step_elem JSONB;
  hazard_elem JSONB;
  risk_elem JSONB;
  control_elem JSONB;
  energy_elem JSONB;
BEGIN
  SELECT * INTO v_src FROM artp_versions WHERE id = p_source_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_src.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_src.status <> 'vigente' THEN
    RAISE EXCEPTION 'Solo se versiona desde un ARTP vigente';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_num
  FROM artp_versions WHERE artp_document_id = v_src.artp_document_id;

  v_new_id := v_src.artp_document_id || '_ver_' || v_num;

  v_snap := COALESCE(v_src.content_snapshot, '{}'::jsonb);
  IF COALESCE(
    CASE WHEN jsonb_typeof(v_snap->'steps') = 'array' THEN jsonb_array_length(v_snap->'steps') ELSE 0 END,
    0
  ) = 0 THEN
    v_snap := public.build_artp_version_snapshot(p_source_version_id)
      || jsonb_build_object('planning', COALESCE(v_snap->'planning', '{}'::jsonb));
  END IF;

  v_planning := COALESCE(v_snap->'planning', '{}'::jsonb);
  v_planning := jsonb_set(
    v_planning,
    '{workContext}',
    COALESCE(v_planning->'workContext', '{}'::jsonb)
      - 'signatureStoragePath' - 'signedAt' - 'supervisorSignatureDataUrl',
    true
  );

  IF jsonb_typeof(v_planning->'workers') = 'array' THEN
    SELECT COALESCE(
      jsonb_agg(elem - 'signatureStoragePath' - 'signedAt' - 'signatureDataUrl'),
      '[]'::jsonb
    )
    INTO v_workers
    FROM jsonb_array_elements(v_planning->'workers') AS elem;
    v_planning := jsonb_set(v_planning, '{workers}', v_workers, true);
  END IF;

  IF jsonb_typeof(v_snap->'steps') = 'array' THEN
    FOR step_rec IN SELECT value AS elem FROM jsonb_array_elements(v_snap->'steps') LOOP
      v_step := step_rec.elem;
      v_old := COALESCE(NULLIF(v_step->>'id', ''), 'step');
      v_new := v_old || '_c' || v_num;
      v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
      v_step := jsonb_set(v_step, '{id}', to_jsonb(v_new));

      v_hazards := '[]'::jsonb;
      IF jsonb_typeof(v_step->'hazards') = 'array' THEN
        FOR hazard_rec IN SELECT value AS elem FROM jsonb_array_elements(v_step->'hazards') LOOP
          v_hazard := hazard_rec.elem;
          v_old := COALESCE(NULLIF(v_hazard->>'id', ''), 'hz');
          v_new := v_old || '_c' || v_num;
          v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
          v_hazard := jsonb_set(v_hazard, '{id}', to_jsonb(v_new));

          v_risks := '[]'::jsonb;
          IF jsonb_typeof(v_hazard->'risks') = 'array' THEN
            FOR risk_rec IN SELECT value AS elem FROM jsonb_array_elements(v_hazard->'risks') LOOP
              v_risk := risk_rec.elem;
              v_old := COALESCE(NULLIF(v_risk->>'id', ''), 'rk');
              v_new := v_old || '_c' || v_num;
              v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
              v_risk := jsonb_set(v_risk, '{id}', to_jsonb(v_new));

              v_controls := '[]'::jsonb;
              IF jsonb_typeof(v_risk->'controls') = 'array' THEN
                FOR control_rec IN SELECT value AS elem FROM jsonb_array_elements(v_risk->'controls') LOOP
                  v_control := control_rec.elem;
                  v_old := COALESCE(NULLIF(v_control->>'id', ''), 'ct');
                  v_new := v_old || '_c' || v_num;
                  v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
                  v_control := jsonb_set(v_control, '{id}', to_jsonb(v_new));
                  v_controls := v_controls || jsonb_build_array(v_control);
                END LOOP;
              END IF;

              v_risk := jsonb_set(v_risk, '{controls}', v_controls, true);
              v_risks := v_risks || jsonb_build_array(v_risk);
            END LOOP;
          END IF;

          v_hazard := jsonb_set(v_hazard, '{risks}', v_risks, true);
          v_hazards := v_hazards || jsonb_build_array(v_hazard);
        END LOOP;
      END IF;

      v_step := jsonb_set(v_step, '{hazards}', v_hazards, true);
      v_steps := v_steps || jsonb_build_array(v_step);
    END LOOP;
  END IF;

  IF jsonb_typeof(v_planning->'controlAnswers') = 'object' THEN
    FOR answer_rec IN SELECT * FROM jsonb_each(v_planning->'controlAnswers') LOOP
      v_answers := v_answers || jsonb_build_object(
        COALESCE(v_id_map->>answer_rec.key, answer_rec.key),
        answer_rec.value
      );
    END LOOP;
    v_planning := jsonb_set(v_planning, '{controlAnswers}', v_answers, true);
  END IF;

  v_snap := jsonb_set(v_snap, '{steps}', v_steps, true);
  v_snap := jsonb_set(v_snap, '{planning}', v_planning, true);

  INSERT INTO artp_versions (
    id, organization_id, artp_document_id, version_number, status,
    work_center_id, area_id, process_id, subprocess_id, org_task_id, task_name,
    supervisor_member_id, content_snapshot, created_by
  ) VALUES (
    v_new_id, v_src.organization_id, v_src.artp_document_id, v_num, 'borrador',
    v_src.work_center_id, v_src.area_id, v_src.process_id, v_src.subprocess_id,
    v_src.org_task_id, v_src.task_name, v_src.supervisor_member_id, v_snap, auth.uid()
  );

  INSERT INTO artp_version_positions (id, organization_id, version_id, position_id)
  SELECT v_new_id || '_pos_' || row_number() OVER (ORDER BY position_id),
         organization_id, v_new_id, position_id
  FROM artp_version_positions
  WHERE version_id = p_source_version_id;

  FOR step_rec IN SELECT value AS elem FROM jsonb_array_elements(v_steps) LOOP
    step_elem := step_rec.elem;
    v_tools := ARRAY(
      SELECT jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(step_elem->'tools') = 'array' THEN step_elem->'tools'
          ELSE '[]'::jsonb
        END
      )
    );

    INSERT INTO artp_steps (id, organization_id, version_id, sequence, description, tools)
    VALUES (
      step_elem->>'id',
      v_src.organization_id,
      v_new_id,
      COALESCE((step_elem->>'sequence')::int, 1),
      COALESCE(NULLIF(step_elem->>'description', ''), '—'),
      COALESCE(v_tools, ARRAY[]::text[])
    );

    IF jsonb_typeof(step_elem->'energies') = 'array' THEN
      FOR energy_rec IN SELECT value AS elem FROM jsonb_array_elements(step_elem->'energies') LOOP
        energy_elem := energy_rec.elem;
        IF energy_elem->>'id' IS NOT NULL AND EXISTS (
          SELECT 1 FROM energy_types WHERE id = energy_elem->>'id'
        ) THEN
          INSERT INTO artp_step_energies (id, organization_id, step_id, energy_type_id)
          VALUES (
            (step_elem->>'id') || '_en_' || (energy_elem->>'id'),
            v_src.organization_id,
            step_elem->>'id',
            energy_elem->>'id'
          )
          ON CONFLICT (step_id, energy_type_id) DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    IF jsonb_typeof(step_elem->'hazards') <> 'array' THEN
      CONTINUE;
    END IF;

    FOR hazard_rec IN SELECT value AS elem FROM jsonb_array_elements(step_elem->'hazards') LOOP
      hazard_elem := hazard_rec.elem;
      INSERT INTO artp_step_hazards (
        id, organization_id, step_id, name, catalog_code, classification, source
      ) VALUES (
        hazard_elem->>'id',
        v_src.organization_id,
        step_elem->>'id',
        COALESCE(NULLIF(hazard_elem->>'name', ''), '—'),
        NULLIF(hazard_elem->>'catalog_code', ''),
        CASE
          WHEN hazard_elem->>'classification' IN (
            'Seguridad', 'Emergencias', 'Higiénicos', 'Psicosociales', 'Músculo-esquelético'
          ) THEN hazard_elem->>'classification'
          ELSE NULL
        END,
        CASE
          WHEN hazard_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN hazard_elem->>'source'
          ELSE 'manual'
        END
      );

      IF jsonb_typeof(hazard_elem->'risks') <> 'array' THEN
        CONTINUE;
      END IF;

      FOR risk_rec IN SELECT value AS elem FROM jsonb_array_elements(hazard_elem->'risks') LOOP
        risk_elem := risk_rec.elem;
        INSERT INTO artp_step_risks (id, organization_id, hazard_id, name, catalog_code, source)
        VALUES (
          risk_elem->>'id',
          v_src.organization_id,
          hazard_elem->>'id',
          COALESCE(NULLIF(risk_elem->>'name', ''), '—'),
          NULLIF(risk_elem->>'catalog_code', ''),
          CASE
            WHEN risk_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN risk_elem->>'source'
            ELSE 'manual'
          END
        );

        IF jsonb_typeof(risk_elem->'controls') <> 'array' THEN
          CONTINUE;
        END IF;

        FOR control_rec IN SELECT value AS elem FROM jsonb_array_elements(risk_elem->'controls') LOOP
          control_elem := control_rec.elem;
          INSERT INTO artp_step_controls (
            id, organization_id, risk_id, description, control_type, is_critical, verification_question, source
          ) VALUES (
            control_elem->>'id',
            v_src.organization_id,
            risk_elem->>'id',
            COALESCE(NULLIF(control_elem->>'description', ''), '—'),
            CASE
              WHEN control_elem->>'controlType' IN (
                'Eliminar / Sustituir',
                'Controles de Ingeniería',
                'Controles Administrativos',
                'Elementos de Protección Personal (EPP)'
              ) THEN control_elem->>'controlType'
              ELSE 'Controles Administrativos'
            END,
            COALESCE((control_elem->>'isCritical')::boolean, false),
            NULLIF(control_elem->>'verificationQuestion', ''),
            CASE
              WHEN control_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN control_elem->>'source'
              ELSE 'manual'
            END
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE artp_documents
  SET current_version_id = v_new_id, updated_at = NOW()
  WHERE id = v_src.artp_document_id;

  RETURN v_new_id;
END;
$$;
