export type TransactionDirection = "send" | "receive";
export type TransactionStatus = "needs_review" | "confirmed";
export type TransactionSource = "screenshot" | "statement" | "manual";
export type TransactionCategory = "cash_in" | "cash_out" | "load" | "bills" | "other";
export type ProfileRole = "owner" | "manager" | "staff";
export type CreditEntryType = "grant" | "consumption" | "adjustment" | "refund";
export type CreditRequestStatus = "pending" | "approved" | "denied";

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
          phone_numbers: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fee_tier_config?: FeeTier[];
          phone_numbers?: string[];
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
          category: TransactionCategory;
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
          category?: TransactionCategory;
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
      store_credits: {
        Row: {
          store_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          store_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_credits"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "store_credits_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_ledger: {
        Row: {
          id: string;
          store_id: string;
          entry_type: CreditEntryType;
          credit_delta: number;
          cost_usd: number;
          source_type: TransactionSource | null;
          input_tokens: number | null;
          output_tokens: number | null;
          transaction_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          entry_type: CreditEntryType;
          credit_delta: number;
          cost_usd?: number;
          source_type?: TransactionSource | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          transaction_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_ledger"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "credit_ledger_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_ledger_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_requests: {
        Row: {
          id: string;
          store_id: string;
          status: CreditRequestStatus;
          requested_by: string | null;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          status?: CreditRequestStatus;
          requested_by?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "credit_requests_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_credit: {
        Args: {
          p_store_id: string;
          p_credits: number;
          p_cost_usd: number;
          p_source_type: TransactionSource;
          p_input_tokens?: number | null;
          p_output_tokens?: number | null;
          p_transaction_id?: string | null;
          p_created_by?: string | null;
        };
        Returns: Database["public"]["Tables"]["credit_ledger"]["Row"];
      };
      adjust_credit: {
        Args: {
          p_store_id: string;
          p_delta: number;
          p_note: string;
          p_created_by: string;
          p_entry_type?: CreditEntryType;
        };
        Returns: Database["public"]["Tables"]["credit_ledger"]["Row"];
      };
    };
    Enums: {
      transaction_direction: TransactionDirection;
      transaction_status: TransactionStatus;
      transaction_source: TransactionSource;
      transaction_category: TransactionCategory;
      profile_role: ProfileRole;
      credit_entry_type: CreditEntryType;
      credit_request_status: CreditRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
