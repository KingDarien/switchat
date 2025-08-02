import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();
    
    // Extract location information
    const locationName = location.type === 'city' ? location.name : location.name;
    const locationDisplay = location.type === 'city' 
      ? `${location.name}, ${location.state}` 
      : location.name;
    
    // For now, return enhanced mock data based on specific location
    // In production, you would integrate with NewsAPI, Google News API, or local news sources
    const mockArticles = [
      {
        title: `${locationName} Infrastructure Project Approved`,
        description: `Major infrastructure improvements approved for ${locationDisplay}, including road upgrades and public transportation enhancements.`,
        url: 'https://example.com/news/infrastructure',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date().toISOString(),
        source: { name: `${locationName} Tribune` },
        location: locationDisplay
      },
      {
        title: `New Business District Opening in ${locationName}`,
        description: `Economic development brings new opportunities with the opening of a modern business district in ${locationDisplay} featuring retail and office spaces.`,
        url: 'https://example.com/news/business',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Business Weekly' },
        location: locationDisplay
      },
      {
        title: `${locationName} Education Initiative Launches`,
        description: `New educational programs and technology upgrades announced for schools in ${locationDisplay}.`,
        url: 'https://example.com/news/education',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Education Today' },
        location: locationDisplay
      },
      {
        title: `Community Event: ${locationName} Festival This Weekend`,
        description: `Join the ${locationDisplay} community for a celebration featuring local food, music, and activities for the whole family.`,
        url: 'https://example.com/news/events',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Community Calendar' },
        location: locationDisplay
      },
      {
        title: `${locationName} ${location.type === 'state' ? 'State' : 'Local'} Government Updates`,
        description: `Latest updates from ${locationDisplay} government including new policies and community initiatives.`,
        url: 'https://example.com/news/government',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: { name: `${locationName} Gazette` },
        location: locationDisplay
      }
    ];

    return new Response(
      JSON.stringify({ articles: mockArticles }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch news' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});