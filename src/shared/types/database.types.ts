// This file is auto-generated by Supabase CLI
// Run: npm run db:types to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          business_id: string | null
          event_type: string
          event_category: string
          description: string | null
          ip_address: string | null
          user_agent: string | null
          request_path: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          business_id?: string | null
          event_type: string
          event_category: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          request_path?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          business_id?: string | null
          event_type?: string
          event_category?: string
          description?: string | null
          ip_address?: string | null
          user_agent?: string | null
          request_path?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          industry: string
          description: string | null
          website_url: string | null
          phone: string | null
          email: string | null
          address: Json | null
          employee_count_range: string | null
          annual_revenue_range: string | null
          active_services: string[]
          service_settings: Json
          agent_id: string
          plausible_domain: string | null
          analytics_settings: Json
          status: Database['public']['Enums']['business_status']
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          industry: string
          description?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          address?: Json | null
          employee_count_range?: string | null
          annual_revenue_range?: string | null
          active_services?: string[]
          service_settings?: Json
          agent_id: string
          plausible_domain?: string | null
          analytics_settings?: Json
          status?: Database['public']['Enums']['business_status']
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          industry?: string
          description?: string | null
          website_url?: string | null
          phone?: string | null
          email?: string | null
          address?: Json | null
          employee_count_range?: string | null
          annual_revenue_range?: string | null
          active_services?: string[]
          service_settings?: Json
          agent_id?: string
          plausible_domain?: string | null
          analytics_settings?: Json
          status?: Database['public']['Enums']['business_status']
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          business_id: string
          email: string
          role: Database['public']['Enums']['user_role']
          permissions: Json
          full_name: string | null
          job_title: string | null
          invited_by: string
          token: string
          expires_at: string
          used_at: string | null
          status: Database['public']['Enums']['invitation_status']
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          email: string
          role: Database['public']['Enums']['user_role']
          permissions?: Json
          full_name?: string | null
          job_title?: string | null
          invited_by: string
          token?: string
          expires_at?: string
          used_at?: string | null
          status?: Database['public']['Enums']['invitation_status']
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          email?: string
          role?: Database['public']['Enums']['user_role']
          permissions?: Json
          full_name?: string | null
          job_title?: string | null
          invited_by?: string
          token?: string
          expires_at?: string
          used_at?: string | null
          status?: Database['public']['Enums']['invitation_status']
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_business_connections: {
        Row: {
          id: string
          user_id: string
          business_id: string
          role: Database['public']['Enums']['user_role']
          permissions: Json
          status: Database['public']['Enums']['connection_status']
          invited_at: string
          accepted_at: string | null
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          role: Database['public']['Enums']['user_role']
          permissions?: Json
          status?: Database['public']['Enums']['connection_status']
          invited_at?: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          role?: Database['public']['Enums']['user_role']
          permissions?: Json
          status?: Database['public']['Enums']['connection_status']
          invited_at?: string
          accepted_at?: string | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_business_connections_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_business_connections_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_business_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_info: Json | null
          ip_address: string | null
          location_data: Json | null
          is_remember_me: boolean
          expires_at: string
          last_activity_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_info?: Json | null
          ip_address?: string | null
          location_data?: Json | null
          is_remember_me?: boolean
          expires_at: string
          last_activity_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_info?: Json | null
          ip_address?: string | null
          location_data?: Json | null
          is_remember_me?: boolean
          expires_at?: string
          last_activity_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          full_name: string
          job_title: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string
          role: Database['public']['Enums']['user_role']
          two_factor_enabled: boolean
          last_login_at: string | null
          last_login_ip: string | null
          failed_login_attempts: number
          locked_until: string | null
          email_notifications: Json
          dashboard_preferences: Json
          gdpr_consent_at: string | null
          data_processing_consent: boolean
          marketing_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          job_title?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          role: Database['public']['Enums']['user_role']
          two_factor_enabled?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          email_notifications?: Json
          dashboard_preferences?: Json
          gdpr_consent_at?: string | null
          data_processing_consent?: boolean
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          job_title?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          role?: Database['public']['Enums']['user_role']
          two_factor_enabled?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          email_notifications?: Json
          dashboard_preferences?: Json
          gdpr_consent_at?: string | null
          data_processing_consent?: boolean
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_status: "active" | "inactive" | "suspended"
      connection_status: "active" | "inactive" | "pending"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      user_role: "admin" | "agent" | "primary_client" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}