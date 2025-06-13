// hooks/useFileUuid.js
// 统一管理文件和对话的UUID生成逻辑
import { useMemo } from 'react';

export const useFileUuid = (viewMode, selectedFileIndex, selectedConversationUuid, processedData) => {
  return useMemo(() => {
    // 在时间线模式下
    if (viewMode === 'timeline' && selectedFileIndex !== null) {
      if (selectedConversationUuid && processedData?.format === 'claude_full_export') {
        // claude_full_export格式的对话：使用 fileIndex-conversationUuid
        return `${selectedFileIndex}-${selectedConversationUuid}`;
      } else {
        // 普通文件：使用 file-fileIndex
        return `file-${selectedFileIndex}`;
      }
    }
    
    return null;
  }, [viewMode, selectedFileIndex, selectedConversationUuid, processedData]);
};

// 生成文件卡片的UUID
export const generateFileCardUuid = (fileIndex) => {
  return `file-${fileIndex}`;
};

// 生成对话卡片的UUID
export const generateConversationCardUuid = (fileIndex, conversationUuid) => {
  return `${fileIndex}-${conversationUuid}`;
};

// 解析UUID获取文件索引和对话UUID
export const parseUuid = (uuid) => {
  if (!uuid) return { fileIndex: null, conversationUuid: null };
  
  if (uuid.startsWith('file-')) {
    // 普通文件格式
    const fileIndex = parseInt(uuid.replace('file-', ''));
    return { fileIndex, conversationUuid: null };
  } else {
    // claude_full_export对话格式
    const parts = uuid.split('-');
    if (parts.length >= 2) {
      const fileIndex = parseInt(parts[0]);
      const conversationUuid = parts.slice(1).join('-'); // 处理UUID中可能包含的'-'
      return { fileIndex, conversationUuid };
    }
  }
  
  return { fileIndex: null, conversationUuid: null };
};