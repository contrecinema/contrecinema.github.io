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
  'sb_publishable_poEM-eY7byTT2UBEwZMLmQ_GGUWLnfm';

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

function articlesUI() {

  return `

    <div class="panel article-form-panel">

      <h2>
        إضافة مقال
      </h2>

      <p class="form-note">
        عنوان المقال، الكاتب، القسم،
        صورة الكاتب، ثلاث صور للمقال
        ونص المقال.
      </p>

      <div class="form">

        <label>

          عنوان المقال

          <input
            id="atitle"
            type="text"
            placeholder="عنوان المقال"
          >

        </label>

        <label>

          اسم الكاتب

          <input
            id="aauthor"
            type="text"
            placeholder="اسم الكاتب"
          >

        </label>

        <label>

          القسم

          <input
            id="acat"
            type="text"
            placeholder="مثال: مراجعات"
          >

        </label>

        <label class="upload-field">

          <span>
            صورة الكاتب
          </span>

          <input
            id="authorImage"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'authorImage',
                'authorImageName'
              )
            "
          >

          <small id="authorImageName">
            لم يتم اختيار صورة
          </small>

        </label>

        <label class="upload-field">

          <span>
            الصورة الأولى للمقال
          </span>

          <small>
            تظهر مباشرة تحت العنوان والكاتب.
          </small>

          <input
            id="image1"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'image1',
                'image1Name'
              )
            "
          >

          <small id="image1Name">
            لم يتم اختيار صورة
          </small>

        </label>

        <label>

          <span>
            نص المقال
          </span>

          <textarea
            id="acontent"
            rows="18"
            placeholder="اكتب نص المقال هنا..."
          ></textarea>

        </label>

        <label class="upload-field">

          <span>
            الصورة الثانية للمقال
          </span>

          <small>
            ستظهر داخل المقال.
          </small>

          <input
            id="image2"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'image2',
                'image2Name'
              )
            "
          >

          <small id="image2Name">
            لم يتم اختيار صورة
          </small>

        </label>

        <label class="upload-field">

          <span>
            الصورة الثالثة للمقال
          </span>

          <small>
            ستظهر قرب نهاية المقال.
          </small>

          <input
            id="image3"
            type="file"
            accept="image/*"
            onchange="
              showFileName(
                'image3',
                'image3Name'
              )
            "
          >

          <small id="image3Name">
            لم يتم اختيار صورة
          </small>

        </label>

        <button
          class="btn full"
          id="saveArticleBtn"
          onclick="addArticle()">

          حفظ المقال

        </button>

      </div>

    </div>

    <div class="panel">

      <h2>
        المقالات المنشورة
      </h2>

      ${
        D.articles.length

          ?

          D.articles
            .map(article => `

              <div class="item">

                <div>

                  <b>
                    ${esc(
                      article.title
                    )}
                  </b>

                  <br>

                  <small>

                    ${esc(
                      article.author || ''
                    )}

                    —

                    ${esc(
                      article.category || ''
                    )}

                  </small>

                  <br>

                  ${
                    article.image_1

                      ?

                      `
                        <small>
                          ✓ صورة المقال
                        </small>
                      `

                      :

                      ''
                  }

                </div>

                <button
                  class="danger"
                  onclick="del(
                    'articles',
                    '${article.id}'
                  )">

                  حذف

                </button>

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

async function addArticle() {

  const btn =
    $('saveArticleBtn');

  try {

    const title =
      $('atitle')
        ?.value
        ?.trim();

    const author =
      $('aauthor')
        ?.value
        ?.trim();

    const category =
      $('acat')
        ?.value
        ?.trim()
      ||
      'رؤى سينمائية';

    const content =
      $('acontent')
        ?.value
        ?.trim();

    if (!title) {

      alert(
        'أدخل عنوان المقال.'
      );

      return;

    }

    if (!content) {

      alert(
        'أدخل نص المقال.'
      );

      return;

    }

    if (btn) {

      btn.disabled = true;

      btn.textContent =
        'جارٍ رفع الصور وحفظ المقال...';

    }

    const authorImageFile =
      $('authorImage')
        ?.files
        ?.[0]
      || null;

    const image1File =
      $('image1')
        ?.files
        ?.[0]
      || null;

    const image2File =
      $('image2')
        ?.files
        ?.[0]
      || null;

    const image3File =
      $('image3')
        ?.files
        ?.[0]
      || null;

    const authorImage =
      await upload(
        'covers',
        authorImageFile
      );

    const image1 =
      await upload(
        'covers',
        image1File
      );

    const image2 =
      await upload(
        'covers',
        image2File
      );

    const image3 =
      await upload(
        'covers',
        image3File
      );

    const slug =
      title
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

    const finalSlug =
      slug ||
      `article-${Date.now()}`;

    const {
      error
    } = await db
      .from('articles')
      .insert({

        title:
          title,

        slug:
          finalSlug,

        author:
          author,

        category:
          category,

        content:
          content,

        author_image:
          authorImage,

        image_1:
          image1,

        image_2:
          image2,

        image_3:
          image3

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

      btn.textContent =
        'حفظ المقال';

    }

  }

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

      image_url:
        photo,

      sort_order:
        Number(
          $('esort')
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
    'تم حفظ المحرر.'
  );

  await load();

  show('editors');

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
