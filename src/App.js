import React, { useState, useRef, useEffect } from 'react';
import './styles/App.css';

// 组件导入
import WelcomePage from './components/WelcomePage';
import MessageDetail from './components/MessageDetail';
import MessageList from './components/MessageList';
import VirtualMessageList from './components/VirtualMessageList';

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
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'conversations' | 'projects'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false); // 移动端滚动状态
  
  const fileInputRef = useRef(null);
  const rightPanelRef = useRef(null);

  // 文件处理
  const handleFileLoad = (e) => {
    const fileList = Array.from(e.target.files);
    fileActions.loadFiles(fileList);
  };

  // 消息选择处理
  const handleMessageSelect = (messageIndex) => {
    setSelectedMessageIndex(messageIndex);
    
    // 如果选中的消息有对话/项目信息，更新当前选中的对话/项目
    const selectedMessage = processedData?.chat_history?.find(m => m.index === messageIndex);
    if (selectedMessage && processedData?.format === 'claude_full_export') {
      if (selectedMessage.conversation_uuid && viewMode === 'conversations') {
        setSelectedConversation(selectedMessage.conversation_uuid);
      }
      if (selectedMessage.project_uuid && viewMode === 'projects') {
        setSelectedProject(selectedMessage.project_uuid);
      }
    }
    
    // 移动端点击消息后自动隐藏左侧面板
    if (window.innerWidth <= 768) {
      setShowLeftPanel(false);
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
    
    // 如果不是完整导出格式，直接返回所有消息
    if (processedData.format !== 'claude_full_export') {
      return processedData.chat_history || [];
    }
    
    // 完整导出格式根据视图模式返回不同消息
    if (viewMode === 'all') {
      return processedData.chat_history || [];
    } else if (viewMode === 'conversations') {
      if (!selectedConversation) return []; // 未选择对话时返回空数组
      const conv = processedData.views?.conversations[selectedConversation];
      return conv?.messages || [];
    } else if (viewMode === 'projects') {
      if (!selectedProject) return []; // 未选择项目时返回空数组
      const proj = processedData.views?.projects[selectedProject];
      return proj?.messages || [];
    }
    
    return [];
  };

  // 消息排序 - 使用当前视图的消息
  const { sortedMessages, hasCustomSort, actions: sortActions } = useMessageSort(
    getCurrentViewMessages(), 
    processedData?.meta_info?.uuid
  );

  // 搜索功能 - 使用排序后的消息
  const { query, results, filteredMessages, actions: searchActions } = useSearch(sortedMessages);

  // 监听滚动（移动端）
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 768 && rightPanelRef.current) {
        const scrollTop = rightPanelRef.current.scrollTop;
        setIsScrolled(scrollTop > 50); // 滚动超过50px就认为已滚动
      }
    };

    const panel = rightPanelRef.current;
    if (panel) {
      panel.addEventListener('scroll', handleScroll);
      return () => panel.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="app">
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
        /* 主布局 */
        <div className="app-container">
          {/* 移动端导航按钮（滚动时） */}
          {!showLeftPanel && isScrolled && (
            <button 
              className="mobile-nav-toggle scrolled"
              onClick={() => setShowLeftPanel(true)}
            >
              ☰
            </button>
          )}

          {/* 左侧面板 */}
          <div className={`left-panel ${!showLeftPanel ? 'hidden' : ''}`}>
            {/* 移动端关闭按钮 */}
            {showLeftPanel && window.innerWidth <= 768 && (
              <button 
                className="mobile-close-btn"
                onClick={() => setShowLeftPanel(false)}
              >
                × 关闭
              </button>
            )}
            
            {/* 文件列表区域 */}
            <div className="file-list-section">
              <div className="panel-header">
                <h3>文件列表</h3>
                <button 
                  className="btn-primary"
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
            </div>

            {/* 消息列表区域 */}
            <div className="message-list-section">
              {/* 如果是完整导出格式，显示视图选择 */}
              {processedData?.format === 'claude_full_export' && viewMode !== 'all' && (
                <div className="view-selector-panel">
                  <div className="panel-header">
                    <h3>
                      {viewMode === 'conversations' ? '选择对话' : '选择项目'}
                    </h3>
                    <button 
                      className="btn-secondary btn-small"
                      onClick={() => {
                        setViewMode('all');
                        setSelectedConversation(null);
                        setSelectedProject(null);
                      }}
                    >
                      返回全部
                    </button>
                  </div>
                  <div className="view-selector-list">
                    {viewMode === 'conversations' ? (
                      processedData.views?.conversationList?.map(conv => (
                        <div
                          key={conv.uuid}
                          className={`view-selector-item ${selectedConversation === conv.uuid ? 'active' : ''}`}
                          onClick={() => setSelectedConversation(conv.uuid)}
                        >
                          <div className="selector-item-title">
                            {conv.name} {conv.is_starred && '⭐'}
                          </div>
                          <div className="selector-item-meta">
                            {conv.messageCount} 条消息
                          </div>
                        </div>
                      ))
                    ) : (
                      processedData.views?.projectList?.map(proj => (
                        <div
                          key={proj.uuid}
                          className={`view-selector-item ${selectedProject === proj.uuid ? 'active' : ''}`}
                          onClick={() => setSelectedProject(proj.uuid)}
                        >
                          <div className="selector-item-title">
                            {proj.name}
                          </div>
                          <div className="selector-item-meta">
                            {proj.conversations.length} 个对话, {proj.messageCount} 条消息
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              <div className="panel-header">
                <h3>
                  {processedData?.is_conversation_index ? '对话列表' : '消息列表'}
                </h3>
                {processedData && (
                  <span className="message-count">
                    {processedData.is_conversation_index 
                      ? `${processedData.chat_history?.length - 1 || 0} 个对话` 
                      : `${filteredMessages.length} 条消息`
                    }
                    {query && ` (共 ${getCurrentViewMessages().length} 条)`}
                    {processedData.format === 'claude_full_export' && viewMode !== 'all' && (
                      <span style={{fontSize: '11px', opacity: 0.8}}>
                        {viewMode === 'conversations' && selectedConversation && ' (当前对话)'}
                        {viewMode === 'projects' && selectedProject && ' (当前项目)'}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="message-list">
                {isLoading ? (
                  <p className="placeholder">正在加载...</p>
                ) : error ? (
                  <p className="placeholder error">加载错误: {error}</p>
                ) : filteredMessages.length > 0 ? (
                  filteredMessages.length > 100 ? (
                    // 超过100条消息使用虚拟滚动
                    <VirtualMessageList
                      messages={filteredMessages}
                      selectedMessageIndex={selectedMessageIndex}
                      onMessageSelect={handleMessageSelect}
                      marks={marks}
                      searchResults={results}
                      searchQuery={query}
                    />
                  ) : (
                    // 100条以内使用普通列表
                    <MessageList
                      messages={filteredMessages}
                      selectedMessageIndex={selectedMessageIndex}
                      onMessageSelect={handleMessageSelect}
                      marks={marks}
                      searchResults={results}
                      searchQuery={query}
                      processedData={processedData}
                      onMoveMessage={hasCustomSort ? sortActions.moveMessage : null}
                      hasCustomSort={hasCustomSort}
                    />
                  )
                ) : (
                  <p className="placeholder">
                    {processedData?.format === 'claude_full_export' && viewMode !== 'all' && (
                      viewMode === 'conversations' ? '请选择一个对话' : '请选择一个项目'
                    ) || '选择文件查看消息'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="right-panel" ref={rightPanelRef}>
            {/* 搜索栏 */}
            <div className={`search-section ${!showLeftPanel && !isScrolled ? 'with-nav-button' : ''}`}>
              {/* 移动端导航按钮（在搜索栏内） */}
              {!showLeftPanel && !isScrolled && (
                <button 
                  className="mobile-nav-toggle in-search-bar"
                  onClick={() => setShowLeftPanel(true)}
                >
                  ☰ 消息列表
                </button>
              )}
              <input 
                type="text" 
                placeholder={processedData?.is_conversation_index 
                  ? "搜索对话标题、设置、模型..." 
                  : "搜索消息内容、思考过程、Artifacts..."
                } 
                className="search-input"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {query && (
                <div className="search-stats">
                  显示 {filteredMessages.length} / {getCurrentViewMessages().length} 条{processedData?.is_conversation_index ? '对话' : '消息'}
                  {filteredMessages.length === 0 && (
                    <span className="search-tip"> · 未找到匹配的内容</span>
                  )}
                </div>
              )}
            </div>

            {/* 视图切换 - 仅在完整导出格式时显示 */}
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
                  📄 全部消息
                </button>
                <button 
                  className={`view-btn ${viewMode === 'conversations' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('conversations');
                  }}
                >
                  💬 按对话查看
                </button>
                <button 
                  className={`view-btn ${viewMode === 'projects' ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode('projects');
                  }}
                >
                  📁 按项目查看
                </button>
              </div>
            )}

            {/* 标签栏 */}
            <div className="tab-bar">
              <button 
                className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                {processedData?.is_conversation_index ? '详情' : '内容'}
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
                Artifacts (旧)
              </button>
            </div>

            {/* 消息详情区域 */}
            <div className="message-detail-section">
              <MessageDetail
                processedData={processedData}
                selectedMessageIndex={selectedMessageIndex}
                activeTab={activeTab}
                searchQuery={query}
              />
            </div>

            {/* 工具栏 */}
            <div className="toolbar">
              {/* 如果允许排序且没有搜索，显示启用排序按钮 */}
              {!query && !hasCustomSort && (
                <button 
                  className="btn-secondary"
                  onClick={() => sortActions.moveMessage(0, 'none')} // 触发初始化
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
              <button 
                className="btn-secondary"
                onClick={() => selectedMessageIndex !== null && handleMarkToggle(selectedMessageIndex, 'completed')}
                disabled={selectedMessageIndex === null}
                title="标记为已完成"
              >
                标记完成 {markActions.isMarked(selectedMessageIndex, 'completed') ? '✓' : ''}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => selectedMessageIndex !== null && handleMarkToggle(selectedMessageIndex, 'important')}
                disabled={selectedMessageIndex === null}
                title="标记为重要"
              >
                标记重要 {markActions.isMarked(selectedMessageIndex, 'important') ? '⭐' : ''}
              </button>
              <button 
                className="btn-primary"
                onClick={() => setShowExportPanel(!showExportPanel)}
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导出面板 */}
      {showExportPanel && (
        <div className="modal-overlay" onClick={() => setShowExportPanel(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>导出选项</h2>
            <div className="export-preview">
              <p>当前文件: {currentFile?.name}</p>
              <p>文件类型: {getFileTypeDisplay(processedData)}</p>
              <p>{processedData?.is_conversation_index ? '对话' : '消息'}数量: {processedData?.chat_history?.length || 0}</p>
              <p>标记统计: 完成 {stats.completed} · 重要 {stats.important} · 删除 {stats.deleted}</p>
              {processedData?.is_conversation_index && (
                <div className="conversion-notice">
                  <p style={{color: '#666', fontSize: '12px', marginTop: '8px'}}>
                    ⚠️ 注意：对话列表文件只包含摘要信息，导出时将显示对话元数据而非具体消息内容
                  </p>
                </div>
              )}
            </div>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setShowExportPanel(false)}>
                取消
              </button>
              <button className="btn-primary">
                导出为Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;