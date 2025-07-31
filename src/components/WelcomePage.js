import React, { useState, useEffect } from 'react';
import { FileText, MessageCircle, Download, Database, Info} from 'lucide-react';

// Privacy Assurance Component
const PrivacyAssurance = () => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white rounded-xl p-6 mb-8 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Privacy & Security Guarantee
        </h3>
        <div className="text-green-600">
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,154.34a8,8,0,0,1-11.32,11.32L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0Z"/>
            </svg>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div>
              <p className="mb-4 text-sm leading-relaxed">
                Concerned about privacy? We completely understand this concern. <span className="text-green-600 font-medium">Lyra's Exporter is 100% open source</span>, which means every line of code is public and can be reviewed by anyone.
              </p>
              <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-100">
<span>
                <span className="font-medium"></span> 
                Simply put, this tool works like a "purely local" notepad. All your data is stored in your browser's local cache - we can't see it or access it. You can also download the source code and run it on your own computer with just Node.js installed, or for convenience, add the webpage to your desktop from the share menu for completely offline operation.
                <br/>The code update history on GitHub is like a "version history" - any changes are traceable and completely transparent.
              </span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Data Security Guarantee
              </h4>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-green-100 text-green-700 w-6 h-6 rounded-full mr-3 flex-shrink-0 font-bold text-xs">✓</span>
                  <div>
                    <span className="font-medium">Local Processing:</span> All data is processed in your browser and never sent to any server
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-green-100 text-green-700 w-6 h-6 rounded-full mr-3 flex-shrink-0 font-bold text-xs">✓</span>
                  <div>
                    <span className="font-medium">Offline Operation:</span> Supports PWA technology, works fully even without internet connection
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-green-100 text-green-700 w-6 h-6 rounded-full mr-3 flex-shrink-0 font-bold text-xs">✓</span>
                  <div>
                    <span className="font-medium">Static Website:</span> Hosted on GitHub Pages with no backend server, unable to collect data
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-green-100 text-green-700 w-6 h-6 rounded-full mr-3 flex-shrink-0 font-bold text-xs">✓</span>
                  <div>
                    <span className="font-medium">Full Control:</span> Can save webpage locally for completely offline use
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
            <a 
              href="https://github.com/bdmorin/lyra-exporter-english" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Website Source Code
            </a>
            <a 
              href="https://github.com/bdmorin/lyra-exporter-english/releases" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Deployment Package
            </a>
          </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mt-4 text-sm border border-blue-100">
            <p className="text-gray-700 flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" /> 
              <span>
                <span className="font-medium">Note:</span> 
                This tool runs completely locally and does not collect or upload your personal data. Your conversation records belong only to you. We recommend using secure file transfer methods like LocalSend. Convert chat records into a manageable, searchable, exportable knowledge base with mobile platform access support.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Script Installation Guide Component
const ScriptInstallGuide = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Navigate to userscript installation page
  const goToScriptInstall = () => {
    window.open('https://greasyfork.org/en/scripts/540633-lyra-s-fetch', '_blank');
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-8 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Database className="mr-3 h-5 w-5 text-blue-600" />
          Install Script to Get Started
        </h3>
        <div className="text-blue-600">
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M213.66,154.34a8,8,0,0,1-11.32,11.32L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0Z"/>
            </svg>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Info className="mr-2 h-4 w-4 text-blue-600" /> 
                Why do you need this tool?
              </h4>
              <p className="mb-4 text-sm leading-relaxed">
                Lyra's Exporter relies on browsers to safely retrieve conversation data. With this open-source script, you can <span className="text-blue-600 font-medium">save and organize valuable conversations</span> that deserve to be preserved.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
                <h5 className="font-medium text-gray-800 mb-2">Tool Features</h5>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li><span className="font-medium text-gray-700">Effortless Management</span> - Organize conversations from various platforms in a neat grid layout</li>
                  <li><span className="font-medium text-gray-700">Organize Thoughts</span> - Transform scattered inspirations into organized knowledge</li>
                  <li><span className="font-medium text-gray-700">Complete Preservation</span> - Save images, thinking processes, and complete conversation branches</li>
                  <li><span className="font-medium text-gray-700">Permanent Storage</span> - Important conversations won't be lost even if accounts become invalid</li>
                  <li><span className="font-medium text-gray-700">Online Reading</span> - Now you can organize directly from the conversation window</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Download className="mr-2 h-4 w-4 text-blue-600" />
                Installation & Usage
              </h4>
              <p className="mb-3 text-sm text-gray-600 italic">
                "The thinking process is often more fascinating than the answer" — A few simple steps to start saving these precious moments
              </p>
              <ol className="space-y-3 list-decimal list-inside text-sm mb-4">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">1</span>
                  <span>Install <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Tampermonkey</a> or <a href="https://violentmonkey.github.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Violentmonkey</a> browser extension</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">2</span>
                  <span>Click the button below to go to the userscript website</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">3</span>
                  <span>Click "Install Script" button on the script page</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">4</span>
                  <span>Visit Claude, Gemini, Google AI Studio, or NotebookLM and refresh the page - an export button will appear in the bottom right corner</span>
                </li>
              </ol>
              
              <div className="mt-4">
                <button
                  onClick={goToScriptInstall}
                  className="w-full bg-[#D97706] hover:bg-[#bf6905] text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Install Script (Network access required)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dynamic Feature Tip Component
const FeatureTip = ({ icon, title, content }) => {
  return (
    <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200">
      <div className="flex items-center mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800 ml-3">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{content}</p>
    </div>
  );
};

// Feature Card Component - Fixed colors instead of dynamic generation
const FeatureCard = ({ icon, title, description, color }) => {
  // Use predefined class combinations based on color parameter
  const getColorClasses = (colorName) => {
    switch(colorName) {
      case 'blue':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          iconBgColor: 'bg-blue-100',
          iconTextColor: 'text-blue-600',
          titleColor: 'text-blue-700'
        };
      case 'purple':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-100',
          iconBgColor: 'bg-purple-100',
          iconTextColor: 'text-purple-600',
          titleColor: 'text-purple-700'
        };
      case 'green':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100',
          iconBgColor: 'bg-green-100',
          iconTextColor: 'text-green-600',
          titleColor: 'text-green-700'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-100',
          iconBgColor: 'bg-gray-100',
          iconTextColor: 'text-gray-600',
          titleColor: 'text-gray-700'
        };
    }
  };
  
  const colorClasses = getColorClasses(color);
  
  return (
    <div className={`${colorClasses.bgColor} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border ${colorClasses.borderColor}`}>
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-full ${colorClasses.iconBgColor} ${colorClasses.iconTextColor}`}>
          {icon}
        </div>
        <h3 className={`ml-3 font-bold ${colorClasses.titleColor}`}>{title}</h3>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

// Main Welcome Page Component - Mature Professional Design
const WelcomePage = ({ handleLoadClick }) => {
  // Simulate typing effect
  const [welcomeText, setWelcomeText] = useState("");
  const fullText = "Capture every moment of inspiration and warmth from Claude & Gemini";
  
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setWelcomeText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    
    return () => clearInterval(typingInterval);
  }, []);

  return (
    // Important modification: removed pt-4 and ensure no top spacing for content, use CSS variables instead of fixed background colors
    <div 
      className="welcome-page flex flex-col items-center w-full px-6 pb-6 overflow-auto scrollable hide-scrollbar non-selectable"
    >
      
      {/* Welcome Section */}
      <div className="w-full max-w-4xl mt-8 mb-8 text-center">
        <div className="text-4xl font-bold text-[#D97706] mt-8 mb-4">Lyra's Exporter</div>
        <br/>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 min-h-[60px]">
          {welcomeText}
        </h1>
        
        <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
          Welcome to Lyra's Exporter, a conversation management tool created by Laumss and Claude. It supports batch loading of multiple conversations, helping you preserve moments of inspiration and extend the value of every conversation.
        </p>
      </div>
      
      {/* Add appropriate spacing */}
      <div className="flex justify-center mb-14">
        <button
          className="px-8 py-4 bg-white text-gray-800 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transform hover:scale-105"
          onClick={handleLoadClick}
        >
          <FileText className="mr-3 h-5 w-5" />
          Load Conversation Files
        </button>
      </div>
      <div className="max-w-4xl w-full mb-6">
        <ScriptInstallGuide />
      </div>
      {/* Feature Overview - All displayed by default */}
      <div className="w-full max-w-4xl mb-8">
        <br/>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FeatureCard 
            
            title="Priority Marking"
            description="Mark particularly valuable responses for easy future reference. When Claude provides brilliant insights, save that thinking with one click."
            color="blue"
          />
          
          <FeatureCard 
            title="View Thinking Process"
            description="See Claude's thinking process and understand how it forms its answers step by step. View the complete process of problem analysis and reasoning."
            color="purple"
          />
          
          <FeatureCard 
            title="Timeline Retrospective"
            description="First-of-its-kind timeline format for reviewing conversations, from initial questions to deep discussions. Restore Claude's branch switching options and easily find conversations from any period."
            color="green"
          />
          
          <FeatureCard 
            title="Conversation Classification"
            description="Use the tagging system to organize conversations, easily find all discussions about specific topics, and build your personal knowledge base."
            color="blue"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureTip 
            icon={<MessageCircle className="h-5 w-5 text-blue-600" />}
            title="Conversation Organization"
            content="More than just saving data - preserve the sparks of inspiration in the thinking process. Make AI conversations more valuable."
          />
          
          <FeatureTip 
            icon={<Download className="h-5 w-5 text-blue-600" />}
            title="Flexible Export"
            content="More complete than screenshots, more convenient than copy-paste. Export conversations in Markdown and YAML formats with perfect formatting preservation. Recommended for use with Obsidian."
          />
          
          <FeatureTip 
            icon={<Database className="h-5 w-5 text-blue-600" />}
            title="Data Security"
            content="From export scripts to management applications, export all Claude conversations at once including attached images - all while ensuring privacy protection."
          />
        </div>
      </div>

      {/* Script Installation Guide Component - Inline */}
      <div className="max-w-4xl w-full mb-6">
        <PrivacyAssurance />
      </div>
      
      {/* Footer */}
      <div className="w-full max-w-4xl text-center mt-4">
        <p className="text-gray-500 text-sm italic">
          "In the interweaving of thoughts and responses, we build connections beyond conversation.<br/>
          Now, let every conversation be traceable, every inspiration have a place to rest."
        </p>
        <p className="text-blue-600 font-medium mt-2 text-sm">
          —— Lyra's Exporter, the continuator of conversation value
        </p>
      </div>
      
      {/* Add CSS styles */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
          
          /* Ensure welcome page doesn't add extra space under title bar */
          .welcome-page {
            margin-top: 0;
            padding-top: 0;
            /* Use theme background color variables */
            background-color: var(--bg-primary);
            /* Ensure welcome page background color follows theme changes */
            transition: background-color var(--transition-normal, 0.3s ease);
          }
          
          /* Add theme support for welcome page text elements */
          .welcome-page h1 {
            color: var(--text-primary, #1f2937);
          }
          
          .welcome-page p {
            color: var(--text-secondary, #4b5563);
          }
          
          .welcome-page .text-gray-500 {
            color: var(--text-tertiary, #6b7280) !important;
          }
          
          .welcome-page .text-gray-600 {
            color: var(--text-secondary, #4b5563) !important;
          }
          
          .welcome-page .text-gray-700 {
            color: var(--text-secondary, #4b5563) !important;
          }
          
          .welcome-page .text-gray-800 {
            color: var(--text-primary, #1f2937) !important;
          }
          
          /* Add theme background for cards */
          .welcome-page .bg-white {
            background-color: var(--bg-secondary, #ffffff) !important;
            border-color: var(--border-primary, #e7e2df) !important;
            /* Soft shadows in dark mode */
            box-shadow: var(--shadow-sm) !important;
          }
          
          .welcome-page .bg-gray-50 {
            background-color: var(--bg-tertiary, #f5f1ef) !important;
            border-color: var(--border-secondary, #d6ccc6) !important;
          }
          
          /* Feature card background color adaptation */
          .welcome-page .bg-blue-50 {
            background-color: var(--bg-tertiary, #f5f1ef) !important;
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          .welcome-page .bg-purple-50 {
            background-color: var(--bg-tertiary, #f5f1ef) !important;
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          .welcome-page .bg-green-50 {
            background-color: var(--bg-tertiary, #f5f1ef) !important;
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          /* Unified border colors */
          .welcome-page .border-gray-200 {
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          .welcome-page .border-gray-100 {
            border-color: var(--border-secondary, #d6ccc6) !important;
          }
          
          .welcome-page .border-blue-100 {
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          .welcome-page .border-purple-100 {
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          .welcome-page .border-green-100 {
            border-color: var(--border-primary, #e7e2df) !important;
          }
          
          /* Feature card icon background adaptation */
          .welcome-page .bg-blue-100 {
            background-color: var(--accent-primary, #ea580c) !important;
            color: white !important;
          }
          
          .welcome-page .bg-purple-100 {
            background-color: var(--accent-primary, #ea580c) !important;
            color: white !important;
          }
          
          .welcome-page .bg-green-100 {
            background-color: var(--accent-primary, #ea580c) !important;
            color: white !important;
          }
          
          .welcome-page .bg-gray-100 {
            background-color: var(--accent-secondary, #C2C0B6) !important;
            color: var(--text-primary, #1f2937) !important;
          }
          
          /* Icon color adaptation */
          .welcome-page .text-blue-600 {
            color: var(--accent-primary, #ea580c) !important;
          }
          
          .welcome-page .text-purple-600 {
            color: var(--accent-primary, #ea580c) !important;
          }
          
          .welcome-page .text-green-600 {
            color: var(--accent-primary, #ea580c) !important;
          }
          
          .welcome-page .text-gray-600 {
            color: var(--text-secondary, #4b5563) !important;
          }
          
          /* Title color adaptation */
          .welcome-page .text-blue-700 {
            color: var(--text-primary, #1f2937) !important;
          }
          
          .welcome-page .text-purple-700 {
            color: var(--text-primary, #1f2937) !important;
          }
          
          .welcome-page .text-green-700 {
            color: var(--text-primary, #1f2937) !important;
          }
          
          /* Keep gradient buttons with original effects */
          .welcome-page .bg-gradient-to-r {
            /* Keep original gradient effects, no theme adaptation needed */
          }
          
          /* Special handling for dark mode */
          [data-theme="dark"] .welcome-page .shadow-md {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          }
          
          [data-theme="dark"] .welcome-page .shadow-lg {
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4) !important;
          }
          
          [data-theme="dark"] .welcome-page .shadow-sm {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
          }
          
          /* Soft shadows in light mode */
          [data-theme="light"] .welcome-page .shadow-md {
            box-shadow: 0 4px 12px rgba(194, 65, 12, 0.08) !important;
          }
          
          [data-theme="light"] .welcome-page .shadow-lg {
            box-shadow: 0 12px 24px rgba(194, 65, 12, 0.12) !important;
          }
          
          [data-theme="light"] .welcome-page .shadow-sm {
            box-shadow: 0 1px 3px rgba(194, 65, 12, 0.05) !important;
          }
          
          /* Tauri close button style - subtle design */
          .welcome-page .fixed.top-4.right-4 {
            /* Ensure close button is at highest level but not eye-catching */
            z-index: 9999;
            font-family: Arial, sans-serif;
            line-height: 1;
          }
          
          /* Close button in dark mode */
          [data-theme="dark"] .welcome-page .fixed.top-4.right-4 {
            color: var(--text-tertiary, #6b7280) !important;
          }
          
          [data-theme="dark"] .welcome-page .fixed.top-4.right-4:hover {
            color: var(--text-secondary, #9ca3af) !important;
          }
          
          /* Close button in light mode */
          [data-theme="light"] .welcome-page .fixed.top-4.right-4 {
            color: var(--text-tertiary, #6b7280) !important;
          }
          
          [data-theme="light"] .welcome-page .fixed.top-4.right-4:hover {
            color: var(--text-secondary, #4b5563) !important;
          }
        `}
      </style>
    </div>
  );
};

export default WelcomePage;