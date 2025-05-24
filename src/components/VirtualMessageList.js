// components/VirtualMessageList.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/message-detail.css';
import ConversationHeader from './ConversationHeader';

// 单个消息项组件 - 使用React.memo优化
const MessageItem = React.memo(({ 
  message, 
  conversationMessageIndex,
  isSelected, 
  hasMatch, 
  onSelect,
  marks,
  getSenderIcon,
  getBranchDisplay,
  renderMarkIndicators,
  formatTime,
  getPreviewText
}) => {
  return (
    <div
      className={`message-item ${isSelected ? 'selected' : ''} ${hasMatch ? 'has-search-match' : ''}`}
      onClick={() => onSelect(message.index)}
    >
      {/* 消息头部 */}
      <div className="message-item-header">
        <div className="message-number">#{conversationMessageIndex + 1}</div>
        <div className="sender-info">
          <span className="sender-icon">{getSenderIcon(message.sender)}</span>
          <span className={`sender-name ${message.sender}`}>
            {message.sender_label}
          </span>
        </div>
        <div className="message-meta">
          {getBranchDisplay(message) && (
            <span className="branch-display">{getBranchDisplay(message)}</span>
          )}
          <div className="mark-indicators">
            {renderMarkIndicators(message.index)}
          </div>
        </div>
      </div>

      {/* 时间戳 */}
      <div className="message-timestamp">
        {formatTime(message.timestamp)}
      </div>

      {/* 消息预览 */}
      <div className="message-preview">
        {getPreviewText(message)}
      </div>

      {/* 附加信息 */}
      <div className="message-extras">
        {message.thinking && (
          <span className="extra-indicator thinking">💭</span>
        )}
        {message.artifacts && message.artifacts.length > 0 && (
          <span className="extra-indicator artifacts">🔧 {message.artifacts.length}</span>
        )}
        {message.tools && message.tools.length > 0 && (
          <span className="extra-indicator tools">🔍 {message.tools.length}</span>
        )}
        {hasMatch && (
          <span className="extra-indicator search-match">🔍</span>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在必要时重新渲染
  return prevProps.isSelected === nextProps.isSelected &&
         prevProps.hasMatch === nextProps.hasMatch &&
         prevProps.conversationMessageIndex === nextProps.conversationMessageIndex &&
         JSON.stringify(prevProps.marks) === JSON.stringify(nextProps.marks);
});

const VirtualMessageList = ({ 
  messages = [], 
  selectedMessageIndex, 
  onMessageSelect, 
  marks = {}, 
  searchResults = [],
  searchQuery = ''
}) => {
  // 对话折叠状态
  const [collapsedConversations, setCollapsedConversations] = useState(new Set());
  
  // 虚拟滚动相关状态
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  const ITEM_HEIGHT = 120; // 预估的消息项高度
  const BUFFER_SIZE = 5; // 缓冲区大小
  
  // 切换对话折叠状态
  const toggleConversationCollapse = useCallback((conversationUuid) => {
    setCollapsedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationUuid)) {
        newSet.delete(conversationUuid);
      } else {
        newSet.add(conversationUuid);
      }
      return newSet;
    });
  }, []);
  
  // 计算可见消息
  const visibleData = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      messages.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );
    
    return {
      startIndex,
      endIndex,
      visibleMessages: messages.slice(startIndex, endIndex),
      offsetY: startIndex * ITEM_HEIGHT
    };
  }, [messages, scrollTop, containerHeight]);
  
  // 监听滚动
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // 初始化高度
    handleResize();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 工具函数
  const isMarked = useCallback((messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  }, [marks]);

  const hasSearchMatch = useCallback((messageIndex) => {
    return searchResults.some(result => result.messageIndex === messageIndex);
  }, [searchResults]);

  const getPreviewText = useCallback((message, maxLength = 80) => {
    if (!message.display_text) return '无内容';
    
    let preview = message.display_text.replace(/\n/g, ' ').trim();
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    }
    return preview;
  }, []);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    if (typeof timestamp === 'string' && timestamp.includes('/')) {
      return timestamp;
    }
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '/');
    } catch (error) {
      return timestamp.toString();
    }
  }, []);

  const getSenderIcon = useCallback((sender) => {
    switch (sender) {
      case 'human':
        return '👤';
      case 'assistant':
        return '🤖';
      default:
        return '💬';
    }
  }, []);

  const getBranchDisplay = useCallback((message) => {
    if (message.is_branch_point) return '🔀';
    if (message.branch_level > 0) return `+${message.branch_level}`;
    return '';
  }, []);

  const renderMarkIndicators = useCallback((messageIndex) => {
    const indicators = [];
    
    if (isMarked(messageIndex, 'completed')) {
      indicators.push(<span key="completed" className="mark-indicator completed">✓</span>);
    }
    if (isMarked(messageIndex, 'important')) {
      indicators.push(<span key="important" className="mark-indicator important">⭐</span>);
    }
    if (isMarked(messageIndex, 'deleted')) {
      indicators.push(<span key="deleted" className="mark-indicator deleted">🗑️</span>);
    }
    
    return indicators;
  }, [isMarked]);

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p className="placeholder">没有消息可显示</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="message-list-enhanced virtual-scroll-container"
      style={{ height: '100%', overflow: 'auto' }}
    >
      {/* 虚拟滚动占位元素 */}
      <div style={{ height: messages.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleData.offsetY}px)` }}>
          {visibleData.visibleMessages.map((message, index) => {
            const actualIndex = visibleData.startIndex + index;
            const isSelected = selectedMessageIndex === message.index;
            const hasMatch = hasSearchMatch(message.index);
            
            // 处理对话开始标记
            if (message.is_conversation_header) {
              const isCollapsed = collapsedConversations.has(message.conversation_uuid);
              
              // 计算对话索引
              let conversationIndex = 0;
              for (let i = 0; i < actualIndex; i++) {
                if (messages[i] && messages[i].is_conversation_header) {
                  conversationIndex++;
                }
              }
              
              return (
                <ConversationHeader
                  key={message.index}
                  message={message}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleConversationCollapse(message.conversation_uuid)}
                  conversationIndex={conversationIndex}
                />
              );
            }
            
            // 检查是否在折叠的对话中
            const conversationHeader = messages.slice(0, actualIndex).reverse()
              .find(m => m.is_conversation_header);
            if (conversationHeader && 
                collapsedConversations.has(conversationHeader.conversation_uuid)) {
              return null;
            }
            
            // 计算当前对话内的序号
            let conversationMessageIndex = 0;
            for (let i = actualIndex - 1; i >= 0; i--) {
              if (messages[i].is_conversation_header) break;
              conversationMessageIndex++;
            }
            
            return (
              <MessageItem
                key={message.index}
                message={message}
                conversationMessageIndex={conversationMessageIndex}
                isSelected={isSelected}
                hasMatch={hasMatch}
                onSelect={onMessageSelect}
                marks={marks}
                getSenderIcon={getSenderIcon}
                getBranchDisplay={getBranchDisplay}
                renderMarkIndicators={renderMarkIndicators}
                formatTime={formatTime}
                getPreviewText={getPreviewText}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualMessageList;