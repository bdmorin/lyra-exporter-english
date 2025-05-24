// components/ConversationGrid.js
import React from 'react';

const ConversationGrid = ({ conversations, onConversationSelect }) => {
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

  return (
    <div className="conversations-grid">
      {conversations.map((conv) => (
        <div 
          key={conv.uuid}
          className="conversation-tile"
          onClick={() => onConversationSelect(conv.uuid)}
        >
          <div className="tile-header">
            <div className="tile-title">
              <span>{conv.name || '未命名对话'}</span>
              {conv.is_starred && <span className="star">⭐</span>}
            </div>
          </div>
          
          <div className="tile-meta">
            <div className="meta-row" style={{ minHeight: '20px' }}>
              <span>🤖</span>
              <span>{getModelDisplay(conv.model)}</span>
            </div>
            <div className="meta-row" style={{ minHeight: '20px' }}>
              <span>📅</span>
              <span>{formatDate(conv.created_at)}</span>
            </div>
            <div className="meta-row" style={{ minHeight: '20px' }}>
              {conv.project ? (
                <>
                  <span>📁</span>
                  <span>{conv.project.name || '无项目'}</span>
                </>
              ) : (
                <span>{''}</span> 
              )}
            </div>
          </div>
          
          <div className="tile-preview">
            {conv.summary || '点击查看对话详情...'}
          </div>
          
          <div className="tile-stats">
            <div className="stat-item">
              <span>💬</span>
              <span>{conv.messageCount || 0}条消息</span>
            </div>
            {conv.hasThinking && (
              <div className="stat-item">
                <span>💭</span>
                <span>含思考</span>
              </div>
            )}
            {conv.hasArtifacts && (
              <div className="stat-item">
                <span>🔧</span>
                <span>含代码</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationGrid;