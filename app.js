const SUPABASE_URL = 'https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zTxQEl6b0KSv1fE9tG202g_Rt4X05YV';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================================================
   IMAGE ERROR HANDLING
========================================================= */
addEventListener('error', e => {
  const el = e.target;
  if (el && el.tagName === 'IMG' && !el.dataset.broken) {
    el.dataset.broken = '1';
    el.style.display = 'none';
  }
}, true);

/* =========================================================
   HELPERS
========================================================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  '"': '&quot;', "'": '&#039;'
}[m]));

function safeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      return u.href;
    }
  } catch (e) {}
  return '';
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0640]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* =========================================================
   SECTION CATEGORY MATCHING
========================================================= */
function categoryBelongsToSection(category, sectionName) {
  const cat = normalizeName(category);
  const section = normalizeName(sectionName);
  if (!cat || !section) return false;
  if (cat === section) return true;
  const aliases = {
    'الملف': ['الملف', 'ملف']
  };
  const names = aliases[section] || [section];
  return names.some(name =>
    cat === name ||
    (
      cat.startsWith(name) &&
      /^[\s\-–—:|،]/.test(cat.slice(name.length))
    )
  );
}

/* =========================================================
   THEME
========================================================= */
function applyTheme(theme) {
  document.documentElement.setAttribute(
    'data-theme',
    theme === 'dark' ? 'dark' : 'light'
  );
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('cc-theme', next);
  } catch (e) {}
  applyTheme(next);
}

function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem('cc-theme');
  } catch (e) {}
  applyTheme(
    stored ||
    (window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light')
  );
  const button = $('#themeToggle');
  if (button) button.onclick = toggleTheme;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && ['A', 'a'].includes(e.key)) {
      e.preventDefault();
      location.href = 'cc-control.html';
    }
  });
}

/* =========================================================
   MOBILE MENU
========================================================= */
if ($('#hamb')) {
  $('#hamb').onclick = () => {
    document.body.classList.toggle('nav-open');
  };
}
document.querySelectorAll('#nav a').forEach(a => {
  a.onclick = () => document.body.classList.remove('nav-open');
});

/* =========================================================
   FALLBACK DATA
========================================================= */
const fallbackIssues = Array.from({ length: 9 }, (_, i) => ({
  id: 'fallback-' + (i + 1),
  issue_number: i + 1,
  title: 'العدد ' + (i + 1),
  publication_date: '',
  pdf_url: '',
  cover_image: ''
}));

const fallbackSections = [
  'رؤى سينمائية',
  'مراجعات',
  'أفلام الشهر',
  'بروفايل',
  'مهرجانات',
  'حوار العدد',
  'الملف',
  'متابعات'
];

/* =========================================================
   DATABASE GET
========================================================= */
async function get(table, order = 'created_at', ascending = false) {
  try {
    let r = await db
      .from(table)
      .select('*')
      .order(order, { ascending });
    if (r.error) {
      console.error(`Supabase ${table}:`, r.error);
      r = await db.from(table).select('*');
      if (r.error) {
        console.error(`Supabase ${table} (no order):`, r.error);
        return [];
      }
    }
    return r.data || [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* =========================================================
   ISSUE COVER
========================================================= */
function cover(x) {
  const image = safeUrl(x.cover_image);
  if (image) {
    return `<img src="${esc(image)}" alt="غلاف العدد ${esc(x.issue_number)}" loading="lazy">`;
  }
  return `<span>العدد ${esc(x.issue_number)}</span>`;
}

/* =========================================================
   ISSUES
========================================================= */
function renderIssues(items) {
  const target = $('#issuesGrid');
  if (!target) return;
  const range = $('#issuesRange');
  if (range && items.length) {
    const nums = items
      .map(x => Number(x.issue_number))
      .filter(n => !Number.isNaN(n));
    if (nums.length) {
      range.textContent =
        'من العدد ' + Math.min(...nums) +
        ' إلى العدد ' + Math.max(...nums);
    }
  }
  target.innerHTML = items.map(x => {
    const year = (
      String(x.publication_date || '').match(/(?:19|20)\d{2}/) || []
    )[0];
    return `
      <article class="issue-card">
        <div class="issue-cover">${cover(x)}</div>
        <div class="issue-body">
          <strong>
            العدد ${esc(x.issue_number)}
            ${year ? `<span class="issue-year">(${esc(year)})</span>` : ''}
          </strong>
          <p>
            ${esc(x.title || 'ضد السينما !؟')}
            ${x.publication_date ? ' — ' + esc(x.publication_date) : ''}
          </p>
          <div class="issue-links">
            ${
              x.pdf_url
                ? `<a class="mini red" target="_blank" rel="noopener" href="${esc(x.pdf_url)}">تصفح PDF</a>`
                : `<span class="mini">PDF قريباً</span>`
            }
            <a class="mini" href="#articles">المقالات</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* =========================================================
   CURRENT ISSUE
========================================================= */
function renderCurrent(x) {
  const target = $('#currentIssue');
  if (!target) return;
  if (!x) {
    target.innerHTML = `
      <div class="empty">
        لم يتم اختيار عدد الشهر بعد.
        يمكنك تحديده من لوحة التحكم.
      </div>
    `;
    return;
  }
  const image = safeUrl(x.cover_image);
  target.innerHTML = `
    <div class="current-cover">
      ${
        image
          ? `<img src="${esc(image)}" alt="غلاف العدد" loading="lazy">`
          : `<div class="placeholder-cover">العدد ${esc(x.issue_number)}</div>`
      }
    </div>
    <div class="current-info">
      <div class="num">العدد ${esc(x.issue_number)}</div>
      <h3>${esc(x.title || 'ضد السينما !؟')}</h3>
      <p>
        ${x.publication_date
          ? esc(x.publication_date)
          : 'عدد جديد من المجلة المستقلة للنقد السينمائي.'}
      </p>
      <p>تصفح العدد، واقرأ ملفاتنا ومراجعاتنا وحواراتنا السينمائية.</p>
      ${
        x.pdf_url
          ? `<a class="btn primary" target="_blank" rel="noopener" href="${esc(x.pdf_url)}">تصفح وتحميل العدد PDF</a>`
          : ''
      }
    </div>
  `;
}

/* =========================================================
   SECTIONS
========================================================= */
function renderSections(items) {
  const target = $('#sectionsGrid');
  if (!target) return;
  const a = items.length
    ? items
    : fallbackSections.map((name, i) => ({
        name,
        description: 'قسم من أقسام المجلة',
        sort_order: i
      }));
  target.innerHTML = a.map(x => `
    <a class="section-card" href="section.html?slug=${encodeURIComponent(x.name)}">
      <b>${esc(x.name)}</b>
      <p>${esc(x.description || 'كتابات ومتابعات نقدية حول السينما.')}</p>
    </a>
  `).join('');
}

/* =========================================================
   ARTICLE CARD
========================================================= */
function viewsLabel(n, lang = 'ar') {
  const v = Number(n) || 0;
  if (lang === 'fr') {
    return v + (v > 1 ? ' lectures' : ' lecture');
  }
  if (lang === 'en') {
    return v + (v === 1 ? ' view' : ' views');
  }
  if (v === 1) return 'قراءة واحدة';
  if (v === 2) return 'قراءتان';
  if (v <= 10) return v + ' قراءات';
  return v + ' قراءة';
}

function articleCard(x) {
  const image = safeUrl(x.image_1);
  return `
    <article
      class="article-card"
      data-article-id="${esc(x.id)}"
      tabindex="0"
      role="button"
      aria-label="قراءة مقال ${esc(x.title)}"
    >
      ${
        image
          ? `<div class="article-card-image"><img src="${esc(image)}" alt="${esc(x.title)}" loading="lazy"></div>`
          : ''
      }
      <div class="article-card-content">
        <div class="cat">${esc(x.category || 'نقد سينمائي')}</div>
        <h3>${esc(x.title)}</h3>
        ${
          x.author
            ? `<small>
                 <a class="cc-card-author-link"
                    href="author.html?name=${encodeURIComponent(x.author)}"
                    data-author-link
                    data-author-name="1"
                    data-ar-name="${esc(x.author)}">${esc(x.author)}</a>
               </small>`
            : ''
        }
        <small class="views">${viewsLabel(x.views)}</small>
      </div>
    </article>
  `;
}

/* =========================================================
   ARTICLES GRID
========================================================= */
function renderArticles(items) {
  const target = $('#articlesGrid');
  if (!target) return;
  if (!items.length) {
    target.innerHTML = `
      <div class="empty">
        ستظهر المقالات هنا فور إضافتها من لوحة التحكم.
      </div>
    `;
    return;
  }
  window.__CC_ARTICLES__ = items;
  target.innerHTML = items.map(articleCard).join('');
  bindArticleClicks(target);
}

function bindArticleClicks(target) {
  target.querySelectorAll('[data-article-id]').forEach(card => {
    card.onclick = e => {
      if (e.target.closest('[data-author-link]')) return;
      openArticle(card.dataset.articleId);
    };
    card.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a')) return;
        e.preventDefault();
        openArticle(card.dataset.articleId);
      }
    };
  });
}

/* =========================================================
   TEAM
========================================================= */
function renderTeam(items) {
  const target = $('#teamGrid');
  if (!target) return;
  target.innerHTML = items.length
    ? items.map(x => `
        <article class="person">
          <div class="avatar">
            ${
              safeUrl(x.image_url)
                ? `<img src="${esc(x.image_url)}" alt="${esc(x.name)}" loading="lazy">`
                : esc((x.name || '?').slice(0, 1))
            }
          </div>
          <h3 data-author-name="1" data-ar-name="${esc(x.name)}">${esc(x.name)}</h3>
          <div class="role">${esc(x.role || '')}</div>
          <p>${esc(x.bio || '')}</p>
        </article>
      `).join('')
    : `<div class="empty">أضف أعضاء هيئة التحرير من لوحة التحكم.</div>`;
}

/* =========================================================
   EDITORS
========================================================= */
function renderEditors(items) {
  const target = $('#editorsGrid');
  if (!target) return;
  target.innerHTML = items.length
    ? items.map(x => {
        const fullName = [x.name, x.surname].filter(Boolean).join(' ');
        return `
          <article class="person">
            <div class="avatar">
              ${
                safeUrl(x.image_url)
                  ? `<img src="${esc(x.image_url)}" alt="${esc(fullName)}" loading="lazy">`
                  : esc((x.name || '?').slice(0, 1))
              }
            </div>
            <h3 data-author-name="1" data-ar-name="${esc(fullName)}">${esc(fullName)}</h3>
            ${x.bio ? `<p class="editor-bio">${esc(x.bio)}</p>` : ''}
          </article>
        `;
      }).join('')
    : `<div class="empty">أضف المحررين من لوحة التحكم.</div>`;
}

/* =========================================================
   ARTICLE READER
========================================================= */
function createArticleReader() {
  if (document.getElementById('ccArticleReader')) return;
  const reader = document.createElement('div');
  reader.id = 'ccArticleReader';
  reader.innerHTML = `
    <div class="cc-reader-backdrop" data-close-reader></div>
    <article class="cc-reader" role="dialog" aria-modal="true" aria-label="قراءة المقال">
      <button class="cc-reader-close" type="button" aria-label="إغلاق المقال" data-close-reader>×</button>
      <div class="cc-reader-inner" id="ccArticleContent"></div>
    </article>
  `;
  document.body.appendChild(reader);
  reader.querySelectorAll('[data-close-reader]').forEach(button => {
    button.onclick = closeArticle;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && reader.classList.contains('is-open')) {
      closeArticle();
    }
  });
  addArticleReaderStyles();
}

/* =========================================================
   ARTICLE READER STYLES
========================================================= */
function addArticleReaderStyles() {
  if (document.getElementById('ccArticleReaderStyles')) return;
  const style = document.createElement('style');
  style.id = 'ccArticleReaderStyles';
  style.textContent = `
    #ccArticleReader{position:fixed;inset:0;z-index:99999;display:none;overflow:auto}
    #ccArticleReader.is-open{display:block}
    .cc-reader-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}
    .cc-reader{position:relative;width:min(100%,980px);min-height:100vh;margin:0 auto;background:var(--reader-bg);box-shadow:0 20px 70px rgba(0,0,0,.25);direction:inherit}
    .cc-reader-close{position:sticky;top:14px;margin-inline-start:auto;margin-inline-end:14px;display:flex;align-items:center;justify-content:center;z-index:20;width:42px;height:42px;border:0;border-radius:50%;background:var(--reader-ink);color:var(--reader-bg);font-size:28px;line-height:1;cursor:pointer;box-shadow:0 5px 20px rgba(0,0,0,.25)}
    .cc-reader-inner{width:100%;padding:24px clamp(20px,7vw,70px) 100px}
    .cc-article-category{margin-bottom:14px;font-size:14px;font-weight:700;color:var(--red)}
    .cc-article-title{margin:0 0 20px;font-size:clamp(30px,5vw,56px);line-height:1.25;font-weight:800;color:var(--reader-ink)}
    .cc-author-link{color:var(--reader-accent);font-weight:700;text-decoration:none}
    .cc-author-link:hover{text-decoration:underline}
    .cc-card-author-link{color:inherit;text-decoration:none}
    .cc-card-author-link:hover{color:var(--red);text-decoration:underline}
    .cc-article-author{display:flex;align-items:center;gap:12px;margin-bottom:30px;font-size:16px;color:var(--reader-muted)}
    .cc-author-photo,.cc-author-placeholder{width:48px;height:48px;border-radius:50%;flex:none}
    .cc-author-photo{object-fit:cover}
    .cc-author-placeholder{display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--reader-muted);font-weight:700}
    .cc-article-hero{width:100%;margin:0 0 42px;overflow:hidden}
    .cc-article-hero img,.cc-article-image img{display:block;width:100%;height:auto;max-height:700px;object-fit:cover}
    .cc-article-body{font-size:clamp(18px,2vw,21px);line-height:2;color:var(--reader-ink)}
    .cc-article-body p{margin:0 auto 26px;max-inline-size:34em;text-align:justify;text-align-last:start;text-justify:inter-word;text-wrap:pretty}
    .cc-article-body .cc-h{display:block;margin:38px 0 14px;font-size:24px;font-weight:800;color:var(--reader-ink)}
    .cc-article-body .cc-quote{display:block;margin:24px 0;padding:14px 22px;border-inline-start:4px solid var(--red);background:var(--surface-2);font-size:.95em;color:var(--reader-muted)}
    .cc-article-image{width:100%;margin:44px 0}
    .cc-article-date{display:flex;justify-content:space-between;gap:12px;margin-top:35px;padding-top:20px;border-top:1px solid var(--reader-line);font-size:14px;color:var(--reader-muted)}
    .cc-no-content{padding:40px 0;color:var(--reader-muted)}
    .cc-share{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:30px;padding-top:26px;border-top:1px solid var(--reader-line)}
    .cc-share-label{font-size:13px;font-weight:700;letter-spacing:.3px;color:var(--reader-muted)}
    .cc-share-btns{display:flex;flex-wrap:wrap;gap:8px}
    .cc-share-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid var(--reader-line);background:var(--reader-bg);color:var(--reader-muted);font-family:inherit;font-size:13px;font-weight:600;line-height:1;cursor:pointer;transition:background .18s,border-color .18s,color .18s}
    .cc-share-btn svg{width:16px;height:16px;flex:none}
    .cc-share-btn:hover{border-color:var(--reader-ink);background:var(--reader-ink);color:var(--reader-bg)}
    .cc-share-btn.is-done{border-color:var(--red);background:var(--red);color:#fff}
    body.cc-reader-open{overflow:hidden}
    @media(max-width:700px){
      .cc-reader-inner{padding:18px 20px 60px}
      .cc-reader-close{top:10px;margin-inline-end:10px;width:40px;height:40px;font-size:26px}
      .cc-article-title{font-size:32px}
      .cc-article-body{font-size:18px;line-height:1.9}
      .cc-article-image{margin:34px 0}
      .cc-share{gap:10px}
      .cc-share-btn{padding:8px 11px;font-size:12px}
    }
  `;
  document.head.appendChild(style);
}

/* =========================================================
   ARTICLE CONTENT
========================================================= */
function articleParagraphs(content) {
  if (!content) return [];
  return String(content)
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

function formatArticleText(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => {
      let safe = esc(line);
      if (/^##[ \t]+/.test(line)) {
        safe = safe.replace(
          /^##[ \t]+(.*)$/,
          '<span class="cc-h">$1</span>'
        );
      }
      if (/^>[ \t]?/.test(line) && line.trim()) {
        safe = safe.replace(
          /^&gt;[ \t]?(.*)$/,
          '<span class="cc-quote">$1</span>'
        );
      }
      return safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    })
    .join(' ');
}

function articleImage(url, alt = '') {
  const safe = safeUrl(url);
  if (!safe) return '';
  return `
    <figure class="cc-article-image">
      <img src="${esc(safe)}" alt="${esc(alt)}" loading="lazy">
    </figure>
  `;
}

/* =========================================================
   ARTICLE SHARE
========================================================= */
function articleLink(id) {
  return location.origin + '/share/' + encodeURIComponent(id) + '/';
}

function shareIcon(path) {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      <path d="${path}"></path>
    </svg>
  `;
}

function shareBar(article, lang = 'ar') {
  const url = articleLink(article.id);
  const title = article.title || 'ضد السينما !؟';
  const e = encodeURIComponent;
  const labels = lang === 'fr'
    ? {
        share: 'Partager cet article',
        facebook: 'Facebook',
        whatsapp: 'WhatsApp',
        telegram: 'Telegram',
        email: 'E-mail',
        copy: 'Copier le lien'
      }
    : lang === 'en'
      ? {
          share: 'Share this article',
          facebook: 'Facebook',
          whatsapp: 'WhatsApp',
          telegram: 'Telegram',
          email: 'Email',
          copy: 'Copy link'
        }
      : {
          share: 'شارك المقال',
          facebook: 'فيسبوك',
          whatsapp: 'واتساب',
          telegram: 'تيليجرام',
          email: 'البريد',
          copy: 'نسخ الرابط'
        };
  const targets = [
    {
      label: labels.facebook,
      href: 'https://www.facebook.com/sharer/sharer.php?u=' + e(url),
      icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'
    },
    {
      label: 'X',
      href: 'https://twitter.com/intent/tweet?url=' + e(url) + '&text=' + e(title),
      icon: 'M4 4l16 16M20 4L4 20'
    },
    {
      label: labels.whatsapp,
      href: 'https://api.whatsapp.com/send?text=' + e(title + '\n' + url),
      icon: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z'
    },
    {
      label: labels.telegram,
      href: 'https://t.me/share/url?url=' + e(url) + '&text=' + e(title),
      icon: 'm22 2-7 20-4-9-9-4Zm0 0L11 13'
    },
    {
      label: labels.email,
      href: 'mailto:?subject=' + e(title) + '&body=' + e(url),
      icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-10 5L2 7'
    }
  ];
  return `
    <div class="cc-share">
      <span class="cc-share-label">${labels.share}</span>
      <div class="cc-share-btns">
        ${targets.map(t => `
          <a class="cc-share-btn" href="${esc(t.href)}"
            target="_blank" rel="noopener noreferrer"
            aria-label="${esc(t.label)}">
            ${shareIcon(t.icon)}
            <span>${esc(t.label)}</span>
          </a>
        `).join('')}
        <button class="cc-share-btn" id="ccShareCopy" type="button">
          ${shareIcon('M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7')}
          <span>${labels.copy}</span>
        </button>
      </div>
    </div>
  `;
}

function legacyCopy(text, onDone) {
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-1000px';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    document.body.removeChild(field);
    onDone();
  } catch (e) {}
}

function bindShareCopy(article, lang = 'ar') {
  const button = document.getElementById('ccShareCopy');
  if (!button) return;
  const label = button.querySelector('span');
  const done = () => {
    if (label) {
      label.textContent = lang === 'fr'
        ? 'Lien copié'
        : lang === 'en'
          ? 'Link copied'
          : 'تم نسخ الرابط';
    }
    button.classList.add('is-done');
  };
  button.onclick = function () {
    const url = articleLink(article.id);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(finish)
        .catch(() => legacyCopy(url, finish));
      return;
    }
    legacyCopy(url, finish);
  };
}

/* =========================================================
   MULTILINGUAL SYSTEM (BATCHED + PRIORITY + RETRY)
========================================================= */
const CC_LANG_KEY = 'cc-lang';
const CC_CACHE_PREFIX = 'cc_tr_v13_';
const CC_MEMORY_CACHE = new Map();
const CC_INFLIGHT_REQUESTS = new Map();
const CC_ORIGINAL_TEXT_NODES = new WeakMap();

const AUTHORS_LATIN_MAP = {
  [normalizeName('حكيم محمدي')]: 'Mohammedi Hakim',
  [normalizeName('محمدي حكيم')]: 'Mohammedi Hakim',
  [normalizeName('عبد الرؤوف بن أحمد')]: 'Abdel Raouf Ben Ahmed',
  [normalizeName('بن أحمد عبد الرؤوف')]: 'Abdel Raouf Ben Ahmed',
  [normalizeName('عامر طارق')]: 'Amer Tariq',
  [normalizeName('محمد بن زيان')]: 'Mohamed Ben Zayan'
};

const STATIC_UI_TRANSLATIONS = {
  fr: {
    'من نحن': 'Qui sommes-nous',
    'راسلنا': 'Nous écrire',
    'نقرأ الفيلم، ونفكك الصورة': 'Nous lisons le film et déconstruisons l’image',
    'ها نحن في العدد الحادي عشر، والحلم الجميل مستمر؛ نقف اليوم على أعتاب إتمام عام من هذه التجربة المستقلة التي تُدار بصفر دينار. لقد تمكّنا من جمع أهم الأقلام في النقد العربي، وفتحنا الباب أمام أقلام شابة بدأت تترك انطباعًا واعدًا، وتؤكد أنها تمثّل مستقبل الكتابة النقدية. نحن ملزمون بعهد أخلاقيّ، من خلال المجلة وموقعها الإلكتروني بمواصلة تقديم مادة مميزة وثرية لقارئنا، الذي نثق بأنه أصبح ينتظرنا على رأس كل شهر... وإنّا لقادمون إليه.': 'Nous voici au onzième numéro, et le beau rêve continue : nous sommes aujourd’hui au seuil d’une année complète de cette aventure indépendante, menée avec zéro dinar. Nous avons réussi à réunir les plus belles plumes de la critique arabe, tout en ouvrant la porte à de jeunes plumes qui commencent à laisser une impression prometteuse et confirment qu’elles représentent l’avenir de l’écriture critique. Nous sommes tenus par un engagement moral, à travers la revue et son site, de continuer à offrir un contenu distingué et riche à notre lecteur, qui, nous en sommes sûrs, nous attend désormais au début de chaque mois… et nous venons à lui.',
    'الرئيسية': 'Accueil',
    'الأقسام': 'Rubriques',
    'المقالات': 'Articles',
    'آخر المقالات': 'Derniers articles',
    'تصفح الأعداد': 'Parcourir les numéros',
    'الأعداد': 'Numéros',
    'هيئة التحرير': 'Comité de rédaction',
    'المحررون': 'Rédacteurs',
    'عن المجلة': 'À propos',
    'تواصل معنا': 'Contact',
    'مجلة عربية مستقلة للنقد السينمائي': 'Revue arabe indépendante de critique cinématographique',
    'رؤى سينمائية': 'Visions cinématographiques',
    'مراجعات': 'Critiques',
    'أفلام الشهر': 'Films du mois',
    'بروفايل': 'Portrait',
    'مهرجانات': 'Festivals',
    'حوار العدد': 'Entretien',
    'الملف': 'Dossier',
    'متابعات': 'Chroniques',
    'نقد سينمائي': 'Critique de cinéma',
    'تصفح PDF': 'Lire le PDF',
    'PDF قريباً': 'PDF bientôt',
    'تصفح وتحميل العدد PDF': 'Lire et télécharger le PDF',
    'قسم': 'Rubrique',
    'كاتب': 'Auteur',
    'قسم من أقسام المجلة': 'Rubrique de la revue',
    'كتابات ومتابعات نقدية حول السينما.': 'Écrits et analyses critiques sur le cinéma.'
  },
  en: {
    'من نحن': 'About Us',
    'راسلنا': 'Contact Us',
    'نقرأ الفيلم، ونفكك الصورة': 'We read the film, and deconstruct the image',
    'ها نحن في العدد الحادي عشر، والحلم الجميل مستمر؛ نقف اليوم على أعتاب إتمام عام من هذه التجربة المستقلة التي تُدار بصفر دينار. لقد تمكّنا من جمع أهم الأقلام في النقد العربي، وفتحنا الباب أمام أقلام شابة بدأت تترك انطباعًا واعدًا، وتؤكد أنها تمثّل مستقبل الكتابة النقدية. نحن ملزمون بعهد أخلاقيّ، من خلال المجلة وموقعها الإلكتروني بمواصلة تقديم مادة مميزة وثرية لقارئنا، الذي نثق بأنه أصبح ينتظرنا على رأس كل شهر... وإنّا لقادمون إليه.': 'Here we are at the eleventh issue, and the beautiful dream goes on. Today we stand on the threshold of a full year of this independent venture, run on zero dinars. We have gathered the most important voices in Arabic criticism and opened the door to young writers who are beginning to leave a promising impression and who represent the future of critical writing. We are bound by a moral pledge, through the magazine and its website, to keep offering distinctive and rich material to our readers, who we trust now await us at the start of every month... and we are coming to them.',
    'الرئيسية': 'Home',
    'الأقسام': 'Sections',
    'المقالات': 'Articles',
    'آخر المقالات': 'Latest Articles',
    'تصفح الأعداد': 'Browse Issues',
    'الأعداد': 'Issues',
    'هيئة التحرير': 'Editorial Board',
    'المحررون': 'Editors',
    'عن المجلة': 'About',
    'تواصل معنا': 'Contact',
    'مجلة عربية مستقلة للنقد السينمائي': 'Independent Arabic Film Criticism Magazine',
    'رؤى سينمائية': 'Cinematic Visions',
    'مراجعات': 'Reviews',
    'أفلام الشهر': 'Films of the Month',
    'بروفايل': 'Profile',
    'مهرجانات': 'Festivals',
    'حوار العدد': 'Interview',
    'الملف': 'Dossier',
    'متابعات': 'Dispatches',
    'نقد سينمائي': 'Film Criticism',
    'تصفح PDF': 'Read PDF',
    'PDF قريباً': 'PDF Soon',
    'تصفح وتحميل العدد PDF': 'Read & Download PDF',
    'قسم': 'Section',
    'كاتب': 'Author',
    'قسم من أقسام المجلة': 'Magazine section',
    'كتابات ومتابعات نقدية حول السينما.': 'Critical writings and essays on cinema.'
  }
};

function lookupStaticTranslation(text, lang) {
  const dict = STATIC_UI_TRANSLATIONS[lang];
  if (!dict) return null;
  const clean = String(text ?? '').trim();
  if (dict[clean]) return dict[clean];
  if (!dict.__norm) {
    Object.defineProperty(dict, '__norm', { enumerable: false, value: {} });
    for (const k of Object.keys(dict)) {
      dict.__norm[normalizeName(k).replace(/[\s،,.؛;:!؟?…"'«»]/g, '')] = dict[k];
    }
  }
  const nk = normalizeName(clean).replace(/[\s،,.؛;:!؟?…"'«»]/g, '');
  if (nk && dict.__norm[nk]) return dict.__norm[nk];

  const issueMatch = clean.match(/^العدد\s+(\d+)$/);
  if (issueMatch) {
    return lang === 'fr' ? `Numéro ${issueMatch[1]}` : `Issue ${issueMatch[1]}`;
  }
  if (clean === 'قراءة واحدة') return lang === 'fr' ? '1 lecture' : '1 view';
  if (clean === 'قراءتان') return lang === 'fr' ? '2 lectures' : '2 views';
  const viewsMatch = clean.match(/^(\d+)\s+(?:قراءات|قراءة)$/);
  if (viewsMatch) {
    const n = Number(viewsMatch[1]);
    return lang === 'fr'
      ? `${n} ${n > 1 ? 'lectures' : 'lecture'}`
      : `${n} ${n === 1 ? 'view' : 'views'}`;
  }
  return null;
}

function transliterateArabicName(name) {
  const raw = String(name ?? '').trim();
  if (!raw) return raw;
  const norm = normalizeName(raw);
  if (AUTHORS_LATIN_MAP[norm]) {
    return AUTHORS_LATIN_MAP[norm];
  }
  if (!/[\u0600-\u06FF]/.test(raw)) return raw;
  const digraphs = [
    ['ال', 'El '], ['تش', 'Tch'], ['ث', 'Th'],
    ['خ', 'Kh'], ['ذ', 'Dh'], ['ش', 'Ch'], ['غ', 'Gh']
  ];
  const singleMap = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ء': '',
    'ب': 'b', 'ت': 't', 'ج': 'j', 'ح': 'h', 'د': 'd',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': '', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
    'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a'
  };
  return raw.split(/\s+/).filter(Boolean).map(word => {
    let i = 0;
    let out = '';
    while (i < word.length) {
      let matched = false;
      for (const [arSeq, latSeq] of digraphs) {
        if (word.startsWith(arSeq, i)) {
          out += latSeq;
          i += arSeq.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const ch = word[i];
        out += singleMap[ch] !== undefined ? singleMap[ch] : ch;
        i++;
      }
    }
    out = out.trim();
    return out
      ? out.charAt(0).toUpperCase() + out.slice(1)
      : word;
  }).join(' ');
}

function scheduleIdleCacheCleanup() {
  const run = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          /^cc_tr_v\d+_/.test(key) &&
          !key.startsWith(CC_CACHE_PREFIX)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {}
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 3500 });
  } else {
    setTimeout(run, 3000);
  }
}

function getCurrentLang() {
  try {
    const saved = localStorage.getItem(CC_LANG_KEY);
    if (saved === 'fr' || saved === 'en' || saved === 'ar') {
      return saved;
    }
  } catch (e) {}
  return 'ar';
}

function setSavedLang(lang) {
  try {
    localStorage.setItem(CC_LANG_KEY, lang);
  } catch (e) {}
}

function applyHtmlDirection(lang) {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.body.dir = isAr ? 'rtl' : 'ltr';
}

function cacheKeyFor(lang, text) {
  let hash = 2166136261;
  const str = lang + '::' + text;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return CC_CACHE_PREFIX + lang + '_' + (hash >>> 0).toString(16);
}

function isValidTranslation(original, translated) {
  const source = String(original ?? '').trim();
  const result = String(translated ?? '').trim();
  if (!source || !result) return false;
  if (result === source && /[\u0600-\u06FF]/.test(source)) return false;
  if (/QUERY LENGTH LIMIT EXCEEDED|MAX ALLOWED QUERY/i.test(result)) {
    return false;
  }
  return true;
}

function readCachedTranslation(lang, text) {
  const staticHit = lookupStaticTranslation(text, lang);
  if (staticHit) return staticHit;

  const key = cacheKeyFor(lang, text);
  if (CC_MEMORY_CACHE.has(key)) {
    return CC_MEMORY_CACHE.get(key);
  }
  try {
    const value = localStorage.getItem(key);
    if (value && isValidTranslation(text, value)) {
      CC_MEMORY_CACHE.set(key, value);
      return value;
    }
    if (value) localStorage.removeItem(key);
  } catch (e) {}
  return null;
}

function writeCachedTranslation(lang, text, translated) {
  if (!isValidTranslation(text, translated)) return;
  const key = cacheKeyFor(lang, text);
  CC_MEMORY_CACHE.set(key, translated);
  try {
    localStorage.setItem(key, translated);
  } catch (e) {}
  queueShare(lang, text, translated);
}

/* ---------- ترجمات مشتركة بين كل الزوار (جدول translations) ---------- */
const CC_SHARED_LOADED = {};
const CC_SHARE_QUEUE = [];
let CC_SHARE_TIMER = null;

function loadSharedTranslations(lang) {
  if (lang === 'ar') return Promise.resolve();
  if (CC_SHARED_LOADED[lang]) return CC_SHARED_LOADED[lang];
  CC_SHARED_LOADED[lang] = (async () => {
    try {
      const req = db.from('translations')
        .select('source,text')
        .eq('lang', lang)
        .range(0, 999);
      const r = await Promise.race([
        req,
        new Promise(res => setTimeout(() => res(null), 4000))
      ]);
      if (!r || r.error || !Array.isArray(r.data)) return;
      for (const row of r.data) {
        if (row.source && row.text && isValidTranslation(row.source, row.text)) {
          CC_MEMORY_CACHE.set(cacheKeyFor(lang, row.source), row.text);
        }
      }
    } catch (e) {}
  })();
  return CC_SHARED_LOADED[lang];
}

function queueShare(lang, text, tr) {
  const src = String(text ?? '').trim();
  const out = String(tr ?? '').trim();
  if (lang === 'ar' || !src || !out) return;
  if (src.length > 600 || out.length > 1200) return;
  if (!/[\u0600-\u06FF]/.test(src)) return;
  CC_SHARE_QUEUE.push({ lang, source: src, text: out });
  clearTimeout(CC_SHARE_TIMER);
  CC_SHARE_TIMER = setTimeout(flushShare, 1500);
}

async function flushShare() {
  const rows = CC_SHARE_QUEUE.splice(0, 100);
  if (!rows.length) return;
  try {
    await db.from('translations').upsert(rows, {
      onConflict: 'lang,source',
      ignoreDuplicates: true
    });
  } catch (e) {}
  if (CC_SHARE_QUEUE.length) {
    CC_SHARE_TIMER = setTimeout(flushShare, 500);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const CC_TRANSLATE_ENDPOINT = SUPABASE_URL + '/functions/v1/translate';

const CC_BUILD = 'build-14';
const CC_DEBUG_ON = /[?&]trdebug/.test(location.search);
const CC_DEBUG_LINES = [];
function ccDbg(msg) {
  if (!CC_DEBUG_ON) return;
  CC_DEBUG_LINES.unshift(new Date().toTimeString().slice(0, 8) + ' ' + msg);
  CC_DEBUG_LINES.length = Math.min(CC_DEBUG_LINES.length, 14);
  let box = document.getElementById('ccDebugBox');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'ccDebugBox';
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;margin:0;padding:8px;max-height:45vh;overflow:auto;background:#000;color:#0f0;font:11px/1.4 monospace;direction:ltr;text-align:left;white-space:pre-wrap';
    document.body.appendChild(box);
  }
  box.textContent = CC_BUILD + ' lang=' + getCurrentLang() + '\n' + CC_DEBUG_LINES.join('\n');
}

let CC_COOLDOWN_UNTIL = 0;
let CC_FAILS = 0;
function ccFail(ms) {
  CC_FAILS++;
  if (ms || CC_FAILS >= 6) {
    CC_COOLDOWN_UNTIL = Date.now() + (ms || 45000);
    CC_FAILS = 0;
  }
}

async function requestTranslationOnce(text, targetLang, timeoutMs = 0) {
  const clean = String(text ?? '').trim();
  if (!clean || targetLang === 'ar') return clean;
  if (Date.now() < CC_COOLDOWN_UNTIL) {
    ccDbg('COOLDOWN ' + Math.ceil((CC_COOLDOWN_UNTIL - Date.now()) / 1000) + 's');
    return '';
  }
  if (!timeoutMs) timeoutMs = Math.max(15000, 8000 + clean.length * 25);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  const tag = clean.length + 'ch "' + clean.slice(0, 14) + '"';

  try {
    const res = await fetch(CC_TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        text: clean,
        targetLang
      }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    const ms = Date.now() - t0;
    if (!res.ok) {
      ccFail(res.status === 429 ? 60000 : 0);
      ccDbg('HTTP ' + res.status + ' ' + ms + 'ms ' + tag + ' ' + JSON.stringify(data).slice(0, 120));
      return '';
    }

    const translated = String(data?.translatedText || '').trim();
    const ok = isValidTranslation(clean, translated);
    ccDbg((ok ? 'OK ' : 'BAD ') + res.status + ' ' + ms + 'ms ' + tag +
      (ok ? '' : ' -> ' + JSON.stringify(data).slice(0, 120)));
    if (ok) CC_FAILS = 0; else ccFail(0);
    return ok ? translated : '';
  } catch (error) {
    ccFail(0);
    ccDbg('ERR ' + (error && error.name) + ' ' + (Date.now() - t0) + 'ms ' + tag);
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function requestTranslation(text, targetLang, retries = 2) {
  const clean = String(text ?? '').trim();
  if (!clean || targetLang === 'ar') return clean;

  const reqKey = targetLang + '::' + clean;
  if (CC_INFLIGHT_REQUESTS.has(reqKey)) {
    return CC_INFLIGHT_REQUESTS.get(reqKey);
  }

  const promise = (async () => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const out = await requestTranslationOnce(clean, targetLang);
      if (out) return out;
      if (attempt < retries) {
        await sleep(700 * (attempt + 1));
      }
    }
    return '';
  })().finally(() => {
    CC_INFLIGHT_REQUESTS.delete(reqKey);
  });

  CC_INFLIGHT_REQUESTS.set(reqKey, promise);
  return promise;
}

/* ---------- BATCH: عدة نصوص في طلب واحد (بدون تعديل الدالة) ---------- */
const CC_BATCH_SEP = '\n@@@\n';

let CC_BATCH_BROKEN = false;

async function requestBatch(texts, lang) {
  if (!texts.length) return [];
  if (CC_BATCH_BROKEN && texts.length > 1) return null;
  const joined = texts.join(CC_BATCH_SEP);
  const out = await requestTranslationOnce(joined, lang, 25000);
  if (!out) return null;
  const parts = out.split(/\s*@@@\s*/).map(s => s.trim());
  if (parts.length === texts.length) return parts;
  // وصل رد لكن الفاصل لم يُحفظ: نوقف الدفعات حتى لا نضاعف الطلبات
  if (texts.length > 1) CC_BATCH_BROKEN = true;
  return null;
}

function makeBatches(unique, firstSize = 8, size = 10, maxChars = 1200) {
  const batches = [];
  let cur = [];
  let chars = 0;
  let limit = firstSize;
  for (const t of unique) {
    if (cur.length && (cur.length >= limit || chars + t.length > maxChars)) {
      batches.push(cur);
      cur = [];
      chars = 0;
      limit = size;
    }
    cur.push(t);
    chars += t.length;
  }
  if (cur.length) batches.push(cur);
  return batches;
}

/*
  يترجم قائمة نصوص فريدة بالدفعات.
  alive(): هل ما زالت العملية صالحة؟
  apply(src, translated): تطبيق الترجمة على الصفحة
*/
async function translateUnique(unique, lang, alive, apply) {
  if (!unique.length) return;
  let idx = 0;
  const workers = Array.from(
    { length: Math.min(3, unique.length) },
    async () => {
      while (idx < unique.length) {
        if (!alive()) return;
        const src = unique[idx++];
        const tr = await requestTranslation(src, lang, 1);
        if (isValidTranslation(src, tr)) {
          writeCachedTranslation(lang, src, tr);
          apply(src, tr);
        }
      }
    }
  );
  await Promise.all(workers);
}

async function translateText(text, targetLang, el = null, retries = 2) {
  const original = String(text ?? '');
  const clean = original.trim();
  if (!clean || targetLang === 'ar') return original;
  if (!/[\p{L}]/u.test(clean)) return original;

  const authorEl = el
    ? (el.hasAttribute('data-author-name') ? el : el.closest('[data-author-name]'))
    : null;
  if (authorEl) {
    const arSource = authorEl.dataset.arName || clean;
    return original.replace(clean, transliterateArabicName(arSource));
  }

  const cached = readCachedTranslation(targetLang, clean);
  if (cached !== null) {
    return original.replace(clean, cached);
  }

  const translated = await requestTranslation(clean, targetLang, retries);
  if (!translated || !isValidTranslation(clean, translated)) {
    return original;
  }

  writeCachedTranslation(targetLang, clean, translated);
  return original.replace(clean, translated);
}

function splitTextForTranslation(text, maxLength = 2200) {
  const source = String(text ?? '');
  if (source.length <= maxLength) return [source];

  const chunks = [];
  let remaining = source;
  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf('\n\n', maxLength);
    if (cut <= maxLength * 0.35) {
      cut = Math.max(
        remaining.lastIndexOf('\n', maxLength),
        remaining.lastIndexOf('. ', maxLength),
        remaining.lastIndexOf('؟ ', maxLength),
        remaining.lastIndexOf('! ', maxLength),
        remaining.lastIndexOf('؛ ', maxLength),
        remaining.lastIndexOf('، ', maxLength)
      );
    }
    if (cut <= maxLength * 0.35) {
      cut = remaining.lastIndexOf(' ', maxLength);
    }
    if (cut <= 0) cut = maxLength;

    chunks.push(remaining.slice(0, cut + 1));
    remaining = remaining.slice(cut + 1);
  }
  if (remaining.length) {
    chunks.push(remaining);
  }
  return chunks;
}

async function translateWholeArticle(content, lang) {
  const original = String(content ?? '');
  if (!original.trim() || lang === 'ar') {
    return original;
  }

  const cached = readCachedTranslation(lang, original);
  if (cached && isValidTranslation(original, cached)) {
    return cached;
  }

  const chunks = splitTextForTranslation(original, 900);
  if (!chunks.length) return original;

  const translatedChunks = new Array(chunks.length);
  let anyTranslated = false;
  let index = 0;
  const concurrency = 4;

  async function worker() {
    while (index < chunks.length) {
      const i = index++;
      const chunk = chunks[i];
      if (!chunk.trim()) {
        translatedChunks[i] = chunk;
        continue;
      }

      const chunkCached = readCachedTranslation(lang, chunk);
      if (chunkCached && isValidTranslation(chunk, chunkCached)) {
        translatedChunks[i] = chunkCached;
        anyTranslated = true;
        continue;
      }

      const translated = await requestTranslation(chunk, lang, 2);
      if (translated && isValidTranslation(chunk, translated)) {
        writeCachedTranslation(lang, chunk, translated);
        translatedChunks[i] = translated;
        anyTranslated = true;
      } else {
        translatedChunks[i] = chunk;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, chunks.length) }, worker)
  );

  if (!anyTranslated) return original;

  const result = translatedChunks.join('');
  if (!isValidTranslation(original, result)) {
    return original;
  }
  writeCachedTranslation(lang, original, result);
  return result;
}

function shouldSkipTranslationNode(node) {
  if (!node || !node.parentElement) return true;
  const parent = node.parentElement;
  const text = node.textContent || '';
  if (!text.trim() || !/[\p{L}]/u.test(text)) return true;

  if (
    parent.closest(
      'script,style,noscript,textarea,input,select,option,svg,code,pre'
    )
  ) {
    return true;
  }
  if (
    parent.closest(
      '#languageSelect,.brand,footer .foot-logo,' +
      '[data-no-translate],#ccArticleReader'
    )
  ) {
    return true;
  }
  return false;
}

function isNearViewport(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return false;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 800;
  return rect.top < vh * 1.35 && rect.bottom > -vh * 0.35;
}

function collectTranslatableTextNodes() {
  const nodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );
  let node;
  while ((node = walker.nextNode())) {
    if (!shouldSkipTranslationNode(node)) {
      nodes.push(node);
    }
  }
  // نحسب الظهور مرة واحدة لكل عقدة ثم نرتب (الظاهر أولاً)
  const withVis = nodes.map(n => ({
    n,
    v: isNearViewport(n.parentElement) ? 0 : 1
  }));
  withVis.sort((a, b) => a.v - b.v);
  return withVis.map(x => x.n);
}

/* ---------- عناوين وتصنيفات البطاقات أولاً ---------- */
async function translateCardsFirst(lang, runId) {
  const alive = () => runId === CC_TRANSLATION_RUN && getCurrentLang() === lang;
  const els = [...document.querySelectorAll(
    '.article-card h3, .article-card .cat, .section-card b, .section-card p'
  )];

  const items = [];
  for (const el of els) {
    if (el.closest('#ccArticleReader')) continue;
    const node = el.firstChild;
    if (!node || node.nodeType !== 3) continue;
    if (!CC_ORIGINAL_TEXT_NODES.has(node)) {
      CC_ORIGINAL_TEXT_NODES.set(node, node.textContent);
    }
    const source = CC_ORIGINAL_TEXT_NODES.get(node);
    const clean = String(source ?? '').trim();
    if (!clean || !/[\u0600-\u06FF]/.test(clean)) continue;
    items.push({ node, source, clean });
  }

  const todo = [];
  for (const it of items) {
    const hit = readCachedTranslation(lang, it.clean);
    if (hit !== null) {
      it.node.textContent = it.source.replace(it.clean, hit);
    } else {
      todo.push(it);
    }
  }
  if (!todo.length) return;

  const unique = [...new Set(todo.map(x => x.clean))];
  await translateUnique(unique, lang, alive, (src, tr) => {
    todo.forEach(x => {
      if (x.clean === src && x.node.isConnected) {
        x.node.textContent = x.source.replace(x.clean, tr);
      }
    });
  });
}

let CC_TRANSLATION_RUN = 0;
async function applyLanguageToDom(lang) {
  const runId = ++CC_TRANSLATION_RUN;
  applyHtmlDirection(lang);

  const select = $('#languageSelect');
  if (select && select.value !== lang) {
    select.value = lang;
  }

  const alive = () => runId === CC_TRANSLATION_RUN && getCurrentLang() === lang;

  if (lang !== 'ar') await loadSharedTranslations(lang);
  if (!alive()) return;

  const nodes = collectTranslatableTextNodes();

  if (lang === 'ar') {
    nodes.forEach(node => {
      const authorEl = node.parentElement?.hasAttribute('data-author-name')
        ? node.parentElement
        : node.parentElement?.closest('[data-author-name]');
      if (authorEl && authorEl.dataset.arName) {
        node.textContent = authorEl.dataset.arName;
        return;
      }
      const original = CC_ORIGINAL_TEXT_NODES.get(node);
      if (original !== undefined) {
        node.textContent = original;
      }
    });
    return;
  }

  const pending = [];

  for (const node of nodes) {
    const authorEl = node.parentElement?.hasAttribute('data-author-name')
      ? node.parentElement
      : node.parentElement?.closest('[data-author-name]');

    if (!CC_ORIGINAL_TEXT_NODES.has(node)) {
      const baseText = (authorEl && authorEl.dataset.arName)
        ? authorEl.dataset.arName
        : node.textContent;
      CC_ORIGINAL_TEXT_NODES.set(node, baseText);
    }

    const source = CC_ORIGINAL_TEXT_NODES.get(node);
    const clean = String(source ?? '').trim();
    if (!clean) continue;

    if (authorEl) {
      const arSource = authorEl.dataset.arName || clean;
      node.textContent = source.replace(clean, transliterateArabicName(arSource));
      continue;
    }

    const cached = readCachedTranslation(lang, clean);
    if (cached !== null) {
      node.textContent = source.replace(clean, cached);
      continue;
    }

    pending.push({ node, source, clean });
  }

  if (!pending.length) return;

  const groups = new Map();
  for (const it of pending) {
    if (!groups.has(it.clean)) groups.set(it.clean, []);
    groups.get(it.clean).push(it);
  }

  const applyToGroup = (src, tr) => {
    const list = groups.get(src) || [];
    for (const it of list) {
      if (it.node.isConnected && alive()) {
        it.node.textContent = it.source.replace(it.clean, tr);
      }
    }
  };

  // الجولة الأولى (pending مرتب: الظاهر أولاً)
  await translateUnique([...groups.keys()], lang, alive, applyToGroup);

  // جولة إعادة محاولة لما بقي عربياً
  if (alive()) {
    const leftover = [...groups.keys()].filter(src =>
      groups.get(src).some(
        it => it.node.isConnected && /[\u0600-\u06FF]/.test(it.node.textContent || '')
      )
    );
    if (leftover.length) {
      await sleep(800);
      await translateUnique(leftover, lang, alive, applyToGroup);
    }
  }
}

/* =========================================================
   LANGUAGE SWITCHER
========================================================= */
function initLanguageSwitcher() {
  scheduleIdleCacheCleanup();
  const select = $('#languageSelect');
  const initialLang = getCurrentLang();
  applyHtmlDirection(initialLang);
  if (!select) return;
  select.value = initialLang;
  select.onchange = async () => {
    const chosen = ['fr', 'en'].includes(select.value)
      ? select.value
      : 'ar';
    setSavedLang(chosen);

    const reader = document.getElementById('ccArticleReader');
    const isReaderOpen = reader && reader.classList.contains('is-open');
    const article = window.__CC_OPEN_ARTICLE__;

    if (isReaderOpen && article) {
      await openArticle(article.id, true);
    }
    await applyLanguageToDom(chosen);
  };
}

/* =========================================================
   OPEN ARTICLE
========================================================= */
let CC_OPEN_ARTICLE_REQUEST = 0;
async function openArticle(id, keepReaderOpen = false) {
  createArticleReader();
  const requestId = ++CC_OPEN_ARTICLE_REQUEST;
  const articles = window.__CC_ARTICLES__ || [];
  const article = articles.find(
    x => String(x.id) === String(id)
  );
  if (!article) return;
  window.__CC_OPEN_ARTICLE__ = article;

  if (!keepReaderOpen) {
    Promise.resolve(
      db.rpc('increment_views', {
        article_id: article.id
      })
    )
      .then(result => {
        if (result && result.error) {
          console.error('View counter:', result.error);
          return;
        }
        article.views = (Number(article.views) || 0) + 1;
        const badge = document.querySelector(
          '.cc-article-date .views'
        );
        if (
          badge &&
          window.__CC_OPEN_ARTICLE__?.id === article.id
        ) {
          badge.textContent = viewsLabel(
            article.views,
            getCurrentLang()
          );
        }
      })
      .catch(() => {});
  }

  const target = document.getElementById('ccArticleContent');
  if (!target) return;
  const lang = getCurrentLang();

  const rawContent = String(article.content || '');
  const isContentCached =
    lang === 'ar' ||
    !rawContent.trim() ||
    readCachedTranslation(lang, rawContent) !== null;

  if (!isContentCached) {
    target.innerHTML = `
      <div class="cc-no-content">
        ${
          lang === 'fr'
            ? 'Traduction de l’article...'
            : 'Translating article...'
        }
      </div>
    `;
    const reader = document.getElementById('ccArticleReader');
    reader.classList.add('is-open');
    document.body.classList.add('cc-reader-open');
  }

  const [articleContent, translatedTitle, translatedCategory] = lang === 'ar'
    ? [
        rawContent,
        article.title || '',
        article.category || 'نقد سينمائي'
      ]
    : await Promise.all([
        rawContent.trim() ? translateWholeArticle(rawContent, lang) : '',
        translateText(article.title || '', lang, null, 2),
        translateText(article.category || 'نقد سينمائي', lang, null, 2)
      ]);

  if (requestId !== CC_OPEN_ARTICLE_REQUEST) return;

  const paragraphs = articleParagraphs(articleContent);
  const authorImage = safeUrl(article.author_image);
  const image1 = safeUrl(article.image_1);
  const image2 = safeUrl(article.image_2);
  const image3 = safeUrl(article.image_3);
  const total = paragraphs.length;
  let middleIndex = Math.ceil(total / 2);
  if (total <= 2) middleIndex = 1;
  let body = '';
  paragraphs.forEach((paragraph, index) => {
    if (image2 && index === middleIndex) {
      body += articleImage(image2, translatedTitle);
    }
    if (image3 && index === total - 1) {
      body += articleImage(image3, translatedTitle);
    }
    body += `
      <p class="cc-p"
        ${
          article.font_family
            ? `style="font-family:'${esc(article.font_family)}','IBM Plex Sans Arabic',sans-serif"`
            : ''
        }>
        ${formatArticleText(paragraph)}
      </p>
    `;
  });
  if (!paragraphs.length) {
    body = `
      <div class="cc-no-content">
        ${
          lang === 'ar'
            ? 'لا يوجد نص لهذا المقال بعد.'
            : lang === 'fr'
              ? 'Aucun texte disponible pour cet article.'
              : 'No article text is available.'
        }
      </div>
      ${image2 ? articleImage(image2, translatedTitle) : ''}
      ${image3 ? articleImage(image3, translatedTitle) : ''}
    `;
  }
  const rawAuthor = String(article.author || '').trim();
  const displayAuthor = rawAuthor
    ? (lang === 'ar' ? rawAuthor : transliterateArabicName(rawAuthor))
    : '';
  const authorPlaceholder = displayAuthor
    ? displayAuthor.slice(0, 1)
    : (lang === 'ar' ? 'ك' : 'C');
  const authorLabel = lang === 'fr'
    ? 'Comité de rédaction'
    : lang === 'en'
      ? 'Editorial team'
      : 'هيئة التحرير';
  const dateLabel = article.created_at
    ? formatArticleDate(article.created_at, lang)
    : '';

  target.innerHTML = `
    <div class="cc-article-category">
      ${esc(translatedCategory)}
    </div>
    <h1 class="cc-article-title">${esc(translatedTitle)}</h1>
    <div class="cc-article-author">
      ${
        authorImage
          ? `<img class="cc-author-photo" src="${esc(authorImage)}" alt="${esc(displayAuthor || authorLabel)}">`
          : `<div class="cc-author-placeholder">${esc(authorPlaceholder)}</div>`
      }
      ${
        rawAuthor
          ? `<a class="cc-author-link"
                href="author.html?name=${encodeURIComponent(rawAuthor)}"
                data-author-name="1"
                data-ar-name="${esc(rawAuthor)}">${esc(displayAuthor)}</a>`
          : `<span>${authorLabel}</span>`
      }
    </div>
    ${image1 ? articleImage(image1, translatedTitle) : ''}
    <div class="cc-article-body">${body}</div>
    ${
      article.created_at
        ? `<div class="cc-article-date">
             <span>${esc(dateLabel)}</span>
             <span class="views">${viewsLabel(article.views, lang)}</span>
           </div>`
        : ''
    }
    ${shareBar(article, lang)}
  `;
  const reader = document.getElementById('ccArticleReader');
  reader.classList.add('is-open');
  document.body.classList.add('cc-reader-open');
  if (!keepReaderOpen) {
    reader.scrollTop = 0;
  }
  bindShareCopy(article, lang);
  const hash = '#article-' + encodeURIComponent(article.id);
  if (!keepReaderOpen && location.hash !== hash) {
    history.replaceState(null, '', location.pathname + hash);
  }
}

/* =========================================================
   CLOSE ARTICLE
========================================================= */
function closeArticle() {
  const reader = document.getElementById('ccArticleReader');
  if (!reader) return;
  ++CC_OPEN_ARTICLE_REQUEST;
  reader.classList.remove('is-open');
  document.body.classList.remove('cc-reader-open');
  window.__CC_OPEN_ARTICLE__ = null;
  if (location.hash.startsWith('#article-')) {
    history.replaceState(
      null,
      '',
      location.pathname + location.search
    );
  }
}

/* =========================================================
   DATE
========================================================= */
function formatArticleDate(value, lang = getCurrentLang()) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = lang === 'fr'
      ? 'fr-FR'
      : lang === 'en'
        ? 'en-GB'
        : 'ar-DZ';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    return '';
  }
}

