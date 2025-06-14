// components/ConversationGrid.js - 统一版本
import React from 'react';

const ConversationGrid = ({ 
  conversations, 
  onConversationSelect, 
  onFileRemove = null,
  onFileAdd = null,
  showFileInfo = false,
  isFileMode = false,
  showFileManagement = false,
  selectedConversation = null // 新增：当前选中的对话UUID
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
    
    // 精确识别 Opus 版本
    if (model.includes('opus-4') || model.includes('opus4')) {
      return 'Claude Opus 4';
    }
    if (model.includes('claude-3-opus') || model.includes('opus-3') || model.includes('opus3')) {
      return 'Claude Opus 3';
    }
    if (model.includes('opus')) {
      return 'Claude Opus';
    }
    
    // 识别 Sonnet 版本
    if (model.includes('sonnet-4') || model.includes('sonnet4')) {
      return 'Claude Sonnet 4';
    }
    if (model.includes('claude-3-sonnet') || model.includes('sonnet-3') || model.includes('sonnet3')) {
      return 'Claude Sonnet 3';
    }
    if (model.includes('sonnet')) {
      return 'Claude Sonnet';
    }
    
    // 识别 Haiku 版本
    if (model.includes('claude-3-haiku') || model.includes('haiku-3') || model.includes('haiku3')) {
      return 'Claude Haiku 3';
    }
    if (model.includes('haiku')) {
      return 'Claude Haiku';
    }
    
    // 如果都不匹配，返回原始值
    return model;
  };

  const getFileTypeDisplay = (format) => {
    switch (format) {
      case 'claude':
        return 'Claude对话';
      case 'claude_conversations':
        return '对话列表';
      case 'claude_full_export':
        return '完整导出';
      case 'gemini_notebooklm':
        return 'AI对话';
      default:
        return '未知格式';
    }
  };

  // 简化的图标获取函数
  const getTypeIcon = (item) => {
    if (item.type === 'file') {
      switch (item.format) {
        case 'claude': return '💬';
        case 'claude_conversations': return '📋';
        case 'claude_full_export': return '📦';
        case 'gemini_notebooklm': return '🤖';
        default: return '📄';
      }
    } else {
      return '🤖'; // 对话卡片统一用机器人图标
    }
  };

  // 简化的第一行元信息 - 修改这里让单对话文件显示具体模型
  const getFirstMetaRow = (item) => {
    if (item.type === 'file') {
      // 对于单对话文件，显示具体模型；对于其他格式，显示格式类型
      if (item.format === 'claude') {
        return {
          icon: getTypeIcon(item),
          text: getModelDisplay(item.model)
        };
      } else {
        return {
          icon: getTypeIcon(item),
          text: getFileTypeDisplay(item.format)
        };
      }
    } else {
      return {
        icon: '🤖',
        text: getModelDisplay(item.model)
      };
    }
  };

  // 简化的第三行元信息
  const getThirdMetaRow = (item) => {
    if (item.type === 'file') {
      return {
        icon: '📊',
        text: `${item.conversationCount}个对话`
      };
    } else {
      if (item.project && item.project.name) {
        return {
          icon: '📁',
          text: item.project.name
        };
      } else {
        return null; // 不显示第三行
      }
    }
  };

  // 统一的预览内容
  const getPreviewContent = (item) => {
    if (item.type === 'file') {
      if (item.format === 'unknown') {
        return '点击加载文件内容...';
      }
      return `包含 ${item.conversationCount} 个对话和 ${item.messageCount} 条消息`;
    } else {
      return item.summary || '点击查看对话详情...';
    }
  };

  // 统一的统计信息
  const getStatsItems = (item) => {
    const stats = [];
    
    // 消息数统计
    if (item.messageCount > 0) {
      stats.push({
        icon: '💬',
        text: `${item.messageCount}条消息`
      });
    }

    // 额外特性统计
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

    // 文件特定统计
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
        
        // 判断是否为选中状态
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
                {/* 为文件卡片显示"当前"徽章，为对话卡片显示"选中"徽章 */}
                {item.type === 'file' && item.isCurrentFile && (
                  <span className="current-badge">当前</span>
                )}
                {item.type === 'conversation' && selectedConversation === item.uuid && (
                  <span className="current-badge">选中</span>
                )}
              </div>
              
              {/* 统一的关闭按钮逻辑 */}
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
              {/* 第一行：类型/模型 */}
              <div className="meta-row">
                <span>{firstMeta.icon}</span>
                <span>{firstMeta.text}</span>
              </div>
              
              {/* 第二行：时间 */}
              <div className="meta-row">
                <span>📅</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              
              {/* 第三行：项目/对话数（可选） */}
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
      
      {/* 统一的添加文件卡片 */}
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