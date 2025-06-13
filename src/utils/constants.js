// utils/constants.js
// 常量定义

// 标记类型
export const MARK_TYPES = {
  COMPLETED: 'completed',
  IMPORTANT: 'important',
  DELETED: 'deleted'
};

// 导出配置默认值
export const DEFAULT_EXPORT_CONFIG = {
  includeThinking: true,
  includeTools: true,
  includeArtifacts: true,
  includeCitations: true,
  exportObsidianMetadata: true,
  hideTimestamps: false,
  exportMarkedOnly: false,
  obsidianProperties: [],
  obsidianTags: []
};

// UI相关常量
export const TAB_TYPES = {
  CONTENT: 'content',
  THINKING: 'thinking',
  ARTIFACTS: 'artifacts',
  JSON: 'json'
};

// 搜索相关常量
export const SEARCH_DEBOUNCE_MS = 300;

// 本地存储键名
export const STORAGE_KEYS = {
  MARKS_PREFIX: 'marks_',
  USER_SETTINGS: 'user_settings'
};