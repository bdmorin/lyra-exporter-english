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
  }
  
  // Claude格式 - 对象结构，包含chat_messages
  if (typeof jsonData === 'object' && jsonData !== null) {
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