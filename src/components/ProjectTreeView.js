// components/ProjectTreeView.js
import React, { useState } from 'react';

const ProjectTreeView = ({ 
  projects, 
  messages, 
  selectedProject,
  onProjectSelect,
  onMessageSelect 
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [expandedConversations, setExpandedConversations] = useState(new Set());

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleConversation = (convId) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(convId)) {
      newExpanded.delete(convId);
    } else {
      newExpanded.add(convId);
    }
    setExpandedConversations(newExpanded);
  };

  // 按项目和对话组织消息
  const getProjectStructure = () => {
    const structure = {};
    
    // 初始化项目结构
    projects.forEach(project => {
      structure[project.uuid] = {
        ...project,
        conversations: {},
        directMessages: []
      };
    });

    // 添加"无项目"分类
    structure['no_project'] = {
      uuid: 'no_project',
      name: '无项目',
      conversations: {},
      directMessages: []
    };

    // 组织消息
    messages.forEach(msg => {
      if (msg.is_conversation_header) return;
      
      const projectId = msg.project_uuid || 'no_project';
      const conversationId = msg.conversation_uuid;
      
      if (!structure[projectId]) {
        structure[projectId] = {
          uuid: projectId,
          name: msg.project_name || '未知项目',
          conversations: {},
          directMessages: []
        };
      }
      
      if (conversationId) {
        if (!structure[projectId].conversations[conversationId]) {
          structure[projectId].conversations[conversationId] = {
            uuid: conversationId,
            name: msg.conversation_name || '未命名对话',
            messages: []
          };
        }
        structure[projectId].conversations[conversationId].messages.push(msg);
      } else {
        structure[projectId].directMessages.push(msg);
      }
    });

    return structure;
  };

  const projectStructure = getProjectStructure();

  const renderMessage = (msg) => (
    <div 
      key={msg.index}
      className="tree-message"
      onClick={() => onMessageSelect(msg.index)}
    >
      <span className="tree-message-sender">
        {msg.sender === 'human' ? '👤' : '🤖'}
      </span>
      <span className="tree-message-text">
        {msg.display_text ? msg.display_text.substring(0, 50) + '...' : '无内容'}
      </span>
      <span className="tree-message-time">{msg.timestamp}</span>
    </div>
  );

  const renderConversation = (projectId, conversation) => {
    const isExpanded = expandedConversations.has(conversation.uuid);
    
    return (
      <div key={conversation.uuid} className="tree-node conversation-node">
        <div 
          className="tree-node-content"
          onClick={() => toggleConversation(conversation.uuid)}
        >
          <span className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}>▶</span>
          <span className="tree-icon">💬</span>
          <span className="tree-label">{conversation.name}</span>
          <span className="tree-count">{conversation.messages.length}</span>
        </div>
        {isExpanded && (
          <div className="tree-children">
            {conversation.messages.map(renderMessage)}
          </div>
        )}
      </div>
    );
  };

  const renderProject = (project) => {
    const isExpanded = expandedNodes.has(project.uuid);
    const conversations = Object.values(project.conversations);
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0) + 
                         project.directMessages.length;
    
    return (
      <div key={project.uuid} className="tree-node project-node">
        <div 
          className={`tree-node-content ${selectedProject === project.uuid ? 'selected' : ''}`}
          onClick={() => {
            toggleNode(project.uuid);
            onProjectSelect(project.uuid);
          }}
        >
          <span className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}>▶</span>
          <span className="tree-icon">📁</span>
          <span className="tree-label">{project.name}</span>
          <span className="tree-count">{totalMessages}条消息</span>
        </div>
        {isExpanded && (
          <div className="tree-children">
            {conversations.map(conv => renderConversation(project.uuid, conv))}
            {project.directMessages.length > 0 && (
              <div className="tree-node">
                <div className="tree-node-content">
                  <span className="tree-icon">📄</span>
                  <span className="tree-label">直接消息</span>
                  <span className="tree-count">{project.directMessages.length}</span>
                </div>
                <div className="tree-children">
                  {project.directMessages.map(renderMessage)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-tree">
      <div className="tree-header">
        <h3>项目结构</h3>
        <div className="tree-stats">
          {Object.keys(projectStructure).length} 个项目
        </div>
      </div>
      
      <div className="tree-content">
        {Object.values(projectStructure).map(renderProject)}
      </div>
    </div>
  );
};

export default ProjectTreeView;