// hooks/useMarkSystem.js
import { useState, useEffect, useCallback } from 'react';

// 标记类型常量
const MARK_TYPES = {
  COMPLETED: 'completed',
  IMPORTANT: 'important',
  DELETED: 'deleted'
};

export const useMarkSystem = (fileUuid) => {
  const [marks, setMarks] = useState({
    [MARK_TYPES.COMPLETED]: new Set(),
    [MARK_TYPES.IMPORTANT]: new Set(),
    [MARK_TYPES.DELETED]: new Set()
  });

  // 从 localStorage 加载标记数据
  useEffect(() => {
    if (!fileUuid) return;

    const storageKey = `marks_${fileUuid}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setMarks({
          [MARK_TYPES.COMPLETED]: new Set(parsed.completed || []),
          [MARK_TYPES.IMPORTANT]: new Set(parsed.important || []),
          [MARK_TYPES.DELETED]: new Set(parsed.deleted || [])
        });
      } catch (error) {
        console.error('Failed to load marks:', error);
      }
    }
  }, [fileUuid]); // 只依赖 fileUuid

  // 保存标记数据
  const saveMarks = useCallback((newMarks) => {
    if (!fileUuid) return;
    
    const storageKey = `marks_${fileUuid}`;
    const dataToSave = {
      completed: Array.from(newMarks[MARK_TYPES.COMPLETED]),
      important: Array.from(newMarks[MARK_TYPES.IMPORTANT]),
      deleted: Array.from(newMarks[MARK_TYPES.DELETED])
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [fileUuid]);

  // 切换标记
  const toggleMark = useCallback((messageIndex, markType) => {
    setMarks(prev => {
      const newMarks = {
        ...prev,
        [markType]: new Set(prev[markType])
      };

      if (newMarks[markType].has(messageIndex)) {
        newMarks[markType].delete(messageIndex);
      } else {
        newMarks[markType].add(messageIndex);
      }

      saveMarks(newMarks);
      return newMarks;
    });
  }, [saveMarks]);

  // 批量标记
  const batchMark = useCallback((messageIndexes, markType, isMarked) => {
    setMarks(prev => {
      const newMarks = {
        ...prev,
        [markType]: new Set(prev[markType])
      };

      messageIndexes.forEach(index => {
        if (isMarked) {
          newMarks[markType].add(index);
        } else {
          newMarks[markType].delete(index);
        }
      });

      saveMarks(newMarks);
      return newMarks;
    });
  }, [saveMarks]);

  // 清除所有标记
  const clearAllMarks = useCallback(() => {
    const emptyMarks = {
      [MARK_TYPES.COMPLETED]: new Set(),
      [MARK_TYPES.IMPORTANT]: new Set(),
      [MARK_TYPES.DELETED]: new Set()
    };
    
    setMarks(emptyMarks);
    saveMarks(emptyMarks);
  }, [saveMarks]);

  // 清除特定类型的标记
  const clearMarksByType = useCallback((markType) => {
    setMarks(prev => {
      const newMarks = {
        ...prev,
        [markType]: new Set()
      };
      
      saveMarks(newMarks);
      return newMarks;
    });
  }, [saveMarks]);

  // 检查是否已标记
  const isMarked = useCallback((messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  }, [marks]);

  // 获取标记统计
  const getMarkStats = useCallback(() => {
    return {
      completed: marks[MARK_TYPES.COMPLETED].size,
      important: marks[MARK_TYPES.IMPORTANT].size,
      deleted: marks[MARK_TYPES.DELETED].size,
      total: marks[MARK_TYPES.COMPLETED].size + 
             marks[MARK_TYPES.IMPORTANT].size + 
             marks[MARK_TYPES.DELETED].size
    };
  }, [marks]);

  return {
    marks,
    stats: getMarkStats(),
    actions: {
      toggleMark,
      batchMark,
      clearAllMarks,
      clearMarksByType,
      isMarked
    }
  };
};