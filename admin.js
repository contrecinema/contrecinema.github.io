Const SUPABASE_URL='https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY='sb_publishable_poEM-eY7byTT2UBEwZMLmQ_GGUWLnfm';

const db=supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let D={
  issues:[],
  articles:[],
  sections:[],
  team:[],
  settings:null
};

const $=id=>document.getElementById(id);

function esc(v){
  return String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function msgError(e){
  return e?.message ||
         e?.error_description ||
         'حدث خطأ غير معروف';
}


/* =========================
   ADMIN CHECK
========================= */

async function isAdmin(){

  const {
    data:{user},
    error
  }=await db.auth.getUser();

  if(error || !user){
    return false;
  }

  const {
    data,
    error:adminError
  }=await db
    .from('admins')
    .select('user_id')
    .eq('user_id',user.id)
    .maybeSingle();

  if(adminError){
    console.error(adminError);
    return false;
  }

  return !!data;
}


/* =========================
   BOOT
========================= */

async function boot(){

  try{

    const {
      data:{session}
    }=await db.auth.getSession();

    if(session && await isAdmin()){

      if(login) login.hidden=true;
      if(panel) panel.hidden=false;

      await load();
      show('dashboard');

    }else{

      if(login) login.hidden=false;
      if(panel) panel.hidden=true;

    }

  }catch(e){

    console.error(e);

    if(login) login.hidden=false;
    if(panel) panel.hidden=true;

    if(msg){
      msg.textContent=msgError(e);
    }

  }
}


/* =========================
   LOGIN
========================= */

if(loginBtn){

  loginBtn.onclick=async()=>{

    msg.textContent='جارٍ تسجيل الدخول...';

    const {
      error
    }=await db.auth.signInWithPassword({

      email:email.value.trim(),

      password:password.value

    });

    if(error){

      msg.textContent=msgError(error);

      return;
    }

    await boot();

  };

}


/* =========================
   LOGOUT
========================= */

if(logout){

  logout.onclick=async()=>{

    await db.auth.signOut();

    location.reload();

  };

}


/* =========================
   NAVIGATION
========================= */

document
  .querySelectorAll('[data-tab]')
  .forEach(b=>{

    b.onclick=()=>show(b.dataset.tab);

  });


/* =========================
   LOAD DATA
========================= */

async function load(){

  const [
    a,
    b,
    c,
    d,
    e
  ]=await Promise.all([

    db
      .from('issues')
      .select('*')
      .order(
        'issue_number',
        {ascending:false}
      ),

    db
      .from('articles')
      .select('*')
      .order(
        'created_at',
        {ascending:false}
      ),

    db
      .from('sections')
      .select('*')
      .order(
        'sort_order',
        {ascending:true}
      ),

    db
      .from('team')
      .select('*')
      .order(
        'sort_order',
        {ascending:true}
      ),

    db
      .from('settings')
      .select('*')
      .eq('id',true)
      .maybeSingle()

  ]);

  if(a.error) throw a.error;
  if(b.error) throw b.error;
  if(c.error) throw c.error;
  if(d.error) throw d.error;
  if(e.error) throw e.error;

  D={

    issues:a.data||[],

    articles:b.data||[],

    sections:c.data||[],

    team:d.data||[],

    settings:e.data||null

  };

  if(stats){

    stats.textContent=
      `الأعداد ${D.issues.length} · `+
      `المقالات ${D.articles.length} · `+
      `الأقسام ${D.sections.length} · `+
      `الهيئة ${D.team.length}`;

  }

}


/* =========================
   TABS
========================= */

function show(tab){

  document
    .querySelectorAll('aside button')
    .forEach(b=>{

      b.classList.toggle(
        'active',
        b.dataset.tab===tab
      );

    });

  const views={

    dashboard:dashboardUI,

    issues:issuesUI,

    articles:articlesUI,

    sections:sectionsUI,

    team:teamUI,

    settings:settingsUI

  };

  if(workspace && views[tab]){

    workspace.innerHTML=
      views[tab]();

  }

}


/* =========================
   INPUT HELPER
========================= */

const input=(
  id,
  ph,
  type='text'
)=>
  `<input
      id="${id}"
      type="${type}"
      placeholder="${ph}"
   >`;


/* =========================
   STORAGE UPLOAD
========================= */

async function upload(bucket,file){

  if(!file){
    return null;
  }

  const safeName=file.name
    .replace(/[^\w.\-]/g,'_');

  const path=
    Date.now()+
    '-' +
    Math.random()
      .toString(36)
      .substring(2,8)+
    '-' +
    safeName;

  const {
    error
  }=await db
    .storage
    .from(bucket)
    .upload(
      path,
      file,
      {
        upsert:false,
        contentType:file.type
      }
    );

  if(error){
    throw error;
  }

  return db
    .storage
    .from(bucket)
    .getPublicUrl(path)
    .data
    .publicUrl;
}


/* =========================
   DASHBOARD
========================= */

function dashboardUI(){

  return `

    <div class="panel">

      <h1>مرحباً بك</h1>

      <p>
        من هنا تدير موقع مجلة
        «ضد السينما !؟» بالكامل.
        أضف الأعداد والمقالات والأقسام
        وهيئة التحرير والإعدادات.
      </p>

    </div>


    <div class="stat-grid">

      <div class="stat">
        <b>${D.issues.length}</b>
        <span>عدد منشور</span>
      </div>

      <div class="stat">
        <b>${D.articles.length}</b>
        <span>مقال</span>
      </div>

      <div class="stat">
        <b>${D.sections.length}</b>
        <span>قسم</span>
      </div>

      <div class="stat">
        <b>${D.team.length}</b>
        <span>عضو هيئة تحرير</span>
      </div>

    </div>

  `;

}


/* =========================
   ISSUES
========================= */

function issuesUI(){

  return `

    <div class="panel">

      <h2>إضافة عدد</h2>

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

      <h2>الأعداد المنشورة</h2>

      ${
        D.issues.map(x=>`

          <div class="item">

            <div>

              <b>
                العدد
                ${esc(x.issue_number)}
              </b>

              —
              ${esc(x.title||'')}

            </div>


            <div class="actions">

              ${
                x.pdf_url

                ?

                `<a
                  href="${esc(x.pdf_url)}"
                  target="_blank">

                  PDF

                </a>`

                :

                ''
              }


              <button
                class="danger"
                onclick="del(
                  'issues',
                  '${x.id}'
                )">

                حذف

              </button>

            </div>

          </div>

        `).join('')

        ||

        '<p>لا توجد أعداد بعد.</p>'

      }

    </div>

  `;

}


