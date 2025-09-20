// source/js/theme-toggle.js
(function () {
  var storageKey = 'cactus-colorscheme';
  var linkId = 'cactus-theme-override';
  var btnId = 'theme-toggle';
  var darkName = 'dark';
  var lightName = 'light';

  function getLink() {
    return document.getElementById(linkId);
  }

  function setScheme(name) {
    // name 例如 'dark' 或 'light'
    var href = (typeof __hexo !== 'undefined') ? '/css/' + name + '-override.css' : (window.location.origin + '/css/' + name + '-override.css');
    // Create or replace link
    var link = getLink();
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = href;
      // append to head
      document.getElementsByTagName('head')[0].appendChild(link);
    } else {
      link.href = href;
    }
    try { localStorage.setItem(storageKey, name); } catch (e) {}
    updateButton(name);
  }

  function updateButton(name) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.textContent = (name === darkName) ? '☀️' : '🌙';
  }

  document.addEventListener('DOMContentLoaded', function () {
    // 初始化：读取 localStorage 或使用默认 light
    var saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (e) {}
    if (saved) {
      // 延迟一点添加（如果 inline 已处理，可能重复但无害）
      setScheme(saved);
    } else {
      updateButton(lightName);
    }

    // 绑定按钮
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = null;
      try { current = localStorage.getItem(storageKey); } catch (e) {}
      if (!current) current = lightName;
      var next = (current === darkName) ? lightName : darkName;
      setScheme(next);
    });
  });
})();
