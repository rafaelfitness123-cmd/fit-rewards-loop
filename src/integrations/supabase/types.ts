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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      avisos: {
        Row: {
          data: string
          destaque: boolean
          id: string
          texto: string
          titulo: string
        }
        Insert: {
          data?: string
          destaque?: boolean
          id?: string
          texto?: string
          titulo: string
        }
        Update: {
          data?: string
          destaque?: boolean
          id?: string
          texto?: string
          titulo?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          atualizado_em: string
          dados: Json
          id: string
        }
        Insert: {
          atualizado_em?: string
          dados?: Json
          id: string
        }
        Update: {
          atualizado_em?: string
          dados?: Json
          id?: string
        }
        Relationships: []
      }
      corridas: {
        Row: {
          cliente_id: string
          distancia_m: number
          duracao_s: number
          finalizada_em: string | null
          id: string
          iniciada_em: string
          missao_id: string | null
        }
        Insert: {
          cliente_id: string
          distancia_m?: number
          duracao_s?: number
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          missao_id?: string | null
        }
        Update: {
          cliente_id?: string
          distancia_m?: number
          duracao_s?: number
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          missao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corridas_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_pontos: {
        Row: {
          cliente_id: string
          data: string
          delta: number
          id: string
          motivo: string
        }
        Insert: {
          cliente_id: string
          data?: string
          delta?: number
          id?: string
          motivo?: string
        }
        Update: {
          cliente_id?: string
          data?: string
          delta?: number
          id?: string
          motivo?: string
        }
        Relationships: []
      }
      missoes: {
        Row: {
          ativa: boolean
          criado_em: string
          descricao: string
          dia_semana: number | null
          fim: string | null
          id: string
          inicio: string | null
          nome: string
          objetivo: string
          pontos: number
          quantidade: number
          raio_m: number
          tipo: string
        }
        Insert: {
          ativa?: boolean
          criado_em?: string
          descricao?: string
          dia_semana?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          nome: string
          objetivo?: string
          pontos?: number
          quantidade?: number
          raio_m?: number
          tipo?: string
        }
        Update: {
          ativa?: boolean
          criado_em?: string
          descricao?: string
          dia_semana?: number | null
          fim?: string | null
          id?: string
          inicio?: string | null
          nome?: string
          objetivo?: string
          pontos?: number
          quantidade?: number
          raio_m?: number
          tipo?: string
        }
        Relationships: []
      }
      posicoes_ativas: {
        Row: {
          atualizado_em: string
          cliente_id: string
          compartilhando: boolean
          lat: number
          lng: number
          missao_id: string | null
          precisao: number
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          compartilhando?: boolean
          lat: number
          lng: number
          missao_id?: string | null
          precisao?: number
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          compartilhando?: boolean
          lat?: number
          lng?: number
          missao_id?: string | null
          precisao?: number
        }
        Relationships: [
          {
            foreignKeyName: "posicoes_ativas_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          compartilhar_local: boolean
          cpf: string | null
          criado_em: string
          id: string
          nome: string
          pontos: number
          visibilidade_local: string
        }
        Insert: {
          avatar?: string | null
          compartilhar_local?: boolean
          cpf?: string | null
          criado_em?: string
          id: string
          nome?: string
          pontos?: number
          visibilidade_local?: string
        }
        Update: {
          avatar?: string | null
          compartilhar_local?: boolean
          cpf?: string | null
          criado_em?: string
          id?: string
          nome?: string
          pontos?: number
          visibilidade_local?: string
        }
        Relationships: []
      }
      progresso_missoes: {
        Row: {
          aceita: boolean
          atualizado_em: string
          cliente_id: string
          concedida: boolean
          concluida: boolean
          id: string
          missao_id: string
          periodo: string
          progresso: number
        }
        Insert: {
          aceita?: boolean
          atualizado_em?: string
          cliente_id: string
          concedida?: boolean
          concluida?: boolean
          id?: string
          missao_id: string
          periodo: string
          progresso?: number
        }
        Update: {
          aceita?: boolean
          atualizado_em?: string
          cliente_id?: string
          concedida?: boolean
          concluida?: boolean
          id?: string
          missao_id?: string
          periodo?: string
          progresso?: number
        }
        Relationships: [
          {
            foreignKeyName: "progresso_missoes_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacao_comentarios: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          publicacao_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          publicacao_id: string
          texto?: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          publicacao_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacao_comentarios_publicacao_id_fkey"
            columns: ["publicacao_id"]
            isOneToOne: false
            referencedRelation: "publicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacao_curtidas: {
        Row: {
          created_at: string
          id: string
          publicacao_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          publicacao_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          publicacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacao_curtidas_publicacao_id_fkey"
            columns: ["publicacao_id"]
            isOneToOne: false
            referencedRelation: "publicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacao_denuncias: {
        Row: {
          created_at: string
          id: string
          motivo: string
          publicacao_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string
          publicacao_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string
          publicacao_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacao_denuncias_publicacao_id_fkey"
            columns: ["publicacao_id"]
            isOneToOne: false
            referencedRelation: "publicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacoes: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          imagem_path: string | null
          legenda: string
          missao_dados: Json | null
          missao_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          imagem_path?: string | null
          legenda?: string
          missao_dados?: Json | null
          missao_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          imagem_path?: string | null
          legenda?: string
          missao_dados?: Json | null
          missao_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacoes_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      qrcodes: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          expira_em: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          expira_em?: string | null
          id?: string
          nome?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          expira_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      recompensas: {
        Row: {
          ativa: boolean
          criado_em: string
          descricao: string
          id: string
          nome: string
          pontos: number
          quantidade: number
        }
        Insert: {
          ativa?: boolean
          criado_em?: string
          descricao?: string
          id?: string
          nome: string
          pontos?: number
          quantidade?: number
        }
        Update: {
          ativa?: boolean
          criado_em?: string
          descricao?: string
          id?: string
          nome?: string
          pontos?: number
          quantidade?: number
        }
        Relationships: []
      }
      resgates: {
        Row: {
          cliente_id: string
          cliente_nome: string
          data: string
          id: string
          pontos: number
          recompensa_id: string | null
          recompensa_nome: string
          status: string
        }
        Insert: {
          cliente_id: string
          cliente_nome?: string
          data?: string
          id?: string
          pontos?: number
          recompensa_id?: string | null
          recompensa_nome?: string
          status?: string
        }
        Update: {
          cliente_id?: string
          cliente_nome?: string
          data?: string
          id?: string
          pontos?: number
          recompensa_id?: string | null
          recompensa_nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "resgates_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas"
            referencedColumns: ["id"]
          },
        ]
      }
      seguidores: {
        Row: {
          created_at: string
          id: string
          seguido_id: string
          seguidor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seguido_id: string
          seguidor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seguido_id?: string
          seguidor_id?: string
        }
        Relationships: []
      }
      treinos: {
        Row: {
          cliente_id: string
          entrada: string
          id: string
          pontos_concedidos: boolean
          pontos_entrada: number
          pontos_saida: number
          saida: string | null
        }
        Insert: {
          cliente_id: string
          entrada?: string
          id?: string
          pontos_concedidos?: boolean
          pontos_entrada?: number
          pontos_saida?: number
          saida?: string | null
        }
        Update: {
          cliente_id?: string
          entrada?: string
          id?: string
          pontos_concedidos?: boolean
          pontos_entrada?: number
          pontos_saida?: number
          saida?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      parceiros_proximos: {
        Args: { _missao_id: string; _raio_m?: number }
        Returns: {
          avatar: string
          cliente_id: string
          distancia_m: number
          lat: number
          lng: number
          nome: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "cliente"
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
      app_role: ["admin", "cliente"],
    },
  },
} as const
