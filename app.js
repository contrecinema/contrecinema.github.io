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

      <div
        class="section-card"
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

      </div>

    `).join('');

}


/* =========================================================
   ARTICLE CARD
========================================================= */

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
      .slice(0,9)
      .map(articleCard)
      .join('');


  /*
    click
  */

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
      background:#fff;
      box-shadow:
        0 20px 70px
        rgba(0,0,0,.25);
    }


    .cc-reader-inner{
      width:100%;
      padding:
        70px
        70px
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
      background:#111;
      color:#fff;
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
      color:#a40000;
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
      color:#111;
    }


    .cc-article-author{
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom:30px;
      font-size:16px;
      color:#444;
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
      background:#eee;
      color:#555;
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
      color:#222;
    }


    .cc-article-body p{
      margin:
        0 0 26px;
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
      border-top:1px solid #ddd;
      font-size:14px;
      color:#777;
    }


    .cc-no-content{
      padding:40px 0;
      color:#777;
    }


    .cc-share{
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      gap:14px;
      margin-top:30px;
      padding-top:26px;
      border-top:1px solid #ddd;
    }


    .cc-share-label{
      font-size:13px;
      font-weight:700;
      letter-spacing:.3px;
      color:#777;
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
      border:1px solid #d8d2ca;
      background:#fff;
      color:#444;
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
      border-color:#111;
      background:#111;
      color:#fff;
    }


    .cc-share-btn.is-done{
      border-color:#a91618;
      background:#a91618;
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

        <p>
          ${esc(paragraph)}
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


      <span>

        ${esc(
          article.author ||
          'هيئة التحرير'
        )}

      </span>

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

        ${formatArticleDate(
          article.created_at
        )}

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
   MAIN
========================================================= */

async function main(){

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
      'created_at',
      false
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
    articles
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

main();
