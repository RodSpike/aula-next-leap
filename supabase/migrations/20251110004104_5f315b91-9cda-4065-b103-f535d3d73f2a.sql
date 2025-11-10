-- Create storage bucket for group post attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-post-attachments',
  'group-post-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4', 'video/quicktime']
);

-- RLS Policy: Anyone in the group can view attachments
CREATE POLICY "Group members can view post attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'group-post-attachments' AND
  EXISTS (
    SELECT 1 FROM group_posts gp
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE gp.id::text = (storage.foldername(name))[1]
    AND gm.user_id = auth.uid()
    AND gm.status = 'accepted'
  )
);

-- RLS Policy: Group members can upload attachments to their posts
CREATE POLICY "Group members can upload post attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-post-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- RLS Policy: Post authors can delete their attachments
CREATE POLICY "Post authors can delete their attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-post-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- RLS Policy: Admins can manage all attachments
CREATE POLICY "Admins can manage all post attachments"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'group-post-attachments' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);