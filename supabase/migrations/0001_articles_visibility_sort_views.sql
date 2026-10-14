-- 0001 — أساس إدارة المقالات
-- 1) أعمدة جديدة: الإخفاء، الترتيب، عدد القراءات
-- 2) Backfill آمن (لا articles تختفي)
-- 3) قصر القراءة العامة على المقالات المرئية فقط
-- 4) RPC آمن لعدّ القراءات (يمنع تلاعب العموم)

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill: الترتيب الافتراضي = الأحدث أولاً (newest first)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS rn
  FROM public.articles
)
UPDATE public.articles a
SET sort_order = r.rn
FROM ranked r
WHERE a.id = r.id;

-- slug فريد: حماية صفحات المشاركة من التعارض
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique
  ON public.articles (slug)
  WHERE slug IS NOT NULL;

-- القراءة العامة: المرئي فقط
DROP POLICY IF EXISTS "public can read articles" ON public.articles;
CREATE POLICY "public can read visible articles"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (visible = true);

-- عدّاد القراءات: RPC بصلاحية definer — لا تحديث مباشر للعموم
CREATE OR REPLACE FUNCTION public.increment_views(article_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.articles
  SET views = views + 1
  WHERE id = article_id;
$$;

REVOKE ALL ON FUNCTION public.increment_views(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_views(uuid) TO anon, authenticated;
