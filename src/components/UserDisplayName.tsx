import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Award, Gem } from 'lucide-react';

interface UserDisplayNameProps {
  displayName: string;
  username: string;
  userId?: string;
  rank?: number | null;
  isVerified?: boolean;
  verificationTier?: string;
  className?: string;
  showRank?: boolean;
  showVerification?: boolean;
  clickable?: boolean;
  variant?: 'default' | 'compact' | 'vertical' | 'video';
  size?: 'sm' | 'md' | 'lg';
}

const UserDisplayName: React.FC<UserDisplayNameProps> = ({
  displayName,
  username,
  userId,
  rank,
  isVerified = false,
  verificationTier = 'none',
  className = '',
  showRank = true,
  showVerification = true,
  clickable = true,
  variant = 'default',
  size = 'md',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable && userId) {
      navigate(`/user/${userId}`);
    }
  };
  const getVerificationIcon = () => {
    if (!isVerified || !showVerification) return null;
    
    const sizes = getSizeClasses();
    
    switch (verificationTier) {
      case 'diamond':
        return <Gem className={`${sizes.icon} text-blue-400`} />;
      case 'gold':
        return <Crown className={`${sizes.icon} text-yellow-500`} />;
      case 'silver':
        return <Award className={`${sizes.icon} text-gray-400`} />;
      case 'bronze':
        return <Star className={`${sizes.icon} text-orange-500`} />;
      default:
        return null;
    }
  };

  const getVerificationColor = () => {
    switch (verificationTier) {
      case 'diamond': return 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'gold': return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'silver': return 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'bronze': return 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      default: return 'border-primary bg-primary/5 text-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return {
        name: 'text-sm font-medium',
        username: 'text-xs',
        badge: 'px-1 py-0.5 text-xs',
        rank: 'text-xs px-1 py-0.5',
        icon: 'h-2.5 w-2.5'
      };
      case 'lg': return {
        name: 'text-lg font-semibold',
        username: 'text-base',
        badge: 'px-2 py-1 text-sm',
        rank: 'text-sm px-2 py-1',
        icon: 'h-4 w-4'
      };
      default: return {
        name: 'font-semibold',
        username: 'text-sm',
        badge: 'px-1.5 py-0.5 text-xs',
        rank: 'text-xs px-1.5 py-0.5',
        icon: 'h-3 w-3'
      };
    }
  };

  const getLayoutClasses = () => {
    const sizes = getSizeClasses();
    
    switch (variant) {
      case 'compact':
        return (
          <div className="flex items-center gap-1.5">
            <span className={`${sizes.name} text-foreground`}>{displayName}</span>
            {getVerificationIcon() && (
              <div className={`inline-flex items-center rounded-full border font-medium ${sizes.badge} ${getVerificationColor()}`}>
                {getVerificationIcon()}
              </div>
            )}
            {getRankDisplay()}
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={`${sizes.name} text-white`}>{displayName}</span>
                {getVerificationIcon() && (
                  <div className={`inline-flex items-center rounded-full border font-medium ${sizes.badge} bg-white/20 border-white/30 text-white`}>
                    {getVerificationIcon()}
                  </div>
                )}
              </div>
              <span className={`${sizes.username} text-white/80`}>@{username}</span>
            </div>
            {getRankDisplay()}
          </div>
        );
      
      case 'vertical':
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`${sizes.name} text-foreground`}>{displayName}</span>
              {getVerificationIcon() && (
                <div className={`inline-flex items-center rounded-full border font-medium ${sizes.badge} ${getVerificationColor()}`}>
                  {getVerificationIcon()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`${sizes.username} text-muted-foreground`}>@{username}</span>
              {getRankDisplay()}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`${sizes.name} text-foreground`}>{displayName}</span>
              {getVerificationIcon() && (
                <div className={`inline-flex items-center rounded-full border font-medium ${sizes.badge} ${getVerificationColor()}`}>
                  {getVerificationIcon()}
                </div>
              )}
              {getRankDisplay()}
            </div>
            <span className={`${sizes.username} text-muted-foreground`}>@{username}</span>
          </div>
        );
    }
  };

  const getRankDisplay = () => {
    if (!rank || !showRank) return null;
    
    const sizes = getSizeClasses();
    
    return (
      <Badge 
        variant="outline" 
        className={`${sizes.rank} border-primary/30 bg-primary/5 text-primary font-medium`}
      >
        #{rank}
      </Badge>
    );
  };

  return (
    <div 
      className={`${clickable && userId ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={handleClick}
    >
      {getLayoutClasses()}
    </div>
  );
};

export default UserDisplayName;