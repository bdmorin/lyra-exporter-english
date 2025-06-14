// components/ConversationTimeline.js - 修复分支切换器问题
import React, { useState, useEffect, useMemo } from 'react';
import MessageDetail from './MessageDetail';
import BranchSwitcher, { useBranchSwitcher } from './BranchSwitcher';

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
    console.log("=== 开始分支分析 ===");
    
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
      console.log(`claude_full_export格式，筛选对话 ${realConversationUuid}，消息数: ${analysisMessages.length}`);
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
        console.log(`🔀 发现分支点: ${branchPoint.uuid.substring(0, 8)} (消息${branchPoint.index})`);
        
        // 按时间排序子分支
        const sortedChildren = children
          .map(uuid => msgDict[uuid])
          .filter(msg => msg)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // 构建分支选项
        const branches = sortedChildren.map((childMsg, branchIndex) => {
          // 找到每个分支的所有后续消息
          const branchMessages = findBranchMessages(childMsg.uuid, msgDict, parentChildren);
          
          console.log(`  分支${branchIndex}: ${childMsg.uuid.substring(0, 8)} -> ${branchMessages.length}条消息`);
          
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
    
    console.log(`总共发现 ${branchPoints.size} 个分支点`);
    console.log("=== 分支分析完成 ===");
    
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
      console.log("=== 初始化分支过滤器 ===");
      const initialFilters = new Map();
      
      // 为每个分支点设置默认选择（第一个分支）
      branchAnalysis.branchPoints.forEach((branchData, branchPointUuid) => {
        initialFilters.set(branchPointUuid, 0);
        console.log(`设置分支点 ${branchPointUuid.substring(0, 8)} 默认选择: 分支0`);
      });
      
      setBranchFilters(initialFilters);
      console.log("=== 分支过滤器初始化完成 ===");
    }
  }, [branchAnalysis.branchPoints, branchFilters.size, showAllBranches]);

  // 选择第一条消息（PC端两栏布局时）
  useEffect(() => {
    if (isDesktop && messages.length > 0 && !selectedMessageIndex) {
      setSelectedMessageIndex(messages[0].index);
    }
  }, [isDesktop, messages, selectedMessageIndex]);

  // 计算当前应该显示的消息 - 修复版本，支持显示全部分支
  const displayMessages = useMemo(() => {
    console.log("=== 开始计算显示消息 ===");
    
    // 如果开启了显示全部分支模式，显示所有消息
    if (showAllBranches) {
      console.log("显示全部分支模式，显示所有消息");
      return messages;
    }
    
    // 如果没有分支过滤器，显示所有消息
    if (branchFilters.size === 0) {
      console.log("无分支过滤，显示所有消息");
      return messages;
    }

    // 收集所有被选中分支的消息UUID
    const visibleMessageUuids = new Set();
    
    // 首先添加所有没有分支的消息（在分支点之前的消息）
    messages.forEach(msg => {
      let shouldInclude = true;
      
      // 检查这个消息是否在某个分支点之后
      for (const [branchPointUuid, selectedBranchIndex] of branchFilters.entries()) {
        const branchData = branchAnalysis.branchPoints.get(branchPointUuid);
        if (!branchData) continue;
        
        const branchPoint = branchData.branchPoint;
        const selectedBranch = branchData.branches[selectedBranchIndex];
        
        // 如果这个消息在分支点之后，需要检查是否在选中的分支中
        if (msg.index > branchPoint.index) {
          const isInSelectedBranch = selectedBranch.messages.some(branchMsg => branchMsg.uuid === msg.uuid);
          if (!isInSelectedBranch) {
            shouldInclude = false;
            break;
          }
        }
      }
      
      if (shouldInclude) {
        visibleMessageUuids.add(msg.uuid);
      }
    });
    
    // 过滤消息
    const filtered = messages.filter(msg => visibleMessageUuids.has(msg.uuid));
    
    console.log(`显示 ${filtered.length} / ${messages.length} 条消息`);
    console.log("=== 消息计算完成 ===");
    
    return filtered;
  }, [messages, branchFilters, branchAnalysis, showAllBranches]);

  // 处理分支切换
  const handleBranchSwitch = (branchPointUuid, newBranchIndex) => {
    console.log(`切换分支: ${branchPointUuid.substring(0, 8)} -> 分支${newBranchIndex}`);
    setShowAllBranches(false); // 退出显示全部分支模式
    setBranchFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.set(branchPointUuid, newBranchIndex);
      return newFilters;
    });
  };

  // 切换显示全部分支
  const handleShowAllBranches = () => {
    console.log(`切换显示全部分支: ${!showAllBranches}`);
    const newShowAllBranches = !showAllBranches;
    setShowAllBranches(newShowAllBranches);
    
    if (newShowAllBranches) {
      // 进入全部分支模式时，清空分支过滤器
      setBranchFilters(new Map());
    } else {
      // 退出全部分支模式，自动重置排序
      if (hasCustomSort && sortActions?.resetSort) {
        console.log("退出显示全部模式，自动重置排序");
        sortActions.resetSort();
      }
    }
  };

  // 根据格式获取对话信息
  const getConversationInfo = () => {
    if (conversation) {
      return {
        name: conversation.name || '未命名对话',
        model: conversation.model || 'Claude',
        created_at: conversation.created_at || '未知时间',
        updated_at: conversation.updated_at || '未知时间',
        is_starred: conversation.is_starred || false,
        messageCount: displayMessages.length,
        platform: 'Claude'
      };
    }
    
    if (!data) return null;
    
    const metaInfo = data.meta_info || {};
    
    switch (format) {
      case 'claude':
        return {
          name: metaInfo.title || data?.meta_info?.title || '未命名对话',
          model: getModelFromMessages() || 'Claude',
          created_at: metaInfo.created_at || data?.meta_info?.created_at || '未知时间',
          updated_at: metaInfo.updated_at || data?.meta_info?.updated_at || '未知时间',
          is_starred: data.raw_data?.is_starred || false,
          messageCount: displayMessages.length,
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
          messageCount: displayMessages.length,
          platform: platform
        };
      
      default:
        return {
          name: metaInfo.title || '未知对话',
          model: '未知',
          created_at: metaInfo.created_at || '未知时间',
          updated_at: metaInfo.updated_at || '未知时间',
          is_starred: false,
          messageCount: displayMessages.length,
          platform: '未知'
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

  // 获取平台特定的标识符
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
    </div>
  );
};

export default ConversationTimeline;