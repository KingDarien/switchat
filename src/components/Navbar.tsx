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
import { Home, User, LogOut, Heart, MessageCircle, Search } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="text-lg font-bold">
            SocialApp
          </Link>
          
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            
            <Link to="/profile">
              <Button
                variant={isActive('/profile') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <User className="h-4 w-4" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
            
            <Link to="/explore">
              <Button
                variant={isActive('/explore') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs">Explore</span>
              </Button>
            </Link>
            
            <Link to="/notifications">
              <Button
                variant={isActive('/notifications') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <Heart className="h-4 w-4" />
                <span className="text-xs">Notifications</span>
              </Button>
            </Link>
            
            <Link to="/messages">
              <Button
                variant={isActive('/messages') ? 'default' : 'ghost'}
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Messages</span>
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-auto py-2 px-3 flex flex-col items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">More</span>
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