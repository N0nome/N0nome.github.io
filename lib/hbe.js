/**
 * hbe.js —— Hexo Blog Encrypt 插件前端脚本（完整版）
 * 1. 在页面中插入密码输入框  
 * 2. 用户输入明文密码后，派生 AES/HMAC 密钥  
 * 3. 解密文章、显示内容  
 * 4. 解密后立即“解封”所有可能的 TOC 容器，并触发事件
 */

;(function () {
  'use strict';

  //—— 工具：十六进制字符串转 Uint8Array —— 
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  //—— 派生 AES + HMAC 密钥 —— 
  // 使用 CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 })
  function deriveKeys(password, saltHex) {
    // saltHex 来自 data-iv
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    const keySize = 256 / 32;
    const iter = 1000;
    const derived = CryptoJS.PBKDF2(password, salt, {
      keySize,
      iterations: iter,
      hasher: CryptoJS.algo.SHA256
    });
    const keyHex = derived.toString(CryptoJS.enc.Hex);
    return {
      decryptKey: keyHex,
      hmacKey: keyHex,
      iv: saltHex
    };
  }

  //—— 解密并插入 HTML + 显示 TOC —— 
  async function decrypt(decryptKey, iv, hmacKey) {
    try {
      const container = document.getElementById('hexo-blog-encrypt');
      const encData = container.getAttribute('data-enc');
      const encHmac = container.getAttribute('data-hmac');

      // HMAC 验证
      const keyHmac = await crypto.subtle.importKey(
        'raw', hexToBytes(hmacKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
      );
      const valid = await crypto.subtle.verify(
        'HMAC', keyHmac, hexToBytes(encHmac), hexToBytes(encData)
      );
      if (!valid) throw new Error('HMAC 验证失败');

      // AES-CBC 解密
      const keyAes = await crypto.subtle.importKey(
        'raw', hexToBytes(decryptKey), { name: 'AES-CBC' }, false, ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: hexToBytes(iv) },
        keyAes,
        hexToBytes(encData)
      );
      const decText = new TextDecoder().decode(decrypted);

      // 插入解密后内容
      container.innerHTML = decText;

      // —— 立即“解封”TOC —— 
      const selectors = [
        '#hexo-blog-encrypt .toc',
        '#hexo-blog-encrypt #toc',
        '#hexo-blog-encrypt .toc-container',
        '#hexo-blog-encrypt .toc-wrapper'
      ];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.display = 'block';
          el.style.visibility = 'visible';
        });
      });

      // 触发事件，方便主题侧二次渲染或动画
      window.dispatchEvent(new Event('hexo-blog-decrypt'));

    } catch (err) {
      console.error('[hexo-blog-encrypt] 解密失败：', err);
      alert('密码错误或内容损坏，解密失败');
    }
  }

  //—— 在页面插入“密码输入框 + 解密按钮” —— 
  function initUI() {
    const container = document.getElementById('hexo-blog-encrypt');
    if (!container) return;

    // 清空原始 container，插入输入控件
    container.innerHTML = '';
    container.style.textAlign = 'center';

    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = '请输入解密密码';
    input.style.padding = '6px';
    input.style.marginRight = '4px';

    const btn = document.createElement('button');
    btn.textContent = '解密';
    btn.style.padding = '6px 12px';
    btn.style.cursor = 'pointer';

    container.appendChild(input);
    container.appendChild(btn);

    btn.addEventListener('click', () => {
      const password = input.value;
      if (!password) return alert('请先输入密码');
      const { decryptKey, hmacKey, iv } = deriveKeys(
        password,
        container.getAttribute('data-iv')
      );
      decrypt(decryptKey, iv, hmacKey);
    });
  }

  //—— 等 DOM 读取完后，初始化 UI —— 
  document.addEventListener('DOMContentLoaded', initUI);

})();
