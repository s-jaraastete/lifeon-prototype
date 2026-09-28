-- Anula solicitudes de firma duplicadas y permite eliminar el ARTP desde el listado.

UPDATE document_deliveries d
SET
  status = 'anulado',
  voided_at = clock_timestamp(),
  void_reason = 'Duplicado: la persona ya había firmado'
WHERE d.source_type = 'artp'
  AND d.status IN ('pendiente_revision', 'pendiente_firma')
  AND EXISTS (
    SELECT 1
    FROM document_deliveries signed
    WHERE signed.source_type = 'artp'
      AND signed.source_id = d.source_id
      AND signed.assignee_member_id = d.assignee_member_id
      AND signed.status = 'firmado'
      AND signed.id <> d.id
  );

CREATE OR REPLACE FUNCTION public.delete_artp_document(p_document_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
BEGIN
  SELECT * INTO v_doc FROM artp_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento no encontrado';
  END IF;
  IF NOT public.is_org_editor(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM artp_executions e
    JOIN artp_versions v ON v.id = e.artp_version_id
    WHERE v.artp_document_id = p_document_id
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar: este ARTP tiene ejecuciones registradas';
  END IF;

  DELETE FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id IN (
      SELECT id FROM artp_versions WHERE artp_document_id = p_document_id
    );

  DELETE FROM artp_documents WHERE id = p_document_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_artp_document(TEXT) TO authenticated;
