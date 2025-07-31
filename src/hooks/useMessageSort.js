// hooks/useMessageSort.js
// Message sorting hook - Fixed version

import { useState, useCallback, useEffect, useRef } from 'react';

export const useMessageSort = (messages = [], fileUuid = '') => {
  const [sortedMessages, setSortedMessages] = useState(messages);
  const [customOrder, setCustomOrder] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // 使用ref来避免无限循环
  const messagesRef = useRef(messages);
  const prevFileUuid = useRef(fileUuid);

  // 从localStorage加载自定义排序
  useEffect(() => {
    if (fileUuid && fileUuid !== prevFileUuid.current) {
      prevFileUuid.current = fileUuid;
      const savedOrder = localStorage.getItem(`message_order_${fileUuid}`);
      if (savedOrder) {
        try {
          setCustomOrder(JSON.parse(savedOrder));
        } catch (e) {
          console.error('Failed to load message order:', e);
        }
      } else {
        setCustomOrder({});
      }
    }
  }, [fileUuid]);

  // 应用自定义排序 - 修复版本
  useEffect(() => {
    // 只在messages真正改变时更新
    const messagesChanged = messages !== messagesRef.current || 
                          messages.length !== messagesRef.current?.length ||
                          JSON.stringify(messages.map(m => m.index)) !== JSON.stringify(messagesRef.current?.map(m => m.index));
    
    if (messagesChanged) {
      messagesRef.current = messages;
      
      if (Object.keys(customOrder).length > 0 && messages.length > 0) {
        const sorted = [...messages].sort((a, b) => {
          const orderA = customOrder[a.index] ?? a.index;
          const orderB = customOrder[b.index] ?? b.index;
          return orderA - orderB;
        });
        
        // 只在排序结果真的不同时更新
        const currentIndexes = sortedMessages.map(m => m.index).join(',');
        const newIndexes = sorted.map(m => m.index).join(',');
        
        if (currentIndexes !== newIndexes) {
          setSortedMessages(sorted);
        }
      } else {
        setSortedMessages(messages);
      }
    }
  }, [messages, customOrder]); // 移除 sortedMessages 依赖

  // 保存排序到localStorage
  const saveOrder = useCallback((newOrder) => {
    if (fileUuid) {
      localStorage.setItem(`message_order_${fileUuid}`, JSON.stringify(newOrder));
    }
  }, [fileUuid]);

  // 重置排序
  const resetSort = useCallback(() => {
    setCustomOrder({});
    setSortedMessages(messagesRef.current);
    if (fileUuid) {
      localStorage.removeItem(`message_order_${fileUuid}`);
    }
  }, [fileUuid]);

  // 移动消息
  const moveMessage = useCallback((fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= sortedMessages.length) return;

    const newSortedMessages = [...sortedMessages];
    const [movedMessage] = newSortedMessages.splice(fromIndex, 1);
    newSortedMessages.splice(toIndex, 0, movedMessage);

    // 创建新的排序映射
    const newOrder = {};
    newSortedMessages.forEach((msg, idx) => {
      newOrder[msg.index] = idx;
    });

    setCustomOrder(newOrder);
    setSortedMessages(newSortedMessages);
    saveOrder(newOrder);
  }, [sortedMessages, saveOrder]);

  // 拖拽开始
  const dragStart = useCallback((e, index) => {
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }, []);

  // 拖拽结束
  const dragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedIndex(null);
  }, []);

  // 拖拽经过
  const dragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 放置处理
  const drop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSortedMessages = [...sortedMessages];
    const [movedMessage] = newSortedMessages.splice(draggedIndex, 1);
    newSortedMessages.splice(dropIndex, 0, movedMessage);

    // 创建新的排序映射
    const newOrder = {};
    newSortedMessages.forEach((msg, idx) => {
      newOrder[msg.index] = idx;
    });

    setCustomOrder(newOrder);
    setSortedMessages(newSortedMessages);
    saveOrder(newOrder);
    
    setDraggedIndex(null);
    setIsDragging(false);
  }, [draggedIndex, sortedMessages, saveOrder]);

  // 启用排序
  const enableSort = useCallback(() => {
    if (Object.keys(customOrder).length === 0 && messagesRef.current.length > 0) {
      const initialOrder = {};
      messagesRef.current.forEach((msg, idx) => {
        initialOrder[msg.index] = idx;
      });
      
      setCustomOrder(initialOrder);
      saveOrder(initialOrder);
    }
  }, [customOrder, saveOrder]);

  // 获取消息的自定义位置
  const getMessagePosition = useCallback((messageIndex) => {
    return customOrder[messageIndex] ?? messageIndex;
  }, [customOrder]);

  // 批量排序（用于高级排序功能）
  const batchSort = useCallback((sortFunction) => {
    const newSortedMessages = [...messagesRef.current].sort(sortFunction);
    
    const newOrder = {};
    newSortedMessages.forEach((msg, idx) => {
      newOrder[msg.index] = idx;
    });
    
    setCustomOrder(newOrder);
    setSortedMessages(newSortedMessages);
    saveOrder(newOrder);
  }, [saveOrder]);

  return {
    sortedMessages,
    customOrder,
    isDragging,
    hasCustomSort: Object.keys(customOrder).length > 0,
    actions: {
      resetSort,
      moveMessage,
      enableSort,
      dragStart,
      dragEnd,
      dragOver,
      drop,
      getMessagePosition,
      batchSort
    }
  };
};