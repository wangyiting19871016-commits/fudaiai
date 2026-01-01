import React, { useState, useEffect } from 'react';
import { listDirs, validatePath } from '../services/backendMockService';

interface PhysicalPathSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPathSelected: (path: string) => void;
}

const PhysicalPathSelector: React.FC<PhysicalPathSelectorProps> = ({ isOpen, onClose, onPathSelected }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [disks, setDisks] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pathSegments, setPathSegments] = useState<string[]>([]);

  // 加载磁盘列表
  useEffect(() => {
    if (isOpen) {
      loadDisks();
    }
  }, [isOpen]);

  // 加载磁盘列表
  const loadDisks = async () => {
    setIsLoading(true);
    try {
      const result = await listDirs();
      if (result.disks) {
        setDisks(result.disks);
        setFolders([]);
        setCurrentPath('');
        setPathSegments([]);
        setError('');
      }
    } catch (error) {
      setError('加载磁盘列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载文件夹列表
  const loadFolders = async (path: string) => {
    setIsLoading(true);
    try {
      const result = await listDirs(path);
      if (result.folders) {
        setFolders(result.folders);
        setCurrentPath(path);
        setPathSegments(path.split('/').filter(segment => segment));
        setError('');
      }
    } catch (error) {
      setError('加载文件夹列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理磁盘点击
  const handleDiskClick = (disk: string) => {
    loadFolders(disk);
  };

  // 处理文件夹点击
  const handleFolderClick = (folder: string) => {
    const newPath = currentPath ? `${currentPath}/${folder}` : folder;
    loadFolders(newPath);
  };

  // 处理路径段点击
  const handlePathSegmentClick = (index: number) => {
    const newPath = pathSegments.slice(0, index + 1).join('/');
    loadFolders(newPath);
  };

  // 处理返回上一级
  const handleGoBack = () => {
    if (!currentPath) return;
    
    const segments = pathSegments.slice(0, -1);
    const newPath = segments.join('/');
    loadFolders(newPath);
  };

  // 处理确认选择
  const handleConfirm = async () => {
    if (!currentPath) {
      setError('请选择一个文件夹');
      return;
    }

    setIsLoading(true);
    try {
      const result = await validatePath(currentPath);
      if (result.success) {
        onPathSelected(currentPath);
        onClose();
      } else {
        setError(result.error || '路径验证失败');
      }
    } catch (error) {
      setError('路径验证失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染路径面包屑
  const renderPathBreadcrumb = () => {
    if (!currentPath) return null;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        fontSize: '14px',
        color: '#888'
      }}>
        {pathSegments.map((segment, index) => (
          <>
            <span
              key={index}
              style={{
                cursor: 'pointer',
                color: index === pathSegments.length - 1 ? '#fff' : '#06b6d4',
                fontWeight: index === pathSegments.length - 1 ? 'bold' : 'normal'
              }}
              onClick={() => handlePathSegmentClick(index)}
            >
              {segment}
            </span>
            {index < pathSegments.length - 1 && <span style={{ color: '#444' }}>/</span>}
          </>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#111',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)'
      }}>
        {/* 标题 */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#06b6d4',
          margin: '0 0 20px 0'
        }}>
          📁 选择物理存储位置
        </h2>

        {/* 错误信息 */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* 路径面包屑 */}
        {renderPathBreadcrumb()}

        {/* 路径导航栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {currentPath && (
            <button
              onClick={handleGoBack}
              style={{
                padding: '6px 12px',
                backgroundColor: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← 返回上一级
            </button>
          )}
          <div style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentPath || '选择磁盘'}
          </div>
        </div>

        {/* 内容区域 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#0a0a0a',
          borderRadius: '6px',
          border: '1px solid #222'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: '#888'
            }}>
              加载中...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {/* 显示磁盘列表 */}
              {!currentPath && disks.map((disk) => (
                <div
                  key={disk}
                  onClick={() => handleDiskClick(disk)}
                  style={{
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.borderColor = '#06b6d4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ fontSize: '24px' }}>💿</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                    {disk}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    本地磁盘
                  </div>
                </div>
              ))}

              {/* 显示文件夹列表 */}
              {currentPath && folders.map((folder) => (
                <div
                  key={folder}
                  onClick={() => handleFolderClick(folder)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.borderColor = '#06b6d4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div style={{ fontSize: '16px' }}>📁</div>
                  <div style={{ fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {folder}
                  </div>
                </div>
              ))}

              {/* 空状态 */}
              {currentPath && folders.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  <div>该文件夹为空</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#222';
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !currentPath}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading || !currentPath ? '#666' : '#10b981',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isLoading || !currentPath ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && currentPath) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && currentPath) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            {isLoading ? '验证中...' : '确认选择'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhysicalPathSelector;
