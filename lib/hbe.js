/**
 * hbe.js —— Hexo Blog Encrypt 插件前端脚本
 * 在解密后立即显示 TOC 并触发事件，方便主题侧做二次渲染
 */

;(function () {
  'use strict';

  // 工具函数：将十六进制字符串转换为 Uint8Array
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // 解密主逻辑
  async function decrypt(decryptKey, iv, hmacKey) {
    try {
      // 获取加密内容及 HMAC
      const container = document.getElementById('hexo-blog-encrypt');
      const encData = container.getAttribute('data-enc');
      const encHmac = container.getAttribute('data-hmac');

      // 验证 HMAC
      const keyHmac = await crypto.subtle.importKey(
        'raw', hexToBytes(hmacKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
      );
      const valid = await crypto.subtle.verify(
        'HMAC', keyHmac, hexToBytes(encHmac), hexToBytes(encData)
      );
      if (!valid) throw new Error('HMAC 验证失败');

      // 解密
      const keyAes = await crypto.subtle.importKey(
        'raw', hexToBytes(decryptKey), { name: 'AES-CBC' }, false, ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: hexToBytes(iv) },
        keyAes,
        hexToBytes(encData)
      );
      const decText = new TextDecoder().decode(decrypted);

      // 将解密后的 HTML 插入页面
      container.innerHTML = decText;

      // —— 立即显示所有可能的 TOC 容器 —— 
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

      // 触发主题侧解密事件，便于二次渲染或样式调整
      window.dispatchEvent(new Event('hexo-blog-decrypt'));

    } catch (err) {
      console.error('[hexo-blog-encrypt] 解密失败：', err);
    }
  }

  // 获取解密信息并调用
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hexo-blog-encrypt');
    if (!container) return;

    const decryptKey = container.getAttribute('data-key');
    const iv = container.getAttribute('data-iv');
    const hmacKey = container.getAttribute('data-hmac-key');

    // 如果存在密钥信息，则开始解密
    if (decryptKey && iv && hmacKey) {
      decrypt(decryptKey, iv, hmacKey);
    }
  });

})();