/* =========================================================
   OPEN ARTICLE FROM SHARED LINK
========================================================= */
function openArticleFromHash() {
  const hash = location.hash || '';
  let id = '';
  if (hash.startsWith('#article-')) {
    id = hash.slice(9);
  } else {
    id = new URLSearchParams(location.search).get('a') || '';
  }
  try {
    id = decodeURIComponent(id);
  } catch (e) {}
  if (id) openArticle(id);
}

/* =========================================================
   ARCHIVE PAGES
========================================================= */
async function renderArchivePage(mode) {
  const params = new URLSearchParams(location.search);
  const key = (
    mode === 'section'
      ? params.get('slug')
      : params.get('name')
  ) || '';
  const [sections, articles, settings] = await Promise.all([
    get('sections', 'sort_order', true),
    get('articles', 'sort_order', true),
    db.from('settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
      .then(r => {
        if (r.error) {
          console.error('Supabase settings:', r.error);
          return null;
        }
        return r.data || null;
      })
      .catch(e => {
        console.error('Settings:', e);
        return null;
      })
  ]);
  const titleTarget = $('#pageTitle');
  const descTarget = $('#pageDesc');
  const target = $('#pageArticles');
  if (!titleTarget || !target) return;
  const wanted = normalizeName(key);
  let list = articles.filter(x => x.visible !== false);
  if (mode === 'section') {
    const match = sections.find(
      s => normalizeName(s.name) === wanted
    );
    list = list.filter(x =>
      categoryBelongsToSection(x.category, key)
    );
    titleTarget.textContent = match ? match.name : key;
    if (descTarget) {
      descTarget.textContent = match
        ? (match.description || '')
        : '';
    }
    const eyebrow = $('#pageEyebrow');
    if (eyebrow) {
      eyebrow.textContent = 'قسم';
    }
  } else {
    list = list.filter(
      x => normalizeName(x.author) === wanted
    );
    const cleanAuthor = key || 'كاتب';
    titleTarget.textContent = cleanAuthor;
    titleTarget.setAttribute('data-author-name', '1');
    titleTarget.setAttribute('data-ar-name', cleanAuthor);
    if (descTarget) {
      descTarget.textContent = '';
    }
    const eyebrow = $('#pageEyebrow');
    if (eyebrow) {
      eyebrow.textContent = 'كاتب';
    }
  }
  document.title = titleTarget.textContent + ' | ضد السينما';
  createArticleReader();
  applySiteSettings(settings);
  if (!list.length) {
    window.__CC_ARTICLES__ = [];
    target.innerHTML = `
      <div class="empty">
        لا توجد مقالات منشورة هنا بعد.
      </div>
    `;
    return;
  }
  window.__CC_ARTICLES__ = list;
  target.innerHTML = list.map(articleCard).join('');
  bindArticleClicks(target);
  openArticleFromHash();
}

/* =========================================================
   SITE SETTINGS
========================================================= */
function applySiteSettings(settings) {
  if (!settings) return;
  if (settings.accent_color) {
    document.documentElement.style.setProperty(
      '--red',
      settings.accent_color
    );
  }
  const footNote = $('#footNote');
  if (footNote && settings.footer_note) {
    footNote.textContent = settings.footer_note;
  }
}

/* =========================================================
   MAIN
========================================================= */
async function main() {
  initLanguageSwitcher();
  const currentLang = getCurrentLang();
  if (currentLang !== 'ar') loadSharedTranslations(currentLang);
  const path = location.pathname;
  const qs = new URLSearchParams(location.search);
  const isArchive = !!$('#pageArticles');
  const isAuthor =
    /\/author(\.html)?\/?$/.test(path) ||
    (qs.has('name') && !qs.has('slug'));

  if (isArchive) {
    await renderArchivePage(isAuthor ? 'author' : 'section');
    if (currentLang !== 'ar') {
      await applyLanguageToDom(currentLang);
    }
    if (!window.__CC_HASH_LISTENER__) {
      window.__CC_HASH_LISTENER__ = true;
      window.addEventListener(
        'hashchange',
        openArticleFromHash
      );
    }
    return;
  }

  const [
    issues,
    sections,
    articles,
    team,
    editors,
    settings
  ] = await Promise.all([
    get('issues', 'issue_number', false),
    get('sections', 'sort_order', true),
    get('articles', 'sort_order', true),
    get('team', 'sort_order', true),
    get('editors', 'sort_order', true),
    db.from('settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
      .then(r => r.data || null)
      .catch(() => null)
  ]);

  const all = issues.length ? issues : fallbackIssues;
  renderIssues(all);
  renderSections(sections);
  renderArticles(articles.filter(x => x.visible !== false));
  renderTeam(team);
  renderEditors(editors);

  let current = settings?.current_issue_id
    ? issues.find(x => x.id === settings.current_issue_id)
    : null;
  if (!current) {
    current = issues[0] || null;
  }
  renderCurrent(current);

  if (settings) {
    if (settings.site_name) {
      document.title = settings.site_name;
    }
    if (settings.hero_title && $('#heroTitle')) {
      $('#heroTitle').textContent = settings.hero_title;
    }
    if (settings.hero_subtitle && $('#heroDesc')) {
      $('#heroDesc').textContent = settings.hero_subtitle;
    }
    if (settings.about_title && $('#aboutTitle')) {
      $('#aboutTitle').textContent = settings.about_title;
    }
    if (settings.about_text && $('#aboutText')) {
      $('#aboutText').textContent = settings.about_text;
    }
    if (settings.about_text_2 && $('#aboutText2')) {
      $('#aboutText2').textContent = settings.about_text_2;
    }
    if (settings.contact_email && $('#contactEmail')) {
      $('#contactEmail').href = 'mailto:' + settings.contact_email;
      $('#contactEmail').textContent = settings.contact_email;
    }
  }

  applySiteSettings(settings);
  createArticleReader();
  openArticleFromHash();

  if (currentLang !== 'ar') {
    await applyLanguageToDom(currentLang);
  }

  if (!window.__CC_HASH_LISTENER__) {
    window.__CC_HASH_LISTENER__ = true;
    window.addEventListener(
      'hashchange',
      openArticleFromHash
    );
  }
}

/* =========================================================
   VIEWS
========================================================= */
const CC_VIEWS = ['sections', 'articles', 'team', 'editors', 'about', 'contact'];
function ccMarkHomeOnly() {
  const cur = document.getElementById('currentIssue');
  if (!cur) return;
  const box = cur.closest('section') || cur.parentElement;
  if (
    box &&
    !['issues', 'home'].includes(box.id) &&
    !box.querySelector('#sections,#articles,#team,#editors,#about,#contact')
  ) {
    box.setAttribute('data-home-only', '');
  }
}

function ccApplyView() {
  let h = (location.hash || '').slice(1);
  try {
    h = decodeURIComponent(h);
  } catch (e) {}
  if (h.startsWith('article-')) return;
  const root = document.documentElement;
  const view = CC_VIEWS.includes(h) ? h : 'home';
  const changed = root.getAttribute('data-view') !== view;
  root.setAttribute('data-view', view);
  if (!changed) return;
  const target = view === 'home' && h ? document.getElementById(h) : null;
  if (target) {
    target.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

ccMarkHomeOnly();
ccApplyView();
window.addEventListener('hashchange', ccApplyView);

/* =========================================================
   START
========================================================= */
initTheme();
main();
