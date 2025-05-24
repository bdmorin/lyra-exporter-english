// hooks/useMessageSort.js
// 消息排序Hook

import { useState, useCallback, useEffect, useRef } from 'react';

export const useMessageSort = (messages = [], fileUuid = '') => {
  const [sortedMessages, setSortedMessages] = useState(messages);
  const [customOrder, setCustomOrder] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // 使用ref来避免无限循环
  const messagesRef = useRef(messages);
  const prevMessagesLength = useRef(messages.length);

  // 从localStorage加载自定义排序
  useEffect(() => {
    if (fileUuid) {
      const savedOrder = localStorage.getItem(`message_order_${fileUuid}`);
      if (savedOrder) {
        try {
          setCustomOrder(JSON.parse(savedOrder));
        } catch (e) {
          console.error('Failed to load message order:', e);
        }
      }
    }
  }, [fileUuid]);

  // 应用自定义排序 - 只在messages真正改变时更新
  useEffect(() => {
    // 检查messages是否真正改变了（长度或内容）
    if (messages.length !== prevMessagesLength.current || 
        JSON.stringify(messages) !== JSON.stringify(messagesRef.current)) {
      messagesRef.current = messages;
      prevMessagesLength.current = messages.length;
      
      if (Object.keys(customOrder).length > 0) {
        const sorted = [...messages].sort((a, b) => {
          const orderA = customOrder[a.index] ?? a.index;
          const orderB = customOrder[b.index] ?? b.index;
          return orderA - orderB;
        });
        setSortedMessages(sorted);
      } else {
        setSortedMessages(messages);
      }
    }
  }, [messages, customOrder]);

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

  // 移动消息（上下移动）
  const moveMessage = useCallback((fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= sortedMessages.length) return;

    const newSortedMessages = [...sortedMessages];
    const [movedMessage] = newSortedMessages.splice(fromIndex, 1);
    newSortedMessages.splice(toIndex, 0, movedMessage);

    // 更新自定义排序
    const newOrder = {};
    newSortedMessages.forEach((msg, idx) => {
      newOrder[msg.index] = idx;
    });

    setCustomOrder(newOrder);
    setSortedMessages(newSortedMessages);
    saveOrder(newOrder);
  }, [sortedMessages, saveOrder]);

  return {
    sortedMessages,
    customOrder,
    isDragging,
    hasCustomSort: Object.keys(customOrder).length > 0,
    actions: {
      resetSort,
      moveMessage
    }
  };
};