/* =========================================================
   CONTRE CINÉMA
   ADMIN.JS
   ========================================================= */

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  'https://qclqyqjxsnnhlnlhjybo.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_zTxQEl6b0KSv1fE9tG202g_Rt4X05YV';

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/* =========================================================
   DATA
   ========================================================= */

let D = {
  issues: [],
  articles: [],
  sections: [],
  team: [],
  editors: [],
  settings: null
};

/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

function esc(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

function msgError(error) {

  return (
    error?.message ||
    error?.error_description ||
    'حدث خطأ غير معروف.'
  );

}

/* =========================================================
   ELEMENTS
   ========================================================= */

let login;
let panel;
let loginBtn;
let logout;
let emailInput;
let passwordInput;
let msg;
let workspace;
let stats;

/* =========================================================
   GET ELEMENTS
   ========================================================= */

function getElements() {

  login =
    $('login');

  panel =
    $('panel');

  loginBtn =
    $('loginBtn');

  logout =
    $('logout');

  emailInput =
    $('email');

  passwordInput =
    $('password');

  msg =
    $('msg');

  workspace =
    $('workspace');

  stats =
    $('stats');

}

/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function isAdmin() {

  try {

    const {
      data: { user },
      error: userError
    } = await db.auth.getUser();

    if (userError) {

      console.error(
        'GET USER ERROR:',
        userError
      );

      return false;

    }

    if (!user) {

      console.error(
        'NO AUTH USER'
      );

      return false;

    }

    console.log(
      'AUTH USER:',
      user.id,
      user.email
    );

    const {
      data,
      error
    } = await db.rpc(
      'is_admin'
    );

    if (error) {

      console.error(
        'IS_ADMIN RPC ERROR:',
        error
      );

      return false;

    }

    console.log(
      'IS_ADMIN RESULT:',
      data
    );

    return data === true;

  } catch (error) {

    console.error(
      'IS_ADMIN EXCEPTION:',
      error
    );

    return false;

  }

}

/* =========================================================
   LOGIN / PANEL VISIBILITY
   ========================================================= */

function showLogin() {

  if (login) {

    login.hidden = false;

  }

  if (panel) {

    panel.hidden = true;

  }

}

function showPanel() {

  if (login) {

    login.hidden = true;

  }

  if (panel) {

    panel.hidden = false;

  }

}

/* =========================================================
   BOOT
   ========================================================= */

async function boot() {

  try {

    if (msg) {

      msg.textContent =
        'جارٍ التحقق من الجلسة...';

    }

    const {
      data: { session },
      error
    } = await db.auth.getSession();

    if (error) {

      throw error;

    }

    if (!session) {

      showLogin();

      if (msg) {

        msg.textContent = '';

      }

      return;

    }

    const admin =
      await isAdmin();

    if (!admin) {

      await db.auth.signOut();

      showLogin();

      if (msg) {

        msg.textContent =
          'هذا الحساب لا يملك صلاحية إدارة الموقع.';

      }

      return;

    }

    showPanel();

    await load();

    show('dashboard');

    if (msg) {

      msg.textContent = '';

    }

  } catch (error) {

    console.error(
      'BOOT ERROR:',
      error
    );

    showLogin();

    if (msg) {

      msg.textContent =
        msgError(error);

    }

  }

}

/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  const email =
    emailInput?.value
      ?.trim();

  const password =
    passwordInput?.value || '';

  if (!email) {

    if (msg) {

      msg.textContent =
        'أدخل البريد الإلكتروني.';

    }

    return;

  }

  if (!password) {

    if (msg) {

      msg.textContent =
        'أدخل كلمة المرور.';

    }

    return;

  }

  if (loginBtn) {

    loginBtn.disabled = true;

    loginBtn.textContent =
      'جارٍ الدخول...';

  }

  if (msg) {

    msg.textContent =
      'جارٍ تسجيل الدخول...';

  }

  try {

    const {
      data,
      error
    } = await db.auth.signInWithPassword({

      email: email,

      password: password

    });

    if (error) {

      throw error;

    }

    if (!data?.session) {

      throw new Error(
        'تم تسجيل الدخول لكن لم يتم إنشاء جلسة.'
      );

    }

    console.log(
      'LOGIN USER:',
      data.user?.id,
      data.user?.email
    );

    const admin =
      await isAdmin();

    if (!admin) {

      await db.auth.signOut();

      throw new Error(
        'تم تسجيل الدخول، لكن هذا الحساب لا يملك صلاحية إدارة الموقع.'
      );

    }

    showPanel();

    await load();

    show('dashboard');

    if (msg) {

      msg.textContent = '';

    }

  } catch (error) {

    console.error(
      'LOGIN ERROR:',
      error
    );

    showLogin();

    if (msg) {

      msg.textContent =
        msgError(error);

    }

  } finally {

    if (loginBtn) {

      loginBtn.disabled = false;

      loginBtn.textContent =
        'تسجيل الدخول';

    }

  }

}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {

  try {

    await db.auth.signOut();

  } catch (error) {

    console.error(
      'LOGOUT ERROR:',
      error
    );

  }

  location.reload();

}

/* =========================================================
   AUTH EVENTS
   ========================================================= */

function setupAuth() {

  if (loginBtn) {

    loginBtn.addEventListener(
      'click',
      loginUser
    );

  }

  if (logout) {

    logout.addEventListener(
      'click',
      logoutUser
    );

  }

  if (passwordInput) {

    passwordInput.addEventListener(
      'keydown',
      event => {

        if (
          event.key === 'Enter'
        ) {

          loginUser();

        }

      }
    );

  }

  db.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        'AUTH EVENT:',
        event,
        !!session
      );

    }
  );

}

/* =========================================================
   LOAD ALL DATA
   ========================================================= */

async function load() {

  const [
    issuesResult,
    articlesResult,
    sectionsResult,
    teamResult,
    editorsResult,
    settingsResult
  ] = await Promise.all([

    db
      .from('issues')
      .select('*')
      .order(
        'issue_number',
        {
          ascending: false
        }
      ),

    db
      .from('articles')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      ),

    db
      .from('sections')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true
        }
      ),

    db
      .from('team')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true
        }
      ),

    db
      .from('editors')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true
        }
      ),

    db
      .from('settings')
      .select('*')
      .eq(
        'id',
        true
      )
      .maybeSingle()

  ]);

  if (issuesResult.error) {

    throw issuesResult.error;

  }

  if (articlesResult.error) {

    throw articlesResult.error;

  }

  if (sectionsResult.error) {

    throw sectionsResult.error;

  }

  if (teamResult.error) {

    throw teamResult.error;

  }

  if (editorsResult.error) {

    throw editorsResult.error;

  }

  if (settingsResult.error) {

    throw settingsResult.error;

  }

  D = {

    issues:
      issuesResult.data || [],

    articles:
      articlesResult.data || [],

    sections:
      sectionsResult.data || [],

    team:
      teamResult.data || [],

    editors:
      editorsResult.data || [],

    settings:
      settingsResult.data || null

  };

  updateStats();

}

/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

  if (!stats) {

    return;

  }

  stats.textContent =
    `الأعداد ${D.issues.length} · ` +
    `المقالات ${D.articles.length} · ` +
    `الأقسام ${D.sections.length} · ` +
    `الهيئة ${D.team.length} · ` +
    `المحررون ${D.editors.length}`;

}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(
      '[data-tab]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          show(
            button.dataset.tab
          );

        }
      );

    });

}

/* =========================================================
   SHOW TAB
   ========================================================= */

function show(tab) {

  document
    .querySelectorAll(
      'aside button[data-tab]'
    )
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.tab === tab
      );

    });

  const views = {

    dashboard:
      dashboardUI,

    issues:
      issuesUI,

    articles:
      articlesUI,

    sections:
      sectionsUI,

    team:
      teamUI,

    editors:
      editorsUI,

    settings:
      settingsUI

  };

  if (
    workspace &&
    views[tab]
  ) {

    workspace.innerHTML =
      views[tab]();

    if (tab === 'articles') {

      updateArticlePreview();

    }

  }

}

/* =========================================================
   INPUT HELPER
   ========================================================= */

function input(
  id,
  placeholder,
  type = 'text'
) {

  return `
    <input
      id="${id}"
      type="${type}"
      placeholder="${esc(placeholder)}"
    >
  `;

}

/* =========================================================
   STORAGE UPLOAD
   ========================================================= */

async function upload(
  bucket,
  file
) {

  if (!file) {

    return null;

  }

  const safeName =
    file.name
      .replace(
        /[^\w.\-]/g,
        '_'
      );

  const path =
    Date.now() +
    '-' +
    Math.random()
      .toString(36)
      .substring(2, 8) +
    '-' +
    safeName;

  const {
    error
  } = await db
    .storage
    .from(bucket)
    .upload(
      path,
      file,
      {
        upsert: false,
        contentType: file.type
      }
    );

  if (error) {

    throw error;

  }

  const {
    data
  } = db
    .storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;

}

/* =========================================================
   DASHBOARD
   ========================================================= */

function dashboardUI() {

  return `

    <div class="panel">

      <h1>
        مرحباً بك
      </h1>

      <p>
        من هنا تدير موقع مجلة
        «ضد السينما !؟» بالكامل.
      </p>

      <p>
        يمكنك إضافة الأعداد والمقالات
        والأقسام وهيئة التحرير وتعديل
        إعدادات الموقع.
      </p>

    </div>

    <div class="stat-grid">

      <div class="stat">

        <b>
          ${D.issues.length}
        </b>

        <span>
          عدد منشور
        </span>

      </div>

      <div class="stat">

        <b>
          ${D.articles.length}
        </b>

        <span>
          مقال
        </span>

      </div>

      <div class="stat">

        <b>
          ${D.sections.length}
        </b>

        <span>
          قسم
        </span>

      </div>

      <div class="stat">

        <b>
          ${D.team.length}
        </b>

        <span>
          عضو هيئة تحرير
        </span>

      </div>

    </div>

  `;

}

/* =========================================================
   ISSUES UI
   ========================================================= */

function issuesUI() {

  return `

    <div class="panel">

      <h2>
        إضافة عدد
      </h2>

      <div class="form">

        ${input(
          'inum',
          'رقم العدد',
          'number'
        )}

        ${input(
          'ititle',
          'عنوان العدد'
        )}

        ${input(
          'idate',
          'تاريخ النشر'
        )}

        <label>

          غلاف العدد

          <input
            id="cover"
            type="file"
            accept="image/*"
          >

        </label>

        <label>

          PDF العدد

          <input
            id="pdf"
            type="file"
            accept="application/pdf"
          >

        </label>

        <button
          class="btn full"
          onclick="addIssue()">

          حفظ العدد

        </button>

      </div>

    </div>

    <div class="panel">

      <h2>
        الأعداد المنشورة
      </h2>

      ${
        D.issues.length

          ?

          D.issues
            .map(issue => `

              <div class="item">

                <div>

                  <b>
                    العدد
                    ${esc(
                      issue.issue_number
                    )}
                  </b>

                  —
                  ${esc(
                    issue.title || ''
                  )}

                </div>

                <div class="actions">

                  ${
                    issue.pdf_url

                      ?

                      `
                        <a
                          href="${esc(
                            issue.pdf_url
                          )}"
                          target="_blank"
                          rel="noopener">

                          PDF

                        </a>
                      `

                      :

                      ''
                  }

                  <button
                    class="danger"
                    onclick="del(
                      'issues',
                      '${issue.id}'
                    )">

                    حذف

                  </button>

                </div>

              </div>

            `)
            .join('')

          :

          '<p>لا توجد أعداد بعد.</p>'
      }

    </div>

  `;

}

/* =========================================================
   ADD ISSUE
   ========================================================= */

async function addIssue() {

  try {

    const coverFile =
      $('cover')
        ?.files
        ?.[0];

    const pdfFile =
      $('pdf')
        ?.files
        ?.[0];

    const coverUrl =
      await upload(
        'covers',
        coverFile
      );

    const pdfUrl =
      await upload(
        'pdfs',
        pdfFile
      );

    const issueNumber =
      Number(
        $('inum')?.value
      );

    const title =
      $('ititle')
        ?.value
        ?.trim();

    const date =
      $('idate')
        ?.value
        ?.trim();

    if (!issueNumber) {

      alert(
        'أدخل رقم العدد.'
      );

      return;

    }

    if (!title) {

      alert(
        'أدخل عنوان العدد.'
      );

      return;

    }

    const {
      error
    } = await db
      .from('issues')
      .insert({

        issue_number:
          issueNumber,

        title:
          title,

        publication_date:
          date,

        cover_image:
          coverUrl,

        pdf_url:
          pdfUrl

      });

    if (error) {

      throw error;

    }

    alert(
      'تمت إضافة العدد بنجاح.'
    );

    await load();

    show('issues');

  } catch (error) {

    console.error(error);

    alert(
      msgError(error)
    );

  }

}

/* =========================================================
   ARTICLES UI
   ========================================================= */

/*
   خطوط متاحة للمقالات
*/
const FONT_OPTIONS = [
  'IBM Plex Sans Arabic',
  'Noto Naskh Arabic',
  'Cairo',
  'Tajawal',
  'Amiri'
];

function articlesUI() {

  const editing =
    D.editArticle || null;

  const list =
    D.articles.slice().sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

  const imageField = (
    id,
    label,
    note,
    current
  ) => `
    <label class="upload-field">
      <span>${label}</span>
      <small>${note}</small>
      <input
        id="${id}"
        type="file"
        accept="image/*"
        onchange="showFileName('${id}','${id}Name')"
      >
      <small id="${id}Name">
        ${
          current
            ? 'اتركه فارغاً للإبقاء على الصورة الحالية'
            : 'لم يتم اختيار صورة'
        }
      </small>
      ${
        current
          ? `<img class="thumb-current" src="${esc(current)}" alt="">`
          : ''
      }
    </label>
  `;

  return `

    <div class="panel article-form-panel">

      <h2>
        ${
          editing
            ? 'تعديل مقال'
            : 'إضافة مقال'
        }
      </h2>

      <p class="form-note">
        عنوان المقال، الكاتب، القسم،
        الرابط الثابت (slug)، صورة الكاتب،
        ثلاث صور للمقال ونص المقال.
      </p>

      <div class="form">

        <label>
          عنوان المقال
          <input
            id="atitle"
            type="text"
            value="${editing ? esc(editing.title) : ''}"
            placeholder="عنوان المقال"
          >
        </label>

        <label>
          اسم الكاتب
          <input
            id="aauthor"
            type="text"
            value="${editing ? esc(editing.author || '') : ''}"
            placeholder="اسم الكاتب"
          >
        </label>

        <label>
          القسم
          <input
            id="acat"
            type="text"
            list="sectionsList"
            value="${editing ? esc(editing.category || '') : ''}"
            placeholder="مثال: مراجعات"
          >
          <datalist id="sectionsList">
            ${
              D.sections
                .map(
                  s =>
                    `<option value="${esc(s.name)}">`
                )
                .join('')
            }
          </datalist>
        </label>

        <label>
          الرابط الثابت (slug)
          <input
            id="aslug"
            type="text"
            value="${editing ? esc(editing.slug || '') : ''}"
            placeholder="يولّد تلقائياً من العنوان إن تُرك فارغاً"
          >
        </label>

        <label class="check-field">
          <input
            id="avisible"
            type="checkbox"
            ${
              editing
                ? (editing.visible !== false ? 'checked' : '')
                : 'checked'
            }
          >
          <span>
            ظاهر للزوار
            (أزل العلامة للإخفاء)
          </span>
        </label>

        ${imageField(
          'authorImage',
          'صورة الكاتب',
          'تظهر بجانب اسم الكاتب.',
          editing ? editing.author_image : ''
        )}

        ${imageField(
          'image1',
          'الصورة الأولى للمقال',
          'تظهر مباشرة تحت العنوان والكاتب.',
          editing ? editing.image_1 : ''
        )}

        <label>
          خط المقال
          <select id="afont" onchange="updateArticlePreview()">
            ${
              FONT_OPTIONS.map(f =>
                `<option value="${f}" ${
                  editing && editing.font_family === f
                    ? 'selected'
                    : ''
                }>${f}</option>`
              ).join('')
            }
          </select>
        </label>

        <div class="fmt-head">
          نص المقال
        </div>

        <div class="fmt-bar">
          <button type="button" onclick="wrapSel('**','**')" title="عريض">
            <b>غليظ</b>
          </button>
          <button type="button" onclick="wrapSel('## ','  ')" title="عنوان فرعي">
            عنوان
          </button>
          <button type="button" onclick="wrapSel('> ','  ')" title="اقتباس">
            ❝ اقتباس
          </button>
          <span class="fmt-hint">
            حدّد النص ثم اضغط الزر — **عريض** · ## عنوان · > اقتباس
          </span>
        </div>

        <textarea
          id="acontent"
          rows="18"
          placeholder="اكتب نص المقال هنا..."
          oninput="updateArticlePreview()"
        >${editing ? esc(editing.content || '') : ''}</textarea>

        <div class="pv-head">معاينة</div>
        <div id="articlePreviewBox" class="pv-box"></div>

        ${imageField(
          'image2',
          'الصورة الثانية للمقال',
          'ستظهر داخل المقال.',
          editing ? editing.image_2 : ''
        )}

        ${imageField(
          'image3',
          'الصورة الثالثة للمقال',
          'ستظهر قرب نهاية المقال.',
          editing ? editing.image_3 : ''
        )}

        <div class="form-actions">

          <button
            class="btn full"
            id="saveArticleBtn"
            onclick="${
              editing
                ? 'updateArticle()'
                : 'addArticle()'
            }"
          >
            ${
              editing
                ? 'حفظ التعديلات'
                : 'حفظ المقال'
            }
          </button>

          ${
            editing
              ? `
                <button
                  class="btn full secondary"
                  onclick="cancelEditArticle()"
                >
                  إلغاء التعديل
                </button>
              `
              : ''
          }

        </div>

      </div>

    </div>

    <div class="panel">

      <h2>
        المقالات المنشورة
      </h2>

      ${
        list.length
          ?
          list
            .map((article, index) => `

              <div class="item">

                <div>

                  <b>
                    ${esc(article.title)}
                  </b>

                  <br>

                  <small>
                    ${esc(article.author || '')}
                    —
                    ${esc(article.category || '')}
                  </small>

                  <br>

                  <span class="badge ${
                    article.visible !== false
                      ? 'ok'
                      : 'hidden'
                  }">
                    ${
                      article.visible !== false
                        ? 'ظاهر'
                        : 'مخفي'
                    }
                  </span>

                  <span class="badge">
                    قراءات: ${article.views || 0}
                  </span>

                  <span class="badge">
                    ترتيب: ${(article.sort_order || 0) + 1}
                  </span>

                  ${
                    article.image_1
                      ? '<small> ✓ صورة المقال</small>'
                      : ''
                  }

                </div>

                <div class="item-actions">

                  <button onclick="editArticle('${article.id}')">
                    تعديل
                  </button>

                  <button onclick="toggleArticleVisible('${article.id}', ${article.visible !== false})">
                    ${
                      article.visible !== false
                        ? 'إخفاء'
                        : 'إظهار'
                    }
                  </button>

                  <button
                    onclick="moveArticle('${article.id}', -1)"
                    ${index === 0 ? 'disabled' : ''}
                  >
                    ▲
                  </button>

                  <button
                    onclick="moveArticle('${article.id}', 1)"
                    ${index === list.length - 1 ? 'disabled' : ''}
                  >
                    ▼
                  </button>

                  <button
                    class="danger"
                    onclick="del('articles','${article.id}')"
                  >
                    حذف
                  </button>

                </div>

              </div>

            `)
            .join('')
          :
          '<p>لا توجد مقالات بعد.</p>'
      }

    </div>

  `;
}

/* =========================================================
   FILE NAME
   ========================================================= */

function showFileName(
  inputId,
  outputId
) {

  const input =
    $(inputId);

  const output =
    $(outputId);

  if (!input || !output) {

    return;

  }

  const file =
    input.files?.[0];

  output.textContent =
    file
      ? `تم اختيار: ${file.name}`
      : 'لم يتم اختيار صورة';

}

/* =========================================================
   ADD ARTICLE
   ========================================================= */

function slugifyTitle(title) {

  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(
      /[^\p{L}\p{N}]+/gu,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );

}

async function addArticle() {

  const btn =
    $('saveArticleBtn');

  try {

    const title =
      $('atitle')?.value?.trim();

    const author =
      $('aauthor')?.value?.trim();

    const category =
      $('acat')?.value?.trim()
      || 'رؤى سينمائية';

    const content =
      $('acontent')?.value?.trim();

    if (!title) {
      alert('أدخل عنوان المقال.');
      return;
    }

    if (!content) {
      alert('أدخل نص المقال.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent =
        'جارٍ رفع الصور وحفظ المقال...';
    }

    const authorImageFile =
      $('authorImage')?.files?.[0] || null;

    const image1File =
      $('image1')?.files?.[0] || null;

    const image2File =
      $('image2')?.files?.[0] || null;

    const image3File =
      $('image3')?.files?.[0] || null;

    const authorImage =
      await upload('covers', authorImageFile);

    const image1 =
      await upload('covers', image1File);

    const image2 =
      await upload('covers', image2File);

    const image3 =
      await upload('covers', image3File);

    const slugInput =
      $('aslug')?.value?.trim() || '';

    const slug =
      slugifyTitle(
        slugInput || title
      ) ||
      `article-${Date.now()}`;

    const visible =
      $('avisible')?.checked === true;

    const fontFamily =
      $('afont')?.value || null;

    const nextOrder =
      D.articles.length
        ? Math.max(
            ...D.articles.map(
              x => x.sort_order || 0
            )
          ) + 1
        : 0;

    const {
      error
    } = await db
      .from('articles')
      .insert({

        title,
        slug,
        author,
        category,
        content,
        author_image: authorImage,
        image_1: image1,
        image_2: image2,
        image_3: image3,
        visible,
        sort_order: nextOrder,
        font_family: fontFamily

      });

    if (error) {
      throw error;
    }

    alert(
      'تم حفظ المقال ورفع الصور بنجاح.'
    );

    await load();
    show('articles');

  } catch (error) {

    console.error(
      'ARTICLE ERROR:',
      error
    );

    alert(
      'تعذر حفظ المقال:\n\n' +
      msgError(error)
    );

  } finally {

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'حفظ المقال';
    }

  }

}

async function updateArticle() {

  const btn =
    $('saveArticleBtn');

  try {

    const editing =
      D.editArticle;

    if (!editing) {
      return;
    }

    const title =
      $('atitle')?.value?.trim();

    const author =
      $('aauthor')?.value?.trim();

    const category =
      $('acat')?.value?.trim()
      || 'رؤى سينمائية';

    const content =
      $('acontent')?.value?.trim();

    if (!title) {
      alert('أدخل عنوان المقال.');
      return;
    }

    if (!content) {
      alert('أدخل نص المقال.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent =
        'جارٍ حفظ التعديلات...';
    }

    const slugInput =
      $('aslug')?.value?.trim();

    const slug =
      slugifyTitle(
        slugInput || title
      ) ||
      `article-${Date.now()}`;

    if (slug !== editing.slug) {

      const { data: dup } = await db
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .neq('id', editing.id)
        .maybeSingle();

      if (dup) {
        throw new Error(
          'هذا الرابط الثابت مستخدم في مقال آخر.'
        );
      }

    }

    /*
      الغائب يبقى كما هو:
      الصور تُحدَّث فقط عند اختيار
      ملف جديد، وإلا تبقى القديمة.
    */

    const patch = {

      title,
      author,
      category,
      content,
      slug,
      visible:
        $('avisible')?.checked === true,

      font_family:
        $('afont')?.value || null

    };

    const authorImageFile =
      $('authorImage')?.files?.[0] || null;

    const image1File =
      $('image1')?.files?.[0] || null;

    const image2File =
      $('image2')?.files?.[0] || null;

    const image3File =
      $('image3')?.files?.[0] || null;

    const authorImage =
      await upload('covers', authorImageFile);

    const image1 =
      await upload('covers', image1File);

    const image2 =
      await upload('covers', image2File);

    const image3 =
      await upload('covers', image3File);

    if (authorImage) {
      patch.author_image = authorImage;
    }

    if (image1) {
      patch.image_1 = image1;
    }

    if (image2) {
      patch.image_2 = image2;
    }

    if (image3) {
      patch.image_3 = image3;
    }

    const { error } = await db
      .from('articles')
      .update(patch)
      .eq('id', editing.id);

    if (error) {
      throw error;
    }

    alert(
      'تم حفظ التعديلات بنجاح.'
    );

    D.editArticle = null;

    await load();
    show('articles');

  } catch (error) {

    console.error(
      'UPDATE ERROR:',
      error
    );

    alert(
      'تعذر حفظ التعديلات:\n\n' +
      msgError(error)
    );

  } finally {

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'حفظ التعديلات';
    }

  }

}

function wrapSel(before, after) {

  const area =
    $('acontent');

  if (!area) {
    return;
  }

  const start =
    area.selectionStart;

  const end =
    area.selectionEnd;

  const selected =
    area.value.slice(start, end);

  area.setRangeText(
    before + selected + after,
    start,
    end,
    'end'
  );

  area.focus();

  updateArticlePreview();

}

function updateArticlePreview() {

  const box =
    $('articlePreviewBox');

  const area =
    $('acontent');

  if (!box || !area) {
    return;
  }

  box.innerHTML =
    renderPreviewText(area.value);

  const font =
    $('afont')?.value;

  box.style.fontFamily =
    font
      ? `'${font}','IBM Plex Sans Arabic',sans-serif`
      : '';

}

function renderPreviewText(content) {

  if (!content) {
    return '<p>لا يوجد نص بعد.</p>';
  }

  return String(content)
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(
      paragraph => `

        <p>
          ${
            paragraph
              .split('\n')
              .map(line => {

                let safe = esc(line);

                if (/^##[ \t]+/.test(line)) {

                  safe = safe
                    .replace(
                      /^##[ \t]+(.*)$/,
                      '<span class="pv-h">$1</span>'
                    );

                } else if (
                  /^>[ \t]?/.test(line) &&
                  line.trim()
                ) {

                  safe = safe
                    .replace(
                      /^&gt;[ \t]?(.*)$/,
                      '<span class="pv-q">$1</span>'
                    );

                }

                return safe;

              })
              .join('<br>')
              .replace(
                /\*\*([^*]+)\*\*/g,
                '<strong>$1</strong>'
              )
          }
        </p>

      `
    )
    .join('');

}

function editArticle(id) {

  D.editArticle =
    D.articles.find(
      x => String(x.id) === String(id)
    ) || null;

  show('articles');

  window.scrollTo({ top: 0 });

}

function cancelEditArticle() {

  D.editArticle = null;

  show('articles');

}

async function toggleArticleVisible(
  id,
  currentVisible
) {

  const nextVisible = !currentVisible;

  const { error } = await db
    .from('articles')
    .update({ visible: nextVisible })
    .eq('id', id);

  if (error) {
    alert(
      'تعذر تغيير حالة المقال:\n\n' +
      msgError(error)
    );
    return;
  }

  await load();
  show('articles');

}

async function moveArticle(id, dir) {

  const list =
    D.articles.slice().sort(
      (a, b) =>
        (a.sort_order || 0) -
        (b.sort_order || 0)
    );

  const i =
    list.findIndex(
      x => String(x.id) === String(id)
    );

  const j = i + dir;

  if (
    i < 0 ||
    j < 0 ||
    j >= list.length
  ) {
    return;
  }

  const a = list[i];
  const b = list[j];

  const orderA = a.sort_order || 0;
  const orderB = b.sort_order || 0;

  const { error: e1 } = await db
    .from('articles')
    .update({ sort_order: orderB })
    .eq('id', a.id);

  const { error: e2 } = await db
    .from('articles')
    .update({ sort_order: orderA })
    .eq('id', b.id);

  if (e1 || e2) {
    alert(
      'تعذر تغيير الترتيب:\n\n' +
      msgError(e1 || e2)
    );
  }

  await load();
  show('articles');

}

/* =========================================================
   SECTIONS UI
   ========================================================= */

function sectionsUI() {

  return `

    <div class="panel">

      <h2>
        إضافة قسم
      </h2>

      <div class="form">

        ${input(
          'sname',
          'اسم القسم'
        )}

        <textarea
          id="sdesc"
          placeholder="وصف القسم"
        ></textarea>

        ${input(
          'ssort',
          'الترتيب',
          'number'
        )}

        <button
          class="btn full"
          onclick="addSection()">

          حفظ القسم

        </button>

      </div>

    </div>

    <div class="panel">

      <h2>
        الأقسام
      </h2>

      ${
        D.sections.length

          ?

          D.sections
            .map(section => `

              <div class="item">

                <div>

                  <b>
                    ${esc(
                      section.name
                    )}
                  </b>

                  ${
                    section.description

                      ?

                      `
                        <br>
                        <small>
                          ${esc(
                            section.description
                          )}
                        </small>
                      `

                      :

                      ''
                  }

                </div>

                <button
                  class="danger"
                  onclick="del(
                    'sections',
                    '${section.id}'
                  )">

                  حذف

                </button>

              </div>

            `)
            .join('')

          :

          '<p>لا توجد أقسام بعد.</p>'
      }

    </div>

  `;

}

/* =========================================================
   ADD SECTION
   ========================================================= */

async function addSection() {

  const name =
    $('sname')
      ?.value
      ?.trim();

  if (!name) {

    alert(
      'أدخل اسم القسم.'
    );

    return;

  }

  const {
    error
  } = await db
    .from('sections')
    .insert({

      name:
        name,

      description:
        $('sdesc')
          ?.value
          || '',

      sort_order:
        Number(
          $('ssort')
            ?.value
        ) || 0

    });

  if (error) {

    alert(
      msgError(error)
    );

    return;

  }

  alert(
    'تم حفظ القسم.'
  );

  await load();

  show('sections');

}

/* =========================================================
   TEAM UI
   ========================================================= */

function teamUI() {

  return `

    <div class="panel">

      <h2>
        إضافة عضو هيئة تحرير
      </h2>

      <div class="form">

        ${input(
          'tname',
          'الاسم'
        )}

        ${input(
          'trole',
          'الصفة / الدور'
        )}

        <textarea
          id="tbio"
          placeholder="نبذة"
        ></textarea>

        <label class="upload-field">

          <span>
            صورة العضو
          </span>

          <input
            id="tphoto"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'tphoto',
                'tphotoName'
              )
            "
          >

          <small id="tphotoName">
            لم يتم اختيار صورة
          </small>

        </label>

        ${input(
          'tsort',
          'الترتيب',
          'number'
        )}

        <button
          class="btn full"
          onclick="addTeam()">

          حفظ العضو

        </button>

      </div>

    </div>

    <div class="panel">

      <h2>
        هيئة التحرير
      </h2>

      ${
        D.team.length

          ?

          D.team
            .map(member => `

              <div class="item">

                ${
                  member.image_url

                    ?

                    `
                      <img
                        class="thumb"
                        src="${esc(member.image_url)}"
                        alt="${esc(member.name)}"
                        loading="lazy"
                      >
                    `

                    :

                    ''
                }

                <div>

                  <b>
                    ${esc(
                      member.name
                    )}
                  </b>

                  <br>

                  <small>
                    ${esc(
                      member.role || ''
                    )}
                  </small>

                  ${
                    member.bio

                      ?

                      `
                        <br>
                        <small>
                          ${esc(
                            member.bio
                          )}
                        </small>
                      `

                      :

                      ''
                  }

                </div>

                <button
                  class="danger"
                  onclick="del(
                    'team',
                    '${member.id}'
                  )">

                  حذف

                </button>

              </div>

            `)
            .join('')

          :

          '<p>لا توجد بيانات بعد.</p>'
      }

    </div>

  `;

}

/* =========================================================
   ADD TEAM
   ========================================================= */

async function addTeam() {

  const name =
    $('tname')
      ?.value
      ?.trim();

  if (!name) {

    alert(
      'أدخل الاسم.'
    );

    return;

  }

  const photo =
    await upload(
      'covers',
      $('tphoto')
        ?.files
        ?.[0]
      || null
    );

  const {
    error
  } = await db
    .from('team')
    .insert({

      name:
        name,

      image_url:
        photo,

      role:
        $('trole')
          ?.value
          || '',

      bio:
        $('tbio')
          ?.value
          || '',

      sort_order:
        Number(
          $('tsort')
            ?.value
        ) || 0

    });

  if (error) {

    alert(
      msgError(error)
    );

    return;

  }

  alert(
    'تم حفظ عضو هيئة التحرير.'
  );

  await load();

  show('team');

}

/* =========================================================
   EDITORS UI
   ========================================================= */

function editorsUI() {

  return `

    <div class="panel">

      <h2>
        إضافة محرر
      </h2>

      <div class="form">

        ${input(
          'ename',
          'الاسم'
        )}

        ${input(
          'esurname',
          'اللقب'
        )}

        <textarea
          id="ebio"
          rows="4"
          placeholder="نبذة تعريفية عن المحرر"
        ></textarea>

        <label class="upload-field">

          <span>
            صورة المحرر
          </span>

          <input
            id="ephoto"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'ephoto',
                'ephotoName'
              )
            "
          >

          <small id="ephotoName">
            لم يتم اختيار صورة
          </small>

        </label>

        ${input(
          'esort',
          'الترتيب',
          'number'
        )}

        <button
          class="btn full"
          onclick="addEditor()">

          حفظ المحرر

        </button>

      </div>

    </div>

    <div class="panel">

      <h2>
        المحررون
      </h2>

      ${
        D.editors.length

          ?

          D.editors
            .map(editor => `

              <div class="item">

                ${
                  editor.image_url

                    ?

                    `
                      <img
                        class="thumb"
                        src="${esc(editor.image_url)}"
                        alt="${esc(
                          [editor.name,editor.surname]
                            .filter(Boolean)
                            .join(' ')
                        )}"
                        loading="lazy"
                      >
                    `

                    :

                    ''
                }

                <div>

                  <b>
                    ${esc(

                      [editor.name,editor.surname]
                        .filter(Boolean)
                        .join(' ')

                    )}
                  </b>

                  ${
                    editor.bio

                      ?

                      `
                        <br>
                        <small>
                          ${esc(editor.bio)}
                        </small>
                      `

                      :

                      ''
                  }

                </div>

                <button
                  class="danger"
                  onclick="del(
                    'editors',
                    '${editor.id}'
                  )">

                  حذف

                </button>

              </div>

            `)
            .join('')

          :

          '<p>لا توجد بيانات بعد.</p>'
      }

    </div>

  `;

}

/* =========================================================
   ADD EDITOR
   ========================================================= */

async function addEditor() {

  try {

    const name =
      $('ename')
        ?.value
        ?.trim();

    if (!name) {

      alert(
        'أدخل الاسم.'
      );

      return;

    }

    const photo =
      await upload(
        'covers',
        $('ephoto')
          ?.files
          ?.[0]
        || null
      );

    const {
      error
    } = await db
      .from('editors')
      .insert({

        name:
          name,

        surname:
          $('esurname')
            ?.value
            ?.trim()
          || '',

        bio:
          $('ebio')
            ?.value
            ?.trim()
          || '',

        image_url:
          photo,

        sort_order:
          Number(
            $('esort')
              ?.value
          ) || 0

      });

    if (error) {

      throw error;

    }

    alert(
      'تم حفظ المحرر.'
    );

    await load();

    show('editors');

  } catch (error) {

    console.error(
      'ADD EDITOR ERROR:',
      error
    );

    alert(
      'تعذر حفظ المحرر:\n\n' +
      msgError(error)
    );

  }

}

/* =========================================================
   SETTINGS UI
   ========================================================= */

function settingsUI() {

  const s =
    D.settings || {};

  return `

    <div class="panel">

      <h2>
        إعدادات الواجهة
      </h2>

      <div class="form">

        <input
          id="siteName"
          value="${esc(
            s.site_name || ''
          )}"
          placeholder="اسم الموقع"
        >

        <input
          id="heroTitle"
          value="${esc(
            s.hero_title || ''
          )}"
          placeholder="العنوان الرئيسي"
        >

        <textarea
          id="heroSubtitle"
          placeholder="وصف الواجهة"
        >${esc(
          s.hero_subtitle || ''
        )}</textarea>

        <textarea
          id="heroDescription"
          placeholder="الوصف الرئيسي"
        >${esc(
          s.hero_description || ''
        )}</textarea>

        <input
          id="aboutTitle"
          value="${esc(
            s.about_title || ''
          )}"
          placeholder="عنوان من نحن"
        >

        <textarea
          id="aboutText"
          placeholder="من نحن"
        >${esc(
          s.about_text || ''
        )}</textarea>

        <textarea
          id="aboutText2"
          placeholder="نص إضافي"
        >${esc(
          s.about_text_2 || ''
        )}</textarea>

        <input
          id="contact"
          value="${esc(
            s.contact_email || ''
          )}"
          placeholder="البريد الإلكتروني"
        >

        <input
          id="heroCoverUrl"
          value="${esc(
            s.hero_cover_url || ''
          )}"
          placeholder="رابط صورة الواجهة"
        >

        <label class="color-field">
          <span>لون العلامة (الأحمر)</span>
          <input
            id="accentColor"
            type="color"
            value="${esc(
              s.accent_color || '#a91618'
            )}"
          >
        </label>

        <input
          id="footerNote"
          value="${esc(
            s.footer_note || ''
          )}"
          placeholder="عبارة أسفل الموقع"
        >

        <select
          id="currentIssue"
        >

          <option value="">
            اختيار العدد الحالي
          </option>

          ${
            D.issues
              .map(issue => `

                <option
                  value="${issue.id}"
                  ${
                    s.current_issue_id === issue.id
                      ? 'selected'
                      : ''
                  }>

                  العدد
                  ${esc(
                    issue.issue_number
                  )}

                </option>

              `)
              .join('')
          }

        </select>

        <button
          class="btn full"
          onclick="saveSettings()">

          حفظ الإعدادات

        </button>

      </div>

    </div>

  `;

}

