/* Nizam — خودآزمون سبک (assert) برای منطق تاریخ، روزها و ذخیره‌سازی.
   اجرا:  node tests/tests.js  */
'use strict';

var path = require('path');
var Jalali = require(path.join(__dirname, '..', 'js', 'jalali.js'));
var Defaults = require(path.join(__dirname, '..', 'js', 'defaults.js'));
var Logic = require(path.join(__dirname, '..', 'js', 'logic.js'));
var Store = require(path.join(__dirname, '..', 'js', 'store.js'));

var passed = 0;
function ok(cond, msg) {
  if (!cond) { console.error('✗ ' + msg); process.exitCode = 1; throw new Error(msg); }
  passed++;
  console.log('✓ ' + msg);
}
function eq(a, b, msg) { ok(a === b, msg + ' (' + JSON.stringify(a) + ' == ' + JSON.stringify(b) + ')'); }

/* ---------- تقویم جلالی ---------- */
(function () {
  var g = Jalali.toGregorian(1405, 7, 18);
  eq(g.gy + '-' + g.gm + '-' + g.gd, '2026-10-10', 'تبدیل ۱۸ مهر ۱۴۰۵');

  var j = Jalali.toJalaali(2026, 10, 10);
  eq(j.jy + '/' + j.jm + '/' + j.jd, '1405/7/18', 'تبدیل متقابل ۲۰۲۶-۱۰-۱۰');

  var d = new Date(2026, 9, 10); // شنبه
  eq(Jalali.iranWeekdayIndex(d), 0, 'شاخص روز هفته: شنبه = ۰');
  eq(Jalali.iranWeekdayIndex(new Date(2026, 9, 16)), 6, 'شاخص روز هفته: جمعه = ۶');

  ok(Jalali.jalaaliMonthLength(1403, 12) === 30, 'اسفند ۱۴۰۳ (سال کبیسه) ۳۰ روز');
  ok(Jalali.jalaaliMonthLength(1404, 12) === 29, 'اسفند ۱۴۰۴ (سال عادی) ۲۹ روز');

  // رفت‌وبرگشت روی چند تاریخ
  [[2026, 1, 1], [2026, 3, 21], [2027, 10, 1], [2024, 2, 29]].forEach(function (t) {
    var jj = Jalali.toJalaali(t[0], t[1], t[2]);
    var gg = Jalali.toGregorian(jj.jy, jj.jm, jj.jd);
    ok(gg.gy === t[0] && gg.gm === t[1] && gg.gd === t[2], 'رفت‌وبرگشت تاریخ ' + t.join('-'));
  });

  eq(Jalali.toFa('1405'), '۱۴۰۵', 'تبدیل رقم به فارسی');
  eq(Jalali.toEn('۱۴۰۵'), '1405', 'تبدیل رقم فارسی به لاتین');
})();

/* ---------- منطق روز و هفته ---------- */
(function () {
  eq(Logic.keyOf(Logic.dateOf('2026-10-10')), '2026-10-10', 'کلید تاریخ پایدار است');
  eq(Logic.addDays('2026-10-10', 7), '2026-10-17', 'افزودن روز');
  eq(Logic.addDays('2026-03-01', -1), '2026-02-28', 'کسر روز در مرز ماه');

  eq(Logic.weekStart('2026-10-10'), '2026-10-10', 'شنبه، آغاز هفته');
  eq(Logic.weekStart('2026-10-11'), '2026-10-10', 'یکشنبه به شنبه‌ی همان هفته می‌رسد');
  eq(Logic.weekDates('2026-10-10').length, 7, 'هفته هفت روز دارد');

  var state = Defaults.defaultState();
  eq(Logic.dayType('2026-10-11', state), 'gym', 'یکشنبه به‌طور پیش‌فرض روز باشگاه است');
  eq(Logic.dayType('2026-10-16', state), 'friday', 'جمعه روز جمعه است');
  eq(Logic.dayType('2026-10-10', state), 'regular', 'شنبه روز عادی است');

  state.settings.dayOverrides['2026-10-11'] = 'regular';
  eq(Logic.dayType('2026-10-11', state), 'regular', 'استثنای روز، نوع پیش‌فرض را بازنویسی می‌کند');

  delete state.settings.dayOverrides['2026-10-11'];
  state.settings.universityDays = [1, 2, 3, 4];
  eq(Logic.dayType('2026-10-10', state), 'free', 'شنبه بدون دانشگاه، روز آزاد است');
  eq(Logic.dayType('2026-10-11', state), 'gym', 'یکشنبه هنوز روز باشگاه است');
})();

/* ---------- ساخت روز و جلوگیری از تکرار ---------- */
(function () {
  var state = Defaults.defaultState();
  var day = Logic.ensureDay(state, '2026-10-10'); // شنبه: بدون کار باشگاه
  var count = day.tasks.length;
  ok(count > 0, 'روز تازه کارهای تکرارشونده را می‌سازد');
  eq(day.tasks.filter(function (t) { return t.category === 'gym'; }).length, 0, 'کار باشگاه در روز غیرباشگاه ساخته نمی‌شود');

  Logic.ensureDay(state, '2026-10-10');
  eq(state.days['2026-10-10'].tasks.length, count, 'بار دوم کار تکراری اضافه نمی‌شود');

  var gymDay = Logic.ensureDay(state, '2026-10-11'); // یکشنبه
  eq(gymDay.tasks.filter(function (t) { return t.category === 'gym'; }).length, 1, 'کار باشگاه در روز باشگاه ساخته می‌شود');

  // پیشرفت
  var p0 = Logic.progress(day);
  eq(p0.pct, 0, 'پیشرفت ابتدایی صفر است');
  Logic.mainTasks(day)[0].status = 'done';
  var p1 = Logic.progress(day);
  ok(p1.done === 1 && p1.pct > 0, 'کار انجام‌شده در پیشرفت شمرده می‌شود');
})();

/* ---------- آمار هفته ---------- */
(function () {
  var state = Defaults.defaultState();
  var start = '2026-10-10';
  Logic.weekDates(start).forEach(function (k) { Logic.ensureDay(state, k); });
  var ws = Logic.weekStats(state, start);
  ok(ws.days.length === 7, 'آمار هفته هفت روز دارد');
  ok(ws.categories.gym.planned >= 3, 'برنامه باشگاه در هفته شمارش می‌شود');
  eq(ws.reviewDone, false, 'مرور هفتگی ابتدا ثبت‌نشده است');

  // انجام‌دادن یک کار مطالعه
  var read = state.days[start].tasks.filter(function (t) { return t.category === 'reading'; })[0];
  read.status = 'done';
  var ws2 = Logic.weekStats(state, start);
  eq(ws2.categories.reading.completed, 1, 'کار مطالعه انجام‌شده شمرده می‌شود');
  eq(ws2.consistency.reading, 1, 'روز مطالعه در پیوستگی شمرده می‌شود');

  state.reviews[start] = { answers: ['الف', 'ب', 'ج'], adjustment: 'تغییر' };
  eq(Logic.weekStats(state, start).reviewDone, true, 'مرور هفتگی پس از ثبت شناسایی می‌شود');
})();

/* ---------- فعالیت بعدی ---------- */
(function () {
  var state = Defaults.defaultState();
  var morning = new Date(2026, 9, 10, 6, 0);
  var n = Logic.nextActivity(state, morning);
  ok(n.slot && n.slot.start === '07:30', 'نخستین فعالیت پس از ۰۶:۰۰، ساعت ۰۷:۳۰ است');
  var late = new Date(2026, 9, 10, 23, 55);
  var n2 = Logic.nextActivity(state, late);
  ok(n2.slot, 'پس از پایان برنامه، فعالیت فردا پیشنهاد می‌شود');
})();

/* ---------- ذخیره‌سازی و پشتیبان ---------- */
(function () {
  var partial = { settings: { wakeTime: '06:45' }, days: { '2026-10-10': { date: '2026-10-10', tasks: [], priorities: [], note: '' } } };
  var norm = Store.normalize(partial);
  eq(norm.settings.wakeTime, '06:45', 'تنظیمات ذخیره‌شده حفظ می‌شود');
  eq(norm.settings.bedTime, '23:30', 'تنظیمات جامانده از پیش‌فرض پر می‌شود');
  ok(norm.templates.length > 0, 'الگوهای تکرارشونده پس از یکسان‌سازی وجود دارند');

  var state = Defaults.defaultState();
  var text = Store.exportJSON(state);
  var back = Store.importJSON(text);
  eq(back.version, state.version, 'پشتیبان‌گیری و بازیابی نسخه را حفظ می‌کند');
  eq(back.targets.ai, state.targets.ai, 'اهداف هفتگی پس از بازیابی یکسان‌اند');

  var threw = false;
  try { Store.importJSON('[]'); } catch (e) { threw = true; }
  ok(threw, 'ورودی نامعتبر رد می‌شود');
  var threw2 = false;
  try { Store.importJSON('{bad json'); } catch (e) { threw2 = true; }
  ok(threw2, 'JSON معیوب رد می‌شود');
})();

/* ---------- نقشه راه: اهداف به شکل شیء ---------- */
(function () {
  var s = Defaults.defaultState();
  var g0 = s.roadmap.phases[0].goals[0];
  ok(g0 && typeof g0 === 'object' && typeof g0.text === 'string' && typeof g0.done === 'boolean',
    'اهداف پیش‌فرض نقشه راه شیء با text و done هستند');

  var old = { roadmap: { phases: [{ id: 'x', title: 'ت', months: '', done: false, goals: ['هدف قدیمی'] }] } };
  var norm = Store.normalize(old);
  eq(typeof norm.roadmap.phases[0].goals[0], 'object', 'هدف رشته‌ای پشتیبان قدیمی به شیء تبدیل می‌شود');
  eq(norm.roadmap.phases[0].goals[0].text, 'هدف قدیمی', 'متن هدف قدیمی حفظ می‌شود');
  eq(norm.roadmap.phases[0].goals[0].done, false, 'وضعیت هدف قدیمی false است');
})();

/* ---------- دادهٔ ناسازگار (پشتیبان نامعتبر) ---------- */
(function () {
  var st = Store.importJSON(JSON.stringify({ settings: {}, days: { '2026-10-10': 'junk' } }));
  var day = Logic.ensureDay(st, '2026-10-10');
  ok(Array.isArray(day.tasks), 'روز رشته‌ای از ورودی ناسازگار دوباره ساخته می‌شود و کرش نمی‌کند');

  var st2 = Store.importJSON(JSON.stringify({ settings: {}, days: { '2026-10-11': { date: '2026-10-11' } } }));
  var d2 = Logic.ensureDay(st2, '2026-10-11');
  ok(Array.isArray(d2.tasks), 'روزی که فهرست کار ندارد، فهرست می‌گیرد');
})();

/* ---------- هفته وقتی روزهای ابتدای آن ثبت نشده (اولین بازدید در روز غیر شنبه) ---------- */
(function () {
  var st = Defaults.defaultState();
  var today = Logic.todayKey();
  st.days[today] = Logic.ensureDay(st, today);
  var ws = null, threw = false;
  try { ws = Logic.weekStats(st, Logic.weekStart(today)); } catch (e) { threw = true; }
  ok(!threw && ws && ws.days.length === 7 && Array.isArray(ws.postponed),
    'آمار هفته وقتی روزهای ابتدایی هفته ثبت نشده‌اند کرش نمی‌کند');
})();

/* ---------- فایل‌های PWA ---------- */
(function () {
  var fs = require('fs');
  var manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.webmanifest'), 'utf8'));
  ok(manifest.icons.length >= 3, 'manifest حداقل سه آیکون دارد');
  var hasMaskable = manifest.icons.some(function (i) { return /maskable/.test(i.purpose); });
  ok(hasMaskable, 'manifest آیکون maskable دارد');
  eq(manifest.dir, 'rtl', 'manifest راست‌به‌چپ است');
  eq(manifest.lang, 'fa', 'manifest زبان فارسی دارد');
  ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'].forEach(function (p) {
    ok(fs.existsSync(path.join(__dirname, '..', p)), 'فایل آیکون موجود است: ' + p);
  });
})();

console.log('\n' + passed + ' بررسی با موفقیت انجام شد.');
