/* =========================================================
   하이큐 드림 홈페이지 - script.js
   동작(기능)을 담당하는 파일이에요. 위에서 아래로 번호 순서로 읽으면 돼요.

   1. 기본값과 상수        (기능 켜고 끄기 목록 FEATURES 도 여기 있어요)
   2. 도구 함수            (글자 안전 처리, 날짜 계산 등)
   3. 저장소 Store         (localStorage 저장/불러오기/삭제 담당)
   4. 알림, 팝업, 입력 폼
   5. 테마 적용            (색, 글자 크기, 다크 모드)
   6. 달력
   7. 음악 플레이어
   8. 각 화면 (메인, 캐릭터, 페어, 오너, 방명록)
   9. 설정 창, 백업
   10. 클릭/입력 연결, 시작
========================================================= */
(function () {
  'use strict';

  /* =====================================================
     1. 기본값과 상수
  ===================================================== */
  var STORAGE_KEY = 'haikyuu-dream-data-v1';
  var BACKUP_ID = 'haikyuu-dream';

  // ★ 기능 켜고 끄기 목록. 새 기능을 만들면 여기에 한 줄 추가하고,
  //   코드에서 isOn('키') 로 확인하면 설정 메뉴에 자동으로 스위치가 생겨요.
  var FEATURES = [
    { key: 'alerts', label: '기념일 알림 표시 (오늘~7일 안의 기념일을 메인에 안내)', def: true },
    { key: 'derivedEvents', label: '캐릭터 생일·페어 기념일을 달력에 자동 표시', def: true },
    { key: 'animations', label: '애니메이션 사용', def: true },
    { key: 'favorites', label: '캐릭터 즐겨찾기(★)', def: true },
    { key: 'randomPick', label: '랜덤 캐릭터/페어 뽑기', def: true },
    { key: 'timeline', label: '페어 관계 타임라인', def: true }
  ];

  var MENU = [
    { key: 'characters', label: '캐릭터 소개' },
    { key: 'pairs', label: '페어 소개' },
    { key: 'owner', label: '오너 소개' },
    { key: 'guestbook', label: '방명록' }
  ];

  var PRESETS = [
    { name: '기본 블루', color: '#2f6fed' },
    { name: '카라스노 오렌지', color: '#d95d12' },
    { name: '아오바조사이 청록', color: '#16918b' },
    { name: '네코마 레드', color: '#d0293c' },
    { name: '시라토리자와 퍼플', color: '#6a3fb5' },
    { name: '후쿠로다니 골드', color: '#b98700' },
    { name: '이나리자키 그레이', color: '#5f6773' }
  ];

  var PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><rect width="600" height="450" fill="#e9ecf2"/>' +
    '<g fill="none" stroke="#9aa3b5" stroke-width="6" stroke-linecap="round"><circle cx="300" cy="190" r="52"/>' +
    '<path d="M190 340c20-50 60-70 110-70s90 20 110 70"/></g></svg>');
  var COVER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e3e7ef"/>' +
    '<path d="M42 66V32l24-6v34" fill="none" stroke="#8b95a8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="36" cy="68" r="8" fill="#8b95a8"/><circle cx="60" cy="62" r="8" fill="#8b95a8"/></svg>');

  var CHAR_FIELDS = [
    { name: 'name', label: '이름', type: 'text', required: true, max: 40, half: true },
    { name: 'nameJp', label: '일본어 이름', type: 'text', max: 40, half: true },
    { name: 'age', label: '나이', type: 'text', max: 20, half: true },
    { name: 'gender', label: '성별', type: 'text', max: 20, half: true },
    { name: 'birthday', label: '생일', type: 'text', max: 12, half: true, placeholder: '예: 07-20', hint: '월-일로 적으면 달력에 자동 표시돼요.' },
    { name: 'height', label: '키', type: 'text', max: 20, half: true },
    { name: 'school', label: '소속 학교', type: 'text', max: 40, half: true },
    { name: 'grade', label: '학년 및 반', type: 'text', max: 30, half: true },
    { name: 'position', label: '포지션', type: 'text', max: 30, half: true },
    { name: 'number', label: '등번호', type: 'text', max: 10, half: true },
    { name: 'color', label: '상징색', type: 'color', half: true },
    { name: 'animal', label: '상징 동물', type: 'text', max: 30, half: true },
    { name: 'personality', label: '성격', type: 'textarea' },
    { name: 'appearance', label: '외모', type: 'textarea' },
    { name: 'likes', label: '좋아하는 것', type: 'textarea' },
    { name: 'dislikes', label: '싫어하는 것', type: 'textarea' },
    { name: 'skill', label: '특기', type: 'textarea' },
    { name: 'relations', label: '인간관계', type: 'textarea' },
    { name: 'notes', label: '기타 설정', type: 'textarea' }
  ];
  var CHAR_IMAGE_FIELD = { name: 'image', label: '대표 이미지', type: 'image', maxDim: 700 };

  var PAIR_FIELDS = [
    { name: 'image', label: '대표 이미지', type: 'image', maxDim: 1000 },
    { name: 'name', label: '페어명', type: 'text', max: 60, hint: '비워 두고 캐릭터 A·B를 고르면 “A × B”로 자동 입력돼요.' },
    { name: 'charA', label: '캐릭터 A', type: 'select', half: true },
    { name: 'charB', label: '캐릭터 B', type: 'select', half: true },
    { name: 'tagline', label: '페어 한 줄 소개', type: 'text', max: 100 },
    { name: 'relation', label: '관계성', type: 'textarea' },
    { name: 'firstMeet', label: '첫 만남', type: 'textarea' },
    { name: 'confession', label: '고백 및 연애 시작', type: 'textarea' },
    { name: 'anniversary', label: '기념일 (달력에 연동)', type: 'date', hint: '날짜를 고르면 매년 달력에 표시돼요.' },
    { name: 'dateStyle', label: '좋아하는 데이트', type: 'textarea' },
    { name: 'callAB', label: '캐릭터 A → B 호칭', type: 'text', max: 30, half: true },
    { name: 'callBA', label: '캐릭터 B → A 호칭', type: 'text', max: 30, half: true },
    { name: 'nickAB', label: '캐릭터 A → B 애칭', type: 'text', max: 30, half: true },
    { name: 'nickBA', label: '캐릭터 B → A 애칭', type: 'text', max: 30, half: true },
    { name: 'notes', label: '기타 설정', type: 'textarea' }
  ];

  var OWNER_FIELDS = [
    { name: 'image', label: '프로필 이미지', type: 'image', maxDim: 600 },
    { name: 'nickname', label: '닉네임', type: 'text', max: 30 },
    { name: 'intro', label: '자기소개', type: 'textarea', rows: 4 },
    { name: 'favChars', label: '좋아하는 캐릭터', type: 'textarea', rows: 2 },
    { name: 'favSchools', label: '좋아하는 학교', type: 'textarea', rows: 2 },
    { name: 'favPairs', label: '좋아하는 페어', type: 'textarea', rows: 2 },
    { name: 'taste', label: '취향 및 지뢰', type: 'textarea', rows: 3 },
    { name: 'dreamStyle', label: '드림 성향', type: 'textarea', rows: 3 },
    { name: 'etc', label: '기타 소개', type: 'textarea', rows: 3 }
  ];

  function defaultSettings() {
    var f = {};
    FEATURES.forEach(function (x) { f[x.key] = x.def; });
    return {
      siteName: '나의 하이큐 드림',
      tagline: '하이큐!! 드림 커플을 소개하는 작은 홈페이지예요.',
      pairName: '', pairTagline: '', heroImage: '',
      accent: '#2f6fed', bgColor: '', textColor: '',
      fontScale: 100, radius: 16, mode: 'light',
      show: { calendar: true, music: true, intro: true, characters: true, pairs: true, owner: true, guestbook: true },
      features: f, defaultPage: 'home', volume: 0.7
    };
  }
  function defaultOwner() {
    return { nickname: '', image: '', intro: '', favChars: '', favSchools: '', favPairs: '', taste: '', dreamStyle: '', etc: '', links: [], extras: [] };
  }

  /* =====================================================
     2. 도구 함수
  ===================================================== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isHex(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c); }
  function clamp(n, a, b) { n = Number(n); if (!isFinite(n)) return a; return Math.min(b, Math.max(a, n)); }

  // 사용자가 입력한 글자를 화면에 넣을 때는 반드시 이 함수를 거쳐요. (해킹 방지)
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 이미지/음악 주소 검사: http(s), 사진 데이터, 같은 폴더 안의 상대 경로만 허용
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '';
    return u;
  }
  // 링크 주소 검사: http(s), mailto만 허용
  function safeLink(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
    if (/^[^\s/]+\.[^\s/]+/.test(u)) return 'https://' + u;
    return '';
  }
  function dateStr(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function todayStr() { var t = new Date(); return dateStr(t.getFullYear(), t.getMonth() + 1, t.getDate()); }
  function fmtKDate(iso) {
    var p = String(iso).split('-');
    return p.length === 3 ? p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일' : String(iso);
  }
  function fmtDateTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fmtTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60));
  }
  // "7/20", "07-20", "7월 20일", "2000-07-20" -> "07-20" (잘못되면 null)
  function parseMD(text) {
    var t = String(text || '').trim(), m;
    if (!t) return '';
    m = t.match(/^(?:\d{4}[-./])?(\d{1,2})[-./](\d{1,2})$/) || t.match(/^(\d{1,2})월\s*(\d{1,2})일?$/);
    if (!m) return null;
    var mo = Number(m[1]), d = Number(m[2]);
    var maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
    if (!maxDay || d < 1 || d > maxDay) return null;
    return pad(mo) + '-' + pad(d);
  }
  function lum(hex) {
    var v = [1, 3, 5].map(function (i) {
      var c = parseInt(hex.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function inkFor(bg) { return contrast(bg, '#ffffff') >= contrast(bg, '#111111') ? '#ffffff' : '#111111'; }
  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); };
  }
  function getById(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }
  function removeById(list, id) {
    var i = list.findIndex(function (x) { return x.id === id; });
    if (i >= 0) list.splice(i, 1);
    return i >= 0;
  }

  /* =====================================================
     3. 저장소 Store (localStorage)
        - 저장/불러오기/삭제를 전부 여기서만 처리해요.
  ===================================================== */
  var Store = (function () {
    var data = null;
    var memoryOnly = false;   // localStorage를 못 쓰는 환경이면 true
    var saveTimer = null;
    var startupNotice = '';

    function cleanSettings(raw) {
      var d = defaultSettings();
      raw = isObj(raw) ? raw : {};
      ['siteName', 'tagline', 'pairName', 'pairTagline'].forEach(function (k) {
        if (typeof raw[k] === 'string') d[k] = raw[k].slice(0, 120);
      });
      d.heroImage = safeUrl(raw.heroImage);
      if (isHex(raw.accent)) d.accent = raw.accent;
      d.bgColor = isHex(raw.bgColor) ? raw.bgColor : '';
      d.textColor = isHex(raw.textColor) ? raw.textColor : '';
      d.fontScale = clamp(raw.fontScale == null ? 100 : raw.fontScale, 85, 130);
      d.radius = clamp(raw.radius == null ? 16 : raw.radius, 0, 32);
      d.mode = raw.mode === 'dark' ? 'dark' : 'light';
      d.volume = clamp(raw.volume == null ? 0.7 : raw.volume, 0, 1);
      Object.keys(d.show).forEach(function (k) { if (isObj(raw.show) && typeof raw.show[k] === 'boolean') d.show[k] = raw.show[k]; });
      Object.keys(d.features).forEach(function (k) { if (isObj(raw.features) && typeof raw.features[k] === 'boolean') d.features[k] = raw.features[k]; });
      var pages = ['home', 'characters', 'pairs', 'owner', 'guestbook'];
      d.defaultPage = pages.indexOf(raw.defaultPage) >= 0 ? raw.defaultPage : 'home';
      return d;
    }

    function arr(raw, key, mapper) {
      if (!isObj(raw) || !Array.isArray(raw[key])) return [];
      var out = [];
      raw[key].forEach(function (x) {
        if (!isObj(x) || x.id == null || x.id === '') return;
        var item = mapper(x);
        if (item) out.push(item);
      });
      return out;
    }
    function normalize(raw) {
      var d = {};
      raw = isObj(raw) ? raw : {};
      d.characters = arr(raw, 'characters', function (c) {
        c = Object.assign({}, c, { id: String(c.id) });
        c.name = String(c.name || '이름 없음');
        c.fav = !!c.fav;
        return c;
      });
      d.pairs = arr(raw, 'pairs', function (p) {
        p = Object.assign({}, p, { id: String(p.id) });
        p.name = String(p.name || '이름 없는 페어');
        if (typeof p.anniversary !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.anniversary)) p.anniversary = '';
        p.charA = p.charA ? String(p.charA) : '';
        p.charB = p.charB ? String(p.charB) : '';
        p.timeline = Array.isArray(p.timeline) ? p.timeline.filter(function (t) { return isObj(t) && t.id != null; })
          .map(function (t) { return { id: String(t.id), date: /^\d{4}-\d{2}-\d{2}$/.test(t.date || '') ? t.date : '', title: String(t.title || '(제목 없음)'), memo: String(t.memo || '') }; }) : [];
        return p;
      });
      d.guestbook = arr(raw, 'guestbook', function (g) {
        if (typeof g.hash !== 'string' || typeof g.salt !== 'string') return null;
        return { id: String(g.id), nick: String(g.nick || '익명'), msg: String(g.msg || ''), date: String(g.date || ''), editedAt: g.editedAt ? String(g.editedAt) : '', hash: g.hash, salt: g.salt };
      });
      d.events = arr(raw, 'events', function (e) {
        if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return null;
        return { id: String(e.id), name: String(e.name || '기념일'), date: e.date, memo: String(e.memo || ''), pairId: e.pairId ? String(e.pairId) : '', color: isHex(e.color) ? e.color : '#2f6fed', repeat: e.repeat === 'yearly' ? 'yearly' : '' };
      });
      d.tracks = arr(raw, 'tracks', function (t) {
        return { id: String(t.id), title: String(t.title || '제목 없음'), artist: String(t.artist || ''), cover: safeUrl(t.cover), src: safeUrl(t.src), session: !!t.session };
      });
      d.owner = Object.assign(defaultOwner(), isObj(raw.owner) ? raw.owner : {});
      d.owner.links = (Array.isArray(d.owner.links) ? d.owner.links : []).filter(function (l) { return isObj(l) && l.id != null; })
        .map(function (l) { return { id: String(l.id), label: String(l.label || ''), url: String(l.url || '') }; });
      d.owner.extras = (Array.isArray(d.owner.extras) ? d.owner.extras : []).filter(function (l) { return isObj(l) && l.id != null; })
        .map(function (l) { return { id: String(l.id), title: String(l.title || ''), body: String(l.body || '') }; });
      d.settings = cleanSettings(raw.settings);
      return d;
    }
    function empty() { return normalize({}); }

    function write(d) {
      if (memoryOnly) return true;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
    }
    function load() {
      try {
        localStorage.setItem(STORAGE_KEY + '-test', '1');
        localStorage.removeItem(STORAGE_KEY + '-test');
      } catch (e) {
        memoryOnly = true;
        startupNotice = '이 브라우저에서는 저장 기능을 쓸 수 없어요(시크릿 모드 등). 새로고침하면 내용이 사라져요.';
        data = empty();
        return;
      }
      var s = null;
      try { s = localStorage.getItem(STORAGE_KEY); } catch (e) { s = null; }
      if (!s) { data = empty(); return; }
      try {
        data = normalize(JSON.parse(s));
      } catch (e) {
        // 저장된 내용이 손상된 경우: 원본을 다른 이름으로 남겨 두고 빈 상태로 시작해요.
        try { localStorage.setItem(STORAGE_KEY + '-broken-backup', s); } catch (e2) { /* 무시 */ }
        startupNotice = '저장된 데이터가 손상되어 새로 시작했어요. 손상된 원본은 브라우저에 따로 남겨 두었어요.';
        data = empty();
      }
    }
    // 데이터를 수정하는 유일한 통로. 복사본을 고쳐서 저장에 성공했을 때만 반영해요.
    function update(fn) {
      var draft = clone(data);
      try { fn(draft); } catch (e) { console.error(e); return false; }
      var clean = normalize(draft);
      if (!write(clean)) {
        toast('저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요. (큰 사진은 주소 입력 방식을 써 보세요)');
        return false;
      }
      clearTimeout(saveTimer);
      data = clean;
      return true;
    }
    function replaceAll(raw) { return update(function (d) { var n = normalize(raw); Object.keys(n).forEach(function (k) { d[k] = n[k]; }); }); }
    // 설정값 하나만 즉시 바꾸고, 저장은 잠깐 모아서 해요(색상 조절 중 버벅임 방지)
    function patchSettings(path, value) {
      var p = path.split('.');
      var s = data.settings;
      if (p.length === 2) s[p[0]][p[1]] = value; else s[p[0]] = value;
      data.settings = cleanSettings(s);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 300);
    }
    function flush() {
      clearTimeout(saveTimer);
      if (!write(data)) toast('설정을 저장하지 못했어요. 저장 공간을 확인해 주세요.');
    }
    function wipeAll() {
      clearTimeout(saveTimer);
      if (!memoryOnly) { try { localStorage.removeItem(STORAGE_KEY); } catch (e) { return false; } }
      data = empty();
      return true;
    }
    return {
      load: load, get: function () { return data; }, update: update, replaceAll: replaceAll,
      patchSettings: patchSettings, flush: flush, wipeAll: wipeAll, normalize: normalize, empty: empty,
      cleanSettings: cleanSettings, notice: function () { return startupNotice; },
      size: function () { return JSON.stringify(data).length; }, memoryOnly: function () { return memoryOnly; }
    };
  })();

  function S() { return Store.get().settings; }
  function isOn(featureKey) { return !!S().features[featureKey]; }

  /* =====================================================
     4. 알림(토스트), 팝업(모달), 입력 폼
  ===================================================== */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  var modalStack = [];
  function openModal(html, opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.className = 'overlay';
    var box = document.createElement('div');
    box.className = 'modal ' + (opts.cls || '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', opts.label || '창');
    box.innerHTML = html;
    overlay.appendChild(box);
    $('#modal-root').appendChild(overlay);
    var entry = { overlay: overlay, box: box, prev: document.activeElement, onClose: opts.onClose, closed: false };
    modalStack.push(entry);
    document.body.classList.add('modal-open');
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeModal(entry); });
    setTimeout(function () {
      var f = box.querySelector('[autofocus]') || box.querySelector('input:not([type=hidden]):not([type=file]):not([type=color]):not([type=range]):not([type=checkbox]), textarea, select, button');
      if (f) f.focus();
    }, 0);
    return entry;
  }
  function closeModal(entry) {
    if (!entry || entry.closed) return;
    entry.closed = true;
    var i = modalStack.indexOf(entry);
    if (i >= 0) modalStack.splice(i, 1);
    entry.overlay.remove();
    if (!modalStack.length) document.body.classList.remove('modal-open');
    if (entry.prev && document.contains(entry.prev) && typeof entry.prev.focus === 'function') entry.prev.focus();
    if (entry.onClose) entry.onClose();
  }
  function closeAllModals() { while (modalStack.length) closeModal(modalStack[modalStack.length - 1]); }
  function topModal() { return modalStack[modalStack.length - 1]; }

  // 여러 선택지 중 하나를 고르는 확인 창. 닫으면 null
  function choiceDialog(o) {
    return new Promise(function (resolve) {
      var result = null;
      var msg = esc(o.message || '').replace(/\n/g, '<br>');
      var entry = openModal(
        '<h2 class="modal-title">' + esc(o.title) + '</h2><p class="modal-text">' + msg + '</p>' +
        '<div class="modal-actions">' + o.choices.map(function (c, i) {
          return '<button type="button" class="btn ' + (c.cls || '') + '" data-choice="' + i + '">' + esc(c.label) + '</button>';
        }).join('') + '</div>',
        { label: o.title, cls: 'small', onClose: function () { resolve(result); } }
      );
      entry.box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-choice]');
        if (!b) return;
        result = o.choices[Number(b.dataset.choice)].value;
        closeModal(entry);
      });
    });
  }
  function confirmDialog(o) {
    return choiceDialog({
      title: o.title, message: o.message,
      choices: [{ label: '취소', value: false }, { label: o.okText || '확인', value: true, cls: o.danger ? 'danger' : 'primary' }]
    }).then(function (v) { return v === true; });
  }
  // 글자 한 줄을 입력받는 창 (비밀번호, "삭제" 입력 확인 등). 취소하면 null
  function promptDialog(o) {
    return new Promise(function (resolve) {
      var result = null;
      var entry = openModal(
        '<form><h2 class="modal-title">' + esc(o.title) + '</h2>' +
        (o.message ? '<p class="modal-text">' + esc(o.message).replace(/\n/g, '<br>') + '</p>' : '') +
        '<label class="label" for="prompt-input">' + esc(o.label || '입력') + '</label>' +
        '<input class="input" id="prompt-input" type="' + (o.type || 'text') + '" autocomplete="off" placeholder="' + esc(o.placeholder || '') + '">' +
        '<p class="field-error" role="alert" id="prompt-error"></p>' +
        '<div class="modal-actions"><button type="button" class="btn" data-cancel>취소</button><button type="submit" class="btn ' + (o.danger ? 'danger' : 'primary') + '">' + esc(o.okText || '확인') + '</button></div></form>',
        { label: o.title, cls: 'small', onClose: function () { resolve(result); } }
      );
      var form = $('form', entry.box);
      $('[data-cancel]', entry.box).addEventListener('click', function () { closeModal(entry); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = $('#prompt-input', entry.box).value;
        var err = o.validate ? o.validate(v) : '';
        if (err) { $('#prompt-error', entry.box).textContent = err; return; }
        result = v;
        closeModal(entry);
      });
    });
  }

  // ----- 사진 읽기: 크기를 줄여서(저장 공간 절약) 사진 데이터로 바꿔요 -----
  function readImage(file, maxDim) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('이미지 파일만 선택할 수 있어요.'));
      if (file.size > 15 * 1024 * 1024) return reject(new Error('이미지가 너무 커요. 15MB 이하로 선택해 주세요.'));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        var r = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * r)); h = Math.max(1, Math.round(h * r));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL('image/jpeg', 0.82)); } catch (e) { reject(new Error('이미지를 변환하지 못했어요.')); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없어요.')); };
      img.src = url;
    });
  }

  function imageFieldHTML(name, label, value) {
    var isData = /^data:/.test(value || '');
    return '<div class="field imgfield" data-img="' + esc(name) + '"><span class="label">' + esc(label) + '</span>' +
      '<div class="img-preview" data-preview></div>' +
      '<input type="text" class="input" inputmode="url" data-img-url placeholder="이미지 주소 (https://… 또는 assets/images/파일.jpg)" aria-label="' + esc(label) + ' 주소" value="' + (isData ? '' : esc(value || '')) + '">' +
      '<div class="row wrap"><button type="button" class="btn small" data-img-pick>기기에서 사진 선택</button>' +
      '<button type="button" class="btn small ghost" data-img-clear>사진 삭제</button>' +
      '<input type="file" accept="image/*" data-img-file hidden></div>' +
      '<p class="hint" data-img-hint></p></div>';
  }
  function setupImageField(wrap, initial, onChange, maxDim) {
    var value = initial || '';
    var prev = $('[data-preview]', wrap), url = $('[data-img-url]', wrap), file = $('[data-img-file]', wrap), hint = $('[data-img-hint]', wrap);
    function paint(msg) {
      prev.innerHTML = value ? '<img src="' + esc(value) + '" alt="미리보기">' : '<span>이미지 없음</span>';
      hint.textContent = msg || (/^data:/.test(value) ? '기기에서 선택한 사진을 사용 중이에요. (크기는 자동으로 줄여서 저장돼요)' : '');
    }
    function set(v) { value = v; paint(); onChange(v); }
    url.addEventListener('input', function () {
      var u = url.value.trim();
      if (!u) { set(''); return; }
      var s = safeUrl(u);
      if (!s) { paint('사용할 수 없는 주소예요. https:// 로 시작하거나 assets/images/ 안의 파일 경로를 적어 주세요.'); return; }
      value = s; paint(); onChange(s);
    });
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-img-pick]')) file.click();
      if (e.target.closest('[data-img-clear]')) { url.value = ''; set(''); }
    });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      readImage(f, maxDim || 800).then(function (d) { url.value = ''; set(d); }).catch(function (err) { toast(err.message); });
      file.value = '';
    });
    paint();
  }

  function fieldHTML(f, val) {
    var id = 'f-' + f.name;
    var v = val == null ? '' : val;
    var cls = 'field' + (f.half ? ' half' : '');
    var hint = f.hint ? '<p class="hint">' + esc(f.hint) + '</p>' : '';
    var err = '<p class="field-error" id="err-' + f.name + '" role="alert"></p>';
    var label = '<label class="label" for="' + id + '">' + esc(f.label) + (f.required ? ' <em class="req" aria-hidden="true">*</em>' : '') + '</label>';
    var ph = esc(f.placeholder || '');
    switch (f.type) {
      case 'image': return imageFieldHTML(f.name, f.label, v);
      case 'textarea':
        return '<div class="' + cls + '">' + label + '<textarea class="input" id="' + id + '" rows="' + (f.rows || 3) + '" maxlength="' + (f.max || 2000) + '" placeholder="' + ph + '">' + esc(v) + '</textarea>' + hint + err + '</div>';
      case 'select':
        return '<div class="' + cls + '">' + label + '<select class="input" id="' + id + '">' + (f.options || []).map(function (o) {
          return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(v) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select>' + hint + err + '</div>';
      case 'checkbox':
        return '<div class="' + cls + '"><label class="check"><input type="checkbox" id="' + id + '"' + (val ? ' checked' : '') + '><span>' + esc(f.label) + '</span></label>' + hint + '</div>';
      case 'color':
        return '<div class="' + cls + '" data-color="' + esc(f.name) + '"><span class="label">' + esc(f.label) + '</span><div class="row wrap">' +
          '<input type="color" class="color-input" aria-label="' + esc(f.label) + '" value="' + (isHex(v) ? v : (f.defaultColor || '#2f6fed')) + '">' +
          '<span class="hint" data-color-text></span>' +
          (f.noClear ? '' : '<button type="button" class="btn small ghost" data-color-clear>선택 안 함</button>') + '</div>' + hint + '</div>';
      case 'audio':
        return '<div class="field audio-src" data-audio="' + esc(f.name) + '"><span class="label">음악 파일</span>' +
          '<label class="check"><input type="radio" name="asrc" value="path"' + (val.mode === 'path' ? ' checked' : '') + '><span>폴더 경로 또는 주소 (계속 저장됨)</span></label>' +
          '<input type="text" class="input" data-audio-path placeholder="예: assets/music/song.mp3" aria-label="음악 파일 경로" value="' + esc(val.src || '') + '">' +
          '<label class="check"><input type="radio" name="asrc" value="file"' + (val.mode === 'file' ? ' checked' : '') + '><span>내 기기의 파일 선택 (이번 접속에서만 재생)</span></label>' +
          '<input type="file" class="input" accept="audio/*" data-audio-file aria-label="음악 파일 선택">' +
          '<p class="hint">배포 폴더(assets/music)에 넣은 파일은 경로로 등록해야 새로고침 후에도 남아요. 기기 파일 선택은 보안상 새로고침하면 다시 골라야 해요. 저작권이 있는 음원을 무단으로 올리지 마세요.</p>' + err + '</div>';
      default:
        return '<div class="' + cls + '">' + label + '<input class="input" id="' + id + '" type="' + (f.type || 'text') + '" maxlength="' + (f.max || 200) + '" placeholder="' + ph + '" value="' + esc(v) + '">' + hint + err + '</div>';
    }
  }

  // 입력 폼 창. o = { title, fields, values, submitText, validate(vals), onSubmit(vals) }
  function openForm(o) {
    var state = {};
    var values = o.values || {};
    var html = o.fields.map(function (f) {
      if (f.type === 'audio') { state[f.name] = { mode: values[f.name].mode, src: values[f.name].src || '', file: null }; return fieldHTML(f, values[f.name]); }
      if (f.type === 'color') state[f.name] = isHex(values[f.name]) ? values[f.name] : (f.defaultColor ? f.defaultColor : '');
      if (f.type === 'image') state[f.name] = values[f.name] || '';
      return fieldHTML(f, values[f.name]);
    }).join('');
    var entry = openModal(
      '<form class="form" novalidate><h2 class="modal-title">' + esc(o.title) + '</h2>' +
      (o.intro ? '<p class="modal-text">' + esc(o.intro) + '</p>' : '') +
      '<div class="form-body">' + html + '</div><p class="form-error" role="alert" id="form-error"></p>' +
      '<div class="modal-actions"><button type="button" class="btn" data-cancel>취소</button><button type="submit" class="btn primary">' + esc(o.submitText || '저장') + '</button></div></form>',
      { label: o.title, cls: o.cls || '' }
    );
    var box = entry.box;
    var form = $('form', box);

    o.fields.forEach(function (f) {
      if (f.type === 'image') {
        setupImageField($('[data-img="' + f.name + '"]', box), state[f.name], function (v) { state[f.name] = v; }, f.maxDim);
      }
      if (f.type === 'color') {
        var wrap = $('[data-color="' + f.name + '"]', box);
        var inp = $('input[type=color]', wrap), txt = $('[data-color-text]', wrap);
        var paint = function () { txt.textContent = state[f.name] ? state[f.name] : '(선택 안 함)'; };
        inp.addEventListener('input', function () { state[f.name] = inp.value; paint(); });
        var clr = $('[data-color-clear]', wrap);
        if (clr) clr.addEventListener('click', function () { state[f.name] = ''; paint(); });
        paint();
      }
      if (f.type === 'audio') {
        var aw = $('[data-audio="' + f.name + '"]', box);
        var st = state[f.name];
        $$('input[name=asrc]', aw).forEach(function (r) { r.addEventListener('change', function () { if (r.checked) st.mode = r.value; }); });
        $('[data-audio-path]', aw).addEventListener('input', function (e) { st.src = e.target.value.trim(); st.mode = 'path'; $('input[name=asrc][value=path]', aw).checked = true; });
        $('[data-audio-file]', aw).addEventListener('change', function (e) { st.file = e.target.files && e.target.files[0] || null; if (st.file) { st.mode = 'file'; $('input[name=asrc][value=file]', aw).checked = true; } });
      }
    });

    $('[data-cancel]', box).addEventListener('click', function () { closeModal(entry); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var vals = {}, errs = {};
      o.fields.forEach(function (f) {
        var el = $('#f-' + f.name, box);
        if (f.type === 'image' || f.type === 'color' || f.type === 'audio') vals[f.name] = f.type === 'audio' ? state[f.name] : state[f.name];
        else if (f.type === 'checkbox') vals[f.name] = !!(el && el.checked);
        else vals[f.name] = el ? el.value.trim() : '';
        if (f.required && !vals[f.name]) errs[f.name] = f.label + '을(를) 입력해 주세요.';
      });
      if (o.validate) Object.assign(errs, o.validate(vals) || {});
      $$('.field-error', box).forEach(function (p) { p.textContent = ''; });
      $$('[aria-invalid]', box).forEach(function (p) { p.removeAttribute('aria-invalid'); });
      var keys = Object.keys(errs);
      if (keys.length) {
        keys.forEach(function (k) {
          var p = $('#err-' + k, box); if (p) p.textContent = errs[k];
          var el = $('#f-' + k, box); if (el) el.setAttribute('aria-invalid', 'true');
        });
        $('#form-error', box).textContent = '입력 내용을 확인해 주세요.';
        var first = $('#f-' + keys[0], box) || $('[data-audio-path]', box);
        if (first) first.focus();
        return;
      }
      $('#form-error', box).textContent = '';
      var res = o.onSubmit(vals);
      Promise.resolve(res).then(function (ok) { if (ok !== false) closeModal(entry); });
    });
    return entry;
  }

  /* =====================================================
     5. 테마 적용 (설정값 -> 화면)
  ===================================================== */
  function applyTheme() {
    var s = S();
    var r = document.documentElement;
    r.setAttribute('data-theme', s.mode);
    r.style.setProperty('--accent', s.accent);
    r.style.setProperty('--accent-ink', inkFor(s.accent));
    r.style.setProperty('--radius', s.radius + 'px');
    r.style.fontSize = s.fontScale + '%';
    if (s.bgColor) r.style.setProperty('--bg', s.bgColor); else r.style.removeProperty('--bg');
    if (s.textColor) r.style.setProperty('--text', s.textColor); else r.style.removeProperty('--text');
    document.body.classList.toggle('no-anim', !isOn('animations'));
  }
  function renderChrome() {
    var s = S();
    $('#brand-name').textContent = s.siteName || '하이큐 드림';
    document.title = s.siteName || '하이큐 드림';
    $('#btn-calendar').hidden = !s.show.calendar;
  }

  /* =====================================================
     6. 달력
  ===================================================== */
  var cal = { y: 0, m: 0, sel: '' };
  function calInit() { var t = new Date(); cal.y = t.getFullYear(); cal.m = t.getMonth(); cal.sel = todayStr(); }

  function derivedEventsOn(ds) {
    var out = [];
    if (!isOn('derivedEvents')) return out;
    var md = ds.slice(5), d = Store.get();
    d.characters.forEach(function (c) {
      var b = parseMD(c.birthday);
      if (b && b === md) out.push({ id: 'c:' + c.id, kind: 'birthday', refId: c.id, name: c.name + ' 생일', memo: '', color: isHex(c.color) ? c.color : S().accent, pairId: '' });
    });
    d.pairs.forEach(function (p) {
      if (p.anniversary && p.anniversary.slice(5) === md && Number(p.anniversary.slice(0, 4)) <= Number(ds.slice(0, 4))) {
        out.push({ id: 'p:' + p.id, kind: 'anniversary', refId: p.id, name: p.name + ' 기념일', memo: '', color: S().accent, pairId: p.id });
      }
    });
    return out;
  }
  function customEventsOn(ds) {
    return Store.get().events.filter(function (e) {
      if (e.repeat === 'yearly') return e.date.slice(5) === ds.slice(5) && Number(e.date.slice(0, 4)) <= Number(ds.slice(0, 4));
      return e.date === ds;
    }).map(function (e) { return Object.assign({ kind: 'custom' }, e); });
  }
  // 같은 날 같은 이름의 기념일이 직접 등록돼 있으면 자동 표시는 숨겨서 중복을 막아요.
  function eventsOn(ds) {
    var custom = customEventsOn(ds);
    var derived = derivedEventsOn(ds).filter(function (dv) {
      return !custom.some(function (c) { return c.name.trim().toLowerCase() === dv.name.trim().toLowerCase(); });
    });
    return custom.concat(derived);
  }
  function upcoming(days) {
    var out = [], t = new Date();
    for (var i = 0; i <= days; i++) {
      var d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
      var ds = dateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
      eventsOn(ds).forEach(function (e) { out.push({ left: i, ds: ds, name: e.name }); });
    }
    return out;
  }

  function calendarInner() {
    var first = new Date(cal.y, cal.m, 1).getDay();
    var days = new Date(cal.y, cal.m + 1, 0).getDate();
    var today = todayStr();
    var cells = ['일', '월', '화', '수', '목', '금', '토'].map(function (w) { return '<span class="cal-dow" aria-hidden="true">' + w + '</span>'; }).join('');
    for (var i = 0; i < first; i++) cells += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var ds = dateStr(cal.y, cal.m + 1, d);
      var evs = eventsOn(ds);
      var dots = evs.slice(0, 3).map(function (e) { return '<i style="background:' + (isHex(e.color) ? e.color : '#2f6fed') + '"></i>'; }).join('');
      cells += '<button type="button" class="cal-day' + (ds === today ? ' today' : '') + (ds === cal.sel ? ' sel' : '') + '" data-action="cal-select" data-date="' + ds + '" aria-pressed="' + (ds === cal.sel) + '" aria-label="' +
        (cal.m + 1) + '월 ' + d + '일' + (ds === today ? ', 오늘' : '') + (evs.length ? ', 기념일 ' + evs.length + '개' : '') + '"><span>' + d + '</span><span class="dots">' + dots + '</span></button>';
    }
    return '<div class="cal-head"><button type="button" class="btn small icon" data-action="cal-prev" aria-label="이전 달">‹</button>' +
      '<strong aria-live="polite">' + cal.y + '년 ' + (cal.m + 1) + '월</strong>' +
      '<span class="row"><button type="button" class="btn small" data-action="cal-today">오늘</button>' +
      '<button type="button" class="btn small icon" data-action="cal-next" aria-label="다음 달">›</button></span></div>' +
      '<div class="cal-grid" role="group" aria-label="날짜 선택">' + cells + '</div>' + calDetailHTML();
  }
  function calDetailHTML() {
    var evs = eventsOn(cal.sel);
    var list = evs.length ? '<ul class="ev-list">' + evs.map(function (e) {
      var pair = e.pairId ? getById(Store.get().pairs, e.pairId) : null;
      var acts;
      if (e.kind === 'custom') acts = '<button type="button" class="btn small" data-action="ev-edit" data-id="' + e.id + '">수정</button><button type="button" class="btn small danger" data-action="ev-del" data-id="' + e.id + '">삭제</button>';
      else acts = '<button type="button" class="btn small" data-action="ev-open" data-kind="' + e.kind + '" data-id="' + e.refId + '">' + (e.kind === 'birthday' ? '캐릭터 보기' : '페어 보기') + '</button>';
      return '<li class="ev-item"><span class="color-dot" style="--chip:' + (isHex(e.color) ? e.color : '#2f6fed') + '" aria-hidden="true"></span><div class="ev-body"><strong>' + esc(e.name) + '</strong>' +
        (e.kind !== 'custom' ? '<small>' + (e.kind === 'birthday' ? '캐릭터 프로필의 생일 (자동 표시)' : '페어 소개의 기념일 (자동 표시)') + '</small>' : '') +
        (e.repeat ? '<small>매년 반복</small>' : '') + (pair ? '<small>페어: ' + esc(pair.name) + '</small>' : '') +
        (e.memo ? '<small>' + esc(e.memo) + '</small>' : '') + '<div class="ev-actions">' + acts + '</div></div></li>';
    }).join('') + '</ul>' : '<p class="muted">이 날짜에는 기념일이 없어요.</p>';
    return '<div class="cal-detail"><h3>' + esc(fmtKDate(cal.sel)) + '</h3>' + list +
      '<div class="row" style="margin-top:10px"><button type="button" class="btn small primary" data-action="ev-add">+ 기념일 추가</button></div></div>';
  }
  function renderCalendar(focusSel) {
    var c = $('#calendar');
    if (!c) return;
    c.innerHTML = calendarInner();
    if (focusSel) { var f = $(focusSel, c); if (f) f.focus(); }
  }

  function eventFormFields() {
    var pairs = Store.get().pairs;
    return [
      { name: 'name', label: '기념일 이름', type: 'text', required: true, max: 40 },
      { name: 'date', label: '날짜', type: 'date', required: true, half: true },
      { name: 'color', label: '기념일 색상', type: 'color', half: true, noClear: true, defaultColor: S().accent },
      { name: 'pairId', label: '연결할 페어 (선택)', type: 'select', options: [{ value: '', label: '연결 안 함' }].concat(pairs.map(function (p) { return { value: p.id, label: p.name }; })) },
      { name: 'memo', label: '간단한 메모', type: 'textarea', rows: 2, max: 200 },
      { name: 'repeat', label: '매년 반복 (생일·기념일처럼 해마다 표시)', type: 'checkbox' }
    ];
  }
  function eventValidate(editId) {
    return function (v) {
      var errs = {};
      if (v.date && !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) errs.date = '날짜를 올바르게 입력해 주세요.';
      if (v.name && v.date && !errs.date) {
        var same = Store.get().events.some(function (e) { return e.id !== editId && e.date === v.date && e.name.trim().toLowerCase() === v.name.trim().toLowerCase(); });
        if (same) errs.name = '같은 날짜에 같은 이름의 기념일이 이미 있어요.';
        else if (derivedEventsOn(v.date).some(function (d) { return d.name.trim().toLowerCase() === v.name.trim().toLowerCase(); })) errs.name = '캐릭터 생일/페어 기념일로 이미 자동 표시되고 있어요.';
      }
      return errs;
    };
  }

  /* =====================================================
     7. 음악 플레이어
  ===================================================== */
  var audio = null;
  var curId = null, loadedId = null;
  var sessionUrls = {};   // 기기에서 고른 파일의 임시 주소(새로고침하면 사라져요)

  function tracks() { return Store.get().tracks; }
  function trackSrc(t) { return t.session ? (sessionUrls[t.id] || '') : safeUrl(t.src); }
  function selectedTrack() {
    var t = tracks();
    return getById(t, curId) || t[0] || null;
  }
  function stopAudio() {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    try { audio.load(); } catch (e) { /* 무시 */ }
    loadedId = null; curId = null;
  }
  function loadTrack(t) {
    var src = trackSrc(t);
    if (!src) {
      toast(t.session ? '이 곡은 새로고침으로 파일 연결이 끊겼어요. 재생 목록에서 “수정”으로 파일을 다시 선택해 주세요.' : '재생할 수 없는 곡이에요. 파일 경로를 확인해 주세요.');
      return false;
    }
    if (loadedId !== t.id) { audio.src = src; loadedId = t.id; }
    curId = t.id;
    return true;
  }
  function playTrack(t) {
    if (!t) return;
    if (!loadTrack(t)) { renderPlayer(); return; }
    var p = audio.play();
    if (p && p.catch) p.catch(function (err) {
      if (err && err.name === 'NotAllowedError') toast('브라우저가 자동 재생을 막았어요. 재생 버튼을 직접 눌러 주세요.');
    });
    renderPlayer();
  }
  function toggleTrack() {
    var t = selectedTrack();
    if (!t) return;
    if (curId === t.id && loadedId === t.id && !audio.paused) { audio.pause(); return; }
    playTrack(t);
  }
  function stepTrack(dir) {
    var list = tracks();
    if (!list.length) return;
    var cur = selectedTrack();
    var i = list.indexOf(cur);
    var next = list[(i + dir + list.length) % list.length];
    var wasPlaying = audio && !audio.paused;
    curId = next.id;
    if (wasPlaying) playTrack(next); else { loadedId = null; audio.pause(); renderPlayer(); }
  }
  function playerHTML() {
    var list = tracks(), t = selectedTrack();
    if (!list.length) {
      return '<h2 class="section-title">음악 플레이어</h2><p class="muted">등록된 곡이 없어요. 곡을 추가하면 여기서 재생할 수 있어요.</p>' +
        '<div class="row" style="margin-top:12px"><button type="button" class="btn primary" data-action="track-add">+ 음악 추가</button></div>';
    }
    var cover = safeUrl(t.cover) || COVER_IMG;
    return '<div class="player-main"><div class="cover"><img src="' + esc(cover) + '" alt="' + esc(t.title) + ' 앨범 이미지"></div>' +
      '<div class="track-info"><div class="track-title">' + esc(t.title) + '</div><div class="track-artist">' + esc(t.artist || '아티스트 미입력') + '</div></div></div>' +
      '<div class="seek-row"><span id="cur-time">0:00</span><input type="range" id="seek" min="0" max="0" step="1" value="0" data-input="seek" aria-label="재생 위치"><span id="dur-time">0:00</span></div>' +
      '<div class="controls"><button type="button" class="btn icon" data-action="track-prev" aria-label="이전 곡">⏮</button>' +
      '<button type="button" class="btn primary icon" id="play-btn" data-action="track-toggle" aria-label="재생">▶</button>' +
      '<button type="button" class="btn icon" data-action="track-next" aria-label="다음 곡">⏭</button>' +
      '<button type="button" class="btn small" data-action="playlist-open">재생 목록</button>' +
      '<label class="volume">음량 <input type="range" min="0" max="1" step="0.05" value="' + S().volume + '" data-input="volume" aria-label="음량"></label></div>';
  }
  function renderPlayer() {
    var p = $('#player');
    if (!p) return;
    p.innerHTML = playerHTML();
    updatePlayerUI();
  }
  function updatePlayerUI() {
    var btn = $('#play-btn');
    if (!btn || !audio) return;
    var playing = !audio.paused && loadedId === (selectedTrack() || {}).id;
    btn.textContent = playing ? '⏸' : '▶';
    btn.setAttribute('aria-label', playing ? '일시정지' : '재생');
    var dur = isFinite(audio.duration) ? audio.duration : 0;
    var seek = $('#seek');
    if (seek && loadedId === (selectedTrack() || {}).id) { seek.max = String(Math.floor(dur)); seek.value = String(Math.floor(audio.currentTime)); }
    var ct = $('#cur-time'), dt = $('#dur-time');
    if (ct) ct.textContent = loadedId === (selectedTrack() || {}).id ? fmtTime(audio.currentTime) : '0:00';
    if (dt) dt.textContent = loadedId === (selectedTrack() || {}).id ? fmtTime(dur) : '0:00';
  }
  function initAudio() {
    audio = $('#audio');
    audio.volume = S().volume;
    ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause'].forEach(function (ev) { audio.addEventListener(ev, updatePlayerUI); });
    audio.addEventListener('ended', function () { if (tracks().length > 1) stepTrack(1); else { updatePlayerUI(); } });
    audio.addEventListener('error', function () {
      if (audio.getAttribute('src')) toast('음악 파일을 불러오지 못했어요. 파일 경로와 형식(mp3, m4a, ogg, wav)을 확인해 주세요.');
      updatePlayerUI();
    });
  }

  function playlistHTML() {
    var list = tracks();
    var body = list.length ? '<ul class="playlist">' + list.map(function (t, i) {
      var broken = t.session && !sessionUrls[t.id];
      return '<li class="pl-item' + (t.id === curId ? ' now' : '') + '"><div class="cover"><img src="' + esc(safeUrl(t.cover) || COVER_IMG) + '" alt=""></div>' +
        '<div class="pl-text"><strong>' + esc(t.title) + '</strong><small>' + esc(t.artist || '아티스트 미입력') + (broken ? ' · 파일 다시 선택 필요' : '') + '</small></div>' +
        '<div class="pl-actions"><button type="button" class="btn small" data-action="track-play" data-id="' + t.id + '" aria-label="' + esc(t.title) + ' 재생">▶</button>' +
        '<button type="button" class="btn small" data-action="track-up" data-id="' + t.id + '" aria-label="위로 이동"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="btn small" data-action="track-down" data-id="' + t.id + '" aria-label="아래로 이동"' + (i === list.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="btn small" data-action="track-edit" data-id="' + t.id + '">수정</button>' +
        '<button type="button" class="btn small danger" data-action="track-del" data-id="' + t.id + '">삭제</button></div></li>';
    }).join('') + '</ul>' : '<p class="empty">등록된 곡이 없어요.</p>';
    return body;
  }
  function openPlaylist() {
    openModal('<div class="modal-head"><h2 class="modal-title">재생 목록</h2></div><div id="playlist-body">' + playlistHTML() + '</div>' +
      '<div class="modal-actions"><button type="button" class="btn primary" data-action="track-add">+ 음악 추가</button><button type="button" class="btn" data-action="modal-close">닫기</button></div>',
      { label: '재생 목록', cls: 'wide' });
  }
  function refreshMusicUI() {
    var pb = $('#playlist-body');
    if (pb) pb.innerHTML = playlistHTML();
    renderPlayer();
  }

  function trackFields() {
    return [
      { name: 'title', label: '곡 제목', type: 'text', required: true, max: 60, half: true },
      { name: 'artist', label: '아티스트명', type: 'text', max: 60, half: true },
      { name: 'audio', label: '음악 파일', type: 'audio' },
      { name: 'cover', label: '앨범 이미지', type: 'image', maxDim: 400 }
    ];
  }
  function trackSubmit(existing) {
    return function (v) {
      var a = v.audio, src = '', session = false, file = null;
      if (a.mode === 'file') {
        if (a.file) {
          var okType = /^audio\//.test(a.file.type) || /\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)$/i.test(a.file.name);
          if (!okType) { toast('음악 파일(mp3, m4a, ogg, wav 등)을 선택해 주세요.'); return false; }
          file = a.file; session = true;
        } else if (existing && existing.session) { session = true; }
        else { toast('음악 파일을 선택해 주세요.'); return false; }
      } else {
        src = safeUrl(a.src);
        if (!src) { toast('음악 파일 경로를 입력해 주세요. 예: assets/music/song.mp3'); return false; }
      }
      var id = existing ? existing.id : uid();
      var ok = Store.update(function (d) {
        var rec = existing ? getById(d.tracks, id) : null;
        if (existing && !rec) throw new Error('없는 곡');
        if (!rec) { rec = { id: id }; d.tracks.push(rec); }
        rec.title = v.title; rec.artist = v.artist; rec.cover = v.cover; rec.session = session; rec.src = session ? '' : src;
      });
      if (!ok) return false;
      if (file) {
        if (sessionUrls[id]) URL.revokeObjectURL(sessionUrls[id]);
        sessionUrls[id] = URL.createObjectURL(file);
        if (loadedId === id) { audio.src = sessionUrls[id]; }
      }
      if (existing && loadedId === id && !session && audio) { audio.src = src; }
      toast(existing ? '곡 정보를 수정했어요.' : '음악을 추가했어요.');
      refreshMusicUI();
      return true;
    };
  }

  /* =====================================================
     8. 화면 그리기 (라우터 + 각 페이지)
  ===================================================== */
  var ui = { charQ: '', charFav: false, pairQ: '', gbQ: '' };
  var pendingScroll = '';

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var p = h.split('/');
    return { page: p[0] || '', id: p[1] ? decodeURIComponent(p[1]) : '' };
  }
  function route() {
    var r = parseHash();
    var page = r.page;
    var s = S();
    if (!page) {
      page = s.defaultPage;
      if (page !== 'home' && !s.show[page]) page = 'home';
      if (page !== 'home') { location.replace('#/' + page); return; }
    }
    if (['home', 'characters', 'pairs', 'owner', 'guestbook'].indexOf(page) < 0) page = 'home';
    if (page !== 'home' && !s.show[page]) { toast('이 메뉴는 설정에서 숨겨져 있어요.'); location.replace('#/home'); return; }
    renderView(page, r.id, false);
  }
  function currentPage() { var r = parseHash(); return r.page || 'home'; }
  function renderView(page, id, keepScroll) {
    var v = $('#view');
    var html, title = S().siteName || '하이큐 드림';
    switch (page) {
      case 'characters': html = charactersView(); title = '캐릭터 소개 · ' + title; break;
      case 'pairs': html = id ? pairDetailView(id) : pairsView(); title = '페어 소개 · ' + title; break;
      case 'owner': html = ownerView(); title = '오너 소개 · ' + title; break;
      case 'guestbook': html = guestbookView(); title = '방명록 · ' + title; break;
      default: html = homeView();
    }
    v.innerHTML = html;
    document.title = title;
    if (!keepScroll) {
      window.scrollTo(0, 0);
      v.focus({ preventScroll: true });
    }
    if (pendingScroll === 'calendar') {
      pendingScroll = '';
      var c = $('#calendar');
      if (c) { c.scrollIntoView({ behavior: 'auto', block: 'center' }); var b = $('.cal-day.sel', c) || $('.cal-day', c); if (b) b.focus({ preventScroll: true }); }
    }
    if (page === 'home') updatePlayerUI();
  }
  function refresh() { var r = parseHash(); var p = r.page || 'home'; if (p !== 'home' && !S().show[p]) { route(); return; } renderView(p, r.id, true); }

  function pageHead(title, desc, actions) {
    return '<div class="page-head"><div><a class="back-link" href="#/home">← 홈으로</a><h1>' + esc(title) + '</h1>' +
      (desc ? '<p class="muted">' + esc(desc) + '</p>' : '') + '</div><div class="page-actions">' + (actions || '') + '</div></div>';
  }

  /* ---------- 메인 ---------- */
  function homeView() {
    var s = S(), d = Store.get();
    var img = safeUrl(s.heroImage);
    var hero = '<section class="card hero" aria-label="대표 페어">' +
      (s.show.intro && s.tagline ? '<p class="hero-eyebrow">' + esc(s.tagline) + '</p>' : '') +
      (img
        ? '<button type="button" class="hero-img" data-action="zoom-hero" aria-label="대표 사진 크게 보기"><img src="' + esc(img) + '" alt="' + esc((s.pairName || '대표 페어') + ' 대표 사진') + '"></button>'
        : '<button type="button" class="hero-img hero-empty" data-action="open-settings" aria-label="대표 사진 등록하기"><img src="' + PLACEHOLDER_IMG + '" alt="등록된 대표 사진이 없어요"><span>대표 사진 등록하기</span></button>') +
      '<h1 class="pair-name">' + esc(s.pairName || '페어명을 설정해 주세요') + '</h1>' +
      (s.pairTagline ? '<p class="pair-tagline">' + esc(s.pairTagline) + '</p>' : '') + '</section>';

    var player = s.show.music ? '<section class="card player" id="player" aria-label="음악 플레이어">' + playerHTML() + '</section>' : '';
    var calendar = s.show.calendar ? '<section class="card calendar" id="calendar" aria-label="달력">' + calendarInner() + '</section>' : '';
    var counts = { characters: d.characters.length, pairs: d.pairs.length, owner: 0, guestbook: d.guestbook.length };
    var items = MENU.filter(function (m) { return s.show[m.key]; });
    var menu = items.length ? '<nav class="card menu" aria-label="메뉴">' + items.map(function (m, i) {
      return '<a class="menu-item" href="#/' + m.key + '"><span class="menu-num" aria-hidden="true">' + (MENU.indexOf(m) + 1) + '</span><span>' + m.label + '</span>' +
        (counts[m.key] ? '<span class="menu-count">' + counts[m.key] + '</span>' : '') + '</a>';
    }).join('') + '</nav>' : '';

    var alertBox = '';
    if (isOn('alerts')) {
      var up = upcoming(7);
      if (up.length) {
        alertBox = '<aside class="notice alert-box" role="status"><strong>🎉 다가오는 기념일</strong><ul>' + up.slice(0, 5).map(function (u) {
          return '<li>' + (u.left === 0 ? '오늘' : 'D-' + u.left) + ' · ' + esc(u.name) + ' (' + esc(fmtKDate(u.ds)) + ')</li>';
        }).join('') + '</ul></aside>';
      }
    }
    return alertBox + '<div class="home-grid"><div class="col">' + hero + player + '</div><div class="col">' + calendar + menu + '</div></div>';
  }

  /* ---------- 캐릭터 ---------- */
  function charFiltered() {
    var q = ui.charQ.trim().toLowerCase();
    var list = Store.get().characters.filter(function (c) {
      if (ui.charFav && !c.fav) return false;
      if (!q) return true;
      return CHAR_FIELDS.some(function (f) { return f.type !== 'color' && String(c[f.name] || '').toLowerCase().indexOf(q) >= 0; });
    });
    if (isOn('favorites')) list = list.slice().sort(function (a, b) { return (b.fav ? 1 : 0) - (a.fav ? 1 : 0); });
    return list;
  }
  function charCard(c) {
    var col = isHex(c.color) ? c.color : '';
    var img = safeUrl(c.image);
    var sub = [c.school, c.position].filter(Boolean).join(' · ');
    return '<article class="card char-card"' + (col ? ' style="--chip:' + col + '"' : '') + '><button type="button" class="card-main" data-action="char-detail" data-id="' + c.id + '" aria-label="' + esc(c.name) + ' 프로필 보기">' +
      '<span class="avatar">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<span class="avatar-initial" aria-hidden="true">' + esc(c.name.slice(0, 1)) + '</span>') + '</span>' +
      '<span class="card-text"><strong>' + esc(c.name) + '</strong>' + (c.nameJp ? '<small>' + esc(c.nameJp) + '</small>' : '') + (sub ? '<small class="muted">' + esc(sub) + '</small>' : '') + '</span></button>' +
      (isOn('favorites') ? '<button type="button" class="fav' + (c.fav ? ' on' : '') + '" data-action="char-fav" data-id="' + c.id + '" aria-pressed="' + !!c.fav + '" aria-label="' + esc(c.name) + ' 즐겨찾기">★</button>' : '') + '</article>';
  }
  function charListHTML() {
    var all = Store.get().characters, list = charFiltered();
    if (!all.length) return '<div class="empty" style="grid-column:1/-1"><p>아직 등록된 캐릭터가 없어요.</p><button type="button" class="btn primary" data-action="char-add">+ 첫 캐릭터 추가하기</button></div>';
    if (!list.length) return '<div class="empty" style="grid-column:1/-1"><p>조건에 맞는 캐릭터가 없어요.</p></div>';
    return list.map(charCard).join('');
  }
  function charactersView() {
    return pageHead('캐릭터 소개', '캐릭터 프로필을 카드로 모아 보고, 추가·수정·삭제할 수 있어요.', '<button type="button" class="btn primary" data-action="char-add">+ 캐릭터 추가</button>') +
      '<div class="toolbar"><label class="search"><span class="sr-only">캐릭터 검색</span><input type="search" class="input" data-input="char-search" placeholder="이름·학교·포지션 등으로 검색" value="' + esc(ui.charQ) + '"></label>' +
      (isOn('favorites') ? '<label class="check"><input type="checkbox" data-input="char-fav"' + (ui.charFav ? ' checked' : '') + '><span>즐겨찾기만</span></label>' : '') +
      (isOn('randomPick') ? '<button type="button" class="btn" data-action="char-random">🎲 랜덤 뽑기</button>' : '') + '</div>' +
      '<div id="char-list" class="grid cards" aria-live="polite">' + charListHTML() + '</div>';
  }
  function renderCharList() { var el = $('#char-list'); if (el) el.innerHTML = charListHTML(); }

  function charFormFields() { return [CHAR_IMAGE_FIELD].concat(CHAR_FIELDS); }
  function charValidate(v) {
    var errs = {};
    if (v.birthday && parseMD(v.birthday) === null) errs.birthday = '“07-20”처럼 월-일 형식으로 입력해 주세요.';
    return errs;
  }
  function charDetail(id) {
    var c = getById(Store.get().characters, id);
    if (!c) { toast('이미 삭제되었거나 찾을 수 없는 캐릭터예요.'); renderCharList(); return; }
    var col = isHex(c.color) ? c.color : '';
    var img = safeUrl(c.image);
    var rows = CHAR_FIELDS.filter(function (f) { return f.name !== 'name' && c[f.name]; }).map(function (f) {
      var val = f.type === 'color' ? '<span class="chip"><span class="color-dot" style="--chip:' + esc(c[f.name]) + '"></span>' + esc(c[f.name]) + '</span>' : esc(c[f.name]);
      if (f.name === 'birthday') val = esc(parseMD(c.birthday) || c.birthday);
      return '<dt>' + esc(f.label) + '</dt><dd>' + val + '</dd>';
    }).join('');
    var pairs = Store.get().pairs.filter(function (p) { return p.charA === c.id || p.charB === c.id; });
    var pairHTML = pairs.length ? '<dt>연결된 페어</dt><dd>' + pairs.map(function (p) { return '<a href="#/pairs/' + p.id + '">' + esc(p.name) + '</a>'; }).join(', ') + '</dd>' : '';
    openModal('<div class="detail-top"' + (col ? ' style="--chip:' + col + '"' : '') + '><div class="detail-img">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(c.name) + ' 대표 이미지" data-action="zoom-img" data-src="' + esc(img) + '">' : '<span class="avatar-initial" style="font-size:2.4rem" aria-hidden="true">' + esc(c.name.slice(0, 1)) + '</span>') +
      '</div><div><h2>' + esc(c.name) + '</h2>' + (c.nameJp ? '<p class="muted">' + esc(c.nameJp) + '</p>' : '') + '</div></div>' +
      (rows || pairHTML ? '<dl class="dl">' + rows + pairHTML + '</dl>' : '<p class="muted">아직 입력한 상세 정보가 없어요. “수정”에서 채워 보세요.</p>') +
      '<div class="modal-actions"><button type="button" class="btn danger" data-action="char-del" data-id="' + c.id + '">삭제</button><button type="button" class="btn" data-action="char-edit" data-id="' + c.id + '">수정</button><button type="button" class="btn primary" data-action="modal-close">닫기</button></div>',
      { label: c.name + ' 프로필' });
  }
  function charForm(id) {
    var existing = id ? getById(Store.get().characters, id) : null;
    if (id && !existing) { toast('찾을 수 없는 캐릭터예요.'); return; }
    openForm({
      title: existing ? '캐릭터 수정' : '캐릭터 추가', fields: charFormFields(), values: existing || {}, validate: charValidate, cls: 'wide',
      onSubmit: function (v) {
        v.birthday = parseMD(v.birthday) || '';
        var ok = Store.update(function (d) {
          if (existing) {
            var c = getById(d.characters, id);
            if (!c) throw new Error('없는 캐릭터');
            Object.assign(c, v);
          } else d.characters.push(Object.assign({ id: uid(), fav: false }, v));
        });
        if (!ok) { toast('저장하지 못했어요. 이미 삭제된 캐릭터일 수 있어요.'); return false; }
        toast(existing ? '캐릭터를 수정했어요.' : '캐릭터를 추가했어요.');
        refresh();
        return true;
      }
    });
  }
  function charDelete(id) {
    var c = getById(Store.get().characters, id);
    if (!c) { toast('이미 삭제된 캐릭터예요.'); renderCharList(); return; }
    var pairs = Store.get().pairs.filter(function (p) { return p.charA === id || p.charB === id; });
    var msg = '“' + c.name + '” 캐릭터를 삭제할까요? 되돌릴 수 없어요.';
    if (pairs.length) msg += '\n\n영향 범위: 이 캐릭터가 연결된 페어 ' + pairs.length + '개(' + pairs.map(function (p) { return p.name; }).join(', ') + ')에서 캐릭터 연결만 해제돼요. 페어 자체는 삭제되지 않아요.';
    if (parseMD(c.birthday)) msg += '\n달력에 자동 표시되던 생일도 함께 사라져요.';
    confirmDialog({ title: '캐릭터 삭제', message: msg, okText: '삭제', danger: true }).then(function (ok) {
      if (!ok) return;
      var done = Store.update(function (d) {
        removeById(d.characters, id);
        d.pairs.forEach(function (p) { if (p.charA === id) p.charA = ''; if (p.charB === id) p.charB = ''; });
      });
      if (!done) return;
      closeAllModals();
      toast('캐릭터를 삭제했어요.');
      refresh();
    });
  }

  /* ---------- 페어 ---------- */
  function charById(id) { return id ? getById(Store.get().characters, id) : null; }
  function pairsFiltered() {
    var q = ui.pairQ.trim().toLowerCase();
    return Store.get().pairs.filter(function (p) {
      if (!q) return true;
      var a = charById(p.charA), b = charById(p.charB);
      return [p.name, p.tagline, p.relation, a && a.name, b && b.name].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  function pairCard(p) {
    var a = charById(p.charA), b = charById(p.charB), img = safeUrl(p.image);
    var who = (a || b) ? (a ? a.name : '?') + ' × ' + (b ? b.name : '?') : '';
    return '<a class="card pair-card" href="#/pairs/' + p.id + '"><span class="pair-thumb">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<span aria-hidden="true">💞</span>') + '</span>' +
      '<span class="pair-info"><strong>' + esc(p.name) + '</strong>' + (p.tagline ? '<span>' + esc(p.tagline) + '</span>' : '') + (who ? '<small class="muted">' + esc(who) + '</small>' : '') +
      (p.anniversary ? '<small class="muted">기념일 ' + esc(fmtKDate(p.anniversary)) + '</small>' : '') + '</span></a>';
  }
  function pairListHTML() {
    var all = Store.get().pairs, list = pairsFiltered();
    if (!all.length) return '<div class="empty" style="grid-column:1/-1"><p>아직 등록된 페어가 없어요.</p><button type="button" class="btn primary" data-action="pair-add">+ 첫 페어 추가하기</button></div>';
    if (!list.length) return '<div class="empty" style="grid-column:1/-1"><p>조건에 맞는 페어가 없어요.</p></div>';
    return list.map(pairCard).join('');
  }
  function pairsView() {
    return pageHead('페어 소개', '드림 페어의 관계와 타임라인을 정리해요.', '<button type="button" class="btn primary" data-action="pair-add">+ 페어 추가</button>') +
      '<div class="toolbar"><label class="search"><span class="sr-only">페어 검색</span><input type="search" class="input" data-input="pair-search" placeholder="페어명·캐릭터 이름으로 검색" value="' + esc(ui.pairQ) + '"></label>' +
      (isOn('randomPick') ? '<button type="button" class="btn" data-action="pair-random">🎲 랜덤 뽑기</button>' : '') + '</div>' +
      '<div id="pair-list" class="grid cards" aria-live="polite">' + pairListHTML() + '</div>';
  }
  function renderPairList() { var el = $('#pair-list'); if (el) el.innerHTML = pairListHTML(); }

  function sortedTimeline(p) {
    return p.timeline.slice().sort(function (a, b) {
      if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });
  }
  function pairDetailView(id) {
    var p = getById(Store.get().pairs, id);
    if (!p) return pageHead('페어를 찾을 수 없어요', '삭제되었거나 주소가 잘못되었어요.', '<a class="btn" href="#/pairs">페어 목록으로</a>');
    var a = charById(p.charA), b = charById(p.charB), img = safeUrl(p.image);
    var colA = a && isHex(a.color) ? a.color : S().accent, colB = b && isHex(b.color) ? b.color : colA;
    var nameA = a ? a.name : '캐릭터 A', nameB = b ? b.name : '캐릭터 B';
    var who = (a || b) ? '<div class="pair-who">' + (a ? '<button type="button" data-action="char-detail" data-id="' + a.id + '">' + esc(a.name) + '</button>' : '<span>캐릭터 A 미연결</span>') +
      '<span class="x" aria-hidden="true">×</span>' + (b ? '<button type="button" data-action="char-detail" data-id="' + b.id + '">' + esc(b.name) + '</button>' : '<span>캐릭터 B 미연결</span>') + '</div>' : '';
    var facts = [];
    function fact(t, v) { if (v) facts.push('<section class="card fact"><h3>' + esc(t) + '</h3><p>' + esc(v) + '</p></section>'); }
    fact('관계성', p.relation); fact('첫 만남', p.firstMeet); fact('고백 및 연애 시작', p.confession);
    fact('기념일', p.anniversary ? fmtKDate(p.anniversary) + ' (매년 달력에 표시)' : ''); fact('좋아하는 데이트', p.dateStyle);
    fact('서로에 대한 호칭', [p.callAB ? nameA + ' → ' + nameB + ': ' + p.callAB : '', p.callBA ? nameB + ' → ' + nameA + ': ' + p.callBA : ''].filter(Boolean).join('\n'));
    fact('서로의 애칭', [p.nickAB ? nameA + ' → ' + nameB + ': ' + p.nickAB : '', p.nickBA ? nameB + ' → ' + nameA + ': ' + p.nickBA : ''].filter(Boolean).join('\n'));
    fact('기타 설정', p.notes);
    var tl = '';
    if (isOn('timeline')) {
      var items = sortedTimeline(p);
      tl = '<section aria-label="관계 타임라인"><div class="sec-head"><h2>관계 타임라인</h2><button type="button" class="btn small primary" data-action="tl-add" data-pid="' + p.id + '">+ 사건 추가</button></div>' +
        (items.length ? '<ol class="timeline">' + items.map(function (t) {
          return '<li class="tl-item"><div class="tl-date">' + (t.date ? esc(fmtKDate(t.date)) : '날짜 미정') + '</div><strong>' + esc(t.title) + '</strong>' + (t.memo ? '<p class="tl-memo">' + esc(t.memo) + '</p>' : '') +
            '<div class="row" style="margin-top:6px"><button type="button" class="btn small" data-action="tl-edit" data-pid="' + p.id + '" data-id="' + t.id + '">수정</button><button type="button" class="btn small danger" data-action="tl-del" data-pid="' + p.id + '" data-id="' + t.id + '">삭제</button></div></li>';
        }).join('') + '</ol>' : '<p class="empty">아직 등록된 사건이 없어요. 첫 만남이나 고백처럼 중요한 순간을 추가해 보세요.</p>') + '</section>';
    }
    return '<a class="back-link" href="#/pairs">← 페어 목록</a>' +
      '<section class="pair-hero" style="--pair-a:' + colA + ';--pair-b:' + colB + '"><div class="pair-photo">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + ' 대표 사진" data-action="zoom-img" data-src="' + esc(img) + '">' : '<span aria-hidden="true">💞</span>') + '</div>' +
      '<h1>' + esc(p.name) + '</h1>' + (p.tagline ? '<p>' + esc(p.tagline) + '</p>' : '') + who +
      '<div class="pair-actions"><button type="button" class="btn small" data-action="pair-edit" data-id="' + p.id + '">수정</button>' +
      '<button type="button" class="btn small" data-action="pair-main" data-id="' + p.id + '">메인 화면에 표시</button>' +
      '<button type="button" class="btn small danger" data-action="pair-del" data-id="' + p.id + '">삭제</button></div></section>' +
      (facts.length ? '<div class="facts">' + facts.join('') + '</div>' : '<p class="empty" style="margin:18px 0">아직 입력한 소개가 없어요. “수정”에서 관계성, 첫 만남 등을 적어 보세요.</p>') + tl;
  }
  function pairForm(id) {
    var existing = id ? getById(Store.get().pairs, id) : null;
    if (id && !existing) { toast('찾을 수 없는 페어예요.'); return; }
    var chars = Store.get().characters;
    var opts = [{ value: '', label: '선택 안 함' }].concat(chars.map(function (c) { return { value: c.id, label: c.name }; }));
    var fields = PAIR_FIELDS.map(function (f) { return f.type === 'select' ? Object.assign({}, f, { options: opts }) : f; });
    openForm({
      title: existing ? '페어 수정' : '페어 추가', fields: fields, values: existing || {}, cls: 'wide',
      intro: chars.length ? '' : '캐릭터 A·B를 연결하려면 먼저 “캐릭터 소개”에서 캐릭터를 등록해 주세요. 지금은 연결 없이도 만들 수 있어요.',
      validate: function (v) {
        var errs = {};
        if (v.charA && v.charA === v.charB) errs.charB = '캐릭터 A와 B는 서로 다른 캐릭터여야 해요.';
        if (!v.name && !(v.charA && v.charB)) errs.name = '페어명을 입력하거나 캐릭터 A·B를 모두 선택해 주세요.';
        return errs;
      },
      onSubmit: function (v) {
        if (!v.name) { var a = charById(v.charA), b = charById(v.charB); v.name = a.name + ' × ' + b.name; }
        var newId = uid();
        var ok = Store.update(function (d) {
          if (existing) {
            var p = getById(d.pairs, id);
            if (!p) throw new Error('없는 페어');
            Object.assign(p, v);
          } else d.pairs.push(Object.assign({ id: newId, timeline: [] }, v));
        });
        if (!ok) { toast('저장하지 못했어요. 이미 삭제된 페어일 수 있어요.'); return false; }
        toast(existing ? '페어를 수정했어요.' : '페어를 추가했어요.');
        if (!existing && currentPage() === 'pairs' && !parseHash().id) location.hash = '#/pairs/' + newId; else refresh();
        return true;
      }
    });
  }
  function pairDelete(id) {
    var p = getById(Store.get().pairs, id);
    if (!p) { toast('이미 삭제된 페어예요.'); return; }
    var evs = Store.get().events.filter(function (e) { return e.pairId === id; });
    var msg = '“' + p.name + '” 페어를 삭제할까요? 되돌릴 수 없어요.\n영향 범위: 타임라인 ' + p.timeline.length + '개가 함께 삭제돼요.';
    if (evs.length) msg += '\n이 페어에 연결된 기념일 ' + evs.length + '개는 삭제되지 않고, 페어 연결만 해제돼요.';
    if (p.anniversary) msg += '\n달력에 자동 표시되던 페어 기념일은 사라져요.';
    if (S().pairName === p.name) msg += '\n메인 화면의 페어명 설정은 그대로 남아요. (설정에서 따로 바꿀 수 있어요)';
    confirmDialog({ title: '페어 삭제', message: msg, okText: '삭제', danger: true }).then(function (ok) {
      if (!ok) return;
      var done = Store.update(function (d) {
        removeById(d.pairs, id);
        d.events.forEach(function (e) { if (e.pairId === id) e.pairId = ''; });
      });
      if (!done) return;
      toast('페어를 삭제했어요.');
      if (parseHash().id) location.hash = '#/pairs'; else refresh();
    });
  }
  function timelineForm(pid, tid) {
    var p = getById(Store.get().pairs, pid);
    if (!p) { toast('찾을 수 없는 페어예요.'); return; }
    var t = tid ? getById(p.timeline, tid) : null;
    if (tid && !t) { toast('이미 삭제된 사건이에요.'); refresh(); return; }
    openForm({
      title: t ? '사건 수정' : '사건 추가',
      fields: [
        { name: 'title', label: '사건 제목', type: 'text', required: true, max: 60 },
        { name: 'date', label: '날짜 (선택)', type: 'date' },
        { name: 'memo', label: '메모', type: 'textarea', rows: 3, max: 500 }
      ],
      values: t || {},
      onSubmit: function (v) {
        var ok = Store.update(function (d) {
          var pp = getById(d.pairs, pid);
          if (!pp) throw new Error('없는 페어');
          if (t) { var x = getById(pp.timeline, tid); if (!x) throw new Error('없는 사건'); Object.assign(x, v); }
          else pp.timeline.push(Object.assign({ id: uid() }, v));
        });
        if (!ok) { toast('저장하지 못했어요.'); return false; }
        toast(t ? '사건을 수정했어요.' : '사건을 추가했어요.');
        refresh();
        return true;
      }
    });
  }

  /* ---------- 오너 ---------- */
  function ownerView() {
    var o = Store.get().owner, img = safeUrl(o.image);
    var rows = OWNER_FIELDS.filter(function (f) { return f.name !== 'image' && f.name !== 'nickname' && f.name !== 'intro' && o[f.name]; }).map(function (f) {
      return '<dt>' + esc(f.label) + '</dt><dd>' + esc(o[f.name]) + '</dd>';
    }).join('');
    var links = o.links.length ? '<ul class="links">' + o.links.map(function (l) {
      var href = safeLink(l.url);
      return '<li>' + (href ? '<a class="btn small" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label || l.url) + '</a>' : '<span class="chip">' + esc(l.label || l.url) + '</span>') +
        '<button type="button" class="btn small danger" data-action="link-del" data-id="' + l.id + '" aria-label="' + esc(l.label || l.url) + ' 링크 삭제">×</button></li>';
    }).join('') + '</ul>' : '<p class="muted">등록된 링크가 없어요.</p>';
    var extras = o.extras.map(function (x) {
      return '<section class="card extra"><div class="sec-head"><h3>' + esc(x.title || '제목 없음') + '</h3><div class="row"><button type="button" class="btn small" data-action="extra-edit" data-id="' + x.id + '">수정</button><button type="button" class="btn small danger" data-action="extra-del" data-id="' + x.id + '">삭제</button></div></div><p>' + esc(x.body) + '</p></section>';
    }).join('');
    return pageHead('오너 소개', '이 홈페이지를 운영하는 사람을 소개해요. 실명·전화번호·주소 같은 개인정보는 적지 않는 것을 권장해요.',
      '<button type="button" class="btn primary" data-action="owner-edit">프로필 수정</button>') +
      '<section class="card owner-card"><div class="owner-top"><div class="detail-img">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(o.nickname || '오너') + ' 프로필 이미지" data-action="zoom-img" data-src="' + esc(img) + '">' : '<span class="avatar-initial" style="font-size:2.4rem" aria-hidden="true">' + esc((o.nickname || '오').slice(0, 1)) + '</span>') +
      '</div><div><h2>' + esc(o.nickname || '닉네임을 입력해 주세요') + '</h2></div></div>' +
      '<p style="white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:16px">' + (o.intro ? esc(o.intro) : '<span class="muted">자기소개를 작성해 주세요.</span>') + '</p>' +
      (rows ? '<dl class="dl">' + rows + '</dl>' : '') +
      '<div style="margin-top:20px"><div class="sec-head"><h3>연락 및 SNS 링크</h3><button type="button" class="btn small" data-action="link-add">+ 링크 추가</button></div>' + links + '</div></section>' +
      '<div class="sec-head" style="margin-top:22px"><h2>추가 소개</h2><button type="button" class="btn small primary" data-action="extra-add">+ 소개 항목 추가</button></div>' +
      (extras || '<p class="empty">자유롭게 소개 항목을 추가할 수 있어요. (예: 작업물 안내, 주의사항, 소통 규칙)</p>') +
      '<div class="row" style="margin-top:22px"><button type="button" class="btn danger small" data-action="owner-clear">프로필 내용 모두 비우기</button></div>';
  }
  function ownerEdit() {
    var o = Store.get().owner;
    openForm({
      title: '오너 프로필 수정', fields: OWNER_FIELDS, values: o, cls: 'wide',
      onSubmit: function (v) {
        var ok = Store.update(function (d) { Object.assign(d.owner, v); });
        if (!ok) return false;
        toast('오너 소개를 저장했어요.'); refresh(); return true;
      }
    });
  }
  function linkForm() {
    openForm({
      title: 'SNS/연락 링크 추가',
      fields: [
        { name: 'label', label: '표시할 이름', type: 'text', required: true, max: 30, placeholder: '예: 트위터(X)' },
        { name: 'url', label: '주소', type: 'text', required: true, max: 300, placeholder: 'https://…' }
      ],
      values: {},
      validate: function (v) { return v.url && !safeLink(v.url) ? { url: 'https:// 로 시작하는 올바른 주소를 입력해 주세요.' } : {}; },
      onSubmit: function (v) {
        var ok = Store.update(function (d) { d.owner.links.push({ id: uid(), label: v.label, url: safeLink(v.url) }); });
        if (!ok) return false;
        toast('링크를 추가했어요.'); refresh(); return true;
      }
    });
  }
  function extraForm(id) {
    var x = id ? getById(Store.get().owner.extras, id) : null;
    if (id && !x) { toast('이미 삭제된 항목이에요.'); refresh(); return; }
    openForm({
      title: x ? '소개 항목 수정' : '소개 항목 추가',
      fields: [
        { name: 'title', label: '제목', type: 'text', required: true, max: 40 },
        { name: 'body', label: '내용', type: 'textarea', rows: 5, max: 2000 }
      ],
      values: x || {},
      onSubmit: function (v) {
        var ok = Store.update(function (d) {
          if (x) { var t = getById(d.owner.extras, id); if (!t) throw new Error('없는 항목'); Object.assign(t, v); }
          else d.owner.extras.push({ id: uid(), title: v.title, body: v.body });
        });
        if (!ok) { toast('저장하지 못했어요.'); return false; }
        toast('저장했어요.'); refresh(); return true;
      }
    });
  }

  /* ---------- 방명록 ---------- */
  function newSalt() {
    var a = new Uint8Array(8), s = '';
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < a.length; j++) s += a[j].toString(16).padStart(2, '0');
    return s;
  }
  // 비밀번호는 원문이 아니라 해시(복원 불가능한 값)로만 저장해요.
  function hashPw(pw, salt) {
    var text = salt + ':' + pw;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return 'sha256:' + Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return Promise.resolve('weak:' + h.toString(16));
  }
  function gbFiltered() {
    var q = ui.gbQ.trim().toLowerCase();
    return Store.get().guestbook.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; })
      .filter(function (g) { return !q || (g.nick + ' ' + g.msg).toLowerCase().indexOf(q) >= 0; });
  }
  function gbListHTML() {
    var all = Store.get().guestbook, list = gbFiltered();
    if (!all.length) return '<p class="empty">아직 방명록에 글이 없어요. 첫 글을 남겨 보세요!</p>';
    if (!list.length) return '<p class="empty">검색 결과가 없어요.</p>';
    return list.map(function (g) {
      return '<article class="card gb-item"><div class="gb-meta"><strong>' + esc(g.nick) + '</strong><small>' + esc(fmtDateTime(g.date)) + (g.editedAt ? ' (수정됨)' : '') + '</small></div>' +
        '<p class="gb-msg">' + esc(g.msg) + '</p><div class="gb-actions"><button type="button" class="btn small" data-action="gb-edit" data-id="' + g.id + '">수정</button><button type="button" class="btn small danger" data-action="gb-del" data-id="' + g.id + '">삭제</button></div></article>';
    }).join('');
  }
  function guestbookView() {
    return pageHead('방명록', '자유롭게 글을 남겨 주세요.') +
      '<div class="notice warn" style="margin-bottom:16px"><strong>⚠ 저장 방식 안내</strong><br>이 방명록은 <b>지금 사용 중인 이 브라우저(localStorage)에만</b> 저장돼요. 다른 방문자에게는 보이지 않고, 다른 방문자가 남긴 글도 이 화면에 나타나지 않아요. ' +
      '<details><summary>비밀번호와 보안에 대해</summary>비밀번호는 원문이 아닌 해시 값으로 저장하지만, 모든 처리가 이 브라우저 안에서만 이루어져서 개발자도구를 쓰는 사람은 글을 직접 고치거나 지울 수 있어요. 완전한 보안 수단이 아니라 실수 방지용으로 생각해 주세요. 모두가 볼 수 있는 공개 방명록은 Firebase 같은 외부 서비스를 연결해야 가능해요.</details></div>' +
      '<form class="card gb-form" data-form="gb-new" novalidate aria-label="방명록 글쓰기"><div class="set-grid">' +
      '<div class="field" style="grid-column:auto"><label class="label" for="gb-nick">닉네임</label><input class="input" id="gb-nick" maxlength="20" autocomplete="nickname"></div>' +
      '<div class="field" style="grid-column:auto"><label class="label" for="gb-pw">비밀번호 (수정·삭제할 때 필요, 4자 이상)</label><input class="input" id="gb-pw" type="password" maxlength="30" autocomplete="new-password"></div></div>' +
      '<div class="field"><label class="label" for="gb-msg">내용</label><textarea class="input" id="gb-msg" rows="4" maxlength="500"></textarea></div>' +
      '<p class="field-error" id="gb-error" role="alert"></p><div class="row"><button type="submit" class="btn primary">글 남기기</button></div></form>' +
      '<div class="toolbar"><label class="search"><span class="sr-only">방명록 검색</span><input type="search" class="input" data-input="gb-search" placeholder="닉네임·내용으로 검색" value="' + esc(ui.gbQ) + '"></label></div>' +
      '<div id="gb-list" class="gb-list" aria-live="polite">' + gbListHTML() + '</div>';
  }
  function renderGbList() { var el = $('#gb-list'); if (el) el.innerHTML = gbListHTML(); }
  function submitGuestbook(form) {
    var nick = $('#gb-nick', form).value.trim(), pw = $('#gb-pw', form).value, msg = $('#gb-msg', form).value.trim();
    var err = $('#gb-error', form);
    err.textContent = '';
    if (!nick) { err.textContent = '닉네임을 입력해 주세요.'; $('#gb-nick', form).focus(); return; }
    if (pw.length < 4) { err.textContent = '비밀번호는 4자 이상 입력해 주세요.'; $('#gb-pw', form).focus(); return; }
    if (!msg) { err.textContent = '내용을 입력해 주세요.'; $('#gb-msg', form).focus(); return; }
    confirmDialog({ title: '글 남기기', message: '이 글을 방명록에 남길까요?\n(이 브라우저에만 저장돼요)', okText: '남기기' }).then(function (ok) {
      if (!ok) return;
      var salt = newSalt();
      return hashPw(pw, salt).then(function (hash) {
        var saved = Store.update(function (d) { d.guestbook.push({ id: uid(), nick: nick, msg: msg, date: new Date().toISOString(), editedAt: '', salt: salt, hash: hash }); });
        if (!saved) return;
        form.reset();
        toast('방명록에 글을 남겼어요.');
        renderGbList();
      });
    });
  }
  function askVerify(id, title) {
    var g = getById(Store.get().guestbook, id);
    if (!g) { toast('이미 삭제된 글이에요.'); renderGbList(); return Promise.resolve(null); }
    return promptDialog({ title: title, message: '글을 쓸 때 정한 비밀번호를 입력해 주세요.', label: '비밀번호', type: 'password', validate: function (v) { return v ? '' : '비밀번호를 입력해 주세요.'; } }).then(function (pw) {
      if (pw == null) return null;
      return hashPw(pw, g.salt).then(function (h) {
        if (h !== g.hash) { toast('비밀번호가 맞지 않아요.'); return null; }
        return g;
      });
    });
  }
  function gbEdit(id) {
    askVerify(id, '글 수정').then(function (g) {
      if (!g) return;
      openForm({
        title: '방명록 글 수정',
        fields: [
          { name: 'nick', label: '닉네임', type: 'text', required: true, max: 20 },
          { name: 'msg', label: '내용', type: 'textarea', required: true, rows: 4, max: 500 }
        ],
        values: g,
        onSubmit: function (v) {
          var ok = Store.update(function (d) {
            var x = getById(d.guestbook, id);
            if (!x) throw new Error('없는 글');
            x.nick = v.nick; x.msg = v.msg; x.editedAt = new Date().toISOString();
          });
          if (!ok) { toast('저장하지 못했어요. 이미 삭제된 글일 수 있어요.'); return false; }
          toast('글을 수정했어요.'); renderGbList(); return true;
        }
      });
    });
  }
  function gbDelete(id) {
    askVerify(id, '글 삭제').then(function (g) {
      if (!g) return;
      return confirmDialog({ title: '글 삭제', message: '이 글을 삭제할까요? 되돌릴 수 없어요.', okText: '삭제', danger: true }).then(function (ok) {
        if (!ok) return;
        if (Store.update(function (d) { removeById(d.guestbook, id); })) { toast('글을 삭제했어요.'); renderGbList(); }
      });
    });
  }

  /* =====================================================
     9. 설정 창, 데이터 백업/복원
  ===================================================== */
  function colorFallback(key) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
    return isHex(v) ? v : '#888888';
  }
  function settingsHTML() {
    var s = S(), d = Store.get();
    function text(key, label) { return '<div class="field" style="grid-column:auto"><label class="label" for="s-' + key + '">' + label + '</label><input class="input" id="s-' + key + '" data-set="' + key + '" maxlength="120" value="' + esc(s[key]) + '"></div>'; }
    function check(path, label, val) { return '<label class="check"><input type="checkbox" data-set="' + path + '"' + (val ? ' checked' : '') + '><span>' + label + '</span></label>'; }
    var counts = { characters: d.characters.length, pairs: d.pairs.length, guestbook: d.guestbook.length, events: d.events.length, tracks: d.tracks.length };
    return '<div class="modal-head"><h2 class="modal-title">설정</h2><button type="button" class="btn small" data-action="modal-close">닫기</button></div>' +
      '<p class="hint">바꾸는 즉시 화면에 반영되고 자동 저장돼요.</p>' +
      '<section class="set-sec"><h3>디자인</h3><div class="set-grid">' + text('siteName', '사이트명') + text('tagline', '사이트 소개 문구') + text('pairName', '대표 페어명') + text('pairTagline', '페어 한 줄 소개') + '</div>' +
      imageFieldHTML('heroImage', '대표 이미지', s.heroImage) +
      '<div><span class="label">테마 색 (학교·페어 상징색 예시)</span><div class="presets" style="margin-top:8px">' + PRESETS.map(function (p) {
        return '<button type="button" class="btn small preset" data-action="preset" data-color="' + p.color + '"><i style="background:' + p.color + '"></i>' + p.name + '</button>';
      }).join('') + '</div></div>' +
      '<div class="set-grid"><div class="field" style="grid-column:auto"><span class="label">포인트 컬러</span><input type="color" class="color-input" id="s-accent" data-set="accent" aria-label="포인트 컬러" value="' + s.accent + '"></div>' +
      '<div class="field" style="grid-column:auto"><span class="label">배경색</span><div class="row"><input type="color" class="color-input" id="s-bgColor" data-set="bgColor" aria-label="배경색" value="' + (s.bgColor || colorFallback('--bg')) + '"><button type="button" class="btn small ghost" data-action="set-reset" data-key="bgColor">기본값</button></div></div>' +
      '<div class="field" style="grid-column:auto"><span class="label">글자색</span><div class="row"><input type="color" class="color-input" id="s-textColor" data-set="textColor" aria-label="글자색" value="' + (s.textColor || colorFallback('--text')) + '"><button type="button" class="btn small ghost" data-action="set-reset" data-key="textColor">기본값</button></div></div></div>' +
      '<p class="hint" id="contrast-note" role="status"></p>' +
      '<div class="set-grid"><div class="field" style="grid-column:auto"><label class="label" for="s-fontScale">글꼴 크기 <output id="o-fontScale">' + s.fontScale + '%</output></label><input type="range" id="s-fontScale" data-set="fontScale" min="85" max="130" step="5" value="' + s.fontScale + '"></div>' +
      '<div class="field" style="grid-column:auto"><label class="label" for="s-radius">카드 모서리 둥글기 <output id="o-radius">' + s.radius + 'px</output></label><input type="range" id="s-radius" data-set="radius" min="0" max="32" step="2" value="' + s.radius + '"></div></div>' +
      '<div><span class="label">화면 모드</span><div class="row wrap"><label class="check"><input type="radio" name="mode" data-set="mode" value="light"' + (s.mode === 'light' ? ' checked' : '') + '><span>라이트</span></label><label class="check"><input type="radio" name="mode" data-set="mode" value="dark"' + (s.mode === 'dark' ? ' checked' : '') + '><span>다크</span></label></div></div></section>' +
      '<section class="set-sec"><h3>화면 구성 (표시/숨기기)</h3><div class="set-grid">' +
      check('show.calendar', '달력', s.show.calendar) + check('show.music', '음악 플레이어', s.show.music) + check('show.intro', '메인 소개 문구', s.show.intro) +
      check('show.characters', '캐릭터 소개 메뉴', s.show.characters) + check('show.pairs', '페어 소개 메뉴', s.show.pairs) + check('show.owner', '오너 소개 메뉴', s.show.owner) + check('show.guestbook', '방명록 메뉴', s.show.guestbook) +
      '</div><p class="hint">숨겨도 저장된 데이터는 지워지지 않아요.</p></section>' +
      '<section class="set-sec"><h3>기능</h3><div>' + FEATURES.map(function (f) { return check('features.' + f.key, f.label, s.features[f.key]); }).join('') + '</div>' +
      '<div class="field"><label class="label" for="s-defaultPage">처음 열 때 보여줄 화면</label><select class="input" id="s-defaultPage" data-set="defaultPage"><option value="home">메인 화면</option>' +
      MENU.map(function (m) { return '<option value="' + m.key + '"' + (s.defaultPage === m.key ? ' selected' : '') + '>' + m.label + '</option>'; }).join('') + '</select></div>' +
      '<p class="hint">방문자 수 표시, 모두가 보는 공유 방명록처럼 서버가 필요한 기능은 이 정적 사이트만으로는 만들 수 없고 별도 서비스(예: Firebase)가 필요해요.</p></section>' +
      '<section class="set-sec"><h3>데이터 (백업 / 복원 / 삭제)</h3>' +
      '<p class="hint">현재 저장 용량: 약 ' + Math.round(Store.size() / 1024) + 'KB (브라우저 한도는 보통 5MB 안팎이에요). ' + (Store.memoryOnly() ? '⚠ 이 브라우저에서는 저장이 안 돼요.' : '') + '</p>' +
      '<div class="btn-col"><button type="button" class="btn" data-action="export-data">내보내기 (JSON 백업)</button><button type="button" class="btn" data-action="import-pick">가져오기 (JSON 복원)</button><input type="file" id="import-file" accept="application/json,.json" hidden></div>' +
      '<div><span class="label">항목별 전체 삭제</span><div class="btn-col" style="margin-top:8px">' +
      [['characters', '캐릭터'], ['pairs', '페어'], ['guestbook', '방명록'], ['events', '기념일'], ['tracks', '음악 목록']].map(function (k) {
        return '<button type="button" class="btn small danger" data-action="wipe" data-kind="' + k[0] + '">' + k[1] + ' 전체 삭제 (' + counts[k[0]] + ')</button>';
      }).join('') + '</div></div>' +
      '<div class="btn-col"><button type="button" class="btn danger" data-action="reset-settings">설정만 기본값으로 초기화</button><button type="button" class="btn danger" data-action="wipe-all">모든 데이터 삭제 (공장 초기화)</button></div></section>';
  }
  function updateContrastNote() {
    var n = $('#contrast-note');
    if (!n) return;
    var bg = colorFallback('--bg'), tx = colorFallback('--text');
    var r = contrast(bg, tx);
    n.textContent = r < 4.5 ? '⚠ 글자색과 배경색의 대비가 낮아 읽기 어려울 수 있어요. (대비 ' + r.toFixed(1) + ' : 1, 권장 4.5 이상) 어두운 배경은 다크 모드를 쓰는 것이 좋아요.' : '글자와 배경의 대비가 충분해요. (' + r.toFixed(1) + ' : 1)';
  }
  var settingsEntry = null;
  function openSettings() {
    if (settingsEntry && !settingsEntry.closed) return;
    settingsEntry = openModal(settingsHTML(), { label: '설정', cls: 'wide', onClose: function () { Store.flush(); } });
    setupImageField($('[data-img="heroImage"]', settingsEntry.box), S().heroImage, function (v) { Store.patchSettings('heroImage', v); afterSetting(); }, 1400);
    updateContrastNote();
  }
  function reopenSettings() {
    if (settingsEntry && !settingsEntry.closed) closeModal(settingsEntry);
    openSettings();
  }
  var refreshLater = debounce(function () { refresh(); }, 120);
  function afterSetting() {
    applyTheme(); renderChrome(); updateContrastNote(); refreshLater();
  }
  function onSetting(t) {
    var path = t.dataset.set, val;
    if (t.type === 'checkbox') val = t.checked;
    else if (t.type === 'radio') { if (!t.checked) return; val = t.value; }
    else if (t.type === 'range') val = Number(t.value);
    else val = t.value;
    Store.patchSettings(path, val);
    if (path === 'show.music' && val === false) { stopAudio(); }
    if (path === 'fontScale') { var o = $('#o-fontScale'); if (o) o.textContent = val + '%'; }
    if (path === 'radius') { var o2 = $('#o-radius'); if (o2) o2.textContent = val + 'px'; }
    afterSetting();
  }

  function exportData() {
    Store.flush();
    var payload = { app: BACKUP_ID, version: 1, exportedAt: new Date().toISOString(), data: Store.get() };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    var t = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'haikyuu-dream-backup-' + t.getFullYear() + pad(t.getMonth() + 1) + pad(t.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('백업 파일을 내려받았어요. (음악 “기기 파일”은 백업에 포함되지 않아요)');
  }
  function mergeInto(cur, imp) {
    var out = clone(cur);
    ['characters', 'pairs', 'guestbook', 'events', 'tracks'].forEach(function (k) {
      imp[k].forEach(function (item) {
        var i = out[k].findIndex(function (x) { return x.id === item.id; });
        if (i >= 0) out[k][i] = item; else out[k].push(item);
      });
    });
    return out;
  }
  function importFile(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast('파일이 너무 커요. (20MB 이하만 가능)'); return; }
    var reader = new FileReader();
    reader.onerror = function () { toast('파일을 읽지 못했어요.'); };
    reader.onload = function () {
      var obj;
      try { obj = JSON.parse(String(reader.result)); } catch (e) { toast('올바른 JSON 파일이 아니에요. 기존 데이터는 그대로예요.'); return; }
      if (!isObj(obj) || obj.app !== BACKUP_ID || !isObj(obj.data)) { toast('이 홈페이지에서 내보낸 백업 파일이 아니에요. 기존 데이터는 그대로예요.'); return; }
      var bad = ['characters', 'pairs', 'guestbook', 'events', 'tracks'].some(function (k) { return obj.data[k] != null && !Array.isArray(obj.data[k]); });
      if (bad) { toast('백업 파일의 구조가 올바르지 않아요. 기존 데이터는 그대로예요.'); return; }
      var imp = Store.normalize(obj.data);
      var summary = '캐릭터 ' + imp.characters.length + ' · 페어 ' + imp.pairs.length + ' · 방명록 ' + imp.guestbook.length + ' · 기념일 ' + imp.events.length + ' · 음악 ' + imp.tracks.length;
      choiceDialog({
        title: '데이터 가져오기', message: '파일 내용: ' + summary + '\n\n• 병합: 지금 데이터를 유지하고, 파일의 항목을 더해요. (같은 항목은 파일 내용으로 갱신, 설정·오너 소개는 지금 것 유지)\n• 덮어쓰기: 지금 데이터를 전부 지우고 파일 내용으로 바꿔요.',
        choices: [{ label: '취소', value: null }, { label: '병합', value: 'merge', cls: 'primary' }, { label: '덮어쓰기', value: 'replace', cls: 'danger' }]
      }).then(function (mode) {
        if (!mode) return;
        var go = mode === 'replace'
          ? confirmDialog({ title: '정말 덮어쓸까요?', message: '지금 저장된 모든 데이터가 파일 내용으로 교체돼요. 먼저 “내보내기”로 현재 데이터를 백업해 두는 것을 권장해요.', okText: '덮어쓰기', danger: true })
          : Promise.resolve(true);
        go.then(function (ok) {
          if (!ok) return;
          var okSave = mode === 'replace' ? Store.replaceAll(imp) : Store.replaceAll(mergeInto(Store.get(), imp));
          if (!okSave) { toast('가져오기에 실패했어요. 기존 데이터는 그대로예요.'); return; }
          stopAudio();
          applyTheme(); renderChrome(); refresh();
          toast('데이터를 가져왔어요.');
          reopenSettings();
        });
      });
    };
    reader.readAsText(file);
  }

  var WIPE_LABEL = { characters: '캐릭터', pairs: '페어', guestbook: '방명록 글', events: '기념일', tracks: '음악 목록' };
  function wipeKind(kind) {
    var d = Store.get();
    if (!WIPE_LABEL[kind]) return;
    var n = d[kind].length;
    if (!n) { toast('삭제할 ' + WIPE_LABEL[kind] + ' 항목이 없어요.'); return; }
    var msg = WIPE_LABEL[kind] + ' ' + n + '개를 모두 삭제할까요? 되돌릴 수 없어요.';
    if (kind === 'characters') msg += '\n영향 범위: 페어의 캐릭터 연결이 모두 해제되고, 달력의 캐릭터 생일 표시가 사라져요.';
    if (kind === 'pairs') msg += '\n영향 범위: 페어의 타임라인이 함께 삭제되고, 기념일의 페어 연결이 해제돼요.';
    if (kind === 'tracks') msg += '\n재생 중인 음악이 멈춰요.';
    confirmDialog({ title: WIPE_LABEL[kind] + ' 전체 삭제', message: msg, okText: '전체 삭제', danger: true }).then(function (ok) {
      if (!ok) return;
      var done = Store.update(function (x) {
        x[kind] = [];
        if (kind === 'characters') x.pairs.forEach(function (p) { p.charA = ''; p.charB = ''; });
        if (kind === 'pairs') x.events.forEach(function (e) { e.pairId = ''; });
      });
      if (!done) return;
      if (kind === 'tracks') { stopAudio(); }
      toast(WIPE_LABEL[kind] + '을(를) 모두 삭제했어요.');
      refresh(); reopenSettings();
    });
  }
  function resetSettings() {
    confirmDialog({ title: '설정 초기화', message: '디자인·화면 구성·기능 설정을 기본값으로 되돌릴까요?\n캐릭터, 페어, 방명록 같은 데이터는 지워지지 않아요.', okText: '초기화', danger: true }).then(function (ok) {
      if (!ok) return;
      if (!Store.update(function (d) { d.settings = defaultSettings(); })) return;
      applyTheme(); renderChrome(); refresh();
      toast('설정을 기본값으로 되돌렸어요.');
      reopenSettings();
    });
  }
  function wipeAll() {
    confirmDialog({ title: '모든 데이터 삭제', message: '캐릭터·페어·오너 소개·방명록·기념일·음악 목록·설정이 전부 사라져요. 되돌릴 수 없어요.\n먼저 “내보내기”로 백업해 두세요.', okText: '다음 단계', danger: true }).then(function (ok) {
      if (!ok) return;
      return promptDialog({ title: '마지막 확인', message: '계속하려면 아래에 “삭제”라고 입력해 주세요.', label: '확인 글자', placeholder: '삭제', okText: '모두 삭제', danger: true,
        validate: function (v) { return v.trim() === '삭제' ? '' : '“삭제”라고 정확히 입력해 주세요.'; } }).then(function (v) {
        if (v == null) return;
        stopAudio();
        if (!Store.wipeAll()) { toast('삭제하지 못했어요.'); return; }
        calInit(); applyTheme(); renderChrome(); refresh();
        closeAllModals();
        toast('모든 데이터를 삭제했어요.');
      });
    });
  }

  /* =====================================================
     10. 클릭/입력 연결(이벤트 위임)과 시작
  ===================================================== */
  function zoomImage(src) {
    src = safeUrl(src);
    if (!src) return;
    openModal('<img src="' + esc(src) + '" alt="확대한 이미지"><button type="button" class="btn primary" data-action="modal-close">닫기</button>', { label: '이미지 확대', cls: 'lightbox' });
  }
  function eventForm(id) {
    var ev = id ? getById(Store.get().events, id) : null;
    if (id && !ev) { toast('이미 삭제된 기념일이에요.'); renderCalendar(); return; }
    var values = ev ? Object.assign({}, ev, { repeat: ev.repeat === 'yearly' }) : { date: cal.sel, color: S().accent, repeat: false };
    openForm({
      title: ev ? '기념일 수정' : '기념일 추가', fields: eventFormFields(), values: values, validate: eventValidate(id),
      onSubmit: function (v) {
        var ok = Store.update(function (d) {
          var rec = ev ? getById(d.events, id) : null;
          if (ev && !rec) throw new Error('없는 기념일');
          if (!rec) { rec = { id: uid() }; d.events.push(rec); }
          rec.name = v.name; rec.date = v.date; rec.memo = v.memo; rec.pairId = v.pairId; rec.color = v.color || S().accent; rec.repeat = v.repeat ? 'yearly' : '';
        });
        if (!ok) { toast('저장하지 못했어요.'); return false; }
        cal.sel = v.date;
        var y = Number(v.date.slice(0, 4)), m = Number(v.date.slice(5, 7)) - 1;
        cal.y = y; cal.m = m;
        toast(ev ? '기념일을 수정했어요.' : '기념일을 추가했어요.');
        renderCalendar();
        return true;
      }
    });
  }

  var ACTIONS = {
    'open-settings': function () { openSettings(); },
    'goto-calendar': function () {
      if (!S().show.calendar) { toast('달력이 숨겨져 있어요. 설정에서 켤 수 있어요.'); return; }
      if (currentPage() === 'home') { pendingScroll = 'calendar'; refresh(); } else { pendingScroll = 'calendar'; location.hash = '#/home'; }
    },
    'modal-close': function () { closeModal(topModal()); },
    'zoom-hero': function () { zoomImage(S().heroImage); },
    'zoom-img': function (el) { zoomImage(el.dataset.src); },
    /* 캐릭터 */
    'char-add': function () { charForm(); },
    'char-detail': function (el) { charDetail(el.dataset.id); },
    'char-edit': function (el) { closeAllModals(); charForm(el.dataset.id); },
    'char-del': function (el) { charDelete(el.dataset.id); },
    'char-fav': function (el) {
      var id = el.dataset.id;
      if (!getById(Store.get().characters, id)) { renderCharList(); return; }
      if (Store.update(function (d) { var c = getById(d.characters, id); c.fav = !c.fav; })) renderCharList();
    },
    'char-random': function () {
      var list = Store.get().characters;
      if (!list.length) { toast('먼저 캐릭터를 등록해 주세요.'); return; }
      charDetail(list[Math.floor(Math.random() * list.length)].id);
    },
    /* 페어 */
    'pair-add': function () { pairForm(); },
    'pair-edit': function (el) { pairForm(el.dataset.id); },
    'pair-del': function (el) { pairDelete(el.dataset.id); },
    'pair-random': function () {
      var list = Store.get().pairs;
      if (!list.length) { toast('먼저 페어를 등록해 주세요.'); return; }
      location.hash = '#/pairs/' + list[Math.floor(Math.random() * list.length)].id;
    },
    'pair-main': function (el) {
      var p = getById(Store.get().pairs, el.dataset.id);
      if (!p) { toast('찾을 수 없는 페어예요.'); return; }
      confirmDialog({ title: '메인 화면에 표시', message: '“' + p.name + '”의 페어명, 한 줄 소개, 대표 이미지를 메인 화면에 표시할까요?\n(설정에서 언제든 바꿀 수 있어요)', okText: '표시' }).then(function (ok) {
        if (!ok) return;
        if (Store.update(function (d) { d.settings.pairName = p.name; d.settings.pairTagline = p.tagline || ''; if (p.image) d.settings.heroImage = p.image; })) { toast('메인 화면에 반영했어요.'); }
      });
    },
    'tl-add': function (el) { timelineForm(el.dataset.pid); },
    'tl-edit': function (el) { timelineForm(el.dataset.pid, el.dataset.id); },
    'tl-del': function (el) {
      var pid = el.dataset.pid, tid = el.dataset.id;
      var p = getById(Store.get().pairs, pid), t = p && getById(p.timeline, tid);
      if (!t) { toast('이미 삭제된 사건이에요.'); refresh(); return; }
      confirmDialog({ title: '사건 삭제', message: '“' + t.title + '” 사건을 삭제할까요?', okText: '삭제', danger: true }).then(function (ok) {
        if (!ok) return;
        if (Store.update(function (d) { var pp = getById(d.pairs, pid); if (pp) removeById(pp.timeline, tid); })) { toast('사건을 삭제했어요.'); refresh(); }
      });
    },
    /* 오너 */
    'owner-edit': function () { ownerEdit(); },
    'owner-clear': function () {
      confirmDialog({ title: '프로필 비우기', message: '오너 프로필의 모든 내용(링크, 추가 소개 포함)을 비울까요? 되돌릴 수 없어요.', okText: '비우기', danger: true }).then(function (ok) {
        if (ok && Store.update(function (d) { d.owner = defaultOwner(); })) { toast('프로필을 비웠어요.'); refresh(); }
      });
    },
    'link-add': function () { linkForm(); },
    'link-del': function (el) {
      var id = el.dataset.id, l = getById(Store.get().owner.links, id);
      if (!l) { refresh(); return; }
      confirmDialog({ title: '링크 삭제', message: '“' + (l.label || l.url) + '” 링크를 삭제할까요?', okText: '삭제', danger: true }).then(function (ok) {
        if (ok && Store.update(function (d) { removeById(d.owner.links, id); })) { toast('링크를 삭제했어요.'); refresh(); }
      });
    },
    'extra-add': function () { extraForm(); },
    'extra-edit': function (el) { extraForm(el.dataset.id); },
    'extra-del': function (el) {
      var id = el.dataset.id, x = getById(Store.get().owner.extras, id);
      if (!x) { refresh(); return; }
      confirmDialog({ title: '소개 항목 삭제', message: '“' + (x.title || '제목 없음') + '” 항목을 삭제할까요?', okText: '삭제', danger: true }).then(function (ok) {
        if (ok && Store.update(function (d) { removeById(d.owner.extras, id); })) { toast('삭제했어요.'); refresh(); }
      });
    },
    /* 방명록 */
    'gb-edit': function (el) { gbEdit(el.dataset.id); },
    'gb-del': function (el) { gbDelete(el.dataset.id); },
    /* 달력 */
    'cal-prev': function () { cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } renderCalendar('[data-action=cal-prev]'); },
    'cal-next': function () { cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } renderCalendar('[data-action=cal-next]'); },
    'cal-today': function () { calInit(); renderCalendar('.cal-day.today'); },
    'cal-select': function (el) { cal.sel = el.dataset.date; renderCalendar('.cal-day.sel'); },
    'ev-add': function () { eventForm(); },
    'ev-edit': function (el) { eventForm(el.dataset.id); },
    'ev-del': function (el) {
      var id = el.dataset.id, ev = getById(Store.get().events, id);
      if (!ev) { toast('이미 삭제된 기념일이에요.'); renderCalendar(); return; }
      confirmDialog({ title: '기념일 삭제', message: '“' + ev.name + '” 기념일을 삭제할까요?' + (ev.repeat ? '\n매년 반복되는 기념일이라 모든 해에서 사라져요.' : ''), okText: '삭제', danger: true }).then(function (ok) {
        if (ok && Store.update(function (d) { removeById(d.events, id); })) { toast('기념일을 삭제했어요.'); renderCalendar(); }
      });
    },
    'ev-open': function (el) { if (el.dataset.kind === 'birthday') charDetail(el.dataset.id); else location.hash = '#/pairs/' + el.dataset.id; },
    /* 음악 */
    'track-add': function () {
      openForm({ title: '음악 추가', fields: trackFields(), values: { audio: { mode: 'path', src: '' }, cover: '' }, onSubmit: trackSubmit(null) });
    },
    'track-edit': function (el) {
      var t = getById(tracks(), el.dataset.id);
      if (!t) { toast('이미 삭제된 곡이에요.'); refreshMusicUI(); return; }
      openForm({ title: '곡 정보 수정', fields: trackFields(), values: { title: t.title, artist: t.artist, cover: t.cover, audio: { mode: t.session ? 'file' : 'path', src: t.src } }, onSubmit: trackSubmit(t) });
    },
    'track-del': function (el) {
      var id = el.dataset.id, t = getById(tracks(), id);
      if (!t) { refreshMusicUI(); return; }
      confirmDialog({ title: '곡 삭제', message: '“' + t.title + '”을(를) 재생 목록에서 삭제할까요?\n(배포 폴더의 음악 파일 자체는 지워지지 않아요)', okText: '삭제', danger: true }).then(function (ok) {
        if (!ok) return;
        if (!Store.update(function (d) { removeById(d.tracks, id); })) return;
        if (curId === id) stopAudio();
        if (sessionUrls[id]) { URL.revokeObjectURL(sessionUrls[id]); delete sessionUrls[id]; }
        toast('곡을 삭제했어요.'); refreshMusicUI();
      });
    },
    'track-up': function (el) { moveTrack(el.dataset.id, -1); },
    'track-down': function (el) { moveTrack(el.dataset.id, 1); },
    'track-play': function (el) { var t = getById(tracks(), el.dataset.id); if (t) { curId = t.id; playTrack(t); refreshMusicUI(); } },
    'track-toggle': function () { toggleTrack(); },
    'track-prev': function () { stepTrack(-1); },
    'track-next': function () { stepTrack(1); },
    'playlist-open': function () { openPlaylist(); },
    /* 설정 */
    'preset': function (el) {
      Store.patchSettings('accent', el.dataset.color);
      var i = $('#s-accent'); if (i) i.value = el.dataset.color;
      afterSetting();
    },
    'set-reset': function (el) {
      Store.patchSettings(el.dataset.key, '');
      afterSetting();
      var i = $('#s-' + el.dataset.key); if (i) i.value = colorFallback(el.dataset.key === 'bgColor' ? '--bg' : '--text');
      updateContrastNote();
    },
    'export-data': function () { exportData(); },
    'import-pick': function () { var f = $('#import-file'); if (f) f.click(); },
    'wipe': function (el) { wipeKind(el.dataset.kind); },
    'reset-settings': function () { resetSettings(); },
    'wipe-all': function () { wipeAll(); }
  };
  function moveTrack(id, dir) {
    var i = tracks().findIndex(function (t) { return t.id === id; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= tracks().length) { refreshMusicUI(); return; }
    if (Store.update(function (d) { var x = d.tracks.splice(i, 1)[0]; d.tracks.splice(j, 0, x); })) refreshMusicUI();
  }

  var INPUTS = {
    'char-search': function (t) { ui.charQ = t.value; renderCharList(); },
    'char-fav': function (t) { ui.charFav = t.checked; renderCharList(); },
    'pair-search': function (t) { ui.pairQ = t.value; renderPairList(); },
    'gb-search': function (t) { ui.gbQ = t.value; renderGbList(); },
    'seek': function (t) { if (audio && isFinite(audio.duration)) audio.currentTime = Number(t.value); },
    'volume': function (t) { var v = Number(t.value); if (audio) audio.volume = v; Store.patchSettings('volume', v); }
  };

  function bindEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el || el.disabled) return;
      var fn = ACTIONS[el.dataset.action];
      if (fn) fn(el, e);
    });
    function onInput(e) {
      var t = e.target;
      if (!t || !t.dataset) return;
      if (t.dataset.input && INPUTS[t.dataset.input]) INPUTS[t.dataset.input](t, e);
      if (t.dataset.set) onSetting(t);
    }
    document.addEventListener('input', onInput);
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.id === 'import-file') { importFile(t.files && t.files[0]); t.value = ''; return; }
      if (t && t.dataset && t.dataset.set && (t.type === 'checkbox' || t.type === 'radio' || t.tagName === 'SELECT')) onSetting(t);
    });
    document.addEventListener('submit', function (e) {
      var f = e.target.closest ? e.target.closest('[data-form]') : null;
      if (!f) return;
      e.preventDefault();
      if (f.dataset.form === 'gb-new') submitGuestbook(f);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalStack.length) { closeModal(topModal()); }
    });
    // 이미지가 깨지면(주소 오류 등) 기본 그림으로 대체
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && !t.dataset.fb) {
        t.dataset.fb = '1';
        t.src = t.closest('.cover, .pl-item') ? COVER_IMG : PLACEHOLDER_IMG;
      }
    }, true);
    window.addEventListener('hashchange', function () { closeAllModals(); route(); });
    window.addEventListener('beforeunload', function () { Store.flush(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') Store.flush(); });
  }

  function init() {
    Store.load();
    calInit();
    applyTheme();
    renderChrome();
    initAudio();
    bindEvents();
    route();
    if (Store.notice()) toast(Store.notice());
  }
  init();
})();