/* =========================================================
   SAVE SETTINGS
   ========================================================= */

async function saveSettings() {

  const {
    error
  } = await db
    .from('settings')
    .upsert({

      id:
        true,

      site_name:
        $('siteName')
          ?.value
        ||
        'ضد السينما !؟ | Contre Cinéma',

      hero_title:
        $('heroTitle')
          ?.value
          || '',

      hero_subtitle:
        $('heroSubtitle')
          ?.value
          || '',

      hero_description:
        $('heroDescription')
          ?.value
          || '',

      hero_cover_url:
        $('heroCoverUrl')
          ?.value
          || '',

      about_title:
        $('aboutTitle')
          ?.value
          || '',

      about_text:
        $('aboutText')
          ?.value
          || '',

      about_text_2:
        $('aboutText2')
          ?.value
          || '',

      contact_email:
        $('contact')
          ?.value
          || '',

      current_issue_id:
        $('currentIssue')
          ?.value
        || null,

      accent_color:
        $('accentColor')
          ?.value
        || null,

      footer_note:
        $('footerNote')
          ?.value
        || null

    });

  if (error) {

    alert(
      msgError(error)
    );

    return;

  }

  alert(
    'تم حفظ الإعدادات.'
  );

  await load();

  show('settings');

}

/* =========================================================
   DELETE
   ========================================================= */

async function del(
  table,
  id
) {

  const confirmed =
    confirm(
      'هل تريد حذف هذا العنصر؟'
    );

  if (!confirmed) {

    return;

  }

  const {
    error
  } = await db
    .from(table)
    .delete()
    .eq(
      'id',
      id
    );

  if (error) {

    alert(
      msgError(error)
    );

    return;

  }

  alert(
    'تم الحذف.'
  );

  await load();

  const tab =
    table === 'issues'
      ? 'issues'
      : table === 'articles'
        ? 'articles'
        : table === 'sections'
          ? 'sections'
          : table === 'team'
            ? 'team'
            : table === 'editors'
              ? 'editors'
              : 'dashboard';

  show(tab);

}

/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    getElements();

    setupAuth();

    setupNavigation();

    boot();

  }
);
/* =========================================================
   تنسيق الخطوط والأسطر والعناوين داخل «إعدادات الواجهة»
   الصق هذا الكود في آخر ملف admin.js (بعد آخر سطر)
   ========================================================= */

const CC_TY_FONT_CHOICES = [
  ['', 'الافتراضي (بدون تغيير)'],
  ['IBM Plex Sans Arabic', 'IBM Plex Sans Arabic'],
  ['Noto Naskh Arabic', 'Noto Naskh Arabic (نسخ)'],
  ['Cairo', 'Cairo'],
  ['Tajawal', 'Tajawal'],
  ['Amiri', 'Amiri (تقليدي)'],
  ['AlJazeera', 'خط الجزيرة (يحتاج رفع ملفاته)']
];

const CC_TY_FONT_CSS = {
  'IBM Plex Sans Arabic': "'IBM Plex Sans Arabic',sans-serif",
  'Noto Naskh Arabic': "'Noto Naskh Arabic',serif",
  'Cairo': "'Cairo',sans-serif",
  'Tajawal': "'Tajawal',sans-serif",
  'Amiri': "'Amiri',serif",
  'AlJazeera': "'AlJazeera','Cairo',sans-serif"
};

function ccTyHTML(s) {

  const t = (s && s.typography) || {};

  const pick = (obj, key, def) =>
    obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== ''
      ? obj[key]
      : def;

  const fontSel = (id, val) => `
    <select id="${id}">
      ${CC_TY_FONT_CHOICES.map(([v, l]) => `
        <option value="${esc(v)}" ${v === val ? 'selected' : ''}>
          ${esc(l)}
        </option>`).join('')}
    </select>`;

  const alignSel = (id, val) => `
    <select id="${id}">
      ${[
        ['right', 'يمين'],
        ['justify', 'ضبط الأطراف'],
        ['center', 'وسط'],
        ['left', 'يسار']
      ].map(([v, l]) => `
        <option value="${v}" ${v === val ? 'selected' : ''}>${l}</option>`).join('')}
    </select>`;

  const weightSel = (id, val) => `
    <select id="${id}">
      ${[
        ['400', 'عادي 400'],
        ['500', 'متوسط 500'],
        ['600', 'شبه غليظ 600'],
        ['700', 'غليظ 700'],
        ['800', 'غليظ جدًا 800'],
        ['900', 'أغلظ 900']
      ].map(([v, l]) => `
        <option value="${v}" ${v === String(val) ? 'selected' : ''}>${l}</option>`).join('')}
    </select>`;

  const num = (id, val, step = 1) => `
    <input id="${id}" type="number" step="${step}"
      inputmode="decimal" value="${esc(val)}">`;

  const pair = (label, idD, idM, d, m) => `
    <div class="fmt-head">${label}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <label>الحاسوب (px) ${num(idD, d)}</label>
      <label>الهاتف (px) ${num(idM, m)}</label>
    </div>`;

  return `
    <div oninput="ccTyPreview()" onchange="ccTyPreview()">

      <div class="fmt-head">تنسيق الخطوط والأسطر</div>

      <label>
        خط العناوين (كل الموقع)
        ${fontSel('ty_hf', pick(t, 'headingFont', ''))}
      </label>

      <label>
        خط النصوص (كل الموقع)
        ${fontSel('ty_bf', pick(t, 'bodyFont', ''))}
      </label>

      <label>
        سماكة العناوين
        ${weightSel('ty_hw', pick(t, 'headingWeight', '700'))}
      </label>

      ${pair('عنوان الواجهة', 'ty_ht_d', 'ty_ht_m',
        pick(t.heroTitle, 'd', 44), pick(t.heroTitle, 'm', 30))}

      ${pair('نص الواجهة (الوصف)', 'ty_hp_d', 'ty_hp_m',
        pick(t.heroText, 'd', 18), pick(t.heroText, 'm', 16))}

      <label>
        ارتفاع السطر في الواجهة (1.6 مضغوط — 2.4 واسع)
        ${num('ty_hl', pick(t, 'heroLine', 2), 0.1)}
      </label>

      <label>
        محاذاة نص الواجهة
        ${alignSel('ty_ha', pick(t, 'heroAlign', 'right'))}
      </label>

      ${pair('عنوان من نحن', 'ty_at_d', 'ty_at_m',
        pick(t.aboutTitle, 'd', 48), pick(t.aboutTitle, 'm', 32))}

      ${pair('نص من نحن', 'ty_ap_d', 'ty_ap_m',
        pick(t.aboutText, 'd', 18), pick(t.aboutText, 'm', 16))}

      <label>
        ارتفاع السطر في من نحن
        ${num('ty_al', pick(t, 'aboutLine', 2.1), 0.1)}
      </label>

      <label>
        محاذاة نص من نحن
        ${alignSel('ty_aa', pick(t, 'aboutAlign', 'right'))}
      </label>

      <label class="check-field">
        <input id="ty_kb" type="checkbox"
          ${t.keepBreaks === false ? '' : 'checked'}>
        <span>
          احتفظ بالأسطر كما كتبتها (السطر الجديد يظهر في الموقع)
        </span>
      </label>

      <div class="fmt-head">معاينة (بحجم الهاتف)</div>
      <div id="ty_preview"
        style="border:1px solid #d8d2ca;padding:14px;background:#fff">
        <h4>نقرأ الفيلم، ونفكك الصورة</h4>
        <p>ها نحن في العدد الحادي عشر، والحلم الجميل مستمر؛
        نقف اليوم على أعتاب إتمام عام من هذه التجربة المستقلة.</p>
      </div>

    </div>
  `;
}

