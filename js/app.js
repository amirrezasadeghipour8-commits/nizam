/* Nizam — رابط کاربری و منطق تعامل.
   برنامه تک‌صفحه‌ای بدون فریم‌ورک، با مسیریابی مبتنی بر hash. */
(function () {
  'use strict';

  var Jalali = window.Jalali;
  var Logic = window.Logic;
  var Defaults = window.Defaults;
  var Store = window.Store;

  var state = Store.load();
  var view = document.getElementById('view');
  var modal = document.getElementById('modal');
  var toastEl = document.getElementById('toast');
  var tabbar = document.getElementById('tabbar');

  /* ---------- وضعیت گذرا (ذخیره نمی‌شود) ---------- */
  var ui = {
    weekStart: null,        // هفته در حال نمایش در صفحه هفته
    scheduleTab: 'regular'  // نوع برنامه در تنظیمات
  };

  /* ---------- آیکون‌ها ---------- */
  var ICONS = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    week: '<path d="M4 20V11M9.3 20V5M14.7 20v-7M20 20V8"/>',
    roadmap: '<path d="M6 21V3"/><path d="M6 4h10l-2 3.5L16 11H6"/>',
    learn: '<path d="M12 6.5C10 4.8 7 4.4 4 4.6v12.8c3-.2 6 .2 8 1.9 2-1.7 5-2.1 8-1.9V4.6c-3-.2-6 .2-8 1.9z"/><path d="M12 6.5V19.3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
    car: '<path d="M4 16v-3l2-5h12l2 5v3"/><path d="M4 16h16v3h-2.5M4 19v-3"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    flag: '<path d="M6 21V3"/><path d="M6 4h10l-2 3.5L16 11H6"/>',
    moon: '<path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>'
  };
  function icon(name) {
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- ابزارها ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fa(s) { return Jalali.toFa(s); }
  function jLabel(key) { return Jalali.formatJalaali(Logic.dateOf(key)); }
  function jLabelLong(key) { return Jalali.formatJalaali(Logic.dateOf(key), { long: true }); }
  function weekLabel(startKey) {
    var endKey = Logic.addDays(startKey, 6);
    var a = Jalali.toJalaali(Logic.dateOf(startKey).getFullYear(), Logic.dateOf(startKey).getMonth() + 1, Logic.dateOf(startKey).getDate());
    var b = Jalali.toJalaali(Logic.dateOf(endKey).getFullYear(), Logic.dateOf(endKey).getMonth() + 1, Logic.dateOf(endKey).getDate());
    var sameMonth = a.jm === b.jm && a.jy === b.jy;
    var txt = sameMonth
      ? fa(a.jd) + ' تا ' + fa(b.jd) + ' ' + Jalali.MONTHS[a.jm - 1] + ' ' + fa(a.jy)
      : jLabel(startKey) + ' تا ' + jLabel(endKey);
    return 'هفته‌ی ' + txt;
  }
  function currentRoute() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return h || 'today';
  }
  function setByPath(obj, path, value) {
    var parts = path.split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = value;
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1900);
  }
  function save() {
    if (!Store.save(state)) toast('ذخیره نشد — حافظهٔ مرورگر پر است');
  }
  function rerender() { render(); }

  function ensureDay(key) {
    var before = state.days[key];
    var beforeCount = before ? (before.tasks ? before.tasks.length : 0) : -1;
    var day = Logic.ensureDay(state, key);
    if (beforeCount !== day.tasks.length) save();
    return day;
  }
  function findTask(day, id) {
    for (var i = 0; i < day.tasks.length; i++) if (day.tasks[i].id === id) return day.tasks[i];
    return null;
  }

  /* ---------- لایه‌ها (شیت و دیالوگ) ---------- */
  function openOverlay(node) {
    modal.innerHTML = '';
    modal.appendChild(node);
    modal.hidden = false;
    document.body.classList.add('overlay-open');
  }
  function closeOverlay() {
    modal.hidden = true;
    modal.innerHTML = '';
    document.body.classList.remove('overlay-open');
  }
  function sheet(title, items) {
    var back = document.createElement('div');
    back.className = 'overlay';
    var panel = document.createElement('div');
    panel.className = 'sheet';
    panel.innerHTML = '<div class="sheet-title">' + esc(title) + '</div>';
    items.filter(Boolean).forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sheet-item' + (it.danger ? ' danger' : '');
      b.textContent = it.label;
      b.onclick = function () { closeOverlay(); if (it.onClick) it.onClick(); };
      panel.appendChild(b);
    });
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'sheet-item cancel';
    cancel.textContent = 'بستن';
    cancel.onclick = closeOverlay;
    panel.appendChild(cancel);
    back.appendChild(panel);
    back.addEventListener('click', function (e) { if (e.target === back) closeOverlay(); });
    openOverlay(back);
  }
  function promptText(title, value, onSave, multiline) {
    var back = document.createElement('div');
    back.className = 'overlay';
    var panel = document.createElement('div');
    panel.className = 'dialog';
    panel.innerHTML = '<div class="sheet-title">' + esc(title) + '</div>';
    var input = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) input.type = 'text';
    input.className = 'input';
    input.value = value || '';
    if (multiline) input.rows = 3;
    var actions = document.createElement('div');
    actions.className = 'dialog-actions';
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = 'انصراف';
    cancelBtn.onclick = closeOverlay;
    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn';
    okBtn.textContent = 'ذخیره';
    var submit = function () { var v = input.value.trim(); closeOverlay(); if (onSave) onSave(v); };
    okBtn.onclick = submit;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !multiline) { e.preventDefault(); submit(); } });
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    panel.appendChild(input);
    panel.appendChild(actions);
    back.appendChild(panel);
    back.addEventListener('click', function (e) { if (e.target === back) closeOverlay(); });
    openOverlay(back);
    setTimeout(function () { input.focus(); }, 30);
  }
  function confirmDialog(text, onYes) {
    var back = document.createElement('div');
    back.className = 'overlay';
    var panel = document.createElement('div');
    panel.className = 'dialog';
    panel.innerHTML = '<div class="sheet-title">تأیید</div><p class="muted">' + esc(text) + '</p>';
    var actions = document.createElement('div');
    actions.className = 'dialog-actions';
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = 'انصراف';
    cancelBtn.onclick = closeOverlay;
    var okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn danger';
    okBtn.textContent = 'تأیید';
    okBtn.onclick = function () { closeOverlay(); onYes(); };
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    panel.appendChild(actions);
    back.appendChild(panel);
    back.addEventListener('click', function (e) { if (e.target === back) closeOverlay(); });
    openOverlay(back);
  }

  /* ---------- تم ---------- */
  function applyTheme() {
    var t = state.settings.theme || 'system';
    var resolved = t;
    if (t === 'system') {
      resolved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = resolved;
  }

  /* ================= نمای امروز ================= */
  function viewToday() {
    var key = Logic.todayKey();
    var day = ensureDay(key);
    var type = Logic.dayType(key, state);
    var prog = Logic.progress(day);
    var next = Logic.nextActivity(state, new Date());
    var current = Logic.currentActivity(state, new Date());
    var ws = Logic.weekStats(state, Logic.weekStart(key));
    var idx = Logic.irIndex(key);
    var focus = state.weekdayFocus[idx] || '';

    var html = '';

    html += '<section class="hero card">' +
      '<div class="hero-top">' +
        '<div><div class="hero-date">' + esc(jLabelLong(key)) + '</div>' +
        '<div class="hero-greet">' + esc(Logic.greeting(new Date())) + ' · امروز ' + esc(Logic.dayTypeLabel(type)) + '</div></div>' +
        '<div class="ring" style="--p:' + prog.pct + '"><span>' + fa(prog.pct) + '٪</span></div>' +
      '</div>' +
      '<div class="progress"><div class="progress-bar" style="width:' + prog.pct + '%"></div></div>' +
      '<div class="hero-sub">' + fa(prog.done) + ' از ' + fa(prog.total) + ' کار امروز انجام شده' +
        (focus ? ' · تمرکز امروز: ' + esc(focus) : '') + '</div>' +
    '</section>';

    /* فعالیت بعدی */
    html += '<section class="card">' +
      '<h2 class="card-title">' + icon('clock') + ' فعالیت بعدی</h2>';
    if (next.slot) {
      html += '<div class="next-activity">' +
        '<div class="next-time">' + fa(next.slot.start) + ' تا ' + fa(next.slot.end) + '</div>' +
        '<div class="next-title">' + esc(next.slot.title) + '</div>' +
        '<div class="muted small">' + (next.isToday ? 'امروز' : 'فردا · ' + esc(jLabelLong(next.key))) + '</div>' +
      '</div>';
    } else {
      html += '<p class="muted">فعالیت زمان‌بندی‌شده‌ای باقی نمانده.</p>';
    }
    html += '</section>';

    /* اولویت‌ها */
    html += '<section class="card">';
    html += '<h2 class="card-title">' + icon('flag') + ' سه اولویت اصلی امروز</h2>';
    if (day.priorities.length === 0) {
      html += '<p class="muted small">هنوز اولویتی ثبت نشده. مهم‌ترین کارهای امروز را اینجا بنویس (حداکثر سه مورد).</p>';
    }
    html += '<ul class="priorities">';
    day.priorities.forEach(function (p) {
      html += '<li class="priority' + (p.done ? ' done' : '') + '">' +
        '<button class="check" data-act="toggle-priority" data-day="' + key + '" data-id="' + esc(p.id) + '" aria-label="انجام شد">' + (p.done ? icon('check') : '') + '</button>' +
        '<span class="priority-title" data-act="edit-priority" data-day="' + key + '" data-id="' + esc(p.id) + '">' + esc(p.title) + '</span>' +
        '<button class="icon-btn" data-act="priority-menu" data-day="' + key + '" data-id="' + esc(p.id) + '" aria-label="گزینه‌ها">⋮</button>' +
      '</li>';
    });
    html += '</ul>';
    if (day.priorities.length < 3) {
      html += '<button class="btn block ghost" data-act="add-priority" data-day="' + key + '">' + icon('plus') + ' افزودن اولویت</button>';
    }
    html += '</section>';

    /* برنامه امروز */
    html += '<section class="card">';
    html += '<div class="card-head"><h2 class="card-title">' + icon('today') + ' برنامه امروز</h2>' +
      '<button class="icon-btn" data-act="day-type" data-day="' + key + '" aria-label="تغییر نوع روز">⋮</button></div>';
    var slots = Logic.scheduleFor(key, state);
    if (!slots.length) {
      html += '<p class="muted small">برنامه‌ای برای این نوع روز ثبت نشده. از تنظیمات آن را بساز.</p>';
    } else {
      html += '<ul class="timeline">';
      slots.forEach(function (s) {
        var isNow = current && current.start === s.start && current.end === s.end;
        html += '<li class="slot' + (isNow ? ' now' : '') + '">' +
          '<span class="slot-time">' + fa(s.start) + '<i>تا ' + fa(s.end) + '</i></span>' +
          '<span class="slot-title">' + esc(s.title) + (isNow ? ' <span class="badge now-badge">اکنون</span>' : '') + '</span>' +
        '</li>';
      });
      html += '</ul>';
    }
    html += '</section>';

    /* چک‌لیست روزانه */
    html += '<section class="card">';
    html += '<h2 class="card-title">' + icon('check') + ' چک‌لیست امروز</h2>';
    html += renderChecklist(day, key);
    html += '</section>';

    /* آرام‌سازی شب */
    if (state.settings.showWindDown) {
      var wd = Logic.windDownTasks(day);
      html += '<section class="card winddown">';
      html += '<h2 class="card-title">' + icon('moon') + ' آرام‌سازی شب</h2>';
      if (!wd.length) {
        html += '<p class="muted small">موردی ثبت نشده.</p>';
      } else {
        html += '<ul class="tasks">';
        wd.forEach(function (t) { html += taskRow(t, key); });
        html += '</ul>';
      }
      html += '<p class="muted small">خواب کافی بخشی از برنامه است؛ برای جبران کارهای عقب‌مانده، خواب را فدا نکن.</p>';
      html += '</section>';
    }

    /* خلاصه هفته */
    html += '<section class="card">';
    html += '<div class="card-head"><h2 class="card-title">' + icon('week') + ' خلاصه هفته</h2>' +
      '<a class="link" href="#/week">مرور کامل</a></div>';
    html += weekSummaryMini(ws);
    html += '</section>';

    /* میان‌بر گواهینامه */
    var doneStages = state.driving.stages.filter(function (s) { return s.done; }).length;
    html += '<section class="card">' +
      '<div class="card-head"><h2 class="card-title">' + icon('car') + ' گواهینامه رانندگی</h2><a class="link" href="#/driving">بازکردن</a></div>' +
      '<div class="progress"><div class="progress-bar" style="width:' + Math.round(doneStages / Math.max(1, state.driving.stages.length) * 100) + '%"></div></div>' +
      '<div class="muted small">' + fa(doneStages) + ' از ' + fa(state.driving.stages.length) + ' مرحله انجام شده' +
        (state.driving.nextAction ? ' · اقدام بعدی: ' + esc(state.driving.nextAction) : '') + '</div>' +
    '</section>';

    return html;
  }

  function renderChecklist(day, key) {
    var groups = {};
    var order = [];
    Logic.mainTasks(day).forEach(function (t) {
      if (!groups[t.category]) { groups[t.category] = []; order.push(t.category); }
      groups[t.category].push(t);
    });
    if (!order.length) return '<p class="muted small">امروز موردی برای انجام نیست.</p>';
    var html = '';
    order.forEach(function (cat) {
      html += '<div class="cat-block">' +
        '<div class="cat-head"><span class="cat-name">' + esc(Defaults.CATEGORIES[cat] || cat) + '</span>' +
        '<button class="icon-btn" data-act="add-task" data-day="' + key + '" data-cat="' + esc(cat) + '" aria-label="افزودن کار">' + icon('plus') + '</button></div>';
      html += '<ul class="tasks">';
      groups[cat].forEach(function (t) { html += taskRow(t, key); });
      html += '</ul></div>';
    });
    html += '<button class="btn block ghost" data-act="add-task" data-day="' + key + '" data-cat="uni">' + icon('plus') + ' افزودن کار یک‌باره</button>';
    return html;
  }

  function taskRow(t, key) {
    var done = t.status === 'done';
    var skipped = t.status === 'skipped';
    return '<li class="task' + (done ? ' done' : '') + (skipped ? ' skipped' : '') + '">' +
      '<button class="check" data-act="toggle-task" data-day="' + key + '" data-id="' + esc(t.id) + '" aria-label="تغییر وضعیت">' + (done ? icon('check') : '') + '</button>' +
      '<span class="task-title">' + esc(t.title) +
        (t.type === 'oneshot' ? ' <span class="badge">یک‌باره</span>' : '') +
        (skipped ? ' <span class="badge warn">رد شده</span>' : '') +
      '</span>' +
      '<button class="icon-btn" data-act="task-menu" data-day="' + key + '" data-id="' + esc(t.id) + '" aria-label="گزینه‌ها">⋮</button>' +
    '</li>';
  }

  function weekSummaryMini(ws) {
    var c = ws.categories;
    var rows = [
      ['یادگیری هوش مصنوعی', c.ai.completed, state.targets.ai],
      ['باشگاه', c.gym.completed, state.targets.gym],
      ['مطالعه', c.reading.completed, state.targets.reading],
      ['گواهینامه', c.driving.completed, state.targets.driving]
    ];
    var html = '<ul class="mini-stats">';
    rows.forEach(function (r) {
      var pct = Math.min(100, Math.round(r[1] / Math.max(1, r[2]) * 100));
      html += '<li><span class="mini-label">' + esc(r[0]) + '</span>' +
        '<span class="mini-bar"><i style="width:' + pct + '%"></i></span>' +
        '<span class="mini-val">' + fa(r[1]) + '/' + fa(r[2]) + '</span></li>';
    });
    html += '</ul>';
    var review = ws.reviewDone ? '<span class="badge ok">ثبت شده</span>' : '<span class="badge">در انتظار</span>';
    html += '<div class="muted small">مرور هفتگی: ' + review + '</div>';
    return html;
  }

  /* ================= نمای هفته ================= */
  function viewWeek() {
    if (!ui.weekStart) ui.weekStart = Logic.weekStart(Logic.todayKey());
    var start = ui.weekStart;
    // فقط هفتهٔ جاری و آینده ساخته می‌شود؛ هفته‌های گذشته با الگوهای کنونی بازنویسی نمی‌شوند
    var thisWeekStart = Logic.weekStart(Logic.todayKey());
    Logic.weekDates(start).forEach(function (k) { if (k >= thisWeekStart) ensureDay(k); });

    var ws = Logic.weekStats(state, start);
    var c = ws.categories;
    var isCurrent = start === Logic.weekStart(Logic.todayKey());
    var review = state.reviews[start] || { answers: ['', '', ''], adjustment: '' };

    var html = '';
    html += '<div class="card week-nav">' +
      '<button class="btn ghost" data-act="week-prev">هفته قبل</button>' +
      '<div class="week-label">' + esc(weekLabel(start)) + (isCurrent ? '<span class="badge ok">این هفته</span>' : '') + '</div>' +
      '<button class="btn ghost" data-act="week-next">هفته بعد</button>' +
    '</div>';

    html += '<section class="card"><h2 class="card-title">' + icon('week') + ' برنامه‌ریزی‌شده در برابر انجام‌شده</h2>';
    html += targetRow('جلسات یادگیری هوش مصنوعی', c.ai.completed, Math.max(state.targets.ai, c.ai.planned));
    html += targetRow('جلسات باشگاه', c.gym.completed, Math.max(state.targets.gym, c.gym.planned));
    html += targetRow('جلسات مطالعه', c.reading.completed, Math.max(state.targets.reading, c.reading.planned));
    html += targetRow('پیگیری گواهینامه', c.driving.completed, Math.max(state.targets.driving, c.driving.planned));
    html += targetRow('مرور هفتگی', ws.reviewDone ? 1 : 0, 1);
    html += '</section>';

    html += '<section class="card"><h2 class="card-title">' + icon('check') + ' تکمیل چک‌لیست روزانه</h2><ul class="day-bars">';
    ws.days.forEach(function (d) {
      var isToday = d.key === Logic.todayKey();
      html += '<li class="' + (isToday ? 'today' : '') + '">' +
        '<span class="day-bars-name">' + esc(Jalali.WEEKDAYS[Logic.irIndex(d.key)]) + '<i>' + fa(Jalali.toJalaali(Logic.dateOf(d.key).getFullYear(), Logic.dateOf(d.key).getMonth() + 1, Logic.dateOf(d.key).getDate()).jd) + '</i></span>' +
        '<span class="day-bars-bar"><i style="width:' + d.prog.pct + '%"></i></span>' +
        '<span class="day-bars-val">' + fa(d.prog.pct) + '٪</span>' +
      '</li>';
    });
    html += '</ul></section>';

    html += '<section class="card"><h2 class="card-title">' + icon('sun') + ' پیوستگی</h2><ul class="chips-list">' +
      '<li>' + fa(ws.consistency.ai) + ' روز یادگیری هوش مصنوعی</li>' +
      '<li>' + fa(ws.consistency.reading) + ' روز مطالعه</li>' +
      '<li>' + fa(ws.consistency.gym) + ' روز باشگاه یا بازیابی</li>' +
      '</ul><p class="muted small">این اعداد برای نشان‌دادن روند هستند، نه برای قضاوت. روزهای سبک‌تر هم بخشی از برنامه‌اند.</p></section>';

    html += '<section class="card"><h2 class="card-title">' + icon('clock') + ' کارهای عقب‌افتاده و ردشده</h2>';
    if (!ws.postponed.length) {
      html += '<p class="muted small">مورد قابل توجهی نیست.</p>';
    } else {
      html += '<ul class="plain-list">';
      ws.postponed.slice(0, 12).forEach(function (p) {
        html += '<li>' + esc(p.title) + ' <span class="muted small">(' + esc(jLabel(p.from)) + ')</span></li>';
      });
      html += '</ul>';
      html += '<p class="muted small">اگر کاری چند بار عقب افتاده، می‌توانی آن را کوچک‌تر کنی یا موقتاً غیرفعال کنی.</p>';
    }
    html += '</section>';

    /* مرور هفتگی */
    html += '<section class="card"><h2 class="card-title">' + icon('flag') + ' مرور هفتگی (۲۰ دقیقه)</h2>' +
      '<label class="field"><span>۱) این هفته چه چیزی خوب پیش رفت؟</span>' +
      '<textarea class="input" rows="2" data-bind="reviews.' + start + '.answers.0">' + esc(review.answers && review.answers[0] || '') + '</textarea></label>' +
      '<label class="field"><span>۲) چه چیزی روتین من را مختل کرد؟</span>' +
      '<textarea class="input" rows="2" data-bind="reviews.' + start + '.answers.1">' + esc(review.answers && review.answers[1] || '') + '</textarea></label>' +
      '<label class="field"><span>۳) یک تغییر که هفته بعد انجام می‌دهم:</span>' +
      '<textarea class="input" rows="2" data-bind="reviews.' + start + '.answers.2">' + esc(review.answers && review.answers[2] || '') + '</textarea></label>' +
      '<label class="field"><span>یک تنظیم عملی برای هفته آینده</span>' +
      '<input class="input" type="text" data-bind="reviews.' + start + '.adjustment" value="' + esc(review.adjustment || '') + '"></label>' +
      '<p class="muted small">هرچه می‌نویسی خودکار ذخیره می‌شود. اگر فراموش شد، همین‌جا در دسترس است.</p>' +
    '</section>';

    /* مرورهای گذشته */
    var past = Object.keys(state.reviews).sort().reverse();
    if (past.length) {
      html += '<section class="card"><h2 class="card-title">مرورهای پیشین</h2><ul class="plain-list">';
      past.forEach(function (k) {
        html += '<li><button class="link" data-act="open-week" data-week="' + esc(k) + '">' + esc(weekLabel(k)) + '</button></li>';
      });
      html += '</ul></section>';
    }

    return html;
  }

  function targetRow(label, completed, planned) {
    var pct = Math.min(100, planned ? Math.round(completed / planned * 100) : 0);
    return '<div class="target-row">' +
      '<div class="target-head"><span>' + esc(label) + '</span><span class="muted small">' + fa(completed) + ' از ' + fa(planned) + '</span></div>' +
      '<div class="progress"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
    '</div>';
  }

  /* ================= نمای نقشه راه ================= */
  function viewRoadmap() {
    var rm = state.roadmap;
    var html = '';
    html += '<section class="card"><h2 class="card-title">' + icon('roadmap') + ' نقشه راه یک‌ساله</h2>' +
      '<label class="field"><span>عنوان</span><input class="input" type="text" data-bind="roadmap.title" value="' + esc(rm.title) + '"></label>' +
      '<label class="field"><span>تاریخ شروع (میلادی، برای محاسبه ماه جاری)</span><input class="input" type="date" data-bind="roadmap.anchor" value="' + esc(rm.anchor) + '"></label>' +
      '<p class="muted small">این فازها اهداف برنامه‌ریزی هستند، نه تضمین. هر بخش قابل ویرایش است.</p></section>';

    var monthIndex = monthsSince(rm.anchor);
    rm.phases.forEach(function (p, pi) {
      var doneGoals = p.goals.filter(function (g) { return g.done; }).length;
      var pct = p.goals.length ? Math.round(doneGoals / p.goals.length * 100) : 0;
      var isCurrent = monthIndex >= pi * 3 && monthIndex <= pi * 3 + 2;
      html += '<section class="card phase' + (isCurrent ? ' current' : '') + '">' +
        '<div class="card-head">' +
          '<input class="input title-input" type="text" data-bind="roadmap.phases.' + pi + '.title" value="' + esc(p.title) + '">' +
          '<button class="icon-btn" data-act="phase-menu" data-idx="' + pi + '" aria-label="گزینه‌ها">⋮</button>' +
        '</div>' +
        '<input class="input" type="text" data-bind="roadmap.phases.' + pi + '.months" value="' + esc(p.months) + '" placeholder="بازه زمانی">' +
        '<div class="progress" style="margin-top:.6rem"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
        '<ul class="goals">';
      p.goals.forEach(function (g, gi) {
        html += '<li class="goal' + (g.done ? ' done' : '') + '">' +
          '<button class="check" data-act="goal-toggle" data-pi="' + pi + '" data-gi="' + gi + '" aria-label="انجام شد">' + (g.done ? icon('check') : '') + '</button>' +
          '<span data-act="goal-edit" data-pi="' + pi + '" data-gi="' + gi + '">' + esc(g.text) + '</span>' +
          '<button class="icon-btn" data-act="goal-del" data-pi="' + pi + '" data-gi="' + gi + '" aria-label="حذف">×</button>' +
        '</li>';
      });
      html += '</ul>';
      html += '<button class="btn block ghost" data-act="goal-add" data-pi="' + pi + '">' + icon('plus') + ' افزودن هدف</button>';
      html += '</section>';
    });
    html += '<button class="btn block" data-act="phase-add">' + icon('plus') + ' افزودن فاز</button>';
    return html;
  }

  function monthsSince(anchorKey) {
    try {
      var anchor = Logic.dateOf(anchorKey);
      var now = new Date();
      return (now.getFullYear() - anchor.getFullYear()) * 12 + (now.getMonth() - anchor.getMonth());
    } catch (e) { return 0; }
  }

  /* ================= نمای یادگیری ================= */
  function viewLearn() {
    var learn = state.learning;
    var ws = Logic.weekStats(state, Logic.weekStart(Logic.todayKey()));
    var sessionsThisWeek = Logic.learningSessionsInWeek(state, Logic.weekStart(Logic.todayKey()));
    var doneThisWeek = sessionsThisWeek.filter(function (s) { return s.done; }).length;

    var html = '';
    html += '<section class="card"><h2 class="card-title">' + icon('learn') + ' مسیر یادگیری</h2>' +
      '<p class="muted small">یک مسیر ساده. هدف، ساختن عادت یادگیری و تکمیل یک پروژه کاربردی است.</p><ol class="steps">';
    learn.steps.forEach(function (s, i) {
      html += '<li class="step' + (s.done ? ' done' : '') + '">' +
        '<button class="check" data-act="step-toggle" data-idx="' + i + '" aria-label="انجام شد">' + (s.done ? icon('check') : '') + '</button>' +
        '<span>' + esc(s.title) + '</span></li>';
    });
    html += '</ol></section>';

    html += '<section class="card"><div class="card-head"><h2 class="card-title">' + icon('flag') + ' پروژه StudyMind</h2></div>' +
      '<label class="field"><span>نام</span><input class="input" type="text" data-bind="learning.project.name" value="' + esc(learn.project.name) + '"></label>' +
      '<label class="field"><span>ایده</span><input class="input" type="text" data-bind="learning.project.idea" value="' + esc(learn.project.idea) + '"></label>' +
      '<label class="field"><span>وضعیت</span><input class="input" type="text" data-bind="learning.project.status" value="' + esc(learn.project.status) + '"></label>' +
      '<label class="field"><span>یادداشت و گام بعدی</span><textarea class="input" rows="3" data-bind="learning.project.notes">' + esc(learn.project.notes) + '</textarea></label>' +
    '</section>';

    html += '<section class="card"><div class="card-head"><h2 class="card-title">' + icon('clock') + ' جلسه‌های یادگیری</h2>' +
      '<span class="badge' + (doneThisWeek >= state.targets.ai ? ' ok' : '') + '">این هفته: ' + fa(doneThisWeek) + '/' + fa(state.targets.ai) + '</span></div>';
    if (!learn.sessions.length) {
      html += '<p class="muted small">هنوز جلسه‌ای ثبت نشده.</p>';
    }
    learn.sessions.slice().reverse().forEach(function (s) {
      var idx = learn.sessions.indexOf(s);
      html += '<div class="session' + (s.done ? ' done' : '') + '">' +
        '<div class="session-head">' +
          '<button class="check" data-act="session-done" data-idx="' + idx + '" aria-label="انجام شد">' + (s.done ? icon('check') : '') + '</button>' +
          '<input class="input" type="text" data-bind="learning.sessions.' + idx + '.topic" value="' + esc(s.topic) + '" placeholder="موضوع یا کار">' +
          '<button class="icon-btn" data-act="session-menu" data-idx="' + idx + '" aria-label="گزینه‌ها">⋮</button>' +
        '</div>' +
        '<div class="session-grid">' +
          '<label class="field small"><span>مدت برنامه‌ریزی‌شده (دقیقه)</span><input class="input" type="number" min="0" data-bind="learning.sessions.' + idx + '.planned" value="' + esc(s.planned || '') + '"></label>' +
          '<label class="field small"><span>مدت واقعی (دقیقه)</span><input class="input" type="number" min="0" data-bind="learning.sessions.' + idx + '.actual" value="' + esc(s.actual || '') + '"></label>' +
        '</div>' +
        '<label class="field small"><span>چه چیزی یاد گرفتم</span><textarea class="input" rows="2" data-bind="learning.sessions.' + idx + '.note">' + esc(s.note || '') + '</textarea></label>' +
        '<label class="field small"><span>گام بعدی مشخص</span><input class="input" type="text" data-bind="learning.sessions.' + idx + '.next" value="' + esc(s.next || '') + '"></label>' +
        '<div class="muted small">' + esc(jLabel(s.date)) + '</div>' +
      '</div>';
    });
    html += '<button class="btn block" data-act="session-add">' + icon('plus') + ' ثبت جلسه امروز</button></section>';

    return html;
  }

  /* ================= نمای گواهینامه ================= */
  function viewDriving() {
    var d = state.driving;
    var done = d.stages.filter(function (s) { return s.done; }).length;
    var html = '';
    html += '<section class="card"><h2 class="card-title">' + icon('car') + ' گواهینامه رانندگی</h2>' +
      '<div class="progress"><div class="progress-bar" style="width:' + Math.round(done / Math.max(1, d.stages.length) * 100) + '%"></div></div>' +
      '<div class="muted small">' + fa(done) + ' از ' + fa(d.stages.length) + ' مرحله انجام شده</div>' +
      '<label class="switch"><input type="checkbox" data-bind="driving.registered" data-render="1"' + (d.registered ? ' checked' : '') + '> <span>ثبت‌نام انجام شده</span></label>' +
      '<p class="muted small">' + (d.registered
        ? 'پس از ثبت‌نام، جلسه‌های پیگیری هفتگی را با جلسه‌های آموزشگاه جایگزین کن.'
        : 'تا پیش از ثبت‌نام، دو جلسه پیگیری ۲۰ دقیقه‌ای در هفته در نظر گرفته شده است.') + '</p>' +
      '<label class="field"><span>اقدام بعدی</span><input class="input" type="text" data-bind="driving.nextAction" value="' + esc(d.nextAction) + '" placeholder="مثلاً: تماس با دو آموزشگاه و مقایسه قیمت"></label>' +
    '</section>';

    html += '<section class="card"><h2 class="card-title">مراحل</h2>';
    d.stages.forEach(function (s, i) {
      html += '<div class="stage' + (s.done ? ' done' : '') + '">' +
        '<div class="stage-head">' +
          '<button class="check" data-act="stage-toggle" data-idx="' + i + '" aria-label="انجام شد">' + (s.done ? icon('check') : '') + '</button>' +
          '<input class="input" type="text" data-bind="driving.stages.' + i + '.title" value="' + esc(s.title) + '">' +
          '<button class="icon-btn" data-act="stage-menu" data-idx="' + i + '" aria-label="گزینه‌ها">⋮</button>' +
        '</div>' +
        '<div class="stage-grid">' +
          '<label class="field small"><span>تاریخ</span><input class="input" type="date" data-bind="driving.stages.' + i + '.date" value="' + esc(s.date || '') + '"></label>' +
          '<label class="field small"><span>هزینه</span><input class="input" type="text" data-bind="driving.stages.' + i + '.cost" value="' + esc(s.cost || '') + '" placeholder="اختیاری"></label>' +
        '</div>' +
        '<label class="field small"><span>یادداشت</span><input class="input" type="text" data-bind="driving.stages.' + i + '.notes" value="' + esc(s.notes || '') + '"></label>' +
      '</div>';
    });
    html += '<button class="btn block" data-act="stage-add">' + icon('plus') + ' افزودن مرحله</button></section>';

    html += '<section class="card"><h2 class="card-title">یادداشت</h2><p class="muted small">' +
      'این برنامه مقررات رسمی را نمی‌سازد و تاریخ پایان تخمین نمی‌زند. مراحل را با شرایط واقعی محل خودت هماهنگ نگه دار.</p></section>';
    return html;
  }

  /* ================= نمای تنظیمات ================= */
  function viewSettings() {
    var s = state.settings;
    var html = '';

    html += '<section class="card"><h2 class="card-title">' + icon('settings') + ' تنظیمات پایه</h2>' +
      '<label class="field"><span>پوسته</span><select class="input" data-bind="settings.theme" data-render="1">' +
        opt('system', 'هماهنگ با سیستم', s.theme) + opt('light', 'روشن', s.theme) + opt('dark', 'تیره', s.theme) +
      '</select></label>' +
      '<div class="grid-2">' +
        '<label class="field"><span>ساعت هدف بیداری</span><input class="input" type="time" data-bind="settings.wakeTime" value="' + esc(s.wakeTime) + '"></label>' +
        '<label class="field"><span>ساعت هدف خواب</span><input class="input" type="time" data-bind="settings.bedTime" value="' + esc(s.bedTime) + '"></label>' +
      '</div>' +
      '<label class="switch"><input type="checkbox" data-bind="settings.showWindDown" data-render="1"' + (s.showWindDown ? ' checked' : '') + '> <span>نمایش چک‌لیست آرام‌سازی شب</span></label>' +
    '</section>';

    html += '<section class="card"><h2 class="card-title">روزهای دانشگاه</h2>' +
      '<p class="muted small">کدام روزها کلاس داری؟ برنامه روزانه بر همین اساس شکل می‌گیرد.</p>' +
      dayChips('universityDays', s.universityDays) +
      '<h2 class="card-title" style="margin-top:1rem">روزهای باشگاه</h2>' +
      dayChips('gymDays', s.gymDays) +
    '</section>';

    html += '<section class="card"><h2 class="card-title">تحصیلی و تمرکز هفته</h2><div class="weekday-focus">';
    state.weekdayFocus.forEach(function (f, i) {
      html += '<label class="field small"><span>' + Jalali.WEEKDAYS[i] + '</span>' +
        '<input class="input" type="text" data-bind="weekdayFocus.' + i + '" value="' + esc(f) + '"></label>';
    });
    html += '</div></section>';

    html += '<section class="card"><h2 class="card-title">اهداف هفتگی</h2><div class="grid-2">' +
      numField('targets.ai', 'جلسات هوش مصنوعی') + numField('targets.gym', 'جلسات باشگاه') +
      numField('targets.reading', 'جلسات مطالعه') + numField('targets.driving', 'پیگیری گواهینامه') +
    '</div></section>';

    /* ویرایش برنامه روزانه */
    var types = [['regular', 'روز عادی'], ['gym', 'روز باشگاه'], ['friday', 'روز جمعه'], ['free', 'روز آزاد']];
    html += '<section class="card"><h2 class="card-title">ویرایش برنامه روزانه</h2>' +
      '<div class="segmented">' + types.map(function (t) {
        return '<button class="seg' + (ui.scheduleTab === t[0] ? ' active' : '') + '" data-act="sched-tab" data-type="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>';
    var list = state.schedules[ui.scheduleTab] || [];
    list.forEach(function (slot, i) {
      html += '<div class="sched-row">' +
        '<input class="input time" type="time" data-bind="schedules.' + ui.scheduleTab + '.' + i + '.start" value="' + esc(slot.start) + '">' +
        '<input class="input time" type="time" data-bind="schedules.' + ui.scheduleTab + '.' + i + '.end" value="' + esc(slot.end) + '">' +
        '<input class="input" type="text" data-bind="schedules.' + ui.scheduleTab + '.' + i + '.title" value="' + esc(slot.title) + '">' +
        '<button class="icon-btn" data-act="sched-menu" data-type="' + ui.scheduleTab + '" data-idx="' + i + '" aria-label="گزینه‌ها">⋮</button>' +
      '</div>';
    });
    html += '<button class="btn block ghost" data-act="sched-add" data-type="' + ui.scheduleTab + '">' + icon('plus') + ' افزودن بازه</button></section>';

    /* کارهای تکرارشونده */
    html += '<section class="card"><h2 class="card-title">کارهای تکرارشونده</h2>' +
      '<p class="muted small">این کارها روی روزهای مناسب به‌طور خودکار ظاهر می‌شوند. سابقه گذشته هرگز پاک نمی‌شود.</p>';
    state.templates.forEach(function (t, i) {
      html += '<div class="tpl' + (t.enabled === false ? ' off' : '') + '">' +
        '<div class="tpl-head">' +
          '<input class="input" type="text" data-bind="templates.' + i + '.title" value="' + esc(t.title) + '">' +
          '<button class="icon-btn" data-act="tpl-menu" data-idx="' + i + '" aria-label="گزینه‌ها">⋮</button>' +
        '</div>' +
        '<select class="input" data-bind="templates.' + i + '.category">' +
          Object.keys(Defaults.CATEGORIES).map(function (k) {
            return opt(k, Defaults.CATEGORIES[k], t.category);
          }).join('') +
        '</select>' +
        '<div class="chips">' + Jalali.WEEKDAYS_SHORT.map(function (wd, di) {
          var on = t.days === null || (t.days && t.days.indexOf(di) >= 0);
          return '<button class="chip' + (on ? ' on' : '') + '" data-act="tpl-day" data-idx="' + i + '" data-day="' + di + '">' + wd + '</button>';
        }).join('') + '</div>' +
        '<div class="muted small">' + (t.days === null ? 'هر روز' : 'روزهای انتخاب‌شده') + (t.enabled === false ? ' · غیرفعال' : '') + '</div>' +
      '</div>';
    });
    html += '<button class="btn block ghost" data-act="tpl-add">' + icon('plus') + ' افزودن کار تکرارشونده</button></section>';

    /* داده‌ها */
    html += '<section class="card"><h2 class="card-title">داده‌ها و پشتیبان‌گیری</h2>' +
      '<p class="muted small">همه اطلاعات فقط در همین مرورگر و دستگاه ذخیره می‌شود و به‌طور خودکار با دستگاه‌های دیگر همگام نمی‌شود. برای جابه‌جایی یا امنیت، پشتیبان بگیر.</p>' +
      '<button class="btn block" data-act="export">' + 'دریافت فایل پشتیبان (JSON)</button>' +
      '<button class="btn block ghost" data-act="import">' + 'بازیابی از فایل پشتیبان</button>' +
      '<button class="btn block danger" data-act="reset">پاک‌کردن همه داده‌ها</button>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
    '</section>';

    /* حریم خصوصی */
    html += '<section class="card"><h2 class="card-title">حریم خصوصی</h2><p class="muted small">' +
      'نظام یک برنامه شخصی و محلی است. هیچ حساب کاربری، سرور یا سرویس ابری وجود ندارد. اطلاعات در حافظه همین مرورگر ذخیره می‌شود؛ با پاک‌کردن داده‌های مرورگر از بین می‌رود. اگر مرورگر را عوض کنی یا داده‌ها را پاک کنی، اطلاعات روی دستگاه‌های دیگر منتقل نمی‌شود؛ برای انتقال از فایل پشتیبان استفاده کن.' +
    '</p></section>';

    /* نصب */
    html += '<section class="card"><h2 class="card-title">نصب روی اندروید</h2><ol class="install-steps">' +
      '<li>سایت را در Chrome باز کن.</li>' +
      '<li>روی منوی سه‌نقطه بزن.</li>' +
      '<li>گزینه «افزودن به صفحه اصلی» یا «نصب برنامه» را انتخاب کن.</li>' +
      '<li>پس از نخستین بازدید موفق، دستیار امروز آفلاین هم کار می‌کند.</li>' +
    '</ol><p class="muted small">اگر امکان نصب نمایش داده نشد، به این معناست که مرورگر یا محیط فعلی از نصب PWA پشتیبانی نمی‌کند؛ وب‌سایت در همان حالت مرورگر هم کار می‌کند.</p></section>';

    html += '<p class="muted small center">نظام — نسخه ۱٫۰ · داده‌ها محلی هستند</p>';
    return html;
  }

  function opt(value, label, current) {
    return '<option value="' + esc(value) + '"' + (String(current) === String(value) ? ' selected' : '') + '>' + esc(label) + '</option>';
  }
  function numField(path, label) {
    var val = path.split('.').reduce(function (o, k) { return o[k]; }, state);
    return '<label class="field"><span>' + esc(label) + '</span><input class="input" type="number" min="0" max="14" data-bind="' + path + '" value="' + esc(val) + '"></label>';
  }
  function dayChips(field, selected) {
    return '<div class="chips">' + Jalali.WEEKDAYS.map(function (wd, i) {
      var on = (selected || []).indexOf(i) >= 0;
      return '<button class="chip' + (on ? ' on' : '') + '" data-act="set-day" data-field="' + field + '" data-day="' + i + '">' + wd + '</button>';
    }).join('') + '</div>';
  }

  /* ================= مسیریابی و رندر ================= */
  var lastRoute = null;

  function render() {
    try {
      applyTheme();
      var route = currentRoute();
      var keepScroll = route === lastRoute ? (window.scrollY || 0) : 0;
      var html;
      if (route === 'week') html = viewWeek();
      else if (route === 'roadmap') html = viewRoadmap();
      else if (route === 'learn') html = viewLearn();
      else if (route === 'driving') html = viewDriving();
      else if (route === 'settings') html = viewSettings();
      else html = viewToday();

      view.innerHTML = html;
      window.scrollTo(0, keepScroll);
      lastRoute = route;

      var active = (route === 'driving') ? 'today' : route;
      Array.prototype.forEach.call(tabbar.querySelectorAll('a'), function (a) {
        a.classList.toggle('active', a.dataset.tab === active);
      });

      updateClock();
      updateNet();
    } catch (err) {
      console.error('Nizam: خطا در رندر', err);
      try {
        view.innerHTML = '<section class="card"><h2 class="card-title">خطا در نمایش صفحه</h2>' +
          '<p class="muted small">' + esc(String(err && err.message || err)) + '</p>' +
          '<pre class="muted small" style="white-space:pre-wrap">' + esc(err && err.stack || '') + '</pre>' +
          '</section>';
      } catch (e2) { /* بی‌اهمیت */ }
    }
  }

  function updateClock() {
    var el = document.getElementById('clock');
    if (!el) return;
    var now = new Date();
    el.textContent = fa(Logic.pad2(now.getHours()) + ':' + Logic.pad2(now.getMinutes()));
  }
  function updateNet() {
    var el = document.getElementById('net');
    if (!el) return;
    var off = !navigator.onLine;
    el.classList.toggle('offline', off);
    el.title = off ? 'آفلاین' : 'متصل';
    el.textContent = off ? 'آفلاین' : '';
  }

  /* ================= رویدادها ================= */
  tabbar.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    if (a.dataset.tab === 'today') ui.weekStart = null;
  });

  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-bind]');
    if (!el) return;
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = el.value === '' ? '' : Number(el.value);
    else val = el.value;
    setByPath(state, el.dataset.bind, val);
    save();
    if (el.dataset.render === '1' || el.tagName === 'SELECT') render();
  });

  /* ذخیرهٔ خودکار هنگام تایپ، با کمی تأخیر تا هر کاراکتر کل state را ننویسد */
  var inputSaveTimer = null;
  document.addEventListener('input', function (e) {
    var el = e.target.closest('[data-bind]');
    if (!el) return;
    if (el.type === 'checkbox') return;
    var val = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    setByPath(state, el.dataset.bind, val);
    clearTimeout(inputSaveTimer);
    inputSaveTimer = setTimeout(save, 300);
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.dataset.act;
    var key = el.dataset.day;

    switch (act) {
      /* --- امروز: کارها --- */
      case 'toggle-task': {
        var day = ensureDay(key);
        var t = findTask(day, el.dataset.id);
        if (!t) return;
        t.status = t.status === 'done' ? 'pending' : 'done';
        save(); render(); break;
      }
      case 'task-menu': {
        var d2 = ensureDay(key);
        var t2 = findTask(d2, el.dataset.id);
        if (!t2) return;
        var items = [
          { label: 'ویرایش عنوان', onClick: function () { promptText('ویرایش کار', t2.title, function (v) { if (v) { t2.title = v; save(); render(); } }); } },
          t2.status === 'skipped'
            ? { label: 'بازگردانی به حالت عادی', onClick: function () { t2.status = 'pending'; save(); render(); } }
            : { label: 'رد کردن (بدون انجام)', onClick: function () { t2.status = 'skipped'; save(); render(); } },
          { label: 'انتقال به بالا', onClick: function () { moveItem(d2.tasks, t2, -1); save(); render(); } },
          { label: 'انتقال به پایین', onClick: function () { moveItem(d2.tasks, t2, 1); save(); render(); } },
          { label: 'حذف از امروز', danger: true, onClick: function () { d2.tasks.splice(d2.tasks.indexOf(t2), 1); save(); render(); } }
        ];
        sheet(t2.title, items); break;
      }
      case 'add-task': {
        var d3 = ensureDay(key);
        promptText('افزودن کار', '', function (v) {
          if (!v) return;
          d3.tasks.push({ id: Logic.uid(), src: null, title: v, category: el.dataset.cat, type: 'oneshot', status: 'pending' });
          save(); render();
        });
        break;
      }
      /* --- اولویت‌ها --- */
      case 'toggle-priority': {
        var dp = ensureDay(key);
        var p = dp.priorities.filter(function (x) { return x.id === el.dataset.id; })[0];
        if (!p) return; p.done = !p.done; save(); render(); break;
      }
      case 'edit-priority': {
        var dp2 = ensureDay(key);
        var p2 = dp2.priorities.filter(function (x) { return x.id === el.dataset.id; })[0];
        if (!p2) return;
        promptText('ویرایش اولویت', p2.title, function (v) { if (v) { p2.title = v; save(); render(); } });
        break;
      }
      case 'priority-menu': {
        var dp3 = ensureDay(key);
        var p3 = dp3.priorities.filter(function (x) { return x.id === el.dataset.id; })[0];
        if (!p3) return;
        sheet(p3.title, [
          { label: 'ویرایش', onClick: function () { promptText('ویرایش اولویت', p3.title, function (v) { if (v) { p3.title = v; save(); render(); } }); } },
          { label: 'حذف', danger: true, onClick: function () { dp3.priorities.splice(dp3.priorities.indexOf(p3), 1); save(); render(); } }
        ]);
        break;
      }
      case 'add-priority': {
        var dp4 = ensureDay(key);
        if (dp4.priorities.length >= 3) { toast('حداکثر سه اولویت'); return; }
        promptText('اولویت امروز', '', function (v) {
          if (!v) return;
          dp4.priorities.push({ id: Logic.uid(), title: v, done: false });
          save(); render();
        });
        break;
      }
      case 'day-type': {
        var cur = state.settings.dayOverrides[key] || Logic.dayType(key, state);
        sheet('نوع امروز', [
          { label: 'روز عادی' + (cur === 'regular' ? ' ✓' : ''), onClick: function () { setOverride(key, 'regular'); } },
          { label: 'روز باشگاه' + (cur === 'gym' ? ' ✓' : ''), onClick: function () { setOverride(key, 'gym'); } },
          { label: 'روز جمعه' + (cur === 'friday' ? ' ✓' : ''), onClick: function () { setOverride(key, 'friday'); } },
          { label: 'روز آزاد' + (cur === 'free' ? ' ✓' : ''), onClick: function () { setOverride(key, 'free'); } },
          state.settings.dayOverrides[key] ? { label: 'حذف استثنا (بازگشت به پیش‌فرض)', onClick: function () { delete state.settings.dayOverrides[key]; save(); render(); } } : null,
          { label: 'بازنشانی وضعیت کارهای امروز', danger: true, onClick: function () {
            confirmDialog('همه کارهای امروز به حالت انجام‌نشده برگردند؟', function () {
              ensureDay(key).tasks.forEach(function (t) { if (t.status === 'done') t.status = 'pending'; });
              save(); render(); toast('وضعیت امروز بازنشانی شد');
            });
          } }
        ]);
        break;
      }
      /* --- هفته --- */
      case 'week-prev': ui.weekStart = Logic.addDays(ui.weekStart || Logic.weekStart(Logic.todayKey()), -7); render(); break;
      case 'week-next': ui.weekStart = Logic.addDays(ui.weekStart || Logic.weekStart(Logic.todayKey()), 7); render(); break;
      case 'open-week': ui.weekStart = el.dataset.week; render(); break;
      /* --- نقشه راه --- */
      case 'goal-toggle': toggleGoal(+el.dataset.pi, +el.dataset.gi); break;
      case 'goal-edit': editGoal(+el.dataset.pi, +el.dataset.gi); break;
      case 'goal-del': {
        var ph = state.roadmap.phases[+el.dataset.pi];
        ph.goals.splice(+el.dataset.gi, 1); save(); render(); break;
      }
      case 'goal-add': {
        var ph2 = state.roadmap.phases[+el.dataset.pi];
        promptText('هدف تازه', '', function (v) { if (v) { ph2.goals.push({ text: v, done: false }); save(); render(); } });
        break;
      }
      case 'phase-add': {
        promptText('فاز تازه', 'فاز جدید', function (v) {
          if (!v) return;
          state.roadmap.phases.push({ id: Logic.uid(), title: v, months: '', done: false, goals: [] });
          save(); render();
        });
        break;
      }
      case 'phase-menu': {
        var pi = +el.dataset.idx;
        var phase = state.roadmap.phases[pi];
        sheet(phase.title, [
          { label: 'انتقال به بالا', onClick: function () { moveItem(state.roadmap.phases, phase, -1); save(); render(); } },
          { label: 'انتقال به پایین', onClick: function () { moveItem(state.roadmap.phases, phase, 1); save(); render(); } },
          { label: 'حذف فاز', danger: true, onClick: function () { state.roadmap.phases.splice(pi, 1); save(); render(); } }
        ]);
        break;
      }
      /* --- یادگیری --- */
      case 'step-toggle': { var st = state.learning.steps[+el.dataset.idx]; st.done = !st.done; save(); render(); break; }
      case 'session-add': {
        state.learning.sessions.push({ id: Logic.uid(), date: Logic.todayKey(), topic: '', planned: 30, actual: '', done: false, note: '', next: '' });
        save(); render();
        var inputs = view.querySelectorAll('.session input[data-bind$=".topic"]');
        if (inputs.length) inputs[inputs.length - 1].focus();
        break;
      }
      case 'session-done': { var se = state.learning.sessions[+el.dataset.idx]; se.done = !se.done; save(); render(); break; }
      case 'session-menu': {
        var si = +el.dataset.idx;
        var sess = state.learning.sessions[si];
        sheet(sess.topic || 'جلسه یادگیری', [
          { label: 'حذف جلسه', danger: true, onClick: function () { state.learning.sessions.splice(si, 1); save(); render(); } }
        ]);
        break;
      }
      /* --- گواهینامه --- */
      case 'stage-toggle': { var sg = state.driving.stages[+el.dataset.idx]; sg.done = !sg.done; save(); render(); break; }
      case 'stage-add': {
        state.driving.stages.push({ id: Logic.uid(), title: 'مرحله تازه', done: false, date: '', cost: '', notes: '' });
        save(); render();
        break;
      }
      case 'stage-menu': {
        var stg = state.driving.stages[+el.dataset.idx];
        sheet(stg.title, [
          { label: 'انتقال به بالا', onClick: function () { moveItem(state.driving.stages, stg, -1); save(); render(); } },
          { label: 'انتقال به پایین', onClick: function () { moveItem(state.driving.stages, stg, 1); save(); render(); } },
          { label: 'حذف مرحله', danger: true, onClick: function () { state.driving.stages.splice(state.driving.stages.indexOf(stg), 1); save(); render(); } }
        ]);
        break;
      }
      /* --- تنظیمات --- */
      case 'set-day': {
        var arr = state.settings[el.dataset.field] || [];
        var di = +el.dataset.day;
        var at = arr.indexOf(di);
        if (at >= 0) arr.splice(at, 1); else arr.push(di);
        arr.sort(function (a, b) { return a - b; });
        state.settings[el.dataset.field] = arr;
        save(); render(); break;
      }
      case 'sched-tab': ui.scheduleTab = el.dataset.type; render(); break;
      case 'sched-add': {
        var tp = el.dataset.type;
        state.schedules[tp].push({ start: '09:00', end: '10:00', title: 'بازه تازه' });
        save(); render(); break;
      }
      case 'sched-menu': {
        var ty = el.dataset.type, si2 = +el.dataset.idx;
        var slot = state.schedules[ty][si2];
        sheet(slot.title, [
          { label: 'انتقال به بالا', onClick: function () { moveItem(state.schedules[ty], slot, -1); save(); render(); } },
          { label: 'انتقال به پایین', onClick: function () { moveItem(state.schedules[ty], slot, 1); save(); render(); } },
          { label: 'حذف بازه', danger: true, onClick: function () { state.schedules[ty].splice(si2, 1); save(); render(); } }
        ]);
        break;
      }
      case 'tpl-day': {
        var ti = +el.dataset.idx, dd = +el.dataset.day;
        var tpl = state.templates[ti];
        if (tpl.days === null) tpl.days = [];
        var pos = tpl.days.indexOf(dd);
        if (pos >= 0) tpl.days.splice(pos, 1); else tpl.days.push(dd);
        tpl.days.sort(function (a, b) { return a - b; });
        if (tpl.days.length === 7) tpl.days = null;
        save(); render(); break;
      }
      case 'tpl-add': {
        state.templates.push({ id: 't_' + Logic.uid(), title: 'کار تازه', category: 'care', days: null, enabled: true });
        save(); render(); break;
      }
      case 'tpl-menu': {
        var tidx = +el.dataset.idx;
        var tt = state.templates[tidx];
        sheet(tt.title, [
          { label: tt.enabled === false ? 'فعال‌کردن' : 'غیرفعال‌کردن موقت', onClick: function () { tt.enabled = tt.enabled === false; save(); render(); } },
          { label: tt.days === null ? 'محدود به روزهای انتخاب‌شده' : 'همه روزها', onClick: function () { tt.days = tt.days === null ? [] : null; save(); render(); } },
          { label: 'انتقال به بالا', onClick: function () { moveItem(state.templates, tt, -1); save(); render(); } },
          { label: 'انتقال به پایین', onClick: function () { moveItem(state.templates, tt, 1); save(); render(); } },
          { label: 'حذف', danger: true, onClick: function () { state.templates.splice(tidx, 1); save(); render(); } }
        ]);
        break;
      }
      case 'export': exportData(); break;
      case 'import': {
        var fi = document.getElementById('importFile');
        if (fi) fi.click(); else toast('ابتدا صفحه نمایش داده شود');
        break;
      }
      case 'reset': {
        confirmDialog('همه داده‌ها و سابقه پاک شود؟ این کار برگشت‌پذیر نیست.', function () {
          Store.clear();
          state = Defaults.defaultState();
          save(); render(); toast('همه داده‌ها پاک شد');
        });
        break;
      }
      default: break;
    }
  });

  /* فایل پشتیبان به‌صورت پویا در صفحه تنظیمات ساخته می‌شود، بنابراین
     رویداد change روی سند گوش داده می‌شود تا در شروع برنامه null نداشته باشیم. */
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.id !== 'importFile') return;
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = Store.importJSON(String(reader.result));
        confirmDialog('داده‌های فعلی با فایل پشتیبان جایگزین شود؟', function () {
          state = imported;
          save(); render(); toast('بازیابی با موفقیت انجام شد');
        });
      } catch (err) {
        toast('فایل معتبر نیست');
      }
    };
    reader.readAsText(f);
    input.value = '';
  });

  function setOverride(key, type) {
    state.settings.dayOverrides = state.settings.dayOverrides || {};
    state.settings.dayOverrides[key] = type;
    save(); render();
  }
  function moveItem(arr, item, dir) {
    var i = arr.indexOf(item);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    arr.splice(i, 1);
    arr.splice(j, 0, item);
  }
  function toggleGoal(pi, gi) {
    var g = state.roadmap.phases[pi].goals[gi];
    g.done = !g.done; save(); render();
  }
  function editGoal(pi, gi) {
    var g = state.roadmap.phases[pi].goals[gi];
    promptText('ویرایش هدف', g.text, function (v) { if (v) { g.text = v; save(); render(); } });
  }
  function exportData() {
    var blob = new Blob([Store.exportJSON(state)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'nizam-backup-' + Logic.todayKey() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('فایل پشتیبان ساخته شد');
  }

  /* ================= راه‌اندازی ================= */
  window.addEventListener('hashchange', render);
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  setInterval(updateClock, 30000);
  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (state.settings.theme === 'system') applyTheme();
      });
    } catch (e) { /* بعضی مرورگرها پشتیبانی نمی‌کنند */ }
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) render(); /* روز عوض‌شده یا نیمه‌شب */
  });

  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function () { /* آفلاین بدون SW هم ممکن است */ });
    });
  }
})();
