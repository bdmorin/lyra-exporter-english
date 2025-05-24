// components/ConversationTimeline.js
// 通用的对话时间线组件，支持所有格式，使用现有主题系统

import React from 'react';

const ConversationTimeline = ({ 
  data, // 包含完整的解析数据
  messages, 
  marks, 
  onMessageSelect,
  markActions,
  format, // 'claude', 'claude_full_export', 'gemini_notebooklm', etc.
  conversation = null // 可选的对话信息（用于claude_full_export格式）
}) => {
  
  // 根据格式获取对话信息
  const getConversationInfo = () => {
    // 如果有传入conversation参数，优先使用（claude_full_export格式）
    if (conversation) {
      return {
        name: conversation.name || '未命名对话',
        model: conversation.model || 'Claude',
        created_at: conversation.created_at || '未知时间',
        updated_at: conversation.updated_at || '未知时间',
        is_starred: conversation.is_starred || false,
        messageCount: messages.length,
        platform: 'Claude'
      };
    }
    
    if (!data) return null;
    
    const metaInfo = data.meta_info || {};
    
    switch (format) {
      case 'claude':
        return {
          name: metaInfo.title || '未命名对话',
          model: getModelFromMessages() || 'Claude',
          created_at: metaInfo.created_at || '未知时间',
          updated_at: metaInfo.updated_at || '未知时间',
          is_starred: data.raw_data?.is_starred || false,
          messageCount: messages.length,
          platform: 'Claude'
        };
      
      case 'gemini_notebooklm':
        const platform = metaInfo.platform === 'gemini' ? 'Gemini' : 
                         metaInfo.platform === 'notebooklm' ? 'NotebookLM' : 'AI助手';
        return {
          name: metaInfo.title || 'AI对话记录',
          model: platform,
          created_at: metaInfo.created_at || '未知时间',
          updated_at: metaInfo.updated_at || '未知时间',
          is_starred: false,
          messageCount: messages.length,
          platform: platform
        };
      
      case 'claude_conversations':
        return {
          name: metaInfo.title || 'Claude对话列表',
          model: 'Claude',
          created_at: metaInfo.created_at || '未知时间',
          updated_at: metaInfo.updated_at || '未知时间',
          is_starred: false,
          messageCount: messages.length,
          platform: 'Claude'
        };
      
      default:
        return {
          name: metaInfo.title || '未知对话',
          model: '未知',
          created_at: metaInfo.created_at || '未知时间',
          updated_at: metaInfo.updated_at || '未知时间',
          is_starred: false,
          messageCount: messages.length,
          platform: '未知'
        };
    }
  };

  // 从消息中推断模型信息
  const getModelFromMessages = () => {
    const assistantMsg = messages.find(msg => msg.sender === 'assistant');
    return assistantMsg?.sender_label || 'Claude';
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  // 获取消息预览
  const getPreview = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 检查标记状态
  const isMarked = (messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  };

  // 获取平台特定的头像
  const getPlatformAvatar = (sender, platform) => {
    if (sender === 'human') return '👤';
    
    switch (platform?.toLowerCase()) {
      case 'claude':
        return '🤖';
      case 'gemini':
        return '✨';
      case 'notebooklm':
        return '📚';
      default:
        return '🤖';
    }
  };

  // 获取平台特定的标识符（用于样式类名）
  const getPlatformClass = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'gemini':
        return 'platform-gemini';
      case 'notebooklm':
        return 'platform-notebooklm';
      default:
        return 'platform-claude';
    }
  };

  const conversationInfo = getConversationInfo();
  const platformClass = getPlatformClass(conversationInfo?.platform);

  return (
    <div className={`universal-timeline-container ${platformClass}`}>
      {/* 对话信息卡片 - 适配所有格式 */}
      {conversationInfo && (
        <div className="conversation-info-card">
          <h2>
            {conversationInfo.name} 
            {conversationInfo.is_starred && ' ⭐'}
            <span className="platform-badge">{conversationInfo.platform}</span>
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">模型/平台</span>
              <span className="info-value">{conversationInfo.model}</span>
            </div>
            <div className="info-item">
              <span className="info-label">创建时间</span>
              <span className="info-value">{conversationInfo.created_at}</span>
            </div>
            <div className="info-item">
              <span className="info-label">消息数</span>
              <span className="info-value">{conversationInfo.messageCount}</span>
            </div>
            <div className="info-item">
              <span className="info-label">最后更新</span>
              <span className="info-value">{conversationInfo.updated_at}</span>
            </div>
          </div>
          
          {/* 格式特定的额外信息 */}
          {format === 'claude_full_export' && data?.meta_info?.totalConversations && (
            <div className="export-info">
              <span>📦 完整导出包含 {data.meta_info.totalConversations} 个对话</span>
            </div>
          )}
          
          {format === 'claude_conversations' && (
            <div className="export-info">
              <span>📋 对话列表摘要视图</span>
            </div>
          )}
          
          {format === 'gemini_notebooklm' && (
            <div className="export-info">
              <span>🤖 {conversationInfo.platform}对话记录</span>
            </div>
          )}
        </div>
      )}

      {/* 时间线 */}
      <div className="timeline">
        <div className="timeline-line"></div>
        
        {messages.map((msg, index) => (
          <div key={msg.index || index} className="timeline-message">
            <div className={`timeline-dot ${msg.sender === 'human' ? 'human' : 'assistant'}`}></div>
            
            <div 
              className="timeline-content"
              onClick={() => onMessageSelect(msg.index)}
            >
              <div className="timeline-header">
                <div className="timeline-sender">
                  <div className={`timeline-avatar ${msg.sender === 'human' ? 'human' : 'assistant'}`}>
                    {getPlatformAvatar(msg.sender, conversationInfo?.platform)}
                  </div>
                  <div className="sender-info">
                    <div className="sender-name">{msg.sender_label}</div>
                    <div className="sender-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
                
                <button className="btn-detail">查看详情</button>
              </div>
              
              <div className="timeline-body">
                {getPreview(msg.display_text)}
              </div>
              
              <div className="timeline-footer">
                {/* 消息特征标签 */}
                {msg.thinking && (
                  <div className="timeline-tag">
                    <span>💭</span>
                    <span>有思考过程</span>
                  </div>
                )}
                {msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔧</span>
                    <span>{msg.artifacts.length}个Artifacts</span>
                  </div>
                )}
                {msg.tools && msg.tools.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔍</span>
                    <span>使用了工具</span>
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="timeline-tag">
                    <span>📎</span>
                    <span>{msg.citations.length}个引用</span>
                  </div>
                )}
                
                {/* 特殊标签 - 适配不同格式 */}
                {format === 'claude_full_export' && msg.is_conversation_header && (
                  <div className="timeline-tag conversation-start">
                    <span>🗣️</span>
                    <span>对话开始</span>
                  </div>
                )}
                
                {format === 'claude_conversations' && msg.conversation_data && (
                  <div className="timeline-tag conversation-summary">
                    <span>📄</span>
                    <span>对话摘要</span>
                  </div>
                )}
                
                {(format === 'gemini_notebooklm') && (
                  <div className="timeline-tag platform-tag">
                    <span>{conversationInfo?.platform === 'Gemini' ? '✨' : '📚'}</span>
                    <span>{conversationInfo?.platform}</span>
                  </div>
                )}
                
                {/* 标记状态 */}
                {isMarked(msg.index, 'completed') && (
                  <div className="timeline-tag completed">
                    <span>✓</span>
                    <span>已完成</span>
                  </div>
                )}
                {isMarked(msg.index, 'important') && (
                  <div className="timeline-tag important">
                    <span>⭐</span>
                    <span>重要</span>
                  </div>
                )}
                {isMarked(msg.index, 'deleted') && (
                  <div className="timeline-tag deleted">
                    <span>🗑️</span>
                    <span>已删除</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationTimeline;