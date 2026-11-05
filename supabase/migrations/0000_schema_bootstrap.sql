-- 0000 — Bootstrap: المخطط الكامل كما استُعيد على المشروع الجديد icbfpfrzvdfmgunzlduu
-- مُولَّد من الكتالوج الحقيقي للمشروع السابق qclqyqjxsnnhlnlhjybo (2026-11-05).
-- ملاحظة: دلاء التخزين (pdfs, covers) وسياساتها تُنشأ عبر Storage API وليست هنا.
CREATE TABLE IF NOT EXISTS public."admins" (
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."articles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text,
  "excerpt" text,
  "content" text,
  "category" text NOT NULL,
  "author" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "author_image" text,
  "image_1" text,
  "image_2" text,
  "image_3" text,
  "visible" boolean DEFAULT true NOT NULL,
  "views" integer DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "font_family" text
);

CREATE TABLE IF NOT EXISTS public."editors" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "surname" text,
  "image_url" text,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."issues" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "issue_number" integer NOT NULL,
  "title" text,
  "publication_date" text NOT NULL,
  "pdf_url" text,
  "cover_image" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public."sections" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public."settings" (
  "id" boolean DEFAULT true NOT NULL,
  "site_name" text,
  "hero_title" text,
  "hero_subtitle" text,
  "hero_description" text,
  "hero_cover_url" text,
  "about_title" text,
  "about_text" text,
  "about_text_2" text,
  "contact_email" text,
  "current_issue_id" uuid,
  "accent_color" text,
  "footer_note" text
);

CREATE TABLE IF NOT EXISTS public."team" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "role" text,
  "bio" text,
  "image_url" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."admins" ADD CONSTRAINT "admins_pkey" PRIMARY KEY (user_id);

ALTER TABLE public."articles" ADD CONSTRAINT "articles_pkey" PRIMARY KEY (id);

ALTER TABLE public."editors" ADD CONSTRAINT "editors_pkey" PRIMARY KEY (id);

ALTER TABLE public."issues" ADD CONSTRAINT "issues_pkey" PRIMARY KEY (id);

ALTER TABLE public."sections" ADD CONSTRAINT "sections_pkey" PRIMARY KEY (id);

ALTER TABLE public."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY (id);

ALTER TABLE public."team" ADD CONSTRAINT "team_pkey" PRIMARY KEY (id);

ALTER TABLE public."admins" ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."settings" ADD CONSTRAINT "settings_current_issue_id_fkey" FOREIGN KEY (current_issue_id) REFERENCES issues(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX articles_slug_unique ON public.articles USING btree (slug) WHERE (slug IS NOT NULL);

ALTER TABLE public."admins" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."articles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."editors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."sections" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."team" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."issues" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own record" ON public."admins" AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "admins can read own admin record" ON public."admins" AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));

CREATE POLICY "admins can manage articles" ON public."articles" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read visible articles" ON public."articles" AS PERMISSIVE FOR SELECT TO anon,authenticated USING ((visible = true));

CREATE POLICY "admins can manage editors" ON public."editors" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read editors" ON public."editors" AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);

CREATE POLICY "admins can manage sections" ON public."sections" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read sections" ON public."sections" AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);

CREATE POLICY "admins can manage team" ON public."team" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read team" ON public."team" AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);

CREATE POLICY "admins can manage settings" ON public."settings" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read settings" ON public."settings" AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);

CREATE POLICY "admins can manage issues" ON public."issues" AS PERMISSIVE FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "public can read issues" ON public."issues" AS PERMISSIVE FOR SELECT TO anon,authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

  select exists (

    select 1

    from public.admins

    where user_id = auth.uid()

  );

$function$;

CREATE OR REPLACE FUNCTION public.increment_views(article_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.articles
  SET views = views + 1
  WHERE id = article_id;
$function$;

GRANT SELECT, UPDATE, DELETE, INSERT, TRUNCATE, REFERENCES, TRIGGER ON public."admins" TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."admins" TO authenticated;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."admins" TO service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."articles" TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."articles" TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public."articles" TO service_role;

GRANT SELECT, UPDATE, DELETE, INSERT, TRUNCATE, REFERENCES, TRIGGER ON public."editors" TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."editors" TO authenticated;

GRANT DELETE, INSERT, SELECT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public."editors" TO service_role;

GRANT INSERT, TRIGGER, REFERENCES, TRUNCATE, DELETE, UPDATE, SELECT ON public."issues" TO anon;

GRANT INSERT, TRIGGER, REFERENCES, TRUNCATE, DELETE, UPDATE, SELECT ON public."issues" TO authenticated;

GRANT TRIGGER, INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public."issues" TO service_role;

GRANT TRIGGER, INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public."sections" TO anon;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."sections" TO authenticated;

GRANT TRIGGER, REFERENCES, TRUNCATE, INSERT, DELETE, UPDATE, SELECT ON public."sections" TO service_role;

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."settings" TO anon;

GRANT DELETE, INSERT, SELECT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public."settings" TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."settings" TO service_role;

GRANT SELECT, INSERT, TRIGGER, REFERENCES, TRUNCATE, DELETE, UPDATE ON public."team" TO anon;

GRANT INSERT, TRIGGER, REFERENCES, TRUNCATE, DELETE, UPDATE, SELECT ON public."team" TO authenticated;

GRANT SELECT, TRIGGER, REFERENCES, TRUNCATE, DELETE, UPDATE, INSERT ON public."team" TO service_role;

GRANT EXECUTE ON FUNCTION public.increment_views(article_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

GRANT EXECUTE ON FUNCTION public.increment_views(article_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
