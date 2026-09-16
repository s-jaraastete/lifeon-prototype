/**
 * Subset of Supabase schema types (maintain in sync with supabase/migrations).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_path: string | null;
          personal_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          auth_user_id: string | null;
          user_id: string | null;
          email: string;
          name: string;
          role: string;
          status: string;
          permissions: Json;
        };
      };
      technical_documents: {
        Row: {
          id: string;
          organization_id: string;
          document_type: string;
          name: string;
          status: string;
          content: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
