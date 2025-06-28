const fetcherScript = `// ==UserScript==
// @name         Lyra's Exporter Fetch
// @namespace    userscript://lyra-conversation-exporter
// @version      4.0
// @description  Claude、Gemini、NotebookLM、Google AI Studio对话管理工具的配套脚本：一键获取对话UUID和完整JSON数据，支持树形分支模式导出。轻松管理数百个对话窗口，导出完整时间线、思考过程、工具调用和Artifacts。配合Lyra's Exporter使用，让每次AI对话都成为您的数字资产！
// @description:en Claude, Gemini, NotebookLM, Google AI Studio conversation management companion script: One-click UUID extraction and complete JSON export with tree-branch mode support. Designed for power users to easily manage hundreds of conversation windows, export complete timelines, thinking processes, tool calls and Artifacts. Works with Lyra's Exporter management app to turn every AI chat into your digital asset!
// @homepage     https://github.com/Yalums/Lyra-s-Claude-Exporter
// @supportURL   https://github.com/Yalums/Lyra-s-Claude-Exporter/issues
// @author       Yalums
// @match        https://pro.easychat.top/*
// @match        https://claude.ai/*
// @match        https://gemini.google.com/app/*
// @match        https://notebooklm.google.com/*
// @match        https://aistudio.google.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @license      GNU General Public License v3.0
// @updateURL    https://greasyfork.org/scripts/539579/code/lyra-s-exporter-fetch.meta.js
// @downloadURL  https://greasyfork.org/scripts/539579/code/lyra-s-exporter-fetch.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- 配置区域 ---
    let currentPlatform = '';
    const hostname = window.location.hostname;
    if (hostname.includes('easychat.top') || hostname.includes('claude.ai')) {
        currentPlatform = 'claude';
    } else if (hostname.includes('gemini.google.com')) {
        currentPlatform = 'gemini';
    } else if (hostname.includes('notebooklm.google.com')) {
        currentPlatform = 'notebooklm';
    } else if (hostname.includes('aistudio.google.com')) {
        currentPlatform = 'aistudio';
    }
    
    console.log(\`[Lyra's Fetch] Platform detected: \${currentPlatform}\`);

    // Claude专用变量
    let capturedUserId = '';
    
    // 通用变量
    let isPanelCollapsed = localStorage.getItem('lyraExporterCollapsed') === 'true';
    const CONTROL_ID = "lyra-universal-exporter-container";
    const TOGGLE_ID = "lyra-toggle-button";
    const TREE_SWITCH_ID = "lyra-tree-mode";
    let panelInjected = false;
    
    // AI Studio专用配置
    const SCROLL_DELAY_MS = 250;
    const SCROLL_TOP_WAIT_MS = 1000;
    let collectedData = new Map();

    // --- Claude专用：拦截网络请求获取用户ID ---
    if (currentPlatform === 'claude') {
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            const organizationsMatch = url.match(/api\\/organizations\\/([a-zA-Z0-9-]+)/);
            if (organizationsMatch && organizationsMatch[1]) {
                capturedUserId = organizationsMatch[1];
                console.log("✨ Captured user ID:", capturedUserId);
            }
            return originalXHROpen.apply(this, arguments);
        };

        const originalFetch = window.fetch;
        window.fetch = function(resource, options) {
            if (typeof resource === 'string') {
                const organizationsMatch = resource.match(/api\\/organizations\\/([a-zA-Z0-9-]+)/);
                if (organizationsMatch && organizationsMatch[1]) {
                    capturedUserId = organizationsMatch[1];
                    console.log("✨ Captured user ID:", capturedUserId);
                }
            }
            return originalFetch.apply(this, arguments);
        };
    }

    // --- 样式注入 ---
    function injectCustomStyle() {
        let primaryColor = '#1a73e8';
        let buttonColor = '#1a73e8';
        let buttonHoverColor = '#1765c2';
        
        switch(currentPlatform) {
            case 'claude':
                primaryColor = '#d97706';
                buttonColor = '#EA580C';
                buttonHoverColor = '#DC2626';
                break;
            case 'notebooklm':
                primaryColor = '#374151';
                buttonColor = '#4B5563';
                buttonHoverColor = '#1F2937';
                break;
            case 'gemini':
            case 'aistudio':
            default:
                break;
        }
        
        const style = document.createElement('style');
        style.textContent = \`
            #\${CONTROL_ID} {
                position: fixed !important; right: 15px !important; bottom: 75px !important;
                display: flex !important; flex-direction: column !important; gap: 8px !important;
                z-index: 2147483647 !important; transition: all 0.3s ease !important;
                background: white !important; border-radius: 12px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; padding: 12px !important;
                border: 1px solid \${currentPlatform === 'notebooklm' ? '#9CA3AF' : currentPlatform === 'claude' ? 'rgba(217, 119, 6, 0.3)' : '#e0e0e0'} !important;
                width: auto !important; min-width: 40px !important;
                font-family: 'Google Sans', Roboto, Arial, sans-serif !important; color: #3c4043 !important;
            }
            #\${CONTROL_ID}.collapsed .lyra-main-controls { display: none !important; }
            #\${CONTROL_ID}.collapsed {
                padding: 8px !important; width: 40px !important; height: 40px !important;
                justify-content: center !important; align-items: center !important; overflow: hidden !important;
            }
            #\${TOGGLE_ID} {
                position: absolute !important; left: -14px !important; top: 50% !important;
                transform: translateY(-50%) !important; width: 28px !important; height: 28px !important;
                border-radius: 50% !important; display: flex !important; align-items: center !important;
                justify-content: center !important; background: #f1f3f4 !important; color: #2C84DB !important;
                cursor: pointer !important; border: 1px solid #dadce0 !important;
                transition: all 0.3s !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            }
            #\${CONTROL_ID}.collapsed #\${TOGGLE_ID} {
                position: static !important; transform: none !important; left: auto !important; top: auto !important;
            }
            #\${TOGGLE_ID}:hover { background: #e8eaed !important; }
            .lyra-main-controls { display: flex !important; flex-direction: column !important; gap: 10px !important; align-items: center !important; }
            .lyra-button {
                display: inline-flex !important; align-items: center !important; justify-content: center !important;
                padding: 8px 16px !important; border-radius: 18px !important; cursor: pointer !important;
                font-size: 14px !important; font-weight: 500 !important; background-color: \${buttonColor} !important;
                color: white !important; border: none !important; transition: all 0.3s !important;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important; font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
                white-space: nowrap !important; width: 100% !important; gap: 8px !important;
            }
            .lyra-button:hover { background-color: \${buttonHoverColor} !important; box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important; }
            .lyra-button:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
            .lyra-button svg { flex-shrink: 0 !important; }
            .lyra-title { font-size: 13px !important; font-weight: 500 !important; color: \${primaryColor} !important; margin-bottom: 8px !important; text-align: center !important; }
            .lyra-toggle { display: flex !important; align-items: center !important; font-size: 13px !important; margin-bottom: 5px !important; gap: 5px !important; color: #5f6368 !important; }
            .lyra-switch { position: relative !important; display: inline-block !important; width: 32px !important; height: 16px !important; }
            .lyra-switch input { opacity: 0 !important; width: 0 !important; height: 0 !important; }
            .lyra-slider { position: absolute !important; cursor: pointer !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background-color: #ccc !important; transition: .4s !important; border-radius: 34px !important; }
            .lyra-slider:before { position: absolute !important; content: "" !important; height: 12px !important; width: 12px !important; left: 2px !important; bottom: 2px !important; background-color: white !important; transition: .4s !important; border-radius: 50% !important; }
            input:checked + .lyra-slider { background-color: \${buttonColor} !important; }
            input:checked + .lyra-slider:before { transform: translateX(16px) !important; }
            .lyra-toast {
                position: fixed !important; bottom: 150px !important; right: 20px !important;
                background-color: #323232 !important; color: white !important; padding: 12px 20px !important;
                border-radius: 4px !important; z-index: 2147483648 !important; opacity: 0 !important;
                transition: opacity 0.3s ease-in-out !important; font-size: 14px !important;
                font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
            }
            .lyra-loading {
                display: inline-block !important; width: 20px !important; height: 20px !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important; border-radius: 50% !important;
                border-top-color: #fff !important; animation: lyra-spin 1s linear infinite !important;
            }
            @keyframes lyra-spin { to { transform: rotate(360deg); } }
            .lyra-progress { font-size: 12px !important; color: #5f6368 !important; margin-top: 5px !important; text-align: center !important; width: 100%; }
        \`;
        document.head.appendChild(style);
    }

    // --- 通用工具函数 ---
    function showToast(message, duration = 3000) {
        let toast = document.querySelector(".lyra-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "lyra-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = "1";
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
                if (toast && toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function toggleCollapsed() {
        const container = document.getElementById(CONTROL_ID);
        const toggleButton = document.getElementById(TOGGLE_ID);
        if (container && toggleButton) {
            isPanelCollapsed = !isPanelCollapsed;
            container.classList.toggle('collapsed', isPanelCollapsed);
            toggleButton.innerHTML = isPanelCollapsed ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
            localStorage.setItem('lyraExporterCollapsed', isPanelCollapsed);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // --- Claude专用函数 ---
    function getCurrentChatUUID() {
        const url = window.location.href;
        const match = url.match(/\\/chat\\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    }

    function checkUrlForTreeMode() {
        return window.location.href.includes('?tree=True&rendering_mode=messages&render_all_tools=true') ||
               window.location.href.includes('&tree=True&rendering_mode=messages&render_all_tools=true');
    }

    async function getAllConversations() {
        if (!capturedUserId) {
            showToast("未能获取用户ID，请刷新页面");
            return null;
        }
        try {
            const baseUrl = window.location.hostname.includes('claude.ai') ? 'https://claude.ai' : 'https://pro.easychat.top';
            const apiUrl = \`\${baseUrl}/api/organizations/\${capturedUserId}/chat_conversations\`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(\`请求失败: \${response.status}\`);
            }
            return await response.json();
        } catch (error) {
            console.error("获取对话列表失败:", error);
            showToast("获取对话列表失败: " + error.message);
            return null;
        }
    }

    async function getConversationDetails(uuid) {
        if (!capturedUserId) {
            return null;
        }
        try {
            const data = await getConversationDetailsWithImages(uuid, false); // 默认不包含图片
            return data;
        } catch (error) {
            console.error(\`获取对话 \${uuid} 详情失败:\`, error);
            return null;
        }
    }

    async function processImageAttachment(imageUrl, debugInfo = '') {
        console.log(\`[Lyra Debug] 开始处理图片: \${imageUrl} (\${debugInfo})\`);
        try {
            if (!imageUrl.startsWith('http')) {
                const baseUrl = window.location.hostname.includes('claude.ai') ? 
                    'https://claude.ai' : 'https://pro.easychat.top';
                imageUrl = baseUrl + imageUrl;
            }
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(\`Failed to fetch image: \${response.status}\`);
            }
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            return {
                type: 'image',
                format: blob.type,
                size: blob.size,
                data: base64,
                original_url: imageUrl
            };
        } catch (error) {
            console.error(\`[Lyra Debug] 处理图片失败 (\${debugInfo}):\`, error);
            return null;
        }
    }

    async function getConversationDetailsWithImages(uuid, includeImages = false) {
        if (!capturedUserId) {
            return null;
        }
        try {
            const baseUrl = window.location.hostname.includes('claude.ai') ? 
                'https://claude.ai' : 'https://pro.easychat.top';
            const apiUrl = \`\${baseUrl}/api/organizations/\${capturedUserId}/chat_conversations/\${uuid}?tree=True&rendering_mode=messages&render_all_tools=true\`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(\`请求失败: \${response.status}\`);
            }
            
            const data = await response.json();
            
            if (!includeImages) {
                return data;
            }
            
            let processedImageCount = 0;
            
            if (data.chat_messages && Array.isArray(data.chat_messages)) {
                for (let msgIndex = 0; msgIndex < data.chat_messages.length; msgIndex++) {
                    const message = data.chat_messages[msgIndex];
                    
                    const fileArrays = ['files', 'files_v2', 'attachments'];
                    for (const key of fileArrays) {
                        if (message[key] && Array.isArray(message[key])) {
                            for (let i = 0; i < message[key].length; i++) {
                                const file = message[key][i];
                                let imageUrl = null;
                                let isImage = false;

                                if (file.file_kind === 'image' || (file.file_type && file.file_type.startsWith('image/'))) {
                                    isImage = true;
                                    imageUrl = file.preview_url || file.thumbnail_url || file.file_url;
                                }

                                if (isImage && imageUrl && !file.embedded_image) {
                                    const imageData = await processImageAttachment(imageUrl, \`消息\${msgIndex + 1}-\${key}-\${i + 1}\`);
                                    if (imageData) {
                                        message[key][i].embedded_image = imageData;
                                        processedImageCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            data._debug_info = {
                images_processed: processedImageCount,
                processing_time: new Date().toISOString()
            };
            
            return data;
        } catch (error) {
            console.error(\`[Lyra Debug] 获取对话 \${uuid} 详情失败:\`, error);
            return null;
        }
    }

    async function exportCurrentConversationWithImages() {
        const uuid = getCurrentChatUUID();
        if (!uuid) {
            showToast("未找到对话UUID！");
            return;
        }
        if (!capturedUserId) {
            showToast("未能获取用户ID，请刷新页面");
            return;
        }
        try {
            const includeImages = confirm("是否包含图片？\\n\\n包含图片会使文件更大，但数据更完整。");
            showToast(includeImages ? "正在获取数据（包含图片）..." : "正在获取数据...");
            const data = await getConversationDetailsWithImages(uuid, includeImages);
            if (!data) {
                throw new Error("无法获取对话数据");
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`claude_\${uuid.substring(0, 8)}_\${includeImages ? 'with_images_' : ''}\${new Date().toISOString().slice(0,10)}.json\`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(\`JSON导出成功\${includeImages ? '（包含图片）' : ''}！\`);
        } catch (error) {
            console.error("导出失败:", error);
            showToast("导出失败: " + error.message);
        }
    }

    // --- 通用标题获取函数 ---
    function getConversationTitle() {
        let title = '';
        try {
            switch (currentPlatform) {
                case 'gemini':
                    const defaultTitle = \`Gemini Chat \${new Date().toISOString().slice(0,10)}\`;
                    title = prompt("请输入对话标题:", defaultTitle);
                    if (title === null) {
                        return null; 
                    }
                    return title.trim() || defaultTitle;

                case 'notebooklm':
                    const nblmTitleEl = document.querySelector('h1.notebook-title');
                    title = nblmTitleEl ? nblmTitleEl.innerText.trim() : 'Untitled NotebookLM Chat';
                    return title;

                case 'aistudio':
                    const studioTitleEl = document.querySelector('div.page-title h1');
                    title = studioTitleEl ? studioTitleEl.innerText.trim() : 'Untitled AI Studio Chat';
                    return title;

                default:
                    return \`Chat Export \${new Date().toISOString().slice(0,10)}\`;
            }
        } catch (error) {
            console.error("[Lyra's Fetch] 获取标题时出错:", error);
            showToast("获取标题失败，将使用默认标题。");
            return \`Untitled Chat \${new Date().toISOString().slice(0,10)}\`;
        }
    }

    // --- Gemini, NotebookLM, AI Studio 数据提取函数 ---
    function fetchViaGM(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.response);
                    } else {
                        reject(new Error(\`GM_xmlhttpRequest 失败，状态码: \${response.status}\`));
                    }
                },
                onerror: function(error) {
                    reject(new Error(\`GM_xmlhttpRequest 网络错误: \${error.statusText}\`));
                }
            });
        });
    }

    async function processImageElement(imgElement) {
        if (!imgElement) return null;
        let imageUrlToFetch = null;
        const previewContainer = imgElement.closest('user-query-file-preview');
        if (previewContainer) {
            const lensLinkElement = previewContainer.querySelector('a[href*="lens.google.com"]');
            if (lensLinkElement && lensLinkElement.href) {
                try {
                    const urlObject = new URL(lensLinkElement.href);
                    const realImageUrl = urlObject.searchParams.get('url');
                    if (realImageUrl) {
                        imageUrlToFetch = realImageUrl;
                    }
                } catch (e) {
                    console.warn("[Lyra's Fetch] 解析智能镜头链接失败，将尝试备用方案。");
                }
            }
        }
        if (!imageUrlToFetch) {
            const fallbackSrc = imgElement.src;
            if (fallbackSrc && !fallbackSrc.startsWith('data:')) {
                imageUrlToFetch = fallbackSrc;
            }
        }
        if (!imageUrlToFetch) {
            console.error("[Lyra's Fetch] 所有图片URL提取方案均失败。");
            return null;
        }
        try {
            const blob = await fetchViaGM(imageUrlToFetch);
            const base64 = await blobToBase64(blob);
            return {
                type: 'image',
                format: blob.type,
                size: blob.size,
                data: base64,
                original_src: imageUrlToFetch
            };
        } catch (error) {
            console.error(\`[Lyra's Fetch] 使用 GM_xmlhttpRequest 获取图片失败:\`, error);
            return null;
        }
    }

    async function processGeminiContainer(container) {
        const userQueryElement = container.querySelector("user-query .query-text") || container.querySelector(".query-text-line");
        const modelResponseContainer = container.querySelector("model-response") || container;
        const modelResponseElement = modelResponseContainer.querySelector("message-content .markdown-main-panel");
        const questionText = userQueryElement ? userQueryElement.innerText.trim() : "";
        const answerText = modelResponseElement ? modelResponseElement.innerText.trim() : "";
        const userImageElements = container.querySelectorAll("user-query img");
        const modelImageElements = modelResponseContainer.querySelectorAll("model-response img");
        const userImagesPromises = Array.from(userImageElements).map(img => processImageElement(img));
        const modelImagesPromises = Array.from(modelImageElements).map(img => processImageElement(img));
        const userImages = (await Promise.all(userImagesPromises)).filter(Boolean);
        const modelImages = (await Promise.all(modelImagesPromises)).filter(Boolean);
        if (questionText || answerText || userImages.length > 0 || modelImages.length > 0) {
            return {
                human: { text: questionText, images: userImages },
                assistant: { text: answerText, images: modelImages }
            };
        }
        return null;
    }

    async function extractGeminiConversationData() {
        const conversationTurns = document.querySelectorAll("div.conversation-turn");
        let conversationData = [];
        if (conversationTurns.length > 0) {
            for (const turn of conversationTurns) {
                const data = await processGeminiContainer(turn);
                if (data) conversationData.push(data);
            }
        } else {
            const legacyContainers = document.querySelectorAll("div.single-turn, div.conversation-container");
            for (const container of legacyContainers) {
                const data = await processGeminiContainer(container);
                if (data) conversationData.push(data);
            }
        }
        return conversationData;
    }

    // NotebookLM - **重构以支持换行和格式**
    function extractNotebookLMConversationData() {
        const conversationTurns = document.querySelectorAll("div.chat-message-pair");
        let conversationData = [];

        conversationTurns.forEach((turnContainer) => {
            let questionText = "";
            const userQueryEl = turnContainer.querySelector("chat-message .from-user-container .message-text-content");
            if (userQueryEl) {
                questionText = userQueryEl.innerText.trim();
                // **新增：自动移除 [Preamble] 标签**
                if (questionText.startsWith('[Preamble] ')) {
                    questionText = questionText.substring('[Preamble] '.length).trim();
                }
            }

            let answerText = "";
            const modelResponseContent = turnContainer.querySelector("chat-message .to-user-container .message-text-content");
            if (modelResponseContent) {
                const answerParts = [];
                const structuralElements = modelResponseContent.querySelectorAll('labs-tailwind-structural-element-view-v2');
                structuralElements.forEach(structEl => {
                    const bulletEl = structEl.querySelector('.bullet');
                    const paragraphEl = structEl.querySelector('.paragraph');
                    let lineText = '';
                    if (bulletEl) {
                        lineText += bulletEl.innerText.trim() + ' ';
                    }
                    if (paragraphEl) {
                        let paragraphText = '';
                        // 遍历所有子节点以保留文本和加粗的顺序
                        paragraphEl.childNodes.forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                paragraphText += node.textContent;
                            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
                                // 完全忽略引用标记
                                if (node.querySelector('button.citation-marker')) {
                                    return;
                                }
                                // **新增：检查bold类并添加Markdown**
                                if (node.classList.contains('bold')) {
                                    paragraphText += \`**\${node.innerText}**\`;
                                } else {
                                    paragraphText += node.innerText;
                                }
                            }
                        });
                        lineText += paragraphText;
                    }
                    if (lineText.trim()) {
                        answerParts.push(lineText.trim());
                    }
                });
                // **修改：使用两个换行符连接**
                answerText = answerParts.join('\\n\\n');
            }

            if (questionText || answerText) {
                conversationData.push({
                    human: questionText,
                    assistant: answerText
                });
            }
        });
        return conversationData;
    }
    
    // AI Studio 专用函数
    function getAIStudioScroller() {
        const selectors = [
            'ms-chat-session ms-autoscroll-container',
            'mat-sidenav-content',
            '.chat-view-container'
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
                return el;
            }
        }
        return document.documentElement;
    }

    function extractDataIncremental_AiStudio() {
        const turns = document.querySelectorAll('ms-chat-turn');
        turns.forEach(turn => {
            if (collectedData.has(turn)) { return; }
            const isUserTurn = turn.querySelector('.chat-turn-container.user');
            const isModelTurn = turn.querySelector('.chat-turn-container.model');
            let turnData = { type: 'unknown', text: '' };
            if (isUserTurn) {
                const userPromptNode = isUserTurn.querySelector('.user-prompt-container .turn-content');
                if (userPromptNode) {
                    const userText = userPromptNode.innerText.trim();
                    if (userText) {
                        turnData.type = 'user';
                        turnData.text = userText;
                    }
                }
            } else if (isModelTurn) {
                const responseChunks = isModelTurn.querySelectorAll('ms-prompt-chunk');
                let responseText = '';
                responseChunks.forEach(chunk => {
                    if (!chunk.querySelector('ms-thought-chunk')) {
                        const cmarkNode = chunk.querySelector('ms-cmark-node');
                        if (cmarkNode) { responseText += cmarkNode.innerText.trim() + '\\n'; }
                    }
                });
                if (responseText.trim()) {
                    turnData.type = 'model';
                    turnData.text = responseText.trim();
                }
            }
            if (turnData.type !== 'unknown') {
                collectedData.set(turn, turnData);
            }
        });
    }

    async function autoScrollAndCaptureAIStudio(onProgress) {
        collectedData.clear();
        const scroller = getAIStudioScroller();
        onProgress("正在滚动到顶部...", false);
        scroller.scrollTop = 0;
        await sleep(SCROLL_TOP_WAIT_MS); 
        let lastScrollTop = -1;
        onProgress("开始向下扫描...", false);
        while (true) {
            extractDataIncremental_AiStudio();
            onProgress(\`扫描中... \${Math.round((scroller.scrollTop + scroller.clientHeight) / scroller.scrollHeight * 100)}% (已发现 \${collectedData.size} 条)\`, false);
            if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10) {
                break;
            }
            lastScrollTop = scroller.scrollTop;
            scroller.scrollTop += scroller.clientHeight * 0.85;
            await sleep(SCROLL_DELAY_MS);
            if (scroller.scrollTop === lastScrollTop) {
                break;
            }
        }
        onProgress("扫描完成，正在提取...", false);
        extractDataIncremental_AiStudio();
        await sleep(500);
        const finalTurnsInDom = document.querySelectorAll('ms-chat-turn');
        let sortedData = [];
        finalTurnsInDom.forEach(turnNode => {
            if (collectedData.has(turnNode)) {
                sortedData.push(collectedData.get(turnNode));
            }
        });
        const pairedData = [];
        let lastHuman = null;
        sortedData.forEach(item => {
            if (item.type === 'user') {
                lastHuman = item.text;
            } else if (item.type === 'model' && lastHuman) {
                pairedData.push({ human: lastHuman, assistant: item.text });
                lastHuman = null;
            } else if (item.type === 'model' && !lastHuman) {
                 pairedData.push({ human: "[No preceding user prompt found]", assistant: item.text });
            }
        });
        if (lastHuman) {
            pairedData.push({ human: lastHuman, assistant: "[Model response is pending]" });
        }
        return pairedData;
    }

    // --- UI 创建与事件绑定 ---
    function createFloatingPanel() {
        if (document.getElementById(CONTROL_ID) || panelInjected) {
            return false;
        }

        const container = document.createElement('div');
        container.id = CONTROL_ID;
        if (isPanelCollapsed) container.classList.add('collapsed');

        const toggleButton = document.createElement('div');
        toggleButton.id = TOGGLE_ID;
        toggleButton.innerHTML = isPanelCollapsed ? 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
        toggleButton.addEventListener('click', toggleCollapsed);
        container.appendChild(toggleButton);

        const controlsArea = document.createElement('div');
        controlsArea.className = 'lyra-main-controls';
        
        const title = document.createElement('div');
        title.className = 'lyra-title';
        switch (currentPlatform) {
            case 'claude': title.textContent = 'Lyra\\'s Claude Exporter'; break;
            case 'gemini': title.textContent = 'Gemini JSON Exporter'; break;
            case 'notebooklm': title.textContent = 'NotebookLM JSON Exporter'; break;
            case 'aistudio': title.textContent = 'AI Studio JSON Exporter'; break;
            default: title.textContent = 'Lyra\\'s AI Exporter';
        }
        controlsArea.appendChild(title);

        if (currentPlatform === 'claude') {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'lyra-toggle';
            toggleContainer.innerHTML = \`
                <span>多分支模式</span>
                <label class="lyra-switch">
                    <input type="checkbox" id="\${TREE_SWITCH_ID}" \${checkUrlForTreeMode() ? 'checked' : ''}>
                    <span class="lyra-slider"></span>
                </label>
            \`;
            controlsArea.appendChild(toggleContainer);

            const uuidButton = document.createElement('button');
            uuidButton.className = 'lyra-button';
            uuidButton.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/></svg>
                获取对话UUID
            \`;
            uuidButton.addEventListener('click', () => {
                const uuid = getCurrentChatUUID();
                if (uuid) {
                    if (!capturedUserId) { showToast("未能获取用户ID，请刷新页面"); return; }
                    navigator.clipboard.writeText(uuid).then(() => showToast("UUID已复制！")).catch(() => showToast("复制失败"));
                    const treeMode = document.getElementById(TREE_SWITCH_ID).checked;
                    const baseUrl = window.location.hostname.includes('claude.ai') ? 'https://claude.ai' : 'https://pro.easychat.top';
                    const jumpUrl = \`\${baseUrl}/api/organizations/\${capturedUserId}/chat_conversations/\${uuid}\${treeMode ? '?tree=True&rendering_mode=messages&render_all_tools=true' : ''}\`;
                    window.open(jumpUrl, "_blank");
                } else {
                    showToast("未找到UUID！");
                }
            });
            controlsArea.appendChild(uuidButton);

            const exportButton = document.createElement('button');
            exportButton.className = 'lyra-button';
            exportButton.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"/></svg>
                导出对话JSON
            \`;
            exportButton.addEventListener('click', exportCurrentConversationWithImages);
            controlsArea.appendChild(exportButton);

            const exportAllButton = document.createElement('button');
            exportAllButton.className = 'lyra-button';
            exportAllButton.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/></svg>
                导出所有对话
            \`;
            exportAllButton.addEventListener('click', async function(event) {
                if (!capturedUserId) { showToast("未能获取用户ID，请刷新页面"); return; }
                const includeImages = confirm("是否包含图片？\\n\\n包含图片会使文件更大，但数据更完整。");
                const progressElem = document.createElement('div');
                progressElem.className = 'lyra-progress';
                progressElem.textContent = '准备中...';
                controlsArea.appendChild(progressElem);
                const originalContent = this.innerHTML;
                this.innerHTML = '<div class="lyra-loading"></div><span>导出中...</span>';
                this.disabled = true;
                try {
                    showToast("正在获取所有对话列表...", 3000);
                    const allConversations = await getAllConversations();
                    if (!allConversations || !Array.isArray(allConversations)) {
                        throw new Error("无法获取对话列表");
                    }
                    const result = {
                        exportedAt: new Date().toISOString(),
                        totalConversations: allConversations.length,
                        conversations: []
                    };
                    for (let i = 0; i < allConversations.length; i++) {
                        const conversation = allConversations[i];
                        progressElem.textContent = \`获取对话 \${i + 1}/\${allConversations.length}\${includeImages ? ' (处理图片中...)' : ''}\`;
                        if (i > 0) await sleep(500);
                        const details = await getConversationDetailsWithImages(conversation.uuid, includeImages);
                        if (details) result.conversations.push(details);
                    }
                    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`claude_all_conversations_\${includeImages ? 'with_images_' : ''}\${new Date().toISOString().slice(0,10)}.json\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast(\`成功导出 \${result.conversations.length} 个对话！\`);
                } catch (error) {
                    showToast("导出失败: " + error.message);
                } finally {
                    this.innerHTML = originalContent;
                    this.disabled = false;
                    if (progressElem.parentNode) progressElem.parentNode.removeChild(progressElem);
                }
            });
            controlsArea.appendChild(exportAllButton);
        } else {
            // --- 其他平台的统一导出按钮 (已更新逻辑) ---
            const exportButton = document.createElement('button');
            exportButton.className = 'lyra-button';
            exportButton.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"/>
                </svg>
                <span>导出为 JSON</span>
            \`;
            exportButton.addEventListener('click', async function() {
                const title = getConversationTitle();
                if (title === null) {
                    showToast("导出已取消。");
                    return;
                }
                this.disabled = true;
                const originalContent = this.innerHTML;
                this.innerHTML = '<div class="lyra-loading"></div><span>导出中...</span>';
                let progressElem = null;
                if (currentPlatform === 'aistudio') {
                    progressElem = document.createElement('div');
                    progressElem.className = 'lyra-progress';
                    controlsArea.appendChild(progressElem);
                }
                try {
                    let conversationData = [];
                    showToast("正在提取数据...");
                    if (currentPlatform === 'aistudio') {
                        conversationData = await autoScrollAndCaptureAIStudio((message) => {
                            if (progressElem) progressElem.textContent = message;
                        });
                    } else if (currentPlatform === 'gemini') {
                        conversationData = await extractGeminiConversationData();
                    } else if (currentPlatform === 'notebooklm') {
                        conversationData = extractNotebookLMConversationData();
                    }
                    if (conversationData.length > 0) {
                        const finalJson = {
                            title: title,
                            platform: currentPlatform,
                            exportedAt: new Date().toISOString(),
                            conversation: conversationData
                        };
                        
                        const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
                        const filename = \`\${currentPlatform}_Chat_\${timestamp}.json\`;

                        const jsonData = JSON.stringify(finalJson, null, 2);
                        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                        showToast("导出成功！");
                    } else {
                        showToast("没有可导出的对话内容。", 4000);
                    }
                } catch (error) {
                    console.error("导出错误:", error);
                    showToast(\`导出过程中发生错误: \${error.message}\`, 5000);
                } finally {
                    this.disabled = false;
                    this.innerHTML = originalContent;
                    if (progressElem && progressElem.parentNode) {
                        progressElem.parentNode.removeChild(progressElem);
                    }
                }
            });
            controlsArea.appendChild(exportButton);
        }

        container.appendChild(controlsArea);
        document.body.appendChild(container);
        panelInjected = true;
        return true;
    }

    // --- 脚本初始化 ---
    function initScript() {
        if (!currentPlatform) {
            console.error("[Lyra's Fetch] Platform not supported");
            return;
        }
        injectCustomStyle();
        setTimeout(() => {
            if (currentPlatform === 'claude') {
                if (/\\/chat\\/[a-zA-Z0-9-]+/.test(window.location.href)) {
                    createFloatingPanel();
                }
            } else {
                createFloatingPanel();
            }
        }, 2000);

        if (currentPlatform === 'claude') {
            let lastUrl = window.location.href;
            const observer = new MutationObserver(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    setTimeout(() => {
                        if (/\\/chat\\/[a-zA-Z0-9-]+/.test(lastUrl) && !document.getElementById(CONTROL_ID)) {
                            createFloatingPanel();
                        }
                    }, 1000);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScript);
    } else {
        initScript();
    }
})();`;

export default fetcherScript;