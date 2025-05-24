/* Componenrs/ConversationHeader/index.js */
import React from 'react';
import './ConversationHeader.css';

const ConversationHeader = ({ message, isCollapsed, onToggleCollapse, conversationIndex }) => {
  const { 
    conversation_name, 
    project_name, 
    timestamp,
    is_starred,
    model,
    conversation_uuid
  } = message;

  // 提取更多信息
  const messageCount = message.messageCount || 0;
  const createdAt = message.created_at || timestamp;

  return (
    <div className="conversation-header">
      <div className="conversation-header-main" onClick={onToggleCollapse}>
        <button className="collapse-toggle">
          {isCollapsed ? '▶' : '▼'}
        </button>
        <div className="conversation-number">
          #{conversationIndex + 1}
        </div>
        <div className="conversation-info">
          <h3 className="conversation-title">
            {conversation_name || '未命名对话'} {is_starred && '⭐'}
          </h3>
          <div className="conversation-meta">
            {project_name && project_name !== '无项目' && (
              <span className="meta-item project">📁 {project_name}</span>
            )}
            {model && <span className="meta-item model">🤖 {model}</span>}
            <span className="meta-item time">📅 {createdAt}</span>
            {messageCount > 0 && (
              <span className="meta-item count">💬 {messageCount}条消息</span>
            )}
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div className="conversation-divider">
          <div className="divider-line"></div>
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;