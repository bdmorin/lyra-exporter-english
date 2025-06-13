// components/BranchSwitcher.js - 修复版本
import React, { useState } from 'react';
import '../styles/BranchSwitcher.css';

const BranchSwitcher = ({ 
  branchPoint, 
  availableBranches, 
  currentBranchIndex, 
  onBranchChange,
  onShowAllBranches,
  showAllMode = false,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [switchAnimation, setSwitchAnimation] = useState(false);

  // 当前分支信息
  const currentBranch = availableBranches[currentBranchIndex];
  const hasPrevious = currentBranchIndex > 0;
  const hasNext = currentBranchIndex < availableBranches.length - 1;

  // 切换到上一个分支
  const handlePrevious = () => {
    if (hasPrevious) {
      setSwitchAnimation(true);
      setTimeout(() => {
        onBranchChange(currentBranchIndex - 1);
        setSwitchAnimation(false);
      }, 150);
    }
  };

  // 切换到下一个分支
  const handleNext = () => {
    if (hasNext) {
      setSwitchAnimation(true);
      setTimeout(() => {
        onBranchChange(currentBranchIndex + 1);
        setSwitchAnimation(false);
      }, 150);
    }
  };

  // 直接跳转到指定分支
  const handleDirectSwitch = (index) => {
    if (index !== currentBranchIndex) {
      setSwitchAnimation(true);
      setTimeout(() => {
        onBranchChange(index);
        setSwitchAnimation(false);
        setIsExpanded(false);
      }, 150);
    }
  };

  // 获取分支显示名称
  const getBranchDisplayName = (branch, index) => {
    if (index === 0) return '主分支';
    return `分支 ${index}`;
  };

  // 获取分支预览文本
  const getBranchPreview = (branch) => {
    if (!branch || !branch.preview) return '...';
    return branch.preview;
  };

  // 在组件内部添加
  const getBranchCounter = () => {
    if (showAllMode) return `全部/${availableBranches.length}`;
    return `${currentBranchIndex + 1}/${availableBranches.length}`;
  };

  if (!showAllMode && !currentBranch) {
    console.error('BranchSwitcher: currentBranch is undefined', { 
      currentBranchIndex, 
      availableBranches: availableBranches?.length,
      showAllMode
    });
    return null;
  }

  return (
    <div className={`branch-switcher ${className}`}>
      {/* 主切换控件 */}
      <div className="branch-switcher-main">
        {/* 左箭头 */}
        <button
          className={`branch-arrow branch-arrow-left ${!hasPrevious ? 'disabled' : ''}`}
          onClick={handlePrevious}
          disabled={!hasPrevious}
          title="上一个分支"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 12l-4-4 4-4v8z"/>
          </svg>
        </button>

        {/* 分支信息区域 */}
        <div 
          className={`branch-info ${switchAnimation ? 'switching' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="branch-info-main">
            <span className="branch-name">
              {getBranchDisplayName(currentBranch, currentBranchIndex)}
            </span>
            <span className="branch-counter">
              {getBranchCounter()}
            </span>
          </div>
          
          <div className="branch-preview">
            {getBranchPreview(currentBranch)}
          </div>

          {/* 展开指示器 */}
          {availableBranches.length > 2 && (
            <div className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L2 4h8l-4 4z"/>
              </svg>
            </div>
          )}
        </div>

        {/* 右箭头 */}
        <button
          className={`branch-arrow branch-arrow-right ${!hasNext ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={!hasNext}
          title="下一个分支"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4V4z"/>
          </svg>
        </button>
      </div>

      {/* 展开的分支列表 */}
      {isExpanded && availableBranches.length > 2 && (
        <div className="branch-list">
          {/* 显示全部分支选项 */}
          <div
            className={`branch-option ${showAllMode ? 'active' : ''}`}
            onClick={() => {
              if (onShowAllBranches) {
                onShowAllBranches();
              }
              setIsExpanded(false);
            }}
          >
            <div className="branch-option-header">
              <span className="branch-option-name">
                显示全部分支
              </span>
              <span className="branch-option-count">
                全部消息
              </span>
            </div>
            <div className="branch-option-preview">
              显示所有分支的消息
            </div>
          </div>
          
          {/* 各个分支选项 */}
          {availableBranches.map((branch, index) => (
            <div
              key={`${branchPoint.uuid}-branch-${index}`}
              className={`branch-option ${!showAllMode && index === currentBranchIndex ? 'active' : ''}`}
              onClick={() => handleDirectSwitch(index)}
            >
              <div className="branch-option-header">
                <span className="branch-option-name">
                  {getBranchDisplayName(branch, index)}
                </span>
                <span className="branch-option-count">
                  {branch.messageCount}条消息
                </span>
              </div>
              <div className="branch-option-preview">
                {getBranchPreview(branch)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;