import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
  location?: string;
}

interface NewsCardProps {
  article: NewsArticle;
  locationType: 'local' | 'city' | 'state';
}

const NewsCard = ({ article, locationType }: NewsCardProps) => {
  const getLocationColor = () => {
    switch (locationType) {
      case 'local': return 'news-local';
      case 'city': return 'news-city';
      case 'state': return 'news-state';
      default: return 'primary';
    }
  };

  const getLocationLabel = () => {
    switch (locationType) {
      case 'local': return 'Local';
      case 'city': return 'City';
      case 'state': return 'State';
      default: return 'News';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  return (
    <Card className="hover-scale transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className={`bg-${getLocationColor()}/10 text-${getLocationColor()} border-${getLocationColor()}/20`}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {getLocationLabel()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {article.source.name}
            </Badge>
          </div>
        </div>
        <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
          {article.title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        {article.urlToImage && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={article.urlToImage} 
              alt={article.title}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeAgo}</span>
            {article.location && (
              <>
                <span>•</span>
                <span>{article.location}</span>
              </>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(article.url, '_blank')}
            className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Read More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;