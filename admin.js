/* =========================================================
   CONTRE CINÉMA — ADMIN.JS
   لوحة تحكم آمنة مع Supabase Auth + جدول admins
   المطلوب في HTML:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="admin.js"></script>
   مهم:
   ضع بيانات Supabase الصحيحة في SUPABASE_URL و SUPABASE_ANON_KEY
   ========================================================= */
"use strict";
/* =========================================================
   1. إعدادات SUPABASE
   ========================================================= */
const SUPABASE_URL = "ضع_رابط_مشروعك_هنا";
const SUPABASE_ANON_KEY = "ضع_anon_key_هنا";
/* =========================================================
   2. إنشاء اتصال Supabase
   ========================================================= */
let supabaseClient = null;
function initSupabase() {
    if (
        !SUPABASE_URL ||
        SUPABASE_URL.includes("ضع_") ||
        !SUPABASE_ANON_KEY ||
        SUPABASE_ANON_KEY.includes("ضع_")
    ) {
        console.error("Supabase configuration is missing.");
        return null;
    }
    if (!window.supabase || !window.supabase.createClient) {
        console.error("Supabase library was not loaded.");
        return null;
    }
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    }
    return supabaseClient;
}
/* =========================================================
   3. أدوات الواجهة
   ========================================================= */
function $(id) {
    return document.getElementById(id);
}
function showMessage(message, type = "info") {
    let box = $("adminMessage");
    if (!box) {
        box = document.createElement("div");
        box.id = "adminMessage";
        box.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            z-index:999999;
            max-width:420px;
            padding:14px 18px;
            border-radius:8px;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
            box-shadow:0 8px 30px rgba(0,0,0,.18);
            direction:rtl;
        `;
        document.body.appendChild(box);
    }
    box.textContent = message;
    if (type === "error") {
        box.style.background = "#b42318";
        box.style.color = "#fff";
    }
    else if (type === "success") {
        box.style.background = "#087443";
        box.style.color = "#fff";
    }
    else {
        box.style.background = "#111";
        box.style.color = "#fff";
    }
    clearTimeout(window.__adminMessageTimer);
    window.__adminMessageTimer = setTimeout(() => {
        box.remove();
    }, 5000);
}
/* =========================================================
   4. قراءة حقول تسجيل الدخول
   ========================================================= */
function getLoginEmail() {
    const ids = [
        "email",
        "loginEmail",
        "adminEmail",
        "username"
    ];
    for (const id of ids) {
        const el = $(id);
        if (el && el.value.trim()) {
            return el.value.trim();
        }
    }
    return "";
}
function getLoginPassword() {
    const ids = [
        "password",
        "loginPassword",
        "adminPassword"
    ];
    for (const id of ids) {
        const el = $(id);
        if (el && el.value) {
            return el.value;
        }
    }
    return "";
}
/* =========================================================
   5. التحقق من وجود المستخدم في admins
   =========================================================
   ندعم عدة بنى محتملة لجدول admins:
   id
   user_id
   auth_user_id
   email
   ولا نعتمد على بنية واحدة فقط.
   ========================================================= */
async function checkAdminRecord(user) {
    const client = initSupabase();
    if (!client) {
        throw new Error("تعذر الاتصال بـ Supabase.");
    }
    if (!user || !user.id) {
        throw new Error("لم يتم العثور على جلسة المستخدم.");
    }
    /* -----------------------------------------------------
       المحاولة الأولى:
       user_id = Auth user ID
       ----------------------------------------------------- */
    try {
        const result = await client
            .from("admins")
            .select("*")
            .eq("user_id", user.id)
            .limit(1);
        if (!result.error && result.data && result.data.length > 0) {
            return {
                exists: true,
                record: result.data[0]
            };
        }
    } catch (e) {
        console.warn("admins.user_id check failed:", e);
    }
    /* -----------------------------------------------------
       المحاولة الثانية:
       auth_user_id = Auth user ID
       ----------------------------------------------------- */
    try {
        const result = await client
            .from("admins")
            .select("*")
            .eq("auth_user_id", user.id)
            .limit(1);
        if (!result.error && result.data && result.data.length > 0) {
            return {
                exists: true,
                record: result.data[0]
            };
        }
    } catch (e) {
        console.warn("admins.auth_user_id check failed:", e);
    }
    /* -----------------------------------------------------
       المحاولة الثالثة:
       email = Auth email
       ----------------------------------------------------- */
    if (user.email) {
        try {
            const result = await client
                .from("admins")
                .select("*")
                .eq("email", user.email.toLowerCase())
                .limit(1);
            if (!result.error && result.data && result.data.length > 0) {
                return {
                    exists: true,
                    record: result.data[0]
                };
            }
        } catch (e) {
            console.warn("admins.email check failed:", e);
        }
    }
    return {
        exists: false,
        record: null
    };
}
/* =========================================================
   6. تسجيل الدخول
   ========================================================= */
async function adminLogin(event) {
    if (event) {
        event.preventDefault();
    }
    const client = initSupabase();
    if (!client) {
        showMessage(
            "لم يتم إعداد Supabase داخل admin.js.",
            "error"
        );
        return false;
    }
    const email = getLoginEmail();
    const password = getLoginPassword();
    if (!email) {
        showMessage(
            "أدخل البريد الإلكتروني.",
            "error"
        );
        return false;
    }
    if (!password) {
        showMessage(
            "أدخل كلمة المرور.",
            "error"
        );
        return false;
    }
    const loginButton =
        $("loginButton") ||
        $("adminLoginButton") ||
        document.querySelector(
            'button[type="submit"]'
        );
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.dataset.oldText =
            loginButton.textContent;
        loginButton.textContent =
            "جارٍ تسجيل الدخول...";
    }
    try {
        /* -------------------------------------------------
           تسجيل الدخول الحقيقي عبر Supabase Auth
           ------------------------------------------------- */
        const { data, error } =
            await client.auth.signInWithPassword({
                email: email,
                password: password
            });
        if (error) {
            console.error(
                "Supabase login error:",
                error
            );
            let message =
                "فشل تسجيل الدخول.";
            if (
                error.message &&
                error.message.toLowerCase()
                    .includes("invalid login credentials")
            ) {
                message =
                    "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
            }
            else if (
                error.message &&
                error.message.toLowerCase()
                    .includes("email not confirmed")
            ) {
                message =
                    "البريد الإلكتروني لم يتم تأكيده في Supabase.";
            }
            else if (error.message) {
                message =
                    "فشل تسجيل الدخول: " +
                    error.message;
            }
            showMessage(message, "error");
            return false;
        }
        const user =
            data &&
            data.user
                ? data.user
                : null;
        if (!user) {
            showMessage(
                "تمت محاولة تسجيل الدخول لكن لم يتم إرجاع المستخدم.",
                "error"
            );
            return false;
        }
        /* -------------------------------------------------
           التحقق من جدول admins
           ------------------------------------------------- */
        const adminResult =
            await checkAdminRecord(user);
        if (!adminResult.exists) {
            /*
             * تسجيل الخروج حتى لا يبقى حساب عادي
             * داخل لوحة الإدارة.
             */
            await client.auth.signOut();
            showMessage(
                "تم تسجيل الدخول، لكن هذا الحساب غير موجود في جدول admins. أضف حسابك إلى جدول admins أو اربطه بـ Auth User ID.",
                "error"
            );
            return false;
        }
        /* -------------------------------------------------
           نجاح كامل
           ------------------------------------------------- */
        localStorage.setItem(
            "cc_admin_logged",
            "1"
        );
        localStorage.setItem(
            "cc_admin_email",
            user.email || email
        );
        localStorage.setItem(
            "cc_admin_user_id",
            user.id
        );
        showMessage(
            "تم تسجيل الدخول بنجاح.",
            "success"
        );
        /* -------------------------------------------------
           الانتقال إلى لوحة التحكم
           ------------------------------------------------- */
        setTimeout(() => {
            const target =
                new URLSearchParams(
                    window.location.search
                ).get("redirect");
            if (target) {
                window.location.href =
                    target;
            } else {
                window.location.href =
                    "admin.html";
            }
        }, 700);
        return true;
    }
    catch (error) {
        console.error(
            "Unexpected admin login error:",
            error
        );
        showMessage(
            "حدث خطأ غير متوقع أثناء تسجيل الدخول. افتح Console لمعرفة التفاصيل.",
            "error"
        );
        return false;
    }
    finally {
        if (loginButton) {
            loginButton.disabled = false;
            if (loginButton.dataset.oldText) {
                loginButton.textContent =
                    loginButton.dataset.oldText;
            }
        }
    }
}
/* =========================================================
   7. حماية لوحة الإدارة
   ========================================================= */
async function requireAdmin() {
    const client = initSupabase();
    if (!client) {
        showMessage(
            "تعذر الاتصال بـ Supabase.",
            "error"
        );
        return false;
    }
    try {
        const {
            data: {
                session
            }
        } = await client.auth.getSession();
        if (
            !session ||
            !session.user
        ) {
            window.location.href =
                "login.html";
            return false;
        }
        const adminResult =
            await checkAdminRecord(
                session.user
            );
        if (!adminResult.exists) {
            await client.auth.signOut();
            window.location.href =
                "login.html";
            return false;
        }
        window.CC_ADMIN_USER =
            session.user;
        window.CC_ADMIN_RECORD =
            adminResult.record;
        return true;
    }
    catch (error) {
        console.error(
            "Admin verification error:",
            error
        );
        window.location.href =
            "login.html";
        return false;
    }
}
/* =========================================================
   8. تسجيل الخروج
   ========================================================= */
async function adminLogout() {
    const client = initSupabase();
    if (!client) {
        return;
    }
    try {
        await client.auth.signOut();
    } catch (error) {
        console.error(
            "Logout error:",
            error
        );
    }
    localStorage.removeItem(
        "cc_admin_logged"
    );
    localStorage.removeItem(
        "cc_admin_email"
    );
    localStorage.removeItem(
        "cc_admin_user_id"
    );
    window.location.href =
        "login.html";
}
/* =========================================================
   9. مراقبة تغير الجلسة
   ========================================================= */
function watchAuthState() {
    const client = initSupabase();
    if (!client) {
        return;
    }
    client.auth.onAuthStateChange(
        async (event, session) => {
            console.log(
                "Auth event:",
                event
            );
            if (
                event === "SIGNED_OUT"
            ) {
                localStorage.removeItem(
                    "cc_admin_logged"
                );
                localStorage.removeItem(
                    "cc_admin_email"
                );
                localStorage.removeItem(
                    "cc_admin_user_id"
                );
                return;
            }
            if (
                event === "SIGNED_IN" &&
                session &&
                session.user
            ) {
                console.log(
                    "Signed in:",
                    session.user.email
                );
            }
        }
    );
}
/* =========================================================
   10. فتح لوحة الإدارة
   ========================================================= */
async function openAdmin() {
    const allowed =
        await requireAdmin();
    if (!allowed) {
        return;
    }
    document.body.classList.add(
        "admin-authenticated"
    );
    const email =
        window.CC_ADMIN_USER &&
        window.CC_ADMIN_USER.email
            ? window.CC_ADMIN_USER.email
            : "";
    const emailElements =
        document.querySelectorAll(
            "[data-admin-email]"
        );
    emailElements.forEach(
        el => {
            el.textContent = email;
        }
    );
}
/* =========================================================
   11. ربط نموذج الدخول تلقائياً
   ========================================================= */
function bindLoginForm() {
    const forms =
        document.querySelectorAll(
            "form"
        );
    forms.forEach(form => {
        const emailInput =
            form.querySelector(
                'input[type="email"]'
            );
        const passwordInput =
            form.querySelector(
                'input[type="password"]'
            );
        if (
            emailInput &&
            passwordInput
        ) {
            form.addEventListener(
                "submit",
                adminLogin
            );
        }
    });
    const button =
        $("loginButton") ||
        $("adminLoginButton");
    if (button) {
        button.addEventListener(
            "click",
            adminLogin
        );
    }
}
/* =========================================================
   12. تهيئة الصفحة
   ========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    async () => {
        initSupabase();
        watchAuthState();
        bindLoginForm();
        /*
         * إذا كانت الصفحة هي admin.html
         * نحميها تلقائياً.
         */
        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();
        if (
            currentPage === "admin.html" ||
            currentPage === "dashboard.html"
        ) {
            await openAdmin();
        }
    }
);
/* =========================================================
   13. جعل الدوال متاحة للـ HTML
   ========================================================= */
window.adminLogin =
    adminLogin;
window.requireAdmin =
    requireAdmin;
window.adminLogout =
    adminLogout;
window.openAdmin =
    openAdmin;
window.checkAdminRecord =
    checkAdminRecord;
window.initSupabase =
    initSupabase;
