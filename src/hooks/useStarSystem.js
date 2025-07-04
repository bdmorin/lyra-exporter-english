// hooks/useStarSystem.js
import { useState, useCallback, useEffect } from 'react';

export const useStarSystem = () => {
  // 星标状态存储：Map<conversationUuid, boolean>
  const [starredConversations, setStarredConversations] = useState(new Map());
  
  // 从 localStorage 加载星标数据
  const loadStars = useCallback(() => {
    try {
      const savedData = localStorage.getItem('starred_conversations');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setStarredConversations(new Map(Object.entries(parsed)));
      }
    } catch (error) {
      console.error('加载星标数据失败:', error);
    }
  }, []);
  
  // 保存星标数据到 localStorage
  const saveStars = useCallback((stars) => {
    try {
      const dataToSave = Object.fromEntries(stars);
      localStorage.setItem('starred_conversations', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('保存星标数据失败:', error);
    }
  }, []);
  
  // 初始化时加载数据
  useEffect(() => {
    loadStars();
  }, [loadStars]);
  
  // 检查对话是否已星标（包括原生星标和手动星标）
  const isStarred = useCallback((conversationUuid, nativeIsStarred = false) => {
    // 如果有手动设置的星标状态，使用手动状态
    if (starredConversations.has(conversationUuid)) {
      return starredConversations.get(conversationUuid);
    }
    // 否则使用原生星标状态
    return nativeIsStarred;
  }, [starredConversations]);
  
  // 切换星标状态
  const toggleStar = useCallback((conversationUuid, currentNativeState = false) => {
    setStarredConversations(prev => {
      const newStars = new Map(prev);
      
      // 获取当前显示的星标状态
      const currentState = isStarred(conversationUuid, currentNativeState);
      
      // 设置相反的状态
      newStars.set(conversationUuid, !currentState);
      
      // 保存到 localStorage
      saveStars(newStars);
      
      return newStars;
    });
  }, [isStarred, saveStars]);
  
  // 批量设置星标
  const setStarred = useCallback((conversationUuid, starred) => {
    setStarredConversations(prev => {
      const newStars = new Map(prev);
      newStars.set(conversationUuid, starred);
      saveStars(newStars);
      return newStars;
    });
  }, [saveStars]);
  
  // 清除所有手动星标设置（恢复到原生状态）
  const clearAllStars = useCallback(() => {
    setStarredConversations(new Map());
    localStorage.removeItem('starred_conversations');
  }, []);
  
  // 获取星标统计
  const getStarStats = useCallback((conversations = []) => {
    let totalStarred = 0;
    let manuallyStarred = 0;
    let nativeStarred = 0;
    
    conversations.forEach(conv => {
      const uuid = conv.uuid;
      const nativeState = conv.is_starred || false;
      const isCurrentlyStarred = isStarred(uuid, nativeState);
      
      if (isCurrentlyStarred) {
        totalStarred++;
      }
      
      if (nativeState) {
        nativeStarred++;
      }
      
      if (starredConversations.has(uuid) && starredConversations.get(uuid)) {
        manuallyStarred++;
      }
    });
    
    return {
      totalStarred,
      manuallyStarred,
      nativeStarred
    };
  }, [starredConversations, isStarred]);
  
  return {
    // 状态
    starredConversations,
    
    // 操作
    actions: {
      isStarred,
      toggleStar,
      setStarred,
      clearAllStars,
      getStarStats
    }
  };
};