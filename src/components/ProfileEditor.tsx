import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileEditorProps {
  initialProfile: any;
  onProfileUpdate: (profile: any) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ 
  initialProfile, 
  onProfileUpdate 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(initialProfile?.display_name || '');
    setAvatarUrl(initialProfile?.avatar_url || '');
  }, [initialProfile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('community-files')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('community-files')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      toast({
        title: "Avatar uploaded",
        description: "Your avatar has been uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        onProfileUpdate(data);
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarFallback = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    if (initialProfile?.username) {
      return initialProfile.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={avatarUrl} alt="Profile avatar" />
              <AvatarFallback className="text-2xl">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors" onClick={handleAvatarClick}>
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Click on your avatar to change your profile picture
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Display Name Section */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name (Nickname)</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            This is the name that will be shown to other users when you post in communities
          </p>
        </div>

        {/* Email Display */}
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="p-2 bg-muted rounded-md text-sm text-muted-foreground">
            {user?.email}
          </div>
        </div>

        {/* Cambridge Level Display */}
        {initialProfile?.cambridge_level && (
          <div className="space-y-2">
            <Label>Cambridge Level</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {initialProfile.cambridge_level}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isUploading}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};