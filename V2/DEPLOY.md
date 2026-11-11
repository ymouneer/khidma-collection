# نظام خدمة v2 - دليل النشر

## نظرة عامة
- Schema جديد كامل (normalized، UUIDs، multi-funding، enums)
- يُنشر بجانب v1 - لا يؤثر على نشوى الحالية حتى تقرر التبديل
- Backup إجباري قبل أي عملية
- Audit log تلقائي

---

## الملفات (١٠ ملفات)

| ملف | وظيفة |
|------|------|
| `home.html` | الصفحة الرئيسية |
| `collection.html` | أداة التحصيل (نشوى) |
| `admin.html` | إدارة الكفالات + الأشخاص + تعديلات |
| `closure.html` | معالج إقفال الشهر |
| `reports.html` | التقارير والرسائل |
| `backups.html` | النسخ الاحتياطية |
| `audit.html` | سجل التغييرات |
| `import.html` | **الاستيراد الأولي (مرة واحدة)** |
| `config.js` | Firebase + helpers |
| `style.css` | التصميم |
| `database.rules.json` | قواعد Firebase |

---

## خطوات النشر

### ١. حدّث قواعد Firebase (دقيقتين)

افتح: https://console.firebase.google.com/project/khidma-collection/database/khidma-collection-default-rtdb/rules

الصق محتوى `database.rules.json` → Publish.

**هذا يضيف `/khidma_v2/` بدون المساس بما سبق.**

### ٢. ارفع الملفات على GitHub (٣ دقائق)

ارفع كل ملفات الـ v2 في مجلد `v2/` داخل الـ repo:
```
ymouneer.github.io/khidma-collection/
├── index.html         ← نشوى v1 (لا تلمسها لحد التبديل)
├── admin.html         ← v1 القديمة (ممكن تحذف أو تسيبها)
├── ...v1 files...
└── v2/
    ├── home.html
    ├── collection.html
    ├── admin.html
    ├── closure.html
    ├── reports.html
    ├── backups.html
    ├── audit.html
    ├── import.html
    ├── config.js
    └── style.css
```

### ٣. استورد البيانات (٥ دقائق) - **مرة واحدة فقط**

افتح: `ymouneer.github.io/khidma-collection/v2/import.html`

١. ارفع ملف `migrated_data.json` اللي بعتته
٢. راجع المعاينة: المفروض تلاقي ٣٢٢ شخص، ٣٢٥ كفالة، ٣ شهور
٣. اضغط "استيراد"
٤. التحقق التلقائي يعرض النتيجة

### ٤. اختبار شامل (١٠ دقائق)

افتح: `.../v2/home.html`

- [ ] `admin.html` - ٣٢٥ كفالة، فلاتر شغالة، تعديل يدخل الطابور
- [ ] `collection.html` - ٥٤ PT، progress bar، مجاميع صحيحة
- [ ] `closure.html` - غيّر شهر لـ `2026-10` → المفروض الأرقام تطابق (٢٦٦,٤٧٠)
- [ ] `backups.html` - Backup Now يعمل
- [ ] `audit.html` - يعرض العمليات
- [ ] `reports.html` - غيّر شهر لـ `2026-10` → ولّد تقرير

### ٥. **التبديل الكامل** (بعد التأكد ١٠٠٪)

بعد ما تتأكد كل حاجة شغالة في v2:

**١. اختبار Nashwa flow كامل** - افتح collection.html، اضغط على أي PT، مارك paid/unpaid، شوف "محفوظ ☁️"

**٢. استبدل index.html الرئيسي:**
```
# في GitHub، سمي الملف القديم:
index.html → index-v1-archived.html

# ثم انقل v2/collection.html كـ index.html:
cp v2/collection.html index.html
```

أو ببساطة: **خلي نشوى تبوك-مارك الـ URL الجديد**: `.../v2/collection.html`

**٣. أخبر نشوى بالتبديل** - URL جديد، نفس طريقة الاستخدام

---

## لو حصل أي خطأ

- **"Permission denied":** قواعد Firebase لم تُحدَّث بعد
- **"ملف غير صالح":** استخدم ملف `migrated_data.json` المُرفق فقط
- **"No data" في Admin:** الاستيراد لم يتم أو فشل
- **لعودة سريعة:** افتح `backups.html` → اختار آخر نسخة → استرداد

---

## ما تم تحسينه مقابل v1

| v1 | v2 |
|----|-----|
| hash-based IDs → تصادم محتمل | UUIDs عشوائية → لا تصادم أبداً |
| كفالة = مبلغ واحد | funding array → مصادر متعددة |
| prepaid نصّ حر | prepaid_through: "YYYY-MM" مُهيكل |
| area/case_type نصّ حر | enums → لا typos |
| علاقة بالاسم (ضمنية) | guardian_id, kafeel_id, pt_id (صريحة) |
| تصميم بسيط | تصميم أنيق (Tajawal, gradients, animations) |
| no detail fields | ميلاد، جنس، مرحلة تعليمية، ملاحظات خاصة |
| Audit عادي | Audit log منفصل بفلاتر |

---

## الـ Guardrails (التزاماتي)

- ✅ **لا Import على root** - الـ import.html يكتب في paths محددة
- ✅ **Backup تلقائي** - قبل أي إقفال أو استرداد
- ✅ **Confirm بتفاصيل** - كل عملية مهمة تعرض الأرقام قبل التأكيد
- ✅ **Audit shaded** - كل كتابة مسجّلة
- ✅ **Safe restore** - استرداد مع safety backup + double confirmation
- ✅ **Schema validation** - enums + required fields

---

## تواصل معي

لو حصل أي شيء:
- ارسلي screenshot
- تحت أي ظرف لا تحذف `/khidma/` القديمة (كـ backup)
- تحت أي ظرف لا تحذف الملفات القديمة على GitHub حتى نتأكد ١٠٠٪
