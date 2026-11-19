const SUPABASE_URL = 'https://icbfpfrzvdfmgunzlduu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cWXOUqhfXPT_UT666tbHCA_IrYiBMux';
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
    const r = await db
      .from(table)
      .select('*')
      .order(order, { ascending });

    if (r.error) {
      console.error(`Supabase ${table}:`, r.error);
      return [];
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
                    data-author-name="1">${esc(x.author)}</a>
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

          <h3 data-author-name="1">${esc(x.name)}</h3>
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

            <h3 data-author-name="1">${esc(fullName)}</h3>

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
  return location.origin + location.pathname + location.search +
    '#article-' + encodeURIComponent(id);
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
   MULTILINGUAL SYSTEM
========================================================= */

const CC_LANG_KEY = 'cc-lang';

/* إصدار جديد لتجنب استعمال الترجمات القديمة الناقصة */
const CC_CACHE_PREFIX = 'cc_tr_v8_';

const CC_MEMORY_CACHE = new Map();
const CC_ORIGINAL_TEXT_NODES = new WeakMap();

const AUTHORS_LATIN_MAP = {
  [normalizeName('حكيم محمدي')]: 'Mohammedi Hakim',
  [normalizeName('محمدي حكيم')]: 'Mohammedi Hakim',
  [normalizeName('عبد الرؤوف بن أحمد')]: 'Abdel Raouf Ben Ahmed',
  [normalizeName('بن أحمد عبد الرؤوف')]: 'Abdel Raouf Ben Ahmed',
  [normalizeName('عامر طارق')]: 'Amer Tariq',
  [normalizeName('محمد بن زيان')]: 'Mohamed Ben Zayan'
};

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


/* =========================================================
   TRANSLATION CACHE
========================================================= */

function clearOldTranslationCache() {
  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key &&
        /^cc_tr_v[1-7]_/.test(key) &&
        !key.startsWith(CC_CACHE_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {}

  CC_MEMORY_CACHE.clear();
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

  if (!source || !result || result === source) return false;

  if (source.length > 300 && result.length < source.length * 0.18) {
    return false;
  }

  return true;
}

function readCachedTranslation(lang, text) {
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
}


/* =========================================================
   TRANSLATION REQUEST
========================================================= */

async function requestTranslation(text, targetLang) {
  const clean = String(text ?? '').trim();

  if (!clean || targetLang === 'ar') return clean;

  /*
   * إذا كان لديك خادم ترجمة خاص، تتم تجربته أولاً.
   */
  if (window.CC_AI_TRANSLATE_ENDPOINT) {
    try {
      const res = await fetch(window.CC_AI_TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: clean,
          sourceLang: 'ar',
          targetLang,
          domain: 'cinema criticism magazine',
          instructions: [
            'Translate the complete text without summarizing.',
            'Do not omit any sentence, paragraph, or ending.',
            'Preserve the original paragraph order.',
            'Translate all ordinary quoted text.',
            'Do not translate personal names by meaning.',
            'Do not invent official foreign film titles.',
            'Return only the complete translation.'
          ].join(' ')
        })
      });

      if (res.ok) {
        const data = await res.json();

        const out = String(
          (data && (
            data.translatedText ||
            data.text ||
            data.result
          )) || ''
        ).trim();

        if (isValidTranslation(clean, out)) {
          return out;
        }
      }
    } catch (e) {
      console.warn('Custom translation endpoint failed:', e);
    }
  }

  /*
   * الترجمة الاحتياطية عبر Google Translate.
   */
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=' +
      encodeURIComponent(targetLang) +
      '&dt=t&q=' +
      encodeURIComponent(clean);

    const res = await fetch(url);

    if (!res.ok) return '';

    const data = await res.json();

    const translated = Array.isArray(data) && Array.isArray(data[0])
      ? data[0]
          .map(part => Array.isArray(part) ? part[0] : '')
          .join('')
      : '';

    return isValidTranslation(clean, translated)
      ? translated
      : '';

  } catch (e) {
    console.warn('Google translation failed:', e);
    return '';
  }
}


/* =========================================================
   TRANSLATE TEXT
========================================================= */

async function translateText(text, targetLang, el = null) {
  const original = String(text ?? '');
  const clean = original.trim();

  if (!clean || targetLang === 'ar') return original;

  /*
   * أسماء الكتّاب تُكتب بالحروف اللاتينية،
   * ولا تُرسل إلى خدمة الترجمة.
   */
  if (
    el &&
    (
      el.hasAttribute('data-author-name') ||
      el.closest('[data-author-name]')
    )
  ) {
    return original.replace(
      clean,
      transliterateArabicName(clean)
    );
  }

  const cached = readCachedTranslation(targetLang, clean);

  if (cached !== null) {
    return original.replace(clean, cached);
  }

  const translated = await requestTranslation(clean, targetLang);

  if (!translated) return original;

  if (!isValidTranslation(clean, translated)) {
    return original;
  }

  writeCachedTranslation(targetLang, clean, translated);

  return original.replace(clean, translated);
}