function ccTyPreview() {

  const box = document.getElementById('ty_preview');

  if (!box) {
    return;
  }

  const v = id => (document.getElementById(id) || {}).value;

  const hf =
    CC_TY_FONT_CSS[v('ty_hf')] ||
    "'Noto Naskh Arabic',serif";

  const bf =
    CC_TY_FONT_CSS[v('ty_bf')] ||
    "'IBM Plex Sans Arabic',sans-serif";

  const h = box.querySelector('h4');
  const p = box.querySelector('p');

  if (h) {
    h.style.cssText =
      `font-family:${hf};` +
      `font-weight:${v('ty_hw') || 700};` +
      `font-size:${v('ty_ht_m') || 30}px;` +
      'line-height:1.3;margin:0 0 8px';
  }

  if (p) {
    p.style.cssText =
      `font-family:${bf};` +
      `font-size:${v('ty_hp_m') || 16}px;` +
      `line-height:${v('ty_hl') || 2};` +
      `text-align:${v('ty_ha') || 'right'};` +
      'margin:0;white-space:pre-line';
  }

}

function ccReadTypography() {

  const el = id => document.getElementById(id);

  const v = id => (el(id) || {}).value;

  const n = id => {
    const x = parseFloat(v(id));
    return Number.isFinite(x) ? x : null;
  };

  return {

    headingFont: v('ty_hf') || '',
    bodyFont: v('ty_bf') || '',
    headingWeight: v('ty_hw') || '700',

    heroTitle: { d: n('ty_ht_d'), m: n('ty_ht_m') },
    heroText: { d: n('ty_hp_d'), m: n('ty_hp_m') },
    aboutTitle: { d: n('ty_at_d'), m: n('ty_at_m') },
    aboutText: { d: n('ty_ap_d'), m: n('ty_ap_m') },

    heroLine: n('ty_hl'),
    aboutLine: n('ty_al'),

    heroAlign: v('ty_ha') || 'right',
    aboutAlign: v('ty_aa') || 'right',

    keepBreaks: !!(el('ty_kb') || {}).checked

  };

}

/* ---- إدخال اللوحة داخل نموذج الإعدادات ---- */
const __ccOrigSettingsUI = settingsUI;

settingsUI = function () {

  const html = __ccOrigSettingsUI();

  const block = ccTyHTML(D.settings || {});

  const re =
    /<button\s+class="btn full"\s+onclick="saveSettings\(\)">/;

  const out = html.replace(re, m => block + m);

  if (out === html) {
    return html +
      '<div class="panel"><div class="form">' +
      block +
      '</div></div>';
  }

  return out;

};

/* ---- حفظ التنسيق مع الإعدادات ---- */
const __ccOrigSaveSettings = saveSettings;

saveSettings = async function () {

  const typography = ccReadTypography();

  await __ccOrigSaveSettings();

  try {

    const { error } = await db
      .from('settings')
      .update({ typography })
      .eq('id', true);

    if (error) {
      throw error;
    }

    await load();

    show('settings');

  } catch (error) {

    console.error('TYPOGRAPHY SAVE ERROR:', error);

    alert(
      'تم حفظ الإعدادات، لكن تعذر حفظ تنسيق الخطوط:\n\n' +
      msgError(error) +
      '\n\nتأكد من تنفيذ كود SQL الخاص بعمود typography في Supabase.'
    );

  }

};

/* ---- تحديث المعاينة عند فتح تبويب الإعدادات ---- */
const __ccOrigShow = show;

show = function (tab) {

  __ccOrigShow(tab);

  if (tab === 'settings') {
    ccTyPreview();
  }

};
/* =========================================================
   رفع الصور وملفات PDF إلى GitHub بدل Supabase Storage
   ========================================================= */

const CC_GH_REPO = 'contrecinema/contrecinema.github.io';
const CC_GH_BRANCH = 'main';
const CC_SITE_URL = 'https://contrecinema.com';
const CC_GH_KEY = 'cc_gh_token';

function ccGhToken(forcePrompt) {
  let token = '';
  try {
    token = localStorage.getItem(CC_GH_KEY) || '';
  } catch (e) {}
  if (token && !forcePrompt) return token;
  token = (
    prompt('الصق مفتاح GitHub (يُحفظ في هذا المتصفح فقط):') || ''
  ).trim();
  if (!token) throw new Error('لم يتم إدخال مفتاح GitHub.');
  if (!/^(ghp_|github_pat_)/.test(token)) {
    throw new Error('المفتاح غير صحيح، يجب أن يبدأ بـ ghp_');
  }
  try {
    localStorage.setItem(CC_GH_KEY, token);
  } catch (e) {}
  return token;
}

function ccToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('تعذر قراءة الملف.'));
    r.readAsDataURL(blob);
  });
}

async function ccCompressImage(file) {
  if (
    !/^image\/(jpeg|png|webp)$/.test(file.type) ||
    file.size < 800 * 1024
  ) {
    return file;
  }
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', 0.85)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '') + '.jpg',
      { type: 'image/jpeg' }
    );
  } catch (e) {
    return file;
  }
}

upload = async function (bucket, file) {
  if (!file) return null;

  const f = bucket === 'covers' ? await ccCompressImage(file) : file;
  const safeName = f.name.replace(/[^\w.\-]/g, '_');
  const name =
    Date.now() + '-' +
    Math.random().toString(36).substring(2, 8) + '-' +
    safeName;
  const path = 'media/' + bucket + '/' + name;
  const content = await ccToBase64(f);

  let lastError = 'خطأ غير معروف';

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = ccGhToken(attempt > 0);
    const res = await fetch(
      'https://api.github.com/repos/' + CC_GH_REPO + '/contents/' + path,
      {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'media: ' + name,
          content: content,
          branch: CC_GH_BRANCH
        })
      }
    );
    if (res.ok) return CC_SITE_URL + '/' + path;

    const data = await res.json().catch(() => ({}));
    lastError = res.status + ' ' + (data.message || '');

    if (res.status === 401) {
      try {
        localStorage.removeItem(CC_GH_KEY);
      } catch (e) {}
      continue;
    }
    break;
  }

  throw new Error('تعذر رفع الملف إلى GitHub: ' + lastError);
};
/* =========================================================
   معرض صور المقال: حتى 10 صور مع تعريف اختياري لكل صورة
   الصق هذا الكود في آخر ملف admin.js (بعد آخر سطر)
   ========================================================= */

const CC_MAX_IMGS = 10;
let CC_IMGS = [];

