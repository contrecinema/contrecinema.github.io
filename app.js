const SUPABASE_URL='https://qclqyqjxsnnhlnlhjybo.supabase.co';
const SUPABASE_KEY='sb_publishable_poEM-eY7byTT2UBEwZMLmQ_GGUWLnfm';

const db=supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   HELPERS
========================================================= */

const $=s=>document.querySelector(s);

const esc=s=>String(s??'')
  .replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]));


function safeUrl(url){

  if(!url) return '';

  try{

    const u=new URL(url);

    if(
      u.protocol==='https:' ||
      u.protocol==='http:'
    ){

      return u.href;

    }

  }catch(e){}

  return '';

}


/* =========================================================
   THEME (dark / light) + ADMIN SHORTCUT
========================================================= */

function applyTheme(theme){

  const dark=
    theme==='dark';

  document.documentElement
    .setAttribute(
      'data-theme',
      dark
        ? 'dark'
        : 'light'
    );


}


function toggleTheme(){

  const current=
    document.documentElement
      .getAttribute('data-theme');

  const next=
    current==='dark'
      ? 'light'
      : 'dark';

  try{
    localStorage.setItem(
      'cc-theme',
      next
    );
  }catch(e){}

  applyTheme(next);

}


function initTheme(){

  let stored=null;

  try{
    stored=
      localStorage.getItem(
        'cc-theme'
      );
  }catch(e){}

  applyTheme(
    stored ||
    (window.matchMedia &&
     window.matchMedia(
       '(prefers-color-scheme: dark)'
     ).matches
      ? 'dark'
      : 'light')
  );

  const button=
    $('#themeToggle');

  if(button){
    button.onclick=toggleTheme;
  }

  document.addEventListener(
    'keydown',
    e=>{

      if(
        e.ctrlKey &&
        e.shiftKey &&
        (e.key==='A' || e.key==='a')
      ){

        e.preventDefault();

        location.href=
          'cc-control.html';

      }

    }
  );

}


/* =========================================================
   MOBILE MENU
========================================================= */

if($('#hamb')){

  $('#hamb').onclick=()=>{

    document.body.classList.toggle(
      'nav-open'
    );

  };

}


document
  .querySelectorAll('#nav a')
  .forEach(a=>{

    a.onclick=()=>{

      document.body.classList.remove(
        'nav-open'
      );

    };

  });


/* =========================================================
   FALLBACK DATA
========================================================= */

const fallbackIssues=
  Array.from(
    {length:9},
    (_,i)=>({

      id:'fallback-'+(i+1),

      issue_number:i+1,

      title:
        'العدد '+(i+1),

      publication_date:'',

      pdf_url:'',

      cover_image:''

    })
  );


const fallbackSections=[
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

async function get(
  table,
  order='created_at',
  ascending=false
){

  try{

    const r=
      await db
        .from(table)
        .select('*')
        .order(
          order,
          {ascending}
        );

    if(r.error){

      console.error(
        `Supabase ${table}:`,
        r.error
      );

      return [];

    }

    return r.data||[];

  }catch(e){

    console.error(e);

    return [];

  }

}


/* =========================================================
   ISSUE COVER
========================================================= */

function cover(
  x,
  small=false
){

  const image=
    safeUrl(
      x.cover_image
    );

  if(image){

    return `
      <img
        src="${esc(image)}"
        alt="غلاف العدد ${esc(x.issue_number)}"
        loading="lazy"
      >
    `;

  }

  return `
    <span>
      العدد ${esc(x.issue_number)}
    </span>
  `;

}


/* =========================================================
   ISSUES
========================================================= */

function renderIssues(items){

  const target=
    $('#issuesGrid');

  if(!target){
    return;
  }


  const range =
    $('#issuesRange');

  if(range && items.length){

    const nums =
      items
        .map(x=>Number(x.issue_number))
        .filter(n=>!Number.isNaN(n));

    if(nums.length){

      range.textContent =
        'من العدد ' +
        Math.min(...nums) +
        ' إلى العدد ' +
        Math.max(...nums);

    }

  }


  target.innerHTML=
    items.map(x=>`

      <article
        class="issue-card"
      >

        <div class="issue-cover">

          ${cover(x,true)}

        </div>


        <div class="issue-body">

          <strong>
            العدد
            ${esc(x.issue_number)}
            ${
              (String(x.publication_date||'')
                .match(/(?:19|20)\d{2}/)||[])[0]
              ?
              `<span class="issue-year">(${
                esc(
                  (String(x.publication_date||'')
                    .match(/(?:19|20)\d{2}/)||[])[0]
                )
              })</span>`
              :
              ''
            }
          </strong>


          <p>

            ${esc(
              x.title ||
              'ضد السينما !؟'
            )}

            ${
              x.publication_date
              ?
              ' — '+
              esc(
                x.publication_date
              )
              :
              ''
            }

          </p>


          <div class="issue-links">

            ${
              x.pdf_url

              ?

              `
              <a
                class="mini red"
                target="_blank"
                rel="noopener"
                href="${esc(
                  x.pdf_url
                )}"
              >
                تصفح PDF
              </a>
              `

              :

              `
              <span class="mini">
                PDF قريباً
              </span>
              `
            }


            <a
              class="mini"
              href="#articles"
            >
              المقالات
            </a>

          </div>

        </div>

      </article>

    `).join('');

}


