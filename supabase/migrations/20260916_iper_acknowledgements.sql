-- IRL: Toma de conocimiento / envío por trabajador (por matriz)
ALTER TABLE iper_matrices
  ADD COLUMN IF NOT EXISTS acknowledgements JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN iper_matrices.acknowledgements IS 'Registros de envío y toma de conocimiento del IRL por trabajador y cargo';
