// utils/exportHelper.js
// 导出相关功能

// 导出为Markdown
export const exportChatAsMarkdown = (processedData, config) => {
  const { meta_info, chat_history } = processedData;
  const lines = [];

  // 添加YAML前置元数据
  if (config.exportObsidianMetadata) {
    lines.push("---");
    lines.push(`title: ${meta_info.title || '对话记录'}`);
    lines.push(`date: ${new Date().toISOString().split('T')[0]}`);

    // 添加自定义属性
    if (config.obsidianProperties && config.obsidianProperties.length > 0) {
      config.obsidianProperties.forEach(prop => {
        const { name, value } = prop;
        
        // 处理列表类型的值
        if (value.includes(",") && !value.includes("[")) {
          const values = value.split(",").map(v => v.trim());
          lines.push(`${name}:`);
          values.forEach(v => {
            lines.push(`  - ${v}`);
          });
        } else {
          // 处理简单值
          lines.push(`${name}: ${value}`);
        }
      });
    }

    // 添加标签
    if (config.obsidianTags && config.obsidianTags.length > 0) {
      lines.push("tags:");
      config.obsidianTags.forEach(tag => {
        lines.push(`  - ${tag}`);
      });
    }

    lines.push("---");
    lines.push("");
  }

  // 添加标题和元信息
  lines.push(`# ${meta_info.title || '对话记录'}`);
  lines.push(`*创建时间: ${meta_info.created_at || '未知'}*`);
  lines.push(`*导出时间: ${new Date().toLocaleString('zh-CN')}*`);
  
  // 如果是仅导出已完成的消息，添加说明
  if (config.exportMarkedOnly) {
    lines.push(`*导出类型: 仅包含已完成标记的消息*`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // 如果没有消息，添加提示
  if (!chat_history || chat_history.length === 0) {
    lines.push("*没有符合条件的消息*");
    return lines.join("\n");
  }

  // 添加消息内容
  let exportedCount = 0;
  chat_history.forEach(msg => {
    // 如果设置为只导出已标记并且该消息未被标记，则跳过
    // 注意：在App.js中已经进行了过滤，这里是双重保险
    if (config.exportMarkedOnly && !config.markedItems?.has(msg.index)) {
      return;
    }

    exportedCount++;
    const sender = msg.sender_label;
    const timestamp = msg.timestamp;
    const msgIndex = msg.index + 1; // 序号从1开始

    // 添加分支标记
    let branchMarker = "";
    if (msg.is_branch_point) {
      branchMarker = " 🔀";
    } else if (msg.branch_level > 0) {
      branchMarker = ` ↳${msg.branch_level}`;
    }

    lines.push(`## ${msgIndex}. ${sender}${branchMarker}`);

    // 根据配置决定是否显示时间戳
    if (config.includeTimestamps) {
      lines.push(`*${timestamp}*`);
    }

    lines.push("");

    // 添加正文内容
    if (msg.display_text) {
      lines.push(msg.display_text);
      lines.push("");
    }

    // 添加思考过程
    if (msg.thinking && config.includeThinking) {
      lines.push("<details>");
      lines.push("<summary>思考过程</summary>");
      lines.push("");
      lines.push("```");
      lines.push(msg.thinking);
      lines.push("```");
      lines.push("</details>");
      lines.push("");
    }

    // 添加artifacts内容
    if (msg.artifacts && msg.artifacts.length > 0 && config.includeArtifacts) {
      msg.artifacts.forEach(artifact => {
        const artifactId = artifact.id || '未知';
        const artifactType = artifact.type || '未知';
        const artifactTitle = artifact.title || '无标题';

        lines.push("<details>");
        lines.push(`<summary>Artifact: ${artifactTitle} (ID: ${artifactId})</summary>`);
        lines.push("");

        // 显示类型
        lines.push(`**类型**: \`${artifactType}\``);
        lines.push("");

        const command = artifact.command || '';
        if (command === 'create') {
          const content = artifact.content || '';
          const language = artifact.language || '';

          if (language) {
            lines.push(`**语言**: \`${language}\``);
            lines.push("");
            lines.push("**内容**:");
            lines.push(`\`\`\`${language}`);
            lines.push(content);
            lines.push("```");
          } else {
            lines.push("**内容**:");
            lines.push("```");
            lines.push(content);
            lines.push("```");
          }
        } else if (command === 'update' || command === 'rewrite') {
          const oldStr = artifact.old_str || '';
          const newStr = artifact.new_str || '';

          lines.push(`**操作**: \`${command}\``);
          lines.push("");
          lines.push("**原始文本**:");
          lines.push("```");
          lines.push(oldStr);
          lines.push("```");
          lines.push("");
          lines.push("**新文本**:");
          lines.push("```");
          lines.push(newStr);
          lines.push("```");
        }

        lines.push("</details>");
        lines.push("");
      });
    }

    // 添加工具使用记录
    if (msg.tools && msg.tools.length > 0 && config.includeTools) {
      msg.tools.forEach(tool => {
        const toolName = tool.name;

        lines.push("<details>");
        lines.push(`<summary>工具: ${toolName}</summary>`);
        lines.push("");

        // 查询内容
        if (toolName === "web_search" && tool.query) {
          lines.push(`**搜索查询**: \`${tool.query}\``);
          lines.push("");
        }

        // 工具输入
        if (tool.input && typeof tool.input === 'object') {
          lines.push("**输入参数**:");
          lines.push("```json");
          try {
            lines.push(JSON.stringify(tool.input, null, 2));
          } catch (error) {
            lines.push(String(tool.input));
          }
          lines.push("```");
          lines.push("");
        }

        // 工具结果
        if (tool.result) {
          lines.push("**结果**:");

          if (tool.result.is_error) {
            lines.push("> ⚠️ 工具执行出错");
            lines.push("");
          }

          // Web搜索结果特殊处理
          if (toolName === "web_search") {
            const resultContent = tool.result.content || [];
            const maxResults = Math.min(resultContent.length, 5); // 最多显示5个结果

            if (resultContent.length > 0) {
              lines.push("搜索结果:");
              lines.push("");

              for (let i = 0; i < maxResults; i++) {
                const item = resultContent[i];
                if (!item || typeof item !== 'object') continue;

                const title = item.title || "无标题";
                const url = item.url || "#";

                lines.push(`${i + 1}. [${title}](${url})`);
              }

              if (resultContent.length > maxResults) {
                lines.push(`*...还有 ${resultContent.length - maxResults} 个结果未显示*`);
              }

              lines.push("");
            }
          }
        }

        lines.push("</details>");
        lines.push("");
      });
    }

    // 添加引用
    if (msg.citations && msg.citations.length > 0 && config.includeCitations) {
      lines.push("<details>");
      lines.push("<summary>引用来源</summary>");
      lines.push("");

      lines.push("| 标题 | 来源 |");
      lines.push("| --- | --- |");

      msg.citations.forEach(citation => {
        const title = citation.title || "未知来源";
        const url = citation.url || "#";
        const source = url.includes('/') ? url.split('/')[2] : '未知网站';
        lines.push(`| [${title}](${url}) | ${source} |`);
      });

      lines.push("</details>");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  // 如果设置了仅导出已完成，在末尾添加统计信息
  if (config.exportMarkedOnly) {
    lines.push("");
    lines.push(`*共导出 ${exportedCount} 条已完成的消息*`);
  }

  return lines.join("\n");
};

// 保存文本到文件
export const saveTextFile = (text, fileName) => {
  try {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('保存文件失败:', error);
    alert('保存文件失败，请重试');
    return false;
  }
};