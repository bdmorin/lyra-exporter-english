// 导出脚本内容作为字符串常量
const fetcherScript = `// ==UserScript==
// @name         Combined Gemini/NotebookLM & Claude Tools
// @namespace    https://github.com/user/combined-ai-scripts
// @version      1.0.1
// @description  Exports Gemini/NotebookLM chats to JSON and provides UUID/export tools for Claude.ai.
// @author       Combined User & AI
// @match        https://gemini.google.com/app/*
// @match        https://gemini.google.com/app
// @match        https://notebooklm.google.com/*
// @match        https://claude.ai/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com
// @downloadURL  https://your-repo/combined_ai_tools.user.js
// @updateURL    https://your-repo/combined_ai_tools.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_NAME_COMBINED = "Combined AI Chat Tools";
    const mainLogger = (msg, level = 'log') => {
        console[level](\`[\${SCRIPT_NAME_COMBINED}] \${msg}\`);
    };

    mainLogger(\`Combined script evaluating on: \${window.location.hostname} (v1.0.1)\`);

    // Function to encapsulate Script 1 (Gemini/NotebookLM)
    function runGeminiNotebookLMScript() {
        const SCRIPT_NAME_GNLM = "Gemini/NotebookLM Export JSON"; // Local to this function
        const loggerGNLM = (msg, level = 'log') => {
            console[level](\`[\${SCRIPT_NAME_GNLM}] \${msg}\`);
        };

        loggerGNLM('Script part starting (v2.7) - invoked by combined script');

        let currentPlatformGNLM = '';
        if (window.location.hostname.includes('gemini.google.com')) {
            currentPlatformGNLM = 'gemini';
        } else if (window.location.hostname.includes('notebooklm.google.com')) {
            currentPlatformGNLM = 'notebooklm';
        }
        loggerGNLM(\`Detected platform: \${currentPlatformGNLM}\`);

        let isPanelCollapsedGNLM = GM_getValue('geminiExportPanelCollapsed', false);
        const CONTROL_ID_GNLM = "gemini-export-tool-container-userscript-v27";
        const TOGGLE_BUTTON_ID_GNLM = "gemini-export-toggle-button-userscript-v27";
        const EXPORT_BUTTON_ID_GNLM = "gemini-export-trigger-button-userscript-v27";
        let panelInjectedGNLM = false;
        let panelCreationIntervalGNLM = null;
        let panelCreationAttemptsGNLM = 0;
        const MAX_PANEL_CREATION_ATTEMPTS_GNLM = 30; // Try for 15 seconds (30 * 500ms)
        let observerGNLM = null;

        function createSVGElementGNLM(tag, attributes) {
            const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
            for (const key in attributes) {
                el.setAttribute(key, attributes[key]);
            }
            return el;
        }

        function createArrowIconGNLM(direction = 'left') {
            const svg = createSVGElementGNLM("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" });
            const path = createSVGElementGNLM("path", { d: direction === 'left' ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6" });
            svg.appendChild(path);
            return svg;
        }

        function createDownloadIconGNLM() {
            const svg = createSVGElementGNLM("svg", { viewBox: "0 0 24 24", fill: "currentColor", width: "18", height: "18"});
            const path = createSVGElementGNLM("path", { d: "M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H16V18H8V16Z" });
            svg.appendChild(path);
            svg.style.marginRight = "8px";
            return svg;
        }

        function injectCustomStyleGNLM() {
            GM_addStyle(\`
                #\${CONTROL_ID_GNLM} {
                    position: fixed !important; right: 15px !important; bottom: 25px !important;
                    display: flex !important; flex-direction: column !important; gap: 8px !important;
                    z-index: 2147483647 !important; /* Highest z-index */
                    transition: transform 0.3s ease, width 0.3s ease, padding 0.3s ease !important;
                    background: white !important; border-radius: 12px !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; padding: 12px !important;
                    border: 1px solid #e0e0e0 !important; width: auto !important; min-width: 40px !important;
                    font-family: 'Google Sans', Roboto, Arial, sans-serif !important; color: #3c4043 !important;
                }
                #\${CONTROL_ID_GNLM}.collapsed .gemini-export-main-controls { display: none !important; }
                #\${CONTROL_ID_GNLM}.collapsed {
                    padding: 8px !important; width: 40px !important; height: 40px !important;
                    justify-content: center !important; align-items: center !important; overflow: hidden !important;
                }
                #\${TOGGLE_BUTTON_ID_GNLM} {
                    position: absolute !important; left: -14px !important; top: 50% !important;
                    transform: translateY(-50%) !important; width: 28px !important; height: 28px !important;
                    border-radius: 50% !important; display: flex !important; align-items: center !important;
                    justify-content: center !important; background: #f1f3f4 !important; color: #1a73e8 !important;
                    cursor: pointer !important; border: 1px solid #dadce0 !important;
                    transition: all 0.3s !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }
                #\${CONTROL_ID_GNLM}.collapsed #\${TOGGLE_BUTTON_ID_GNLM} {
                    position: static !important; transform: none !important; left: auto !important; top: auto !important;
                }
                #\${TOGGLE_BUTTON_ID_GNLM}:hover { background: #e8eaed !important; }
                .gemini-export-main-controls {
                    display: flex !important; flex-direction: column !important; gap: 10px !important;
                    align-items: center !important;
                }
                .gemini-export-button {
                    display: inline-flex !important; align-items: center !important; justify-content: center !important;
                    padding: 8px 16px !important; border-radius: 18px !important; cursor: pointer !important;
                    font-size: 14px !important; font-weight: 500 !important; background-color: #1a73e8 !important;
                    color: white !important; border: none !important;
                    transition: background-color 0.3s, box-shadow 0.3s !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                    font-family: 'Google Sans', Roboto, Arial, sans-serif !important; white-space: nowrap !important;
                }
                .gemini-export-button:hover {
                    background-color: #1765c2 !important; box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
                }
                .gemini-export-button svg { margin-right: 8px !important; width: 18px !important; height: 18px !important; }
                .gemini-export-title {
                    font-size: 13px !important; font-weight: 500 !important; color: #1a73e8 !important;
                    margin-bottom: 8px !important; text-align: center !important;
                }
            \`);
            loggerGNLM('Custom styles injected for Gemini/NotebookLM.');
        }

        function togglePanelCollapsedGNLM() {
            const container = document.getElementById(CONTROL_ID_GNLM);
            const toggleButton = document.getElementById(TOGGLE_BUTTON_ID_GNLM);
            if (container && toggleButton) {
                isPanelCollapsedGNLM = !isPanelCollapsedGNLM;
                container.classList.toggle('collapsed', isPanelCollapsedGNLM);
                toggleButton.innerHTML = ''; // Clear previous icon
                toggleButton.appendChild(createArrowIconGNLM(isPanelCollapsedGNLM ? 'left' : 'right'));
                GM_setValue('geminiExportPanelCollapsed', isPanelCollapsedGNLM);
                loggerGNLM(\`Panel \${isPanelCollapsedGNLM ? 'collapsed' : 'expanded'}\`);
            }
        }

        function createFloatingPanelGNLM() {
            if (document.getElementById(CONTROL_ID_GNLM) || panelInjectedGNLM) {
                return false;
            }
            if (!currentPlatformGNLM) {
                loggerGNLM('Platform not detected. Panel not created.', 'warn');
                return false;
            }
            loggerGNLM('Creating floating panel for Gemini/NotebookLM...');

            const container = document.createElement('div');
            container.id = CONTROL_ID_GNLM;
            if (isPanelCollapsedGNLM) container.classList.add('collapsed');

            const toggleButton = document.createElement('div');
            toggleButton.id = TOGGLE_BUTTON_ID_GNLM;
            toggleButton.appendChild(createArrowIconGNLM(isPanelCollapsedGNLM ? 'left' : 'right'));
            toggleButton.addEventListener('click', togglePanelCollapsedGNLM);
            container.appendChild(toggleButton);

            const controlsArea = document.createElement('div');
            controlsArea.className = 'gemini-export-main-controls';

            const title = document.createElement('div');
            title.className = 'gemini-export-title';
            title.textContent = currentPlatformGNLM === 'notebooklm' ? 'NotebookLM JSON Exporter' : 'Gemini JSON Exporter';
            controlsArea.appendChild(title);

            const exportButton = document.createElement('button');
            exportButton.id = EXPORT_BUTTON_ID_GNLM;
            exportButton.className = 'gemini-export-button';
            exportButton.appendChild(createDownloadIconGNLM());
            exportButton.appendChild(document.createTextNode(" Export to JSON"));
            exportButton.addEventListener('click', handleExportToJsonGNLM);
            controlsArea.appendChild(exportButton);

            container.appendChild(controlsArea);
            document.body.appendChild(container);
            panelInjectedGNLM = true;
            loggerGNLM('Floating panel appended to body.');
            return true;
        }

        function extractGeminiConversationDataGNLM() {
            const conversationTurns = document.querySelectorAll("div.conversation-turn");
            let conversationData = [];

            if (conversationTurns.length === 0) {
                loggerGNLM("No 'div.conversation-turn' elements found for Gemini. Trying older 'div.single-turn' or 'div.conversation-container'.", "warn");
                const legacySelectors = ["div.single-turn", "div.conversation-container"];
                let foundLegacy = false;
                for (const sel of legacySelectors) {
                    const legacyContainers = document.querySelectorAll(sel);
                    if (legacyContainers.length > 0) {
                        loggerGNLM(\`Using legacy selector "\${sel}" for Gemini.\`);
                        legacyContainers.forEach(container => processGeminiContainerGNLM(container, conversationData));
                        foundLegacy = true;
                        break;
                    }
                }
                if (!foundLegacy) loggerGNLM("No Gemini conversation elements found with primary or legacy selectors.", "error");
            } else {
                conversationTurns.forEach(turn => processGeminiContainerGNLM(turn, conversationData));
            }

            loggerGNLM(\`Gemini conversation extracted: \${conversationData.length} items\`);
            return conversationData;
        }

        function processGeminiContainerGNLM(container, conversationData) {
            const userQueryElement = container.querySelector("user-query .query-text") || container.querySelector(".query-text-line");
            const modelResponseContainer = container.querySelector("model-response") || container;
            const modelResponseElement = modelResponseContainer.querySelector("message-content .markdown-main-panel");

            const questionText = userQueryElement ? userQueryElement.innerText.trim() : "";
            const answerText = modelResponseElement ? modelResponseElement.innerText.trim() : "";

            if (questionText || answerText) {
                conversationData.push({
                    human: questionText,
                    assistant: answerText
                });
            } else {
                loggerGNLM("Gemini turn yielded no human question or assistant answer.", "warn");
            }
        }

        function extractNotebookLMConversationDataGNLM() {
            const conversationTurns = document.querySelectorAll("div.chat-message-pair");
            let conversationData = [];
            loggerGNLM(\`Found \${conversationTurns.length} conversation turns for NotebookLM.\`);

            conversationTurns.forEach((turnContainer, index) => {
                loggerGNLM(\`Processing NotebookLM turn \${index + 1}\`);
                let questionText = "";
                const userQueryEl = turnContainer.querySelector("chat-message .from-user-container .message-text-content p, chat-message .from-user-container .message-text-content div.ng-star-inserted");
                if (userQueryEl) {
                    questionText = userQueryEl.innerText.trim();
                    loggerGNLM(\`  NotebookLM User query: "\${questionText.substring(0, 50)}..."\`);
                } else {
                    loggerGNLM(\`  NotebookLM User query not found in turn \${index + 1}\`, "warn");
                }

                let answerText = "";
                const modelResponseContent = turnContainer.querySelector("chat-message .to-user-container .message-text-content");
                if (modelResponseContent) {
                    let answerParts = [];
                    const structuralElements = modelResponseContent.querySelectorAll('labs-tailwind-structural-element-view-v2');
                    structuralElements.forEach(structEl => {
                        const textSpans = structEl.querySelectorAll('span[data-start-index].ng-star-inserted');
                        textSpans.forEach(span => {
                            if (!span.closest('button.citation-marker')) { // Exclude citations
                                if (span.closest('.paragraph') || span.closest('.list-item') || span.innerText.length > 1 ) { // Basic filter for meaningful text
                                    answerParts.push(span.innerText.trim());
                                }
                            }
                        });
                    });
                    answerText = answerParts.filter(part => part.length > 0).join(' ').replace(/\\s\\s+/g, ' ').trim(); // Consolidate spacing
                    loggerGNLM(\`  NotebookLM Assistant answer: "\${answerText.substring(0, 100)}..."\`);
                } else {
                    loggerGNLM(\`  NotebookLM Assistant answer container not found in turn \${index + 1}\`, "warn");
                }

                if (questionText || answerText) {
                    conversationData.push({
                        human: questionText,
                        assistant: answerText
                    });
                } else {
                    loggerGNLM(\`NotebookLM turn \${index + 1} did not yield any data.\`, "warn");
                }
            });

            if (conversationData.length === 0) { // Check for initial summary if no chat turns
                const emptyState = document.querySelector('.chat-panel-empty-state');
                if (emptyState) {
                    const titleEl = emptyState.querySelector('h1.notebook-title');
                    const summaryEl = emptyState.querySelector('.summary-content p');
                    if (titleEl && summaryEl) {
                        loggerGNLM('Found NotebookLM initial summary (empty state).');
                        conversationData.push({
                            notebook_title: titleEl.innerText.trim(),
                            notebook_summary: summaryEl.innerText.trim(),
                            type: "notebook_metadata" // Custom type to identify this entry
                        });
                    }
                }
            }
            loggerGNLM(\`NotebookLM conversation extracted: \${conversationData.length} items\`);
            return conversationData;
        }

        async function handleExportToJsonGNLM() {
            loggerGNLM("Export to JSON triggered for Gemini/NotebookLM.");
            const exportButton = document.getElementById(EXPORT_BUTTON_ID_GNLM);
            if (exportButton) exportButton.disabled = true;

            let conversationData = [];
            try {
                if (currentPlatformGNLM === 'gemini') {
                    conversationData = extractGeminiConversationDataGNLM();
                } else if (currentPlatformGNLM === 'notebooklm') {
                    conversationData = extractNotebookLMConversationDataGNLM();
                }

                if (conversationData.length > 0) {
                    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
                    const filename = \`\${currentPlatformGNLM === 'notebooklm' ? 'NotebookLM' : 'Gemini'}_Chat_\${timestamp}.json\`;
                    const jsonData = JSON.stringify(conversationData, null, 2);
                    downloadFileGNLM(jsonData, filename, "application/json;charset=utf-8");
                } else {
                    alert("No conversation content to export. Please ensure the conversation is visible or try scrolling up to load more history.");
                    loggerGNLM("No content to export to JSON.", "warn");
                }
            } catch (error) {
                loggerGNLM(\`Error during export process: \${error.message}\\n\${error.stack}\`, 'error');
                alert(\`An error occurred during export: \${error.message}\`);
            } finally {
                if (exportButton) exportButton.disabled = false;
            }
        }

        function downloadFileGNLM(content, filename, contentType) {
            try {
                const blob = new Blob([content], { type: contentType });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href); // Clean up
                loggerGNLM(\`File "\${filename}" downloaded as \${contentType}.\`);
            } catch (error) {
                loggerGNLM(\`Error during file download: \${error.message}\`, 'error');
                alert(\`Failed to download file. See console for details.\`);
            }
        }

        function initLogicGNLM() {
            loggerGNLM(\`Initializing Gemini/NotebookLM script part logic for \${currentPlatformGNLM}...\`);
            if (!currentPlatformGNLM) {
                loggerGNLM("Platform not identified. Script part will not initialize UI.", "error");
                return;
            }
            injectCustomStyleGNLM();

            const attemptPanelInjectionGNLM = () => {
                if (panelInjectedGNLM || document.getElementById(CONTROL_ID_GNLM)) {
                    if (panelCreationIntervalGNLM) clearInterval(panelCreationIntervalGNLM);
                    if (observerGNLM) observerGNLM.disconnect();
                    return true;
                }

                let readySelector = '';
                if (currentPlatformGNLM === 'gemini') {
                    readySelector = 'main[data-test-id="chat-main-content"], chat-window, div.conversation-container, rich-textarea, mat-sidenav-content';
                } else if (currentPlatformGNLM === 'notebooklm') {
                    readySelector = 'chat-panel, omnibar, .chat-panel-content';
                }

                if (document.body && document.querySelector(readySelector)) {
                    loggerGNLM(\`\${currentPlatformGNLM} UI ready. Attempting to create floating panel.\`);
                    if (createFloatingPanelGNLM()) {
                        if (panelCreationIntervalGNLM) clearInterval(panelCreationIntervalGNLM);
                        if (observerGNLM) observerGNLM.disconnect();
                        return true;
                    }
                }
                return false;
            };

            if (attemptPanelInjectionGNLM()) {
                loggerGNLM("Panel injected on initial try for Gemini/NotebookLM.");
                return;
            }

            loggerGNLM(\`\${currentPlatformGNLM} UI not immediately available. Setting up MutationObserver and interval.\`);
            observerGNLM = new MutationObserver((mutationsList, obs) => {
                if (attemptPanelInjectionGNLM()) {
                    loggerGNLM(\`Panel injected via MutationObserver for \${currentPlatformGNLM}.\`);
                }
            });
            observerGNLM.observe(document.documentElement, { childList: true, subtree: true });

            panelCreationIntervalGNLM = setInterval(() => {
                loggerGNLM(\`Interval check attempt #\${panelCreationAttemptsGNLM + 1} for \${currentPlatformGNLM}\`);
                if (attemptPanelInjectionGNLM() || panelCreationAttemptsGNLM >= MAX_PANEL_CREATION_ATTEMPTS_GNLM) {
                    if (panelCreationIntervalGNLM) clearInterval(panelCreationIntervalGNLM);
                    if (observerGNLM && (panelInjectedGNLM || panelCreationAttemptsGNLM >= MAX_PANEL_CREATION_ATTEMPTS_GNLM)) {
                        observerGNLM.disconnect();
                        if (panelCreationAttemptsGNLM >= MAX_PANEL_CREATION_ATTEMPTS_GNLM && !panelInjectedGNLM) {
                            loggerGNLM(\`Max panel creation attempts (\${MAX_PANEL_CREATION_ATTEMPTS_GNLM}) reached for \${currentPlatformGNLM}. Panel not injected.\`, "error");
                        }
                    }
                }
                panelCreationAttemptsGNLM++;
            }, 500);

            window.addEventListener('beforeunload', () => {
                if (observerGNLM) observerGNLM.disconnect();
                if (panelCreationIntervalGNLM) clearInterval(panelCreationIntervalGNLM);
            });
        }

        // Defer initialization until DOM is ready, as combined script runs at document-start
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(initLogicGNLM, 100); // Short delay if DOM is already somewhat ready
        } else {
            document.addEventListener('DOMContentLoaded', () => setTimeout(initLogicGNLM, 100));
        }
    }

    // Function to encapsulate Script 2 (Claude)
    function runClaudeScript() {
        mainLogger('Claude script part starting setup - invoked by combined script', 'log');

        // --- XHR/Fetch overrides (MUST be active at document-start) ---
        let capturedUserId_claude = '';
        const originalXHROpen_claude = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string') {
                const organizationsMatch = url.match(/api\\/organizations\\/([a-zA-Z0-9-]+)/);
                if (organizationsMatch && organizationsMatch[1]) {
                    capturedUserId_claude = organizationsMatch[1];
                    console.log("✨ [Claude Script] 已捕获用户ID (XHR):", capturedUserId_claude);
                }
            }
            return originalXHROpen_claude.apply(this, arguments);
        };

        const originalFetch_claude = window.fetch;
        window.fetch = function(resource, options) {
            if (typeof resource === 'string') {
                const organizationsMatch = resource.match(/api\\/organizations\\/([a-zA-Z0-9-]+)/);
                if (organizationsMatch && organizationsMatch[1]) {
                    capturedUserId_claude = organizationsMatch[1];
                    console.log("✨ [Claude Script] 已捕获用户ID (Fetch):", capturedUserId_claude);
                }
            }
            return originalFetch_claude.apply(this, arguments);
        };
        // --- End XHR/Fetch overrides ---

        const initClaudeLogic = () => {
            mainLogger('Claude script part initializing UI and DOM listeners...', 'log');

            let isCollapsed_claude = localStorage.getItem('claudeToolCollapsed') === 'true';
            const CLAUDE_CONTROL_ID = "lyra-tool-container-combined"; // Added suffix for clarity
            const CLAUDE_SWITCH_ID = "lyra-tree-mode-combined";
            const CLAUDE_TOGGLE_ID = "lyra-toggle-button-combined";
            const CLAUDE_CHAT_PAGE_REGEX = /\\/chat\\/[a-zA-Z0-9-]+/;


            function injectCustomStyle_Claude() {
                const style = document.createElement('style');
                style.textContent = \`
                  #\${CLAUDE_CONTROL_ID} {
                    position: fixed; right: 10px; bottom: 80px; /* Position for Claude tools */
                    display: flex; flex-direction: column; gap: 8px;
                    z-index: 999999; /* High, but potentially lower than Gemini's if on same page (not the case here) */
                    transition: all 0.3s ease; background: rgba(255, 255, 255, 0.9);
                    border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    padding: 10px; border: 1px solid rgba(77, 171, 154, 0.3); max-width: 200px;
                  }
                  #\${CLAUDE_CONTROL_ID}.collapsed { transform: translateX(calc(100% - 40px)); }
                  #\${CLAUDE_TOGGLE_ID} {
                    position: absolute; left: 0; top: 10px; width: 28px; height: 28px;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: rgba(77, 171, 154, 0.2); color: #4DAB9A; cursor: pointer;
                    border: 1px solid rgba(77, 171, 154, 0.3); transition: all 0.3s;
                    transform: translateX(-50%);
                  }
                  #\${CLAUDE_TOGGLE_ID}:hover { background: rgba(77, 171, 154, 0.3); }
                  .lyra-main-controls { display: flex; flex-direction: column; gap: 8px; padding-left: 15px; }
                  .lyra-button {
                    display: inline-flex; align-items: center; justify-content: center;
                    padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 14px;
                    background-color: rgba(77, 171, 154, 0.1); color: #4DAB9A;
                    border: 1px solid rgba(77, 171, 154, 0.2); transition: all 0.3s; text-align: left;
                  }
                  .lyra-button:hover { background-color: rgba(77, 171, 154, 0.2); }
                  .lyra-toggle { display: flex; align-items: center; font-size: 13px; margin-bottom: 5px; }
                  .lyra-switch { position: relative; display: inline-block; width: 32px; height: 16px; margin: 0 5px; }
                  .lyra-switch input { opacity: 0; width: 0; height: 0; }
                  .lyra-slider {
                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #ccc; transition: .4s; border-radius: 34px;
                  }
                  .lyra-slider:before {
                    position: absolute; content: ""; height: 12px; width: 12px;
                    left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%;
                  }
                  input:checked + .lyra-slider { background-color: #4DAB9A; }
                  input:checked + .lyra-slider:before { transform: translateX(16px); }
                  .lyra-toast {
                    position: fixed; bottom: 60px; right: 20px; background-color: #323232;
                    color: white; padding: 8px 12px; border-radius: 6px; z-index: 1000000;
                    opacity: 0; transition: opacity 0.3s ease-in-out; font-size: 13px;
                  }
                  .lyra-title { font-size: 12px; font-weight: 500; color: #4DAB9A; margin-bottom: 5px; text-align: center; }
                  .lyra-loading {
                    display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(77, 171, 154, 0.3);
                    border-radius: 50%; border-top-color: #4DAB9A; animation: lyra-spin 1s linear infinite; margin-right: 8px;
                  }
                  @keyframes lyra-spin { to { transform: rotate(360deg); } }
                  .lyra-progress { font-size: 12px; color: #4DAB9A; margin-top: 5px; text-align: center; }
                \`;
                document.head.appendChild(style);
                mainLogger('Custom styles injected for Claude script part.', 'log');
            }

            function showToast_Claude(message, duration = 2000) {
                let toast = document.querySelector(".lyra-toast");
                if (!toast) {
                    toast = document.createElement("div");
                    toast.className = "lyra-toast";
                    document.body.appendChild(toast);
                }
                toast.textContent = message;
                toast.style.opacity = "1";
                setTimeout(() => { toast.style.opacity = "0"; }, duration);
            }

            function getCurrentChatUUID_Claude() {
                const url = window.location.href;
                const match = url.match(CLAUDE_CHAT_PAGE_REGEX);
                return match ? match[1] : null;
            }

            function checkUrlForTreeMode_Claude() {
                return window.location.href.includes('?tree=True&rendering_mode=messages&render_all_tools=true') ||
                       window.location.href.includes('&tree=True&rendering_mode=messages&render_all_tools=true');
            }

            function toggleCollapsed_Claude() {
                const container = document.getElementById(CLAUDE_CONTROL_ID);
                const toggleButton = document.getElementById(CLAUDE_TOGGLE_ID); // Get toggle button to update its icon
                if (container && toggleButton) {
                    isCollapsed_claude = !isCollapsed_claude;
                    container.classList.toggle('collapsed', isCollapsed_claude);
                     toggleButton.innerHTML = isCollapsed_claude ?
                        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' :
                        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
                    localStorage.setItem('claudeToolCollapsed', isCollapsed_claude.toString());
                }
            }

            function sleep_Claude(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

            async function getAllConversations_Claude() {
                if (!capturedUserId_claude) {
                    showToast_Claude("未能请求用户ID，请刷新页面或进行一些操作");
                    return null;
                }
                try {
                    const apiUrl = \`https://claude.ai/api/organizations/\${capturedUserId_claude}/chat_conversations\`;
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(\`请求失败: \${response.status}\`);
                    return await response.json();
                } catch (error) {
                    console.error("[Claude Script] 获取对话列表失败:", error);
                    showToast_Claude("获取对话列表失败: " + error.message);
                    return null;
                }
            }

            async function getConversationDetails_Claude(uuid, treeMode = false) {
                if (!capturedUserId_claude) {
                     showToast_Claude("未能请求用户ID以获取对话详情。"); return null;
                }
                try {
                    const apiUrl = \`https://claude.ai/api/organizations/\${capturedUserId_claude}/chat_conversations/\${uuid}\${treeMode ? '?tree=True&rendering_mode=messages&render_all_tools=true' : ''}\`;
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(\`请求失败: \${response.status}\`);
                    return await response.json();
                } catch (error) {
                    console.error(\`[Claude Script] 获取对话 \${uuid} 详情失败:\`, error);
                    // Don't show toast here, let caller decide or log
                    return null;
                }
            }

            function createUUIDControls_Claude() {
                if (document.getElementById(CLAUDE_CONTROL_ID)) return; // Already exists

                const container = document.createElement('div');
                container.id = CLAUDE_CONTROL_ID;
                if(isCollapsed_claude) container.classList.add('collapsed');

                const toggleButton = document.createElement('div');
                toggleButton.id = CLAUDE_TOGGLE_ID;
                toggleButton.innerHTML = isCollapsed_claude ?
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' :
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
                toggleButton.addEventListener('click', toggleCollapsed_Claude);
                container.appendChild(toggleButton);

                const controlsArea = document.createElement('div');
                controlsArea.className = 'lyra-main-controls';

                const title = document.createElement('div');
                title.className = 'lyra-title';
                title.textContent = 'Claude Tools'; // Simplified title
                controlsArea.appendChild(title);

                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'lyra-toggle';
                toggleContainer.innerHTML = \`
                  <span>&nbsp;&nbsp; 树形(多分支)模式</span>
                  <label class="lyra-switch">
                    <input type="checkbox" id="\${CLAUDE_SWITCH_ID}" \${checkUrlForTreeMode_Claude() ? 'checked' : ''}>
                    <span class="lyra-slider"></span>
                  </label>\`;
                controlsArea.appendChild(toggleContainer);

                const uuidButton = document.createElement('button');
                uuidButton.className = 'lyra-button';
                uuidButton.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" style="margin-right: 8px;"><path d="M128,128a32,32,0,1,0,32,32A32,32,0,0,0,128,128Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,128,176ZM128,80a32,32,0,1,0-32-32A32,32,0,0,0,128,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,128,32Z"/><path d="M192,144a32,32,0,1,0,32,32A32,32,0,0,0,192,144Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,192,192Z"/><path d="M192,128a32,32,0,1,0-32-32A32,32,0,0,0,192,128Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,192,80Z"/><path d="M64,144a32,32,0,1,0,32,32A32,32,0,0,0,64,144Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,64,192Z"/><path d="M64,128a32,32,0,1,0-32-32A32,32,0,0,0,64,128Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,64,80Z"/></svg> 获取对话UUID\`;
                uuidButton.addEventListener('click', () => {
                    const uuid = getCurrentChatUUID_Claude();
                    if (uuid) {
                        if (!capturedUserId_claude) { showToast_Claude("未能请求用户ID，请刷新页面或进行一些操作"); return; }
                        navigator.clipboard.writeText(uuid)
                            .then(() => showToast_Claude("UUID已复制！"))
                            .catch(err => { console.error("[Claude Script] 复制失败:", err); showToast_Claude("复制失败"); });
                        const treeMode = document.getElementById(CLAUDE_SWITCH_ID).checked;
                        const jumpUrl = \`https://claude.ai/api/organizations/\${capturedUserId_claude}/chat_conversations/\${uuid}\${treeMode ? '?tree=True&rendering_mode=messages&render_all_tools=true' : ''}\`;
                        window.open(jumpUrl, "_blank");
                    } else { showToast_Claude("未找到UUID！"); }
                });
                controlsArea.appendChild(uuidButton);

                const downloadJsonButton = document.createElement('button');
                downloadJsonButton.className = 'lyra-button';
                downloadJsonButton.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" style="margin-right: 8px;"><path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z"></path></svg> 导出对话JSON\`;
                downloadJsonButton.addEventListener('click', async () => {
                    const uuid = getCurrentChatUUID_Claude();
                    if (uuid) {
                        if (!capturedUserId_claude) { showToast_Claude("未能请求用户ID，请刷新页面或进行一些操作"); return; }
                        showToast_Claude("正在获取数据...");
                        try {
                            const treeMode = document.getElementById(CLAUDE_SWITCH_ID).checked;
                            const data = await getConversationDetails_Claude(uuid, treeMode);
                            if (!data) throw new Error(\`获取对话 \${uuid} 详情失败\`);
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = \`claude_\${uuid.substring(0, 8)}_\${new Date().toISOString().slice(0,10)}.json\`;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                            showToast_Claude("JSON导出成功！");
                        } catch (error) { console.error("[Claude Script] 导出失败:", error); showToast_Claude("导出失败: " + error.message); }
                    } else { showToast_Claude("未找到对话UUID！"); }
                });
                controlsArea.appendChild(downloadJsonButton);

                const downloadAllButton = document.createElement('button');
                downloadAllButton.className = 'lyra-button';
                downloadAllButton.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" style="margin-right: 8px;"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-42.34-77.66a8,8,0,0,1-11.32,11.32L136,139.31V184a8,8,0,0,1-16,0V139.31l-10.34,10.35a8,8,0,0,1-11.32-11.32l24-24a8,8,0,0,1,11.32,0Z"></path></svg> 导出所有对话\`;
                downloadAllButton.addEventListener('click', async () => {
                    if (!capturedUserId_claude) { showToast_Claude("未能请求用户ID，请刷新页面或进行一些操作"); return; }
                    const progressElem = document.createElement('div');
                    progressElem.className = 'lyra-progress'; progressElem.textContent = '准备中...';
                    controlsArea.appendChild(progressElem);
                    const originalButtonContent = downloadAllButton.innerHTML;
                    downloadAllButton.innerHTML = '<div class="lyra-loading"></div>导出中...'; downloadAllButton.disabled = true;
                    try {
                        showToast_Claude("正在获取所有对话列表...", 3000);
                        const allConversations = await getAllConversations_Claude();
                        if (!allConversations || !Array.isArray(allConversations)) throw new Error("无法获取对话列表");
                        const result = { exportedAt: new Date().toISOString(), totalConversations: allConversations.length, conversations: [] };
                        const treeMode = document.getElementById(CLAUDE_SWITCH_ID).checked;
                        for (let i = 0; i < allConversations.length; i++) {
                            const conversation = allConversations[i];
                            progressElem.textContent = \`获取对话 \${i+1}/\${allConversations.length}\`;
                            if (i > 0) await sleep_Claude(500); // Rate limit
                            const details = await getConversationDetails_Claude(conversation.uuid, treeMode);
                            if (details) result.conversations.push(details);
                            else console.warn(\`[Claude Script] 跳过无法获取的对话: \${conversation.uuid}\`);
                        }
                        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url;
                        a.download = \`claude_all_conversations_\${new Date().toISOString().slice(0,10)}.json\`;
                        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                        showToast_Claude(\`成功导出 \${result.conversations.length} 个对话！\`);
                    } catch (error) { console.error("[Claude Script] 导出所有对话失败:", error); showToast_Claude("导出失败: " + error.message);
                    } finally {
                        downloadAllButton.innerHTML = originalButtonContent; downloadAllButton.disabled = false;
                        if (progressElem && progressElem.parentNode) progressElem.parentNode.removeChild(progressElem);
                    }
                });
                controlsArea.appendChild(downloadAllButton);

                container.appendChild(controlsArea);
                document.body.appendChild(container);
                mainLogger("Claude tools UI created.");
            }

            // --- Claude script's initialization logic (DOM dependent) ---
            injectCustomStyle_Claude();

            // Initial creation of controls if on a chat page
            setTimeout(() => {
                if (CLAUDE_CHAT_PAGE_REGEX.test(window.location.href)) {
                    createUUIDControls_Claude();
                }
            }, 1000); // Original delay

            // Observer for SPA navigation
            let lastUrl_Claude = window.location.href;
            const observer_Claude = new MutationObserver(() => {
                if (window.location.href !== lastUrl_Claude) {
                    lastUrl_Claude = window.location.href;
                    mainLogger(\`Claude script: URL changed to \${lastUrl_Claude}\`);
                    setTimeout(() => {
                        const existingControls = document.getElementById(CLAUDE_CONTROL_ID);
                        if (CLAUDE_CHAT_PAGE_REGEX.test(lastUrl_Claude)) {
                            if (!existingControls) {
                                createUUIDControls_Claude();
                            } else { // If controls exist, ensure tree mode switch is updated
                                const switchEl = document.getElementById(CLAUDE_SWITCH_ID);
                                if (switchEl) switchEl.checked = checkUrlForTreeMode_Claude();
                            }
                        } else {
                            if (existingControls) {
                                existingControls.remove();
                                mainLogger("Claude tools UI removed due to navigation.");
                            }
                        }
                    }, 500); // Delay for UI update on nav
                }
            });
            observer_Claude.observe(document.documentElement, { childList: true, subtree: true });
        };

        // Defer DOM-dependent logic until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initClaudeLogic);
        } else {
            initClaudeLogic();
        }
    }

    // --- Main conditional execution ---
    const currentHostname = window.location.hostname;
    if (currentHostname.includes('gemini.google.com') || currentHostname.includes('notebooklm.google.com')) {
        mainLogger('Executing Gemini/NotebookLM script part...');
        runGeminiNotebookLMScript();
    } else if (currentHostname.includes('claude.ai')) {
        mainLogger('Executing Claude script part...');
        runClaudeScript();
    } else {
        mainLogger('No matching platform for combined script on this page.');
    }

})();`;

export default fetcherScript;