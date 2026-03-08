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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          description: string
          entity_ids: string[] | null
          id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          created_at?: string
          description: string
          entity_ids?: string[] | null
          id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          created_at?: string
          description?: string
          entity_ids?: string[] | null
          id?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: []
      }
      entities: {
        Row: {
          altitude: number | null
          callsign: string | null
          classification: Database["public"]["Enums"]["entity_classification"]
          country: string | null
          details: string | null
          flag_code: string | null
          heading: number | null
          id: string
          lat: number
          lng: number
          name: string
          origin: string | null
          source: string
          speed: number | null
          threat_score: number | null
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
        }
        Insert: {
          altitude?: number | null
          callsign?: string | null
          classification: Database["public"]["Enums"]["entity_classification"]
          country?: string | null
          details?: string | null
          flag_code?: string | null
          heading?: number | null
          id: string
          lat: number
          lng: number
          name: string
          origin?: string | null
          source: string
          speed?: number | null
          threat_score?: number | null
          type: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Update: {
          altitude?: number | null
          callsign?: string | null
          classification?: Database["public"]["Enums"]["entity_classification"]
          country?: string | null
          details?: string | null
          flag_code?: string | null
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          origin?: string | null
          source?: string
          speed?: number | null
          threat_score?: number | null
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      global_events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_breaking: boolean | null
          lat: number | null
          lng: number | null
          raw_data: Json | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string | null
          title: string
          url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_breaking?: boolean | null
          lat?: number | null
          lng?: number | null
          raw_data?: Json | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          title: string
          url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_breaking?: boolean | null
          lat?: number | null
          lng?: number | null
          raw_data?: Json | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      trail_points: {
        Row: {
          entity_id: string
          id: string
          lat: number
          lng: number
          recorded_at: string
        }
        Insert: {
          entity_id: string
          id?: string
          lat: number
          lng: number
          recorded_at?: string
        }
        Update: {
          entity_id?: string
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_points_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
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
      alert_severity: "critical" | "high" | "medium" | "low"
      alert_type: "cluster" | "movement" | "airspace" | "proximity"
      entity_classification: "military" | "civilian" | "unknown"
      entity_type: "aircraft" | "ship" | "base" | "strategic" | "alert"
      event_category:
        | "military"
        | "economy"
        | "trade"
        | "health"
        | "disaster"
        | "political"
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
      alert_severity: ["critical", "high", "medium", "low"],
      alert_type: ["cluster", "movement", "airspace", "proximity"],
      entity_classification: ["military", "civilian", "unknown"],
      entity_type: ["aircraft", "ship", "base", "strategic", "alert"],
      event_category: [
        "military",
        "economy",
        "trade",
        "health",
        "disaster",
        "political",
      ],
    },
  },
} as const
