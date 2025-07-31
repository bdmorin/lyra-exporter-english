import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// Search debounce delay
const SEARCH_DEBOUNCE_MS = 300;

export const useSearch = (messages = []) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [isSearching, setIsSearching] = useState(false);
  
  // 使用 ref 来跟踪 messages 的变化，避免无限循环
  const messagesRef = useRef(messages);
  const prevMessagesLength = useRef(messages.length);

  // 搜索函数 - 筛选模式
  const performSearch = useCallback((searchText, messageList) => {
    if (!searchText.trim()) {
      setResults([]);
      setFilteredMessages(messageList);
      return;
    }

    const lowerQuery = searchText.toLowerCase();
    const searchResults = [];
    const filtered = [];

    messageList.forEach((message, index) => {
      const matches = [];
      let shouldInclude = false;

      // 搜索主要内容
      if (message.display_text?.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: 'content',
          text: message.display_text,
          excerpt: getExcerpt(message.display_text, lowerQuery)
        });
        shouldInclude = true;
      }

      // 搜索思考过程
      if (message.thinking?.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: 'thinking',
          text: message.thinking,
          excerpt: getExcerpt(message.thinking, lowerQuery)
        });
        shouldInclude = true;
      }

      // 搜索artifacts
      if (message.artifacts && message.artifacts.length > 0) {
        message.artifacts.forEach((artifact, artifactIndex) => {
          if (artifact.content?.toLowerCase().includes(lowerQuery) ||
              artifact.title?.toLowerCase().includes(lowerQuery)) {
            matches.push({
              type: 'artifact',
              artifactIndex,
              text: artifact.content || artifact.title,
              excerpt: getExcerpt(artifact.content || artifact.title, lowerQuery)
            });
            shouldInclude = true;
          }
        });
      }

      // 搜索对话标题和项目名（对于对话开始标记）
      if (message.is_conversation_header) {
        if (message.conversation_name?.toLowerCase().includes(lowerQuery) ||
            message.project_name?.toLowerCase().includes(lowerQuery) ||
            message.display_text?.toLowerCase().includes(lowerQuery)) {
          shouldInclude = true;
          matches.push({
            type: 'header',
            text: message.display_text
          });
        }
      }

      // 对于文件和对话卡片的搜索
      if (message.type === 'file' || message.type === 'conversation') {
        const searchableText = [
          message.name,
          message.fileName,
          message.summary,
          message.model,
          message.platform
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchableText.includes(lowerQuery)) {
          shouldInclude = true;
          matches.push({
            type: 'card',
            text: message.name || message.fileName
          });
        }
      }

      if (shouldInclude) {
        filtered.push(message);
        searchResults.push({
          messageIndex: index,
          message,
          matches
        });
      }
    });

    setFilteredMessages(filtered);
    setResults(searchResults);
  }, []);

  // 获取搜索摘要
  const getExcerpt = useCallback((text, query) => {
    if (!text) return '';
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, 100) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    let excerpt = text.slice(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }, []);

  // 更新 messages 引用，但只在真正需要时
  useEffect(() => {
    // 检查 messages 是否真的改变了（不只是引用改变）
    const hasRealChange = messages.length !== prevMessagesLength.current ||
      !messages.every((msg, idx) => msg === messagesRef.current[idx]);
    
    if (hasRealChange) {
      messagesRef.current = messages;
      prevMessagesLength.current = messages.length;
      
      // 如果没有搜索查询，直接更新 filteredMessages
      if (!query.trim()) {
        setFilteredMessages(messages);
      }
    }
  }, [messages, query]);

  // 防抖搜索 - 只在 query 改变时触发
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setFilteredMessages(messagesRef.current);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      performSearch(query, messagesRef.current);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // 搜索操作
  const search = useCallback((searchText) => {
    setQuery(searchText);
  }, []);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setFilteredMessages(messagesRef.current);
  }, []);

  // 高亮文本
  const highlightText = useCallback((text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? `<mark key="${index}">${part}</mark>`
        : part
    ).join('');
  }, []);

  // 获取结果统计
  const resultStats = useMemo(() => {
    const totalMatches = results.reduce((acc, result) => 
      acc + result.matches.length, 0
    );
    
    return {
      messageCount: results.length,
      totalMatches,
      hasResults: results.length > 0
    };
  }, [results]);

  return {
    // 状态
    query,
    results,
    filteredMessages,
    isSearching,
    stats: resultStats,
    
    // 操作
    actions: {
      search,
      clearSearch,
      highlightText
    }
  };
};