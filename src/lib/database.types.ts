export type TransactionDirection = "send" | "receive";
export type TransactionStatus = "needs_review" | "confirmed";
export type TransactionSource = "screenshot" | "statement" | "manual";
export type ProfileRole = "owner" | "manager" | "staff";

export type FeeTier = {
  min: number;
  max: number | null;
  type: "flat" | "per_thousand";
  fee: number;
};

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          fee_tier_config: FeeTier[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fee_tier_config?: FeeTier[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          store_id: string;
          role: ProfileRole;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          store_id: string;
          role?: ProfileRole;
          full_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          store_id: string;
          direction: TransactionDirection;
          amount: number;
          ref_number: string;
          counterparty_number: string | null;
          counterparty_name: string | null;
          occurred_at: string;
          status: TransactionStatus;
          fee_computed: number;
          source_type: TransactionSource;
          source_file_url: string | null;
          confidence: number | null;
          notes: string | null;
          tags: string[];
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          direction: TransactionDirection;
          amount: number;
          ref_number: string;
          counterparty_number?: string | null;
          counterparty_name?: string | null;
          occurred_at: string;
          status?: TransactionStatus;
          fee_computed?: number;
          source_type?: TransactionSource;
          source_file_url?: string | null;
          confidence?: number | null;
          notes?: string | null;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_direction: TransactionDirection;
      transaction_status: TransactionStatus;
      transaction_source: TransactionSource;
      profile_role: ProfileRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
