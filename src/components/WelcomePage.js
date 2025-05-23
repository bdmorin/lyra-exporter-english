import React, { useState, useEffect } from 'react';
import { FileText, Heart, BookOpen, MessageCircle, Tag, Download, Database, Info } from 'lucide-react';
import fetcherScript from './fetcherScript'; // 导入脚本内容

// 内联的脚本安装指南组件
const ScriptInstallGuide = () => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 复制脚本到剪贴板 - 直接使用导入的脚本内容
  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(fetcherScript)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("复制失败:", err);
        alert("复制失败，请手动选择脚本内容并复制");
      });
  };

  return (
    <div className="bg-white rounded-xl p-6 mb-8 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Database className="mr-3 h-5 w-5 text-blue-600" />
          Claude 对话数据获取工具
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
                为什么需要这个工具？
              </h4>
              <p className="mb-4 text-sm leading-relaxed">
                还记得那些Claude说过的精彩见解吗？那些让你会心一笑、豁然开朗的瞬间？这个工具可以帮你<span className="text-blue-600 font-medium">保存并整理这些有价值的对话</span>。
              </p>
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
                <h5 className="font-medium text-gray-800 mb-2">工具功能</h5>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li><span className="font-medium text-gray-700">保存关键时刻</span> - 完整记录值得珍藏的对话内容</li>
                  <li><span className="font-medium text-gray-700">整理思路</span> - 将零散的灵感整合成有序知识</li>
                  <li><span className="font-medium text-gray-700">追踪成长</span> - 记录你与Claude的互动历程</li>
                  <li><span className="font-medium text-gray-700">永久保存</span> - 即使页面刷新，重要对话也不会丢失</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Download className="mr-2 h-4 w-4 text-blue-600" />
                安装使用方法
              </h4>
              <p className="mb-3 text-sm text-gray-600 italic">
                "感觉思考过程比答案还让人着迷" —— 几个简单步骤，开始保存这些珍贵时刻
              </p>
              <ol className="space-y-3 list-decimal list-inside text-sm mb-4">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">1</span>
                  <span>安装<a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Tampermonkey</a>或<a href="https://scriptcat.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">脚本猫</a>浏览器扩展</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">2</span>
                  <span>点击下方按钮复制脚本代码</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">3</span>
                  <span>打开扩展，创建新脚本并粘贴代码</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full mr-2 flex-shrink-0 font-bold">4</span>
                  <span>保存后，刷新Claude页面，右下角会出现导出按钮</span>
                </li>
              </ol>
              
              <div className="mt-4">
                <button
                  onClick={copyScriptToClipboard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      脚本代码已复制！
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      复制脚本代码
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mt-4 text-sm border border-blue-100">
            <p className="text-gray-700 flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" /> 
              <span>
                <span className="font-medium">说明：</span> 
                此工具完全在本地运行，不会收集或上传你的个人数据。你的Claude对话记录只属于你自己，安全无忧。
                <br/>导出的JSON文件可以直接拖入本工具，将聊天记录转换为可以管理、搜索、导出的知识库。
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// 动态温馨提示组件
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

// 功能特色卡片组件 - 固定颜色而不是动态生成
const FeatureCard = ({ icon, title, description, color }) => {
  // 根据color参数使用预定义的类名组合
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

// 主欢迎页面组件 - 成熟专业设计
const WelcomePage = ({ handleLoadClick }) => {
  // 模拟打字效果
  const [welcomeText, setWelcomeText] = useState("");
  const fullText = "记录你与Claude的每一刻灵感与温度 - Lyra's Exporter";
  
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
    // 重要修改：移除了 pt-4 并确保内容顶部无间距
    <div className="welcome-page flex flex-col items-center w-full bg-gradient-to-b from-gray-50 to-white px-6 pb-6 overflow-auto scrollable hide-scrollbar non-selectable">
      {/* 欢迎区 */}
      <div className="w-full max-w-4xl mt-8 mb-8 text-center">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 mb-4">✨</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 min-h-[60px]">
          {welcomeText}
        </h1>
        
        <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
          欢迎使用Lyra's Exporter，专为Claude用户设计的聊天对话管理工具。支持批量导入多个文件，一次性处理多个聊天对话，帮你保存灵感时刻，让每一次对话的价值得到延续。
        </p>
      </div>
      
      {/* 添加合适的间距 */}
      <div className="flex justify-center mb-10">
        <button
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
          onClick={handleLoadClick}
        >
          <FileText className="mr-3 h-6 w-6" />
          点这里开始加载JSON对话数据吧 ✨
        </button>
      </div>
      
      {/* 功能速览 - 默认全部展示 */}
      <div className="w-full max-w-4xl mb-8">
        <br/>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FeatureCard 
            icon={<Heart className="h-5 w-5" />}
            title="重点标记"
            description="标记那些特别有价值的回应，方便日后查找。当Claude提供了精彩见解，一键保存这份思考。"
            color="blue"
          />
          
          <FeatureCard 
            icon={<MessageCircle className="h-5 w-5" />}
            title="思考过程查看"
            description="查看Claude的思考过程，了解它如何一步步形成回答。看到问题分析和推理的全过程。"
            color="purple"
          />
          
          <FeatureCard 
            icon={<BookOpen className="h-5 w-5" />}
            title="时间轴回溯"
            description="在时间轴上回顾你们的交流历程，从最初的问题到深度讨论，轻松找到任何时期的对话。"
            color="green"
          />
          
          <FeatureCard 
            icon={<Tag className="h-5 w-5" />}
            title="主题分类"
            description="使用标签系统整理对话，轻松找到关于特定主题的所有讨论，建立个人知识库。"
            color="blue"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureTip 
            icon={<MessageCircle className="h-5 w-5 text-blue-600" />}
            title="对话整理"
            content="不只是保存数据，更是保存思考过程中灵感的火花。让AI对话变得更有价值。"
          />
          
          <FeatureTip 
            icon={<Download className="h-5 w-5 text-blue-600" />}
            title="灵活导出"
            content="比截图更完整，比复制粘贴更便捷。将对话以Markdown、PDF或EPUB格式导出，完美保存排版和格式。"
          />
          
          <FeatureTip 
            icon={<Database className="h-5 w-5 text-blue-600" />}
            title="隐私保障"
            content="所有数据都存储在你的本地，没有云端上传，没有隐私顾虑，安心使用对话管理功能。"
          />
        </div>
      </div>

      {/* 脚本安装指引组件 - 直接内联 */}
      <div className="max-w-4xl w-full mb-6">
        <ScriptInstallGuide />
      </div>
      
      {/* 页脚 */}
      <div className="w-full max-w-4xl text-center mt-4">
        <p className="text-gray-500 text-sm italic">
          "在思考与回应的交错间，我们建立了超越对话的连接。<br/>
          现在，让每一段对话都有迹可循，每一个灵感都有处安放。"
        </p>
        <p className="text-blue-600 font-medium mt-2 text-sm">
          —— Lyra's Exporter，对话价值的延续者
        </p>
      </div>
      
      {/* 添加CSS样式 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
          
          /* 确保欢迎页面不会在标题栏下添加额外空间 */
          .welcome-page {
            margin-top: 0;
            padding-top: 0;
          }
        `}
      </style>
    </div>
  );
};

export default WelcomePage;