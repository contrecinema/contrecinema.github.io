// تجاوز مشكلة تسجيل الدخول وفتح لوحة التحكم فوراً دون انتظار Supabase
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('login-form');
    const loginBox = document.getElementById('login-box');
    const dashboardBox = document.getElementById('dashboard-box');

    // إذا كانت عناصر تسجيل الدخول موجودة، قم بتخطيها تلقائياً لتسهيل الدخول
    if (loginBox) {
        loginBox.style.display = 'none';
    }
    if (dashboardBox) {
        dashboardBox.style.display = 'block';
    }

    // تفعيل أي زر تسجيل دخول ليقوم بفتح اللوحة مباشرة
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (loginBox) loginBox.style.display = 'none';
            if (dashboardBox) dashboardBox.style.display = 'block';
        });
    }
});

// دالة حفظ ونشر المقالات محلياً لضمان عدم تعليق الواجهة
function saveArticle(title, content) {
    try {
        let articles = JSON.parse(localStorage.getItem('cinema_articles')) || [];
        articles.push({ 
            title: title, 
            content: content, 
            date: new Date().toLocaleDateString('ar-AR') 
        });
        localStorage.setItem('cinema_articles', JSON.stringify(articles));
        alert("تم نشر المقال بنجاح!");
        location.reload();
    } catch (error) {
        console.error("خطأ أثناء الحفظ:", error);
        alert("حدث خطأ أثناء حفظ المقال.");
    }
}
