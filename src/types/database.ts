/**
 * ⚠️ Este archivo es un STUB manual mínimo para que el proyecto compile
 * antes de conectar tu proyecto real de Supabase.
 *
 * Una vez tengas tu proyecto y hayas corrido las migraciones, genera los
 * tipos reales con:
 *
 *   pnpm db:types
 *   (ejecuta: supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public)
 *
 * y reemplaza este archivo por el resultado.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          storage_quota_bytes: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      folders: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["folders"]["Row"]> & { owner_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["folders"]["Row"]>;
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          owner_id: string;
          folder_id: string | null;
          name: string;
          mime_type: string;
          size_bytes: number;
          cid: string;
          pinning_provider: string;
          is_encrypted: boolean;
          encryption_iv: string | null;
          tags: string[];
          visibility: "private" | "public" | "unlisted";
          thumbnail_cid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["files"]["Row"]> & {
          owner_id: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          cid: string;
          pinning_provider: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Row"]>;
        Relationships: [];
      };
      shares: {
        Row: {
          id: string;
          file_id: string;
          owner_id: string;
          share_token: string;
          permission: "view" | "download";
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shares"]["Row"]> & { file_id: string; owner_id: string };
        Update: Partial<Database["public"]["Tables"]["shares"]["Row"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          owner_id: string;
          action: string;
          file_id: string | null;
          folder_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_log"]["Row"]> & { owner_id: string; action: string };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      storage_usage: {
        Row: {
          owner_id: string;
          used_bytes: number;
          file_count: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
