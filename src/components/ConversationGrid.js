// components/ConversationGrid.js - 混合版本
// 结合了版本二的内部简化，同时恢复使用 App.js 传递的显示逻辑
import React from 'react';
import PlatformIcon from './PlatformIcon';

const ConversationGrid = ({ 
  conversations, 
  onConversationSelect, 
  onFileRemove = null,
  onFileAdd = null,
  showFileInfo = false,
  isFileMode = false,
  showFileManagement = false,
  selectedConversation = null
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '未知时间';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getModelDisplay = (model) => {
    if (!model || model === '未知模型') return 'Claude Sonnet';
    if (model.includes('opus-4') || model.includes('opus4')) {
      return 'Claude Opus 4';
    }
    if (model.includes('claude-3-opus') || model.includes('opus-3') || model.includes('opus3')) {
      return 'Claude Opus 3';
    }
    if (model.includes('sonnet-4') || model.includes('sonnet4')) {
      return 'Claude Sonnet 4';
    }
    if (model.includes('haiku')) {
      return 'Claude Haiku';
    }
    // 直接返回原始值（用于 Gemini、NotebookLM 等）
    return model;
  };

  // 简化的第一行元信息 - 完全由 ConversationGrid 处理
  const getFirstMetaRow = (item) => {
    // 获取文件类型显示文本
    const getFileTypeText = (format, platform, model) => {
      switch (format) {
        case 'claude':
          return getModelDisplay(model); // 单对话文件显示具体模型
        case 'claude_conversations':
          return '对话列表';
        case 'claude_full_export':
          return '完整导出';
        case 'gemini_notebooklm':
          // 根据平台区分 Gemini、AI Studio 和 NotebookLM
          if (platform === 'notebooklm') {
            return 'NotebookLM';
          } else if (platform === 'aistudio') {
            return 'Google AI Studio'; // 新增对AI Studio的支持
          } else {
            return 'Gemini'; // 默认为 Gemini
          }
        default:
          return '未知格式';
      }
    };

    if (item.type === 'file') {
      return {
        icon: <PlatformIcon platform={item.platform || 'claude'} format={item.format} size={16} />,
        text: getFileTypeText(item.format, item.platform, item.model)
      };
    } else {
      return {
        icon: <PlatformIcon platform={item.platform || 'claude'} format="claude" size={16} />,
        text: getModelDisplay(item.model)
      };
    }
  };

  // 简化的第三行元信息
  const getThirdMetaRow = (item) => {
    if (item.type === 'file') {
      return {
        icon: '✉️',
        text: `${item.conversationCount}个对话`
      };
    } else {
      if (item.project && item.project.name) {
        return {
          icon: '📁',
          text: item.project.name
        };
      } else {
        return null;
      }
    }
  };

  // 统一的预览内容
  const getPreviewContent = (item) => {
    if (item.type === 'file') {
      if (item.format === 'unknown') {
        return '点击加载文件内容...';
      }
      // 使用 App.js 传递的 summary，或者生成默认内容
      return item.summary || `包含 ${item.conversationCount} 个对话和 ${item.messageCount} 条消息`;
    } else {
      return item.summary || '点击查看对话详情...';
    }
  };

  // 统一的统计信息
  const getStatsItems = (item) => {
    const stats = [];
    
    if (item.messageCount > 0) {
      stats.push({
        icon: '💬',
        text: `${item.messageCount}条消息`
      });
    }

    if (item.hasThinking) {
      stats.push({
        icon: '💭',
        text: '含思考'
      });
    }
    
    if (item.hasArtifacts) {
      stats.push({
        icon: '🔧',
        text: '含代码'
      });
    }

    if (item.type === 'file' && item.conversationCount > 1) {
      stats.push({
        icon: '📋',
        text: `${item.conversationCount}个对话`
      });
    }

    return stats;
  };

  return (
    <div className="conversations-grid">
      {conversations.map((item) => {
        const firstMeta = getFirstMetaRow(item);
        const thirdMeta = getThirdMetaRow(item);
        const previewContent = getPreviewContent(item);
        const statsItems = getStatsItems(item);
        
        const isSelected = item.type === 'file' ? item.isCurrentFile : 
                           (selectedConversation === item.uuid);

        return (
          <div 
            key={item.uuid}
            className={`conversation-tile ${item.type === 'file' ? 'file-tile' : ''} ${item.isCurrentFile ? 'current-file' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onConversationSelect(item)}
          >
            <div className="tile-header">
              <div className="tile-title">
                <span>{item.name || '未命名'}</span>
                {item.is_starred && <span className="star">⭐</span>}
                {item.type === 'file' && item.isCurrentFile && (
                  <span className="current-badge">当前</span>
                )}
                {item.type === 'conversation' && selectedConversation === item.uuid && (
                  <span className="current-badge">选中</span>
                )}
              </div>
              
              {((item.type === 'file' && onFileRemove) || 
                (item.type === 'conversation' && showFileManagement && onFileRemove)) && (
                <button
                  className="file-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove(item.fileIndex);
                  }}
                  title={item.type === 'file' ? '关闭文件' : '关闭当前文件'}
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="tile-meta">
              <div className="meta-row">
                {firstMeta.icon}
                <span>{firstMeta.text}</span>
              </div>
              
              <div className="meta-row">
                <span>📅</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              
              {thirdMeta && (
                <div className="meta-row">
                  <span>{thirdMeta.icon}</span>
                  <span>{thirdMeta.text}</span>
                </div>
              )}
            </div>
            
            <div className="tile-preview">
              {previewContent}
            </div>
            
            {statsItems.length > 0 && (
              <div className="tile-stats">
                {statsItems.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <span>{stat.icon}</span>
                    <span>{stat.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      
      {(isFileMode || showFileManagement) && onFileAdd && (
        <div className="conversation-tile add-file-tile" onClick={onFileAdd}>
          <div className="add-file-content">
            <div className="add-file-icon">+</div>
            <div className="add-file-text">
              {isFileMode ? '添加文件' : '添加/替换文件'}
            </div>
            <div className="add-file-hint">支持JSON格式</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationGrid;