
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserSearch from '@/components/UserSearch';
import PopularityRanking from '@/components/PopularityRanking';
import GrowthTips from '@/components/GrowthTips';
import UserGoals from '@/components/UserGoals';
import EventsDiscovery from '@/components/EventsDiscovery';
import GoalsDiscovery from '@/components/GoalsDiscovery';
import Navbar from '@/components/Navbar';
import { TrendingUp, Target, Calendar, Users, Lightbulb, Trophy } from 'lucide-react';

const Explore = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explore & Grow</h1>
          <p className="text-muted-foreground">
            Discover events, connect with users, track your goals, and get personalized tips to grow your presence.
          </p>
        </div>
        
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Discover Goals
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-6">
            <GoalsDiscovery />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <EventsDiscovery />
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            <UserSearch />
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <PopularityRanking />
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GrowthTips />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">🚀</p>
                      <p className="font-semibold">Pro Tip</p>
                      <p className="text-sm text-muted-foreground">
                        Consistency is key! Regular posting and engagement significantly boost your popularity score.
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">🎯</p>
                      <p className="font-semibold">Goal Setting</p>
                      <p className="text-sm text-muted-foreground">
                        Users with active goals grow 3x faster than those without clear targets.
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">🤝</p>
                      <p className="font-semibold">Networking</p>
                      <p className="text-sm text-muted-foreground">
                        Attending local events can increase your follower growth by up to 50%.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explore;
