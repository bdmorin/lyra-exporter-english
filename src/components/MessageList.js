// components/MessageList.js
import React from 'react';
import '../styles/message-detail.css';

const MessageList = ({ 
  messages = [], 
  selectedMessageIndex, 
  onMessageSelect, 
  marks = {}, 
  searchResults = [],
  searchQuery = ''
}) => {
  
  // 检查消息是否被标记
  const isMarked = (messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  };

  // 检查消息是否包含搜索结果
  const hasSearchMatch = (messageIndex) => {
    return searchResults.some(result => result.messageIndex === messageIndex);
  };

  // 获取消息预览文本
  const getPreviewText = (message, maxLength = 80) => {
    if (!message.display_text) return '无内容';
    
    let preview = message.display_text.replace(/\n/g, ' ').trim();
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    }
    return preview;
  };

  // 格式化时间戳
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    // 如果已经是格式化的时间，直接返回
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
  };

  // 获取发送者图标
  const getSenderIcon = (sender) => {
    switch (sender) {
      case 'human':
        return '👤';
      case 'assistant':
        return '🤖';
      default:
        return '💬';
    }
  };

  // 获取分支显示文本
  const getBranchDisplay = (message) => {
    if (message.is_branch_point) return '🔀';
    if (message.branch_level > 0) return `+${message.branch_level}`;
    return '';
  };

  // 渲染标记指示器
  const renderMarkIndicators = (messageIndex) => {
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
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p className="placeholder">没有消息可显示</p>
      </div>
    );
  }

  return (
    <div className="message-list-enhanced">
      {messages.map((message, index) => {
        const isSelected = selectedMessageIndex === message.index;
        const hasMatch = hasSearchMatch(message.index);
        
        return (
          <div
            key={message.index}
            className={`message-item ${isSelected ? 'selected' : ''} ${hasMatch ? 'has-search-match' : ''}`}
            onClick={() => onMessageSelect(message.index)}
          >
            {/* 消息头部 */}
            <div className="message-item-header">
              <div className="message-number">#{message.index + 1}</div>
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
      })}
    </div>
  );
};

export default MessageList;