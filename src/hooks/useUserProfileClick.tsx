import { useState } from 'react';

interface UserProfile {
  user_id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  email?: string;
}

export const useUserProfileClick = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | undefined>(undefined);

  const openUserProfile = (userId: string, profile?: UserProfile) => {
    setSelectedUserId(userId);
    setSelectedProfile(profile);
    setIsPopupOpen(true);
  };

  const closeUserProfile = () => {
    setIsPopupOpen(false);
    setSelectedUserId(undefined);
    setSelectedProfile(undefined);
  };

  return {
    isPopupOpen,
    selectedUserId,
    selectedProfile,
    openUserProfile,
    closeUserProfile,
    setIsPopupOpen
  };
};