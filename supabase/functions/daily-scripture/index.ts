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

    // Check if today is Saturday (day 6) - no posts on Saturdays
    const currentDate = new Date();
    if (currentDate.getDay() === 6) {
      console.log('Saturday - no scripture posting today');
      return new Response(JSON.stringify({ message: 'No posting on Saturdays' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Get last 30 scripture references to avoid repetition
    const { data: recentScriptures } = await supabase
      .from('daily_scriptures')
      .select('scripture_reference')
      .order('post_date', { ascending: false })
      .limit(30);

    const recentRefs = recentScriptures?.map(s => s.scripture_reference).filter(Boolean) || [];
    console.log('Recent scripture references:', recentRefs);

    // Use AI to select a random Bible verse reference
    let verseReferenceId = null;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openAIApiKey) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a Bible verse selector. Choose a meaningful, uplifting Bible verse that has NOT been used recently. Return ONLY the verse reference in Bible API format (e.g., JHN.3.16, ROM.12.2, PSA.23.1, MAT.5.16, PHP.4.13, ISA.40.31). Use this format: BOOK.CHAPTER.VERSE where BOOK is the 3-letter Bible API book code.'
              },
              {
                role: 'user',
                content: `Select a random Bible verse. Avoid these recently used references: ${recentRefs.join(', ')}. Return ONLY the reference ID in Bible API format.`
              }
            ],
            max_tokens: 50
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          verseReferenceId = aiData.choices[0].message.content.trim();
          console.log('AI selected verse reference:', verseReferenceId);
        }
      } catch (error) {
        console.log('AI verse selection error:', error);
      }
    }

    // Fallback if AI doesn't select a verse
    if (!verseReferenceId) {
      const fallbackRefs = [
        'JHN.3.16', 'ROM.8.28', 'PHP.4.13', 'PSA.23.1', 'PRO.3.5',
        'ISA.40.31', 'JER.29.11', 'MAT.5.16', 'MAT.6.33', 'JHN.14.6',
        'ROM.12.2', 'GAL.5.22', 'EPH.2.8', 'COL.3.23', 'HEB.11.1',
        'JAM.1.2', '1CO.13.4', '1PE.5.7', 'REV.21.4', 'PSA.46.1',
        'ISA.41.10', 'MAT.11.28', 'JHN.16.33', 'ROM.5.8', 'PHP.4.6'
      ];
      
      // Filter out recently used verses
      const availableRefs = fallbackRefs.filter(ref => !recentRefs.includes(ref));
      const refsToUse = availableRefs.length > 0 ? availableRefs : fallbackRefs;
      verseReferenceId = refsToUse[Math.floor(Math.random() * refsToUse.length)];
      console.log('Using fallback verse reference:', verseReferenceId);
    }

    // Get Bible verse from Bible API using AI-selected reference
    let verse, reference;
    const bibleApiKey = Deno.env.get('BIBLE_API_KEY');
    
    if (bibleApiKey) {
      try {
        const response = await fetch(`https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/verses/${verseReferenceId}`, {
          headers: {
            'api-key': bibleApiKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          verse = data.data.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
          reference = data.data.reference;
          console.log('Bible API returned verse:', reference);
        }
      } catch (error) {
        console.log('Bible API error:', error);
      }
    }

    // Fallback verses if API fails
    if (!verse) {
      const fallbackVerses = [
        { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16" },
        { text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6" },
        { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
        { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
        { text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.", reference: "Psalm 23:1-3" },
        { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
        { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31" },
        { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
        { text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", reference: "Matthew 5:16" },
        { text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33" },
        { text: "Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me.", reference: "John 14:6" },
        { text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", reference: "Romans 12:2" },
        { text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23" },
        { text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.", reference: "Ephesians 2:8" },
        { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", reference: "Colossians 3:23" },
        { text: "Now faith is confidence in what we hope for and assurance about what we do not see.", reference: "Hebrews 11:1" },
        { text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4" },
        { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
        { text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.", reference: "Revelation 21:4" },
        { text: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
        { text: "So do not fear, for I am with you; do not be dismayed, for I am your God.", reference: "Isaiah 41:10" },
        { text: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
        { text: "I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.", reference: "John 16:33" },
        { text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.", reference: "Romans 5:8" },
        { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" }
      ];
      
      // Filter out recently used verses
      const availableVerses = fallbackVerses.filter(v => !recentRefs.includes(v.reference));
      const versesToUse = availableVerses.length > 0 ? availableVerses : fallbackVerses;
      const randomVerse = versesToUse[Math.floor(Math.random() * versesToUse.length)];
      verse = randomVerse.text;
      reference = randomVerse.reference;
      console.log('Using fallback verse:', reference);
    }

    // Generate inspirational commentary using OpenAI
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