import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, User, LogOut, Heart, MessageCircle, Search, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(data?.user_role === 'admin' || data?.user_role === 'moderator');
    };
    
    checkAdminStatus();
  }, [user]);

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="w-full px-2 py-2">
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center justify-around w-full">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-1 px-1"
              >
                <Home className="h-3 w-3" />
                <span className="text-[10px]">Home</span>
              </Button>
            </Link>
            
            <Link to="/profile">
              <Button
                variant={isActive('/profile') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-1 px-1"
              >
                <User className="h-3 w-3" />
                <span className="text-[10px]">Profile</span>
              </Button>
            </Link>
            
            <Link to="/explore">
              <Button
                variant={isActive('/explore') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-1 px-1"
              >
                <Search className="h-3 w-3" />
                <span className="text-[10px]">Explore</span>
              </Button>
            </Link>
            
            <Link to="/notifications">
              <Button
                variant={isActive('/notifications') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-1 px-1"
              >
                <Heart className="h-3 w-3" />
                <span className="text-[10px]">Notifications</span>
              </Button>
            </Link>
            
            <Link to="/messages">
              <Button
                variant={isActive('/messages') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-1 px-1"
              >
                {isAdmin ? <Shield className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                <span className="text-[10px]">{isAdmin ? 'Admin' : 'Messages'}</span>
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-auto py-1 px-1 flex flex-col items-center gap-0.5">
                  <Avatar className="h-3 w-3">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-[8px]">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px]">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Signed in as {user.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;