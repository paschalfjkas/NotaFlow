// Hand-written Supabase types mirroring supabase/migrations/0001_init.sql.
// If you change the schema, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// and re-apply the ReportData/GeneratedReport payload types below.
//
// Shaped to match @supabase/postgrest-js's GenericSchema/GenericTable exactly
// (Row/Insert/Update/Relationships per table, plus Views/Functions on the
// schema) — omitting any of these makes the client fall back to `never`.

export type ReportStatus = "draft" | "generating" | "completed" | "failed";
export type CreditSource = "free" | "paid";
export type TransactionStatus = "pending" | "success" | "failed" | "cancelled";
export type UserRole = "student" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          university: string | null;
          faculty: string | null;
          department: string | null;
          programme: string | null;
          matric_number: string | null;
          academic_session: string | null;
          graduation_year: number | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      credits: {
        Row: {
          user_id: string;
          free_credits: number;
          paid_credits: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["credits"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["credits"]["Row"]>;
        Relationships: [];
      };
      pricing_packages: {
        Row: {
          id: string;
          key: string;
          name: string;
          credits: number;
          price_kobo: number;
          currency: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pricing_packages"]["Row"]> & {
          key: string;
          name: string;
          credits: number;
          price_kobo: number;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_packages"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: ReportStatus;
          current_step: string;
          report_data: Record<string, unknown>;
          generated_content: Record<string, unknown> | null;
          docx_storage_path: string | null;
          generation_error: string | null;
          generation_stage: string | null;
          credit_source: CreditSource | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      report_projects: {
        Row: {
          id: string;
          report_id: string;
          project_name: string;
          description: string | null;
          role: string | null;
          technologies: string | null;
          learnings: string | null;
          order_index: number;
        };
        Insert: Partial<Database["public"]["Tables"]["report_projects"]["Row"]> & {
          report_id: string;
          project_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_projects"]["Row"]>;
        Relationships: [];
      };
      report_tasks: {
        Row: {
          id: string;
          report_id: string;
          task: string;
          description: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["report_tasks"]["Row"]> & {
          report_id: string;
          task: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_tasks"]["Row"]>;
        Relationships: [];
      };
      report_challenges: {
        Row: {
          id: string;
          report_id: string;
          challenge: string;
          solution: string | null;
          lesson: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["report_challenges"]["Row"]> & {
          report_id: string;
          challenge: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_challenges"]["Row"]>;
        Relationships: [];
      };
      report_sections: {
        Row: {
          id: string;
          report_id: string;
          section_key: string;
          chapter_number: number | null;
          title: string;
          content: string;
          table_data: { caption: string; headers: string[]; rows: string[][] } | null;
          order_index: number;
          version: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_sections"]["Row"]> & {
          report_id: string;
          section_key: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_sections"]["Row"]>;
        Relationships: [];
      };
      report_section_versions: {
        Row: {
          id: string;
          section_id: string;
          content: string;
          version: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_section_versions"]["Row"]> & {
          section_id: string;
          content: string;
          version: number;
        };
        Update: Partial<Database["public"]["Tables"]["report_section_versions"]["Row"]>;
        Relationships: [];
      };
      report_screenshots: {
        Row: {
          id: string;
          report_id: string;
          section_id: string | null;
          storage_path: string | null;
          caption: string;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_screenshots"]["Row"]> & {
          report_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_screenshots"]["Row"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          reference: string;
          package_key: string;
          amount_kobo: number;
          currency: string;
          status: TransactionStatus;
          credits: number;
          provider: string;
          provider_raw: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          user_id: string;
          reference: string;
          package_key: string;
          amount_kobo: number;
          credits: number;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          properties: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]> & {
          event_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_report_credit: {
        Args: { p_user_id: string };
        Returns: CreditSource;
      };
      refund_report_credit: {
        Args: { p_user_id: string; p_source: CreditSource };
        Returns: undefined;
      };
      add_paid_credits: {
        Args: { p_user_id: string; p_credits: number };
        Returns: undefined;
      };
    };
  };
}
