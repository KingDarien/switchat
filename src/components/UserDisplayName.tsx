import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Award, Gem } from 'lucide-react';

interface UserDisplayNameProps {
  displayName: string;
  username: string;
  rank?: number | null;
  isVerified?: boolean;
  verificationTier?: string;
  className?: string;
  showRank?: boolean;
  showVerification?: boolean;
}

const UserDisplayName: React.FC<UserDisplayNameProps> = ({
  displayName,
  username,
  rank,
  isVerified = false,
  verificationTier = 'none',
  className = '',
  showRank = true,
  showVerification = true,
}) => {
  const getVerificationIcon = () => {
    if (!isVerified || !showVerification) return null;
    
    switch (verificationTier) {
      case 'diamond':
        return <Gem className="h-3 w-3 text-blue-400" />;
      case 'gold':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'silver':
        return <Award className="h-3 w-3 text-gray-400" />;
      case 'bronze':
        return <Star className="h-3 w-3 text-orange-500" />;
      default:
        return null;
    }
  };

  const getVerificationColor = () => {
    switch (verificationTier) {
      case 'diamond': return 'border-blue-400 bg-blue-50 text-blue-700';
      case 'gold': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'silver': return 'border-gray-400 bg-gray-50 text-gray-700';
      case 'bronze': return 'border-orange-500 bg-orange-50 text-orange-700';
      default: return 'border-primary bg-primary/5 text-primary';
    }
  };

  const getRankDisplay = () => {
    if (!rank || !showRank) return null;
    
    return (
      <Badge 
        variant="outline" 
        className="text-xs px-1.5 py-0.5 border-primary/30 bg-primary/5 text-primary font-medium"
      >
        #{rank}
      </Badge>
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">{displayName}</span>
          {getVerificationIcon() && (
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-xs font-medium ${getVerificationColor()}`}>
              {getVerificationIcon()}
            </div>
          )}
          {getRankDisplay()}
        </div>
        <span className="text-sm text-muted-foreground">@{username}</span>
      </div>
    </div>
  );
};

export default UserDisplayName;