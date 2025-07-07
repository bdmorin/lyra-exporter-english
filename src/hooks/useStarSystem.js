// hooks/useStarSystem.js
import { useState, useEffect, useCallback } from 'react';

const STAR_STORAGE_PREFIX = 'starred_conversations_';
const STAR_STORAGE_VERSION = 'v1';

export const useStarSystem = (enabled = true) => {
  // 存储所有手动设置的星标状态
  // Map结构: conversationUuid -> boolean (true表示已星标，false表示取消星标)
  const [starredConversations, setStarredConversations] = useState(new Map());

  // 从 localStorage 加载星标数据
  useEffect(() => {
    if (!enabled) return;

    try {
      const storageKey = `${STAR_STORAGE_PREFIX}${STAR_STORAGE_VERSION}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // 转换为 Map
        const starMap = new Map(Object.entries(parsed));
        setStarredConversations(starMap);
        console.log(`[StarSystem] 加载了 ${starMap.size} 个星标设置`);
      }
    } catch (error) {
      console.error('[StarSystem] 加载星标数据失败:', error);
    }
  }, [enabled]);

  // 保存星标数据到 localStorage
  const saveToStorage = useCallback((starMap) => {
    if (!enabled) return;

    try {
      const storageKey = `${STAR_STORAGE_PREFIX}${STAR_STORAGE_VERSION}`;
      // 转换 Map 为普通对象
      const dataToSave = Object.fromEntries(starMap);
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(`[StarSystem] 保存了 ${starMap.size} 个星标设置`);
    } catch (error) {
      console.error('[StarSystem] 保存星标数据失败:', error);
    }
  }, [enabled]);

  // 切换星标状态
  const toggleStar = useCallback((conversationUuid, nativeIsStarred = false) => {
    if (!enabled) return;

    setStarredConversations(prev => {
      const newMap = new Map(prev);
      
      // 获取当前的实际星标状态
      const currentStarred = isStarred(conversationUuid, nativeIsStarred);
      
      if (currentStarred) {
        // 当前是星标状态，需要取消星标
        if (nativeIsStarred) {
          // 原生是星标，我们需要记录为 false 来覆盖
          newMap.set(conversationUuid, false);
        } else {
          // 原生不是星标，我们之前设置为 true，现在删除这个设置
          newMap.delete(conversationUuid);
        }
      } else {
        // 当前不是星标状态，需要添加星标
        if (!nativeIsStarred) {
          // 原生不是星标，我们需要记录为 true
          newMap.set(conversationUuid, true);
        } else {
          // 原生是星标但被我们覆盖为 false，现在删除这个覆盖
          newMap.delete(conversationUuid);
        }
      }
      
      // 保存到 localStorage
      saveToStorage(newMap);
      
      return newMap;
    });
  }, [enabled, saveToStorage]);

  // 检查对话是否被星标（考虑手动覆盖）
  const isStarred = useCallback((conversationUuid, nativeIsStarred = false) => {
    if (!enabled) return nativeIsStarred;

    // 如果有手动设置，使用手动设置的值
    if (starredConversations.has(conversationUuid)) {
      return starredConversations.get(conversationUuid);
    }
    
    // 否则使用原生值
    return nativeIsStarred;
  }, [enabled, starredConversations]);

  // 清除所有手动星标设置（恢复到原生状态）
  const clearAllStars = useCallback(() => {
    if (!enabled) return;

    const confirmed = window.confirm(
      '确定要恢复所有对话的原始星标状态吗？\n' +
      '这将清除您手动设置的所有星标更改。'
    );
    
    if (confirmed) {
      setStarredConversations(new Map());
      const storageKey = `${STAR_STORAGE_PREFIX}${STAR_STORAGE_VERSION}`;
      localStorage.removeItem(storageKey);
      console.log('[StarSystem] 已清除所有手动星标设置');
    }
  }, [enabled]);

  // 获取星标统计
  const getStarStats = useCallback((conversations) => {
    if (!enabled) return { totalStarred: 0, manuallyStarred: 0, manuallyUnstarred: 0 };

    let totalStarred = 0;
    let manuallyStarred = 0;
    let manuallyUnstarred = 0;

    conversations.forEach(conv => {
      const nativeIsStarred = conv.is_starred || false;
      const actualIsStarred = isStarred(conv.uuid, nativeIsStarred);
      
      if (actualIsStarred) {
        totalStarred++;
      }
      
      // 统计手动更改
      if (starredConversations.has(conv.uuid)) {
        const manualValue = starredConversations.get(conv.uuid);
        if (manualValue && !nativeIsStarred) {
          manuallyStarred++;
        } else if (!manualValue && nativeIsStarred) {
          manuallyUnstarred++;
        }
      }
    });

    return {
      totalStarred,
      manuallyStarred,
      manuallyUnstarred
    };
  }, [enabled, starredConversations, isStarred]);

  // 导出星标数据（用于备份）
  const exportStarData = useCallback(() => {
    if (!enabled) return null;

    return {
      version: STAR_STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: Object.fromEntries(starredConversations)
    };
  }, [enabled, starredConversations]);

  // 导入星标数据（用于恢复）
  const importStarData = useCallback((data) => {
    if (!enabled) return false;

    try {
      if (data && data.version === STAR_STORAGE_VERSION && data.data) {
        const starMap = new Map(Object.entries(data.data));
        setStarredConversations(starMap);
        saveToStorage(starMap);
        console.log(`[StarSystem] 导入了 ${starMap.size} 个星标设置`);
        return true;
      }
    } catch (error) {
      console.error('[StarSystem] 导入星标数据失败:', error);
    }
    return false;
  }, [enabled, saveToStorage]);

  return {
    starredConversations,
    actions: {
      toggleStar,
      isStarred,
      clearAllStars,
      getStarStats,
      exportStarData,
      importStarData
    }
  };
};