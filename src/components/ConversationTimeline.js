// components/ConversationTimeline.js
// 通用的对话时间线组件，支持所有格式，使用现有主题系统

import React, { useState, useEffect } from 'react';
import MessageDetail from './MessageDetail';

const ConversationTimeline = ({ 
  data, // 包含完整的解析数据
  messages, 
  marks, 
  onMessageSelect,
  markActions,
  format, // 'claude', 'claude_full_export', 'gemini_notebooklm', etc.
  conversation = null, // 可选的对话信息（用于claude_full_export格式）
  sortActions = null, // 排序操作
  hasCustomSort = false, // 是否有自定义排序
  enableSorting = false, // 是否启用排序功能
  files = [], // 文件列表
  currentFileIndex = null, // 当前文件索引
  onFileSwitch = null, // 文件切换回调
  searchQuery = '' // 搜索关键词
}) => {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 选择第一条消息（PC端两栏布局时）
  useEffect(() => {
    if (isDesktop && messages.length > 0 && !selectedMessageIndex) {
      setSelectedMessageIndex(messages[0].index);
    }
  }, [isDesktop, messages, selectedMessageIndex]);
  
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
  
  // 处理消息选择
  const handleMessageSelect = (messageIndex) => {
    setSelectedMessageIndex(messageIndex);
    if (!isDesktop) {
      // 移动端调用原来的回调（显示模态框）
      onMessageSelect(messageIndex);
    }
  };
  
  // 获取前后文件预览信息
  const getFilePreview = (direction) => {
    if (!files || files.length <= 1 || currentFileIndex === null || format === 'claude_full_export') {
      return null;
    }
    
    const targetIndex = direction === 'prev' ? currentFileIndex - 1 : currentFileIndex + 1;
    if (targetIndex < 0 || targetIndex >= files.length) {
      return null;
    }
    
    return {
      file: files[targetIndex],
      index: targetIndex,
      direction
    };
  };
  
  const prevFilePreview = getFilePreview('prev');
  const nextFilePreview = getFilePreview('next');

  return (
    <div className={`universal-timeline-container ${platformClass} ${isDesktop ? 'desktop-layout' : 'mobile-layout'}`}>
      {/* 文件切换预览 - 顶部 */}
      {prevFilePreview && isDesktop && (
        <div 
          className="file-preview file-preview-top"
          onClick={() => onFileSwitch && onFileSwitch(prevFilePreview.index)}
        >
          <div className="file-preview-inner">
            <span className="file-preview-arrow">↑</span>
            <span className="file-preview-name">{prevFilePreview.file.name}</span>
            <span className="file-preview-hint">点击切换到上一个文件</span>
          </div>
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="timeline-main-content">
        {/* 左侧时间线 */}
        <div className="timeline-left-panel">
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
              className={`timeline-content ${selectedMessageIndex === msg.index ? 'selected' : ''}`}
              onClick={() => handleMessageSelect(msg.index)}
            >
              <div className="timeline-header">
                <div className="timeline-sender">
                  <div className={`timeline-avatar ${msg.sender === 'human' ? 'human' : 'assistant'}`}>
                    {getPlatformAvatar(msg.sender, conversationInfo?.platform)}
                  </div>
                  <div className="sender-info">
                    <div className="sender-name">
                      {msg.sender_label}
                      {/* 显示排序位置 */}
                      {hasCustomSort && (
                        <span className="sort-position"> (#{index + 1})</span>
                      )}
                    </div>
                    <div className="sender-time">
                      {formatTime(msg.timestamp)}
                      {/* 显示分支信息 */}
                      {msg.branch_id && msg.branch_id !== 0 && (
                        <span className="branch-info"> · 分支 {msg.branch_id}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="timeline-actions">
                  {/* 排序按钮 */}
                  {enableSorting && hasCustomSort && sortActions && (
                    <div className="sort-controls">
                      <button 
                        className="sort-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          sortActions.moveMessage(index, 'up');
                        }}
                        disabled={index === 0}
                        title="上移"
                      >
                        ↑
                      </button>
                      <button 
                        className="sort-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          sortActions.moveMessage(index, 'down');
                        }}
                        disabled={index === messages.length - 1}
                        title="下移"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="timeline-body">
                {getPreview(msg.display_text)}
              </div>
              
              <div className="timeline-footer">
                {/* 分支信息标签 */}
                {msg.is_branch_point && (
                  <div className="timeline-tag branch-point">
                    <span>🔀</span>
                    <span>分支点</span>
                  </div>
                )}
                {msg.branch_level > 0 && (
                  <div className="timeline-tag branch-level">
                    <span>↳</span>
                    <span>分支 {msg.branch_level}</span>
                  </div>
                )}
                
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
        
        {/* 右侧消息详情 - 仅PC端 */}
        {isDesktop && (
          <div className="timeline-right-panel">
            <div className="message-detail-container">
              {/* 标签页 */}
              <div className="detail-tabs">
                <button 
                  className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('content')}
                >
                  内容
                </button>
                <button 
                  className={`tab ${activeTab === 'thinking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('thinking')}
                >
                  思考过程
                </button>
                <button 
                  className={`tab ${activeTab === 'artifacts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('artifacts')}
                >
                  Artifacts
                </button>
              </div>
              
              {/* 消息详情 */}
              <div className="detail-content">
                <MessageDetail
                  processedData={data}
                  selectedMessageIndex={selectedMessageIndex}
                  activeTab={activeTab}
                  searchQuery={searchQuery}
                />
              </div>
              
              {/* 标记按钮 */}
              {selectedMessageIndex !== null && markActions && (
                <div className="detail-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => markActions.toggleMark(selectedMessageIndex, 'completed')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'completed') ? '取消完成' : '标记完成'} ✓
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => markActions.toggleMark(selectedMessageIndex, 'important')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'important') ? '取消重要' : '标记重要'} ⭐
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => markActions.toggleMark(selectedMessageIndex, 'deleted')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'deleted') ? '取消删除' : '标记删除'} 🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 文件切换预览 - 底部 */}
      {nextFilePreview && isDesktop && (
        <div 
          className="file-preview file-preview-bottom"
          onClick={() => onFileSwitch && onFileSwitch(nextFilePreview.index)}
        >
          <div className="file-preview-inner">
            <span className="file-preview-arrow">↓</span>
            <span className="file-preview-name">{nextFilePreview.file.name}</span>
            <span className="file-preview-hint">点击切换到下一个文件</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationTimeline;