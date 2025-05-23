import React, { useState, useRef } from 'react';
import './styles/App.css';

// 组件导入
import WelcomePage from './components/WelcomePage';
import MessageDetail from './components/MessageDetail';
import MessageList from './components/MessageList';
// import SearchBar from './components/SearchBar';
// import ExportPanel from './components/ExportPanel';

// 自定义Hooks导入
import { useFileManager } from './hooks/useFileManager';
import { useMarkSystem } from './hooks/useMarkSystem';
import { useSearch } from './hooks/useSearch';

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
  
  // 搜索功能
  const { query, results, actions: searchActions } = useSearch(processedData?.chat_history || []);
  
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showExportPanel, setShowExportPanel] = useState(false);
  
  const fileInputRef = useRef(null);

  // 文件处理
  const handleFileLoad = (e) => {
    const fileList = Array.from(e.target.files);
    fileActions.loadFiles(fileList);
  };

  // 消息选择处理
  const handleMessageSelect = (messageIndex) => {
    setSelectedMessageIndex(messageIndex);
  };

  // 搜索处理
  const handleSearch = (searchText) => {
    searchActions.search(searchText);
  };

  // 标记处理
  const handleMarkToggle = (messageIndex, markType) => {
    markActions.toggleMark(messageIndex, markType);
  };

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
          {/* 左侧面板 */}
          <div className="left-panel">
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
                    <span className="file-name">{file.name}</span>
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
              <div className="panel-header">
                <h3>消息列表</h3>
                {processedData && (
                  <span className="message-count">
                    {processedData.chat_history?.length || 0} 条消息
                  </span>
                )}
              </div>
              <div className="message-list">
                {isLoading ? (
                  <p className="placeholder">正在加载...</p>
                ) : error ? (
                  <p className="placeholder error">加载错误: {error}</p>
                ) : processedData?.chat_history?.length > 0 ? (
                  <MessageList
                    messages={processedData.chat_history}
                    selectedMessageIndex={selectedMessageIndex}
                    onMessageSelect={handleMessageSelect}
                    marks={marks}
                    searchResults={results}
                    searchQuery={query}
                  />
                ) : (
                  <p className="placeholder">选择文件查看消息</p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="right-panel">
            {/* 搜索栏 */}
            <div className="search-section">
              <input 
                type="text" 
                placeholder="搜索消息内容、思考过程、Artifacts..." 
                className="search-input"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {query && (
                <div className="search-stats">
                  找到 {results.length} 条消息，共 {results.reduce((acc, result) => acc + result.matches.length, 0)} 个匹配项
                  {results.length > 0 && (
                    <span className="search-tip"> · 左侧消息带橙色边框表示包含搜索结果</span>
                  )}
                </div>
              )}
            </div>

            {/* 标签栏 */}
            <div className="tab-bar">
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
            {/* TODO: ExportPanel组件 */}
            <div className="export-preview">
              <p>当前文件: {currentFile?.name}</p>
              <p>消息数量: {processedData?.chat_history?.length || 0}</p>
              <p>标记统计: 完成 {stats.completed} · 重要 {stats.important} · 删除 {stats.deleted}</p>
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