// hooks/useFileManager.js
import { useState, useCallback, useEffect } from 'react';
import { extractChatData, detectBranches } from '../utils/fileParser';

export const useFileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // 加载文件
  const loadFiles = useCallback((fileList) => {
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

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setError(null);
  }, [files]);

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
    
    // 操作
    actions: {
      loadFiles,
      removeFile,
      switchFile
    }
  };
};