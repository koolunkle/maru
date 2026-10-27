// 생성: Supabase CLI, 운영 스키마 (직접 수정하지 말 것).
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          publish_at: string
          status: Database["public"]["Enums"]["comment_status"]
          user_id: string
          verification_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          publish_at?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
          verification_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          publish_at?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_notes: {
        Row: {
          created_at: string
          mood: number
          note_date: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mood: number
          note_date?: string
          text?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          mood?: number
          note_date?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_recommendations: {
        Row: {
          created_at: string
          daily_mission_ids: string[]
          rec_date: string
          refresh_count: number
          user_id: string
          weekly_mission_id: string | null
        }
        Insert: {
          created_at?: string
          daily_mission_ids: string[]
          rec_date: string
          refresh_count?: number
          user_id: string
          weekly_mission_id?: string | null
        }
        Update: {
          created_at?: string
          daily_mission_ids?: string[]
          rec_date?: string
          refresh_count?: number
          user_id?: string
          weekly_mission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_recommendations_weekly_mission_id_fkey"
            columns: ["weekly_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          district: string
          end_date: string
          external_id: string | null
          id: string
          place: string | null
          start_date: string
          title: string
          url: string | null
        }
        Insert: {
          district: string
          end_date: string
          external_id?: string | null
          id?: string
          place?: string | null
          start_date: string
          title: string
          url?: string | null
        }
        Update: {
          district?: string
          end_date?: string
          external_id?: string | null
          id?: string
          place?: string | null
          start_date?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      furniture: {
        Row: {
          id: string
          name: string
          slot_type: Database["public"]["Enums"]["furniture_slot_type"]
          sort: number
          unlock_rule: Json
        }
        Insert: {
          id: string
          name: string
          slot_type: Database["public"]["Enums"]["furniture_slot_type"]
          sort: number
          unlock_rule: Json
        }
        Update: {
          id?: string
          name?: string
          slot_type?: Database["public"]["Enums"]["furniture_slot_type"]
          sort?: number
          unlock_rule?: Json
        }
        Relationships: []
      }
      mailbox_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          received_at: string | null
          recipient_id: string | null
          request_id: string
          status: Database["public"]["Enums"]["comment_status"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          received_at?: string | null
          recipient_id?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          received_at?: string | null
          recipient_id?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailbox_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailbox_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_participants: {
        Row: {
          created_at: string
          mission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mission_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_participants_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          category: Database["public"]["Enums"]["mission_category"]
          created_at: string
          created_for: string | null
          difficulty: number
          event_id: string | null
          id: string
          minutes: number
          official_level: Database["public"]["Enums"]["official_level"] | null
          official_title: string | null
          reason: string | null
          seed_no: number | null
          source: Database["public"]["Enums"]["mission_source"]
          title: string
          verify_hint: string
        }
        Insert: {
          category: Database["public"]["Enums"]["mission_category"]
          created_at?: string
          created_for?: string | null
          difficulty: number
          event_id?: string | null
          id?: string
          minutes: number
          official_level?: Database["public"]["Enums"]["official_level"] | null
          official_title?: string | null
          reason?: string | null
          seed_no?: number | null
          source: Database["public"]["Enums"]["mission_source"]
          title: string
          verify_hint: string
        }
        Update: {
          category?: Database["public"]["Enums"]["mission_category"]
          created_at?: string
          created_for?: string | null
          difficulty?: number
          event_id?: string | null
          id?: string
          minutes?: number
          official_level?: Database["public"]["Enums"]["official_level"] | null
          official_title?: string | null
          reason?: string | null
          seed_no?: number | null
          source?: Database["public"]["Enums"]["mission_source"]
          title?: string
          verify_hint?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_created_for_fkey"
            columns: ["created_for"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          categories: Database["public"]["Enums"]["mission_category"][]
          created_at: string
          daily_minutes: number | null
          difficulty: number
          difficulty_changed_at: string | null
          district: string | null
          id: string
          last_attended: string | null
          nickname: string
          onboarded_at: string | null
          preferences: Json
          rest_used_week: string | null
          streak: number
        }
        Insert: {
          categories?: Database["public"]["Enums"]["mission_category"][]
          created_at?: string
          daily_minutes?: number | null
          difficulty?: number
          difficulty_changed_at?: string | null
          district?: string | null
          id: string
          last_attended?: string | null
          nickname: string
          onboarded_at?: string | null
          preferences?: Json
          rest_used_week?: string | null
          streak?: number
        }
        Update: {
          categories?: Database["public"]["Enums"]["mission_category"][]
          created_at?: string
          daily_minutes?: number | null
          difficulty?: number
          difficulty_changed_at?: string | null
          district?: string | null
          id?: string
          last_attended?: string | null
          nickname?: string
          onboarded_at?: string | null
          preferences?: Json
          rest_used_week?: string | null
          streak?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
          verification_id: string
        }
        Update: {
          created_at?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_messages: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["mission_category"]
          created_at: string
          id: string
          mission_id: string
          publish_at: string
          status: Database["public"]["Enums"]["comment_status"]
          user_id: string
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["mission_category"]
          created_at?: string
          id?: string
          mission_id: string
          publish_at?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["mission_category"]
          created_at?: string
          id?: string
          mission_id?: string
          publish_at?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsules: {
        Row: {
          body: string
          created_at: string
          id: string
          open_on: string
          opened_at: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          open_on: string
          opened_at?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          open_on?: string
          opened_at?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_capsules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_furniture: {
        Row: {
          acquired_at: string
          furniture_id: string
          slot: Database["public"]["Enums"]["room_slot"] | null
          user_id: string
        }
        Insert: {
          acquired_at?: string
          furniture_id: string
          slot?: Database["public"]["Enums"]["room_slot"] | null
          user_id: string
        }
        Update: {
          acquired_at?: string
          furniture_id?: string
          slot?: Database["public"]["Enums"]["room_slot"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_furniture_furniture_id_fkey"
            columns: ["furniture_id"]
            isOneToOne: false
            referencedRelation: "furniture"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_furniture_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          due_at: string
          id: string
          mission_id: string
          resolved_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["user_mission_status"]
          type: Database["public"]["Enums"]["mission_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          due_at: string
          id?: string
          mission_id: string
          resolved_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["user_mission_status"]
          type: Database["public"]["Enums"]["mission_type"]
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          due_at?: string
          id?: string
          mission_id?: string
          resolved_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["user_mission_status"]
          type?: Database["public"]["Enums"]["mission_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_missions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          ai_message: string | null
          ai_result: Database["public"]["Enums"]["verification_result"] | null
          created_at: string
          id: string
          is_public: boolean
          photo_path: string
          text: string | null
          user_id: string
          user_mission_id: string
        }
        Insert: {
          ai_message?: string | null
          ai_result?: Database["public"]["Enums"]["verification_result"] | null
          created_at?: string
          id?: string
          is_public?: boolean
          photo_path: string
          text?: string | null
          user_id?: string
          user_mission_id: string
        }
        Update: {
          ai_message?: string | null
          ai_result?: Database["public"]["Enums"]["verification_result"] | null
          created_at?: string
          id?: string
          is_public?: boolean
          photo_path?: string
          text?: string | null
          user_id?: string
          user_mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_user_mission_id_fkey"
            columns: ["user_mission_id"]
            isOneToOne: false
            referencedRelation: "user_missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_due_missions: { Args: never; Returns: number }
      get_feed: {
        Args: { before?: string; page_size?: number }
        Returns: {
          category: Database["public"]["Enums"]["mission_category"]
          created_at: string
          id: string
          mission_id: string
          mission_title: string
          nickname: string
          photo_path: string
          text: string
          user_id: string
        }[]
      }
      get_nicknames: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          nickname: string
        }[]
      }
      get_participant_counts: {
        Args: { mission_ids: string[] }
        Returns: {
          count: number
          mission_id: string
        }[]
      }
      get_participant_nicknames: {
        Args: { mission: string }
        Returns: {
          nickname: string
        }[]
      }
      get_relay_messages: {
        Args: { mission: string }
        Returns: {
          body: string
        }[]
      }
      list_time_capsules: {
        Args: never
        Returns: {
          body: string
          created_at: string
          days_ago: number
          id: string
          open_on: string
          opened_at: string
          ready: boolean
        }[]
      }
      open_time_capsule: { Args: { p_id: string }; Returns: string }
      publish_due_comments: { Args: never; Returns: number }
      receive_mailbox_message: {
        Args: { recipient: string }
        Returns: undefined
      }
      save_daily_note: {
        Args: {
          p_mood: number
          p_note_date: string
          p_text: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          mood: number
          note_date: string
          text: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "daily_notes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      send_time_capsule: {
        Args: { p_body: string; p_days: number; p_request_id: string }
        Returns: undefined
      }
      set_demo_mode: { Args: { enabled: boolean }; Returns: undefined }
    }
    Enums: {
      comment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "crisis"
        | "published"
      furniture_slot_type: "floor" | "wall" | "window" | "desk"
      mission_category:
        | "walk"
        | "food"
        | "culture"
        | "growth"
        | "neighborhood"
        | "rhythm"
        | "people"
      mission_source: "seed" | "ai" | "event"
      mission_type: "daily" | "weekly"
      official_level: "low" | "mid" | "high"
      reaction_type: "cheer" | "metoo" | "nice"
      room_slot: "floor-1" | "floor-2" | "wall-1" | "wall-2" | "window" | "desk"
      user_mission_status: "in_progress" | "judging" | "completed" | "expired"
      verification_result: "pass" | "retry" | "privacy"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      comment_status: [
        "pending",
        "approved",
        "rejected",
        "crisis",
        "published",
      ],
      furniture_slot_type: ["floor", "wall", "window", "desk"],
      mission_category: [
        "walk",
        "food",
        "culture",
        "growth",
        "neighborhood",
        "rhythm",
        "people",
      ],
      mission_source: ["seed", "ai", "event"],
      mission_type: ["daily", "weekly"],
      official_level: ["low", "mid", "high"],
      reaction_type: ["cheer", "metoo", "nice"],
      room_slot: ["floor-1", "floor-2", "wall-1", "wall-2", "window", "desk"],
      user_mission_status: ["in_progress", "judging", "completed", "expired"],
      verification_result: ["pass", "retry", "privacy"],
    },
  },
} as const
