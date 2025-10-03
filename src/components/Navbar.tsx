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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50 shadow-xl">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center justify-around w-full max-w-2xl mx-auto gap-2">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 transition-all hover:scale-110 hover:shadow-md rounded-2xl"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs font-semibold">Home</span>
              </Button>
            </Link>
            
            <Link to={`/profile/${user?.id}`}>
              <Button
                variant={isActive(`/profile/${user?.id}`) ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 transition-all hover:scale-110 hover:shadow-md rounded-2xl"
              >
                <User className="h-5 w-5" />
                <span className="text-xs font-semibold">Profile</span>
              </Button>
            </Link>
            
            <Link to="/explore">
              <Button
                variant={isActive('/explore') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 transition-all hover:scale-110 hover:shadow-md rounded-2xl"
              >
                <Search className="h-5 w-5" />
                <span className="text-xs font-semibold">Explore</span>
              </Button>
            </Link>
            
            <Link to="/notifications">
              <Button
                variant={isActive('/notifications') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 transition-all hover:scale-110 hover:shadow-md rounded-2xl"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs font-semibold">Activity</span>
              </Button>
            </Link>
            
            <Link to={isAdmin ? "/messages" : "/conversations"}>
              <Button
                variant={isActive(isAdmin ? '/messages' : '/conversations') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 transition-all hover:scale-110 hover:shadow-md rounded-2xl"
              >
                {isAdmin ? <Shield className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                <span className="text-xs font-semibold">{isAdmin ? 'Admin' : 'Chat'}</span>
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-auto py-2 px-4 flex flex-col items-center gap-1.5 transition-all hover:scale-110 hover:shadow-md rounded-2xl">
                  <Avatar className="h-5 w-5 ring-2 ring-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-3 z-[100] glass-effect border-border/50 rounded-2xl shadow-2xl" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Signed in as {user.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${user?.id}`} className="w-full cursor-pointer">
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="w-full cursor-pointer">
                    Settings
                  </Link>
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