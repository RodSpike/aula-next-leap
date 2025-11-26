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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          requirement_count: number
          tier: Database["public"]["Enums"]["achievement_tier"]
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          requirement_count?: number
          tier: Database["public"]["Enums"]["achievement_tier"]
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          requirement_count?: number
          tier?: Database["public"]["Enums"]["achievement_tier"]
          xp_reward?: number
        }
        Relationships: []
      }
      admin_free_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          granted_by: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          granted_by: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          granted_by?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          admin_email: string
          admin_user_id: string
          can_undo: boolean | null
          created_at: string
          description: string | null
          id: string
          target_data: Json | null
          target_id: string | null
          target_type: string
          undo_data: Json | null
        }
        Insert: {
          action_type: string
          admin_email: string
          admin_user_id: string
          can_undo?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          target_data?: Json | null
          target_id?: string | null
          target_type: string
          undo_data?: Json | null
        }
        Update: {
          action_type?: string
          admin_email?: string
          admin_user_id?: string
          can_undo?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          target_data?: Json | null
          target_id?: string | null
          target_type?: string
          undo_data?: Json | null
        }
        Relationships: []
      }
      campus_events: {
        Row: {
          created_at: string
          current_participants: number
          description: string | null
          end_time: string
          event_type: string
          host_id: string
          id: string
          max_participants: number
          room_id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          current_participants?: number
          description?: string | null
          end_time: string
          event_type?: string
          host_id: string
          id?: string
          max_participants?: number
          room_id: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          current_participants?: number
          description?: string | null
          end_time?: string
          event_type?: string
          host_id?: string
          id?: string
          max_participants?: number
          room_id?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campus_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "virtual_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_type: string | null
          course_name: string
          created_at: string
          id: string
          issued_date: string
          user_id: string
        }
        Insert: {
          certificate_type?: string | null
          course_name: string
          created_at?: string
          id?: string
          issued_date?: string
          user_id: string
        }
        Update: {
          certificate_type?: string | null
          course_name?: string
          created_at?: string
          id?: string
          issued_date?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_direct_message: boolean
          is_private: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_direct_message?: boolean
          is_private?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_direct_message?: boolean
          is_private?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          chat_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          chat_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          chat_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          archived: boolean | null
          created_at: string
          created_by: string
          description: string | null
          group_type: string | null
          id: string
          invite_code: string | null
          is_default: boolean | null
          is_private_chat: boolean
          level: string
          max_members: number | null
          name: string
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          group_type?: string | null
          id?: string
          invite_code?: string | null
          is_default?: boolean | null
          is_private_chat?: boolean
          level: string
          max_members?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?: string | null
          id?: string
          invite_code?: string | null
          is_default?: boolean | null
          is_private_chat?: boolean
          level?: string
          max_members?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          admin_only: boolean | null
          course_type: string | null
          created_at: string
          description: string | null
          id: string
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          admin_only?: boolean | null
          course_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          admin_only?: boolean | null
          course_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_conversation_state: {
        Row: {
          created_at: string
          deleted_before: string
          group_id: string
          id: string
          other_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_before?: string
          group_id: string
          id?: string
          other_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_before?: string
          group_id?: string
          id?: string
          other_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      enem_exam_questions: {
        Row: {
          created_at: string | null
          id: string
          questions: Json
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          questions: Json
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          questions?: Json
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enem_lessons: {
        Row: {
          content: string
          created_at: string | null
          id: string
          subject_id: string
          subject_name: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          subject_id: string
          subject_name: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          subject_id?: string
          subject_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      english_tv_videos: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          order_index: number
          title: string | null
          video_id: string
          youtube_url: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          order_index?: number
          title?: string | null
          video_id: string
          youtube_url: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          order_index?: number
          title?: string | null
          video_id?: string
          youtube_url?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          correct_answer: string
          created_at: string
          exercise_type: string | null
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          order_index: number
          points: number | null
          question: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exercise_type?: string | null
          explanation?: string | null
          id?: string
          lesson_id: string
          options: Json
          order_index: number
          points?: number | null
          question: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exercise_type?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          order_index?: number
          points?: number | null
          question?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          id: string
          requested_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          is_system_message: boolean
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          is_system_message?: boolean
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          is_system_message?: boolean
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          can_post: boolean | null
          created_at: string
          group_id: string
          id: string
          invited_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          can_post?: boolean | null
          created_at?: string
          group_id: string
          id?: string
          invited_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          can_post?: boolean | null
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          group_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          group_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_content: {
        Row: {
          content: Json | null
          created_at: string | null
          examples: Json | null
          explanation: string | null
          id: string
          lesson_id: string
          order_index: number
          section_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          examples?: Json | null
          explanation?: string | null
          id?: string
          lesson_id: string
          order_index?: number
          section_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          examples?: Json | null
          explanation?: string | null
          id?: string
          lesson_id?: string
          order_index?: number
          section_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          audio_duration: number | null
          audio_generated_at: string | null
          audio_segments: Json | null
          audio_url: string | null
          content: string
          course_id: string
          created_at: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          audio_duration?: number | null
          audio_generated_at?: string | null
          audio_segments?: Json | null
          audio_url?: string | null
          content: string
          course_id: string
          created_at?: string
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          audio_duration?: number | null
          audio_generated_at?: string | null
          audio_segments?: Json | null
          audio_url?: string | null
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      level_tests: {
        Row: {
          created_at: string
          from_level: string
          id: string
          questions: Json
          to_level: string
        }
        Insert: {
          created_at?: string
          from_level: string
          id?: string
          questions: Json
          to_level: string
        }
        Update: {
          created_at?: string
          from_level?: string
          id?: string
          questions?: Json
          to_level?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          prospect_email: string | null
          status: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          prospect_email?: string | null
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          prospect_email?: string | null
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_frames: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_premium: boolean | null
          key: string
          name: string
          required_achievement_id: string | null
          required_level: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_premium?: boolean | null
          key: string
          name: string
          required_achievement_id?: string | null
          required_level?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_premium?: boolean | null
          key?: string
          name?: string
          required_achievement_id?: string | null
          required_level?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          cambridge_level: string | null
          created_at: string
          display_name: string | null
          email: string
          favorite_song_url: string | null
          header_bg_color: string | null
          header_image_url: string | null
          id: string
          intro_message: string | null
          main_profile_post: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          cambridge_level?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          favorite_song_url?: string | null
          header_bg_color?: string | null
          header_image_url?: string | null
          id?: string
          intro_message?: string | null
          main_profile_post?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          cambridge_level?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          favorite_song_url?: string | null
          header_bg_color?: string | null
          header_image_url?: string | null
          id?: string
          intro_message?: string | null
          main_profile_post?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      pronunciation_evaluations: {
        Row: {
          audio_url: string | null
          context: string | null
          corrected_text: string | null
          created_at: string | null
          detected_language: string
          expected_text: string | null
          feedback: Json
          fluency_score: number | null
          grammar_score: number | null
          id: string
          lesson_id: string | null
          overall_score: number | null
          pronunciation_score: number | null
          transcription: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          context?: string | null
          corrected_text?: string | null
          created_at?: string | null
          detected_language: string
          expected_text?: string | null
          feedback?: Json
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          lesson_id?: string | null
          overall_score?: number | null
          pronunciation_score?: number | null
          transcription: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          context?: string | null
          corrected_text?: string | null
          created_at?: string | null
          detected_language?: string
          expected_text?: string | null
          feedback?: Json
          fluency_score?: number | null
          grammar_score?: number | null
          id?: string
          lesson_id?: string | null
          overall_score?: number | null
          pronunciation_score?: number | null
          transcription?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciation_evaluations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          agreed_marketing: boolean | null
          agreed_terms: boolean | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          agreed_marketing?: boolean | null
          agreed_terms?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          agreed_marketing?: boolean | null
          agreed_terms?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "virtual_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          hours_studied: number
          id: string
          session_date: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          hours_studied?: number
          id?: string
          session_date?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          hours_studied?: number
          id?: string
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "user_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          context: Json
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          context?: Json
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          context?: Json
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_avatars: {
        Row: {
          avatar_data: Json | null
          avatar_style: string
          created_at: string
          current_room_id: string | null
          direction: string
          id: string
          last_active: string
          position_x: number
          position_y: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_data?: Json | null
          avatar_style?: string
          created_at?: string
          current_room_id?: string | null
          direction?: string
          id?: string
          last_active?: string
          position_x?: number
          position_y?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_data?: Json | null
          avatar_style?: string
          created_at?: string
          current_room_id?: string | null
          direction?: string
          id?: string
          last_active?: string
          position_x?: number
          position_y?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_avatars_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "virtual_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_courses: {
        Row: {
          completed_lessons: number | null
          course_description: string | null
          course_name: string
          created_at: string
          id: string
          status: string | null
          total_lessons: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: number | null
          course_description?: string | null
          course_name: string
          created_at?: string
          id?: string
          status?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: number | null
          course_description?: string | null
          course_name?: string
          created_at?: string
          id?: string
          status?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exercise_attempts: {
        Row: {
          answer: string
          completed_at: string | null
          exercise_id: string
          id: string
          is_correct: boolean | null
          score: number | null
          user_id: string
        }
        Insert: {
          answer: string
          completed_at?: string | null
          exercise_id: string
          id?: string
          is_correct?: boolean | null
          score?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          completed_at?: string | null
          exercise_id?: string
          id?: string
          is_correct?: boolean | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          current_level: number
          id: string
          selected_badge_id: string | null
          selected_frame_id: string | null
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          id?: string
          selected_badge_id?: string | null
          selected_frame_id?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          id?: string
          selected_badge_id?: string | null
          selected_frame_id?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_online_status: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_online_status_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          promoted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promoted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promoted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_test_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          passed: boolean
          score: number
          test_id: string
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          passed: boolean
          score: number
          test_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean
          score?: number
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "level_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp_history: {
        Row: {
          created_at: string
          description: string | null
          id: string
          source: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          source: string
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
      virtual_rooms: {
        Row: {
          capacity: number
          created_at: string
          current_users: number
          id: string
          is_private: boolean
          map_data: Json | null
          name: string
          position_x: number
          position_y: number
          room_type: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_users?: number
          id?: string
          is_private?: boolean
          map_data?: Json | null
          name: string
          position_x?: number
          position_y?: number
          room_type: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_users?: number
          id?: string
          is_private?: boolean
          map_data?: Json | null
          name?: string
          position_x?: number
          position_y?: number
          room_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: {
        Args: {
          p_description?: string
          p_source: string
          p_user_id: string
          p_xp: number
        }
        Returns: Json
      }
      admin_delete_post: {
        Args: { admin_description?: string; post_id: string }
        Returns: boolean
      }
      admin_delete_user: {
        Args: { admin_description?: string; target_user_id: string }
        Returns: boolean
      }
      admin_demote_user: {
        Args: { admin_description?: string; target_user_id: string }
        Returns: boolean
      }
      admin_promote_user: {
        Args: { admin_description?: string; target_user_id: string }
        Returns: boolean
      }
      admin_undo_post_deletion: {
        Args: { audit_log_id: string }
        Returns: boolean
      }
      admin_undo_user_deletion: {
        Args: { audit_log_id: string }
        Returns: boolean
      }
      admin_undo_user_demotion: {
        Args: { audit_log_id: string }
        Returns: boolean
      }
      admin_undo_user_promotion: {
        Args: { audit_log_id: string }
        Returns: boolean
      }
      create_admin_post: {
        Args: {
          attachments_param?: Json
          content_param: string
          group_id_param: string
        }
        Returns: string
      }
      get_nearby_users: {
        Args: { p_proximity_radius?: number; p_user_id: string }
        Returns: {
          display_name: string
          distance: number
          position_x: number
          position_y: number
          user_id: string
        }[]
      }
      get_profile_public_fields: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_creator: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      search_profiles_public: {
        Args: { search_term: string }
        Returns: {
          display_name: string
          user_id: string
          username: string
        }[]
      }
      update_achievement_progress: {
        Args: {
          p_achievement_key: string
          p_increment?: number
          p_user_id: string
        }
        Returns: Json
      }
      user_has_admin_role: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      achievement_category: "learning" | "social" | "engagement" | "milestone"
      achievement_tier: "bronze" | "silver" | "gold" | "platinum"
      app_role: "admin" | "user"
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
      achievement_category: ["learning", "social", "engagement", "milestone"],
      achievement_tier: ["bronze", "silver", "gold", "platinum"],
      app_role: ["admin", "user"],
    },
  },
} as const
