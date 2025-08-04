import React from 'react';
import { Crown, Star, Award, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  isVerified: boolean;
  tier: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  tier,
  className = '',
  size = 'md',
}) => {
  if (!isVerified) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return { icon: 'h-2.5 w-2.5', badge: 'px-1 py-0.5 text-xs' };
      case 'lg': return { icon: 'h-4 w-4', badge: 'px-2 py-1 text-sm' };
      default: return { icon: 'h-3 w-3', badge: 'px-1.5 py-0.5 text-xs' };
    }
  };

  const getIcon = () => {
    const sizes = getSizeClasses();
    switch (tier) {
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

  const getColors = () => {
    switch (tier) {
      case 'diamond': return 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'gold': return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'silver': return 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'bronze': return 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      default: return 'border-primary bg-primary/5 text-primary';
    }
  };

  const sizes = getSizeClasses();

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border font-medium',
      sizes.badge,
      getColors(),
      className
    )}>
      {getIcon()}
    </div>
  );
};

export default VerificationBadge;