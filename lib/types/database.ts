export type Database = {
  public: {
    Tables: {
      slots: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          max_capacity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          max_capacity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          max_capacity?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          social_handle: string | null;
          level: "pemula" | "menengah" | "lanjut";
          notes: string | null;
          joined_at: string;
          session_type: string | null;
          token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          social_handle?: string | null;
          level: "pemula" | "menengah" | "lanjut";
          notes?: string | null;
          joined_at?: string;
          session_type?: string | null;
          token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          social_handle?: string | null;
          level?: "pemula" | "menengah" | "lanjut";
          notes?: string | null;
          joined_at?: string;
          session_type?: string | null;
          token?: string;
          created_at?: string;
        };
      };
      packages: {
        Row: {
          id: string;
          student_id: string;
          session_type: "trial" | "paket";
          total_sessions: number;
          used_sessions: number;
          start_date: string;
          end_date: string;
          status: "active" | "completed" | "expired";
          amount: number;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          session_type: "trial" | "paket";
          total_sessions?: number;
          used_sessions?: number;
          start_date: string;
          end_date?: string;
          status?: "active" | "completed" | "expired";
          amount: number;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          session_type?: "trial" | "paket";
          total_sessions?: number;
          used_sessions?: number;
          start_date?: string;
          end_date?: string;
          status?: "active" | "completed" | "expired";
          amount?: number;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          package_id: string;
          student_id: string;
          slot_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          status: "scheduled" | "attended" | "absent" | "rescheduled";
          is_public: boolean;
          admin_note: string | null;
          reschedule_from: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          student_id: string;
          slot_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          status?: "scheduled" | "attended" | "absent" | "rescheduled";
          is_public?: boolean;
          admin_note?: string | null;
          reschedule_from?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          student_id?: string;
          slot_id?: string;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string;
          status?: "scheduled" | "attended" | "absent" | "rescheduled";
          is_public?: boolean;
          admin_note?: string | null;
          reschedule_from?: string | null;
          created_at?: string;
        };
      };
      reschedule_requests: {
        Row: {
          id: string;
          student_id: string;
          session_id: string;
          requested_slot_id: string;
          requested_date: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          session_id: string;
          requested_slot_id: string;
          requested_date: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          session_id?: string;
          requested_slot_id?: string;
          requested_date?: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
      };
    };
  };
};

// Convenience types
export type Slot = Database["public"]["Tables"]["slots"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Package = Database["public"]["Tables"]["packages"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type RescheduleRequest = Database["public"]["Tables"]["reschedule_requests"]["Row"];
