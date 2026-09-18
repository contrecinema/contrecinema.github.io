const SUPABASE_URL='https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY='sb_publishable_poEM-eY7byTT2UBEwZMLmQ_GGUWLnfm';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let D={issues:[],articles:[],sections:[],team:[],settings:null};

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
  return e?.message||e?.error_description||'حدث خطأ غير معروف';
}

async function isAdmin(){
  const {data:{user},error}=await db.auth.getUser();

  if(error||!user) return false;

  const {data,error:adminError}=await db
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

async function boot(){
  try{
    const {data:{session}}=await db.auth.getSession();

    if(session && await isAdmin()){
      login.hidden=true;
      panel.hidden=false;
      await load();
      show('dashboard');
    }else{
      login.hidden=false;
      panel.hidden=true;
    }
  }catch(e){
    console.error(e);
    login.hidden=false;
    panel.hidden=true;
    if(msg) msg.textContent=msgError(e);
  }
}

if(loginBtn){
  loginBtn.onclick=async()=>{
    msg.textContent='جارٍ تسجيل الدخول...';

    const {error}=await db.auth.signInWithPassword({
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

if(logout){
  logout.onclick=async()=>{
    await db.auth.signOut();
    location.reload();
  };
}

document.querySelectorAll('[data-tab]').forEach(b=>{
  b.onclick=()=>show(b.dataset.tab);
});

async function load(){
  const [
    a,b,c,d,e
  ]=await Promise.all([
    db.from('issues')
      .select('*')
      .order('issue_number',{ascending:false}),

    db.from('articles')
      .select('*')
      .order('created_at',{ascending:false}),

    db.from('sections')
      .select('*')
      .order('sort_order'),

    db.from('team')
      .select('*')
      .order('sort_order'),

    db.from('settings')
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
      `الأعداد ${D.issues.length} · المقالات ${D.articles.length} · الأقسام ${D.sections.length} · الهيئة ${D.team.length}`;
  }
}

function show(tab){
  document.querySelectorAll('aside button').forEach(b=>{
    b.classList.toggle('active',b.dataset.tab===tab);
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
    workspace.innerHTML=views[tab]();
  }
}

const input=(id,ph,type='text')=>
  `<input id="${id}" type="${type}" placeholder="${ph}">`;

async function upload(bucket,file){
  if(!file) return null;

  const path=
    Date.now()+'-'+
    file.name.replace(/[^\w.\-]/g,'_');

  const {error}=await db
    .storage
    .from(bucket)
    .upload(path,file,{upsert:false});

  if(error) throw error;

  return db
    .storage
    .from(bucket)
    .getPublicUrl(path)
    .data
    .publicUrl;
}

function dashboardUI(){
  return `
    <div class="panel">
      <h1>مرحباً بك</h1>
      <p>
        من هنا تدير موقع المجلة بالكامل.
        أضف العدد، المقالات، الأقسام وأعضاء هيئة التحرير،
        ثم ستظهر مباشرة في الموقع.
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

function issuesUI(){
  return `
    <div class="panel">
      <h2>إضافة عدد</h2>

      <div class="form">
        ${input('inum','رقم العدد','number')}
        ${input('ititle','عنوان العدد')}
        ${input('idate','تاريخ النشر')}

        <label>
          غلاف العدد
          <input id="cover" type="file" accept="image/*">
        </label>

        <label>
          PDF العدد
          <input id="pdf" type="file" accept="application/pdf">
        </label>

        <button class="btn full" onclick="addIssue()">
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
              <b>العدد ${esc(x.issue_number)}</b>
              — ${esc(x.title||'')}
            </div>

            <div class="actions">
              ${
                x.pdf_url
                ? `<a href="${esc(x.pdf_url)}" target="_blank">PDF</a>`
                : ''
              }

              <button
                class="danger"
                onclick="del('issues','${x.id}')">
                حذف
              </button>
            </div>
          </div>
        `).join('')
        || '<p>لا توجد أعداد بعد.</p>'
      }
    </div>
  `;
}

async function addIssue(){
  try{
    const coverFile=$('cover')?.files?.[0];
    const pdfFile=$('pdf')?.files?.[0];

    const coverUrl=await upload('covers',coverFile);
    const pdfUrl=await upload('pdfs',pdfFile);

    const {error}=await db
      .from('issues')
      .insert({
        issue_number:Number($('inum').value),
        title:$('ititle').value,
        publication_date:$('idate').value,
        cover_image:coverUrl,
        pdf_url:pdfUrl
      });

    if(error) throw error;

    alert('تمت إضافة العدد بنجاح');

    await load();
    show('issues');

  }catch(e){
    alert(msgError(e));
  }
}

function articlesUI(){
  return `
    <div class="panel">
      <h2>إضافة مقال</h2>

      <div class="form">
        ${input('atitle','عنوان المقال')}
        ${input('aauthor','اسم الكاتب')}
        ${input('acat','القسم')}

        <textarea
          id="aexcerpt"
          placeholder="ملخص المقال">
        </textarea>

        <textarea
          id="acontent"
          placeholder="نص المقال">
        </textarea>

        <button
          class="btn full"
          onclick="addArticle()">
          حفظ المقال
        </button>
      </div>
    </div>

    <div class="panel">
      <h2>المقالات</h2>

      ${
        D.articles.map(x=>`
          <div class="item">
            <div>
              <b>${esc(x.title)}</b>
              <br>
              <small>
                ${esc(x.author||'')}
                —
                ${esc(x.category||'')}
              </small>
            </div>

            <button
              class="danger"
              onclick="del('articles','${x.id}')">
              حذف
            </button>
          </div>
        `).join('')
        || '<p>لا توجد مقالات بعد.</p>'
      }
    </div>
  `;
}

async function addArticle(){
  const title=$('atitle').value.trim();

  if(!title){
    alert('أدخل عنوان المقال');
    return;
  }

  const slug=title
    .toLowerCase()
    .replace(/\s+/g,'-');

  const {error}=await db
    .from('articles')
    .insert({
      title:title,
      author:$('aauthor').value,
      category:$('acat').value||'رؤى سينمائية',
      excerpt:$('aexcerpt').value,
      content:$('acontent').value,
      slug:slug
    });

  if(error){
    alert(msgError(error));
  }else{
    alert('تم حفظ المقال');

    await load();
    show('articles');
  }
}

function sectionsUI(){
  return `
    <div class="panel">
      <h2>إضافة قسم</h2>

      <div class="form">
        ${input('sname','اسم القسم')}

        <textarea
          id="sdesc"
          placeholder="وصف القسم">
        </textarea>

        ${input('ssort','الترتيب','number')}

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
            <b>${esc(x.name)}</b>

            <button
              class="danger"
              onclick="del('sections','${x.id}')">
              حذف
            </button>
          </div>
        `).join('')
        || '<p>لا توجد أقسام بعد.</p>'
      }
    </div>
  `;
}

async function addSection(){
  const name=$('sname').value.trim();

  if(!name){
    alert('أدخل اسم القسم');
    return;
  }

  const {error}=await db
    .from('sections')
    .insert({
      name:name,
      description:$('sdesc').value,
      sort_order:Number($('ssort').value)||0
    });

  if(error){
    alert(msgError(error));
  }else{
    alert('تم حفظ القسم');

    await load();
    show('sections');
  }
}

function teamUI(){
  return `
    <div class="panel">
      <h2>إضافة عضو هيئة تحرير</h2>

      <div class="form">
        ${input('tname','الاسم')}
        ${input('trole','الصفة/الدور')}

        <textarea
          id="tbio"
          placeholder="نبذة">
        </textarea>

        ${input('tsort','الترتيب','number')}

        <button
          class="btn full"
          onclick="addTeam()">
          حفظ العضو
        </button>
      </div>
    </div>

    <div class="panel">
      <h2>هيئة التحرير</h2>

      ${
        D.team.map(x=>`
          <div class="item">
            <div>
              <b>${esc(x.name)}</b>
              <br>
              <small>${esc(x.role||'')}</small>
            </div>

            <button
              class="danger"
              onclick="del('team','${x.id}')">
              حذف
            </button>
          </div>
        `).join('')
        || '<p>لا توجد بيانات بعد.</p>'
      }
    </div>
  `;
}

async function addTeam(){
  const name=$('tname').value.trim();

  if(!name){
    alert('أدخل الاسم');
    return;
  }

  const {error}=await db
    .from('team')
    .insert({
      name:name,
      role:$('trole').value,
      bio:$('tbio').value,
      sort_order:Number($('tsort').value)||0
    });

  if(error){
    alert(msgError(error));
  }else{
    alert('تم حفظ عضو هيئة التحرير');

    await load();
    show('team');
  }
}

function settingsUI(){
  const s=D.settings||{};

  return `
    <div class="panel">
      <h2>إعدادات الواجهة</h2>

      <div class="form">

        <input
          id="siteName"
          value="${esc(s.site_name||'')}"
          placeholder="اسم الموقع">

        <input
          id="heroTitle"
          value="${esc(s.hero_title||'')}"
          placeholder="العنوان الرئيسي">

        <textarea
          id="heroSubtitle"
          placeholder="وصف الواجهة">${esc(s.hero_subtitle||'')}</textarea>

        <input
          id="aboutTitle"
          value="${esc(s.about_title||'')}"
          placeholder="عنوان من نحن">

        <textarea
          id="aboutText"
          placeholder="من نحن">${esc(s.about_text||'')}</textarea>

        <textarea
          id="aboutText2"
          placeholder="نص إضافي">${esc(s.about_text_2||'')}</textarea>

        <input
          id="contact"
          value="${esc(s.contact_email||'')}"
          placeholder="البريد الإلكتروني">

        <select id="currentIssue">
          <option value="">اختيار العدد الحالي</option>

          ${
            D.issues.map(x=>`
              <option
                value="${x.id}"
                ${s.current_issue_id===x.id?'selected':''}>
                العدد ${x.issue_number}
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
  const {error}=await db
    .from('settings')
    .upsert({
      id:true,
      site_name:$('siteName').value||'ضد السينما !؟ | Contre Cinéma',
      hero_title:$('heroTitle').value,
      hero_subtitle:$('heroSubtitle').value,
      about_title:$('aboutTitle').value,
      about_text:$('aboutText').value,
      about_text_2:$('aboutText2').value,
      contact_email:$('contact').value,
      current_issue_id:$('currentIssue').value||null
    });

  if(error){
    alert(msgError(error));
  }else{
    alert('تم حفظ الإعدادات');

    await load();
    show('settings');
  }
}

async function del(table,id){
  if(!confirm('هل تريد الحذف؟')) return;

  const {error}=await db
    .from(table)
    .delete()
    .eq('id',id);

  if(error){
    alert(msgError(error));
  }else{
    alert('تم الحذف');

    await load();
    show(table);
  }
}

boot();
