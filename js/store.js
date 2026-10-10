/* Nizam — ذخیره‌سازی محلی، پشتیبان‌گیری و بازیابی.
   داده فقط در همین مرورگر و دستگاه ذخیره می‌شود. */
(function (root) {
  'use strict';

  var Defaults = root.Defaults || (typeof require !== 'undefined' ? require('./defaults.js') : null);
  var KEY = 'nizam.v1';

  function memoryStorage() {
    var map = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
      setItem: function (k, v) { map[k] = String(v); },
      removeItem: function (k) { delete map[k]; }
    };
  }

  var storage = (typeof localStorage !== 'undefined') ? localStorage : memoryStorage();

  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  /* یکسان‌سازی داده‌های ذخیره‌شده با ساختار پیش‌فرض (مهاجرت سبک) */
  function normalize(saved) {
    var base = Defaults.defaultState();
    if (!isPlainObject(saved)) return base;

    var out = base;
    out.version = saved.version || 1;
    if (isPlainObject(saved.settings)) {
      out.settings = Object.assign(base.settings, saved.settings);
    }
    if (Array.isArray(saved.templates)) out.templates = saved.templates;
    if (isPlainObject(saved.schedules)) {
      out.schedules = {
        regular: Array.isArray(saved.schedules.regular) ? saved.schedules.regular : base.schedules.regular,
        gym: Array.isArray(saved.schedules.gym) ? saved.schedules.gym : base.schedules.gym,
        friday: Array.isArray(saved.schedules.friday) ? saved.schedules.friday : base.schedules.friday,
        free: Array.isArray(saved.schedules.free) ? saved.schedules.free : base.schedules.free
      };
    }
    if (Array.isArray(saved.weekdayFocus)) out.weekdayFocus = saved.weekdayFocus;
    if (isPlainObject(saved.targets)) out.targets = Object.assign(base.targets, saved.targets);
    if (isPlainObject(saved.days)) out.days = saved.days;
    if (isPlainObject(saved.reviews)) out.reviews = saved.reviews;
    if (isPlainObject(saved.learning)) {
      out.learning = Object.assign(base.learning, saved.learning);
      if (Array.isArray(saved.learning.steps)) out.learning.steps = saved.learning.steps;
      if (Array.isArray(saved.learning.sessions)) out.learning.sessions = saved.learning.sessions;
    }
    if (isPlainObject(saved.driving)) {
      out.driving = Object.assign(base.driving, saved.driving);
      if (Array.isArray(saved.driving.stages)) out.driving.stages = saved.driving.stages;
    }
    if (isPlainObject(saved.roadmap)) {
      out.roadmap = Object.assign(base.roadmap, saved.roadmap);
      if (Array.isArray(saved.roadmap.phases)) out.roadmap.phases = saved.roadmap.phases;
    }
    if (isPlainObject(saved.meta)) out.meta = Object.assign(base.meta, saved.meta);
    return out;
  }

  function load() {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return Defaults.defaultState();
      return normalize(JSON.parse(raw));
    } catch (e) {
      return Defaults.defaultState();
    }
  }

  function save(state) {
    try {
      state.meta = state.meta || {};
      state.meta.updatedAt = new Date().toISOString();
      storage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    var obj = JSON.parse(text);
    if (!isPlainObject(obj)) throw new Error('فایل پشتیبان معتبر نیست.');
    if (!isPlainObject(obj.days) && !isPlainObject(obj.settings)) {
      throw new Error('ساختار فایل پشتیبان با این برنامه سازگار نیست.');
    }
    return normalize(obj);
  }

  function clear() {
    try { storage.removeItem(KEY); } catch (e) { /* بی‌اهمیت */ }
  }

  var api = {
    KEY: KEY,
    normalize: normalize,
    load: load,
    save: save,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clear: clear,
    _storage: storage
  };

  root.Store = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
