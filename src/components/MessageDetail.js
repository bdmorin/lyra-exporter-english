// components/MessageDetail.js
import React, { useState, useRef, useEffect } from 'react';

const MessageDetail = ({ 
  processedData, 
  selectedMessageIndex, 
  activeTab, 
  searchQuery 
}) => {
  const contentRef = useRef(null);
  
  // 获取当前选中的消息
  const getCurrentMessage = () => {
    if (!processedData?.chat_history || selectedMessageIndex === null) {
      return null;
    }
    return processedData.chat_history.find(msg => msg.index === selectedMessageIndex);
  };

  const currentMessage = getCurrentMessage();

  // 搜索高亮功能
  const highlightSearchText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // 渲染内容（支持改进的Markdown风格）
  const renderContent = (text) => {
    if (!text) return '';
    
    // 存储代码块内容，避免被其他规则处理
    const codeBlocks = [];
    const codeBlockPlaceholder = '___CODEBLOCK___';
    
    // 先提取并保存代码块（支持多种格式）
    let content = text.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length;
      const language = lang || '';
      const cleanCode = code.trim();
      codeBlocks.push(`<pre class="code-block" data-language="${language}"><code>${cleanCode}</code></pre>`);
      return `${codeBlockPlaceholder}${index}${codeBlockPlaceholder}`;
    });

    // 存储行内代码，避免被其他规则处理
    const inlineCodes = [];
    const inlineCodePlaceholder = '___INLINECODE___';
    content = content.replace(/`([^`\n]+)`/g, (match, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code class="inline-code">${code}</code>`);
      return `${inlineCodePlaceholder}${index}${inlineCodePlaceholder}`;
    });

    // 处理标题（1-6级）
    content = content.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
    content = content.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
    content = content.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
    content = content.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
    content = content.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
    content = content.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');

    // 处理列表
    // 无序列表
    content = content.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');
    content = content.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // 有序列表
    content = content.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // 处理引用
    content = content.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    content = content.replace(/(<blockquote>.*<\/blockquote>)/gs, (match) => {
      return match.replace(/<\/blockquote><blockquote>/g, '<br>');
    });

    // 处理粗体和斜体（注意顺序很重要）
    content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 处理删除线
    content = content.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // 处理链接
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 处理水平线
    content = content.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');

    // 处理换行（在处理完其他元素后）
    content = content.replace(/\n\n/g, '</p><p>');
    content = content.replace(/\n/g, '<br>');
    
    // 包装段落
    if (content.trim()) {
      content = '<p>' + content + '</p>';
      // 清理多余的空段落
      content = content.replace(/<p><\/p>/g, '');
      content = content.replace(/<p>\s*<\/p>/g, '');
    }

    // 恢复代码块
    codeBlocks.forEach((block, index) => {
      content = content.replace(`${codeBlockPlaceholder}${index}${codeBlockPlaceholder}`, block);
    });

    // 恢复行内代码
    inlineCodes.forEach((code, index) => {
      content = content.replace(`${inlineCodePlaceholder}${index}${inlineCodePlaceholder}`, code);
    });

    // 应用搜索高亮（在最后应用，避免破坏HTML结构）
    if (searchQuery) {
      content = highlightSearchText(content, searchQuery);
    }

    return content;
  };

  // 渲染Artifacts
  const renderArtifacts = (artifacts) => {
    if (!artifacts || artifacts.length === 0) {
      return <div className="placeholder">此消息没有使用Artifacts</div>;
    }

    return artifacts.map((artifact, index) => (
      <div key={index} className="artifact-item">
        <h4>Artifact {index + 1}: {artifact.title || '无标题'}</h4>
        <div className="artifact-meta">
          <span>ID: {artifact.id || '未知'}</span>
          <span>类型: {artifact.type || '未知'}</span>
          <span>操作: {artifact.command || '未知'}</span>
        </div>
        
        {artifact.command === 'create' && (
          <div className="artifact-content">
            {artifact.language && (
              <div className="language-tag">语言: {artifact.language}</div>
            )}
            <pre className="artifact-code">
              <code>{artifact.content || ''}</code>
            </pre>
          </div>
        )}
        
        {(artifact.command === 'update' || artifact.command === 'rewrite') && (
          <div className="artifact-content">
            <div className="artifact-change">
              <h5>原始文本:</h5>
              <pre><code>{artifact.old_str || ''}</code></pre>
            </div>
            <div className="artifact-change">
              <h5>新文本:</h5>
              <pre><code>{artifact.new_str || ''}</code></pre>
            </div>
          </div>
        )}
      </div>
    ));
  };

  // 渲染工具使用记录
  const renderTools = (tools) => {
    if (!tools || tools.length === 0) {
      return null;
    }

    return tools.map((tool, index) => (
      <div key={index} className="tool-item">
        <h4>工具: {tool.name}</h4>
        
        {tool.query && (
          <div className="tool-query">
            <strong>搜索查询:</strong> {tool.query}
          </div>
        )}
        
        {tool.input && (
          <div className="tool-input">
            <strong>输入参数:</strong>
            <pre><code>{JSON.stringify(tool.input, null, 2)}</code></pre>
          </div>
        )}
        
        {tool.result && (
          <div className="tool-result">
            <strong>结果:</strong>
            {tool.result.is_error && (
              <div className="error-notice">⚠️ 工具执行出错</div>
            )}
            
            {tool.name === 'web_search' && tool.result.content && (
              <div className="search-results">
                {tool.result.content.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="search-result-item">
                    <a href={item.url || '#'} target="_blank" rel="noopener noreferrer">
                      {item.title || '无标题'}
                    </a>
                  </div>
                ))}
                {tool.result.content.length > 5 && (
                  <div className="more-results">
                    ...还有 {tool.result.content.length - 5} 个结果
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  // 渲染引用
  const renderCitations = (citations) => {
    if (!citations || citations.length === 0) {
      return null;
    }

    return (
      <div className="citations">
        <h4>引用来源</h4>
        <div className="citation-list">
          {citations.map((citation, index) => (
            <div key={index} className="citation-item">
              <a href={citation.url || '#'} target="_blank" rel="noopener noreferrer">
                {citation.title || '未知来源'}
              </a>
              <span className="citation-source">
                {citation.url ? new URL(citation.url).hostname : '未知网站'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 主要渲染逻辑
  const renderTabContent = () => {
    if (!currentMessage) {
      return <div className="placeholder">选择一条消息查看详情</div>;
    }

    switch (activeTab) {
      case 'content':
        return (
          <div className="message-content">
            <div className="message-header">
              <h3>{currentMessage.sender_label}</h3>
              <span className="timestamp">{currentMessage.timestamp}</span>
              {currentMessage.is_branch_point && (
                <span className="branch-indicator">🔀 分支点</span>
              )}
              {currentMessage.branch_level > 0 && (
                <span className="branch-indicator">↳{currentMessage.branch_level} 分支</span>
              )}
            </div>
            
            <div 
              className="message-text"
              dangerouslySetInnerHTML={{ 
                __html: renderContent(currentMessage.display_text) 
              }}
            />
            
            {renderTools(currentMessage.tools)}
            {renderCitations(currentMessage.citations)}
          </div>
        );

      case 'thinking':
        return (
          <div className="thinking-content">
            {currentMessage.thinking ? (
              <div className="thinking-text">
                <pre>{currentMessage.thinking}</pre>
              </div>
            ) : (
              <div className="placeholder">此消息没有思考过程记录</div>
            )}
          </div>
        );

      case 'artifacts':
        return (
          <div className="artifacts-content">
            {renderArtifacts(currentMessage.artifacts)}
          </div>
        );

      default:
        return <div className="placeholder">请选择一个标签页</div>;
    }
  };

  return (
    <div className="message-detail" ref={contentRef}>
      {renderTabContent()}
    </div>
  );
};

export default MessageDetail;