/* =========================================================
   SPLIT LONG TEXT
   تقسيم المقال الطويل إلى أجزاء صغيرة
========================================================= */

function splitTextForTranslation(text, maxLength = 850) {
  const source = String(text ?? '');
  const chunks = [];

  let remaining = source;

  while (remaining.length > maxLength) {
    let cut = maxLength;

    /*
     * نحاول التوقف عند نهاية جملة أولاً.
     */
    const sentenceEnd = Math.max(
      remaining.lastIndexOf('. ', maxLength),
      remaining.lastIndexOf('؟ ', maxLength),
      remaining.lastIndexOf('! ', maxLength),
      remaining.lastIndexOf('؛ ', maxLength),
      remaining.lastIndexOf('، ', maxLength),
      remaining.lastIndexOf('\n', maxLength)
    );

    if (sentenceEnd > maxLength * 0.5) {
      cut = sentenceEnd + 1;
    } else {
      /*
       * إذا لم نجد نهاية جملة، نتوقف عند آخر مسافة.
       */
      const space = remaining.lastIndexOf(' ', maxLength);

      if (space > maxLength * 0.5) {
        cut = space + 1;
      }
    }

    if (cut <= 0) cut = maxLength;

    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }

  if (remaining.length) {
    chunks.push(remaining);
  }

  return chunks;
}


/* =========================================================
   WHOLE ARTICLE TRANSLATION
========================================================= */

function translationLooksComplete(source, translated) {
  const original = String(source ?? '').trim();
  const result = String(translated ?? '').trim();

  if (!original || !result) return false;

  if (!isValidTranslation(original, result)) {
    return false;
  }

  /*
   * التحقق من أن الترجمة لم تفقد معظم حجم المقال.
   * لا نعتمد على عدد الفقرات لأن خدمات الترجمة
   * قد تغيّر توزيع الأسطر والفواصل.
   */
  if (
    original.length > 500 &&
    result.length < original.length * 0.20
  ) {
    return false;
  }

  const originalParagraphs = articleParagraphs(original);
  const translatedParagraphs = articleParagraphs(result);

  if (
    originalParagraphs.length >= 5 &&
    translatedParagraphs.length < 1
  ) {
    return false;
  }

  const sourceLast = originalParagraphs[
    originalParagraphs.length - 1
  ] || '';

  const resultLast = translatedParagraphs[
    translatedParagraphs.length - 1
  ] || '';

  if (
    sourceLast.length > 35 &&
    resultLast.length < 8
  ) {
    return false;
  }

  return true;
}

async function translateWholeArticle(content, lang) {
  const original = String(content ?? '');

  if (!original.trim() || lang === 'ar') {
    return original;
  }

  /*
   * استعمال الترجمة المحفوظة إذا كانت كاملة.
   */
  const cached = readCachedTranslation(lang, original);

  if (
    cached &&
    translationLooksComplete(original, cached)
  ) {
    return cached;
  }

  /*
   * تقسيم المقال إلى أجزاء قصيرة.
   * تتم ترجمة كل جزء على حدة لتفادي تجاوز حدود الخدمة.
   */
  const chunks = splitTextForTranslation(original, 850);

  if (!chunks.length) return original;

  const translatedChunks = [];

  /*
   * الترجمة بالتتابع لتفادي إرسال طلبات كثيرة في وقت واحد.
   */
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (!chunk.trim()) {
      translatedChunks.push(chunk);
      continue;
    }

    const translated = await requestTranslation(chunk, lang);

    /*
     * إذا فشل جزء واحد، لا نعرض ترجمة مبتورة.
     */
    if (!translated || !isValidTranslation(chunk, translated)) {
      console.warn(
        'Article translation stopped at chunk:',
        i + 1,
        'of',
        chunks.length
      );

      return original;
    }

    translatedChunks.push(translated);
  }

  const result = translatedChunks.join('');

  /*
   * التحقق النهائي قبل حفظ الترجمة.
   */
  if (!translationLooksComplete(original, result)) {
    console.warn('Incomplete article translation rejected.');
    return original;
  }

  writeCachedTranslation(lang, original, result);

  return result;
}


/* =========================================================
   SAFE DOM TRANSLATION
   Uses text nodes, including text inside nested elements.
========================================================= */

function shouldSkipTranslationNode(node) {
  if (!node || !node.parentElement) return true;

  const parent = node.parentElement;
  const text = node.textContent || '';

  if (!text.trim()) return true;

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

  return nodes;
}

let CC_TRANSLATION_RUN = 0;

