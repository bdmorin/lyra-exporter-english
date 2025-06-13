// components/MessageDetail.js
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  // 自定义渲染组件，用于搜索高亮
  const MarkdownComponents = {
    // 自定义文本渲染器，添加搜索高亮
    p: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <p {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <p {...props}>{children}</p>;
    },
    
    // 自定义列表项渲染器
    li: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <li {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <li {...props}>{children}</li>;
    },
    
    // 自定义标题渲染器
    h1: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h1 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h1 {...props}>{children}</h1>;
    },
    
    h2: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h2 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h2 {...props}>{children}</h2>;
    },
    
    h3: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h3 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h3 {...props}>{children}</h3>;
    },
    
    h4: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h4 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h4 {...props}>{children}</h4>;
    },
    
    h5: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h5 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h5 {...props}>{children}</h5>;
    },
    
    h6: ({ children, ...props }) => {
      if (typeof children === 'string' && searchQuery) {
        const highlightedText = highlightSearchText(children, searchQuery);
        return <h6 {...props} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
      }
      return <h6 {...props}>{children}</h6>;
    },

    // 自定义代码块渲染器
    pre: ({ children, ...props }) => (
      <pre {...props} style={{ overflowX: 'auto' }}>
        {children}
      </pre>
    ),

    // 自定义行内代码渲染器
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return <code className="inline-code" {...props}>{children}</code>;
      }
      
      // 代码块
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return (
        <code 
          className={`code-block ${className || ''}`} 
          data-language={language}
          {...props}
        >
          {children}
        </code>
      );
    },

    // 自定义链接渲染器
    a: ({ href, children, ...props }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props}
      >
        {children}
      </a>
    ),

    // 自定义引用块渲染器
    blockquote: ({ children, ...props }) => (
      <blockquote {...props}>{children}</blockquote>
    ),

    // 自定义表格渲染器
    table: ({ children, ...props }) => (
      <div style={{ overflowX: 'auto' }}>
        <table {...props}>{children}</table>
      </div>
    )
  };

  // 搜索高亮功能
  const highlightSearchText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // 处理搜索高亮的递归函数
  const processChildrenForHighlight = (children) => {
    if (typeof children === 'string') {
      return searchQuery ? highlightSearchText(children, searchQuery) : children;
    }
    
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === 'string') {
          return searchQuery ? highlightSearchText(child, searchQuery) : child;
        }
        return child;
      });
    }
    
    return children;
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
              {currentMessage.branch_level > 0 && (
                <span className="branch-indicator">↳{currentMessage.branch_level} 分支</span>
              )}
            </div>
            
            <div className="message-text">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {currentMessage.display_text || ''}
              </ReactMarkdown>
            </div>
            
            {renderTools(currentMessage.tools)}
            {renderCitations(currentMessage.citations)}
          </div>
        );

      case 'thinking':
        return (
          <div className="thinking-content">
            {currentMessage.thinking ? (
              <div className="thinking-text">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents}
                >
                  {currentMessage.thinking}
                </ReactMarkdown>
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