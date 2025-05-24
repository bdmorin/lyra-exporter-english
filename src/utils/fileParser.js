// utils/fileParser.js
// 文件解析相关功能

// 解析时间戳
export const parseTimestamp = (timestampStr) => {
  if (!timestampStr) return "未知时间";
  
  try {
    // 处理带时区的时间戳
    if (timestampStr.includes("+")) {
      timestampStr = timestampStr.split("+")[0];
    } else if (timestampStr.includes("Z")) {
      timestampStr = timestampStr.replace("Z", "");
    }
    
    const dt = new Date(timestampStr);
    return dt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error("解析时间戳错误:", error);
    return "未知时间";
  }
};

// 检测JSON文件格式
export const detectFileFormat = (jsonData) => {
  // Gemini/NotebookLM格式 - 直接是数组，元素包含human和assistant
  if (Array.isArray(jsonData) && jsonData.length > 0) {
    const firstItem = jsonData[0];
    if (firstItem && typeof firstItem === 'object' && 
        ('human' in firstItem || 'assistant' in firstItem)) {
      return 'gemini_notebooklm';
    }
    // Claude全部对话格式 - 数组包含对话摘要
    if (firstItem && typeof firstItem === 'object' && 
        'uuid' in firstItem && 'created_at' in firstItem && 
        'model' in firstItem && 'name' in firstItem) {
      return 'claude_conversations';
    }
  }
  
  // Claude完整导出格式 - 包含exportedAt和conversations
  if (typeof jsonData === 'object' && jsonData !== null) {
    if (jsonData.exportedAt && jsonData.conversations && Array.isArray(jsonData.conversations)) {
      return 'claude_full_export';
    }
    // Claude单个对话格式 - 对象结构，包含chat_messages
    if (jsonData.chat_messages && Array.isArray(jsonData.chat_messages)) {
      return 'claude';
    }
  }
  
  return 'unknown';
};

// 主要的文件解析入口函数（替换原来的extractChatData）
export const extractChatData = (jsonData, fileName = '') => {
  const format = detectFileFormat(jsonData);
  
  switch (format) {
    case 'claude':
      return extractClaudeData(jsonData);
    case 'gemini_notebooklm':
      return extractGeminiNotebookLMData(jsonData, fileName);
    case 'claude_conversations':
      return extractClaudeConversationsData(jsonData, fileName);
    case 'claude_full_export':
      return extractClaudeFullExportData(jsonData, fileName);
    default:
      throw new Error(`不支持的文件格式: ${format}`);
  }
};

// 解析Gemini/NotebookLM格式
const extractGeminiNotebookLMData = (jsonData, fileName) => {
  const now = new Date();
  const platform = fileName.toLowerCase().includes('gemini') ? 'Gemini' : 
                   fileName.toLowerCase().includes('notebooklm') ? 'NotebookLM' : 'AI';
  
  const metaInfo = {
    title: `${platform}对话记录`,
    created_at: now.toLocaleString('zh-CN'),
    updated_at: now.toLocaleString('zh-CN'),
    project_uuid: "",
    uuid: `${platform.toLowerCase()}_${Date.now()}`,
    platform: platform.toLowerCase()
  };

  const chatHistory = [];
  let messageIndex = 0;

  jsonData.forEach((item, itemIndex) => {
    // 处理人类消息
    if (item.human && item.human.trim()) {
      const humanMessage = {
        index: messageIndex++,
        uuid: `human_${itemIndex}`,
        parent_uuid: messageIndex > 1 ? `assistant_${itemIndex - 1}` : "",
        sender: "human",
        sender_label: "人类",
        timestamp: now.toLocaleString('zh-CN'),
        content_items: [],
        raw_text: item.human,
        display_text: item.human,
        thinking: "",
        tools: [],
        artifacts: [],
        citations: [],
        branch_id: null,
        is_branch_point: false,
        branch_level: 0
      };
      chatHistory.push(humanMessage);
    }

    // 处理AI助手消息
    if (item.assistant && item.assistant.trim()) {
      const assistantMessage = {
        index: messageIndex++,
        uuid: `assistant_${itemIndex}`,
        parent_uuid: `human_${itemIndex}`,
        sender: "assistant",
        sender_label: platform,
        timestamp: now.toLocaleString('zh-CN'),
        content_items: [],
        raw_text: item.assistant,
        display_text: item.assistant,
        thinking: "",
        tools: [],
        artifacts: [],
        citations: [],
        branch_id: null,
        is_branch_point: false,
        branch_level: 0
      };
      chatHistory.push(assistantMessage);
    }
  });

  return {
    meta_info: metaInfo,
    chat_history: chatHistory,
    raw_data: jsonData,
    format: 'gemini_notebooklm',
    platform: platform.toLowerCase()
  };
};

