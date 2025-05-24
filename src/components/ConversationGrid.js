// components/ConversationGrid.js
import React from 'react';

const ConversationGrid = ({ 
  conversations, 
  onConversationSelect, 
  onFileRemove = null,
  onFileAdd = null,
  showFileInfo = false,
  isFileMode = false
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '未知时间';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const getModelDisplay = (model) => {
    if (!model || model === '未知模型') return 'Claude Sonnet';
    if (model.includes('opus')) return 'Claude Opus';
    if (model.includes('sonnet')) return 'Claude Sonnet';
    if (model.includes('haiku')) return 'Claude Haiku';
    return model;
  };

  const getFileTypeDisplay = (format) => {
    switch (format) {
      case 'claude':
        return '💬 Claude对话';
      case 'claude_conversations':
        return '📋 对话列表';
      case 'claude_full_export':
        return '📦 完整导出';
      case 'gemini_notebooklm':
        return '🤖 AI对话';
      default:
        return '📄 未知格式';
    }
  };

  return (
    <div className="conversations-grid">
      {conversations.map((item) => (
        <div 
          key={item.uuid}
          className={`conversation-tile ${item.type === 'file' ? 'file-tile' : ''} ${item.isCurrentFile ? 'current-file' : ''}`}
          onClick={() => onConversationSelect(item)}
        >
          <div className="tile-header">
            <div className="tile-title">
              <span>{item.name || '未命名'}</span>
              {item.is_starred && <span className="star">⭐</span>}
              {item.type === 'file' && item.isCurrentFile && (
                <span className="current-badge">当前</span>
              )}
            </div>
            {/* 文件关闭按钮 */}
            {item.type === 'file' && onFileRemove && (
              <button
                className="file-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove(item.fileIndex);
                }}
                title="关闭文件"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="tile-meta">
            <div className="meta-row" style={{ minHeight: '20px' }}>
              <span>🤖</span>
              <span>{item.type === 'file' ? 
                getFileTypeDisplay(item.format) : 
                getModelDisplay(item.model)
              }</span>
            </div>
            <div className="meta-row" style={{ minHeight: '20px' }}>
              <span>📅</span>
              <span>{formatDate(item.created_at)}</span>
            </div>
            <div className="meta-row" style={{ minHeight: '20px' }}>
              {item.type === 'file' ? (
                <>
                  <span>📊</span>
                  <span>{item.conversationCount}个对话</span>
                </>
              ) : item.project ? (
                <>
                  <span>📁</span>
                  <span>{item.project.name || '无项目'}</span>
                </>
              ) : (
                <span>{''}</span> 
              )}
            </div>
          </div>
          
          <div className="tile-preview">
            {item.summary || '点击查看详情...'}
          </div>
          
          <div className="tile-stats">
            <div className="stat-item">
              <span>💬</span>
              <span>{item.messageCount || 0}条消息</span>
            </div>
            {item.hasThinking && (
              <div className="stat-item">
                <span>💭</span>
                <span>含思考</span>
              </div>
            )}
            {item.hasArtifacts && (
              <div className="stat-item">
                <span>🔧</span>
                <span>含代码</span>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* 添加文件卡片 */}
      {isFileMode && onFileAdd && (
        <div className="conversation-tile add-file-tile" onClick={onFileAdd}>
          <div className="add-file-content">
            <div className="add-file-icon">+</div>
            <div className="add-file-text">添加文件</div>
            <div className="add-file-hint">支持JSON格式</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationGrid;