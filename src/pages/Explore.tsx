import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserSearch from '@/components/UserSearch';

const Explore = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Explore</h1>
      
      <UserSearch />
      
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Trending topics feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Explore;