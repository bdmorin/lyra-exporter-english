// hooks/useFileUuid.js
// 统一管理文件和对话的UUID生成逻辑 - 修复版
import { useMemo } from 'react';

// 生成文件的唯一标识符（基于文件内容特征）
const generateFileHash = (file) => {
  if (!file) return '';
  // 使用文件名、大小和修改时间生成唯一标识
  const str = `${file.name}_${file.size}_${file.lastModified}`;
  // 简单的hash函数
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const useFileUuid = (viewMode, selectedFileIndex, selectedConversationUuid, processedData, files) => {
  // 只提取需要的属性，避免整个对象的依赖
  const format = processedData?.format;
  
  return useMemo(() => {
    // 在时间线模式下
    if (viewMode === 'timeline' && selectedFileIndex !== null && files && files[selectedFileIndex]) {
      const file = files[selectedFileIndex];
      const fileHash = generateFileHash(file);
      
      if (selectedConversationUuid && format === 'claude_full_export') {
        // claude_full_export格式的对话：使用 fileHash-conversationUuid
        return `${fileHash}-${selectedConversationUuid}`;
      } else {
        // 普通文件：使用 file-fileHash
        return `file-${fileHash}`;
      }
    }
    
    return null;
  }, [viewMode, selectedFileIndex, selectedConversationUuid, format, files]); // 只依赖 format，不依赖整个 processedData
};

// 生成文件卡片的UUID
export const generateFileCardUuid = (fileIndex, file) => {
  if (!file) return `file-${fileIndex}`; // 降级方案
  const fileHash = generateFileHash(file);
  return `file-${fileHash}`;
};

// 生成对话卡片的UUID
export const generateConversationCardUuid = (fileIndex, conversationUuid, file) => {
  if (!file) return `${fileIndex}-${conversationUuid}`; // 降级方案
  const fileHash = generateFileHash(file);
  return `${fileHash}-${conversationUuid}`;
};

// 解析UUID获取文件索引和对话UUID
export const parseUuid = (uuid) => {
  if (!uuid) return { fileIndex: null, conversationUuid: null };
  
  if (uuid.startsWith('file-')) {
    // 普通文件格式 - 注意这里无法反向解析出fileIndex了
    // 需要在调用处通过其他方式获取
    return { fileHash: uuid.replace('file-', ''), conversationUuid: null };
  } else {
    // claude_full_export对话格式
    const parts = uuid.split('-');
    if (parts.length >= 2) {
      const fileHash = parts[0];
      const conversationUuid = parts.slice(1).join('-'); // 处理UUID中可能包含的'-'
      return { fileHash, conversationUuid };
    }
  }
  
  return { fileHash: null, conversationUuid: null };
};