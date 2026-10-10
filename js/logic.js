/* Nizam — منطق خالص برنامه: تاریخ‌ها، روزها، آمار و برنامه روزانه.
   هیچ وابستگی به DOM ندارد تا در تست‌ها هم قابل استفاده باشد. */
(function (root) {
  'use strict';

  var Defaults = root.Defaults || (typeof require !== 'undefined' ? require('./defaults.js') : null);

  /* ---------- کلیدهای تاریخ (میلادی، محلی) ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }
  function dateOf(key) {
    var p = key.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function todayKey() { return keyOf(new Date()); }
  function addDays(key, n) {
    var d = dateOf(key);
    d.setDate(d.getDate() + n);
    return keyOf(d);
  }
  function irIndex(key) {
    var Jalali = root.Jalali || (typeof require !== 'undefined' ? require('./jalali.js') : null);
    return Jalali.iranWeekdayIndex(dateOf(key));
  }

  /* شنبه‌ی همان هفته */
  function weekStart(key) { return addDays(key, -irIndex(key)); }
  function weekDates(startKey) {
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(startKey, i));
    return out;
  }

  /* ---------- زمان ---------- */
  function toMinutes(hm) {
    if (!hm || hm.indexOf(':') < 0) return 0;
    var p = hm.split(':');
    return (+p[0]) * 60 + (+p[1]);
  }
  function fmtTime(hm) {
    var Jalali = root.Jalali || (typeof require !== 'undefined' ? require('./jalali.js') : null);
    return Jalali.toFa(hm);
  }

  /* ---------- نوع روز و برنامه ---------- */
  function dayType(key, state) {
    var ov = state.settings.dayOverrides || {};
    if (ov[key]) return ov[key];
    var idx = irIndex(key);
    if ((state.settings.gymDays || []).indexOf(idx) >= 0) return 'gym';
    if (idx === 6) return 'friday';
    if ((state.settings.universityDays || []).indexOf(idx) >= 0) return 'regular';
    return 'free';
  }
  function dayTypeLabel(type) {
    if (type === 'gym') return 'روز باشگاه';
    if (type === 'friday') return 'روز جمعه';
    if (type === 'free') return 'روز آزاد';
    return 'روز عادی دانشگاه';
  }
  function scheduleFor(key, state) {
    return state.schedules[dayType(key, state)] || state.schedules.regular || [];
  }

  /* ---------- ساخت روز ---------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function taskFromTemplate(tpl, key) {
    return {
      id: key + '#' + tpl.id,
      src: tpl.id,
      title: tpl.title,
      category: tpl.category,
      type: 'recurring',
      status: 'pending'
    };
  }

  /* نسخه بدون‌تغییر برای محاسبات */
  function materializeTasks(state, key) {
    var idx = irIndex(key);
    var list = [];
    (state.templates || []).forEach(function (tpl) {
      if (tpl.enabled === false) return;
      if (tpl.days && tpl.days.indexOf(idx) < 0) return;
      list.push(taskFromTemplate(tpl, key));
    });
    return list;
  }

  /* اطمینان از وجود روز و اضافه‌کردن کارهای تکرارشونده‌ی جدید (بدون دست‌زدن به تاریخ) */
  function ensureDay(state, key) {
    var day = state.days[key];
    if (!day) {
      day = { date: key, tasks: materializeTasks(state, key), priorities: [], note: '' };
      state.days[key] = day;
      return day;
    }
    var existing = {};
    day.tasks.forEach(function (t) { if (t.src) existing[t.src] = true; });
    materializeTasks(state, key).forEach(function (t) {
      if (!existing[t.src]) { day.tasks.push(t); existing[t.src] = true; }
    });
    if (!day.priorities) day.priorities = [];
    if (typeof day.note !== 'string') day.note = '';
    return day;
  }

  /* ---------- آمار یک روز ---------- */
  function mainTasks(day) {
    return (day.tasks || []).filter(function (t) { return t.category !== 'winddown'; });
  }
  function windDownTasks(day) {
    return (day.tasks || []).filter(function (t) { return t.category === 'winddown'; });
  }
  function progress(day) {
    var list = mainTasks(day);
    var total = list.length;
    var done = list.filter(function (t) { return t.status === 'done'; }).length;
    return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  /* ---------- آمار هفته ---------- */
  function categoryStats(state, days) {
    var cats = { ai: { planned: 0, completed: 0 }, gym: { planned: 0, completed: 0 }, reading: { planned: 0, completed: 0 }, driving: { planned: 0, completed: 0 }, uni: { planned: 0, completed: 0 } };
    days.forEach(function (key) {
      var day = state.days[key];
      if (!day) return;
      (day.tasks || []).forEach(function (t) {
        if (!cats[t.category] || t.category === 'winddown') return;
        cats[t.category].planned++;
        if (t.status === 'done') cats[t.category].completed++;
      });
    });
    return cats;
  }

  function weekStats(state, startKey) {
    if (!startKey) startKey = weekStart(todayKey());
    var days = weekDates(startKey);
    var perDay = days.map(function (key) {
      var day = state.days[key];
      var p = day ? progress(day) : { done: 0, total: 0, pct: 0 };
      return { key: key, type: dayType(key, state), prog: p };
    });
    var cats = categoryStats(state, days);

    var consistency = { reading: 0, gym: 0, ai: 0, winddown: 0 };
    days.forEach(function (key) {
      var day = state.days[key];
      if (!day) return;
      function has(cat) {
        return (day.tasks || []).some(function (t) { return t.category === cat && t.status === 'done'; });
      }
      if (has('reading')) consistency.reading++;
      if (has('gym')) consistency.gym++;
      if (has('ai')) consistency.ai++;
    });

    /* کارهای عقب‌افتاده: کارهای یک‌باره‌ی حل‌نشده از روزهای گذشته + کارهای ردشده این هفته */
    var today = todayKey();
    var postponed = [];
    Object.keys(state.days).forEach(function (key) {
      if (key >= today) return;
      (state.days[key].tasks || []).forEach(function (t) {
        if (t.type === 'oneshot' && t.status === 'pending') {
          postponed.push({ title: t.title, from: key });
        }
      });
    });
    days.forEach(function (key) {
      if (key >= today) return;
      (state.days[key].tasks || []).forEach(function (t) {
        if (t.status === 'skipped') postponed.push({ title: t.title, from: key });
      });
    });

    var reflectionDays = 0;
    days.forEach(function (key) { if (state.days[key]) reflectionDays++; });

    return {
      weekStart: startKey,
      days: perDay,
      categories: cats,
      consistency: consistency,
      postponed: postponed,
      reviewDone: !!state.reviews[startKey],
      coveredDays: reflectionDays
    };
  }

  /* آمار کارهای یادگیری در هفته */
  function learningSessionsInWeek(state, startKey) {
    var days = weekDates(startKey);
    var set = {};
    days.forEach(function (k) { set[k] = true; });
    return (state.learning.sessions || []).filter(function (s) { return set[s.date]; });
  }

  /* ---------- فعالیت بعدی ---------- */
  function nextActivity(state, now) {
    now = now || new Date();
    var key = keyOf(now);
    var mins = now.getHours() * 60 + now.getMinutes();
    var slots = scheduleFor(key, state);
    for (var i = 0; i < slots.length; i++) {
      if (toMinutes(slots[i].start) > mins) {
        return { key: key, slot: slots[i], isToday: true };
      }
    }
    var nkey = addDays(key, 1);
    var nextSlots = scheduleFor(nkey, state);
    return { key: nkey, slot: nextSlots[0] || null, isToday: false };
  }

  function currentActivity(state, now) {
    now = now || new Date();
    var key = keyOf(now);
    var mins = now.getHours() * 60 + now.getMinutes();
    var slots = scheduleFor(key, state);
    for (var i = 0; i < slots.length; i++) {
      if (mins >= toMinutes(slots[i].start) && mins < toMinutes(slots[i].end)) return slots[i];
    }
    return null;
  }

  function greeting(now) {
    var h = (now || new Date()).getHours();
    if (h < 5) return 'شب بخیر';
    if (h < 12) return 'صبح بخیر';
    if (h < 17) return 'وقت بخیر';
    if (h < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }

  var api = {
    pad2: pad2, keyOf: keyOf, dateOf: dateOf, todayKey: todayKey, addDays: addDays,
    irIndex: irIndex, weekStart: weekStart, weekDates: weekDates,
    toMinutes: toMinutes, fmtTime: fmtTime,
    dayType: dayType, dayTypeLabel: dayTypeLabel, scheduleFor: scheduleFor,
    uid: uid, taskFromTemplate: taskFromTemplate, materializeTasks: materializeTasks, ensureDay: ensureDay,
    mainTasks: mainTasks, windDownTasks: windDownTasks, progress: progress,
    categoryStats: categoryStats, weekStats: weekStats, learningSessionsInWeek: learningSessionsInWeek,
    nextActivity: nextActivity, currentActivity: currentActivity, greeting: greeting
  };

  root.Logic = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
