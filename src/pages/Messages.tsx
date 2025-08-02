import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Messages feature coming soon</p>
            <p className="text-sm text-muted-foreground mt-2">
              Direct messaging functionality will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;