import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Friend {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  verification_tier: string;
}

interface ClosestFriendsProps {
  userId: string;
  className?: string;
  maxVisible?: number;
}

const FriendAvatar = ({
  friend,
  index,
  totalFriends,
  isHovered,
  onHover,
  onLeave,
}: {
  friend: Friend;
  index: number;
  totalFriends: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="relative group flex items-center justify-center"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        marginLeft: index === 0 ? 0 : "-0.25rem",
        zIndex: totalFriends - index,
      }}
    >
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
              },
            }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute -top-12 whitespace-nowrap flex text-xs flex-col items-center justify-center rounded-lg bg-card z-50 shadow-lg px-3 py-2 border min-w-max"
          >
            <div className="font-medium text-foreground text-sm text-center">
              {friend.display_name || friend.username}
            </div>
            <div className="text-muted-foreground text-xs text-center">
              @{friend.username}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05, zIndex: 100 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage src={friend.avatar_url} />
          <AvatarFallback className="text-xs">
            {getInitials(friend.display_name || friend.username)}
          </AvatarFallback>
        </Avatar>
      </motion.div>
    </div>
  );
};

const ClosestFriends = ({
  userId,
  className,
  maxVisible = 6,
}: ClosestFriendsProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClosestFriends();
  }, [userId]);

  const fetchClosestFriends = async () => {
    try {
      // Get the user's following list and then fetch their profiles
      const { data: followingData, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .limit(maxVisible);

      if (error) throw error;

      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, verification_tier')
          .in('user_id', followingIds)
          .limit(maxVisible);

        if (profilesError) throw profilesError;

        setFriends(profilesData || []);
      }
    } catch (error) {
      console.error('Error fetching closest friends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || friends.length === 0) {
    return null;
  }

  const visibleFriends = friends.slice(0, maxVisible);
  const remainingCount = friends.length - maxVisible;

  return (
    <div className={cn("flex flex-col items-center mt-2", className)}>
      <p className="text-xs text-muted-foreground mb-1">Top Circle</p>
      <div className="flex items-center justify-center">
        {visibleFriends.map((friend, index) => (
          <FriendAvatar
            key={friend.user_id}
            friend={friend}
            index={index}
            totalFriends={visibleFriends.length}
            isHovered={hoveredIndex === friend.user_id}
            onHover={() => setHoveredIndex(friend.user_id)}
            onLeave={() => setHoveredIndex(null)}
          />
        ))}

        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center rounded-full border border-border bg-muted text-muted-foreground font-medium h-8 w-8 text-xs ml-[-0.25rem]"
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClosestFriends;