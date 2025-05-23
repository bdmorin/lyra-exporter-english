import { useState, useCallback, useEffect, useMemo } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../utils/constants';

export const useSearch = (messages = []) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 搜索函数
  const performSearch = useCallback((searchText, messageList) => {
    if (!searchText.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchText.toLowerCase();
    const searchResults = [];

    messageList.forEach((message, index) => {
      const matches = [];

      // 搜索主要内容
      if (message.display_text?.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: 'content',
          text: message.display_text,
          excerpt: getExcerpt(message.display_text, lowerQuery)
        });
      }

      // 搜索思考过程
      if (message.thinking?.toLowerCase().includes(lowerQuery)) {
        matches.push({
          type: 'thinking',
          text: message.thinking,
          excerpt: getExcerpt(message.thinking, lowerQuery)
        });
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
          }
        });
      }

      if (matches.length > 0) {
        searchResults.push({
          messageIndex: index,
          message,
          matches
        });
      }
    });

    setResults(searchResults);
  }, []);

  // 获取搜索摘要
  const getExcerpt = (text, query) => {
    if (!text) return '';
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, 100) + '...';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    let excerpt = text.slice(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(true);
      performSearch(query, messages);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, messages, performSearch]);

  // 搜索操作
  const search = useCallback((searchText) => {
    setQuery(searchText);
  }, []);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  // 高亮文本
  const highlightText = useCallback((text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
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