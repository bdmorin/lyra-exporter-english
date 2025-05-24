import React, { useState, useRef, useEffect } from 'react';
import './styles/App.css';
import './styles/themes.css';
import './styles/UniversalTimeline.css';

// 组件导入
import WelcomePage from './components/WelcomePage';
import MessageDetail from './components/MessageDetail';
import MessageList from './components/MessageList';
import VirtualMessageList from './components/VirtualMessageList';
import ConversationGrid from './components/ConversationGrid';
import ConversationTimeline from './components/ConversationTimeline';
import ProjectTreeView from './components/ProjectTreeView';
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
    actions: fileActions 
  } = useFileManager();
  
  // 标记系统
  const { marks, stats, actions: markActions } = useMarkSystem(processedData?.meta_info?.uuid);
  
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'conversation' | 'project'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  
  const fileInputRef = useRef(null);

  // 文件处理
  const handleFileLoad = (e) => {
    const fileList = Array.from(e.target.files);
    fileActions.loadFiles(fileList);
  };

  // 消息选择处理
  const handleMessageSelect = (messageIndex) => {
    setSelectedMessageIndex(messageIndex);
    setShowMessageDetail(true);
    
    // 更新当前选中的对话/项目
    const selectedMessage = processedData?.chat_history?.find(m => m.index === messageIndex);
    if (selectedMessage && processedData?.format === 'claude_full_export') {
      if (selectedMessage.conversation_uuid && viewMode === 'conversation') {
        setSelectedConversation(selectedMessage.conversation_uuid);
      }
      if (selectedMessage.project_uuid && viewMode === 'project') {
        setSelectedProject(selectedMessage.project_uuid);
      }
    }
  };

  // 搜索处理
  const handleSearch = (searchText) => {
    searchActions.search(searchText);
  };

  // 标记处理
  const handleMarkToggle = (messageIndex, markType) => {
    markActions.toggleMark(messageIndex, markType);
  };

  // 对话选择处理
  const handleConversationSelect = (conversationUuid) => {
    setSelectedConversation(conversationUuid);
    setViewMode('conversation');
  };

  // 项目选择处理
  const handleProjectSelect = (projectUuid) => {
    setSelectedProject(projectUuid);
    setViewMode('project');
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

  // 获取当前视图的消息
  const getCurrentViewMessages = () => {
    if (!processedData) return [];
    
    if (processedData.format !== 'claude_full_export') {
      return processedData.chat_history || [];
    }
    
    if (viewMode === 'all') {
      return processedData.chat_history || [];
    } else if (viewMode === 'conversation') {
      if (!selectedConversation) return [];
      return processedData.chat_history.filter(msg => 
        msg.conversation_uuid === selectedConversation
      ) || [];
    } else if (viewMode === 'project') {
      if (!selectedProject) return [];
      return processedData.chat_history.filter(msg => 
        msg.project_uuid === selectedProject
      ) || [];
    }
    
    return [];
  };

  // 消息排序
  const { sortedMessages, hasCustomSort, actions: sortActions } = useMessageSort(
    getCurrentViewMessages(), 
    processedData?.meta_info?.uuid
  );

  // 搜索功能
  const { query, results, filteredMessages, actions: searchActions } = useSearch(sortedMessages);

  // 获取统计数据
  const getStats = () => {
    const totalMessages = processedData?.chat_history?.length || 0;
    const conversationCount = processedData?.views?.conversationList?.length || 0;
    const projectCount = processedData?.views?.projectList?.length || 0;
    const markedCount = stats.completed + stats.important + stats.deleted;

    return { totalMessages, conversationCount, projectCount, markedCount };
  };

// 在组件中添加主题初始化
  useEffect(() => {
  const savedTheme = localStorage.getItem('app-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}, []);

  // 导出功能
  const handleExport = () => {
    // 实现导出逻辑
    console.log('导出当前视图数据');
    setShowExportPanel(false);
  };

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
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder={processedData?.is_conversation_index 
                    ? "搜索对话标题、设置、模型..." 
                    : "搜索消息内容、思考过程、Artifacts..."
                  }
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {query && (
                  <div className="search-stats">
                    显示 {filteredMessages.length} / {getCurrentViewMessages().length} 条
                  </div>
                )}
              </div>
            </div>
            <div className="navbar-right">
              {/* 视图切换器 */}
              {processedData?.format === 'claude_full_export' && (
                <div className="view-switcher">
                  <button 
                    className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setViewMode('all');
                      setSelectedConversation(null);
                      setSelectedProject(null);
                    }}
                  >
                    📊 全部对话
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'conversation' ? 'active' : ''}`}
                    onClick={() => setViewMode('conversation')}
                  >
                    💬 对话详情
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'project' ? 'active' : ''}`}
                    onClick={() => setViewMode('project')}
                  >
                    📁 项目视图
                  </button>
                </div>
              )}
              <button 
                className="icon-btn"
                onClick={() => setShowSidebar(!showSidebar)}
                title="文件管理"
              >
                📂
              </button>
            </div>
          </nav>

          {/* 主容器 */}
          <div className="main-container">
            {/* 内容区域 */}
            <div className="content-area">
              {/* 统计面板 */}
              <div className="stats-panel">
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
                    <div className="stat-value">{getStats().projectCount}</div>
                    <div className="stat-label">项目数</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{getStats().markedCount}</div>
                    <div className="stat-label">标记消息</div>
                  </div>
                </div>
              </div>

              {/* 视图内容 */}
              <div className="view-content">
                {/* 全部对话视图 - 网格布局 */}
                {viewMode === 'all' && processedData?.format === 'claude_full_export' && (
                  <ConversationGrid
                    conversations={processedData.views?.conversationList || []}
                    onConversationSelect={handleConversationSelect}
                  />
                )}

                {/* 对话详情视图 - 时间线布局 */}
                {viewMode === 'conversation' && (
                  <>
                    {!selectedConversation ? (
                      <div className="empty-state">
                        <h3>选择一个对话</h3>
                        <div className="conversation-list-compact">
                          {processedData?.views?.conversationList?.map(conv => (
                            <div 
                              key={conv.uuid}
                              className="conversation-item-compact"
                              onClick={() => setSelectedConversation(conv.uuid)}
                            >
                              <span>{conv.name}</span>
                              {conv.is_starred && <span className="star">⭐</span>}
                              <span className="message-count">{conv.messageCount}条</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <ConversationTimeline
                        data={processedData}
                        conversation={processedData.views?.conversationList?.find(c => c.uuid === selectedConversation)}
                        messages={filteredMessages.filter(msg => 
                          !msg.is_conversation_header && msg.conversation_uuid === selectedConversation
                        )}
                        marks={marks}
                        onMessageSelect={handleMessageSelect}
                        markActions={markActions}
                        format={processedData?.format}
                      />
                    )}
                  </>
                )}

                {/* 项目视图 - 树形结构 */}
                {viewMode === 'project' && (
                  <ProjectTreeView
                    projects={processedData?.views?.projectList || []}
                    messages={processedData?.chat_history || []}
                    selectedProject={selectedProject}
                    onProjectSelect={handleProjectSelect}
                    onMessageSelect={handleMessageSelect}
                  />
                )}

                {/* 非完整导出格式时显示消息列表 */}
                {processedData?.format !== 'claude_full_export' && (
                  <div className="message-list-container">
                    <ConversationTimeline
                      data={processedData}
                      messages={filteredMessages}
                      marks={marks}
                      onMessageSelect={handleMessageSelect}
                      markActions={markActions}
                      format={processedData?.format}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 侧边栏 - 文件管理 */}
            <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
              <div className="sidebar-header">
                <h3>文件列表</h3>
                <button 
                  className="btn-primary small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  加载文件
                </button>
              </div>
              <div className="file-list">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className={`file-item ${index === currentFileIndex ? 'active' : ''}`}
                    onClick={() => fileActions.switchFile(index)}
                  >
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      {index === currentFileIndex && processedData && (
                        <span className="file-type">{getFileTypeDisplay(processedData)}</span>
                      )}
                    </div>
                    <button
                      className="file-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileActions.removeFile(index);
                      }}
                      title="删除文件"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 工具栏 */}
              <div className="sidebar-toolbar">
                {!query && !hasCustomSort && (
                  <button 
                    className="btn-secondary"
                    onClick={() => sortActions.moveMessage(0, 'none')}
                    title="启用消息排序"
                  >
                    🔄 启用排序
                  </button>
                )}
                {hasCustomSort && (
                  <button 
                    className="btn-secondary"
                    onClick={() => sortActions.resetSort()}
                    title="重置排序"
                  >
                    🔄 重置排序
                  </button>
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
                    <span className="label">当前文件:</span>
                    <span className="value">{currentFile?.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">文件类型:</span>
                    <span className="value">{getFileTypeDisplay(processedData)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">当前视图:</span>
                    <span className="value">
                      {viewMode === 'all' ? '全部对话' : 
                       viewMode === 'conversation' ? '对话详情' : '项目视图'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">消息数量:</span>
                    <span className="value">{filteredMessages.length}</span>
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