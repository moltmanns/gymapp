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
      exercises: {
        Row: {
          id: string
          name: string
          category: 'upper' | 'lower' | 'core'
          equipment: 'machine' | 'barbell' | 'dumbbell' | 'cable' | 'bodyweight'
          demo_url: string | null
          form_cues: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'upper' | 'lower' | 'core'
          equipment: 'machine' | 'barbell' | 'dumbbell' | 'cable' | 'bodyweight'
          demo_url?: string | null
          form_cues?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'upper' | 'lower' | 'core'
          equipment?: 'machine' | 'barbell' | 'dumbbell' | 'cable' | 'bodyweight'
          demo_url?: string | null
          form_cues?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          name: string
          cycle_order: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cycle_order: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cycle_order?: number
          description?: string | null
          created_at?: string
        }
      }
      workout_template_items: {
        Row: {
          id: string
          template_id: string
          exercise_id: string
          sort_order: number
          sets: number
          rep_min: number
          rep_max: number
          rest_seconds: number
          start_weight_lbs: number | null
          increment_lbs: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          exercise_id: string
          sort_order: number
          sets: number
          rep_min: number
          rep_max: number
          rest_seconds?: number
          start_weight_lbs?: number | null
          increment_lbs?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          exercise_id?: string
          sort_order?: number
          sets?: number
          rep_min?: number
          rep_max?: number
          rest_seconds?: number
          start_weight_lbs?: number | null
          increment_lbs?: number
          notes?: string | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          template_id: string
          started_at: string
          ended_at: string | null
          bodyweight_lbs: number | null
          notes: string | null
          workout_day: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          started_at?: string
          ended_at?: string | null
          bodyweight_lbs?: number | null
          notes?: string | null
          workout_day?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          started_at?: string
          ended_at?: string | null
          bodyweight_lbs?: number | null
          notes?: string | null
          workout_day?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          set_number: number
          weight_lbs: number
          reps: number
          rir: number | null
          is_warmup: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          set_number: number
          weight_lbs: number
          reps: number
          rir?: number | null
          is_warmup?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          set_number?: number
          weight_lbs?: number
          reps?: number
          rir?: number | null
          is_warmup?: boolean
          created_at?: string
        }
      }
      bodyweight_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          weight_lbs: number
          waist_in: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          logged_at?: string
          weight_lbs: number
          waist_in?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          logged_at?: string
          weight_lbs?: number
          waist_in?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      diet_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          protein_g: number
          calories: number | null
          steps: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          logged_at?: string
          protein_g: number
          calories?: number | null
          steps?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          logged_at?: string
          protein_g?: number
          calories?: number | null
          steps?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      user_profile: {
        Row: {
          user_id: string
          starting_weight_lbs: number
          starting_date: string
          goal_weight_lbs: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          starting_weight_lbs: number
          starting_date?: string
          goal_weight_lbs?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          starting_weight_lbs?: number
          starting_date?: string
          goal_weight_lbs?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_workout_day: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_stats: {
        Args: {
          p_user_id: string
          p_start_date?: string | null
          p_end_date?: string | null
        }
        Returns: {
          workout_days: number
          total_workouts: number
          total_sets: number
          diet_days: number
          total_protein: number
          total_calories: number
          days_with_calories: number
        }[]
      }
      get_weight_at_date: {
        Args: {
          p_user_id: string
          p_date: string
        }
        Returns: number | null
      }
      get_monthly_breakdown: {
        Args: {
          p_user_id: string
          p_months?: number
          p_timezone?: string
        }
        Returns: {
          month_start: string
          month_label: string
          workout_days: number
          diet_days: number
          total_protein: number
          total_calories: number
          days_with_protein: number
          days_with_calories: number
          start_weight: number | null
          end_weight: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']
export type WorkoutTemplateItem = Database['public']['Tables']['workout_template_items']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type BodyweightLog = Database['public']['Tables']['bodyweight_logs']['Row']
export type DietLog = Database['public']['Tables']['diet_logs']['Row']
export type UserProfile = Database['public']['Tables']['user_profile']['Row']

// Stats types
export type UserStats = Database['public']['Functions']['get_user_stats']['Returns'][number]
export type MonthlyBreakdown = Database['public']['Functions']['get_monthly_breakdown']['Returns'][number]

// Joined types for convenience
export type TemplateItemWithExercise = WorkoutTemplateItem & {
  exercise: Exercise
}

export type TemplateWithItems = WorkoutTemplate & {
  items: TemplateItemWithExercise[]
}
