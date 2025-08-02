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
    
    // Get NewsAPI key from environment
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!newsApiKey) {
      console.error('NEWS_API_KEY not found in environment');
      // Fallback to mock data if no API key
      return getMockNews(location, locationName, locationDisplay);
    }

    // Build search query based on location type
    let searchQuery = '';
    if (location.type === 'city') {
      searchQuery = `"${location.name}" AND "${location.state}"`;
    } else {
      searchQuery = `"${location.name}" AND news`;
    }

    // Call NewsAPI
    const newsApiUrl = new URL('https://newsapi.org/v2/everything');
    newsApiUrl.searchParams.append('q', searchQuery);
    newsApiUrl.searchParams.append('language', 'en');
    newsApiUrl.searchParams.append('sortBy', 'publishedAt');
    newsApiUrl.searchParams.append('pageSize', '10');
    newsApiUrl.searchParams.append('from', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const response = await fetch(newsApiUrl.toString(), {
      headers: {
        'X-API-Key': newsApiKey,
      },
    });

    if (!response.ok) {
      console.error('NewsAPI request failed:', response.status, response.statusText);
      return getMockNews(location, locationName, locationDisplay);
    }

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log('No articles found, returning mock data');
      return getMockNews(location, locationName, locationDisplay);
    }

    // Process and format articles
    const processedArticles = data.articles.slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description || `Latest news from ${locationDisplay}`,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: { name: article.source.name },
      location: locationDisplay
    }));

    return new Response(
      JSON.stringify({ articles: processedArticles }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Fallback to mock data on error
    const locationName = 'Unknown';
    const locationDisplay = 'Unknown Location';
    try {
      const { location } = await req.json();
      return getMockNews(location, location.name, location.type === 'city' ? `${location.name}, ${location.state}` : location.name);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch news' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }
  }
});

// Mock news fallback function
function getMockNews(location: any, locationName: string, locationDisplay: string) {
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
}