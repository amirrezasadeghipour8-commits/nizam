/* Nizam — آزمون دود (smoke) بدون مرورگر.
   یک شنل سبک از DOM می‌سازد، app.js را اجرا می‌کند، همه مسیرها را رندر می‌کند
   و یک تعامل واقعی (تیک‌زدن کار) را برای بررسی ماندگاری داده آزمایش می‌کند.
   اجرا:  node tests/dom-smoke.js  */
'use strict';

var path = require('path');
var assert = require('assert');

/* ---------- شنل DOM ---------- */
function ClassList() { this.set = new Set(); }
ClassList.prototype.add = function () { var s = this.set; [].forEach.call(arguments, function (c) { s.add(c); }); };
ClassList.prototype.remove = function () { var s = this.set; [].forEach.call(arguments, function (c) { s.delete(c); }); };
ClassList.prototype.toggle = function (c, force) {
  if (force === undefined) { this.set.has(c) ? this.set.delete(c) : this.set.add(c); }
  else { force ? this.set.add(c) : this.set.delete(c); }
  return this.set.has(c);
};
ClassList.prototype.contains = function (c) { return this.set.has(c); };

function El(tag) {
  this.tagName = String(tag || 'div').toUpperCase();
  this.children = [];
  this.dataset = {};
  this.style = {};
  this.classList = new ClassList();
  this.hidden = false;
  this.value = '';
  this.files = [];
  this.type = '';
  this.href = '';
  this.download = '';
  this.onclick = null;
  this._listeners = {};
  this._html = '';
  this._text = '';
}
Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v); this.children = []; }
});
Object.defineProperty(El.prototype, 'textContent', {
  get: function () { return this._text; },
  set: function (v) { this._text = String(v); }
});
El.prototype.appendChild = function (c) { this.children.push(c); return c; };
El.prototype.removeChild = function (c) { var i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; };
El.prototype.addEventListener = function (t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); };
El.prototype.removeEventListener = function () {};
El.prototype.querySelectorAll = function (sel) {
  if (sel === 'a') return this.children.filter(function (c) { return c.tagName === 'A'; });
  return [];
};
El.prototype.querySelector = function () { return null; };
El.prototype.focus = function () {};
El.prototype.click = function () {};
El.prototype.closest = function () { return null; };
El.prototype.setAttribute = function () {};
El.prototype.getAttribute = function () { return null; };
El.prototype.dispatch = function (type, ev) { (this._listeners[type] || []).forEach(function (fn) { fn(ev); }); };

var registry = {
  view: new El('main'), modal: new El('div'), toast: new El('div'),
  tabbar: new El('nav'), clock: new El('span'), net: new El('span')
};
registry.modal.hidden = true;
['today', 'week', 'roadmap', 'learn', 'settings'].forEach(function (tab) {
  var a = new El('a');
  a.dataset.tab = tab;
  registry.tabbar.appendChild(a);
});

var docListeners = {};
var documentShim = {
  documentElement: new El('html'),
  body: new El('body'),
  /* شدگی سخت: شناسه‌های ناشناخته null برمی‌گردانند تا باگ «جستجوی عنصر زود از موعد»
     (مثلاً عناصری که فقط بعد از رندر ساخته می‌شوند) در تست دیده شود. */
  getElementById: function (id) {
    return Object.prototype.hasOwnProperty.call(registry, id) ? registry[id] : null;
  },
  createElement: function (tag) { return new El(tag); },
  addEventListener: function (t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); }
};

var winListeners = {};
var memory = {};
var localStorageShim = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
  setItem: function (k, v) { memory[k] = String(v); },
  removeItem: function (k) { delete memory[k]; }
};

global.window = {
  matchMedia: function () { return { matches: false, addEventListener: function () {} }; },
  addEventListener: function (t, fn) { (winListeners[t] = winListeners[t] || []).push(fn); },
  scrollTo: function () {},
  location: { hash: '' }
};
global.document = documentShim;
Object.defineProperty(global, 'navigator', { value: { onLine: true }, configurable: true, writable: true });
global.localStorage = localStorageShim;
global.location = global.window.location;
global.Blob = function (parts) { this.parts = parts; };
global.URL = { createObjectURL: function () { return 'blob:test'; }, revokeObjectURL: function () {} };
global.FileReader = function () { this.readAsText = function () {}; };

/* ---------- اجرای برنامه ---------- */
var view = registry.view;
var tests = 0;
function expect(cond, msg) { assert.ok(cond, msg); tests++; console.log('✓ ' + msg); }
function fireRoute(hash) {
  global.location.hash = hash;
  (winListeners.hashchange || []).forEach(function (fn) { fn(); });
}

require(path.join(__dirname, '..', 'js', 'jalali.js'));
require(path.join(__dirname, '..', 'js', 'defaults.js'));
require(path.join(__dirname, '..', 'js', 'logic.js'));
require(path.join(__dirname, '..', 'js', 'store.js'));
require(path.join(__dirname, '..', 'js', 'app.js'));

expect(view.innerHTML.indexOf('چک‌لیست امروز') >= 0, 'نخستین بارگذاریِ خالی، صفحه امروز را رندر می‌کند');
expect(localStorageShim.getItem('nizam.v1') !== null, 'نخستین بارگذاری، داده پیش‌فرض را ذخیره می‌کند');
expect(view.innerHTML.indexOf('برنامه امروز') >= 0, 'برنامه امروز در صفحه امروز هست');
expect(view.innerHTML.indexOf('سه اولویت اصلی امروز') >= 0, 'بخش اولویت‌ها نمایش داده شد');
expect(view.innerHTML.indexOf('آرام‌سازی شب') >= 0, 'چک‌لیست آرام‌سازی شب نمایش داده شد');

fireRoute('#/week');
expect(view.innerHTML.indexOf('مرور هفتگی') >= 0, 'صفحه هفته با مرور هفتگی رندر شد');
fireRoute('#/roadmap');
expect(view.innerHTML.indexOf('نقشه راه یک‌ساله') >= 0, 'صفحه نقشه راه رندر شد');
fireRoute('#/learn');
expect(view.innerHTML.indexOf('مسیر یادگیری') >= 0, 'صفحه یادگیری رندر شد');
fireRoute('#/driving');
expect(view.innerHTML.indexOf('گواهینامه رانندگی') >= 0, 'صفحه گواهینامه رندر شد');
fireRoute('#/settings');
expect(view.innerHTML.indexOf('داده‌ها و پشتیبان‌گیری') >= 0, 'صفحه تنظیمات رندر شد');
expect(view.innerHTML.indexOf('importFile') >= 0, 'ورودی فایل پشتیبان فقط در صفحه تنظیمات ساخته می‌شود');
expect(view.innerHTML.indexOf('ویرایش برنامه روزانه') >= 0, 'ویرایشگر برنامه در تنظیمات هست');

/* ---------- تعامل: تیک‌زدن یک کار و بررسی ماندگاری ---------- */
fireRoute('#/today');
function logic() { return require(path.join(__dirname, '..', 'js', 'logic.js')); }
var today = logic().todayKey();
var saved = JSON.parse(localStorageShim.getItem('nizam.v1'));
var day = saved.days[today];
assert.ok(day && day.tasks.length, 'روز امروز در حافظه ذخیره شده');
var task = day.tasks.filter(function (t) { return t.category !== 'winddown'; })[0];

var fakeEl = { dataset: { act: 'toggle-task', day: today, id: task.id } };
(docListeners.click || []).forEach(function (fn) {
  fn({ target: { closest: function () { return fakeEl; } } });
});

var after = JSON.parse(localStorageShim.getItem('nizam.v1'));
var t2 = after.days[today].tasks.filter(function (t) { return t.id === task.id; })[0];
expect(t2.status === 'done', 'تیک‌زدن کار ذخیره شد و وضعیت «انجام‌شده» شد');
expect(view.innerHTML.indexOf('چک‌لیست امروز') >= 0, 'پس از تعامل، صفحه دوباره رندر شد');

/* ---------- تعامل: تغییر روزهای باشگاه از تنظیمات ---------- */
fireRoute('#/settings');
var chip = { dataset: { act: 'set-day', field: 'gymDays', day: '0' } };
(docListeners.click || []).forEach(function (fn) {
  fn({ target: { closest: function () { return chip; } } });
});
var after2 = JSON.parse(localStorageShim.getItem('nizam.v1'));
expect(after2.settings.gymDays.indexOf(0) >= 0, 'افزودن شنبه به روزهای باشگاه در تنظیمات ذخیره شد');

console.log('\n' + tests + ' بررسی دود با موفقیت انجام شد.');
process.exit(0);
