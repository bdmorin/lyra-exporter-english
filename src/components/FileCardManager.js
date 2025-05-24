// components/FileCardManager.js
import React, { useState } from 'react';

const FileCardManager = ({ 
  files, 
  currentFileIndex, 
  onFileSwitch, 
  onFileRemove, 
  onFileAdd,
  onFileReorder,
  getFileTypeDisplay,
  processedData 
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onFileReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDate = (file) => {
    if (!file.lastModified) return '未知时间';
    try {
      const date = new Date(file.lastModified);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return '未知时间';
    }
  };

  const getFileSize = (file) => {
    if (!file.size) return '';
    const size = file.size;
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="file-cards-container">
      <div className="file-cards-wrapper">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className={`file-card ${index === currentFileIndex ? 'active' : ''} ${
              dragOverIndex === index ? 'drag-over' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onFileSwitch(index)}
          >
            <div className="file-card-header">
              <div className="file-card-title">
                <span className="file-name" title={file.name}>
                  {file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name}
                </span>
                <button
                  className="file-card-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove(index);
                  }}
                  title="关闭文件"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="file-card-meta">
              <div className="meta-row">
                <span>📄</span>
                <span>{index === currentFileIndex && processedData ? 
                  getFileTypeDisplay(processedData) : '加载中...'}</span>
              </div>
              <div className="meta-row">
                <span>📅</span>
                <span>{formatDate(file)}</span>
              </div>
              <div className="meta-row">
                <span>📊</span>
                <span>{getFileSize(file)}</span>
              </div>
            </div>
            
            <div className="file-card-preview">
              {index === currentFileIndex && processedData ? (
                <div className="file-preview-content">
                  {processedData.format === 'claude_full_export' ? 
                    `${processedData.views?.conversationList?.length || 0}个对话，${processedData.chat_history?.length || 0}条消息` :
                    `${processedData.chat_history?.length || 0}条消息`
                  }
                </div>
              ) : (
                <div className="file-preview-placeholder">点击加载文件内容...</div>
              )}
            </div>
            
            <div className="file-card-stats">
              {index === currentFileIndex && processedData && (
                <>
                  <div className="stat-item">
                    <span>💬</span>
                    <span>{processedData.chat_history?.length || 0}条消息</span>
                  </div>
                  {processedData.format === 'claude_full_export' && (
                    <div className="stat-item">
                      <span>📋</span>
                      <span>{processedData.views?.conversationList?.length || 0}个对话</span>
                    </div>
                  )}
                  {processedData.format === 'claude_full_export' && processedData.views?.projectList?.length > 0 && (
                    <div className="stat-item">
                      <span>📁</span>
                      <span>{processedData.views?.projectList?.length}个项目</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        
        {/* 添加文件卡片 */}
        <div className="file-card add-file-card" onClick={onFileAdd}>
          <div className="add-file-content">
            <div className="add-file-icon">+</div>
            <div className="add-file-text">添加文件</div>
            <div className="add-file-hint">支持JSON格式</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCardManager;