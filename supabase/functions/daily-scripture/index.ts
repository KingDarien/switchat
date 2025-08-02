import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOD_USER_ID = '00000000-0000-0000-0000-000000000001';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily scripture posting...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we already posted today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingPost } = await supabase
      .from('daily_scriptures')
      .select('*')
      .eq('post_date', today)
      .single();

    if (existingPost) {
      console.log('Scripture already posted today');
      return new Response(JSON.stringify({ message: 'Scripture already posted today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get random Bible verse from Bible API
    let verse, reference;
    const bibleApiKey = Deno.env.get('BIBLE_API_KEY');
    
    if (bibleApiKey) {
      try {
        // Using Bible API for real verses
        const response = await fetch('https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/verses/JHN.3.16', {
          headers: {
            'api-key': bibleApiKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          verse = data.data.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
          reference = data.data.reference;
        }
      } catch (error) {
        console.log('Bible API error:', error);
      }
    }

    // Fallback verses if API fails
    if (!verse) {
      const fallbackVerses = [
        {
          text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
          reference: "John 3:16"
        },
        {
          text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
          reference: "Proverbs 3:5-6"
        },
        {
          text: "I can do all this through him who gives me strength.",
          reference: "Philippians 4:13"
        },
        {
          text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
          reference: "Joshua 1:9"
        },
        {
          text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
          reference: "Psalm 23:1-3"
        }
      ];
      
      const randomVerse = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
      verse = randomVerse.text;
      reference = randomVerse.reference;
    }

    // Generate inspirational commentary using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    let commentary = '';
    
    if (openAIApiKey) {
      try {
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are God speaking to your children. Write a brief, loving, and encouraging commentary (2-3 sentences) about the given Bible verse. Keep it warm, personal, and uplifting. No religious jargon - speak from the heart.'
              },
              {
                role: 'user',
                content: `Bible verse: "${verse}" (${reference})`
              }
            ],
            max_tokens: 150
          }),
        });

        if (openAIResponse.ok) {
          const openAIData = await openAIResponse.json();
          commentary = openAIData.choices[0].message.content;
        }
      } catch (error) {
        console.log('OpenAI API error:', error);
      }
    }

    // Fallback commentary if AI fails
    if (!commentary) {
      commentary = "Remember, my child, that you are deeply loved and never alone. Let this verse guide your heart today and fill you with peace.";
    }

    // Create the post content
    const postContent = `"${verse}"\n\n— ${reference}\n\n${commentary}\n\n🙏 #DailyScripture #Faith #Hope #Love`;

    // Create the post as God
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: GOD_USER_ID,
        content: postContent
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      throw postError;
    }

    console.log('Created post:', newPost.id);

    // Record the scripture post
    const { error: scriptureError } = await supabase
      .from('daily_scriptures')
      .insert({
        post_date: today,
        post_id: newPost.id,
        scripture_reference: reference
      });

    if (scriptureError) {
      console.error('Error recording scripture:', scriptureError);
    }

    // Trigger auto-like from DarienAdair
    try {
      await fetch(`${supabaseUrl}/functions/v1/auto-like-god`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: newPost.id })
      });
    } catch (error) {
      console.log('Auto-like function error:', error);
    }

    console.log('Daily scripture posted successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      postId: newPost.id,
      reference: reference 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-scripture function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});