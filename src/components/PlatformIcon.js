import React, { useState, useEffect } from 'react';

// 平台图标映射 - 使用多个备选源和base64后备
const PLATFORM_ICONS = {
  claude: {
    sources: [
      'https://www.anthropic.com/favicon.ico',
      'https://claude.ai/favicon.ico',
      'https://www.google.com/s2/favicons?sz=32&domain=claude.ai'
    ],
    // Claude的base64图标（简化版橙色圆圈）
    base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEOTczMUYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik04IDJDNC42ODYgMiAyIDQuNjg2IDIgOEM2IDExLjMxNCA4LjY4NiAxNCA4IDE0QzExLjMxNCAxNCAxNCA4LjY4NiAxNCA4QzE0IDQuNjg2IDExLjMxNCAyIDggMloiIGZpbGw9IndoaXRlIi8+CjwvcGF0aD4KPC9zdmc+Cjwvc3ZnPg=='
  },
  gemini: {
    sources: [
      'https://ssl.gstatic.com/lamda/images/gemini_android_icon_24dp_9b8cf66e9d9eaacae59aa96df9e0f63b2c8bd50b.png',
      'https://www.gstatic.com/lamda/images/gemini_sparkle_red_4ed1cbfcbc6c9e84c31b987da73fc4168aec8445.svg',
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.google.com/s2/favicons?sz=32&domain=gemini.google.com')
    ],
    fallback: '✨',
    // Gemini的base64图标（蓝色星形）
    base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxQTczRTgiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMCAyTDEyLjA5IDcuMjZMMTggOEwxMi4wOSA4Ljc0TDEwIDE0TDcuOTEgOC43NEwyIDhMNy45MSA3LjI2TDEwIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTAgMTBMMTEuMDkgMTIuMjZMMTQgMTNMMTEuMDkgMTMuNzRMMTAgMTZMOC45MSAxMy43NEw2IDEzTDguOTEgMTIuMjZMMTAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
  },
  notebooklm: {
    sources: [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.google.com/s2/favicons?sz=32&domain=notebooklm.google')
    ],
    fallback: '✨',
    base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxQTczRTgiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMCAyTDEyLjA5IDcuMjZMMTggOEwxMi4wOSA4Ljc0TDEwIDE0TDcuOTEgOC43NEwyIDhMNy45MSA3LjI2TDEwIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTAgMTBMMTEuMDkgMTIuMjZMMTQgMTNMMTEuMDkgMTMuNzRMMTAgMTZMOC45MSAxMy43NEw2IDEzTDguOTEgMTIuMjZMMTAgMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+'
  }
};

// 版本号用于缓存刷新
const CACHE_VERSION = 'v4'; // 增加版本号强制刷新

// 调试模式
const DEBUG_MODE = false; // 关闭调试以减少控制台输出

// 全局函数：强制清除所有平台图标缓存
window.clearPlatformIconCache = () => {
  let clearedCount = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('platform_icon_')) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  }
  console.log(`%c[PlatformIcon] 强制清理了 ${clearedCount} 个图标缓存`, 'color: #1A73E8; font-weight: bold');
  console.log(`%c[PlatformIcon] 页面将在 2 秒后自动刷新...`, 'color: #4B5563');
  // 延迟刷新以显示消息
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// 全局函数：显示当前图标缓存状态
window.showPlatformIconStatus = () => {
  const iconKeys = ['claude', 'gemini', 'notebooklm'];
  const currentVersion = CACHE_VERSION;
  
  console.log(`%c[PlatformIcon] 当前版本: ${currentVersion}`, 'color: #1A73E8; font-weight: bold');
  console.log('%c[PlatformIcon] 缓存状态:', 'color: #1A73E8; font-weight: bold');
  
  iconKeys.forEach(iconKey => {
    const cacheKey = `platform_icon_${iconKey}_${currentVersion}_16`;
    const cached = localStorage.getItem(cacheKey);
    
    let status = '❓ 未缓存';
    let color = '#666';
    
    if (cached === 'use_base64') {
      status = '🎨 使用Base64图标';
      color = '#1A73E8';
    } else if (cached === 'failed') {
      status = '❌ 加载失败';
      color = '#DC2626';
    } else if (cached && cached.startsWith('data:image')) {
      status = '✅ 缓存成功';
      color = '#059669';
    }
    
    console.log(`%c  ${iconKey}: ${status}`, `color: ${color}`);
  });
  
  console.log('%c调试命令:', 'color: #1A73E8; font-weight: bold');
  console.log('%c  clearPlatformIconCache() - 清除所有缓存并刷新', 'color: #666');
  console.log('%c  showPlatformIconStatus() - 显示当前状态', 'color: #666');
};

const PlatformIcon = ({ platform, format, size = 16, style = {} }) => {
  const [iconSrc, setIconSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  // 根据format和platform确定使用哪个图标
  const getIconKey = () => {
    if (format === 'gemini_notebooklm') {
      if (platform === 'notebooklm') return 'notebooklm';
      // 支持多种 Gemini 平台名称
      if (platform === 'gemini' || platform === 'aistudio' || platform === 'google ai studio') {
        return 'gemini';
      }
      return 'gemini'; // 默认为gemini
    }
    return 'claude';
  };

  const iconKey = getIconKey();
  const iconConfig = PLATFORM_ICONS[iconKey];

  useEffect(() => {
    // 改进的缓存key，包含版本号和尺寸
    const cacheKey = `platform_icon_${iconKey}_${CACHE_VERSION}_${size}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (DEBUG_MODE) {
      console.log(`[PlatformIcon] 初始化: platform=${platform}, format=${format}, iconKey=${iconKey}`);
    }
    
    // 检查缓存是否有效
    if (cached && cached !== 'failed' && (cached.startsWith('data:image') || cached === 'use_base64')) {
      if (cached === 'use_base64') {
        // 使用base64图标
        setIconSrc(iconConfig.base64);
        setHasError(false);
        if (DEBUG_MODE) console.log(`[PlatformIcon] 使用缓存base64: ${iconKey}`);
      } else {
        // 使用缓存的图标
        setIconSrc(cached);
        setHasError(false);
        if (DEBUG_MODE) console.log(`[PlatformIcon] 使用缓存图标: ${iconKey}`);
      }
      return;
    }
    
    // 如果缓存显示失败过，直接使用base64图标
    if (cached === 'failed') {
      setIconSrc(iconConfig.base64);
      setHasError(false);
      if (DEBUG_MODE) console.log(`[PlatformIcon] 缓存失败，使用base64: ${iconKey}`);
      return;
    }

    // 清除旧缓存
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`platform_icon_${iconKey}_`) && !key.includes(CACHE_VERSION)) {
        localStorage.removeItem(key);
      }
    }

    // 重置状态
    setIconSrc(null);
    setHasError(false);

    // 尝试加载图标的函数
    const tryLoadIcon = async () => {
      if (DEBUG_MODE) console.log(`[PlatformIcon] 开始尝试加载: ${iconKey}`);
      
      // 尝试所有源
      for (let i = 0; i < iconConfig.sources.length; i++) {
        const url = iconConfig.sources[i];
        if (DEBUG_MODE) console.log(`[PlatformIcon] 尝试源 ${i + 1}/${iconConfig.sources.length}: ${url}`);
        
        try {
          const success = await tryLoadFromUrl(url, cacheKey, iconKey);
          if (success) {
            if (DEBUG_MODE) console.log(`[PlatformIcon] 成功加载: ${iconKey} from ${url}`);
            return;
          }
        } catch (error) {
          if (DEBUG_MODE) console.warn(`[PlatformIcon] 源 ${i + 1} 失败:`, error);
          continue;
        }
      }
      
      // 所有源都失败，使用base64图标
      if (DEBUG_MODE) console.log(`[PlatformIcon] 所有源都失败，使用base64: ${iconKey}`);
      setIconSrc(iconConfig.base64);
      setHasError(false);
      localStorage.setItem(cacheKey, 'use_base64');
    };

    tryLoadIcon();
  }, [iconKey, iconConfig, size]);

  // 尝试从单个URL加载图标
  const tryLoadFromUrl = (url, cacheKey, iconKey) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, 3000); // 3秒超时，更快切换到下一个源
      
      img.onload = () => {
        clearTimeout(timeoutId);
        
        // 转换为base64
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        try {
          ctx.drawImage(img, 0, 0, 32, 32);
          const dataUrl = canvas.toDataURL('image/png');
          setIconSrc(dataUrl);
          localStorage.setItem(cacheKey, dataUrl);
          setHasError(false);
          resolve(true);
        } catch (error) {
          resolve(false);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };
      
      img.src = url;
    });
  };

  // 显示fallback或真实图标
  if (!iconSrc || hasError) {
    return (
      <span 
        style={{ 
          fontSize: size,
          lineHeight: 1,
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style 
        }}
      >
        {iconConfig.fallback}
      </span>
    );
  }

  return (
    <img 
      src={iconSrc}
      alt={iconKey}
      style={{ 
        width: size, 
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '2px', // 轻微圆角
        ...style 
      }}
      onError={() => {
        // 如果显示错误，尝试使用base64后备
        if (iconSrc !== iconConfig.base64) {
          setIconSrc(iconConfig.base64);
        } else {
          // base64也失败了，使用emoji
          setHasError(true);
        }
      }}
    />
  );
};

export default PlatformIcon;