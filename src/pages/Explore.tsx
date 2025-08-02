
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserSearch from '@/components/UserSearch';
import Navbar from '@/components/Navbar';

const Explore = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
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
    </div>
  );
};

export default Explore;