// 从Claude JSON数据中提取对话内容（保持原有逻辑）
const extractClaudeData = (jsonData) => {
  // 提取元数据
  const title = jsonData.name || "无标题对话";
  const createdAt = parseTimestamp(jsonData.created_at);
  const updatedAt = parseTimestamp(jsonData.updated_at);

  const metaInfo = {
    title,
    created_at: createdAt,
    updated_at: updatedAt,
    project_uuid: jsonData.project_uuid || "",
    uuid: jsonData.uuid || "",
    platform: 'claude'
  };

  // 提取聊天历史
  const chatHistory = [];

  try {
    // 处理消息
    const messages = jsonData.chat_messages || [];

    messages.forEach((msg, msgIdx) => {
      const sender = msg.sender || "unknown";
      const senderLabel = sender === "human" ? "人类" : "Claude";
      const timestamp = parseTimestamp(msg.created_at);

      // 准备消息结构
      const messageData = {
        index: msgIdx,
        uuid: msg.uuid || "",
        parent_uuid: msg.parent_message_uuid || "",
        sender,
        sender_label: senderLabel,
        timestamp,
        content_items: [],
        raw_text: "",
        display_text: "",
        thinking: "",
        tools: [],
        artifacts: [],
        citations: [],
        // 分支相关字段
        branch_id: null,
        is_branch_point: false,
        branch_level: 0
      };

      // 处理消息内容
      if (msg.content && Array.isArray(msg.content)) {
        // 新格式: 使用content数组
        processContentArray(msg.content, messageData);
      } else if (msg.text) {
        // 旧格式: 直接使用text字段
        messageData.raw_text = msg.text;
        messageData.display_text = msg.text;
      }

      chatHistory.push(messageData);
    });
  } catch (error) {
    console.error("解析JSON时出错:", error);
    throw error;
  }

  return {
    meta_info: metaInfo,
    chat_history: chatHistory,
    raw_data: jsonData,
    format: 'claude'
  };
};

// 处理content数组中的所有元素
const processContentArray = (contentArray, messageData) => {
  let displayText = "";

  contentArray.forEach(item => {
    if (!item || typeof item !== 'object') return;
    
    const contentType = item.type || "";
    
    // 处理不同类型的内容
    if (contentType === "text") {
      const text = item.text || "";
      messageData.raw_text += text;
      displayText += text;
      
      // 处理citations字段
      if (item.citations && Array.isArray(item.citations)) {
        item.citations.forEach(citation => {
          if (citation && typeof citation === 'object') {
            messageData.citations.push(citation);
          }
        });
      }
    } 
    else if (contentType === "thinking") {
      const thinking = item.thinking || "";
      messageData.thinking = thinking.trim();
    }
    else if (contentType === "tool_use") {
      // 检测是否为artifacts工具
      if (item.name === "artifacts") {
        const artifactData = extractArtifact(item);
        if (artifactData) {
          messageData.artifacts.push(artifactData);
        }
      } else {
        // 处理其他工具
        const toolData = extractToolUse(item);
        if (toolData) {
          messageData.tools.push(toolData);
        }
      }
    }
    else if (contentType === "tool_result") {
      // 检测是否为artifacts工具结果
      if (item.name && item.name.includes("artifacts")) {
        // 将artifacts工具结果附加到最后一个artifacts
        if (messageData.artifacts.length > 0) {
          messageData.artifacts[messageData.artifacts.length - 1].result = 
            extractToolResult(item);
        }
      } else {
        // 处理其他工具结果
        const toolResult = extractToolResult(item);
        if (toolResult && messageData.tools.length > 0) {
          // 将结果添加到最近的工具使用记录
          messageData.tools[messageData.tools.length - 1].result = toolResult;
        }
      }
    }
  });
  
  // 更新消息数据
  messageData.content_items = contentArray;
  messageData.display_text = displayText.trim();
};

// 提取artifact信息
const extractArtifact = (artifactItem) => {
  try {
    const artifactInput = artifactItem.input || {};
    const command = artifactInput.command || "";
    const artifactId = artifactInput.id || "";
    const artifactType = artifactInput.type || "";
    const artifactTitle = artifactInput.title || "无标题";

    // 获取内容或更新信息
    if (command === "create") {
      const content = artifactInput.content || "";
      const artifactData = {
        id: artifactId,
        command,
        type: artifactType,
        title: artifactTitle,
        content,
        language: artifactInput.language || "",
        result: null
      };
      return artifactData;
    } else if (command === "update" || command === "rewrite") {
      const oldStr = artifactInput.old_str || "";
      const newStr = artifactInput.new_str || "";
      const artifactData = {
        id: artifactId,
        command,
        old_str: oldStr,
        new_str: newStr,
        result: null
      };
      return artifactData;
    }
  } catch (error) {
    console.error("提取artifact时出错:", error);
  }
  return null;
};

// 提取工具使用信息
const extractToolUse = (toolItem) => {
  const toolName = toolItem.name || "unknown";
  const toolInput = toolItem.input || {};

  const toolData = {
    name: toolName,
    input: toolInput,
    result: null
  };

  // 特别处理web_search
  if (toolName === "web_search" && typeof toolInput === 'object') {
    const query = toolInput.query || "";
    if (query) {
      toolData.query = query;
    }
  }

  return toolData;
};

// 提取工具结果信息
const extractToolResult = (resultItem) => {
  const toolName = resultItem.name || "unknown";
  const content = resultItem.content || [];
  const isError = resultItem.is_error || false;

  return {
    name: toolName,
    is_error: isError,
    content
  };
};

// 检测对话中的分支结构
export const detectBranches = (processedData) => {
  if (!processedData || !processedData.chat_history) {
    return processedData;
  }
  
  try {
    // 提取消息列表
    const messages = processedData.chat_history;
    
    // 构建消息字典(UUID -> 消息)
    const msgDict = {};
    const parentChildren = {}; // 父消息UUID -> 子消息UUID列表
    
    messages.forEach(msg => {
      const uuid = msg.uuid;
      const parentUuid = msg.parent_uuid;
      
      if (!uuid) return;
      
      msgDict[uuid] = msg;
      
      if (parentUuid) {
        if (!parentChildren[parentUuid]) {
          parentChildren[parentUuid] = [];
        }
        parentChildren[parentUuid].push(uuid);
      }
    });
    
    // 找到分支点（有多个子消息的消息）
    const branchPoints = [];
    
    Object.entries(parentChildren).forEach(([parentUuid, children]) => {
      if (children.length > 1) {
        branchPoints.push(parentUuid);
        if (msgDict[parentUuid]) {
          msgDict[parentUuid].is_branch_point = true;
        }
      }
    });
    
    // 为每个分支点找出其所有分支
    const branches = [];
    let branchId = 0;
    
    branchPoints.forEach(branchPoint => {
      const children = parentChildren[branchPoint] || [];
      
      children.forEach((childUuid, i) => {
        const branch = [];
        let currentUuid = childUuid;
        
        // 添加分支点消息
        if (branchPoint in msgDict) {
          branch.push(msgDict[branchPoint]);
        }
        
        // 跟踪这条分支链
        while (currentUuid && msgDict[currentUuid]) {
          const msg = msgDict[currentUuid];
          msg.branch_level = i + 1;
          branch.push(msg);
          
          // 找下一条消息
          const children = parentChildren[currentUuid] || [];
          if (children.length > 0) {
            currentUuid = children[0]; // 只跟踪第一个子消息
          } else {
            currentUuid = null;
          }
        }
        
        // 为这条分支分配ID
        branchId += 1;
        branch.forEach(msg => {
          msg.branch_id = branchId;
        });
        
        branches.push(branch);
      });
    });
    
    // 更新processedData
    return {
      ...processedData,
      branches,
      branch_points: branchPoints
    };
    
  } catch (error) {
    console.error("分支检测出错:", error);
    return {
      ...processedData,
      branches: [],
      branch_points: []
    };
  }
};

// 解析Claude对话列表格式 (chat_conversations.json)
const extractClaudeConversationsData = (jsonData, fileName) => {
  // 这里数据是所有对话的摘要列表
  const conversations = Array.isArray(jsonData) ? jsonData : [];
  
  // 创建一个摘要视图
  const now = new Date();
  const metaInfo = {
    title: `Claude对话列表 (${conversations.length}个对话)`,
    created_at: now.toLocaleString('zh-CN'),
    updated_at: now.toLocaleString('zh-CN'),
    project_uuid: "",
    uuid: `claude_conversations_${Date.now()}`,
    platform: 'claude_conversations'
  };

  const chatHistory = [];
  let messageIndex = 0;

  // 每个对话显示为一个消息块
  conversations.forEach((conversation, idx) => {
    const convTitle = conversation.name || "无标题对话";
    const createdAt = parseTimestamp(conversation.created_at);
    const updatedAt = parseTimestamp(conversation.updated_at);
    const model = conversation.model || "未知模型";
    const projectName = conversation.project?.name || "无项目";
    const uuid = conversation.uuid || "";
    const summary = conversation.summary || "无摘要";
    const isStarred = conversation.is_starred ? "⭐ 已收藏" : "";

    // 创建一个对话摘要消息
    const conversationSummary = {
      index: messageIndex++,
      uuid: `conv_${idx}`,
      parent_uuid: idx > 0 ? `conv_${idx - 1}` : "",
      sender: "system",
      sender_label: "Claude对话",
      timestamp: createdAt,
      content_items: [],
      raw_text: `### ${convTitle} ${isStarred}\n\n**UUID**: ${uuid}\n**模型**: ${model}\n**项目**: ${projectName}\n**创建时间**: ${createdAt}\n**更新时间**: ${updatedAt}\n\n**摘要**: ${summary || '暂无摘要'}`,
      display_text: `### ${convTitle} ${isStarred}\n\n**UUID**: ${uuid}\n**模型**: ${model}\n**项目**: ${projectName}\n**创建时间**: ${createdAt}\n**更新时间**: ${updatedAt}\n\n**摘要**: ${summary || '暂无摘要'}`,
      thinking: "",
      tools: [],
      artifacts: [],
      citations: [],
      branch_id: null,
      is_branch_point: false,
      branch_level: 0,
      // 额外信息供应用使用
      conversation_data: conversation
    };

    chatHistory.push(conversationSummary);

    // 如果有设置信息，创建一个设置详情消息
    if (conversation.settings && Object.keys(conversation.settings).length > 0) {
      const settingsText = Object.entries(conversation.settings)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => `**${key}**: ${value}`)
        .join('\n');

      if (settingsText) {
        const settingsMessage = {
          index: messageIndex++,
          uuid: `conv_settings_${idx}`,
          parent_uuid: `conv_${idx}`,
          sender: "system",
          sender_label: "设置信息",
          timestamp: createdAt,
          content_items: [],
          raw_text: `#### 对话设置\n\n${settingsText}`,
          display_text: `#### 对话设置\n\n${settingsText}`,
          thinking: "",
          tools: [],
          artifacts: [],
          citations: [],
          branch_id: null,
          is_branch_point: false,
          branch_level: 0
        };
        chatHistory.push(settingsMessage);
      }
    }
  });

  return {
    meta_info: metaInfo,
    chat_history: chatHistory,
    raw_data: jsonData,
    format: 'claude_conversations',
    platform: 'claude_conversations'
  };
};

