// utils/fileParser.js
// File parsing functionality - Updated version with support for new Gemini/NotebookLM formats

// Parse timestamp
export const parseTimestamp = (timestampStr) => {
  if (!timestampStr) return "Unknown time";
  
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
    console.error("Timestamp parsing error:", error);
    return "Unknown time";
  }
};

// New: Helper function for formatting file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Detect JSON file format
export const detectFileFormat = (jsonData) => {
  // New Gemini/NotebookLM format - object containing title, platform, exportedAt, conversation fields
  if (typeof jsonData === 'object' && jsonData !== null && 
      jsonData.title && jsonData.platform && jsonData.exportedAt && 
      jsonData.conversation && Array.isArray(jsonData.conversation)) {
    return 'gemini_notebooklm';
  }
  
  // Claude all conversations format - array containing conversation summaries
  if (Array.isArray(jsonData) && jsonData.length > 0) {
    const firstItem = jsonData[0];
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
      throw new Error(`Unsupported file format: ${format}`);
  }
};

// Parse new Gemini/NotebookLM format (supports title metadata and Base64 images)
const extractGeminiNotebookLMData = (jsonData, fileName) => {
  // Extract metadata from JSON
  const title = jsonData.title || 'AI Conversation Record';
  const platform = jsonData.platform || 'AI';
  const exportedAt = jsonData.exportedAt ? parseTimestamp(jsonData.exportedAt) : new Date().toLocaleString('en-US');
  
  // Determine platform display name
  const platformName = platform === 'gemini' ? 'Gemini' : 
                      platform === 'notebooklm' ? 'NotebookLM' :
                      platform === 'aistudio' ? 'Google AI Studio' : // 新增对AI Studio的支持
                      platform.charAt(0).toUpperCase() + platform.slice(1);
  
  const metaInfo = {
    title: title,
    created_at: exportedAt,
    updated_at: exportedAt,
    project_uuid: "",
    uuid: `${platform.toLowerCase()}_${Date.now()}`,
    model: platformName,
    platform: platform.toLowerCase(),
    has_embedded_images: false, // 初始化，后面会更新
    totalImagesProcessed: 0
  };

  const chatHistory = [];
  let messageIndex = 0;

  // 处理conversation数组
  jsonData.conversation.forEach((item, itemIndex) => {
    // --- 处理人类消息 ---
    if (item.human) {
      // 支持对象格式和字符串格式
      const humanContent = typeof item.human === 'string' ? { text: item.human, images: [] } : item.human;
      
      if (humanContent.text || (humanContent.images && humanContent.images.length > 0)) {
        const humanMessage = {
          index: messageIndex++,
          uuid: `human_${itemIndex}`,
          parent_uuid: messageIndex > 1 ? `assistant_${itemIndex - 1}` : "",
          sender: "human",
          sender_label: "人类",
          timestamp: exportedAt,
          content_items: [],
          raw_text: humanContent.text || '',
          display_text: humanContent.text || '',
          thinking: "",
          tools: [],
          artifacts: [],
          citations: [],
          images: [], // 初始化图片数组
          branch_id: null,
          is_branch_point: false,
          branch_level: 0
        };

        // 处理图片 - 支持Base64格式
        if (humanContent.images && humanContent.images.length > 0) {
          metaInfo.has_embedded_images = true;
          humanContent.images.forEach((imgData, imgIndex) => {
            metaInfo.totalImagesProcessed++;
            
            // 处理不同的图片数据格式
            let imageInfo;
            if (typeof imgData === 'string') {
              // 直接是Base64字符串
              imageInfo = {
                index: humanMessage.images.length,
                file_name: `${platform}_image_${itemIndex}_${imgIndex}`,
                file_type: imgData.startsWith('data:image/') ? 
                  imgData.split(';')[0].replace('data:', '') : 'image/png',
                display_mode: 'base64',
                embedded_image: {
                  data: imgData,
                  size: 0, // Base64字符串大小计算复杂，暂设为0
                }
              };
            } else if (typeof imgData === 'object') {
              // 对象格式，包含format、data等字段
              imageInfo = {
                index: humanMessage.images.length,
                file_name: `${platform}_image_${itemIndex}_${imgIndex}`,
                file_type: imgData.format || 'image/png',
                display_mode: 'base64',
                embedded_image: {
                  data: `data:${imgData.format || 'image/png'};base64,${imgData.data}`,
                  size: imgData.size || 0,
                },
                original_src: imgData.original_src
              };
            }
            
            if (imageInfo) {
              humanMessage.images.push(imageInfo);
            }
          });
          
          // 在文本前加上图片标记，方便预览
          if (humanMessage.images.length > 0) {
            const imageMarkdown = humanMessage.images
              .map((img, idx) => `[图片${idx + 1}]`)
              .join(' ');
            humanMessage.display_text = `${imageMarkdown}\n\n${humanMessage.display_text}`.trim();
          }
        }
        
        chatHistory.push(humanMessage);
      }
    }

    // --- 处理AI助手消息 ---
    if (item.assistant) {
      // 支持对象格式和字符串格式
      const assistantContent = typeof item.assistant === 'string' ? { text: item.assistant, images: [] } : item.assistant;

      if (assistantContent.text || (assistantContent.images && assistantContent.images.length > 0)) {
        const assistantMessage = {
          index: messageIndex++,
          uuid: `assistant_${itemIndex}`,
          parent_uuid: `human_${itemIndex}`,
          sender: "assistant",
          sender_label: platformName,
          timestamp: exportedAt,
          content_items: [],
          raw_text: assistantContent.text || '',
          display_text: assistantContent.text || '',
          thinking: "",
          tools: [],
          artifacts: [],
          citations: [],
          images: [], // 初始化图片数组
          branch_id: null,
          is_branch_point: false,
          branch_level: 0
        };

        // 处理图片 - 支持Base64格式
        if (assistantContent.images && assistantContent.images.length > 0) {
          metaInfo.has_embedded_images = true;
          assistantContent.images.forEach((imgData, imgIndex) => {
            metaInfo.totalImagesProcessed++;
            
            // 处理不同的图片数据格式
            let imageInfo;
            if (typeof imgData === 'string') {
              // 直接是Base64字符串
              imageInfo = {
                index: assistantMessage.images.length,
                file_name: `${platform}_image_${itemIndex}_${imgIndex}`,
                file_type: imgData.startsWith('data:image/') ? 
                  imgData.split(';')[0].replace('data:', '') : 'image/png',
                display_mode: 'base64',
                embedded_image: {
                  data: imgData,
                  size: 0,
                }
              };
            } else if (typeof imgData === 'object') {
              // 对象格式
              imageInfo = {
                index: assistantMessage.images.length,
                file_name: `${platform}_image_${itemIndex}_${imgIndex}`,
                file_type: imgData.format || 'image/png',
                display_mode: 'base64',
                embedded_image: {
                  data: `data:${imgData.format || 'image/png'};base64,${imgData.data}`,
                  size: imgData.size || 0,
                },
                original_src: imgData.original_src
              };
            }
            
            if (imageInfo) {
              assistantMessage.images.push(imageInfo);
            }
          });
          
          // 在文本前加上图片标记
          if (assistantMessage.images.length > 0) {
            const imageMarkdown = assistantMessage.images
              .map((img, idx) => `[图片${idx + 1}]`)
              .join(' ');
            assistantMessage.display_text = `${imageMarkdown}\n\n${assistantMessage.display_text}`.trim();
          }
        }
        
        chatHistory.push(assistantMessage);
      }
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

// 从Claude JSON数据中提取对话内容（修改以支持模型信息和图片提取）
const extractClaudeData = (jsonData) => {
  // 提取元数据
  const title = jsonData.name || "Untitled Conversation";
  const createdAt = parseTimestamp(jsonData.created_at);
  const updatedAt = parseTimestamp(jsonData.updated_at);
  const model = jsonData.model || ""; // 提取模型信息

  const metaInfo = {
    title,
    created_at: createdAt,
    updated_at: updatedAt,
    project_uuid: jsonData.project_uuid || "",
    uuid: jsonData.uuid || "",
    model: model, // 添加模型信息
    platform: 'claude',
    // 新增图片相关元信息
    has_embedded_images: jsonData._debug_info?.images_processed > 0,
    images_processed: jsonData._debug_info?.images_processed || 0
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

      // 准备消息结构，新增 images 数组
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
        images: [], // 新增图片数组
        // 分支相关字段
        branch_id: null,
        is_branch_point: false,
        branch_level: 0
      };

      // 1. 处理消息内容 (包括内嵌图片)
      if (msg.content && Array.isArray(msg.content)) {
        processContentArray(msg.content, messageData);
      } else if (msg.text) {
        messageData.raw_text = msg.text;
        messageData.display_text = msg.text;
      }
      
      // 2. 处理作为附件的图片
      processMessageImages(msg, messageData);

      // 3. 整理最终显示的文本
      finalizeDisplayText(messageData);

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

// 处理content数组中的所有元素 (已更新，支持图片类型)
const processContentArray = (contentArray, messageData) => {
  let displayText = "";

  contentArray.forEach((item, index) => {
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
    // 新增：直接处理 content 数组中的图片
    else if (contentType === "image") {
        const imageSource = item.source || {};
        const imageInfo = {
            index: messageData.images.length,
            file_name: `image_content_${index}`,
            file_type: imageSource.media_type || 'image/jpeg',
            display_mode: 'base64',
            embedded_image: {
                data: `data:${imageSource.media_type};base64,${imageSource.data}`,
                size: imageSource.data ? atob(imageSource.data).length : 0,
            },
            // 添加一个占位符，表示图片在文本流中的位置
            placeholder: ` [图片${messageData.images.length + 1}] `
        };
        messageData.images.push(imageInfo);
        displayText += imageInfo.placeholder;
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
  // 注意：这里只附加新处理的文本，旧文本在 extractClaudeData 中处理
  messageData.display_text += displayText.trim();
};

// 新增：处理消息中的图片文件 (files, files_v2, attachments)
const processMessageImages = (message, messageData) => {
  const processFiles = (files, version = '') => {
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.file_kind === 'image') {
          const imageInfo = {
            index: messageData.images.length,
            file_name: file.file_name || `image_${version}_${messageData.images.length}`,
            file_uuid: file.file_uuid,
            created_at: file.created_at,
            thumbnail_url: file.thumbnail_url,
            preview_url: file.preview_url,
            embedded_image: null,
            display_mode: 'url'
          };
          
          if (file.embedded_image && file.embedded_image.data) {
            imageInfo.embedded_image = file.embedded_image;
            imageInfo.display_mode = 'base64';
            console.log(`[Lyra Parser] 发现嵌入图片(${version}): ${file.file_name}`);
          }
          
          messageData.images.push(imageInfo);
        }
      });
    }
  };

  processFiles(message.files, 'v1');
  if (messageData.images.length === 0) {
      processFiles(message.files_v2, 'v2');
  }

  if (message.attachments && Array.isArray(message.attachments)) {
    message.attachments.forEach((attachment) => {
      if (attachment.file_type && attachment.file_type.startsWith('image/')) {
        const imageInfo = {
          index: messageData.images.length,
          file_name: attachment.file_name || `attachment_${messageData.images.length}`,
          file_type: attachment.file_type,
          file_url: attachment.file_url,
          embedded_image: null,
          display_mode: 'url'
        };
        
        if (attachment.embedded_image && attachment.embedded_image.data) {
          imageInfo.embedded_image = attachment.embedded_image;
          imageInfo.display_mode = 'base64';
          console.log(`[Lyra Parser] 发现嵌入附件图片: ${attachment.file_name}`);
        }
        
        messageData.images.push(imageInfo);
      }
    });
  }
};

// 新增：在处理完所有内容后，生成最终的显示文本
const finalizeDisplayText = (messageData) => {
    // 如果图片是作为附件（没有占位符），而不是内嵌在文本流中，则在开头添加标记
    const hasAttachmentImages = messageData.images.some(img => !img.placeholder);
    
    if (hasAttachmentImages) {
        const imageMarkdown = messageData.images
            .filter(img => !img.placeholder) // 只为附件图片生成标记
            .map((img, idx) => `[图片${idx + 1}: ${img.file_name}]`)
            .join(' ');
            
        if (imageMarkdown) {
            // 将图片标记加在最前面
            messageData.display_text = `${imageMarkdown}\n\n${messageData.display_text}`.trim();
        }
    }
};

// 新增：为 UI 组件提供图片显示所需的数据
export const getImageDisplayData = (imageInfo) => {
  if (imageInfo.display_mode === 'base64' && imageInfo.embedded_image) {
    return {
      src: imageInfo.embedded_image.data,
      alt: imageInfo.file_name,
      title: `${imageInfo.file_name} (${formatFileSize(imageInfo.embedded_image.size)})`,
      isBase64: true
    };
  } else {
    // 返回 URL 形式
    return {
      src: imageInfo.preview_url || imageInfo.thumbnail_url || imageInfo.file_url,
      alt: imageInfo.file_name,
      title: imageInfo.file_name,
      isBase64: false
    };
  }
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

// 检测对话中的分支结构 - 改进版本，支持合并重复分支
export const detectBranches = (processedData) => {
  if (!processedData || !processedData.chat_history) {
    return processedData;
  }
  
  try {
    console.log("=== 开始分支检测和重复合并 ===");
    console.log("原始消息数量:", processedData.chat_history.length);
    
    // 第一步：检测并合并重复分支
    let messages = mergeRedundantBranches(processedData.chat_history);
    
    // 第二步：重新检测分支结构
    messages = detectBranchStructure(messages);
    
    console.log("处理后消息数量:", messages.length);
    console.log("=== 分支检测完成 ===");
    
  return {
    ...processedData,
    chat_history: messages,
    // 保留原有的分支信息格式以确保兼容性
    branches: extractBranchInfo(messages),
    branch_points: messages.filter(msg => msg.is_branch_point).map(msg => msg.uuid)
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

// 合并重复分支的函数
function mergeRedundantBranches(messages) {
  console.log("\n--- 开始合并重复分支 ---");
  
  const duplicateGroups = findDuplicateMessages(messages);
  
  if (duplicateGroups.length === 0) {
    console.log("未发现重复分支");
    return messages;
  }
  
  const toDelete = new Set();
  const uuidRemapping = new Map();
  
  duplicateGroups.forEach(group => {
    if (group.length <= 1) return;
    
    console.log(`\n发现 ${group.length} 个重复消息:`);
    console.log(`内容: "${group[0].textContent.substring(0, 50)}..."`);
    
    // 按时间排序，保留最早的
    group.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const keepMessage = group[0];
    const removeMessages = group.slice(1);
    
    console.log(`保留消息: ${keepMessage.uuid.substring(0, 8)} (${keepMessage.timestamp})`);
    
    removeMessages.forEach(msg => {
      console.log(`删除消息: ${msg.uuid.substring(0, 8)} (${msg.timestamp})`);
      toDelete.add(msg.uuid);
      uuidRemapping.set(msg.uuid, keepMessage.uuid);
    });
  });
  
  // 应用删除
  let filteredMessages = messages.filter(msg => !toDelete.has(msg.uuid));
  
  // 更新所有消息的父级引用
  filteredMessages = filteredMessages.map(msg => {
    const originalParent = msg.parent_uuid;
    const newParent = uuidRemapping.get(originalParent) || originalParent;
    
    if (newParent !== originalParent) {
      console.log(`更新父级引用: ${msg.uuid.substring(0, 8)} 的父级从 ${originalParent.substring(0, 8)} 改为 ${newParent.substring(0, 8)}`);
    }
    
    return {
      ...msg,
      parent_uuid: newParent
    };
  });
  
  console.log(`合并完成: 删除了 ${toDelete.size} 个重复消息`);
  console.log("--- 重复分支合并完成 ---\n");
  
  return filteredMessages;
}

// 寻找重复消息的函数
function findDuplicateMessages(messages) {
  const contentGroups = new Map();
  
  messages.forEach(msg => {
    // 跳过系统消息和对话头
    if (msg.sender === 'system' || msg.is_conversation_header) {
      return;
    }
    
    const textContent = extractTextContent(msg);
    if (!textContent.trim()) return;
    
    const normalizedText = normalizeText(textContent);
    const key = `${msg.sender}:${normalizedText}`;
    
    if (!contentGroups.has(key)) {
      contentGroups.set(key, []);
    }
    
    contentGroups.get(key).push({
      ...msg,
      textContent,
      normalizedText
    });
  });
  
  const duplicateGroups = [];
  for (const [key, group] of contentGroups.entries()) {
    if (group.length > 1) {
      // 验证：确保这些消息确实是"无意义的重复"
      const validDuplicates = filterValidDuplicates(group);
      if (validDuplicates.length > 1) {
        duplicateGroups.push(validDuplicates);
      }
    }
  }
  
  return duplicateGroups;
}

// 提取消息的文本内容
function extractTextContent(msg) {
  // 优先使用 display_text
  if (msg.display_text && msg.display_text.trim()) {
    return msg.display_text;
  }
  
  // 备选：raw_text
  if (msg.raw_text && msg.raw_text.trim()) {
    return msg.raw_text;
  }
  
  // 备选：从 content_items 中提取
  if (msg.content_items && Array.isArray(msg.content_items)) {
    const textContents = msg.content_items
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    if (textContents.trim()) return textContents;
  }
  
  return '';
}

// 验证是否为有效的重复
function filterValidDuplicates(duplicates) {
  // 按时间排序
  const sortedByTime = [...duplicates].sort((a, b) => {
    const timeA = new Date(a.timestamp);
    const timeB = new Date(b.timestamp);
    return timeA - timeB;
  });
  
  const validDuplicates = [];
  
  for (let i = 0; i < sortedByTime.length; i++) {
    const current = sortedByTime[i];
    
    // 检查与后续消息的关系
    for (let j = i + 1; j < sortedByTime.length; j++) {
      const later = sortedByTime[j];
      const timeA = new Date(current.timestamp);
      const timeB = new Date(later.timestamp);
      const timeDiff = timeB - timeA;
      
      // 如果在5分钟内有完全相同的消息，且文本内容不是很短（避免误删简单回复）
      if (timeDiff <= 5 * 60 * 1000 && current.normalizedText.length > 10) {
        // 这很可能是无意义的重复
        if (!validDuplicates.includes(current)) validDuplicates.push(current);
        if (!validDuplicates.includes(later)) validDuplicates.push(later);
      }
    }
  }
  
  return validDuplicates;
}

// 文本标准化函数
function normalizeText(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ') // 将多个连续空白字符替换为单个空格
    .replace(/[。！？.!?]+$/g, '') // 移除末尾的标点符号
    .toLowerCase();
}

// 检测分支结构的函数 - 改进版本，支持树形分支路径
function detectBranchStructure(messages) {
  console.log("--- 开始重新检测分支结构 ---");
  
  // 重置分支信息
  messages = messages.map(msg => ({
    ...msg,
    branch_level: 0,
    branch_id: null,
    branch_path: "main", // 新增：分支路径标识
    is_branch_point: false
  }));
  
  // 构建消息字典和父子关系
  const msgDict = {};
  const parentChildren = {};
  
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
  
  // 标记分支点
  Object.entries(parentChildren).forEach(([parentUuid, children]) => {
    if (children.length > 1 && msgDict[parentUuid]) {
      msgDict[parentUuid].is_branch_point = true;
    }
  });
  
  // 使用深度优先搜索来分配分支路径
  const visited = new Set();
  
  // 找到根节点（没有父节点的消息）
  const rootNodes = messages.filter(msg => 
    !msg.parent_uuid || !msgDict[msg.parent_uuid]
  );
  
  // 为每个根节点开始DFS
  rootNodes.forEach((rootNode, rootIndex) => {
    if (!visited.has(rootNode.uuid)) {
      assignBranchPaths(rootNode.uuid, "main", [], msgDict, parentChildren, visited);
    }
  });
  
  console.log("--- 分支结构检测完成 ---\n");
  
  // 返回更新后的消息
  return messages.map(msg => msgDict[msg.uuid] || msg);
}

// 提取分支信息的辅助函数（保持向后兼容）
function extractBranchInfo(messages) {
  const branches = [];
  const branchGroups = new Map();
  
  // 按分支路径分组
  messages.forEach(msg => {
    if (msg.branch_path && msg.branch_path !== "main") {
      const branchPath = msg.branch_path;
      if (!branchGroups.has(branchPath)) {
        branchGroups.set(branchPath, []);
      }
      branchGroups.get(branchPath).push(msg);
    }
  });
  
  // 转换为原有的分支格式
  branchGroups.forEach((msgs, path) => {
    branches.push({
      path: path,
      level: msgs[0]?.branch_level || 0,
      id: msgs[0]?.branch_id || null,
      messages: msgs.map(msg => msg.uuid)
    });
  });
  
  return branches;
}

// 递归分配分支路径的函数
function assignBranchPaths(nodeUuid, currentPath, pathStack, msgDict, parentChildren, visited) {
  if (visited.has(nodeUuid) || !msgDict[nodeUuid]) {
    return;
  }
  
  visited.add(nodeUuid);
  const node = msgDict[nodeUuid];
  
  // 设置当前节点的分支信息
  node.branch_path = currentPath;
  
  // 计算分支级别（从main路径开始计算深度）
  if (currentPath === "main") {
    node.branch_level = 0;
    node.branch_id = null;
  } else {
    // 计算分支深度
    const pathParts = currentPath.split('.');
    node.branch_level = pathParts.length - 1;
    
    // 生成分支ID（结合路径信息）
    node.branch_id = currentPath.replace('main.', '').replace('main', '0');
  }
  
  // 获取子节点
  const children = parentChildren[nodeUuid] || [];
  
  if (children.length === 0) {
    // 叶子节点，无需处理
    return;
  } else if (children.length === 1) {
    // 单个子节点，继续当前路径
    assignBranchPaths(children[0], currentPath, pathStack, msgDict, parentChildren, visited);
  } else {
    // 多个子节点，创建分支
    // 按时间排序子节点
    const sortedChildren = children
      .map(uuid => msgDict[uuid])
      .filter(msg => msg)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => msg.uuid);
    
    console.log(`在 ${nodeUuid.substring(0, 8)} 发现 ${sortedChildren.length} 个分支`);
    
    sortedChildren.forEach((childUuid, index) => {
      let childPath;
      
      if (index === 0) {
        // 第一个分支继续主路径
        childPath = currentPath;
      } else {
        // 后续分支创建新路径
        if (currentPath === "main") {
          childPath = `main.${index}`;
        } else {
          childPath = `${currentPath}.${index}`;
        }
      }
      
      console.log(`  分支 ${index}: ${childUuid.substring(0, 8)} -> 路径: ${childPath}`);
      
      // 递归处理子分支
      assignBranchPaths(childUuid, childPath, [...pathStack, index], msgDict, parentChildren, visited);
    });
  }
}

// 解析Claude对话列表格式 (chat_conversations.json)
const extractClaudeConversationsData = (jsonData, fileName) => {
  // 这里数据是所有对话的摘要列表
  const conversations = Array.isArray(jsonData) ? jsonData : [];
  
  // 创建一个摘要视图
  const now = new Date();
  const metaInfo = {
    title: `Claude Conversation List (${conversations.length} conversations)`,
    created_at: now.toLocaleString('zh-CN'),
    updated_at: now.toLocaleString('zh-CN'),
    project_uuid: "",
    uuid: `claude_conversations_${Date.now()}`,
    model: "Claude Conversation List", // Add model information
    platform: 'claude_conversations'
  };

  const chatHistory = [];
  let messageIndex = 0;

  // 每个对话显示为一个消息块
  conversations.forEach((conversation, idx) => {
    const convTitle = conversation.name || "Untitled Conversation";
    const createdAt = parseTimestamp(conversation.created_at);
    const updatedAt = parseTimestamp(conversation.updated_at);
    const model = conversation.model || "未知模型";
    const projectName = conversation.project?.name || "No Project";
    const uuid = conversation.uuid || "";
    const summary = conversation.summary || "无摘要";
    const isStarred = conversation.is_starred ? "⭐ 已收藏" : "";

    // 创建一个对话摘要消息
    const conversationSummary = {
      index: messageIndex++,
      uuid: `conv_${idx}`,
      parent_uuid: idx > 0 ? `conv_${idx - 1}` : "",
      sender: "system",
      sender_label: "Claude Conversation",
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
  
  // 创建元信息, 新增图片相关
  const metaInfo = {
    title: `Claude Full Export (${totalConversations} conversations)`,
    created_at: exportedAt,
    updated_at: exportedAt,
    project_uuid: "",
    uuid: `claude_full_export_${Date.now()}`,
    model: "Claude完整导出", // 添加模型信息
    platform: 'claude_full_export',
    exportedAt: exportedAt,
    totalConversations: totalConversations,
    includesImages: jsonData.includesImages || false,
    totalImagesProcessed: 0 // 初始化，后面累加
  };

  // 处理所有对话
  const allMessages = [];
  const conversationGroups = {};
  const projectGroups = {};
  let globalMessageIndex = 0;

  conversations.forEach((conversation, convIdx) => {
    const convUuid = conversation.uuid;
    const convName = conversation.name || `Conversation ${convIdx + 1}`;
    const projectUuid = conversation.project_uuid || 'no_project';
    const projectName = conversation.project?.name || 'No Project';
    
    // 累加图片总数
    if(conversation._debug_info && conversation._debug_info.images_processed) {
        metaInfo.totalImagesProcessed += conversation._debug_info.images_processed;
    }
    
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
      sender_label: "Conversation Start",
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
      // 使用我们更新过的 extractClaudeData 来处理单个对话的消息
      const singleConvData = extractClaudeData(conversation);
      singleConvData.chat_history.forEach(msg => {
          // 更新索引和一些全局信息
          const updatedMsg = {
              ...msg,
              index: globalMessageIndex++,
              parent_uuid: msg.parent_message_uuid || (globalMessageIndex > 1 ? allMessages[allMessages.length - 1].uuid : ""),
              conversation_uuid: convUuid,
              project_uuid: projectUuid,
              conversation_name: convName,
              project_name: projectName
          };
          allMessages.push(updatedMsg);
          conversationGroups[convUuid].messages.push(updatedMsg);
          conversationGroups[convUuid].messageCount++;
          projectGroups[projectUuid].messages.push(updatedMsg);
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