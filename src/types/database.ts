// Hand-written to match supabase/migrations/*.sql. Once a live Supabase
// project exists, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type UserRole = "admin" | "manager" | "staff";
export type TaskStatus = "not_started" | "in_progress" | "done";
export type TaskEventType = "voice_note" | "status_change" | "photo" | "text_note";
export type RequestCategory = "machine_issue" | "material_shortage" | "safety" | "other";
export type RequestStatus = "open" | "acknowledged" | "resolved";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          phone: string | null;
          role: UserRole;
          photo_url: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          username: string;
          phone?: string | null;
          role?: UserRole;
          photo_url?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          name: string;
          default_unit: string;
          created_at: string;
        };
        Insert: { id?: string; name: string; default_unit: string };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          created_by: string;
          title: string | null;
          photo_url: string | null;
          due_date: string | null;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          title?: string | null;
          photo_url?: string | null;
          due_date?: string | null;
          is_archived?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      task_assignees: {
        Row: {
          id: string;
          task_id: string;
          staff_id: string;
          status: TaskStatus;
          status_updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          staff_id: string;
          status?: TaskStatus;
          status_updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_assignees"]["Insert"]>;
        Relationships: [];
      };
      task_events: {
        Row: {
          id: string;
          task_assignee_id: string;
          author_id: string;
          event_type: TaskEventType;
          audio_url: string | null;
          photo_url: string | null;
          content: string | null;
          status_from: TaskStatus | null;
          status_to: TaskStatus | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_assignee_id: string;
          author_id: string;
          event_type: TaskEventType;
          audio_url?: string | null;
          photo_url?: string | null;
          content?: string | null;
          status_from?: TaskStatus | null;
          status_to?: TaskStatus | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_events"]["Insert"]>;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          staff_id: string;
          manager_id: string | null;
          category: RequestCategory;
          status: RequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          manager_id?: string | null;
          category?: RequestCategory;
          status?: RequestStatus;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Insert"]>;
        Relationships: [];
      };
      request_events: {
        Row: {
          id: string;
          request_id: string;
          author_id: string;
          audio_url: string | null;
          status_from: RequestStatus | null;
          status_to: RequestStatus | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          author_id: string;
          audio_url?: string | null;
          status_from?: RequestStatus | null;
          status_to?: RequestStatus | null;
        };
        Update: Partial<Database["public"]["Tables"]["request_events"]["Insert"]>;
        Relationships: [];
      };
      gate_passes: {
        Row: {
          id: string;
          pass_code: string;
          raised_by: string;
          material_id: string | null;
          item_description: string;
          quantity: number;
          unit: string;
          vendor_or_vehicle: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pass_code: string;
          raised_by: string;
          material_id?: string | null;
          item_description: string;
          quantity: number;
          unit: string;
          vendor_or_vehicle?: string | null;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["gate_passes"]["Insert"]>;
        Relationships: [];
      };
      material_intake: {
        Row: {
          id: string;
          material_id: string;
          quantity: number;
          unit: string;
          source_vendor: string | null;
          entered_by: string;
          photo_url: string | null;
          received_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          quantity: number;
          unit: string;
          source_vendor?: string | null;
          entered_by: string;
          photo_url?: string | null;
          received_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["material_intake"]["Insert"]>;
        Relationships: [];
      };
      processing_log: {
        Row: {
          id: string;
          input_material_id: string;
          input_quantity: number;
          output_material_id: string;
          output_quantity: number;
          processed_by: string;
          processed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          input_material_id: string;
          input_quantity: number;
          output_material_id: string;
          output_quantity: number;
          processed_by: string;
          processed_at?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["processing_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      material_stock: {
        Row: {
          material_id: string;
          name: string;
          default_unit: string;
          current_stock: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_manager_or_admin: { Args: Record<string, never>; Returns: boolean };
      current_role_is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
      task_event_type: TaskEventType;
      request_category: RequestCategory;
      request_status: RequestStatus;
    };
  };
}
