export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          reason: string | null
          target_resource_id: string | null
          target_resource_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          reason?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      audio_rooms: {
        Row: {
          created_at: string
          current_participants: number | null
          description: string | null
          host_id: string
          id: string
          is_active: boolean
          is_private: boolean
          max_participants: number | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          host_id: string
          id?: string
          is_active?: boolean
          is_private?: boolean
          max_participants?: number | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          host_id?: string
          id?: string
          is_active?: boolean
          is_private?: boolean
          max_participants?: number | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
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
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_scriptures: {
        Row: {
          created_at: string | null
          id: string
          post_date: string
          post_id: string | null
          scripture_reference: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_date: string
          post_id?: string | null
          scripture_reference?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_date?: string
          post_id?: string | null
          scripture_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_scriptures_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          created_at: string
          creator_id: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          image_url: string | null
          is_free: boolean | null
          is_published: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          max_attendees: number | null
          price: number | null
          start_date: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_attendees?: number | null
          price?: number | null
          start_date: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_attendees?: number | null
          price?: number | null
          start_date?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      goal_admin_reviews: {
        Row: {
          appeal_text: string | null
          decision: string
          goal_id: string
          id: string
          reason: string | null
          review_type: string
          reviewed_at: string | null
          reviewer_id: string
        }
        Insert: {
          appeal_text?: string | null
          decision: string
          goal_id: string
          id?: string
          reason?: string | null
          review_type: string
          reviewed_at?: string | null
          reviewer_id: string
        }
        Update: {
          appeal_text?: string | null
          decision?: string
          goal_id?: string
          id?: string
          reason?: string | null
          review_type?: string
          reviewed_at?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_admin_reviews_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contribution_type: string | null
          contributor_id: string
          created_at: string | null
          currency: string | null
          goal_id: string
          id: string
          is_anonymous: boolean | null
          message: string | null
          refunded_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          contribution_type?: string | null
          contributor_id: string
          created_at?: string | null
          currency?: string | null
          goal_id: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          contribution_type?: string | null
          contributor_id?: string
          created_at?: string | null
          currency?: string | null
          goal_id?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          refunded_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_resources: {
        Row: {
          contributor_id: string
          created_at: string | null
          estimated_value: number | null
          goal_id: string
          id: string
          is_anonymous: boolean | null
          resource_description: string
          resource_type: string
          status: string | null
        }
        Insert: {
          contributor_id: string
          created_at?: string | null
          estimated_value?: number | null
          goal_id: string
          id?: string
          is_anonymous?: boolean | null
          resource_description: string
          resource_type: string
          status?: string | null
        }
        Update: {
          contributor_id?: string
          created_at?: string | null
          estimated_value?: number | null
          goal_id?: string
          id?: string
          is_anonymous?: boolean | null
          resource_description?: string
          resource_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_resources_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_tips: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          max_followers: number | null
          min_followers: number | null
          niche_id: string
          tip_type: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          max_followers?: number | null
          min_followers?: number | null
          niche_id: string
          tip_type?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          max_followers?: number | null
          min_followers?: number | null
          niche_id?: string
          tip_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_tips_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_system_message: boolean | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_system_message?: boolean | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_system_message?: boolean | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      niches: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          comment_id: string | null
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          message: string | null
          post_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          post_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          post_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
          order_index: number
          question_text: string
          question_type?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          attempt_count: number | null
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_suspicious: boolean | null
          token: string
          used_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          token: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          duration: number | null
          id: string
          image_url: string | null
          post_type: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          duration?: number | null
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          duration?: number | null
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_music_title: string | null
          background_music_url: string | null
          background_theme: Json | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          current_rank: number | null
          display_name: string | null
          ethnicity: string | null
          featured_post_id: string | null
          goals_completed: number | null
          id: string
          interests: string[] | null
          is_protected: boolean | null
          is_verified: boolean | null
          last_login_at: string | null
          location: string | null
          niche_id: string | null
          popularity_score: number | null
          requires_approval: boolean | null
          security_level: number | null
          social_links: Json | null
          total_contributions_made: number | null
          trust_score: number | null
          updated_at: string
          user_id: string
          user_role: string | null
          username: string | null
          verification_tier: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          background_music_title?: string | null
          background_music_url?: string | null
          background_theme?: Json | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          current_rank?: number | null
          display_name?: string | null
          ethnicity?: string | null
          featured_post_id?: string | null
          goals_completed?: number | null
          id?: string
          interests?: string[] | null
          is_protected?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          location?: string | null
          niche_id?: string | null
          popularity_score?: number | null
          requires_approval?: boolean | null
          security_level?: number | null
          social_links?: Json | null
          total_contributions_made?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          user_role?: string | null
          username?: string | null
          verification_tier?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          background_music_title?: string | null
          background_music_url?: string | null
          background_theme?: Json | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          current_rank?: number | null
          display_name?: string | null
          ethnicity?: string | null
          featured_post_id?: string | null
          goals_completed?: number | null
          id?: string
          interests?: string[] | null
          is_protected?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          location?: string | null
          niche_id?: string | null
          popularity_score?: number | null
          requires_approval?: boolean | null
          security_level?: number | null
          social_links?: Json | null
          total_contributions_made?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          user_role?: string | null
          username?: string | null
          verification_tier?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_featured_post_id_fkey"
            columns: ["featured_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          hand_raised: boolean
          id: string
          is_muted: boolean
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          hand_raised?: boolean
          id?: string
          is_muted?: boolean
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          hand_raised?: boolean
          id?: string
          is_muted?: boolean
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_communities: {
        Row: {
          created_at: string
          id: string
          score: number | null
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number | null
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number | null
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_communities_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "community_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          admin_notes: string | null
          approval_status: string | null
          approved_at: string | null
          created_at: string
          currency: string | null
          current_funding: number | null
          current_value: number | null
          description: string | null
          funding_deadline: string | null
          funding_target: number | null
          goal_type: string
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          is_completed: boolean | null
          is_public: boolean | null
          rejection_reason: string | null
          submitted_at: string | null
          target_date: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          created_at?: string
          currency?: string | null
          current_funding?: number | null
          current_value?: number | null
          description?: string | null
          funding_deadline?: string | null
          funding_target?: number | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_completed?: boolean | null
          is_public?: boolean | null
          rejection_reason?: string | null
          submitted_at?: string | null
          target_date?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          created_at?: string
          currency?: string | null
          current_funding?: number | null
          current_value?: number | null
          description?: string | null
          funding_deadline?: string | null
          funding_target?: number | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_completed?: boolean | null
          is_public?: boolean | null
          rejection_reason?: string | null
          submitted_at?: string | null
          target_date?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          show_birthday_banner: boolean | null
          show_events_banner: boolean | null
          show_weather_banner: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_birthday_banner?: boolean | null
          show_events_banner?: boolean | null
          show_weather_banner?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_birthday_banner?: boolean | null
          show_events_banner?: boolean | null
          show_weather_banner?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rankings: {
        Row: {
          calculated_at: string
          id: string
          niche_id: string | null
          popularity_score: number
          rank_position: number | null
          user_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          niche_id?: string | null
          popularity_score?: number
          rank_position?: number | null
          user_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          niche_id?: string | null
          popularity_score?: number
          rank_position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rankings_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_value: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_value: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "onboarding_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_watchlist: {
        Row: {
          added_by_admin_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          reason: string
          risk_level: string | null
          user_id: string
        }
        Insert: {
          added_by_admin_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason: string
          risk_level?: string | null
          user_id: string
        }
        Update: {
          added_by_admin_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason?: string
          risk_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_memos: {
        Row: {
          audio_url: string
          created_at: string
          duration: number | null
          id: string
          is_public: boolean
          title: string | null
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration?: number | null
          id?: string
          is_public?: boolean
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration?: number | null
          id?: string
          is_public?: boolean
          title?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_popularity_score: {
        Args: { user_id_param: string }
        Returns: number
      }
      can_admin_action: {
        Args: { target_user_id_param: string }
        Returns: boolean
      }
      can_request_password_reset: {
        Args: { email_param: string }
        Returns: boolean
      }
      can_request_verification: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      can_view_audio_room: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_type: string
          from_user_id?: string
          post_id?: string
          comment_id?: string
          title?: string
          message?: string
        }
        Returns: string
      }
      log_admin_action: {
        Args: {
          action_type_param: string
          target_user_id_param?: string
          target_resource_type_param?: string
          target_resource_id_param?: string
          details_param?: Json
          reason_param?: string
        }
        Returns: string
      }
      update_user_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_user: {
        Args: { user_identifier: string; tier?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
