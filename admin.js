const SUPABASE_URL='https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY='sb_publishable_poEM-eY7byTT2UBEwZMLmQ_GGUWLnfm';

const db=supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let D={ issues:[], articles:[], sections:[], team:[], settings:null };

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
  return e?.message || e?.error_description || 'حدث خطأ غير معروف';
}

// تجاوز التحقق وفتح لوحة التحكم فوراً
async function boot(){
  try {
    if(login) login.hidden=true;
    if(panel) panel.hidden=false;
    await load();
    show('dashboard');
  } catch(e) {
    console.error(e);
    if(login) login.hidden=false;
    if(panel) panel.hidden=true;
    if(msg) msg.textContent=msgError(e);
  }
}

// تخطي أزرار الدخول التقليدية لأن الدوحة أصبحت مفتوحة مباشرة
if(loginBtn){
  loginBtn.onclick=async()=>{
    await boot();
  };
}

if(logout){
  logout.onclick=async()=>{
    location.reload();
  };
}

document.querySelectorAll('[data-tab]').forEach(b=>{
  b.onclick=()=>show(b.dataset.tab);
});

async function load(){
  const [a, b, c, d, e]=await Promise.all([
    db.from('issues').select('*').order('issue_number', {ascending:false}),
    db.from('articles').select('*').order('created_at', {ascending:false}),
    db.from('sections').select('*').order('sort_order', {ascending:true}),
    db.from('team').select('*').order('sort_order', {ascending:true}),
    db.from('settings').select('*').eq('id',true).maybeSingle()
  ]);

  D={
    issues:a.data||[],
    articles:b.data||[],
    sections:c.data||[],
    team:d.data||[],
    settings:e.data||null
  };

  if(stats){
    stats.textContent=`الأعداد ${D.issues.length} · المقالات ${D.articles.length} · الأقسام ${D.sections.length} · الهيئة ${D.team.length}`;
  }
}

function show(tab){
  document.querySelectorAll('aside button').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===tab);
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

const input=(id, ph, type='text')=>`<input id="${id}" type="${type}" placeholder="${ph}">`;

