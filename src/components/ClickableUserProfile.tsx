import React from 'react';

interface UserProfile {
  user_id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  email?: string;
}

interface ClickableUserProfileProps {
  userId: string;
  profile?: UserProfile;
  children: React.ReactNode;
  onClick: (userId: string, profile?: UserProfile) => void;
  className?: string;
}

export const ClickableUserProfile: React.FC<ClickableUserProfileProps> = ({
  userId,
  profile,
  children,
  onClick,
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(userId, profile);
  };

  return (
    <div 
      className={`cursor-pointer hover:opacity-75 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};