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
    
    // For now, return enhanced mock data
    // In production, you would integrate with NewsAPI, Google News API, or local news sources
    const mockArticles = [
      {
        title: `${location === 'local' ? 'Local' : location === 'city' ? 'City' : 'State'} Infrastructure Project Approved`,
        description: `Major infrastructure improvements approved for the ${location} area, including road upgrades and public transportation enhancements.`,
        url: 'https://example.com/news/infrastructure',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date().toISOString(),
        source: { name: `${location.charAt(0).toUpperCase() + location.slice(1)} Tribune` },
        location: location === 'local' ? 'Downtown District' : location === 'city' ? 'Metropolitan Area' : 'State Capitol'
      },
      {
        title: `New Business District Opening in ${location === 'state' ? 'State' : location === 'city' ? 'City' : 'Local Area'}`,
        description: `Economic development brings new opportunities with the opening of a modern business district featuring retail and office spaces.`,
        url: 'https://example.com/news/business',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Business Weekly' },
        location: location === 'local' ? 'Main Street' : location === 'city' ? 'Commercial District' : 'Economic Zone'
      },
      {
        title: `${location === 'state' ? 'Statewide' : 'Local'} Education Initiative Launches`,
        description: `New educational programs and technology upgrades announced for schools across the ${location} region.`,
        url: 'https://example.com/news/education',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Education Today' },
        location: location === 'local' ? 'School District' : location === 'city' ? 'Metro Schools' : 'State Education Dept'
      },
      {
        title: `Community Event: ${location === 'local' ? 'Neighborhood' : location === 'city' ? 'City-wide' : 'State'} Festival This Weekend`,
        description: `Join the community for a celebration featuring local food, music, and activities for the whole family.`,
        url: 'https://example.com/news/events',
        urlToImage: '/placeholder.svg',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: { name: 'Community Calendar' },
        location: location === 'local' ? 'Community Park' : location === 'city' ? 'Central Plaza' : 'State Fairgrounds'
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