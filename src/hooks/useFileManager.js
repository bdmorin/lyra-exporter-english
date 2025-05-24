// hooks/useFileManager.js
import { useState, useCallback, useEffect } from 'react';
import { extractChatData, detectBranches } from '../utils/fileParser';

export const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTypeConflictModal, setShowTypeConflictModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // 处理当前文件
  const processCurrentFile = useCallback(async () => {
    if (!files.length || currentFileIndex >= files.length) {
      setProcessedData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const file = files[currentFileIndex];
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // 解析AI对话数据（支持Claude、Gemini、NotebookLM格式）
      let data = extractChatData(jsonData, file.name);
      // 检测分支（主要用于Claude格式）
      data = detectBranches(data);
      
      setProcessedData(data);
    } catch (err) {
      console.error('处理文件出错:', err);
      setError(err.message);
      setProcessedData(null);
    } finally {
      setIsLoading(false);
    }
  }, [files, currentFileIndex]);

  // 当文件或索引改变时，处理文件
  useEffect(() => {
    processCurrentFile();
  }, [processCurrentFile]);

  // 检查文件类型是否兼容
  const checkFileTypeCompatibility = useCallback(async (newFiles) => {
    if (files.length === 0) return true;

    try {
      // 检查第一个新文件的类型
      const firstNewFile = newFiles[0];
      const text = await firstNewFile.text();
      const jsonData = JSON.parse(text);
      const newFileData = extractChatData(jsonData, firstNewFile.name);
      
      // 检查当前已加载文件的类型
      const currentFile = files[currentFileIndex];
      const currentText = await currentFile.text();
      const currentJsonData = JSON.parse(currentText);
      const currentFileData = extractChatData(currentJsonData, currentFile.name);
      
      // 如果有claude_full_export格式，不能与其他格式混合
      const isNewFullExport = newFileData.format === 'claude_full_export';
      const isCurrentFullExport = currentFileData.format === 'claude_full_export';
      
      return !(isNewFullExport !== isCurrentFullExport);
    } catch (error) {
      console.warn('文件类型检查失败:', error);
      return true; // 如果检查失败，允许加载
    }
  }, [files, currentFileIndex]);

  // 加载文件
  const loadFiles = useCallback(async (fileList) => {
    const jsonFiles = fileList.filter(file => {
      // 检查文件扩展名和类型
      return file.name.endsWith('.json') || file.type === 'application/json';
    });
    
    if (jsonFiles.length === 0) {
      setError('未找到JSON文件');
      return;
    }

    // 检查重复文件
    const newFiles = jsonFiles.filter(newFile => 
      !files.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.lastModified === newFile.lastModified
      )
    );

    if (newFiles.length === 0) {
      setError('选择的文件已经加载');
      return;
    }

    // 检查文件类型兼容性
    const isCompatible = await checkFileTypeCompatibility(newFiles);
    
    if (!isCompatible) {
      setPendingFiles(newFiles);
      setShowTypeConflictModal(true);
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  }, [files, checkFileTypeCompatibility]);

  // 确认替换文件
  const confirmReplaceFiles = useCallback(() => {
    setFiles(pendingFiles);
    setCurrentFileIndex(0);
    setPendingFiles([]);
    setShowTypeConflictModal(false);
    setError(null);
  }, [pendingFiles]);

  // 取消替换文件
  const cancelReplaceFiles = useCallback(() => {
    setPendingFiles([]);
    setShowTypeConflictModal(false);
  }, []);

  // 移除文件
  const removeFile = useCallback((index) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter((_, i) => i !== index);
      
      // 调整当前索引
      if (newFiles.length === 0) {
        setCurrentFileIndex(0);
      } else if (index <= currentFileIndex && currentFileIndex > 0) {
        setCurrentFileIndex(currentFileIndex - 1);
      }
      
      return newFiles;
    });
  }, [currentFileIndex]);

  // 切换文件
  const switchFile = useCallback((index) => {
    if (index >= 0 && index < files.length) {
      setCurrentFileIndex(index);
    }
  }, [files.length]);

  // 重排序文件
  const reorderFiles = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
      
      // 更新当前文件索引
      if (fromIndex === currentFileIndex) {
        setCurrentFileIndex(toIndex);
      } else if (fromIndex < currentFileIndex && toIndex >= currentFileIndex) {
        setCurrentFileIndex(currentFileIndex - 1);
      } else if (fromIndex > currentFileIndex && toIndex <= currentFileIndex) {
        setCurrentFileIndex(currentFileIndex + 1);
      }
      
      return newFiles;
    });
  }, [currentFileIndex]);

  // 获取当前文件信息
  const currentFile = files[currentFileIndex] || null;

  return {
    // 状态
    files,
    currentFile,
    currentFileIndex,
    processedData,
    isLoading,
    error,
    showTypeConflictModal,
    pendingFiles,
    
    // 操作
    actions: {
      loadFiles,
      removeFile,
      switchFile,
      reorderFiles,
      confirmReplaceFiles,
      cancelReplaceFiles
    }
  };
};