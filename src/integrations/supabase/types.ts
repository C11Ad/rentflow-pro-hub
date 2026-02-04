export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_balances: {
        Row: {
          account_id: string
          closing_balance: number
          created_at: string
          currency: string
          id: string
          is_reconciled: boolean
          opening_balance: number
          period_end: string
          period_start: string
          reconciled_at: string | null
          reconciled_by: string | null
          total_credits: number
          total_debits: number
          updated_at: string
        }
        Insert: {
          account_id: string
          closing_balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_reconciled?: boolean
          opening_balance?: number
          period_end: string
          period_start: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          total_credits?: number
          total_debits?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          closing_balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_reconciled?: boolean
          opening_balance?: number
          period_end?: string
          period_start?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          total_credits?: number
          total_debits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_balances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_account: boolean
          landlord_id: string
          normal_balance: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_account?: boolean
          landlord_id: string
          normal_balance: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_account?: boolean
          landlord_id?: string
          normal_balance?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          created_at: string
          from_name: string
          id: string
          is_manual_entry: boolean
          is_read: boolean
          landlord_id: string
          message: string
          property: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_name: string
          id?: string
          is_manual_entry?: boolean
          is_read?: boolean
          landlord_id: string
          message: string
          property: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_name?: string
          id?: string
          is_manual_entry?: boolean
          is_read?: boolean
          landlord_id?: string
          message?: string
          property?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          landlord_id: string
          rate: number
          target_currency: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          landlord_id: string
          rate: number
          target_currency: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          landlord_id?: string
          rate?: number
          target_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_adjustments: {
        Row: {
          adjustment_amount: number
          adjustment_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          currency: string
          id: string
          journal_entry_id: string | null
          landlord_id: string
          original_amount: number
          reason: string
          reference_id: string
          reference_type: string
        }
        Insert: {
          adjustment_amount: number
          adjustment_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          journal_entry_id?: string | null
          landlord_id: string
          original_amount: number
          reason: string
          reference_id: string
          reference_type: string
        }
        Update: {
          adjustment_amount?: number
          adjustment_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          journal_entry_id?: string | null
          landlord_id?: string
          original_amount?: number
          reason?: string
          reference_id?: string
          reference_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_adjustments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          account_id: string | null
          amount: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number | null
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          landlord_id: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number | null
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          landlord_id: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id: string
          total_amount?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number | null
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          landlord_id?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string
          entry_date: string
          entry_number: string
          id: string
          landlord_id: string
          posted_at: string | null
          posted_by: string | null
          reference_id: string | null
          reference_type: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          entry_date?: string
          entry_number: string
          id?: string
          landlord_id: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          landlord_id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number
          currency: string
          debit_amount: number
          id: string
          journal_entry_id: string
          memo: string | null
          property_id: string | null
          tenant_id: string | null
          unit_id: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          id?: string
          journal_entry_id: string
          memo?: string | null
          property_id?: string | null
          tenant_id?: string | null
          unit_id?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          id?: string
          journal_entry_id?: string
          memo?: string | null
          property_id?: string | null
          tenant_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          location: string
          metadata: Json | null
          parent_document_id: string | null
          signed_at: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          location: string
          metadata?: Json | null
          parent_document_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          location?: string
          metadata?: Json | null
          parent_document_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_parent_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          cost_amount: number | null
          cost_currency: string | null
          cost_notes: string | null
          cost_paid_by: string | null
          created_at: string
          description: string
          estimated_completion: string | null
          id: string
          images: string[] | null
          is_property_wide: boolean
          priority: string
          status: string
          tenant_id: string
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          cost_notes?: string | null
          cost_paid_by?: string | null
          created_at?: string
          description: string
          estimated_completion?: string | null
          id?: string
          images?: string[] | null
          is_property_wide?: boolean
          priority?: string
          status?: string
          tenant_id: string
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          cost_amount?: number | null
          cost_currency?: string | null
          cost_notes?: string | null
          cost_paid_by?: string | null
          created_at?: string
          description?: string
          estimated_completion?: string | null
          id?: string
          images?: string[] | null
          is_property_wide?: boolean
          priority?: string
          status?: string
          tenant_id?: string
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          is_manual_entry: boolean
          landlord_id: string
          sms_recipients: string[] | null
          sms_sent: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          is_manual_entry?: boolean
          landlord_id: string
          sms_recipients?: string[] | null
          sms_sent?: boolean
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          is_manual_entry?: boolean
          landlord_id?: string
          sms_recipients?: string[] | null
          sms_sent?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_manual_entry: boolean
          landlord_id: string
          notes: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_manual_entry?: boolean
          landlord_id: string
          notes?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_manual_entry?: boolean
          landlord_id?: string
          notes?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string
          email: string
          full_name: string | null
          id: string
          national_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          email: string
          full_name?: string | null
          id: string
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          email?: string
          full_name?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          country: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          landlord_id: string
          name: string
          postal_code: string | null
          property_type: string
          state: string | null
          total_units: number
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city: string
          country: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          landlord_id: string
          name: string
          postal_code?: string | null
          property_type: string
          state?: string | null
          total_units?: number
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          landlord_id?: string
          name?: string
          postal_code?: string | null
          property_type?: string
          state?: string | null
          total_units?: number
          updated_at?: string
        }
        Relationships: []
      }
      reconciliations: {
        Row: {
          account_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          difference: number | null
          id: string
          landlord_id: string
          notes: string | null
          reconciliation_date: string
          statement_balance: number
          status: string
          system_balance: number
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          id?: string
          landlord_id: string
          notes?: string | null
          reconciliation_date: string
          statement_balance: number
          status?: string
          system_balance: number
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          difference?: number | null
          id?: string
          landlord_id?: string
          notes?: string | null
          reconciliation_date?: string
          statement_balance?: number
          status?: string
          system_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_applications: {
        Row: {
          applicant_id: string
          application_data: Json
          created_at: string
          documents: string[] | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_data: Json
          created_at?: string
          documents?: string[] | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_data?: Json
          created_at?: string
          documents?: string[] | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contracts: {
        Row: {
          content: string | null
          contract_type: string
          created_at: string
          document_url: string | null
          end_date: string
          id: string
          landlord_id: string
          landlord_signed_at: string | null
          monthly_rent: number
          rent_currency: string
          start_date: string
          status: string
          tenant_id: string
          tenant_signed_at: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          contract_type?: string
          created_at?: string
          document_url?: string | null
          end_date: string
          id?: string
          landlord_id: string
          landlord_signed_at?: string | null
          monthly_rent: number
          rent_currency?: string
          start_date: string
          status?: string
          tenant_id: string
          tenant_signed_at?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          contract_type?: string
          created_at?: string
          document_url?: string | null
          end_date?: string
          id?: string
          landlord_id?: string
          landlord_signed_at?: string | null
          monthly_rent?: number
          rent_currency?: string
          start_date?: string
          status?: string
          tenant_id?: string
          tenant_signed_at?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requests: {
        Row: {
          created_at: string
          id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          bathrooms: number
          bedrooms: number
          created_at: string
          id: string
          images: string[] | null
          is_manual_tenant: boolean
          lease_end: string | null
          lease_start: string | null
          listing_type: string | null
          manual_tenant_email: string | null
          manual_tenant_name: string | null
          manual_tenant_phone: string | null
          mortgage_eligible: boolean | null
          mortgage_partner: string | null
          property_id: string
          rent_amount: number
          rent_currency: string
          sale_price: number | null
          square_feet: number | null
          status: string
          tenant_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          bathrooms: number
          bedrooms: number
          created_at?: string
          id?: string
          images?: string[] | null
          is_manual_tenant?: boolean
          lease_end?: string | null
          lease_start?: string | null
          listing_type?: string | null
          manual_tenant_email?: string | null
          manual_tenant_name?: string | null
          manual_tenant_phone?: string | null
          mortgage_eligible?: boolean | null
          mortgage_partner?: string | null
          property_id: string
          rent_amount: number
          rent_currency?: string
          sale_price?: number | null
          square_feet?: number | null
          status?: string
          tenant_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          id?: string
          images?: string[] | null
          is_manual_tenant?: boolean
          lease_end?: string | null
          lease_start?: string | null
          listing_type?: string | null
          manual_tenant_email?: string | null
          manual_tenant_name?: string | null
          manual_tenant_phone?: string | null
          mortgage_eligible?: boolean | null
          mortgage_partner?: string | null
          property_id?: string
          rent_amount?: number
          rent_currency?: string
          sale_price?: number | null
          square_feet?: number | null
          status?: string
          tenant_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          document_type: string
          document_url: string
          id: string
          role_request_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          document_url: string
          id?: string
          role_request_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          document_url?: string
          id?: string
          role_request_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_role_request_id_fkey"
            columns: ["role_request_id"]
            isOneToOne: false
            referencedRelation: "role_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_viewing_requests: {
        Row: {
          created_at: string
          id: string
          listing_type: string
          message: string | null
          preferred_date: string
          preferred_time: string
          property_id: string | null
          requester_email: string
          requester_name: string
          requester_phone: string
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_type: string
          message?: string | null
          preferred_date: string
          preferred_time: string
          property_id?: string | null
          requester_email: string
          requester_name: string
          requester_phone: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_type?: string
          message?: string | null
          preferred_date?: string
          preferred_time?: string
          property_id?: string | null
          requester_email?: string
          requester_name?: string
          requester_phone?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_viewing_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_viewing_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { p_landlord_id: string }
        Returns: string
      }
      generate_journal_number: {
        Args: { p_landlord_id: string }
        Returns: string
      }
      get_account_balance: {
        Args: { p_account_id: string; p_as_of_date?: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      app_role: "admin" | "landlord" | "property_manager" | "tenant"
      document_status: "draft" | "generated" | "signed" | "archived"
      document_type:
        | "lease_agreement"
        | "renewal_notice"
        | "termination_notice"
        | "eviction_notice"
        | "rent_increase_notice"
        | "maintenance_notice"
        | "custom_agreement"
      transaction_status: "pending" | "posted" | "reversed" | "void"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      app_role: ["admin", "landlord", "property_manager", "tenant"],
      document_status: ["draft", "generated", "signed", "archived"],
      document_type: [
        "lease_agreement",
        "renewal_notice",
        "termination_notice",
        "eviction_notice",
        "rent_increase_notice",
        "maintenance_notice",
        "custom_agreement",
      ],
      transaction_status: ["pending", "posted", "reversed", "void"],
    },
  },
} as const
