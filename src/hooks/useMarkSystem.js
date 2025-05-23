// hook/useMarkSystem.js
import { useState, useCallback, useEffect } from 'react';
import { MARK_TYPES, STORAGE_KEYS } from '../utils/constants';

export const useMarkSystem = (fileUuid) => {
  const [marks, setMarks] = useState({
    [MARK_TYPES.COMPLETED]: new Set(),
    [MARK_TYPES.IMPORTANT]: new Set(),
    [MARK_TYPES.DELETED]: new Set()
  });

  // 从localStorage加载标记
  const loadMarks = useCallback(() => {
    if (!fileUuid) return;

    try {
      const savedData = localStorage.getItem(`${STORAGE_KEYS.MARKS_PREFIX}${fileUuid}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setMarks({
          [MARK_TYPES.COMPLETED]: new Set(parsed.completed || []),
          [MARK_TYPES.IMPORTANT]: new Set(parsed.important || []),
          [MARK_TYPES.DELETED]: new Set(parsed.deleted || [])
        });
      }
    } catch (error) {
      console.error('加载标记失败:', error);
    }
  }, [fileUuid]);

  // 保存标记到localStorage
  const saveMarks = useCallback(() => {
    if (!fileUuid) return;

    try {
      const dataToSave = {
        completed: Array.from(marks[MARK_TYPES.COMPLETED]),
        important: Array.from(marks[MARK_TYPES.IMPORTANT]),
        deleted: Array.from(marks[MARK_TYPES.DELETED]),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(
        `${STORAGE_KEYS.MARKS_PREFIX}${fileUuid}`,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error('保存标记失败:', error);
    }
  }, [fileUuid, marks]);

  // 文件改变时加载标记
  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  // 标记改变时保存
  useEffect(() => {
    if (fileUuid) {
      saveMarks();
    }
  }, [marks, saveMarks, fileUuid]);

  // 切换标记
  const toggleMark = useCallback((messageIndex, markType) => {
    setMarks(prevMarks => {
      const newMarks = { ...prevMarks };
      
      // 创建新的Set以触发更新
      Object.keys(newMarks).forEach(type => {
        newMarks[type] = new Set(newMarks[type]);
      });

      if (markType === MARK_TYPES.DELETED) {
        // 删除标记互斥
        newMarks[MARK_TYPES.COMPLETED].delete(messageIndex);
        newMarks[MARK_TYPES.IMPORTANT].delete(messageIndex);
        
        if (newMarks[MARK_TYPES.DELETED].has(messageIndex)) {
          newMarks[MARK_TYPES.DELETED].delete(messageIndex);
        } else {
          newMarks[MARK_TYPES.DELETED].add(messageIndex);
        }
      } else {
        // 完成和重要标记不能应用于已删除的消息
        if (newMarks[MARK_TYPES.DELETED].has(messageIndex)) {
          return prevMarks;
        }

        if (newMarks[markType].has(messageIndex)) {
          newMarks[markType].delete(messageIndex);
        } else {
          newMarks[markType].add(messageIndex);
        }
      }

      return newMarks;
    });
  }, []);

  // 批量标记
  const batchMark = useCallback((messageIndices, markType) => {
    setMarks(prevMarks => {
      const newMarks = { ...prevMarks };
      
      // 创建新的Set
      Object.keys(newMarks).forEach(type => {
        newMarks[type] = new Set(newMarks[type]);
      });

      messageIndices.forEach(index => {
        if (markType === MARK_TYPES.DELETED) {
          newMarks[MARK_TYPES.COMPLETED].delete(index);
          newMarks[MARK_TYPES.IMPORTANT].delete(index);
          newMarks[MARK_TYPES.DELETED].add(index);
        } else {
          if (!newMarks[MARK_TYPES.DELETED].has(index)) {
            newMarks[markType].add(index);
          }
        }
      });

      return newMarks;
    });
  }, []);

  // 清除所有标记
  const clearAllMarks = useCallback(() => {
    setMarks({
      [MARK_TYPES.COMPLETED]: new Set(),
      [MARK_TYPES.IMPORTANT]: new Set(),
      [MARK_TYPES.DELETED]: new Set()
    });
  }, []);

  // 清除特定类型的标记
  const clearMarksByType = useCallback((markType) => {
    setMarks(prevMarks => ({
      ...prevMarks,
      [markType]: new Set()
    }));
  }, []);

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

  // 检查消息是否被标记
  const isMarked = useCallback((messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  }, [marks]);

  return {
    // 状态
    marks,
    stats: getMarkStats(),
    
    // 操作
    actions: {
      toggleMark,
      batchMark,
      clearAllMarks,
      clearMarksByType,
      isMarked
    }
  };
};