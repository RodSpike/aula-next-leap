

## Plan: Allow Admins to Add New Sections to Teacher Guides

### What will change

Admins will see an "Adicionar Seção" button at the bottom of the screen share content area in `TeacherLessonView.tsx`. Clicking it opens an inline form where they can:

1. **Choose section type**: Lição, Revisão, Vocabulário, Exercício, Diálogo, Conteúdo Adicional
2. **Add a title** for the section
3. **Add content text** (textarea)
4. **Upload an image** (optional)
5. **Toggle "Respostas do Aluno"** checkbox -- if checked, the section type is set to `exercise`, which already renders the student answer textarea
6. **Teacher notes** field is always included automatically (a textarea for the admin to write teacher-only notes)

On save, the new section object is appended to the `screen_share_content` JSON array in the `teacher_guides` table. The existing rendering logic already handles all these fields (`content`, `image_url`, `teacher_notes`, exercise answer fields for `type === 'exercise'`).

Additionally, admins will get a **delete section** button (with confirmation) and a **reorder** capability (move up/down) on each existing section.

### Technical details

**File**: `src/pages/TeacherLessonView.tsx`

1. **New state variables**:
   - `addingSection` (boolean)
   - `newSection` object: `{ title, content, type, teacher_notes, include_student_answers, image_file }`

2. **"Adicionar Seção" button**: Rendered after the last section card, visible only when `canEdit` is true. Opens the inline form.

3. **Save handler** (`addNewSection`):
   - If image file provided, upload to `teacher-guide-images` bucket
   - Build section object: `{ type, title, content, teacher_notes, image_url? }`
   - If `include_student_answers` is checked, set `type = 'exercise'`
   - Append to `screen_share_content` array
   - Update `teacher_guides` table
   - Invalidate query

4. **Delete section** (`deleteSection`):
   - Remove section from array by index
   - Update `teacher_guides` table
   - Uses AlertDialog for confirmation

5. **Move section up/down** (`moveSectionUp`, `moveSectionDown`):
   - Swap array elements
   - Update `teacher_guides` table

### No database changes needed
The `screen_share_content` column is already a JSONB array -- we just append new objects to it.

