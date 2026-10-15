-- 0004 — مرونة الواجهة: لون العلامة وعبارة الفوتر من اللوحة
-- (مطبَّقة فعلاً على قاعدة الإنتاج بتاريخ 2026-10-14؛ هذا الملف لتوثيق السجل)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS footer_note text;