async function applyLanguageToDom(lang) {
  const runId = ++CC_TRANSLATION_RUN;

  applyHtmlDirection(lang);

  const select = $('#languageSelect');

  if (select && select.value !== lang) {
    select.value = lang;
  }

  const nodes = collectTranslatableTextNodes();

  /*
   * العودة إلى العربية الأصلية.
   */
  if (lang === 'ar') {
    nodes.forEach(node => {
      const original = CC_ORIGINAL_TEXT_NODES.get(node);

      if (original !== undefined) {
        node.textContent = original;
      }
    });

    return;
  }

  const batch = nodes.map(node => {
    if (!CC_ORIGINAL_TEXT_NODES.has(node)) {
      CC_ORIGINAL_TEXT_NODES.set(node, node.textContent);
    }

    return {
      node,
      source: CC_ORIGINAL_TEXT_NODES.get(node),
      parent: node.parentElement
    };
  });

  let index = 0;
  const concurrency = 5;

  async function worker() {
    while (index < batch.length) {
      if (runId !== CC_TRANSLATION_RUN) return;

      const current = batch[index++];

      if (!current.node.isConnected) continue;

      const translated = await translateText(
        current.source,
        lang,
        current.parent
      );

      if (
        runId === CC_TRANSLATION_RUN &&
        getCurrentLang() === lang &&
        current.node.isConnected
      ) {
        current.node.textContent = translated;
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, worker)
  );
}


/* =========================================================
   LANGUAGE SWITCHER
========================================================= */

function initLanguageSwitcher() {
  clearOldTranslationCache();

  const select = $('#languageSelect');
  const initialLang = getCurrentLang();

  applyHtmlDirection(initialLang);

  if (!select) return;

  select.value = initialLang;

  select.onchange = async () => {
    const chosen = ['fr', 'en'].includes(select.value)
      ? select.value
      : 'ar';

    try {
      localStorage.setItem(CC_LANG_KEY, chosen);
    } catch (e) {}

    await applyLanguageToDom(chosen);

    const reader = document.getElementById('ccArticleReader');

    if (reader && reader.classList.contains('is-open')) {
      const article = window.__CC_OPEN_ARTICLE__;

      if (article) {
        await openArticle(article.id, true);
      }
    }
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

  /*
   * لا نزيد المشاهدات عند إعادة عرض المقال بسبب تغيير اللغة.
   */
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

  target.innerHTML = `
    <div class="cc-no-content">
      ${
        lang === 'ar'
          ? 'جارٍ فتح المقال...'
          : lang === 'fr'
            ? 'Ouverture de l’article...'
            : 'Loading article...'
      }
    </div>
  `;

  let articleContent = String(article.content || '');

  /*
   * ترجمة متن المقال كاملاً على أجزاء.
   */
  if (lang !== 'ar' && articleContent.trim()) {
    articleContent = await translateWholeArticle(
      articleContent,
      lang
    );
  }

  if (requestId !== CC_OPEN_ARTICLE_REQUEST) return;

  /*
   * ترجمة العنوان والقسم كل على حدة.
   */
  const [translatedTitle, translatedCategory] = lang === 'ar'
    ? [
        article.title || '',
        article.category || 'نقد سينمائي'
      ]
    : await Promise.all([
        translateText(article.title || '', lang),
        translateText(
          article.category || 'نقد سينمائي',
          lang
        )
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

  const authorName = article.author
    ? transliterateArabicName(article.author)
    : '';

  const authorPlaceholder = authorName
    ? authorName.slice(0, 1)
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
          ? `<img class="cc-author-photo" src="${esc(authorImage)}" alt="${esc(authorName || authorLabel)}">`
          : `<div class="cc-author-placeholder">${esc(authorPlaceholder)}</div>`
      }

      ${
        article.author
          ? `<a class="cc-author-link"
                href="author.html?name=${encodeURIComponent(article.author)}"
                data-author-name="1">${esc(authorName)}</a>`
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
  reader.scrollTop = 0;

  bindShareCopy(article, lang);

  const hash = '#article-' + encodeURIComponent(article.id);

  if (!keepReaderOpen && location.hash !== hash) {
    history.replaceState(
      null,
      '',
      location.pathname + location.search + hash
    );
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

  if (!hash.startsWith('#article-')) return;

  let id = hash.slice(9);

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
      .then(r => r.data || null)
      .catch(() => null)
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

    list = list.filter(
      x => normalizeName(x.category) === wanted
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

    titleTarget.textContent = key || 'كاتب';
    titleTarget.setAttribute('data-author-name', '1');

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

  const path = location.pathname;

  if (
    path.endsWith('section.html') ||
    path.endsWith('author.html')
  ) {
    await renderArchivePage(
      path.endsWith('section.html')
        ? 'section'
        : 'author'
    );

    await applyLanguageToDom(getCurrentLang());

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

  const all = issues.length
    ? issues
    : fallbackIssues;

  renderIssues(all);
  renderSections(sections);

  renderArticles(
    articles.filter(x => x.visible !== false)
  );

  renderTeam(team);
  renderEditors(editors);

  let current = settings?.current_issue_id
    ? issues.find(
        x => x.id === settings.current_issue_id
      )
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
      $('#contactEmail').href =
        'mailto:' + settings.contact_email;

      $('#contactEmail').textContent =
        settings.contact_email;
    }
  }

  applySiteSettings(settings);
  createArticleReader();

  openArticleFromHash();

  await applyLanguageToDom(getCurrentLang());

  if (!window.__CC_HASH_LISTENER__) {
    window.__CC_HASH_LISTENER__ = true;

    window.addEventListener(
      'hashchange',
      openArticleFromHash
    );
  }
}


/* =========================================================
   START
========================================================= */

initTheme();
main();
