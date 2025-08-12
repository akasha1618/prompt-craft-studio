export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          default_model: string
          auto_save: boolean
          openai_api_key_encrypted: string | null
          anthropic_api_key_encrypted: string | null
          encryption_key_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          default_model?: string
          auto_save?: boolean
          openai_api_key_encrypted?: string | null
          anthropic_api_key_encrypted?: string | null
          encryption_key_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          default_model?: string
          auto_save?: boolean
          openai_api_key_encrypted?: string | null
          anthropic_api_key_encrypted?: string | null
          encryption_key_version?: number
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          content: PromptContent
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          content: PromptContent
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          content?: PromptContent
          parent_id?: string | null
          created_at?: string
        }
      }
      prompt_versions: {
        Row: {
          id: string
          prompt_id: string
          content: PromptContent
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          content: PromptContent
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          content?: PromptContent
          created_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          prompt_id: string
          model_name: string
          response: string
          response_time: number
          created_at: string
        }
        Insert: {
          id?: string
          prompt_id: string
          model_name: string
          response: string
          response_time: number
          created_at?: string
        }
        Update: {
          id?: string
          prompt_id?: string
          model_name?: string
          response?: string
          response_time?: number
          created_at?: string
        }
      }
    }
  }
}

export interface PromptContent {
  prompt: string
  role?: string
  context?: string
  instructions?: string
  rules?: string[]
  output_format?: string
}

export type Prompt = Database['public']['Tables']['prompts']['Row']
export type PromptVersion = Database['public']['Tables']['prompt_versions']['Row']
export type Test = Database['public']['Tables']['tests']['Row']
export type User = Database['public']['Tables']['users']['Row'] 