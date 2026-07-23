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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          code: string
          created_at: string
          credit_eligible: boolean
          dealer_admin_id: string | null
          id: string
          installation_pricing: Json
          internal_notes: string | null
          is_are_dealer: boolean
          name: string
          netsuite_customer_id: string | null
          pricing_group_id: string | null
          salesforce_account_id: string | null
          status: Database["public"]["Enums"]["company_status"]
          supported_tiers: Database["public"]["Enums"]["installation_tier"][]
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          code: string
          created_at?: string
          credit_eligible?: boolean
          dealer_admin_id?: string | null
          id?: string
          installation_pricing?: Json
          internal_notes?: string | null
          is_are_dealer?: boolean
          name: string
          netsuite_customer_id?: string | null
          pricing_group_id?: string | null
          salesforce_account_id?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          supported_tiers?: Database["public"]["Enums"]["installation_tier"][]
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          code?: string
          created_at?: string
          credit_eligible?: boolean
          dealer_admin_id?: string | null
          id?: string
          installation_pricing?: Json
          internal_notes?: string | null
          is_are_dealer?: boolean
          name?: string
          netsuite_customer_id?: string | null
          pricing_group_id?: string | null
          salesforce_account_id?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          supported_tiers?: Database["public"]["Enums"]["installation_tier"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_dealer_admin_id_fkey"
            columns: ["dealer_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_pricing_group_id_fkey"
            columns: ["pricing_group_id"]
            isOneToOne: false
            referencedRelation: "pricing_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_checklist_items: {
        Row: {
          checked: boolean
          id: string
          installation_id: string
          item_key: Database["public"]["Enums"]["checklist_item_key"]
          note: string | null
        }
        Insert: {
          checked?: boolean
          id?: string
          installation_id: string
          item_key: Database["public"]["Enums"]["checklist_item_key"]
          note?: string | null
        }
        Update: {
          checked?: boolean
          id?: string
          installation_id?: string
          item_key?: Database["public"]["Enums"]["checklist_item_key"]
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_checklist_items_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_confirmations: {
        Row: {
          confirmed_at: string | null
          installation_id: string
          status: Database["public"]["Enums"]["confirmation_status"]
          submitted_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          installation_id: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          submitted_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          installation_id?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_confirmations_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: true
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_date_proposals: {
        Row: {
          date: string
          id: string
          installation_id: string
          proposed_at: string
          proposed_by: string
          status: Database["public"]["Enums"]["date_proposal_status"]
        }
        Insert: {
          date: string
          id?: string
          installation_id: string
          proposed_at?: string
          proposed_by: string
          status?: Database["public"]["Enums"]["date_proposal_status"]
        }
        Update: {
          date?: string
          id?: string
          installation_id?: string
          proposed_at?: string
          proposed_by?: string
          status?: Database["public"]["Enums"]["date_proposal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "installation_date_proposals_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_issues: {
        Row: {
          description: string | null
          id: string
          installation_id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          photo_ids: string[]
          reported_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
        }
        Insert: {
          description?: string | null
          id?: string
          installation_id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          photo_ids?: string[]
          reported_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
        }
        Update: {
          description?: string | null
          id?: string
          installation_id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          photo_ids?: string[]
          reported_at?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
        }
        Relationships: [
          {
            foreignKeyName: "installation_issues_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          installation_id: string
          is_internal: boolean
          text: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          installation_id: string
          is_internal?: boolean
          text: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          installation_id?: string
          is_internal?: boolean
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_notes_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_photos: {
        Row: {
          category: Database["public"]["Enums"]["photo_category"]
          id: string
          installation_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["photo_category"]
          id?: string
          installation_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["photo_category"]
          id?: string
          installation_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_photos_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["dealer_operational_status"]
            | null
          id: string
          installation_id: string
          note: string | null
          source: Database["public"]["Enums"]["status_change_source"]
          to_status: Database["public"]["Enums"]["dealer_operational_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["dealer_operational_status"]
            | null
          id?: string
          installation_id: string
          note?: string | null
          source: Database["public"]["Enums"]["status_change_source"]
          to_status: Database["public"]["Enums"]["dealer_operational_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["dealer_operational_status"]
            | null
          id?: string
          installation_id?: string
          note?: string | null
          source?: Database["public"]["Enums"]["status_change_source"]
          to_status?: Database["public"]["Enums"]["dealer_operational_status"]
        }
        Relationships: [
          {
            foreignKeyName: "installation_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_status_history_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installations: {
        Row: {
          bed_length: string | null
          cap_color: string | null
          cap_finish: string | null
          cap_model: string | null
          company_id: string
          completed_date: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dealer_instructions: string | null
          dealer_payout: number | null
          dealer_status: Database["public"]["Enums"]["dealer_operational_status"]
          estimated_cap_arrival_date: string | null
          freight: number
          id: string
          installation_fee: number
          location_id: string
          msrp: number
          order_date: string
          order_number: string
          scheduled_installation_date: string | null
          surcharge: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        Insert: {
          bed_length?: string | null
          cap_color?: string | null
          cap_finish?: string | null
          cap_model?: string | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dealer_instructions?: string | null
          dealer_payout?: number | null
          dealer_status?: Database["public"]["Enums"]["dealer_operational_status"]
          estimated_cap_arrival_date?: string | null
          freight?: number
          id?: string
          installation_fee: number
          location_id: string
          msrp: number
          order_date?: string
          order_number: string
          scheduled_installation_date?: string | null
          surcharge?: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Update: {
          bed_length?: string | null
          cap_color?: string | null
          cap_finish?: string | null
          cap_model?: string | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dealer_instructions?: string | null
          dealer_payout?: number | null
          dealer_status?: Database["public"]["Enums"]["dealer_operational_status"]
          estimated_cap_arrival_date?: string | null
          freight?: number
          id?: string
          installation_fee?: number
          location_id?: string
          msrp?: number
          order_date?: string
          order_number?: string
          scheduled_installation_date?: string | null
          surcharge?: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_id: string
          country: string | null
          created_at: string
          id: string
          installation_pricing: Json | null
          name: string
          phone_number: string | null
          postal_code: string | null
          primary_contact_email: string | null
          regional_sales_manager: string | null
          state: string | null
          status: Database["public"]["Enums"]["location_status"]
          supported_tiers:
            | Database["public"]["Enums"]["installation_tier"][]
            | null
          updated_at: string
          use_custom_pricing: boolean
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_id: string
          country?: string | null
          created_at?: string
          id?: string
          installation_pricing?: Json | null
          name: string
          phone_number?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          regional_sales_manager?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["location_status"]
          supported_tiers?:
            | Database["public"]["Enums"]["installation_tier"][]
            | null
          updated_at?: string
          use_custom_pricing?: boolean
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_id?: string
          country?: string | null
          created_at?: string
          id?: string
          installation_pricing?: Json | null
          name?: string
          phone_number?: string | null
          postal_code?: string | null
          primary_contact_email?: string | null
          regional_sales_manager?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["location_status"]
          supported_tiers?:
            | Database["public"]["Enums"]["installation_tier"][]
            | null
          updated_at?: string
          use_custom_pricing?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          notification_id: string
          read_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          delivery_status: Database["public"]["Enums"]["notification_delivery_status"]
          event: string
          id: string
          installation_id: string | null
          metadata: Json
          payout_id: string | null
          quote_id: string | null
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          event: string
          id?: string
          installation_id?: string | null
          metadata?: Json
          payout_id?: string | null
          quote_id?: string | null
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          event?: string
          id?: string
          installation_id?: string | null
          metadata?: Json
          payout_id?: string | null
          quote_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batches: {
        Row: {
          batch_run_id: string
          created_at: string
          dealer_id: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          installation_count: number
          location_id: string | null
          notes: string | null
          paid_date: string | null
          processed_date: string | null
          scheduled_payout_date: string | null
          status: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          batch_run_id: string
          created_at?: string
          dealer_id: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          installation_count?: number
          location_id?: string | null
          notes?: string | null
          paid_date?: string | null
          processed_date?: string | null
          scheduled_payout_date?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          batch_run_id?: string
          created_at?: string
          dealer_id?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          installation_count?: number
          location_id?: string | null
          notes?: string | null
          paid_date?: string | null
          processed_date?: string | null
          scheduled_payout_date?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          payout_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          payout_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          payout_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_status_history_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_status_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          calculation_breakdown: Json
          cap_rev_share: number
          created_at: string
          dealer_id: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          installation_fee: number
          installation_id: string
          location_id: string
          paid_date: string | null
          payout_amount: number
          payout_batch_id: string | null
          processed_date: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["payout_status"]
          stripe_connected_account_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          calculation_breakdown?: Json
          cap_rev_share: number
          created_at?: string
          dealer_id: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          installation_fee: number
          installation_id: string
          location_id: string
          paid_date?: string | null
          payout_amount: number
          payout_batch_id?: string | null
          processed_date?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_connected_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          calculation_breakdown?: Json
          cap_rev_share?: number
          created_at?: string
          dealer_id?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          installation_fee?: number
          installation_id?: string
          location_id?: string
          paid_date?: string | null
          payout_amount?: number
          payout_batch_id?: string | null
          processed_date?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_connected_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_payout_batch_id_fkey"
            columns: ["payout_batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_groups: {
        Row: {
          base_discount: number
          created_at: string
          description: string | null
          effective_date: string
          id: string
          name: string
          status: Database["public"]["Enums"]["pricing_group_status"]
          updated_at: string
        }
        Insert: {
          base_discount?: number
          created_at?: string
          description?: string | null
          effective_date?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["pricing_group_status"]
          updated_at?: string
        }
        Update: {
          base_discount?: number
          created_at?: string
          description?: string | null
          effective_date?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["pricing_group_status"]
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          discount_percent: number
          display_name: string
          id: string
          pricing_group_id: string
          target_type: Database["public"]["Enums"]["pricing_target_type"]
          target_value: string
        }
        Insert: {
          discount_percent: number
          display_name: string
          id?: string
          pricing_group_id: string
          target_type: Database["public"]["Enums"]["pricing_target_type"]
          target_value: string
        }
        Update: {
          discount_percent?: number
          display_name?: string
          id?: string
          pricing_group_id?: string
          target_type?: Database["public"]["Enums"]["pricing_target_type"]
          target_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_pricing_group_id_fkey"
            columns: ["pricing_group_id"]
            isOneToOne: false
            referencedRelation: "pricing_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_order_items: {
        Row: {
          id: string
          price: number
          product_name: string
          product_order_id: string
          quantity: number
          sku: string | null
          total: number
        }
        Insert: {
          id?: string
          price: number
          product_name: string
          product_order_id: string
          quantity?: number
          sku?: string | null
          total: number
        }
        Update: {
          id?: string
          price?: number
          product_name?: string
          product_order_id?: string
          quantity?: number
          sku?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_order_items_product_order_id_fkey"
            columns: ["product_order_id"]
            isOneToOne: false
            referencedRelation: "product_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_orders: {
        Row: {
          company_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_vehicle: string | null
          estimated_delivery_date: string | null
          id: string
          location_id: string | null
          order_date: string
          order_number: string
          ordered_by_email: string
          ordered_by_name: string
          payment_method: string | null
          po_number: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["product_order_status"]
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_vehicle?: string | null
          estimated_delivery_date?: string | null
          id?: string
          location_id?: string | null
          order_date?: string
          order_number: string
          ordered_by_email: string
          ordered_by_name: string
          payment_method?: string | null
          po_number?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["product_order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_vehicle?: string | null
          estimated_delivery_date?: string | null
          id?: string
          location_id?: string | null
          order_date?: string
          order_number?: string
          ordered_by_email?: string
          ordered_by_name?: string
          payment_method?: string | null
          po_number?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["product_order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_activity: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          quote_id: string
          type: Database["public"]["Enums"]["quote_activity_type"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          quote_id: string
          type: Database["public"]["Enums"]["quote_activity_type"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          quote_id?: string
          type?: Database["public"]["Enums"]["quote_activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quote_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_activity_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          description: string
          id: string
          is_required: boolean
          msrp: number
          price: number
          quantity: number
          quote_id: string
          sku: string | null
          type: Database["public"]["Enums"]["quote_line_item_type"]
        }
        Insert: {
          description: string
          id?: string
          is_required?: boolean
          msrp: number
          price: number
          quantity?: number
          quote_id: string
          sku?: string | null
          type?: Database["public"]["Enums"]["quote_line_item_type"]
        }
        Update: {
          description?: string
          id?: string
          is_required?: boolean
          msrp?: number
          price?: number
          quantity?: number
          quote_id?: string
          sku?: string | null
          type?: Database["public"]["Enums"]["quote_line_item_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          bed_length: string | null
          body_type: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          engine: string | null
          id: string
          location_id: string | null
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        Insert: {
          bed_length?: string | null
          body_type?: string | null
          company_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          engine?: string | null
          id?: string
          location_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["quote_status"]
          tax_rate?: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Update: {
          bed_length?: string | null
          body_type?: string | null
          company_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          engine?: string | null
          id?: string
          location_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["quote_status"]
          tax_rate?: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          location_id: string
          user_id: string
        }
        Insert: {
          location_id: string
          user_id: string
        }
        Update: {
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          internal_notes: string | null
          last_login_at: string | null
          name: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          internal_notes?: string | null
          last_login_at?: string | null
          name: string
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          internal_notes?: string | null
          last_login_at?: string | null
          name?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_registrations: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dealer_id: string | null
          id: string
          installed_date: string | null
          location_id: string | null
          product_category: string | null
          product_name: string | null
          purchase_date: string | null
          registration_date: string
          serial_number: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dealer_id?: string | null
          id?: string
          installed_date?: string | null
          location_id?: string | null
          product_category?: string | null
          product_name?: string | null
          purchase_date?: string | null
          registration_date?: string
          serial_number?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dealer_id?: string | null
          id?: string
          installed_date?: string | null
          location_id?: string | null
          product_category?: string | null
          product_name?: string | null
          purchase_date?: string | null
          registration_date?: string
          serial_number?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_registrations_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_registrations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_registrations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      location_directory: {
        Row: {
          city: string | null
          company_id: string | null
          company_name: string | null
          id: string | null
          name: string | null
          state: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_quote_note: {
        Args: { p_is_internal?: boolean; p_message: string; p_quote_id: string }
        Returns: {
          actor_id: string | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          quote_id: string
          type: Database["public"]["Enums"]["quote_activity_type"]
        }
        SetofOptions: {
          from: "*"
          to: "quote_activity"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_dealer_health: {
        Args: never
        Returns: {
          active_user_count: number
          aged_quotes: number
          all_users_inactive_30d: boolean
          company_id: string
          company_name: string
          company_status: Database["public"]["Enums"]["company_status"]
          flags: string[]
          has_location_admin: boolean
          health_tier: Database["public"]["Enums"]["dealer_health_tier"]
          open_quotes: number
          orphaned_quotes: number
          sla_compliance_pct: number
          total_user_count: number
        }[]
      }
      admin_edit_quote: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone?: string
          p_justification?: string
          p_quote_id: string
          p_status?: Database["public"]["Enums"]["quote_status"]
          p_vehicle_make?: string
          p_vehicle_model?: string
          p_vehicle_year?: number
        }
        Returns: {
          bed_length: string | null
          body_type: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          engine: string | null
          id: string
          location_id: string | null
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_location: {
        Args: {
          p_internal_note?: string
          p_location_code: string
          p_location_id: string
        }
        Returns: {
          address: string | null
          city: string | null
          code: string
          company_id: string
          country: string | null
          created_at: string
          id: string
          installation_pricing: Json | null
          name: string
          phone_number: string | null
          postal_code: string | null
          primary_contact_email: string | null
          regional_sales_manager: string | null
          state: string | null
          status: Database["public"]["Enums"]["location_status"]
          supported_tiers:
            | Database["public"]["Enums"]["installation_tier"][]
            | null
          updated_at: string
          use_custom_pricing: boolean
        }
        SetofOptions: {
          from: "*"
          to: "locations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_pricing_discount: {
        Args: {
          p_brand?: string
          p_category?: string
          p_pricing_group_id: string
          p_product_line?: string
        }
        Returns: {
          discount_percent: number
          source: string
        }[]
      }
      can_manage_installation: {
        Args: { p_installation_id: string }
        Returns: boolean
      }
      can_manage_quote: { Args: { p_quote_id: string }; Returns: boolean }
      compute_installation_payout_breakdown: {
        Args: { p_installation_id: string }
        Returns: Json
      }
      confirm_installation_completion: {
        Args: { p_installation_id: string }
        Returns: {
          bed_length: string | null
          cap_color: string | null
          cap_finish: string | null
          cap_model: string | null
          company_id: string
          completed_date: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dealer_instructions: string | null
          dealer_payout: number | null
          dealer_status: Database["public"]["Enums"]["dealer_operational_status"]
          estimated_cap_arrival_date: string | null
          freight: number
          id: string
          installation_fee: number
          location_id: string
          msrp: number
          order_date: string
          order_number: string
          scheduled_installation_date: string | null
          surcharge: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "installations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_company_id: { Args: never; Returns: string }
      current_email: { Args: never; Returns: string }
      current_location_ids: { Args: never; Returns: string[] }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_customer_facing_status: {
        Args: { p_installation_id: string }
        Returns: Database["public"]["Enums"]["customer_facing_status"]
      }
      installation_kpi_metrics: {
        Args: { p_company_id?: string }
        Returns: {
          avg_arrival_to_scheduled: number
          avg_completed_to_confirmed: number
          avg_scheduled_to_completed: number
          awaiting_customer_confirmation: number
          awaiting_documentation: number
          awaiting_scheduling: number
          cap_arrived_overdue: number
          completed_last_30_days: number
          customer_confirmation_overdue: number
          documentation_overdue: number
          estimated_payout: number
          issue_rate: number
          issues_reported: number
          next_payout_date: string
          no_scheduling_attempt_overdue: number
          scheduled_this_week: number
          todays_installations: number
          total_installations: number
          ytd_payouts: number
        }[]
      }
      installation_verification_status: {
        Args: { p_installation_id: string }
        Returns: Json
      }
      is_installation_customer: {
        Args: { p_installation_id: string }
        Returns: boolean
      }
      is_realtruck_admin: { Args: never; Returns: boolean }
      reassign_quote: {
        Args: { p_new_location_id: string; p_note?: string; p_quote_id: string }
        Returns: {
          bed_length: string | null
          body_type: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          engine: string | null
          id: string
          location_id: string | null
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_location: {
        Args: { p_location_id: string; p_reason: string }
        Returns: {
          address: string | null
          city: string | null
          code: string
          company_id: string
          country: string | null
          created_at: string
          id: string
          installation_pricing: Json | null
          name: string
          phone_number: string | null
          postal_code: string | null
          primary_contact_email: string | null
          regional_sales_manager: string | null
          state: string | null
          status: Database["public"]["Enums"]["location_status"]
          supported_tiers:
            | Database["public"]["Enums"]["installation_tier"][]
            | null
          updated_at: string
          use_custom_pricing: boolean
        }
        SetofOptions: {
          from: "*"
          to: "locations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      report_installation_issue: {
        Args: {
          p_description: string
          p_installation_id: string
          p_issue_type: Database["public"]["Enums"]["issue_type"]
          p_photo_ids?: string[]
        }
        Returns: {
          description: string | null
          id: string
          installation_id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          photo_ids: string[]
          reported_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
        }
        SetofOptions: {
          from: "*"
          to: "installation_issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      required_checklist_items: {
        Args: never
        Returns: Database["public"]["Enums"]["checklist_item_key"][]
      }
      required_photo_categories: {
        Args: never
        Returns: Database["public"]["Enums"]["photo_category"][]
      }
      resolve_installation_issue: {
        Args: { p_issue_id: string; p_resolution_note?: string }
        Returns: {
          description: string | null
          id: string
          installation_id: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          photo_ids: string[]
          reported_at: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
        }
        SetofOptions: {
          from: "*"
          to: "installation_issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_quote: {
        Args: { p_quote_id: string }
        Returns: {
          bed_length: string | null
          body_type: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          engine: string | null
          id: string
          location_id: string | null
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_installation_verification: {
        Args: { p_installation_id: string; p_note?: string }
        Returns: {
          confirmed_at: string | null
          installation_id: string
          status: Database["public"]["Enums"]["confirmation_status"]
          submitted_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "installation_confirmations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_installation_status: {
        Args: {
          p_installation_id: string
          p_new_status: Database["public"]["Enums"]["dealer_operational_status"]
          p_note?: string
          p_source: Database["public"]["Enums"]["status_change_source"]
        }
        Returns: {
          bed_length: string | null
          cap_color: string | null
          cap_finish: string | null
          cap_model: string | null
          company_id: string
          completed_date: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dealer_instructions: string | null
          dealer_payout: number | null
          dealer_status: Database["public"]["Enums"]["dealer_operational_status"]
          estimated_cap_arrival_date: string | null
          freight: number
          id: string
          installation_fee: number
          location_id: string
          msrp: number
          order_date: string
          order_number: string
          scheduled_installation_date: string | null
          surcharge: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "installations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_quote_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["quote_status"]
          p_note?: string
          p_quote_id: string
        }
        Returns: {
          bed_length: string | null
          body_type: string | null
          company_id: string | null
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          engine: string | null
          id: string
          location_id: string | null
          source: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_rate: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      checklist_item_key:
        | "correct_cap_model"
        | "options_installed"
        | "mechanical_tested"
        | "electrical_tested"
        | "no_leaks_or_fitment_issues"
        | "customer_inspected"
        | "warranty_instructions_provided"
        | "answered_questions"
      company_status: "active" | "suspended" | "closed" | "pending_provisioning"
      confirmation_status: "pending" | "confirmed" | "issue_reported"
      customer_facing_status:
        | "order_received"
        | "shipped_to_dealer"
        | "arrived_at_dealer"
        | "schedule_installation"
        | "installation_scheduled"
        | "installed"
        | "unavailable"
      date_proposal_status: "proposed" | "declined" | "confirmed" | "replaced"
      dealer_health_tier:
        | "healthy"
        | "needs_attention"
        | "critical"
        | "inactive"
      dealer_operational_status:
        | "requested"
        | "scheduling_proposed"
        | "customer_requested_change"
        | "scheduled"
        | "cap_in_transit"
        | "cap_delivered"
        | "in_progress"
        | "completed"
        | "cancelled"
      installation_tier: "tier-1" | "tier-2" | "tier-3"
      issue_status: "open" | "resolved"
      issue_type:
        | "poor_fitment"
        | "damage"
        | "missing_accessory"
        | "electrical"
        | "wrong_cap_or_options"
        | "other"
      location_status: "pending_approval" | "active" | "suspended" | "closed"
      notification_delivery_status: "sent" | "failed"
      payout_status: "pending" | "processing" | "paid" | "failed" | "cancelled"
      photo_category:
        | "full_vehicle"
        | "rear_view"
        | "side_profile"
        | "front_clamp"
        | "wiring"
        | "accessories"
      pricing_group_status: "active" | "inactive"
      pricing_target_type: "brand" | "category" | "product-line"
      product_order_status: "processing" | "in_transit" | "delivered"
      quote_activity_type: "status_change" | "note" | "quote_sent" | "system"
      quote_line_item_type: "base" | "option" | "custom"
      quote_status:
        | "new"
        | "working"
        | "quote_sent"
        | "converted"
        | "lost"
        | "spam"
        | "invalid"
        | "test"
      status_change_source: "dealer" | "erp" | "rt_admin" | "customer"
      user_role:
        | "realtruck_admin"
        | "dealer_admin"
        | "location_admin"
        | "staff"
        | "customer"
      user_status: "invited" | "active" | "disabled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      checklist_item_key: [
        "correct_cap_model",
        "options_installed",
        "mechanical_tested",
        "electrical_tested",
        "no_leaks_or_fitment_issues",
        "customer_inspected",
        "warranty_instructions_provided",
        "answered_questions",
      ],
      company_status: ["active", "suspended", "closed", "pending_provisioning"],
      confirmation_status: ["pending", "confirmed", "issue_reported"],
      customer_facing_status: [
        "order_received",
        "shipped_to_dealer",
        "arrived_at_dealer",
        "schedule_installation",
        "installation_scheduled",
        "installed",
        "unavailable",
      ],
      date_proposal_status: ["proposed", "declined", "confirmed", "replaced"],
      dealer_health_tier: [
        "healthy",
        "needs_attention",
        "critical",
        "inactive",
      ],
      dealer_operational_status: [
        "requested",
        "scheduling_proposed",
        "customer_requested_change",
        "scheduled",
        "cap_in_transit",
        "cap_delivered",
        "in_progress",
        "completed",
        "cancelled",
      ],
      installation_tier: ["tier-1", "tier-2", "tier-3"],
      issue_status: ["open", "resolved"],
      issue_type: [
        "poor_fitment",
        "damage",
        "missing_accessory",
        "electrical",
        "wrong_cap_or_options",
        "other",
      ],
      location_status: ["pending_approval", "active", "suspended", "closed"],
      notification_delivery_status: ["sent", "failed"],
      payout_status: ["pending", "processing", "paid", "failed", "cancelled"],
      photo_category: [
        "full_vehicle",
        "rear_view",
        "side_profile",
        "front_clamp",
        "wiring",
        "accessories",
      ],
      pricing_group_status: ["active", "inactive"],
      pricing_target_type: ["brand", "category", "product-line"],
      product_order_status: ["processing", "in_transit", "delivered"],
      quote_activity_type: ["status_change", "note", "quote_sent", "system"],
      quote_line_item_type: ["base", "option", "custom"],
      quote_status: [
        "new",
        "working",
        "quote_sent",
        "converted",
        "lost",
        "spam",
        "invalid",
        "test",
      ],
      status_change_source: ["dealer", "erp", "rt_admin", "customer"],
      user_role: [
        "realtruck_admin",
        "dealer_admin",
        "location_admin",
        "staff",
        "customer",
      ],
      user_status: ["invited", "active", "disabled"],
    },
  },
} as const
