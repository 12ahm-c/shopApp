# دليل تحويل تطبيق ويب من سطح المكتب إلى موبايل أولاً

> **الغرض:** هذا البرومبت مصمم لإرساله لـ AI Agent في مشروعك الآخر لتنفيذ تحويل تصميم التطبيق من سطح المكتب إلى تجربة موبايل أصلية (Native App-like).

---

## البرومبت (ابنسخه وأرسله للـ AI Agent)

---

```
أنا أريدك أن تقوم بتحويل تطبيق الويب هذا من تصميم سطح المكتب إلى تصميم Mobile-First يشبه التطبيق الأصلي (Native App). اتبع الخطوات التالية بالترتيب:

## 1. فهم المشروع أولاً
- اقرأ `package.json` لفهم الـ Tech Stack والمكتبات المستخدمة
- ابحث عن المكونات الرئيسية (Layout, Pages, UI Components)
- حدد ما إذا كان المشروع يستخدم React, Vue, أو غيره
- حدد مكتبة CSS المستخدمة (Tailwind, CSS Modules, Styled Components, etc.)

## 2. إنشاء Mobile Layout جديد
أنشئ مكون `MobileLayout.tsx` (أو ما يعادله) يحتوي على:

### أ. Bottom Tab Bar (شريط تنقل سفلي)
- شريط تنقل ثابت في أسفل الشاشة (مثل تطبيقات iOS/Android)
- يظهر最多 5 تبويبات رئيسية + تبويب "المزيد" للموارد الإضافية
- كل تبويب يحتوي على أيقونة + نص قصير
- التبويب النشط يكون بلون مميز (primary color)
- اجعل التبويبات مرتبة حسب الأهمية

### ب. Header بسيط
- عنوان الصفحة الحالي
- زر رجوع (إذا كانت الصفحة فرعية)
- أي أزرار إضافية محدودة (مثل إشعارات أو بحث)

### ج. Content Area
- المحتوى يشغل المساحة المتبقية بين Header و Tab Bar
- دعم التمرير (overflow scroll)
- مراعاة Safe Area Insets للأجهزة التي بها notch

### د. قائمة "المزيد" (More Menu)
- عند الضغط على تبويب "المزيد"، تظهر قائمة منبثقة (popup/grid)
- تحتوي على باقي العناصر التي لا تصلح للشريط السفلي
- تصميم grid (شبكة) مثل قائمة التطبيقات

## 3. تعديل المكونات UI Components

### أ. Modal → Bottom Sheet
- حوّل جميع Modals إلى Bottom Sheet على الموبايل
- يظهر من الأسفل مع drag handle bar في الأعلى
- خلفية معتمة (backdrop) عند الفتح
- على سطح المكتب يبقى Modal عادي (responsive)

```tsx
// النمط المقترح
<Modal className="items-end sm:items-center">
  <div className="drag-handle w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
  {/* المحتوى */}
</Modal>
```

### ب. Tables → Card-Based Layout
- حوّل جميع جداول البيانات (Tables) إلى بطاقات (Cards) على الموبايل
- كل صف يصبح بطاقة مستقلة
- القيم تظهر كـ label/value pairs
- على سطح المكتب يبقى الجدول عادي

```tsx
// على الموبايل: Card layout
<div className="sm:hidden space-y-3">
  {data.map(row => (
    <div key={row.id} className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold">{row.name}</span>
        <Badge status={row.status} />
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>التاريخ:</span>
          <span>{row.date}</span>
        </div>
        {/* باقي الحقول */}
      </div>
    </div>
  ))}
</div>

// على سطح المكتب: Table عادي
<div className="hidden sm:block">
  <Table>...</Table>
</div>
```

### ج. Button - إضافة Touch Feedback
- أضف `active:scale-[0.97]` أو `active:scale-95` للحصول على تأثير لمسي
- اجعل الأزرار كبيرة بما يكفي للضغط by finger (min 44px height)
- استخدم `transition-all` للحصول على تأثير سلس

### د. Inputs - تكبير لمس الشاشة
- اجعل حقول الإدخال أكبر على الموبايل (min-height: 44px)
- أضف `text-base` أو `text-lg` لتحسين القراءة
- اجعل الحواف (padding) واسعة

### هـ. Pagination - تبسيط
- على الموبايل، استخدم pagination بسيط (Previous/Next) بدلاً من أرقام صفحات كثيرة
- أو استخدم "Load More" button

## 4. تعديل الصفحات (Pages)

### أ. List Pages (صفحات القوائم)
- حوّل الجداول إلى بطاقات (Cards)
- أضف زر FAB (Floating Action Button) للإضافة
- اجعل عناصر القائمة كبيرة وواضحة
- أضف swipe actions إذا أمكن (اختياري)

### ب. Detail Pages (صفحات التفاصيل)
- اجعل التفاصيل في أقسام (sections) واضحة
- استخدم Accordion للبيانات الطويلة
- أزرار الإجراءات في الأسفل (sticky bottom bar)

### ج. Form Pages (صفحات النماذج)
- حقول الإدخال عمودية (stacked) على الموبايل
- زر الحفظ في الأسفل (sticky) أو في الـ Header
- تحقق من صحة الحقول مع رسائل واضحة

### د. Dashboard Pages
- إحصائيات في grid (شبكة)的小卡片
- على الموبايل: عمود واحد أو اثنين
- على سطح المكتب: عدة أعمدة
- استخدم `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`

## 5. إضافة Mobile-Specific Features في CSS

### أ. Global CSS
```css
/* في index.css أو globals.css */

/* منع bounce scroll على iOS */
body {
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* قفل عرض الشاشة على الموبايل */
@media (max-width: 768px) {
  body {
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

/* Safe Area Insets */
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* إخفاء scrollbar */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

### ب. Tailwind Config (إذا كنت تستخدم Tailwind)
أضف custom utilities و tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          // ... استخدم لوناً مميزاً لعلامتك التجارية
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
        },
        surface: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          800: '#262626',
          900: '#171717',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
        'nav': '0 -2px 16px rgba(0,0,0,0.1)',
        'float': '0 8px 32px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      }
    }
  }
}
```

## 6. قواعد التصميم العامة

### أ. الأحجام اللمسية (Touch Targets)
- الحد الأدنى لحجم أي عنصر قابل للضغط: **44x44px**
- المسافة بين العناصر القابلة للضغط: **至少 8px**

### ب. الخطوط
- الحد الأدنى لحجم الخط: **14px** (للنصوص العادية)
- حجم الخط المفضل: **16px** (لمنعاً من zoom تلقائي في iOS)
- خط العناوين: **20px - 28px**

### ج. الألوان
- لون النص الرئيسي: **#171717** (أو أغمق)
- لون النص الثانوي: **#6b7280**
- لون الخلفية: **#fafafa** أو **#f5f5f5**
- لون العنصر النشط/المحدد: **primary color** من تصميمك

### د. الفراغات (Spacing)
- حافة الشاشة (page padding): **16px** على الموبايل
- مسافة بين العناصر: **12px - 16px**
- مسافة داخل البطاقات: **16px**

### هـ. الحواف (Borders)
- استخدم حواف دائرية كبيرة: **rounded-xl** أو **rounded-2xl**
- للبطاقات: **rounded-2xl** أو **rounded-3xl**
- للنماذج/البطاقات الصغيرة: **rounded-xl**

### و. الظلال (Shadows)
- استخدم ظلال خفيفة وناعمة
- على الموبايل: **shadow-sm** أو **shadow-card** (خفيف)
- عند التمرير/التحويم: **shadow-card-hover** (أقوى)

## 7. Responsive Breakpoints

```tsx
// استخدم هذه الـ breakpoints
<div className="
  /* الموبايل (default): */
  grid-cols-1 p-4
  
  /* Tablet: */
  sm:grid-cols-2 sm:p-6
  
  /* Desktop: */
  md:grid-cols-3 md:p-8
  lg:grid-cols-4 lg:p-10
">
```

## 8. قائمة التحقق (Checklist)

قبل تسليم العمل، تأكد من:

- [ ] Bottom Tab Bar يعمل على جميع الصفحات
- [ ] جميع Modals تتحول إلى Bottom Sheet على الموبايل
- [ ] جميع الجداول تتحول إلى Cards على الموبايل
- [ ] جميع الأزرار لها touch feedback (active:scale)
- [ ] جميع حقول الإدخال كبيرة بما يكفي (min 44px height)
- [ ] Safe Area Insets محترمة (للأجهزة بـ notch)
- [ ] لا يوجد bounce scroll على iOS
- [ ] جميع الصفحات قابلة للتمرير بسلاسة
- [ ] لا توجد عناصر تتجاوز حدود الشاشة
- [ ] الـ Layout يعمل بشكل صحيح على أحجام شاشات مختلفة
- [ ] لا توجد مشاكل مع RTL (إذا كان التطبيق يدعم العربية)
- [ ] الأداء جيد (لا توجد re-renders غير ضرورية)

## 9. نصائح إضافية

1. **لا تمسح سطح المكتب:** اجعل التحويل responsive، أي احتفظ بتصميم سطح المكتب مع إضافة تصميم موبايل
2. **اختبار على أجهزة حقيقية:** لا تعتمد فقط على Chrome DevTools، اختبر على هاتف حقيقي
3. **PWA:** فكر في إضافة PWA support لتجربة أفضل على الموبايل
4. **Gesture Support:** أضف دعم للـ gestures مثل swipe إذا كان ذلك مناسباً
5. **Loading States:** تأكد من وجود skeleton loading و loading indicators مناسبة للموبايل
6. **Error States:** صمم صفحات خطأ واضحة وجميلة على الموبايل
7. **Empty States:** صمم صفحات "لا توجد بيانات" بشكل جذاب

---

**ملاحظة:** هذا الدليل مبني على مشروع React + Tailwind CSS. إذا كان مشروعك باستخدام stack مختلف، عدّل التعليمات حسب ذلك.
```

---

## كيفية الاستخدام

1. **انسخ البرومبت** أعلاه بالكامل
2. **الصقه** في محادثة الـ AI Agent في مشروعك الآخر
3. **أضف سياق المشروع:** اذكر للـ AI Agent ما هو الـ Tech Stack في مشروعك الآخر
4. **ابدأ بالتغييرات الأصغر:** ابدأ بـ Layout ثم UI Components ثم Pages
5. **راجع التغييرات** قبل تطبيقها على المشروع كاملاً

## ملاحظات مهمة

- البرومبت مصمم لمشروع **React + Tailwind CSS**، عدّله حسب مشروعك
- ابدأ دائماً بـ **Layout** أولاً ثم **Components** ثم **Pages**
- لا تحاول تغيير كل شيء دفعة واحدة، قسّم العمل على مراحل
- تأكد من اختبار التغييرات على **جهاز موبايل حقيقي** وليس فقط محاكي المتصفح
