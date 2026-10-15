-- 0002 — إغلاق ثغرة: جدول admins كان مقروءاً لكل زائر (كشف user_ids)
-- (مطبَّقة فعلاً على قاعدة الإنتاج بتاريخ 2026-10-14؛ هذا الملف لتوثيق السجل)
DROP POLICY IF EXISTS "allow_read_admins" ON public.admins;
