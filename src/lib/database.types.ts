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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          is_managed: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          is_managed?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          is_managed?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          role: 'system_admin' | 'program_admin' | 'student' | 'site_admin' | 'clinical_instructor' | 'faculty' | 'accreditation_lead'
          is_active: boolean
          org_id: string
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          role?: 'system_admin' | 'program_admin' | 'student' | 'site_admin' | 'clinical_instructor' | 'faculty' | 'accreditation_lead'
          is_active?: boolean
          org_id: string
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'system_admin' | 'program_admin' | 'student' | 'site_admin' | 'clinical_instructor' | 'faculty' | 'accreditation_lead'
          is_active?: boolean
          org_id?: string
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          student_id: string
          user_id: string
          cohort_id: string
          constraints: Json
          opt_ins: Json
          created_at: string
          updated_at: string
        }
      }
      sites: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          country: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          specialties: string[]
          setting_types: string[]
          onboarding_notes: string | null
          is_active: boolean
          org_id: string
          created_at: string
          updated_at: string
        }
      }
      placements: {
        Row: {
          id: string
          status: 'REQUESTED' | 'SITE_APPROVED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
          start_date: string
          end_date: string
          is_auto_placed: boolean
          placement_reason: string | null
          override_reason: string | null
          student_id: string
          site_id: string
          block_id: string
          ci_id: string | null
          created_at: string
          updated_at: string
        }
      }
      timecards: {
        Row: {
          id: string
          clock_in_at: string
          clock_out_at: string | null
          break_minutes: number
          total_minutes: number | null
          status: 'ACTIVE' | 'SUBMITTED' | 'CI_ATTESTED' | 'APPROVED' | 'REJECTED'
          notes: string | null
          missed_punch_reason: string | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          ci_attested_at: string | null
          ci_attested_by: string | null
          coordinator_approved_at: string | null
          coordinator_approved_by: string | null
          student_id: string
          site_id: string
          location_id: string | null
          block_id: string
          placement_id: string
          ci_id: string | null
          created_at: string
          updated_at: string
        }
      }
      compliance_documents: {
        Row: {
          id: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
          file_url: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          expiry_date: string | null
          review_notes: string | null
          reviewed_at: string | null
          student_id: string
          template_id: string
          created_at: string
          updated_at: string
        }
      }
      evaluation_instances: {
        Row: {
          id: string
          scores: Json
          total_score: number | null
          narrative: string | null
          is_signed: boolean
          signed_at: string | null
          signature_data: string | null
          status: string
          version: number
          previous_version_id: string | null
          template_id: string
          placement_id: string
          student_id: string
          ci_id: string | null
          self_assessment_id: string | null
          site_id: string
          created_at: string
          updated_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          is_read: boolean
          data: Json
          user_id: string
          created_at: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          entity_type: string
          entity_id: string
          old_value: Json | null
          new_value: Json | null
          reason: string | null
          ip_address: string | null
          user_agent: string | null
          org_id: string
          created_by: string
          created_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