/* =========================================================
   CURRENT ISSUE
========================================================= */

function renderCurrent(x){

  const target=
    $('#currentIssue');

  if(!target){
    return;
  }


  if(!x){

    target.innerHTML=`
      <div class="empty">

        لم يتم اختيار عدد الشهر بعد.
        يمكنك تحديده من لوحة التحكم.

      </div>
    `;

    return;

  }


  const image=
    safeUrl(
      x.cover_image
    );


  target.innerHTML=`

    <div class="current-cover">

      ${
        image

        ?

        `
        <img
          src="${esc(image)}"
          alt="غلاف العدد"
          loading="lazy"
        >
        `

        :

        `
        <div class="placeholder-cover">

          العدد
          ${esc(x.issue_number)}

        </div>
        `
      }

    </div>


    <div class="current-info">

      <div class="num">

        العدد
        ${esc(x.issue_number)}

      </div>


      <h3>

        ${esc(
          x.title ||
          'ضد السينما !؟'
        )}

      </h3>


      <p>

        ${
          x.publication_date
          ?
          esc(
            x.publication_date
          )
          :
          'عدد جديد من المجلة المستقلة للنقد السينمائي.'
        }

      </p>


      <p>

        تصفح العدد، واقرأ ملفاتنا
        ومراجعاتنا وحواراتنا السينمائية.

      </p>


      ${
        x.pdf_url

        ?

        `
        <a
          class="btn primary"
          target="_blank"
          rel="noopener"
          href="${esc(
            x.pdf_url
          )}"
        >

          تصفح وتحميل العدد PDF

        </a>
        `

        :

        ''
      }

    </div>

  `;

}


/* =========================================================
   SECTIONS
========================================================= */

function renderSections(items){

  const target=
    $('#sectionsGrid');

  if(!target){
    return;
  }


  const a=
    items.length
    ?
    items
    :
    fallbackSections.map(
      (name,i)=>({

        name,

        description:
          'قسم من أقسام المجلة',

        sort_order:i

      })
    );


  target.innerHTML=
    a.map(x=>`

      <a
        class="section-card"
        href="section.html?slug=${
          encodeURIComponent(x.name)
        }"
      >

        <b>
          ${esc(x.name)}
        </b>


        <p>

          ${esc(
            x.description ||
            'كتابات ومتابعات نقدية حول السينما.'
          )}

        </p>

      </a>

    `).join('');

}


/* =========================================================
   ARTICLE CARD
========================================================= */

function viewsLabel(n){

  const v=Number(n)||0;

  if(v===1){
    return 'قراءة واحدة';
  }

  if(v===2){
    return 'قراءتان';
  }

  if(v<=10){
    return v+' قراءات';
  }

  return v+' قراءة';

}


function articleCard(x){

  const image=
    safeUrl(
      x.image_1
    );


  const authorImage=
    safeUrl(
      x.author_image
    );


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

        ?

        `
        <div
          class="article-card-image"
        >

          <img
            src="${esc(image)}"
            alt="${esc(x.title)}"
            loading="lazy"
          >

        </div>
        `

        :

        ''
      }


      <div class="article-card-content">

        <div class="cat">

          ${esc(
            x.category ||
            'نقد سينمائي'
          )}

        </div>


        <h3>

          ${esc(x.title)}

        </h3>


        ${
          x.author

          ?

          `
          <small>
            ${esc(x.author)}
          </small>
          `

          :

          ''
        }

      <small class="views">
        ${viewsLabel(x.views)}
      </small>

      </div>

    </article>

  `;

}


/* =========================================================
   ARTICLES GRID
========================================================= */

function renderArticles(items){

  const target=
    $('#articlesGrid');

  if(!target){
    return;
  }


  if(!items.length){

    target.innerHTML=`
      <div class="empty">

        ستظهر المقالات هنا فور
        إضافتها من لوحة التحكم.

      </div>
    `;

    return;

  }


  /*
    نحفظ المقالات كاملة في الذاكرة
    حتى نستطيع فتح المقال فوراً
    دون طلب جديد من Supabase.
  */

  window.__CC_ARTICLES__=
    items;


  target.innerHTML=
    items
      .map(articleCard)
      .join('');



  /*
    click
  */

  bindArticleClicks(target);

}

function bindArticleClicks(target){

  target
    .querySelectorAll(
      '[data-article-id]'
    )
    .forEach(card=>{

      card.onclick=()=>{

        const id=
          card.dataset.articleId;

        openArticle(id);

      };


      card.onkeydown=e=>{

        if(
          e.key==='Enter' ||
          e.key===' '
        ){

          e.preventDefault();

          const id=
            card.dataset.articleId;

          openArticle(id);

        }

      };

    });

}


/* =========================================================
   TEAM
========================================================= */

function renderTeam(items){

  const target=
    $('#teamGrid');

  if(!target){
    return;
  }


  target.innerHTML=
    items.length

    ?

    items.map(x=>`

      <article
        class="person"
      >

        <div class="avatar">

          ${
            safeUrl(
              x.image_url
            )

            ?

            `
            <img
              src="${esc(
                safeUrl(
                  x.image_url
                )
              )}"
              alt="${esc(x.name)}"
              loading="lazy"
            >
            `

            :

            esc(
              (x.name||'?')
                .slice(0,1)
            )
          }

        </div>


        <h3>

          ${esc(x.name)}

        </h3>


        <div class="role">

          ${esc(
            x.role||''
          )}

        </div>


        <p>

          ${esc(
            x.bio||''
          )}

        </p>

      </article>

    `).join('')

    :

    `
    <div class="empty">

      أضف أعضاء هيئة التحرير
      من لوحة التحكم.

    </div>
    `;

}


/* =========================================================
   EDITORS
========================================================= */

function renderEditors(items){

  const target=
    $('#editorsGrid');

  if(!target){
    return;
  }


  target.innerHTML=
    items.length

    ?

    items.map(x=>`

      <article
        class="person"
      >

        <div class="avatar">

          ${
            safeUrl(
              x.image_url
            )

            ?

            `
            <img
              src="${esc(
                safeUrl(
                  x.image_url
                )
              )}"
              alt="${esc(
                [x.name,x.surname]
                  .filter(Boolean)
                  .join(' ')
              )}"
              loading="lazy"
            >
            `

            :

            esc(
              (x.name||'?')
                .slice(0,1)
            )
          }

        </div>


        <h3>

          ${esc(

            [x.name,x.surname]
              .filter(Boolean)
              .join(' ')

          )}

        </h3>

      </article>

    `).join('')

    :

    `
    <div class="empty">

      أضف المحررين
      من لوحة التحكم.

    </div>
    `;

}


/* =========================================================
   ARTICLE READER
========================================================= */

function createArticleReader(){

  if(
    document.getElementById(
      'ccArticleReader'
    )
  ){

    return;

  }


  const reader=
    document.createElement(
      'div'
    );


  reader.id=
    'ccArticleReader';


  reader.innerHTML=`

    <div
      class="cc-reader-backdrop"
      data-close-reader
    ></div>


    <article
      class="cc-reader"
      role="dialog"
      aria-modal="true"
      aria-label="قراءة المقال"
    >

      <button
        class="cc-reader-close"
        type="button"
        aria-label="إغلاق المقال"
        data-close-reader
      >
        ×
      </button>


      <div
        class="cc-reader-inner"
        id="ccArticleContent"
      ></div>

    </article>

  `;


  document.body.appendChild(
    reader
  );


  /*
    Close buttons
  */

  reader
    .querySelectorAll(
      '[data-close-reader]'
    )
    .forEach(button=>{

      button.onclick=closeArticle;

    });


  /*
    Escape
  */

  document.addEventListener(
    'keydown',
    e=>{

      if(
        e.key==='Escape' &&
        reader.classList.contains(
          'is-open'
        )
      ){

        closeArticle();

      }

    }
  );


  /*
    Inject styles only once.
  */

  addArticleReaderStyles();

}


/* =========================================================
   ARTICLE READER STYLES
========================================================= */

function addArticleReaderStyles(){

  if(
    document.getElementById(
      'ccArticleReaderStyles'
    )
  ){

    return;

  }


  const style=
    document.createElement(
      'style'
    );


  style.id=
    'ccArticleReaderStyles';


  style.textContent=`

    #ccArticleReader{
      position:fixed;
      inset:0;
      z-index:99999;
      display:none;
      overflow:auto;
    }


    #ccArticleReader.is-open{
      display:block;
    }


    .cc-reader-backdrop{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.72);
      backdrop-filter:blur(4px);
    }


    .cc-reader{
      position:relative;
      width:min(
        100%,
        980px
      );
      min-height:100vh;
      margin:0 auto;
      background:var(--reader-bg);
      box-shadow:
        0 20px 70px
        rgba(0,0,0,.25);
    }


    .cc-reader-inner{
      width:100%;
      padding:
        70px
        clamp(
          24px,
          7vw,
          70px
        )
        100px;
    }


    .cc-reader-close{
      position:fixed;
      top:20px;
      right:20px;
      z-index:10;
      width:44px;
      height:44px;
      border:0;
      border-radius:50%;
      background:var(--reader-ink);
      color:var(--reader-bg);
      font-size:30px;
      line-height:1;
      cursor:pointer;
      box-shadow:
        0 5px 20px
        rgba(0,0,0,.2);
    }


    .cc-article-category{
      margin-bottom:14px;
      font-size:14px;
      font-weight:700;
      color:var(--red);
    }


    .cc-article-title{
      margin:0 0 20px;
      font-size:
        clamp(
          30px,
          5vw,
          56px
        );
      line-height:1.25;
      font-weight:800;
      color:var(--reader-ink);
    }


    .cc-author-link{
      color:var(--reader-accent);
      font-weight:700;
      text-decoration:none;
    }

    .cc-author-link:hover{
      text-decoration:underline;
    }

    .cc-article-author{
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom:30px;
      font-size:16px;
      color:var(--reader-muted);
    }


    .cc-author-photo{
      width:48px;
      height:48px;
      border-radius:50%;
      object-fit:cover;
      flex:none;
    }


    .cc-author-placeholder{
      display:flex;
      align-items:center;
      justify-content:center;
      width:48px;
      height:48px;
      border-radius:50%;
      background:var(--surface-2);
      color:var(--reader-muted);
      font-weight:700;
      flex:none;
    }


    .cc-article-hero{
      width:100%;
      margin:
        0 0 42px;
      overflow:hidden;
    }


    .cc-article-hero img{
      display:block;
      width:100%;
      height:auto;
      max-height:680px;
      object-fit:cover;
    }


    .cc-article-body{
      font-size:
        clamp(
          18px,
          2vw,
          21px
        );
      line-height:2;
      color:var(--reader-ink);
    }


    /*
      تنضيد المتن:
      سقف مقياس 34em متسق عبر الشاشات
      + شد عربي بالنقاط المرنة المتاحة للمتصفح (فراغات، inter-word)
      + كسر أسطر محسّن (pretty) حيث تدعمه المحركات.
    */

    .cc-article-body p{
      margin:
        0 0 26px;
      max-inline-size:34em;
      margin-inline:auto;
      text-align:justify;
      text-align-last:start;
      text-justify:inter-word;
      text-wrap:pretty;
    }


    .cc-article-body .cc-h{
      display:block;
      margin:38px 0 14px;
      font-size:24px;
      font-weight:800;
      color:var(--reader-ink);
    }

    .cc-article-body .cc-quote{
      display:block;
      margin:24px 0;
      padding:14px 22px;
      border-right:4px solid var(--red);
      background:var(--surface-2);
      font-size:.95em;
      color:var(--reader-muted);
    }

    .cc-article-image{
      width:100%;
      margin:
        44px
        0;
    }


    .cc-article-image img{
      display:block;
      width:100%;
      height:auto;
      max-height:700px;
      object-fit:cover;
    }


    .cc-article-date{
      margin-top:35px;
      padding-top:20px;
      border-top:1px solid var(--reader-line);
      font-size:14px;
      color:var(--reader-muted);
    }


    .cc-no-content{
      padding:40px 0;
      color:var(--reader-muted);
    }


    .cc-share{
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      gap:14px;
      margin-top:30px;
      padding-top:26px;
      border-top:1px solid var(--reader-line);
    }


    .cc-share-label{
      font-size:13px;
      font-weight:700;
      letter-spacing:.3px;
      color:var(--reader-muted);
    }


    .cc-share-btns{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
    }


    .cc-share-btn{
      display:inline-flex;
      align-items:center;
      gap:7px;
      padding:9px 13px;
      border:1px solid var(--reader-line);
      background:var(--reader-bg);
      color:var(--reader-muted);
      font-family:inherit;
      font-size:13px;
      font-weight:600;
      line-height:1;
      cursor:pointer;
      transition:
        background .18s,
        border-color .18s,
        color .18s;
    }


    .cc-share-btn svg{
      width:16px;
      height:16px;
      flex:none;
    }


    .cc-share-btn:hover{
      border-color:var(--reader-ink);
      background:var(--reader-ink);
      color:var(--reader-bg);
    }


    .cc-share-btn.is-done{
      border-color:var(--red);
      background:var(--red);
      color:#fff;
    }


    body.cc-reader-open{
      overflow:hidden;
    }


    @media(max-width:700px){

      .cc-reader-inner{
        padding:
          60px
          20px
          60px;
      }


      .cc-reader-close{
        top:10px;
        right:10px;
        width:40px;
        height:40px;
        font-size:27px;
      }


      .cc-article-title{
        font-size:32px;
      }


      .cc-article-body{
        font-size:18px;
        line-height:1.9;
      }


      .cc-article-image{
        margin:
          34px
          0;
      }


      .cc-share{
        gap:10px;
      }


      .cc-share-btn{
        padding:8px 11px;
        font-size:12px;
      }


    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   ARTICLE CONTENT
========================================================= */

function articleParagraphs(
  content
){

  if(!content){

    return [];

  }


  /*
    نحافظ على الفقرات.
    المستخدم يفصل الفقرات بسطر فارغ.
  */

  return String(content)
    .replace(
      /\r\n/g,
      '\n'
    )
    .split(
      /\n\s*\n/
    )
    .map(
      p=>p.trim()
    )
    .filter(Boolean);

}


/* =========================================================
   ARTICLE IMAGE
========================================================= */

/*
  تنسيق نص المقال:
  escape أولاً ثم رموز بسيطة
  **عريض** / ## عنوان / > اقتباس
*/

function formatArticleText(text){

  return String(text??'')
    .replace(/\r\n/g,'\n')
    .split('\n')
    .map(line=>{

      const safe=esc(line);

      if(/^##[ \t]+/.test(line)){

        return safe.replace(
          /^##[ \t]+(.*)$/,
          '<span class="cc-h">$1</span>'
        );

      }

      if(/^>[ \t]?/.test(line)&&line.trim()){

        return safe.replace(
          /^&gt;[ \t]?(.*)$/,
          '<span class="cc-quote">$1</span>'
        );

      }

      return safe;

    })
    .map(line=>
      line.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong>$1</strong>'
      )
    )
    /*
      الأسطر داخل الفقرة تُدمج بفراغ (كسر مرن)
      بدل <br> إجباري.
    */
    .join(' ');

}


