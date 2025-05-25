import React, { useState, useRef, useEffect, useMemo } from 'react';
import './styles/App.css';
import './styles/themes.css';
import './styles/UniversalTimeline.css';

// 组件导入
import WelcomePage from './components/WelcomePage';
import MessageDetail from './components/MessageDetail';
import ConversationGrid from './components/ConversationGrid';
import ConversationTimeline from './components/ConversationTimeline';
import ThemeSwitcher from './components/ThemeSwitcher';
// 自定义Hooks导入
import { useFileManager } from './hooks/useFileManager';
import { useMarkSystem } from './hooks/useMarkSystem';
import { useSearch } from './hooks/useSearch';
import { useMessageSort } from './hooks/useMessageSort';

function App() {
  // 使用自定义hooks
  const { 
    files, 
    currentFile, 
    currentFileIndex, 
    processedData, 
    isLoading, 
    error,
    showTypeConflictModal,
    pendingFiles,
    actions: fileActions 
  } = useFileManager();
  
  // 状态管理
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [viewMode, setViewMode] = useState('conversations'); // 'conversations' | 'timeline'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  
  const fileInputRef = useRef(null);

  // 标记系统 - 使用选中对话的文件UUID
  const currentFileUuid = useMemo(() => {
    if (selectedConversation && selectedFileIndex !== null) {
      return `${files[selectedFileIndex]?.name}-${selectedConversation}`;
    }
    return processedData?.meta_info?.uuid;
  }, [selectedConversation, selectedFileIndex, files, processedData]);

  const { marks, stats, actions: markActions } = useMarkSystem(currentFileUuid);

  // 创建统一的卡片列表（包含文件和对话）
  const allCards = useMemo(() => {
    const cards = [];
    
    // 为每个文件创建一个文件卡片
    files.forEach((file, fileIndex) => {
      const isCurrentFile = fileIndex === currentFileIndex;
      const fileData = isCurrentFile ? processedData : null;
      
      // 动态获取文件类型显示
      const getFileTypeDisplay = (data) => {
        if (!data) return '点击加载...';
        
        switch (data.format) {
          case 'claude':
            return '💬 Claude对话';
          case 'claude_conversations':
            return '📋 对话列表';
          case 'claude_full_export':
            return '📦 完整导出';
          case 'gemini_notebooklm':
            return `🤖 ${data.platform === 'gemini' ? 'Gemini' : 'NotebookLM'}对话`;
          default:
            return '📄 未知格式';
        }
      };
      
      cards.push({
        type: 'file',
        uuid: `file-${fileIndex}`,
        name: file.name.replace('.json', ''),
        fileName: file.name,
        fileIndex,
        isCurrentFile,
        fileData,
        format: fileData?.format || 'unknown',
        // 实时计算消息数和对话数
        messageCount: fileData?.chat_history?.length || 0,
        conversationCount: fileData?.format === 'claude_full_export' ? 
          (fileData?.views?.conversationList?.length || 0) : (fileData ? 1 : 0),
        created_at: file.lastModified ? new Date(file.lastModified).toISOString() : null,
        summary: fileData ? 
          (fileData.format === 'claude_full_export' ? 
            `${fileData?.views?.conversationList?.length || 0}个对话，${fileData?.chat_history?.length || 0}条消息` :
            `${fileData?.chat_history?.length || 0}条消息的对话`
          ) : '点击加载文件内容...'
      });
    });
    
    // 如果当前文件是claude_full_export格式，展示对话卡片
    if (viewMode === 'conversations' && processedData?.format === 'claude_full_export') {
      // 清空文件卡片，改为显示对话卡片
      cards.length = 0;
      processedData.views?.conversationList?.forEach(conv => {
        cards.push({
          type: 'conversation',
          ...conv,
          fileIndex: currentFileIndex,
          fileName: files[currentFileIndex]?.name || 'unknown',
          fileFormat: processedData.format,
          uuid: `${currentFileIndex}-${conv.uuid}`
        });
      });
    }
    
    return cards;
  }, [files, currentFileIndex, processedData, viewMode]);

  // 搜索功能 - 搜索卡片和消息
  const searchTarget = useMemo(() => {
    if (viewMode === 'conversations') {
      return allCards;
    } else if (selectedConversation && selectedFileIndex !== null) {
      // 获取选中对话的消息
      if (selectedFileIndex === currentFileIndex && processedData) {
        if (processedData.format === 'claude_full_export') {
          const originalUuid = selectedConversation.replace(`${selectedFileIndex}-`, '');
          return processedData.chat_history?.filter(msg => 
            msg.conversation_uuid === originalUuid && !msg.is_conversation_header
          ) || [];
        } else {
          return processedData.chat_history || [];
        }
      }
    }
    return [];
  }, [viewMode, allCards, selectedConversation, selectedFileIndex, currentFileIndex, processedData]);

  const { query, results, filteredMessages, actions: searchActions } = useSearch(searchTarget);

  // 消息排序 - 仅在时间线模式下使用
  const timelineMessages = useMemo(() => {
    if (viewMode === 'timeline' && Array.isArray(searchTarget)) {
      return searchTarget;
    }
    return [];
  }, [viewMode, searchTarget]);

  const { sortedMessages, hasCustomSort, actions: sortActions } = useMessageSort(
    timelineMessages, 
    currentFileUuid
  );

  // 文件处理
  const handleFileLoad = (e) => {
    const fileList = Array.from(e.target.files);
    fileActions.loadFiles(fileList);
  };

  // 卡片选择处理（文件卡片或对话卡片）
  const handleCardSelect = (card) => {
    if (card.type === 'file') {
      // 点击文件卡片
      if (card.fileIndex !== currentFileIndex) {
        fileActions.switchFile(card.fileIndex);
      }
      
      // 根据文件格式决定跳转逻辑
      if (card.fileData?.format === 'claude_full_export') {
        // claude_full_export 格式：切换到对话网格模式
        setViewMode('conversations');
        setSelectedConversation(null);
        setSelectedFileIndex(null);
      } else {
        // 其他格式：直接进入时间线模式
        setSelectedConversation(`${card.fileIndex}-single`);
        setSelectedFileIndex(card.fileIndex);
        setViewMode('timeline');
      }
    } else if (card.type === 'conversation') {
      // 点击对话卡片
      setSelectedConversation(card.uuid);
      setSelectedFileIndex(card.fileIndex);
      setViewMode('timeline');
      
      // 如果需要切换文件，先切换到对应文件
      if (card.fileIndex !== currentFileIndex) {
        fileActions.switchFile(card.fileIndex);
      }
    }
  };

  // 文件关闭处理
  const handleFileRemove = (fileIndex) => {
    fileActions.removeFile(fileIndex);
    
    // 如果关闭的是当前文件或选中的文件，重置状态
    if (fileIndex === currentFileIndex || fileIndex === selectedFileIndex) {
      setViewMode('conversations');
      setSelectedConversation(null);
      setSelectedFileIndex(null);
    }
  };

  // 返回对话列表
  const handleBackToConversations = () => {
    setViewMode('conversations');
    setSelectedConversation(null);
    setSelectedFileIndex(null);
  };

  // 消息选择处理
  const handleMessageSelect = (messageIndex) => {
    setSelectedMessageIndex(messageIndex);
    setShowMessageDetail(true);
  };

  // 搜索处理
  const handleSearch = (searchText) => {
    searchActions.search(searchText);
  };

  // 标记处理
  const handleMarkToggle = (messageIndex, markType) => {
    markActions.toggleMark(messageIndex, markType);
  };

  // 获取文件类型显示
  const getFileTypeDisplay = (data) => {
    if (!data) return '';
    
    switch (data.format) {
      case 'claude':
        return '💬 Claude对话';
      case 'claude_conversations':
        return '📋 对话列表';
      case 'claude_full_export':
        return '📦 完整导出';
      case 'gemini_notebooklm':
        return `🤖 ${data.platform === 'gemini' ? 'Gemini' : 'NotebookLM'}对话`;
      default:
        return '📄 未知格式';
    }
  };

  // 获取统计数据
  const getStats = () => {
    if (viewMode === 'conversations') {
      const fileCards = allCards.filter(card => card.type === 'file');
      const conversationCards = allCards.filter(card => card.type === 'conversation');
      
      if (conversationCards.length > 0) {
        // 在claude_full_export的对话网格模式
        return {
          totalMessages: conversationCards.reduce((sum, conv) => sum + (conv.messageCount || 0), 0),
          conversationCount: conversationCards.length,
          fileCount: files.length,
          markedCount: stats.completed + stats.important + stats.deleted
        };
      } else {
        // 在文件网格模式 - 统计当前已加载文件的真实数据
        let totalMessages = 0;
        let totalConversations = 0;
        
        files.forEach((file, index) => {
          if (index === currentFileIndex && processedData) {
            // 使用当前文件的真实数据
            totalMessages += processedData.chat_history?.length || 0;
            totalConversations += processedData.format === 'claude_full_export' ? 
              (processedData.views?.conversationList?.length || 0) : 1;
          } else {
            // 对于未加载的文件，使用预估数据
            const fileCard = fileCards.find(card => card.fileIndex === index);
            totalMessages += fileCard?.messageCount || 0;
            totalConversations += fileCard?.conversationCount || 0;
          }
        });
        
        return {
          totalMessages,
          conversationCount: totalConversations,
          fileCount: files.length,
          markedCount: stats.completed + stats.important + stats.deleted
        };
      }
    } else {
      // 在时间线模式
      const messages = Array.isArray(sortedMessages) ? sortedMessages : timelineMessages;
      return {
        totalMessages: messages.length,
        conversationCount: 1,
        fileCount: files.length,
        markedCount: stats.completed + stats.important + stats.deleted
      };
    }
  };

  // 主题初始化
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // 导出功能
  const handleExport = () => {
    console.log('导出当前视图数据');
    setShowExportPanel(false);
  };

  // 获取搜索占位符
  const getSearchPlaceholder = () => {
    if (viewMode === 'conversations') {
      const hasConversationCards = allCards.some(card => card.type === 'conversation');
      if (hasConversationCards) {
        return "搜索对话标题、项目名称...";
      } else {
        return "搜索文件名称、格式...";
      }
    } else {
      return "搜索消息内容、思考过程、Artifacts...";
    }
  };

  // 获取当前视图的数据用于搜索结果显示
  const getSearchResultData = () => {
    if (viewMode === 'conversations') {
      const hasConversationCards = allCards.some(card => card.type === 'conversation');
      if (hasConversationCards) {
        return {
          displayed: filteredMessages.length,
          total: allCards.length,
          unit: '个对话'
        };
      } else {
        return {
          displayed: filteredMessages.length,
          total: allCards.length,
          unit: '个文件'
        };
      }
    } else {
      const messages = Array.isArray(sortedMessages) ? sortedMessages : timelineMessages;
      return {
        displayed: filteredMessages.length,
        total: messages.length,
        unit: '条消息'
      };
    }
  };

  const searchStats = getSearchResultData();

  return (
    <div className="app-redesigned">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json"
        onChange={handleFileLoad}
        style={{ display: 'none' }}
      />

      {/* 如果没有文件，显示欢迎页面 */}
      {files.length === 0 ? (
        <WelcomePage handleLoadClick={() => fileInputRef.current?.click()} />
      ) : (
        <>
          {/* 顶部导航栏 */}
          <nav className="navbar-redesigned">
            <div className="navbar-left">
              <div className="logo">
                <span className="logo-icon">🎵</span>
                <span className="logo-text">Lyra Exporter</span>
              </div>
              
              {/* 返回按钮 */}
              {viewMode === 'timeline' && (
                <button 
                  className="btn-secondary small"
                  onClick={handleBackToConversations}
                >
                  ← 返回对话列表
                </button>
              )}
              
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder={getSearchPlaceholder()}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {query && (
                  <div className="search-stats">
                    显示 {searchStats.displayed} / {searchStats.total} {searchStats.unit}
                  </div>
                )}
              </div>
            </div>
            
            <div className="navbar-right">
              {/* 时间线模式下的排序控制 */}
              {viewMode === 'timeline' && (
                <div className="timeline-controls">
                  {!hasCustomSort ? (
                    <button 
                      className="btn-secondary small"
                      onClick={() => sortActions.moveMessage(0, 'none')}
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
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* 主容器 */}
          <div className="main-container">
            {/* 内容区域 */}
            <div className="content-area">
              {/* 统计面板 */}
              <div className="stats-panel">
                {/* 当前文件信息 */}
                {viewMode === 'conversations' && files.length > 1 && currentFile && (
                  <div className="current-file-info">
                    <span className="current-file-label">当前文件:</span>
                    <span className="current-file-name">{currentFile.name}</span>
                    {processedData && (
                      <span className="current-file-type">{getFileTypeDisplay(processedData)}</span>
                    )}
                  </div>
                )}
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{getStats().totalMessages}</div>
                    <div className="stat-label">总消息数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{getStats().conversationCount}</div>
                    <div className="stat-label">对话数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{getStats().fileCount}</div>
                    <div className="stat-label">文件数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{getStats().markedCount}</div>
                    <div className="stat-label">标记消息</div>
                  </div>
                </div>
              </div>

              {/* 视图内容 */}
              <div className="view-content">
                {viewMode === 'conversations' ? (
                  /* 卡片网格视图（文件或对话） */
                  <ConversationGrid
                    conversations={query ? filteredMessages : allCards}
                    onConversationSelect={handleCardSelect}
                    onFileRemove={handleFileRemove}
                    onFileAdd={() => fileInputRef.current?.click()}
                    showFileInfo={false}
                    isFileMode={allCards.some(card => card.type === 'file')}
                    showFileManagement={true} // 总是显示文件管理功能
                  />
                ) : (
                  /* 时间线视图 */
                  <ConversationTimeline
                    data={processedData}
                    conversation={allCards.find(c => c.uuid === selectedConversation)}
                    messages={Array.isArray(sortedMessages) && sortedMessages.length > 0 ? 
                      (query ? filteredMessages : sortedMessages) : 
                      (query ? filteredMessages : timelineMessages)
                    }
                    marks={marks}
                    onMessageSelect={handleMessageSelect}
                    markActions={markActions}
                    format={processedData?.format}
                    sortActions={sortActions}
                    hasCustomSort={hasCustomSort}
                    enableSorting={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 消息详情模态框 */}
          {showMessageDetail && selectedMessageIndex !== null && (
            <div className="modal-overlay" onClick={() => setShowMessageDetail(false)}>
              <div className="modal-content large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>消息详情</h2>
                  <button className="close-btn" onClick={() => setShowMessageDetail(false)}>×</button>
                </div>
                <div className="modal-tabs">
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
                <div className="modal-body">
                  <MessageDetail
                    processedData={processedData}
                    selectedMessageIndex={selectedMessageIndex}
                    activeTab={activeTab}
                    searchQuery={query}
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-secondary"
                    onClick={() => selectedMessageIndex !== null && handleMarkToggle(selectedMessageIndex, 'completed')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'completed') ? '取消完成' : '标记完成'} ✓
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => selectedMessageIndex !== null && handleMarkToggle(selectedMessageIndex, 'important')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'important') ? '取消重要' : '标记重要'} ⭐
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => selectedMessageIndex !== null && handleMarkToggle(selectedMessageIndex, 'deleted')}
                  >
                    {markActions.isMarked(selectedMessageIndex, 'deleted') ? '取消删除' : '标记删除'} 🗑️
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 文件类型冲突模态框 */}
          {showTypeConflictModal && (
            <div className="modal-overlay" onClick={() => fileActions.cancelReplaceFiles()}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>文件类型冲突</h2>
                  <button className="close-btn" onClick={() => fileActions.cancelReplaceFiles()}>×</button>
                </div>
                <div className="modal-body">
                  <p>你正在尝试加载不同类型的文件。为了保证正常显示，<strong>Claude 完整导出</strong>格式不能与其他格式同时加载。</p>
                  <br />
                  <p><strong>当前文件：</strong> {files.length} 个文件</p>
                  <p><strong>新文件：</strong> {pendingFiles.length} 个文件</p>
                  <br />
                  <p>选择"替换"将关闭当前所有文件并加载新文件。</p>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => fileActions.cancelReplaceFiles()}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={() => fileActions.confirmReplaceFiles()}>
                    替换所有文件
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 浮动操作按钮 */}
          <button 
            className="fab"
            onClick={() => setShowExportPanel(true)}
            title="导出"
          >
            📤
          </button>
          <ThemeSwitcher />

          {/* 导出面板 */}
          {showExportPanel && (
            <div className="modal-overlay" onClick={() => setShowExportPanel(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>导出选项</h2>
                <div className="export-info">
                  <div className="info-row">
                    <span className="label">当前模式:</span>
                    <span className="value">{viewMode === 'conversations' ? '对话列表' : '时间线视图'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">数据来源:</span>
                    <span className="value">{files.length} 个文件</span>
                  </div>
                  <div className="info-row">
                    <span className="label">项目数量:</span>
                    <span className="value">{getStats().conversationCount} 个对话</span>
                  </div>
                  <div className="info-row">
                    <span className="label">消息数量:</span>
                    <span className="value">{getStats().totalMessages} 条消息</span>
                  </div>
                  <div className="info-row">
                    <span className="label">标记统计:</span>
                    <span className="value">
                      完成 {stats.completed} · 重要 {stats.important} · 删除 {stats.deleted}
                    </span>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button className="btn-secondary" onClick={() => setShowExportPanel(false)}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={handleExport}>
                    导出为Markdown
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;