// 解析Claude完整导出格式 (claude_all_conversations_*.json)
const extractClaudeFullExportData = (jsonData, fileName) => {
  const exportedAt = parseTimestamp(jsonData.exportedAt);
  const conversations = jsonData.conversations || [];
  const totalConversations = jsonData.totalConversations || conversations.length;
  
  // 创建元信息
  const metaInfo = {
    title: `Claude完整导出 (${totalConversations}个对话)`,
    created_at: exportedAt,
    updated_at: exportedAt,
    project_uuid: "",
    uuid: `claude_full_export_${Date.now()}`,
    platform: 'claude_full_export',
    exportedAt: exportedAt,
    totalConversations: totalConversations
  };

  // 处理所有对话
  const allMessages = [];
  const conversationGroups = {};
  const projectGroups = {};
  let globalMessageIndex = 0;

  conversations.forEach((conversation, convIdx) => {
    const convUuid = conversation.uuid;
    const convName = conversation.name || `对话 ${convIdx + 1}`;
    const projectUuid = conversation.project_uuid || 'no_project';
    const projectName = conversation.project?.name || '无项目';
    
    // 初始化对话组
    if (!conversationGroups[convUuid]) {
      conversationGroups[convUuid] = {
        uuid: convUuid,
        name: convName,
        model: conversation.model,
        created_at: parseTimestamp(conversation.created_at),
        updated_at: parseTimestamp(conversation.updated_at),
        is_starred: conversation.is_starred,
        project: conversation.project,
        messages: [],
        messageCount: 0
      };
    }
    
    // 初始化项目组
    if (!projectGroups[projectUuid]) {
      projectGroups[projectUuid] = {
        uuid: projectUuid,
        name: projectName,
        conversations: [],
        messages: [],
        messageCount: 0
      };
    }
    
    // 添加对话分隔标记
    const conversationHeader = {
      index: globalMessageIndex++,
      uuid: `conv_header_${convIdx}`,
      parent_uuid: globalMessageIndex > 1 ? allMessages[allMessages.length - 1].uuid : "",
      sender: "system",
      sender_label: "对话开始",
      timestamp: parseTimestamp(conversation.created_at),
      content_items: [],
      raw_text: `### ${convName} ${conversation.is_starred ? '⭐' : ''}\n\n**模型**: ${conversation.model || '未知'}\n**项目**: ${projectName}\n**创建时间**: ${parseTimestamp(conversation.created_at)}`,
      display_text: `### ${convName} ${conversation.is_starred ? '⭐' : ''}\n\n**模型**: ${conversation.model || '未知'}\n**项目**: ${projectName}\n**创建时间**: ${parseTimestamp(conversation.created_at)}`,
      thinking: "",
      tools: [],
      artifacts: [],
      citations: [],
      branch_id: null,
      is_branch_point: false,
      branch_level: 0,
      conversation_uuid: convUuid,
      project_uuid: projectUuid,
      is_conversation_header: true,
      // 添加对话信息
      conversation_name: convName,
      project_name: projectName,
      model: conversation.model,
      is_starred: conversation.is_starred,
      created_at: parseTimestamp(conversation.created_at),
      messageCount: conversation.chat_messages ? conversation.chat_messages.length : 0
    };
    
    allMessages.push(conversationHeader);
    conversationGroups[convUuid].messages.push(conversationHeader);
    projectGroups[projectUuid].messages.push(conversationHeader);
    
    // 处理该对话的所有消息
    if (conversation.chat_messages && Array.isArray(conversation.chat_messages)) {
      conversation.chat_messages.forEach((msg, msgIdx) => {
        const sender = msg.sender || "unknown";
        const senderLabel = sender === "human" ? "人类" : "Claude";
        const timestamp = parseTimestamp(msg.created_at);

        const messageData = {
          index: globalMessageIndex++,
          uuid: msg.uuid || `msg_${convIdx}_${msgIdx}`,
          parent_uuid: msg.parent_message_uuid || (globalMessageIndex > 1 ? allMessages[allMessages.length - 1].uuid : ""),
          sender,
          sender_label: senderLabel,
          timestamp,
          content_items: [],
          raw_text: "",
          display_text: "",
          thinking: "",
          tools: [],
          artifacts: [],
          citations: [],
          branch_id: null,
          is_branch_point: false,
          branch_level: 0,
          conversation_uuid: convUuid,
          project_uuid: projectUuid,
          conversation_name: convName,
          project_name: projectName
        };

        // 处理消息内容
        if (msg.content && Array.isArray(msg.content)) {
          processContentArray(msg.content, messageData);
        } else if (msg.text) {
          messageData.raw_text = msg.text;
          messageData.display_text = msg.text;
        }

        allMessages.push(messageData);
        conversationGroups[convUuid].messages.push(messageData);
        conversationGroups[convUuid].messageCount++;
        projectGroups[projectUuid].messages.push(messageData);
        projectGroups[projectUuid].messageCount++;
      });
    }
    
    // 将对话添加到项目组
    if (!projectGroups[projectUuid].conversations.find(c => c.uuid === convUuid)) {
      projectGroups[projectUuid].conversations.push(conversationGroups[convUuid]);
    }
  });

  return {
    meta_info: metaInfo,
    chat_history: allMessages,
    raw_data: jsonData,
    format: 'claude_full_export',
    platform: 'claude_full_export',
    // 额外的视图数据
    views: {
      conversations: conversationGroups,
      projects: projectGroups,
      conversationList: Object.values(conversationGroups),
      projectList: Object.values(projectGroups)
    }
  };
};