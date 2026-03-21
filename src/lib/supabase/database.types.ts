// Supabase 数据库类型定义
// 这个文件定义了数据库表的结构
// 注意：完整的类型应该通过 Supabase CLI 生成：supabase gen types typescript > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'user' | 'premium' | 'admin';
          email_verified: boolean;
          status: 'active' | 'suspended';
          password_reset_token: string | null;
          reset_expires_at: string | null;
          email_verification_token: string | null;
          verification_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'premium' | 'admin';
          email_verified?: boolean;
          status?: 'active' | 'suspended';
          password_reset_token?: string | null;
          reset_expires_at?: string | null;
          email_verification_token?: string | null;
          verification_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'premium' | 'admin';
          email_verified?: boolean;
          status?: 'active' | 'suspended';
          password_reset_token?: string | null;
          reset_expires_at?: string | null;
          email_verification_token?: string | null;
          verification_expires_at?: string | null;
          updated_at?: string;
        };
      };
      quota_definitions: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          unit: string | null;
          default_limit: number | null;
          premium_limit: number | null;
          admin_limit: number | null;
          reset_period: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          unit?: string | null;
          default_limit?: number | null;
          premium_limit?: number | null;
          admin_limit?: number | null;
          reset_period?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          display_name?: string;
          description?: string | null;
          unit?: string | null;
          default_limit?: number | null;
          premium_limit?: number | null;
          admin_limit?: number | null;
          reset_period?: string | null;
        };
      };
      user_quotas: {
        Row: {
          id: string;
          user_id: string;
          quota_id: string;
          limit_value: number | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quota_id: string;
          limit_value?: number | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          limit_value?: number | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      quota_usage: {
        Row: {
          id: string;
          user_id: string;
          quota_id: string;
          usage_date: string;
          usage_count: number;
          usage_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quota_id: string;
          usage_date: string;
          usage_count?: number;
          usage_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          usage_count?: number;
          usage_value?: number | null;
          updated_at?: string;
        };
      };
      user_pdfs: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_size: number;
          page_count: number | null;
          storage_path: string;
          pinecone_index: string | null;
          pinecone_namespace: string | null;
          upload_ip: string | null;
          created_at: string;
          last_accessed: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_size: number;
          page_count?: number | null;
          storage_path: string;
          pinecone_index?: string | null;
          pinecone_namespace?: string | null;
          upload_ip?: string | null;
          created_at?: string;
          last_accessed?: string;
        };
        Update: {
          filename?: string;
          file_size?: number;
          page_count?: number | null;
          last_accessed?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_name: string | null;
          device_type: string | null;
          ip_address: string | null;
          user_agent: string | null;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_name?: string | null;
          device_type?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          device_name?: string | null;
          device_type?: string | null;
          last_active?: string;
        };
      };
      user_security_log: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          ip_address: string | null;
          user_agent: string | null;
          success: boolean;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          ip_address?: string | null;
          user_agent?: string | null;
          success: boolean;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          success?: boolean;
          details?: Json | null;
        };
      };
      system_config: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          value?: string;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          details: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          target_type?: string | null;
          details?: Json | null;
        };
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          template_id: string;
          subject: string;
          status: string;
          error_message: string | null;
          message_id: string | null;
          data: Json | null;
          sent_at: string | null;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          template_id: string;
          subject: string;
          status: string;
          error_message?: string | null;
          message_id?: string | null;
          data?: Json | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          error_message?: string | null;
          delivered_at?: string | null;
        };
      };
      email_templates: {
        Row: {
          id: string;
          name: string;
          subject: string;
          html_content: string;
          text_content: string | null;
          variables: Json | null;
          language: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          subject: string;
          html_content: string;
          text_content?: string | null;
          variables?: Json | null;
          language?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          subject?: string;
          html_content?: string;
          text_content?: string | null;
          variables?: Json | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
