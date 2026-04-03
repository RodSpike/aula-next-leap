

## Plan: AI-Generated Flashcards and Illustrative Images for Lessons and Teacher Guides

### Overview
Add flashcards and AI-generated images to the teacher guide generation flow. The AI will produce flashcard data and image descriptions as part of the guide JSON. Images will be generated via the Lovable AI Gateway's image generation model and stored in Supabase Storage. Flashcards will be interactive in the lesson view and included in PDF exports.

### Architecture

```text
generate-teacher-guide (Edge Function)
  ├── Step 1: Call text AI → JSON with flashcards[] + image_prompts[]
  ├── Step 2: For each image_prompt, call Lovable AI image generation
  ├── Step 3: Upload images to Supabase Storage (new bucket)
  ├── Step 4: Replace image prompts with public URLs in JSON
  └── Step 5: Upsert guide with flashcards + images into teacher_guides
```

### Changes

**1. Database Migration**
- Add `flashcards` (JSONB) column to `teacher_guides` table
- Create a `teacher-guide-images` storage bucket (public)

Flashcard structure:
```json
[
  {
    "front": "What does 'resilient' mean?",
    "back": "Able to recover quickly from difficulties",
    "image_url": "https://...",
    "category": "vocabulary"
  }
]
```

**2. Update Edge Function (`generate-teacher-guide/index.ts`)**
- Expand the AI prompt to include `flashcards` (5-8 per lesson) and `image_suggestions` in the JSON output
- Each `image_suggestion` has: `description` (prompt for image gen), `style` ("illustration" or "realistic"), `placement` (which section it belongs to)
- After getting the text JSON, loop through `image_suggestions` and call the Lovable AI image generation endpoint (`google/gemini-2.5-flash-image`)
- Upload each generated image to `teacher-guide-images` bucket
- Replace descriptions with public URLs in the final data
- Save `flashcards` and updated `screen_share_content` (with `image_url` fields) to DB

**3. Update `TeacherLessonView.tsx`**
- Render images inline within `screen_share_content` sections when `image_url` is present
- Add a new **Flashcards** section after the screen share content:
  - Card flip interaction (click to reveal answer)
  - Show image on front if available
  - Include in PDF export as a table (front | back)
- Images appear in PDF export as `<img>` tags

**4. Update `BulkTeacherGuideGenerator.tsx`**
- No structural changes needed; bulk generation will automatically include flashcards and images since the edge function handles everything

### Key Considerations
- Image generation adds ~3-5 seconds per image; limit to 3-5 images per guide to keep generation under 30 seconds total
- Use `google/gemini-2.5-flash-image` for speed; fall back gracefully if image generation fails (guide still saves without images)
- Flashcards work without images too; images are an enhancement
- PDF export will inline the images using their public URLs

### Files to Create/Edit
- `supabase/migrations/` — new migration for `flashcards` column + storage bucket
- `supabase/functions/generate-teacher-guide/index.ts` — add flashcards to prompt, add image generation loop
- `src/pages/TeacherLessonView.tsx` — render flashcards section + inline images
- `src/integrations/supabase/types.ts` — auto-updated after migration