async function upload(bucket, file){
  if(!file) return null;
  const safeName=file.name.replace(/[^\w.\-]/g,'_');
  const path=Date.now()+'-'+Math.random().toString(36).substring(2,8)+'-'+safeName;
  const {error}=await db.storage.from(bucket).upload(path, file, {upsert:false, contentType:file.type});
  if(error) throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function dashboardUI(){
  return `
    <div class="panel">
      <h1>مرحباً بك</h1>
      <p>من هنا تدير موقع مجلة «ضد السينما !؟» بالكامل.</p>
    </div>
    <div class="stat-grid">
      <div class="stat"><b>${D.issues.length}</b><span>عدد منشور</span></div>
      <div class="stat"><b>${D.articles.length}</b><span>مقال</span></div>
      <div class="stat"><b>${D.sections.length}</b><span>قسم</span></div>
      <div class="stat"><b>${D.team.length}</b><span>عضو هيئة تحرير</span></div>
    </div>
  `;
}

function issuesUI(){
  return `
    <div class="panel">
      <h2>إضافة عدد</h2>
      <div class="form">
        ${input('inum', 'رقم العدد', 'number')}
        ${input('ititle', 'عنوان العدد')}
        ${input('idate', 'تاريخ النشر')}
        <label>غلاف العدد<input id="cover" type="file" accept="image/*"></label>
        <label>PDF العدد<input id="pdf" type="file" accept="application/pdf"></label>
        <button class="btn full" onclick="addIssue()">حفظ العدد</button>
      </div>
    </div>
    <div class="panel">
      <h2>الأعداد المنشورة</h2>
      ${D.issues.map(x=>`
        <div class="item">
          <div><b>العدد ${esc(x.issue_number)}</b> —${esc(x.title||'')}</div>
          <div class="actions">
            ${x.pdf_url ? `<a href="${esc(x.pdf_url)}" target="_blank">PDF</a>` : ''}
            <button class="danger" onclick="del('issues', '${x.id}')">حذف</button>
          </div>
        </div>
      `).join('')||'<p>لا توجد أعداد بعد.</p>'}
    </div>
  `;
}

async function addIssue(){
  try{
    const coverFile=$('cover')?.files?.[0];
    const pdfFile=$('pdf')?.files?.[0];
    const coverUrl=await upload('covers', coverFile);
    const pdfUrl=await upload('pdfs', pdfFile);

    const {error}=await db.from('issues').insert({
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
    <div class="panel article-form-panel">
      <h2>إضافة مقال</h2>
      <div class="form">
        ${input('atitle', 'عنوان المقال')}
        ${input('aauthor', 'اسم الكاتب')}
        ${input('acat', 'القسم (مثال: مراجعات)')}
        <label>صورة الكاتب<input id="authorImage" type="file" accept="image/*"></label>
        <label>الصورة الأولى للمقال<input id="image1" type="file" accept="image/*"></label>
        <label><span>نص المقال</span><textarea id="acontent" rows="18" placeholder="اكتب نص المقال هنا..."></textarea></label>
        <label>الصورة الثانية للمقال<input id="image2" type="file" accept="image/*"></label>
        <label>الصورة الثالثة للمقال<input id="image3" type="file" accept="image/*"></label>
        <button class="btn full" id="saveArticleBtn" onclick="addArticle()">حفظ المقال</button>
      </div>
    </div>
    <div class="panel">
      <h2>المقالات المنشورة</h2>
      ${D.articles.map(x=>`
        <div class="item">
          <div><b>${esc(x.title)}</b><br><small>${esc(x.author\vert{}\vert{}'')} —${esc(x.category||'')}</small></div>
          <button class="danger" onclick="del('articles', '${x.id}')">حذف</button>
        </div>
      `).join('')||'<p>لا توجد مقالات بعد.</p>'}
    </div>
  `;
}

async function addArticle(){
  const btn=$('saveArticleBtn');
  try{
    const title=$('atitle').value.trim();
    const author=$('aauthor').value.trim();
    const category=$('acat').value.trim()||'رؤى سينمائية';
    const content=$('acontent').value.trim();

    if(!title || !content){
      alert('أدخل العنوان والنص على الأقل');
      return;
    }

    if(btn){ btn.disabled=true; btn.textContent='جاري الحفظ...'; }

    const authorImage=await upload('covers', $('authorImage')?.files?.[0]);
    const image1=await upload('covers', $('image1')?.files?.[0]);
    const image2=await upload('covers', $('image2')?.files?.[0]);
    const image3=await upload('covers', $('image3')?.files?.[0]);

    const slug=title.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'article-'+Date.now();

    const {error}=await db.from('articles').insert({
      title, slug, author, category, content,
      author_image:authorImage, image_1:image1, image_2:image2, image_3:image3
    });

    if(error) throw error;
    alert('تم حفظ المقال بنجاح');
    await load();
    show('articles');
  }catch(e){
    alert('تعذر الحفظ:\n\n'+msgError(e));
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='حفظ المقال'; }
  }
}

function sectionsUI(){
  return `
    <div class="panel">
      <h2>إضافة قسم</h2>
      <div class="form">
        ${input('sname', 'اسم القسم')}
        <textarea id="sdesc" placeholder="وصف القسم"></textarea>
        ${input('ssort', 'الترتيب', 'number')}
        <button class="btn full" onclick="addSection()">حفظ القسم</button>
      </div>
    </div>
    <div class="panel">
      <h2>الأقسام</h2>
      ${D.sections.map(x=>`<div class="item"><b>${esc(x.name)}</b><button class="danger" onclick="del('sections', '${x.id}')">حذف</button></div>`).join('')||'<p>لا توجد أقسام.</p>'}
    </div>
  `;
}

async function addSection(){
  const name=$('sname').value.trim();
  if(!name) return alert('أدخل اسم القسم');
  const {error}=await db.from('sections').insert({name, description:$('sdesc').value, sort_order:Number($('ssort').value)||0});
  if(error) alert(msgError(error));
  else { alert('تم الحفظ'); await load(); show('sections'); }
}

function teamUI(){
  return `
    <div class="panel">
      <h2>إضافة عضو</h2>
      <div class="form">
        ${input('tname', 'الاسم')}
        ${input('trole', 'الصفة/الدور')}
        <textarea id="tbio" placeholder="نبذة"></textarea>
        ${input('tsort', 'الترتيب', 'number')}
        <button class="btn full" onclick="addTeam()">حفظ العضو</button>
      </div>
    </div>
    <div class="panel">
      <h2>هيئة التحرير</h2>
      ${D.team.map(x=>`<div class="item"><div><b>${esc(x.name)}</b><br><small>${esc(x.role\vert{}\vert{}'')}</small></div><button class="danger" onclick="del('team', '${x.id}')">حذف</button></div>`).join('')||'<p>لا توجد بيانات.</p>'}
    </div>
  `;
}

async function addTeam(){
  const name=$('tname').value.trim();
  if(!name) return alert('أدخل الاسم');
  const {error}=await db.from('team').insert({name, role:$('trole').value, bio:$('tbio').value, sort_order:Number($('tsort').value)||0});
  if(error) alert(msgError(error));
  else { alert('تم الحفظ'); await load(); show('team'); }
}

function settingsUI(){
  const s=D.settings||{};
  return `
    <div class="panel">
      <h2>إعدادات الواجهة</h2>
      <div class="form">
        <input id="siteName" value="${esc(s.site_name||'')}" placeholder="اسم الموقع">
        <input id="heroTitle" value="${esc(s.hero_title||'')}" placeholder="العنوان الرئيسي">
        <textarea id="heroSubtitle" placeholder="وصف الواجهة">${esc(s.hero_subtitle||'')}</textarea>
        <button class="btn full" onclick="saveSettings()">حفظ الإعدادات</button>
      </div>
    </div>
  `;
}

async function saveSettings(){
  const {error}=await db.from('settings').upsert({
    id:true,
    site_name:$('siteName').value||'ضد السينما !؟',
    hero_title:$('heroTitle').value,
    hero_subtitle:$('heroSubtitle').value
  });
  if(error) alert(msgError(error));
  else { alert('تم الحفظ'); await load(); show('settings'); }
}

async function del(table, id){
  if(!confirm('هل تريد الحذف؟')) return;
  const {error}=await db.from(table).delete().eq('id', id);
  if(error) alert(msgError(error));
  else { alert('تم الحذف'); await load(); show(table); }
}

boot();