function articleImage(
  url,
  alt=''
){

  const safe=
    safeUrl(url);

  if(!safe){
    return '';
  }


  return `

    <figure
      class="cc-article-image"
    >

      <img
        src="${esc(safe)}"
        alt="${esc(alt)}"
        loading="lazy"
      >

    </figure>

  `;

}


/* =========================================================
   ARTICLE SHARE
========================================================= */

function articleLink(id){

  return (
    location.origin +
    location.pathname +
    location.search +
    '#article-' +
    encodeURIComponent(id)
  );

}


function shareIcon(path){

  return `

    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >

      <path d="${path}"></path>

    </svg>

  `;

}


function shareBar(article){

  const url=
    articleLink(
      article.id
    );


  const title=
    article.title ||
    'ضد السينما !؟';


  const e=
    encodeURIComponent;


  const targets=[

    {
      label:'فيسبوك',
      href:
        'https://www.facebook.com/sharer/sharer.php?u='+
        e(url),
      icon:'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'
    },

    {
      label:'X',
      href:
        'https://twitter.com/intent/tweet?url='+
        e(url)+
        '&text='+
        e(title),
      icon:'M4 4l16 16M20 4L4 20'
    },

    {
      label:'واتساب',
      href:
        'https://api.whatsapp.com/send?text='+
        e(title+'\n'+url),
      icon:'M7.9 20A9 9 0 1 0 4 16.1L2 22Z'
    },

    {
      label:'تيليجرام',
      href:
        'https://t.me/share/url?url='+
        e(url)+
        '&text='+
        e(title),
      icon:'m22 2-7 20-4-9-9-4Zm0 0L11 13'
    },

    {
      label:'البريد',
      href:
        'mailto:?subject='+
        e(title)+
        '&body='+
        e(url),
      icon:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-10 5L2 7'
    }

  ];


  return `

    <div class="cc-share">

      <span class="cc-share-label">
        شارك المقال
      </span>

      <div class="cc-share-btns">

        ${
          targets.map(
            t=>`

            <a
              class="cc-share-btn"
              href="${esc(t.href)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="مشاركة على ${esc(t.label)}"
            >

              ${shareIcon(t.icon)}

              <span>
                ${esc(t.label)}
              </span>

            </a>

          `
          ).join('')
        }

        <button
          class="cc-share-btn"
          id="ccShareCopy"
          type="button"
          aria-label="نسخ رابط المقال"
        >

          ${shareIcon('M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7')}

          <span>
            نسخ الرابط
          </span>

        </button>

      </div>

    </div>

  `;

}


