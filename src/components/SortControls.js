// components/SortControls.js
import React from 'react';

const SortControls = ({ 
  enabled, 
  hasCustomSort, 
  onEnableSort, 
  onResetSort, 
  className = '',
  isSearching = false 
}) => {
  return (
    <div className={`sort-controls ${className}`}>
      {!enabled ? (
        <button 
          className="btn-secondary small"
          onClick={onEnableSort}
          title="启用消息排序"
          disabled={isSearching}
        >
          🔄 启用排序
        </button>
      ) : (
        <div className="sort-active-controls">
          <span className="sort-status">
            <span className="sort-status-icon">✅</span>
            <span className="sort-status-text">排序已启用</span>
          </span>
          {hasCustomSort && (
            <button 
              className="btn-secondary small"
              onClick={onResetSort}
              title="重置为原始顺序"
            >
              🔄 重置排序
            </button>
          )}
        </div>
      )}
      {isSearching && (
        <div className="sort-disabled-hint">
          <span title="搜索时无法排序">🔍 搜索中</span>
        </div>
      )}
    </div>
  );
};

export default SortControls;