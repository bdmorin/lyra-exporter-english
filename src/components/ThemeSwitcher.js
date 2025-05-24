// components/ThemeSwitcher.js
import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取主题设置
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    // 应用主题
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      className="theme-switcher"
      onClick={toggleTheme}
      title={theme === 'dark' ? '切换到马卡龙主题' : '切换到暗色主题'}
    >
      {theme === 'dark' ? '🌙' : '🧁'}
    </button>
  );
};

export default ThemeSwitcher;