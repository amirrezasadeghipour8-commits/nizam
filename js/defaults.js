/* Nizam — مقادیر پیش‌فرض و الگوهای قابل ویرایش.
   همه این مقادیر فقط نقطه شروع هستند و در برنامه قابل تغییرند. */
(function (root) {
  'use strict';

  var CATEGORIES = {
    uni: 'دانشگاه و مسئولیت‌های ضروری',
    ai: 'یادگیری هوش مصنوعی / پروژه',
    driving: 'گواهینامه رانندگی',
    gym: 'ورزش یا بازیابی',
    reading: 'مطالعه',
    care: 'مراقبت شخصی و وعده‌ها',
    prep: 'آماده‌سازی فردا',
    winddown: 'آرام‌سازی شب'
  };

  /* کارهای تکرارشونده پیش‌فرض.
     days = null یعنی هر روز، وگرنه آرایه‌ای از شاخص روز هفته ایرانی (شنبه=۰). */
  function defaultTemplates() {
    return [
      { id: 't_uni', title: 'انجام کارهای ضروری دانشگاه', category: 'uni', days: null, enabled: true },
      { id: 't_ai', title: 'یک جلسه یادگیری هوش مصنوعی یا کار پروژه', category: 'ai', days: null, enabled: true },
      { id: 't_driving', title: 'پیگیری ۲۰ دقیقه‌ای گواهینامه رانندگی', category: 'driving', days: [0, 3], enabled: true },
      { id: 't_read', title: 'مطالعه کتاب (۱۵ تا ۳۰ دقیقه)', category: 'reading', days: null, enabled: true },
      { id: 't_gym', title: 'باشگاه یا بازیابی برنامه‌ریزی‌شده', category: 'gym', days: [1, 3, 5], enabled: true },
      { id: 't_care', title: 'خواب کافی، وعده‌های غذایی و مراقبت شخصی', category: 'care', days: null, enabled: true },
      { id: 't_prep', title: 'تعیین اولویت‌های فردا', category: 'prep', days: null, enabled: true },
      { id: 't_wd1', title: 'قطع صفحه‌نمایش و آرام‌کردن فضا', category: 'winddown', days: null, enabled: true },
      { id: 't_wd2', title: 'آماده‌کردن وسایل و برنامه فردا', category: 'winddown', days: null, enabled: true },
      { id: 't_wd3', title: 'مطالعه آرام یا چند دقیقه تنفس', category: 'winddown', days: null, enabled: true },
      { id: 't_wd4', title: 'رسیدن به رختخواب تا ساعت هدف خواب', category: 'winddown', days: null, enabled: true }
    ];
  }

  function defaultSchedules() {
    return {
      regular: [
        { start: '07:30', end: '08:00', title: 'بیداری و آماده‌شدن' },
        { start: '08:00', end: '14:00', title: 'دانشگاه و ناهار' },
        { start: '14:00', end: '15:30', title: 'استراحت، بازیابی و کارهای شخصی' },
        { start: '15:30', end: '16:00', title: 'مطالعه کتاب' },
        { start: '16:00', end: '17:00', title: 'یادگیری هوش مصنوعی یا توسعه وب' },
        { start: '17:00', end: '19:00', title: 'کارهای دانشگاه، امور گواهینامه یا کارهای ضروری' },
        { start: '19:00', end: '21:00', title: 'شام، زندگی اجتماعی، رابطه یا اوقات آزاد' },
        { start: '21:00', end: '22:00', title: 'زمان انعطاف‌پذیر برای کارهای ناتمام یا استراحت' },
        { start: '22:00', end: '23:30', title: 'روتین آرام‌سازی و آماده‌سازی فردا' },
        { start: '23:30', end: '23:59', title: 'ساعت هدف خواب' }
      ],
      gym: [
        { start: '07:30', end: '08:00', title: 'بیداری و آماده‌شدن' },
        { start: '08:00', end: '14:00', title: 'دانشگاه و ناهار (روزهای دانشگاه)' },
        { start: '14:00', end: '15:30', title: 'ناهار و بازیابی' },
        { start: '15:30', end: '16:15', title: 'جلسه کوتاه یادگیری یا مرور' },
        { start: '16:15', end: '17:30', title: 'میان‌وعده، آماده‌سازی و رفت‌وآمد' },
        { start: '18:00', end: '20:00', title: 'باشگاه (شامل دوش و روتین پس از تمرین)' },
        { start: '20:00', end: '22:00', title: 'شام، بازیابی و زمان شخصی' },
        { start: '22:00', end: '23:30', title: 'آرام‌سازی و آماده‌سازی خواب' }
      ],
      friday: [
        { start: '09:00', end: '10:00', title: 'بیداری آرام و صبحانه' },
        { start: '10:00', end: '12:00', title: 'استراحت، مطالعه و اوقات آزاد' },
        { start: '12:00', end: '14:00', title: 'ناهار و زمان خانواده' },
        { start: '14:00', end: '17:00', title: 'تفریح، دوستان و علاقه‌مندی‌ها' },
        { start: '17:00', end: '18:00', title: 'مرور هفتگی (۲۰ دقیقه)' },
        { start: '18:00', end: '20:00', title: 'اوقات آزاد' },
        { start: '20:00', end: '22:00', title: 'شام و زمان شخصی' },
        { start: '22:00', end: '23:30', title: 'آرام‌سازی و آماده‌سازی خواب' }
      ],
      free: [
        { start: '07:30', end: '08:00', title: 'بیداری و آماده‌شدن' },
        { start: '08:00', end: '10:00', title: 'مطالعه یا یادگیری' },
        { start: '10:00', end: '13:00', title: 'پروژه و کار عملی' },
        { start: '13:00', end: '14:30', title: 'ناهار و استراحت' },
        { start: '14:30', end: '16:00', title: 'کارهای ضروری و امور گواهینامه' },
        { start: '16:00', end: '17:00', title: 'مطالعه کتاب' },
        { start: '17:00', end: '19:00', title: 'کارهای شخصی یا اوقات آزاد' },
        { start: '19:00', end: '21:00', title: 'شام، رابطه و تفریح' },
        { start: '21:00', end: '22:00', title: 'زمان انعطاف‌پذیر' },
        { start: '22:00', end: '23:30', title: 'آرام‌سازی و آماده‌سازی خواب' }
      ]
    };
  }

  /* تمرکز پیشنهادی هر روز هفته (شنبه=۰) */
  function defaultWeekdayFocus() {
    return [
      'یادگیری هوش مصنوعی و توسعه وب',
      'جلسه کوتاه یادگیری و باشگاه',
      'تمرین هوش مصنوعی و کار روی پروژه',
      'جلسه کوتاه یادگیری و باشگاه',
      'یادگیری هوش مصنوعی، کار پروژه و مرور',
      'باشگاه و یک شب سبک‌تر',
      'استراحت، مطالعه، تفریح و مرور هفتگی ۲۰ دقیقه‌ای'
    ];
  }

  function defaultTargets() {
    return { ai: 4, gym: 3, reading: 4, driving: 2, review: 1 };
  }

  function defaultRoadmap() {
    return {
      title: 'نقشه راه یک‌ساله — از مهر ۱۴۰۵ تا مهر ۱۴۰۶',
      anchor: '2026-10-01',
      phases: [
        {
          id: 'p1', title: 'فاز ۱: تثبیت', months: 'ماه ۱ تا ۳', done: false,
          goals: [
            'ایجاد روتین پایدار خواب و بیداری',
            'حفظ حضور در دانشگاه و جلسات باشگاه',
            'یادگیری مبانی هوش مصنوعی و مقدمات توسعه وب',
            'ثبت‌نام در آموزشگاه رانندگی و پیگیری مراحل',
            'برقراری مرور هفتگی منظم',
            'اولویت‌دادن به ثبات به‌جای نتایج بلندپروازانه'
          ]
        },
        {
          id: 'p2', title: 'فاز ۲: توسعه مهارت', months: 'ماه ۴ تا ۶', done: false,
          goals: [
            'ساخت یک وب‌سایت یا ابزار کوچک و کاربردی',
            'ساخت نخستین پروژه نمونه‌کار',
            'پیشروی در فرایند گرفتن گواهینامه',
            'بازبینی تعهدات دانشگاهی و کاری'
          ]
        },
        {
          id: 'p3', title: 'فاز ۳: آزمایش‌های عملی', months: 'ماه ۷ تا ۹', done: false,
          goals: [
            'بهبود قوی‌ترین پروژه',
            'بررسی نیازهای واقعی مشتری و فرصت‌های فریلنسری',
            'ارزیابی پیشرفت بر پایه شواهد، نه فرض‌ها'
          ]
        },
        {
          id: 'p4', title: 'فاز ۴: ارزیابی', months: 'ماه ۱۰ تا ۱۲', done: false,
          goals: [
            'مرور مهارت‌ها، پروژه‌های انجام‌شده و درآمد واقعی (اگر وجود داشته)',
            'ارزیابی گزینه‌های شغلی، کنکور و مهاجرت بر پایه واقعیت‌های روز',
            'تصمیم برای ادامه، تغییر یا توقف هر مسیر',
            'ساخت برنامه سالانه بعدی'
          ]
        }
      ]
    };
  }

  function defaultLearningSteps() {
    return [
      { id: 'l1', title: 'شناخت ابزارهای کاربردی هوش مصنوعی و کاربردهایشان', done: false },
      { id: 'l2', title: 'مبانی HTML و CSS', done: false },
      { id: 'l3', title: 'ساخت وب‌سایت‌های ساده و واکنش‌گرا', done: false },
      { id: 'l4', title: 'کار با GitHub و ابزارهای توسعه در مرورگر از روی موبایل', done: false },
      { id: 'l5', title: 'ساخت یک پروژه کوچک و کاربردی', done: false }
    ];
  }

  function defaultDrivingStages() {
    var titles = [
      'بررسی آموزشگاه‌های رانندگی محل',
      'مقایسه قیمت‌ها، زمان‌بندی، مدارک و شرایط',
      'انتخاب آموزشگاه مناسب',
      'ثبت‌نام',
      'شرکت در کلاس‌های نظری',
      'شرکت در کلاس‌های عملی',
      'پیگیری آزمون‌های لازم',
      'ثبت نتیجه نهایی'
    ];
    return titles.map(function (t, i) {
      return { id: 'd' + (i + 1), title: t, done: false, date: '', cost: '', notes: '' };
    });
  }

  function defaultState() {
    var now = new Date().toISOString();
    return {
      version: 1,
      settings: {
        theme: 'system',
        wakeTime: '07:30',
        bedTime: '23:30',
        universityDays: [0, 1, 2, 3, 4],
        gymDays: [1, 3, 5],
        showWindDown: true,
        dayOverrides: {}
      },
      templates: defaultTemplates(),
      schedules: defaultSchedules(),
      weekdayFocus: defaultWeekdayFocus(),
      targets: defaultTargets(),
      days: {},
      reviews: {},
      learning: {
        steps: defaultLearningSteps(),
        sessions: [],
        project: {
          name: 'StudyMind',
          idea: 'همراه هوشمند مطالعه و یادگیری شخصی‌سازی‌شده',
          notes: 'هدف: یک پروژه واقعی و قابل استفاده که مطالعه را شخصی‌سازی کند.',
          status: 'در حال شکل‌گیری'
        }
      },
      driving: {
        stages: defaultDrivingStages(),
        nextAction: '',
        registered: false
      },
      roadmap: defaultRoadmap(),
      meta: { createdAt: now, updatedAt: now }
    };
  }

  var api = {
    CATEGORIES: CATEGORIES,
    defaultTemplates: defaultTemplates,
    defaultSchedules: defaultSchedules,
    defaultWeekdayFocus: defaultWeekdayFocus,
    defaultTargets: defaultTargets,
    defaultRoadmap: defaultRoadmap,
    defaultLearningSteps: defaultLearningSteps,
    defaultDrivingStages: defaultDrivingStages,
    defaultState: defaultState
  };

  root.Defaults = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
