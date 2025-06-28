// components/ConversationTimeline.js - 修复分支切换器问题
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageDetail from './MessageDetail';
import BranchSwitcher, { useBranchSwitcher } from './BranchSwitcher';
import PlatformIcon from './PlatformIcon';

const ConversationTimeline = ({ 
  data, 
  messages, 
  marks, 
  onMessageSelect,
  markActions,
  format,
  conversation = null,
  sortActions = null,
  hasCustomSort = false,
  enableSorting = false,
  files = [],
  currentFileIndex = null,
  onFileSwitch = null,
  searchQuery = ''
}) => {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [branchFilters, setBranchFilters] = useState(new Map()); // 存储每个分支点的当前分支选择
  const [showAllBranches, setShowAllBranches] = useState(false); // 是否显示所有分支
  
  // 分析分支结构 - 修复版本，支持claude_full_export格式
  const branchAnalysis = useMemo(() => {
    // 递归查找分支的所有后续消息 - 移到useMemo内部
    const findBranchMessages = (startUuid, msgDict, parentChildren) => {
      const branchMessages = [msgDict[startUuid]];
      const visited = new Set([startUuid]);
      
      const traverse = (currentUuid) => {
        const children = parentChildren[currentUuid] || [];
        children.forEach(childUuid => {
          if (!visited.has(childUuid) && msgDict[childUuid]) {
            visited.add(childUuid);
            branchMessages.push(msgDict[childUuid]);
            traverse(childUuid); // 递归查找子消息
          }
        });
      };
      
      traverse(startUuid);
      return branchMessages.sort((a, b) => a.index - b.index);
    };
    
    // 构建消息字典和父子关系
    const msgDict = {};
    const parentChildren = {};
    const branchPoints = new Map();
    
    // 过滤消息：只处理当前对话的消息（对于claude_full_export格式）
    let analysisMessages = messages;
    if (format === 'claude_full_export' && conversation?.uuid) {
      // 从conversation.uuid中提取真实的对话UUID（去掉文件索引前缀）
      const realConversationUuid = conversation.uuid.includes('-') ? 
        conversation.uuid.split('-').slice(1).join('-') : conversation.uuid;
      
      analysisMessages = messages.filter(msg => 
        msg.conversation_uuid === realConversationUuid && 
        !msg.is_conversation_header
      );
    }
    
    analysisMessages.forEach(msg => {
      const uuid = msg.uuid;
      const parentUuid = msg.parent_uuid;
      
      msgDict[uuid] = msg;
      
      if (parentUuid) {
        if (!parentChildren[parentUuid]) {
          parentChildren[parentUuid] = [];
        }
        parentChildren[parentUuid].push(uuid);
      }
    });
    
    // 识别分支点并构建分支数据
    Object.entries(parentChildren).forEach(([parentUuid, children]) => {
      if (children.length > 1 && msgDict[parentUuid]) {
        const branchPoint = msgDict[parentUuid];
        
        // 按时间排序子分支
        const sortedChildren = children
          .map(uuid => msgDict[uuid])
          .filter(msg => msg)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // 构建分支选项
        const branches = sortedChildren.map((childMsg, branchIndex) => {
          // 找到每个分支的所有后续消息
          const branchMessages = findBranchMessages(childMsg.uuid, msgDict, parentChildren);
          
          return {
            branchIndex,
            startMessage: childMsg,
            messages: branchMessages,
            messageCount: branchMessages.length,
            path: `branch_${branchPoint.uuid}_${branchIndex}`,
            preview: childMsg.display_text ? 
              (childMsg.display_text.length > 50 ? childMsg.display_text.substring(0, 50) + '...' : childMsg.display_text) :
              '...'
          };
        });
        
        branchPoints.set(parentUuid, {
          branchPoint,
          branches,
          currentBranchIndex: 0 // 默认选择第一个分支
        });
      }
    });
    
    return { branchPoints, msgDict, parentChildren };
  }, [messages, format, conversation]);
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 初始化分支过滤器 - 修复状态同步问题
  useEffect(() => {
    if (branchAnalysis.branchPoints.size > 0 && branchFilters.size === 0 && !showAllBranches) {
      const initialFilters = new Map();
      
      // 为每个分支点设置默认选择（第一个分支）
      branchAnalysis.branchPoints.forEach((branchData, branchPointUuid) => {
        initialFilters.set(branchPointUuid, 0);
      });
      
      setBranchFilters(initialFilters);
    }
  }, [branchAnalysis.branchPoints, branchFilters.size, showAllBranches]);

  // 选择第一条消息（PC端两栏布局时）
  useEffect(() => {
    if (isDesktop && messages.length > 0 && !selectedMessageIndex) {
      setSelectedMessageIndex(messages[0].index);
    }
  }, [isDesktop, messages, selectedMessageIndex]);

  // 计算当前应该显示的消息 - 修复版本，更可靠的分支过滤逻辑
  const displayMessages = useMemo(() => {
    // 如果开启了显示全部分支模式，显示所有消息
    if (showAllBranches) {
      return messages;
    }
    
    // 如果没有分支点，显示所有消息
    if (branchAnalysis.branchPoints.size === 0) {
      return messages;
    }

    // 如果分支过滤器未初始化，暂时显示所有消息
    if (branchFilters.size === 0) {
      return messages;
    }

    // 新的分支过滤逻辑：更简单和可靠
    const visibleMessages = [];
    
    // 按索引顺序处理消息
    for (const msg of messages) {
      let shouldShow = true;
      
      // 检查此消息是否受到任何分支点的影响
      for (const [branchPointUuid, selectedBranchIndex] of branchFilters.entries()) {
        const branchData = branchAnalysis.branchPoints.get(branchPointUuid);
        if (!branchData) continue;
        
        const branchPoint = branchData.branchPoint;
        const selectedBranch = branchData.branches[selectedBranchIndex];
        
        // 如果消息在分支点之后
        if (msg.index > branchPoint.index) {
          // 检查这个消息是否属于选中的分支
          const belongsToSelectedBranch = selectedBranch.messages.some(
            branchMsg => branchMsg.uuid === msg.uuid
          );
          
          if (!belongsToSelectedBranch) {
            // 检查是否属于其他分支
            const belongsToAnyBranch = branchData.branches.some(
              branch => branch.messages.some(branchMsg => branchMsg.uuid === msg.uuid)
            );
            
            // 如果属于其他分支，则不显示
            if (belongsToAnyBranch) {
              shouldShow = false;
              break;
            }
            // 如果不属于任何分支，可能是共同的后续消息，继续显示
          }
        }
      }
      
      if (shouldShow) {
        visibleMessages.push(msg);
      }
    }
    
    return visibleMessages;
  }, [messages, branchFilters, branchAnalysis, showAllBranches]);

  // 处理分支切换
  const handleBranchSwitch = (branchPointUuid, newBranchIndex) => {
    setShowAllBranches(false); // 退出显示全部分支模式
    setBranchFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.set(branchPointUuid, newBranchIndex);
      return newFilters;
    });
  };

  // 切换显示全部分支
  const handleShowAllBranches = () => {
    const newShowAllBranches = !showAllBranches;
    setShowAllBranches(newShowAllBranches);
    
    if (newShowAllBranches) {
      // 进入全部分支模式时，清空分支过滤器
      setBranchFilters(new Map());
    } else {
      // 退出全部分支模式，自动重置排序
      if (hasCustomSort && sortActions?.resetSort) {
        sortActions.resetSort();
      }
    }
  };

  // 计算最后更新时间 - 从消息中获取最新的时间戳
  const getLastUpdatedTime = () => {
    if (!displayMessages || displayMessages.length === 0) {
      return '未知时间';
    }
    
    // 获取最后一条消息的时间戳
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage && lastMessage.timestamp) {
      try {
        const date = new Date(lastMessage.timestamp);
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return lastMessage.timestamp;
      }
    }
    
    return '未知时间';
  };

  // 根据格式获取对话信息
  const getConversationInfo = () => {
    const lastUpdated = getLastUpdatedTime();
    
    if (conversation) {
      // 从conversation对象推断正确的平台信息
      let platformName = 'Claude';
      if (data && data.meta_info) {
        if (data.meta_info.platform === 'gemini') {
          platformName = 'Gemini';
        } else if (data.meta_info.platform === 'notebooklm') {
          platformName = 'NotebookLM';
        } else if (data.meta_info.platform === 'aistudio') {
          platformName = 'Google AI Studio'; // 新增对AI Studio的支持
        }
      }
      
      return {
        name: conversation.name || '未命名对话',
        model: conversation.model || platformName,
        created_at: conversation.created_at || '未知时间',
        updated_at: lastUpdated, // 使用计算出的最后更新时间
        is_starred: conversation.is_starred || false,
        messageCount: displayMessages.length,
        platform: platformName // 使用推断出的平台名称
      };
    }
    
    if (!data) return null;
    
    const metaInfo = data.meta_info || {};
    
    // 智能平台检测 - 优先根据meta_info里的platform字段判断
    let platformName = 'Claude'; // 默认平台
    if (metaInfo.platform === 'gemini') {
      platformName = 'Gemini';
    } else if (metaInfo.platform === 'notebooklm') {
      platformName = 'NotebookLM';
    } else if (metaInfo.platform === 'aistudio') {
      platformName = 'Google AI Studio'; // 新增对AI Studio的支持
    } else if (format === 'gemini_notebooklm') {
      // 如果格式是gemini_notebooklm但meta_info中没有明确platform，根据其他特征判断
      platformName = 'Gemini'; // 默认为Gemini
    }
    
    switch (format) {
      case 'claude':
        return {
          name: metaInfo.title || data?.meta_info?.title || '未命名对话',
          model: getModelFromMessages() || 'Claude',
          created_at: metaInfo.created_at || data?.meta_info?.created_at || '未知时间',
          updated_at: lastUpdated,
          is_starred: data.raw_data?.is_starred || false,
          messageCount: displayMessages.length,
          platform: 'Claude' // Claude格式确定是Claude平台
        };
      
      case 'gemini_notebooklm':
        return {
          name: metaInfo.title || 'AI对话记录',
          model: platformName,
          created_at: metaInfo.created_at || '未知时间',
          updated_at: lastUpdated,
          is_starred: false,
          messageCount: displayMessages.length,
          platform: platformName // 使用智能检测的平台名称
        };
      
      default:
        return {
          name: metaInfo.title || '未知对话',
          model: platformName,
          created_at: metaInfo.created_at || '未知时间',
          updated_at: lastUpdated,
          is_starred: false,
          messageCount: displayMessages.length,
          platform: platformName
        };
    }
  };

  // 从消息中推断模型信息
  const getModelFromMessages = () => {
    const assistantMsg = displayMessages.find(msg => msg.sender === 'assistant');
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

  // 过滤图片引用的工具函数（增强版）
  const filterImageReferences = (text) => {
    if (!text) return '';
    // 匹配各种图片引用格式：
    // [图片1: filename] [附件: filename] [image: filename] [attachment: filename]
    // [图片1]、[图片2]等简单格式
    return text
      .replace(/\[(?:图片|附件|图像|image|attachment)\d*\s*[:：]\s*[^\]]+\]/gi, '')
      .replace(/\[(?:图片|附件|图像|image|attachment)\d+\]/gi, '')
      .replace(/\[图片1\]/gi, '') // 特别处理[图片1]
      .replace(/\[图片2\]/gi, '') // 特别处理[图片2]
      .replace(/\[图片3\]/gi, '') // 特别处理[图片3]
      .replace(/\[图片4\]/gi, '') // 特别处理[图片4]
      .replace(/\[图片5\]/gi, '') // 特别处理[图片5]
      .trim(); // 移除首尾空格
  };

  // 获取消息预览
  const getPreview = (text, maxLength = 200) => {
    if (!text) return '';
    // 先过滤图片引用
    const filteredText = filterImageReferences(text);
    if (filteredText.length <= maxLength) return filteredText;
    return filteredText.substring(0, maxLength) + '...';
  };

  // 检查标记状态
  const isMarked = (messageIndex, markType) => {
    return marks[markType]?.has(messageIndex) || false;
  };

  // 获取平台特定的头像
  const getPlatformAvatar = (sender, platform) => {
    if (sender === 'human') {
      return '👤'; // 保持人类头像为emoji
    }
    
    // AI助手使用PlatformIcon
    return (
      <PlatformIcon 
        platform={platform?.toLowerCase() || 'claude'} 
        format={getFormatFromPlatform(platform)} 
        size={20} 
        style={{ backgroundColor: 'transparent' }}
      />
    );
  };
  
  // 根据平台推断格式（用于PlatformIcon）
  const getFormatFromPlatform = (platform) => {
    switch(platform?.toLowerCase()) {
      case 'gemini':
      case 'google ai studio':
      case 'aistudio':
      case 'notebooklm':
        return 'gemini_notebooklm';
      default:
        return 'claude';
    }
  };

  // 获取平台特定的标识符
  const getPlatformClass = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'gemini':
        return 'platform-gemini';
      case 'google ai studio':
      case 'aistudio':
        return 'platform-gemini'; // AI Studio使用和Gemini相同的样式
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
      onMessageSelect(messageIndex);
    }
  };
  
  // 获取文件预览信息
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
      {/* 内容区域 */}
      <div className="timeline-main-content">
        {/* 左侧时间线 */}
        <div className="timeline-left-panel">
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
          
          {/* 对话信息卡片 */}
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
                  <span className="info-label">显示消息数</span>
                  <span className="info-value">{conversationInfo.messageCount}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">最后更新</span>
                  <span className="info-value">{conversationInfo.updated_at}</span>
                </div>
              </div>
              
              {/* 分支统计和控制 */}
              {branchAnalysis.branchPoints.size > 0 && (
                <div className="export-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔀 检测到 {branchAnalysis.branchPoints.size} 个分支点</span>
                  <div className="timeline-controls" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-secondary small"
                      onClick={handleShowAllBranches}
                      title={showAllBranches ? "只显示选中分支" : "显示全部分支"}
                    >
                      {showAllBranches ? '🔍 筛选分支' : '📋 显示全部'}
                    </button>
                    {/* 排序控制 - 只在显示全部分支时显示 */}
                    {showAllBranches && sortActions && (
                      !hasCustomSort ? (
                        <button 
                          className="btn-secondary small"
                          onClick={() => {
                            // 启用排序
                            sortActions.enableSort();
                          }}
                          title="启用消息排序"
                        >
                          🔄 启用排序
                        </button>
                      ) : (
                        <button 
                          className="btn-secondary small"
                          onClick={() => sortActions.resetSort()}
                          title="重置排序"
                        >
                          🔄 重置排序
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 时间线 */}
          <div className="timeline">
            <div className="timeline-line"></div>
            
            {displayMessages.map((msg, index) => {
              // 检查这个消息后面是否应该显示分支切换器
              const branchData = branchAnalysis.branchPoints.get(msg.uuid);
              const shouldShowBranchSwitcher = branchData && 
                branchData.branches.length > 1 && 
                !showAllBranches; // 在显示全部分支模式时不显示分支切换器
              
              return (
                <React.Fragment key={msg.uuid || index}>
                  {/* 消息项 */}
                  <div className="timeline-message">
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
                              {hasCustomSort && showAllBranches && (
                                <span className="sort-position"> (#{index + 1})</span>
                              )}
                            </div>
                            <div className="sender-time">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="timeline-actions">
                          {enableSorting && hasCustomSort && showAllBranches && sortActions && (
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
                                disabled={index === displayMessages.length - 1}
                                title="下移"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="timeline-body">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // 简化的markdown组件，适合预览
                            p: ({ children }) => <span>{children}</span>,
                            h1: ({ children }) => <strong>{children}</strong>,
                            h2: ({ children }) => <strong>{children}</strong>,
                            h3: ({ children }) => <strong>{children}</strong>,
                            h4: ({ children }) => <strong>{children}</strong>,
                            h5: ({ children }) => <strong>{children}</strong>,
                            h6: ({ children }) => <strong>{children}</strong>,
                            strong: ({ children }) => <strong>{children}</strong>,
                            em: ({ children }) => <em>{children}</em>,
                            code: ({ inline, children }) => inline ? 
                              <code className="inline-code">{children}</code> : 
                              <code>{children}</code>,
                            pre: ({ children }) => <span>{children}</span>,
                            blockquote: ({ children }) => <span>" {children} "</span>,
                            a: ({ children }) => <span>{children}</span>,
                            // 修复列表中markdown渲染问题
                            ul: ({ children }) => <span>{children}</span>,
                            ol: ({ children }) => <span>{children}</span>,
                            li: ({ children }) => <span>• {children}</span>
                          }}
                        >
                          {getPreview(msg.display_text)}
                        </ReactMarkdown>
                      </div>
                      
                      <div className="timeline-footer">
                        {/* 消息特征标签 */}
                        {msg.thinking && (
                          <div className="timeline-tag">
                            <span>💭</span>
                            <span>有思考过程</span>
                          </div>
                        )}
                        {/* 支持多格式的图片检测 */}
                        {(msg.images && msg.images.length > 0) && (
                          <div className="timeline-tag">
                            <span>🖼️</span>
                            <span>{msg.images.length}张图片</span>
                          </div>
                        )}
                        {/* Gemini格式的图片检测（如果没有images字段） */}
                        {!msg.images && msg.attachments && msg.attachments.length > 0 && (
                          <div className="timeline-tag">
                            <span>🖼️</span>
                            <span>{msg.attachments.length}个附件</span>
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
                  
                  {/* 分支切换器 - 在分支点消息之后显示 */}
                  {shouldShowBranchSwitcher && (
                    <BranchSwitcher
                      key={`branch-${msg.uuid}`}
                      branchPoint={msg}
                      availableBranches={branchData.branches}
                      currentBranchIndex={branchFilters.get(msg.uuid) ?? branchData.currentBranchIndex}
                      onBranchChange={(newIndex) => handleBranchSwitch(msg.uuid, newIndex)}
                      onShowAllBranches={handleShowAllBranches}
                      showAllMode={false}
                      className="timeline-branch-switcher"
                    />
                  )}
                </React.Fragment>
              );
            })}
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
        
        {/* 右侧消息详情 - 仅PC端 */}
        {isDesktop && (
          <div className="timeline-right-panel">
            <div className="message-detail-container">
              {/* 消息详情 */}
              <div className="detail-content">
                <MessageDetail
                  processedData={data}
                  selectedMessageIndex={selectedMessageIndex}
                  activeTab={activeTab}
                  searchQuery={searchQuery}
                  format={format}
                  onTabChange={setActiveTab}
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
    </div>
  );
};

export default ConversationTimeline;