function legacyCopy(
  text,
  onDone
){

  try{

    const field=
      document.createElement(
        'textarea'
      );


    field.value=text;
    field.setAttribute('readonly','');
    field.style.position='fixed';
    field.style.top='-1000px';

    document.body.appendChild(field);
    field.select();

    document.execCommand('copy');

    document.body.removeChild(field);

    onDone();

  }catch(e){}

}


function bindShareCopy(article){

  const button=
    document.getElementById(
      'ccShareCopy'
    );


  if(!button){
    return;
  }


  const label=
    button.querySelector(
      'span'
    );


  const done=()=>{

    if(label){

      label.textContent=
        'تم نسخ الرابط';

    }

    button.classList.add(
      'is-done'
    );

  };


  button.onclick=function(){

    const url=
      articleLink(
        article.id
      );


    let settled=false;


    const finish=()=>{

      if(settled){
        return;
      }

      settled=true;

      done();

    };


    /*
      في بعض المتصفحات لا تُكمل كتابة الحافظة،
      لذا نُبقي المسار القديم احتياطاً بعد مهلة قصيرة.
    */

    setTimeout(
      ()=>{

        if(!settled){

          legacyCopy(
            url,
            finish
          );

        }

      },
      700
    );


    if(
      navigator.clipboard &&
      navigator.clipboard.writeText
    ){

      navigator.clipboard
        .writeText(url)
        .then(finish)
        .catch(
          ()=>legacyCopy(url,finish)
        );

      return;

    }


    legacyCopy(
      url,
      finish
    );

  };

}


