import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SITE = 'https://contrecinema.com';
const DEFAULT_IMG = `${SITE}/logo.png`; // غيّره لصورة احتياطية موجودة عندك
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const abs = u => !u ? DEFAULT_IMG : u.startsWith('http') ? u : `${SITE}/${u.replace(/^\//,'')}`;

const { data, error } = await sb.from('articles')
  .select('id,title,excerpt,image_1,visible')
  .eq('visible', true);
if (error) throw error;

for (const a of data) {
  const dir = `share/${a.id}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/index.html`, `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>${esc(a.title)}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="ضد السينما">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${esc(a.excerpt)}">
<meta property="og:image" content="${esc(abs(a.image_1))}">
<meta property="og:url" content="${SITE}/share/${a.id}/">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace("${SITE}/#article-${a.id}")</script>
</head><body></body></html>`);
}
