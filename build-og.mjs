import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SITE = 'https://contrecinema.com';
const DEFAULT_IMG = `${SITE}/assets/logo.png`; // غيّره لمسار لوغو موجود فعلاً
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const esc = s => (s || '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const abs = u =>
  !u ? DEFAULT_IMG
  : u.startsWith('http') ? u
  : `${SITE}/${u.replace(/^\//, '')}`;

const { data, error } = await sb
  .from('articles')
  .select('id,title,excerpt,category,image_1,visible')
  .eq('visible', true);

if (error) throw error;

for (const a of data) {
  const dir = `share/${a.id}`;
  fs.mkdirSync(dir, { recursive: true });

  const target = `${SITE}/?a=${a.id}#article-${a.id}`;
  const desc = a.excerpt || a.category || 'ضد السينما !؟ — مجلة عربية مستقلة للنقد السينمائي';

  fs.writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ضد السينما">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(abs(a.image_1))}">
<meta property="og:url" content="${SITE}/share/${a.id}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(a.title)}">
<meta name="twitter:image" content="${esc(abs(a.image_1))}">
<link rel="canonical" href="${SITE}/share/${a.id}/">
<script>location.replace(${JSON.stringify(target)});</script>
<noscript><meta http-equiv="refresh" content="0;url=${SITE}/?a=${a.id}"></noscript>
</head>
<body><a href="${SITE}/?a=${a.id}">${esc(a.title)}</a></body>
</html>`);
}

console.log(`Generated ${data.length} share pages`);