/* ---- تهيئة القائمة: من الحقل الجديد، أو من الصور القديمة الثلاث ---- */
function ccInitImgs(editing) {

  if (!editing) {
    return [];
  }

  if (Array.isArray(editing.images) && editing.images.length) {
    return editing.images.map(x => ({
      url: (x && x.url) || '',
      caption: (x && x.caption) || '',
      file: null,
      preview: ''
    }));
  }

  return [editing.image_1, editing.image_2, editing.image_3]
    .filter(Boolean)
    .map(u => ({ url: u, caption: '', file: null, preview: '' }));

}

/* ---- واجهة المعرض ---- */
function ccGalleryHTML() {

  const items = CC_IMGS.map((it, i) => {

    const src = it.preview || it.url;

    return `
      <div style="border:1px solid #d8d2ca;padding:10px;margin:0 0 12px">

        <b>
          صورة ${i + 1}
          ${i === 0 ? '(تظهر تحت العنوان)' : ''}
        </b>

        ${
          src
            ? `<img src="${esc(src)}" alt=""
                 style="display:block;max-width:100%;max-height:160px;margin:8px 0">`
            : ''
        }

        <input
          type="file"
          accept="image/*"
          onchange="ccImgFile(${i}, this)"
        >

        <input
          type="text"
          value="${esc(it.caption)}"
          placeholder="تعريف الصورة (اختياري)"
          oninput="ccImgCaption(${i}, this.value)"
        >

        <div class="item-actions" style="margin-top:8px">
          <button type="button" onclick="ccImgMove(${i}, -1)" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" onclick="ccImgMove(${i}, 1)" ${i === CC_IMGS.length - 1 ? 'disabled' : ''}>▼</button>
          <button type="button" class="danger" onclick="ccImgDel(${i})">حذف الصورة</button>
        </div>

      </div>
    `;

  }).join('');

  return items + `
    <button
      type="button"
      class="btn"
      onclick="ccImgAdd()"
      ${CC_IMGS.length >= CC_MAX_IMGS ? 'disabled' : ''}>
      ＋ إضافة صورة (${CC_IMGS.length}/${CC_MAX_IMGS})
    </button>
  `;

}

function ccRefreshGallery() {

  const box = $('ccGallery');

  if (box) {
    box.innerHTML = ccGalleryHTML();
  }

}

function ccImgAdd() {

  if (CC_IMGS.length >= CC_MAX_IMGS) {
    return;
  }

  CC_IMGS.push({ url: '', caption: '', file: null, preview: '' });

  ccRefreshGallery();

}

function ccImgDel(i) {

  const it = CC_IMGS[i];

  if (!it) {
    return;
  }

  if (it.preview) {
    URL.revokeObjectURL(it.preview);
  }

  CC_IMGS.splice(i, 1);

  ccRefreshGallery();

}

function ccImgMove(i, dir) {

  const j = i + dir;

  if (j < 0 || j >= CC_IMGS.length) {
    return;
  }

  const tmp = CC_IMGS[i];

  CC_IMGS[i] = CC_IMGS[j];
  CC_IMGS[j] = tmp;

  ccRefreshGallery();

}

function ccImgCaption(i, value) {

  if (CC_IMGS[i]) {
    CC_IMGS[i].caption = value;
  }

}

function ccImgFile(i, inputEl) {

  const f = inputEl.files && inputEl.files[0];

  if (!f || !CC_IMGS[i]) {
    return;
  }

  if (CC_IMGS[i].preview) {
    URL.revokeObjectURL(CC_IMGS[i].preview);
  }

  CC_IMGS[i].file = f;
  CC_IMGS[i].preview = URL.createObjectURL(f);

  ccRefreshGallery();

}

/* ---- استبدال حقول الصور الثلاث بالمعرض داخل نموذج المقال ---- */
const __ccOrigArticlesUI = articlesUI;

articlesUI = function () {

  CC_IMGS = ccInitImgs(D.editArticle || null);

  let html = __ccOrigArticlesUI();

  const block = title =>
    new RegExp(
      '<label class="upload-field">\\s*<span>' +
      title +
      '</span>[\\s\\S]*?</label>'
    );

  html = html.replace(
    block('الصورة الأولى للمقال'),
    '<div class="fmt-head">صور المقال (حتى 10)</div>' +
    '<small>الصورة الأولى تظهر تحت العنوان، والبقية تتوزع بين الفقرات.</small>' +
    '<div id="ccGallery">' + ccGalleryHTML() + '</div>'
  );

  html = html
    .replace(block('الصورة الثانية للمقال'), '')
    .replace(block('الصورة الثالثة للمقال'), '');

  return html;

};

/* ---- حفظ المقال مع المعرض ---- */
async function ccSaveArticle(isEdit) {

  const btn = $('saveArticleBtn');
  const editing = isEdit ? D.editArticle : null;

  if (isEdit && !editing) {
    return;
  }

  const btnLabel = btn ? btn.textContent : '';

  try {

    const title = $('atitle')?.value?.trim();
    const author = $('aauthor')?.value?.trim();
    const category = $('acat')?.value?.trim() || 'رؤى سينمائية';
    const content = $('acontent')?.value?.trim();

    if (!title) {
      alert('أدخل عنوان المقال.');
      return;
    }

    if (!content) {
      alert('أدخل نص المقال.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جارٍ رفع الصور وحفظ المقال...';
    }

    const slugInput = $('aslug')?.value?.trim() || '';

    const slug =
      slugifyTitle(slugInput || title) ||
      `article-${Date.now()}`;

    if (editing && slug !== editing.slug) {

      const { data: dup } = await db
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .neq('id', editing.id)
        .maybeSingle();

      if (dup) {
        throw new Error('هذا الرابط الثابت مستخدم في مقال آخر.');
      }

    }

    /* رفع الصور واحدة بعد الأخرى (حتى لا تتعارض عمليات GitHub) */
    const images = [];

    for (const it of CC_IMGS) {

      let url = it.url || '';

      if (it.file) {
        url = await upload('covers', it.file);
      }

      if (url) {
        images.push({
          url: url,
          caption: String(it.caption || '').trim()
        });
      }

    }

    const authorImage = await upload(
      'covers',
      $('authorImage')?.files?.[0] || null
    );

    const row = {
      title,
      slug,
      author,
      category,
      content,
      visible: $('avisible')?.checked === true,
      font_family: $('afont')?.value || null,
      images: images,
      image_1: images[0] ? images[0].url : null,
      image_2: images[1] ? images[1].url : null,
      image_3: images[2] ? images[2].url : null
    };

    if (editing) {

      if (authorImage) {
        row.author_image = authorImage;
      }

      const { error } = await db
        .from('articles')
        .update(row)
        .eq('id', editing.id);

      if (error) {
        throw error;
      }

      D.editArticle = null;

    } else {

      const nextOrder = D.articles.length
        ? Math.max(...D.articles.map(x => x.sort_order || 0)) + 1
        : 0;

      const { error } = await db
        .from('articles')
        .insert({
          ...row,
          author_image: authorImage,
          sort_order: nextOrder
        });

      if (error) {
        throw error;
      }

    }

    alert('تم حفظ المقال بنجاح.');

    await load();
    show('articles');

  } catch (error) {

    console.error('ARTICLE SAVE ERROR:', error);

    alert(
      'تعذر حفظ المقال:\n\n' +
      msgError(error)
    );

  } finally {

    const b = $('saveArticleBtn');

    if (b && b === btn) {
      b.disabled = false;
      b.textContent = btnLabel;
    }

  }

}

const __ccOrigAddArticle = addArticle;
const __ccOrigUpdateArticle = updateArticle;

addArticle = function () {
  return $('ccGallery')
    ? ccSaveArticle(false)
    : __ccOrigAddArticle();
};

updateArticle = function () {
  return $('ccGallery')
    ? ccSaveArticle(true)
    : __ccOrigUpdateArticle();
};
