-- Storage buckets (run in Supabase SQL editor if storage schema not available via migration)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('organization-logos', 'organization-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('program-evidence', 'program-evidence', false, 52428800, NULL),
  ('technical-documents', 'technical-documents', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