/* =========================================================
   OPEN ARTICLE
========================================================= */

function openArticle(id){

  createArticleReader();


  const articles=
    window.__CC_ARTICLES__ ||
    [];


  const article=
    articles.find(
      x=>String(x.id)===String(id)
    );


  if(!article){

    return;

  }

  /*
    عدّاد القراءات — RPC آمن
    (لا تحديث مباشر للعموم).
  */

  Promise.resolve(
    db.rpc(
      'increment_views',
      {article_id:article.id}
    )
  )
    .then(()=>{

      const badge=
        document.querySelector(
          '.cc-article-date .views'
        );

      if(badge){
        badge.textContent=
          viewsLabel(
            (Number(article.views)||0)+1
          );
      }

    })
    .catch(()=>{});


  const target=
    document.getElementById(
      'ccArticleContent'
    );


  if(!target){
    return;
  }


  const paragraphs=
    articleParagraphs(
      article.content
    );


  const authorImage=
    safeUrl(
      article.author_image
    );


  const image1=
    safeUrl(
      article.image_1
    );


  const image2=
    safeUrl(
      article.image_2
    );


  const image3=
    safeUrl(
      article.image_3
    );


  /*
    الصورة الثانية:
    توضع في منتصف المقال تقريباً.

    الصورة الثالثة:
    توضع قبل الفقرة الأخيرة.
  */

  const total=
    paragraphs.length;


  let middleIndex=
    Math.ceil(
      total / 2
    );


  /*
    إذا كان المقال قصيراً جداً،
    لا نضع الصورة الثانية قبل البداية.
  */

  if(total<=2){

    middleIndex=1;

  }


  let body='';


  paragraphs.forEach(
    (paragraph,index)=>{

      /*
        الصورة الثانية
        قبل الفقرة الوسطى.
      */

      if(
        image2 &&
        index===middleIndex
      ){

        body+=
          articleImage(
            image2,
            article.title
          );

      }


      /*
        الصورة الثالثة
        قبل الفقرة الأخيرة.
      */

      if(
        image3 &&
        index===total-1
      ){

        body+=
          articleImage(
            image3,
            article.title
          );

      }


      body+=`

        <p
          class="cc-p"
          ${
            article.font_family
              ?
              `style="font-family:'${esc(
                article.font_family
              )}','IBM Plex Sans Arabic',sans-serif"`
              :
              ''
          }
        >
          ${formatArticleText(paragraph)}
        </p>

      `;

    }
  );


  /*
    إذا لم يكن هناك نص مقسم إلى فقرات
    لكن توجد صورة ثانية أو ثالثة.
  */

  if(!paragraphs.length){

    body=`

      <div class="cc-no-content">

        لا يوجد نص لهذا المقال بعد.

      </div>

      ${
        image2
        ?
        articleImage(
          image2,
          article.title
        )
        :
        ''
      }

      ${
        image3
        ?
        articleImage(
          image3,
          article.title
        )
        :
        ''
      }

    `;

  }


  target.innerHTML=`

    <div
      class="cc-article-category"
    >

      ${esc(
        article.category ||
        'نقد سينمائي'
      )}

    </div>


    <h1
      class="cc-article-title"
    >

      ${esc(
        article.title
      )}

    </h1>


    <div
      class="cc-article-author"
    >

      ${
        authorImage

        ?

        `
        <img
          class="cc-author-photo"
          src="${esc(authorImage)}"
          alt="${esc(
            article.author ||
            'الكاتب'
          )}"
        >
        `

        :

        `
        <div
          class="cc-author-placeholder"
        >

          ${esc(
            (
              article.author ||
              'ك'
            ).slice(0,1)
          )}

        </div>
        `
      }


      ${
        article.author
        ?

        `<a
          class="cc-author-link"
          href="author.html?name=${
            encodeURIComponent(article.author)
          }"
        >
          ${esc(article.author)}
        </a>`

        :

        '<span>هيئة التحرير</span>'
      }

    </div>


    ${
      image1

      ?

      articleImage(
        image1,
        article.title
      )

      :

      ''
    }


    <div
      class="cc-article-body"
    >

      ${body}

    </div>


    ${
      article.created_at

      ?

      `
      <div
        class="cc-article-date"
      >

        <span>
          ${formatArticleDate(
            article.created_at
          )}
        </span>

        <span class="views">
          ${viewsLabel(article.views)}
        </span>

      </div>
      `

      :

      ''
    }


    ${shareBar(article)}

  `;


  /*
    Open
  */

  const reader=
    document.getElementById(
      'ccArticleReader'
    );


  reader.classList.add(
    'is-open'
  );


  document.body.classList.add(
    'cc-reader-open'
  );


  /*
    Start from article top.
  */

  reader.scrollTop=0;


  /*
    Share bar: copy-link button.
  */

  bindShareCopy(article);


  /*
    Keep the article addressable,
    so shared links point to it.
  */

  const hash=
    '#article-'+
    encodeURIComponent(article.id);


  if(location.hash!==hash){

    history.replaceState(
      null,
      '',
      location.pathname+
      location.search+
      hash
    );

  }

}


/* =========================================================
   CLOSE ARTICLE
========================================================= */

function closeArticle(){

  const reader=
    document.getElementById(
      'ccArticleReader'
    );


  if(!reader){
    return;
  }


  reader.classList.remove(
    'is-open'
  );


  document.body.classList.remove(
    'cc-reader-open'
  );


  /*
    Clear URL hash if any.
  */

  if(
    location.hash.startsWith(
      '#article-'
    )
  ){

    history.replaceState(
      null,
      '',
      location.pathname +
      location.search
    );

  }

}


/* =========================================================
   DATE
========================================================= */

function formatArticleDate(
  value
){

  try{

    const date=
      new Date(value);


    if(
      Number.isNaN(
        date.getTime()
      )
    ){

      return '';

    }


    return new Intl.DateTimeFormat(
      'ar-DZ',
      {
        year:'numeric',
        month:'long',
        day:'numeric'
      }
    ).format(date);

  }catch(e){

    return '';

  }

}


/* =========================================================
   OPEN ARTICLE FROM SHARED LINK
========================================================= */

function openArticleFromHash(){

  const hash=
    location.hash ||
    '';


  if(
    !hash.startsWith(
      '#article-'
    )
  ){

    return;

  }


  let id=
    hash.slice(9);


  try{

    id=decodeURIComponent(id);

  }catch(e){}


  if(id){

    openArticle(id);

  }

}


/* =========================================================
   ARCHIVE PAGES (section / author)
========================================================= */

async function renderArchivePage(mode){

  const params=
    new URLSearchParams(
      location.search
    );

  const key=
    (mode==='section'
      ? params.get('slug')
      : params.get('name')
    ) || '';

  const [
    sections,
    articles,
    settings
  ]=await Promise.all([

    get(
      'sections',
      'sort_order',
      true
    ),

    get(
      'articles',
      'sort_order',
      true
    ),

    db
      .from('settings')
      .select('*')
      .eq('id',true)
      .maybeSingle()
      .then(
        r=>r.data||null
      )
      .catch(
        ()=>null
      )

  ]);

  const titleTarget=
    $('#pageTitle');

  const descTarget=
    $('#pageDesc');

  if(!titleTarget){
    return;
  }

  const wanted=
    key.trim();

  let list=
    articles.filter(
      x=>x.visible!==false
    );

  if(mode==='section'){

    const match=
      sections.find(
        s=>s.name===wanted
      );

    list=list.filter(
      x=>
        (x.category||'')
          .trim()
          .startsWith(wanted)
    );

    titleTarget.textContent=
      match
        ? match.name
        : wanted;

    if(descTarget && match){
      descTarget.textContent=
        match.description || '';
    }

    const eyebrow=
      $('#pageEyebrow');

    if(eyebrow){
      eyebrow.textContent='قسم';
    }

  }else{

    list=list.filter(
      x=>
        (x.author||'')
          .trim()===wanted
    );

    titleTarget.textContent=
      wanted || 'كاتب';

    const eyebrow=
      $('#pageEyebrow');

    if(eyebrow){
      eyebrow.textContent='كاتب';
    }

  }

  document.title=
    titleTarget.textContent
    + ' | ضد السينما';

  const target=
    $('#pageArticles');

  if(!target){
    return;
  }

  if(!list.length){

    target.innerHTML=`
      <div class="empty">
        لا توجد مقالات منشورة هنا بعد.
      </div>
    `;

    return;

  }

  window.__CC_ARTICLES__=
    list;

  target.innerHTML=
    list.map(articleCard)
      .join('');

  bindArticleClicks(target);

  createArticleReader();

  applySiteSettings(
    settings
  );

  openArticleFromHash();

  window.addEventListener(
    'hashchange',
    openArticleFromHash
  );

}

/* =========================================================
   SITE SETTINGS (accent + footer) — all pages
========================================================= */

function applySiteSettings(settings){

  if(!settings){
    return;
  }

  if(settings.accent_color){
    document.documentElement
      .style
      .setProperty(
        '--red',
        settings.accent_color
      );
  }

  const footNote=
    $('#footNote');

  if(
    footNote &&
    settings.footer_note
  ){
    footNote.textContent=
      settings.footer_note;
  }

}


/* =========================================================
   MAIN
========================================================= */

async function main(){

  const path=
    location.pathname;

  if(
    path.endsWith('section.html') ||
    path.endsWith('author.html')
  ){

    renderArchivePage(
      path.endsWith('section.html')
        ? 'section'
        : 'author'
    );

    return;

  }

  const [
    issues,
    sections,
    articles,
    team,
    editors,
    settings
  ]=await Promise.all([

    get(
      'issues',
      'issue_number',
      false
    ),

    get(
      'sections',
      'sort_order',
      true
    ),

    get(
      'articles',
      'sort_order',
      true
    ),

    get(
      'team',
      'sort_order',
      true
    ),

    get(
      'editors',
      'sort_order',
      true
    ),

    db
      .from('settings')
      .select('*')
      .eq('id',true)
      .maybeSingle()
      .then(
        r=>r.data||null
      )
      .catch(
        ()=>null
      )

  ]);


  /*
    Issues
  */

  const all=
    issues.length
    ?
    issues
    :
    fallbackIssues;


  renderIssues(
    all
  );


  /*
    Sections
  */

  renderSections(
    sections
  );


  /*
    Articles
  */

  renderArticles(
    articles.filter(
      x=>x.visible!==false
    )
  );


  /*
    Team
  */

  renderTeam(
    team
  );


  /*
    Editors
  */

  renderEditors(
    editors
  );


  /*
    Current issue
  */

  let current=
    settings?.current_issue_id
    ?
    issues.find(
      x=>
        x.id===
        settings.current_issue_id
    )
    :
    null;


  if(!current){

    current=
      issues[0] ||
      null;

  }


  renderCurrent(
    current
  );


  /*
    Site settings
  */

  if(settings){

    if(
      settings.site_name
    ){

      document.title=
        settings.site_name;

    }


    if(
      settings.hero_title &&
      $('#heroTitle')
    ){

      $('#heroTitle')
        .textContent=
          settings.hero_title;

    }


    if(
      settings.hero_subtitle &&
      $('#heroDesc')
    ){

      $('#heroDesc')
        .textContent=
          settings.hero_subtitle;

    }


    if(
      settings.about_title &&
      $('#aboutTitle')
    ){

      $('#aboutTitle')
        .textContent=
          settings.about_title;

    }


    if(
      settings.about_text &&
      $('#aboutText')
    ){

      $('#aboutText')
        .textContent=
          settings.about_text;

    }


    if(
      settings.about_text_2 &&
      $('#aboutText2')
    ){

      $('#aboutText2')
        .textContent=
          settings.about_text_2;

    }


    if(
      settings.contact_email &&
      $('#contactEmail')
    ){

      $('#contactEmail').href=
        'mailto:'+
        settings.contact_email;

      $('#contactEmail')
        .textContent=
          settings.contact_email;

    }

  }


  applySiteSettings(settings);

  /*
    Create reader now so the first
    article opens instantly.
  */

  createArticleReader();


  /*
    Shared links: open the article
    when the page loads with a hash.
  */

  openArticleFromHash();


  window.addEventListener(
    'hashchange',
    openArticleFromHash
  );

}


/* =========================================================
   START
========================================================= */

initTheme();

main();