/* =========================
   ADD ISSUE
========================= */

async function addIssue(){

  try{

    const coverFile=
      $('cover')?.files?.[0];

    const pdfFile=
      $('pdf')?.files?.[0];


    const coverUrl=
      await upload(
        'covers',
        coverFile
      );


    const pdfUrl=
      await upload(
        'pdfs',
        pdfFile
      );


    const {
      error
    }=await db
      .from('issues')
      .insert({

        issue_number:
          Number($('inum').value),

        title:
          $('ititle').value,

        publication_date:
          $('idate').value,

        cover_image:
          coverUrl,

        pdf_url:
          pdfUrl

      });


    if(error){
      throw error;
    }


    alert(
      'تمت إضافة العدد بنجاح'
    );


    await load();

    show('issues');


  }catch(e){

    alert(
      msgError(e)
    );

  }

}


/* ==================================================
   ARTICLES
================================================== */

function articlesUI(){

  return `

    <div class="panel article-form-panel">

      <h2>إضافة مقال</h2>

      <p class="form-note">
        أضف عنوان المقال، الكاتب، القسم،
        النص، ثم ارفع صورة الكاتب وثلاث صور للمقال.
      </p>


      <div class="form">


        <!-- TITLE -->

        <label>
          عنوان المقال

          <input
            id="atitle"
            type="text"
            placeholder="عنوان المقال"
          >

        </label>


        <!-- AUTHOR -->

        <label>
          اسم الكاتب

          <input
            id="aauthor"
            type="text"
            placeholder="اسم الكاتب"
          >

        </label>


        <!-- CATEGORY -->

        <label>
          القسم

          <input
            id="acat"
            type="text"
            placeholder="مثال: مراجعات"
          >

        </label>


        <!-- AUTHOR IMAGE -->

        <label class="upload-field">

          <span>
            صورة الكاتب
          </span>

          <input
            id="authorImage"
            type="file"
            accept="image/*"
            onchange="showFileName(
              'authorImage',
              'authorImageName'
            )"
          >

          <small id="authorImageName">
            لم يتم اختيار صورة
          </small>

        </label>


        <!-- IMAGE 1 -->

        <label class="upload-field">

          <span>
            الصورة الأولى للمقال
          </span>

          <small>
            تظهر مباشرة تحت العنوان واسم الكاتب
          </small>

          <input
            id="image1"
            type="file"
            accept="image/*"
            onchange="showFileName(
              'image1',
              'image1Name'
            )"
          >

          <small id="image1Name">
            لم يتم اختيار صورة
          </small>

        </label>


        <!-- CONTENT -->

        <label>

          <span>
            نص المقال
          </span>

          <textarea
            id="acontent"
            rows="18"
            placeholder="اكتب نص المقال هنا...

افصل بين الفقرات بترك سطر فارغ.

ستظهر الصورة الثانية تلقائياً في منتصف المقال،
والصورة الثالثة قبل نهاية المقال."
          ></textarea>

        </label>


        <!-- IMAGE 2 -->

        <label class="upload-field">

          <span>
            الصورة الثانية للمقال
          </span>

          <small>
            ستظهر تلقائياً في منتصف النص
          </small>

          <input
            id="image2"
            type="file"
            accept="image/*"
            onchange="showFileName(
              'image2',
              'image2Name'
            )"
          >

          <small id="image2Name">
            لم يتم اختيار صورة
          </small>

        </label>


        <!-- IMAGE 3 -->

        <label class="upload-field">

          <span>
            الصورة الثالثة للمقال
          </span>

          <small>
            ستظهر قبل نهاية المقال
          </small>

          <input
            id="image3"
            type="file"
            accept="image/*"
            onchange="showFileName(
              'image3',
              'image3Name'
            )"
          >

          <small id="image3Name">
            لم يتم اختيار صورة
          </small>

        </label>


        <!-- SAVE -->

        <button
          class="btn full"
          id="saveArticleBtn"
          onclick="addArticle()">

          حفظ المقال

        </button>


      </div>

    </div>


    <div class="panel">

      <h2>المقالات المنشورة</h2>


      ${
        D.articles.map(x=>`

          <div class="item">

            <div>

              <b>
                ${esc(x.title)}
              </b>

              <br>

              <small>

                ${esc(
                  x.author||''
                )}

                —

                ${esc(
                  x.category||''
                )}

              </small>

              <br>

              ${
                x.image_1

                ?

                `<small>
                  ✓ صورة المقال
                </small>`

                :

                ''
              }

            </div>


            <button
              class="danger"
              onclick="del(
                'articles',
                '${x.id}'
              )">

              حذف

            </button>

          </div>

        `).join('')

        ||

        '<p>لا توجد مقالات بعد.</p>'

      }

    </div>

  `;

}


/* =========================
   FILE NAME
========================= */

function showFileName(
  inputId,
  outputId
){

  const input=
    $(inputId);

  const output=
    $(outputId);

  if(!input || !output){
    return;
  }

  const file=
    input.files?.[0];

  output.textContent=
    file
      ? `تم اختيار: ${file.name}`
      : 'لم يتم اختيار صورة';

}


/* =========================
   ADD ARTICLE
========================= */

async function addArticle(){

  const btn=
    $('saveArticleBtn');


  try{

    const title=
      $('atitle')
        .value
        .trim();


    const author=
      $('aauthor')
        .value
        .trim();


    const category=
      $('acat')
        .value
        .trim()
        ||
        'رؤى سينمائية';


    const content=
      $('acontent')
        .value
        .trim();


    if(!title){

      alert(
        'أدخل عنوان المقال'
      );

      return;

    }


    if(!content){

      alert(
        'أدخل نص المقال'
      );

      return;

    }


    if(btn){

      btn.disabled=true;

      btn.textContent=
        'جارٍ رفع الصور وحفظ المقال...';

    }


    /*
      صور المقالات تستخدم bucket
      covers الموجود حالياً في Supabase.
    */


    const authorImageFile=
      $('authorImage')
        ?.files?.[0]
        || null;


    const image1File=
      $('image1')
        ?.files?.[0]
        || null;


    const image2File=
      $('image2')
        ?.files?.[0]
        || null;


    const image3File=
      $('image3')
        ?.files?.[0]
        || null;


    /*
      رفع الصور بالتتابع
    */

    const authorImage=
      await upload(
        'covers',
        authorImageFile
      );


    const image1=
      await upload(
        'covers',
        image1File
      );


    const image2=
      await upload(
        'covers',
        image2File
      );


    const image3=
      await upload(
        'covers',
        image3File
      );


    /*
      إنشاء slug
    */

    const slug=
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


    /*
      إذا كان العنوان عربياً بالكامل
      قد ينتج slug فارغاً.
      لذلك نضيف timestamp كحل احتياطي.
    */

    const finalSlug=
      slug ||
      'article-' +
      Date.now();


    /*
      حفظ المقال
    */

    const {
      error
    }=await db
      .from('articles')
      .insert({

        title:title,

        slug:finalSlug,

        author:author,

        category:category,

        content:content,

        author_image:
          authorImage,

        image_1:
          image1,

        image_2:
          image2,

        image_3:
          image3

      });


    if(error){

      throw error;

    }


    alert(
      'تم حفظ المقال ورفع الصور بنجاح'
    );


    await load();

    show('articles');


  }catch(e){

    console.error(e);

    alert(
      'تعذر حفظ المقال:\n\n' +
      msgError(e)
    );


  }finally{

    if(btn){

      btn.disabled=false;

      btn.textContent=
        'حفظ المقال';

    }

  }

}


/* =========================
   SECTIONS
========================= */

function sectionsUI(){

  return `

    <div class="panel">

      <h2>إضافة قسم</h2>

      <div class="form">

        ${input(
          'sname',
          'اسم القسم'
        )}


        <textarea
          id="sdesc"
          placeholder="وصف القسم">
        </textarea>


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

      <h2>الأقسام</h2>


      ${
        D.sections.map(x=>`

          <div class="item">

            <b>
              ${esc(x.name)}
            </b>


            <button
              class="danger"
              onclick="del(
                'sections',
                '${x.id}'
              )">

              حذف

            </button>

          </div>

        `).join('')

        ||

        '<p>لا توجد أقسام بعد.</p>'

      }

    </div>

  `;

}


async function addSection(){

  const name=
    $('sname')
      .value
      .trim();


  if(!name){

    alert(
      'أدخل اسم القسم'
    );

    return;

  }


  const {
    error
  }=await db
    .from('sections')
    .insert({

      name:name,

      description:
        $('sdesc').value,

      sort_order:
        Number(
          $('ssort').value
        ) || 0

    });


  if(error){

    alert(
      msgError(error)
    );

  }else{

    alert(
      'تم حفظ القسم'
    );

    await load();

    show('sections');

  }

}


/* =========================
   TEAM
========================= */

function teamUI(){

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
          'الصفة/الدور'
        )}


        <textarea
          id="tbio"
          placeholder="نبذة">
        </textarea>


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
        D.team.map(x=>`

          <div class="item">

            <div>

              <b>
                ${esc(x.name)}
              </b>

              <br>

              <small>
                ${esc(x.role||'')}
              </small>

            </div>


            <button
              class="danger"
              onclick="del(
                'team',
                '${x.id}'
              )">

              حذف

            </button>

          </div>

        `).join('')

        ||

        '<p>لا توجد بيانات بعد.</p>'

      }

    </div>

  `;

}


async function addTeam(){

  const name=
    $('tname')
      .value
      .trim();


  if(!name){

    alert(
      'أدخل الاسم'
    );

    return;

  }


  const {
    error
  }=await db
    .from('team')
    .insert({

      name:name,

      role:
        $('trole').value,

      bio:
        $('tbio').value,

      sort_order:
        Number(
          $('tsort').value
        ) || 0

    });


  if(error){

    alert(
      msgError(error)
    );

  }else{

    alert(
      'تم حفظ عضو هيئة التحرير'
    );

    await load();

    show('team');

  }

}


/* =========================
   SETTINGS
========================= */

function settingsUI(){

  const s=
    D.settings||{};


  return `

    <div class="panel">

      <h2>
        إعدادات الواجهة
      </h2>


      <div class="form">


        <input
          id="siteName"
          value="${esc(
            s.site_name||''
          )}"
          placeholder="اسم الموقع"
        >


        <input
          id="heroTitle"
          value="${esc(
            s.hero_title||''
          )}"
          placeholder="العنوان الرئيسي"
        >


        <textarea
          id="heroSubtitle"
          placeholder="وصف الواجهة"
        >${esc(
          s.hero_subtitle||''
        )}</textarea>


        <input
          id="aboutTitle"
          value="${esc(
            s.about_title||''
          )}"
          placeholder="عنوان من نحن"
        >


        <textarea
          id="aboutText"
          placeholder="من نحن"
        >${esc(
          s.about_text||''
        )}</textarea>


        <textarea
          id="aboutText2"
          placeholder="نص إضافي"
        >${esc(
          s.about_text_2||''
        )}</textarea>


        <input
          id="contact"
          value="${esc(
            s.contact_email||''
          )}"
          placeholder="البريد الإلكتروني"
        >


        <select id="currentIssue">

          <option value="">
            اختيار العدد الحالي
          </option>


          ${
            D.issues.map(x=>`

              <option
                value="${x.id}"
                ${
                  s.current_issue_id===x.id
                    ? 'selected'
                    : ''
                }>

                العدد
                ${x.issue_number}

              </option>

            `).join('')
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


async function saveSettings(){

  const {
    error
  }=await db
    .from('settings')
    .upsert({

      id:true,

      site_name:
        $('siteName').value ||
        'ضد السينما !؟ | Contre Cinéma',

      hero_title:
        $('heroTitle').value,

      hero_subtitle:
        $('heroSubtitle').value,

      about_title:
        $('aboutTitle').value,

      about_text:
        $('aboutText').value,

      about_text_2:
        $('aboutText2').value,

      contact_email:
        $('contact').value,

      current_issue_id:
        $('currentIssue').value ||
        null

    });


  if(error){

    alert(
      msgError(error)
    );

  }else{

    alert(
      'تم حفظ الإعدادات'
    );

    await load();

    show('settings');

  }

}


/* =========================
   DELETE
========================= */

async function del(
  table,
  id
){

  if(
    !confirm(
      'هل تريد الحذف؟'
    )
  ){
    return;
  }


  const {
    error
  }=await db
    .from(table)
    .delete()
    .eq('id',id);


  if(error){

    alert(
      msgError(error)
    );

  }else{

    alert(
      'تم الحذف'
    );

    await load();

    show(table);

  }

}


/* =========================
   START
========================= */

boot();
