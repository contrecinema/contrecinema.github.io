-- 0003 — خط المقال: عمود font_family + قيمة مرجعية للمقالات القديمة
-- (مطبَّقة فعلاً على قاعدة الإنتاج بتاريخ 2026-10-14؛ هذا الملف لتوثيق السجل)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS font_family text;

-- قيمة افتراضية مرجعية للمقالات القديمة
UPDATE public.articles
SET font_family = 'IBM Plex Sans Arabic'
WHERE font_family IS NULL OR font_family = '';
