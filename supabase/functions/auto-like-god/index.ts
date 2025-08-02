import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DARIEN_ADAIR_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // This should be DarienAdair's actual user ID
const GOD_USER_ID = '00000000-0000-0000-0000-000000000001';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-like process...');

    const { postId } = await req.json();
    
    if (!postId) {
      throw new Error('Post ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, find DarienAdair's actual user ID
    const { data: darienProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', 'DarienAdair')
      .single();

    if (!darienProfile) {
      console.log('DarienAdair profile not found, skipping auto-like');
      return new Response(JSON.stringify({ message: 'DarienAdair profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const darienUserId = darienProfile.user_id;

    // Verify the post is from God
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .eq('user_id', GOD_USER_ID)
      .single();

    if (!post) {
      console.log('Post not found or not from God');
      return new Response(JSON.stringify({ message: 'Post not found or not from God' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if DarienAdair already liked this post
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', darienUserId)
      .single();

    if (existingLike) {
      console.log('DarienAdair already liked this post');
      return new Response(JSON.stringify({ message: 'Already liked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add a small random delay (1-5 seconds) to make it seem more natural
    const delay = Math.floor(Math.random() * 4000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Create the like from DarienAdair
    const { error: likeError } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: darienUserId
      });

    if (likeError) {
      console.error('Error creating like:', likeError);
      throw likeError;
    }

    console.log(`DarienAdair auto-liked post ${postId} after ${delay}ms delay`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Auto-like successful',
      delay: delay 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-like-god function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});