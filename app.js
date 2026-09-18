const SUPABASE_URL='https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbHF5cWp4c25uaGxubGhqeWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzE3NDAsImV4cCI6MjA1Njc5MTc0MH0.K26768wVqF0L0L8y1k892wB5k8v80-001x';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const image=u=>u?`<img class="cover" src="${esc(u)}" alt="">`:`<div class="placeholder">ضد السينما !؟</div>`;
async function load(){
 const [ir,ar,sr,tr,setr]=await Promise.all([db.from('issues').select('*').order('issue_number',{ascending:false}),db.from('articles').select('*').order('created_at',{ascending:false}),db.from('sections').select('*').order('sort_order'),db.from('team').select('*').order('sort_order'),db.from('settings').select('*').eq('id',true).maybeSingle()]);
 const issues=ir.data||[], articles=ar.data||[], sections=sr.data||[], team=tr.data||[], settings=setr.data||{};
 const current=settings.current_issue_id?issues.find(x=>x.id===settings.current_issue_id):issues[0];
 document.title=settings.site_name||'ضد السينما !؟ | Contre Cinéma';
 if(settings.hero_title)document.querySelector('#heroTitle').textContent=settings.hero_title;
 if(settings.hero_subtitle)document.querySelector('#heroSubtitle').textContent=settings.hero_subtitle;
 if(settings.hero_cover_url)document.querySelector('#heroCover').innerHTML=image(settings.hero_cover_url);
 document.querySelector('#current').innerHTML=current?`<div class="current"><div class="coverbox">${image(current.cover_image)}</div><div><span class="kicker">العدد ${esc(current.issue_number)}</span><h3>${esc(current.title||'ضد السينما !؟')}</h3><p>${esc(current.publication_date||'')}</p>${current.pdf_url?`<a class="btn red" target="_blank" href="${esc(current.pdf_url)}">تصفح العدد وتحميل PDF</a>`:''}</div></div>`:'<p>لا يوجد عدد منشور بعد.</p>';
 document.querySelector('#issues').innerHTML=issues.map(x=>`<article class="card"><div class="thumb">${image(x.cover_image)}</div><h3>العدد ${esc(x.issue_number)}</h3><p>${esc(x.title||'')}</p>${x.pdf_url?`<a class="more" target="_blank" href="${esc(x.pdf_url)}">تصفح / تحميل</a>`:''}</article>`).join('')||'<p>لا توجد أعداد بعد.</p>';
 document.querySelector('#sectionsList').innerHTML=sections.map(x=>`<a class="article" href="#articles"><span class="cat">قسم</span><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p></a>`).join('')||'<p>لا توجد أقسام بعد.</p>';
 document.querySelector('#articlesList').innerHTML=articles.slice(0,9).map(x=>`<article class="article"><span class="cat">${esc(x.category||'مقالات')}</span><h3>${esc(x.title)}</h3><p>${esc(x.excerpt||'')}</p><small>${esc(x.author||'')}</small></article>`).join('')||'<p>لا توجد مقالات بعد.</p>';
 document.querySelector('#teamList').innerHTML=team.map(x=>`<div class="member"><h3>${esc(x.name)}</h3><small>${esc(x.role||'')}</small><p>${esc(x.bio||'')}</p></div>`).join('')||'<p>لا توجد بيانات.</p>';
}
load().catch(e=>console.error(e));
