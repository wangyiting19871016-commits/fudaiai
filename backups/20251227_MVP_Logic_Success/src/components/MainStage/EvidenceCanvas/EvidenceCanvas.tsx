import React, { useState, useRef, useEffect } from 'react';
import { useTaskSystem } from '../../../hooks/useTaskSystem';
import { ViewMode } from '../../../types/index';

interface EvidenceCanvasProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const EvidenceCanvas: React.FC<EvidenceCanvasProps> = ({ viewMode, setViewMode }) => {
  const { tasks } = useTaskSystem();

  // Canvas控制器状态
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // 如果不是 EVIDENCE 模式，不渲染
  if (viewMode !== 'EVIDENCE') return null;

  // 根据任务状态获取颜色
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#888';
      case 'failed': return '#ef4444';
      case 'success': return '#22c55e';
      default: return '#888';
    }
  };

  // Canvas控制器函数
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePosition.x;
      const deltaY = e.clientY - lastMousePosition.y;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 创建虚拟的成品视频节点（居中最大）
  const finalTask = {
    id: 999,
    type: 'final' as const,
    status: 'success',
    title: '成品视频',
    failedAttempts: 0,
    issuerSignature: 'SIGNATURE_FINAL_20251225',
    videoUrl: tasks[0]?.videoUrl
  };

  // 分类任务
  const evidenceTasks = tasks.filter(task => task.type === 'video' || task.type === 'audio');
  const processTasks = tasks.filter(task => task.type === 'sensor');

  return (
    <React.Fragment>
      {/* 右上角关闭按钮 - 绝对锁死，永远固定在屏幕右上角 */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: 10000,
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(5px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
      onClick={() => setViewMode('FEED')}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'scale(1)';
      }}>
        <span style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>×</span>
      </div>

      {/* 协议复刻和开放存证侧边按钮 - 不受缩放影响 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1001
      }}>
        <button
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          协议复刻
        </button>
        <button
          style={{
            padding: '12px 16px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          开放存证
        </button>
      </div>

      {/* 左下角缩放控制器 - 不受缩放影响 */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '12px 16px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* 缩放控制 */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px',
          borderRadius: '8px',
          backdropFilter: 'blur(5px)'
        }}>
          <button
            onClick={zoomOut}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            -
          </button>
          <div style={{
            width: '60px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={zoomIn}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            +
          </button>
        </div>
        
        {/* 重置视角按钮 */}
        <button
          onClick={resetView}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            backdropFilter: 'blur(5px)',
            transition: 'background-color 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        >
          重置视角 (R)
        </button>
      </div>

      {/* 固定的画布背景容器 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: '#050505',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 可变换的Canvas内容 */}
        <div
          ref={canvasRef}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '100vw',
            height: '100vh',
            position: 'relative'
          }}
        >


        {/* SVG 连接线容器 */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* 定义线条样式 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.6)" />
            </marker>
          </defs>

          {/* 连接线：证据节点 → 成品视频 */}
          {evidenceTasks.map((evidenceTask, index) => {
            // 安全计算 SVG 路径坐标，防止 NaN 注入
            const safeIndex = (typeof index === 'number' && !isNaN(index) && isFinite(index)) ? index : 0;
            const startX = `${20 + (safeIndex * 15)}%`;
            const startY = "30%";
            const endX = "50%";
            const endY = "50%";
            
            return (
              <path
                key={`connection-evidence-${evidenceTask.id}-final`}
                d={`M ${startX} ${startY} Q ${startX} 40% ${endX} ${endY}`}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* 连接线：处理节点 → 成品视频 */}
          {processTasks.map((processTask, index) => {
            // 安全计算 SVG 路径坐标，防止 NaN 注入
            const safeIndex = (typeof index === 'number' && !isNaN(index) && isFinite(index)) ? index : 0;
            const startX = `${20 + (safeIndex * 20)}%`;
            const startY = "70%";
            const endX = "50%";
            const endY = "50%";
            
            return (
              <path
                key={`connection-process-${processTask.id}-final`}
                d={`M ${startX} ${startY} Q ${startX} 60% ${endX} ${endY}`}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* 容器：用于定位所有节点 */}
        <div style={{
          position: 'relative',
          width: '100vw',
          height: '100vh'
        }}>
        {/* 中心：成品视频节点（最大） */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '250px',
          height: '250px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          zIndex: 2
        }}>
          {/* 使用videoUrl作为背景 */}
          {finalTask.videoUrl && (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${finalTask.videoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.95
            }}>
              {/* 成品视频标识 */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                成品视频
              </div>
              
              {/* 失败次数与签名字段 */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'white'
              }}>
                <div>失败次数: {finalTask.failedAttempts}</div>
                <div>签名: {finalTask.issuerSignature.substring(0, 20)}...</div>
              </div>
            </div>
          )}
          {/* 如果没有videoUrl，显示占位背景 */}
          {!finalTask.videoUrl && (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.95
            }}>
              {/* 成品视频标识 */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                成品视频
              </div>
            </div>
          )}
          {/* 珍珠状态 */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(finalTask.status),
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}></div>
        </div>

        {/* 顶部：证据节点（放射状排布） */}
        {evidenceTasks.map((task, index) => {
          // 安全计算位置坐标，防止 NaN 注入
          const safeIndex = (typeof index === 'number' && !isNaN(index) && isFinite(index)) ? index : 0;
          const leftPosition = `${20 + (safeIndex * 15)}%`; // 20%, 35%, 50%, 65%, 80%
          return (
            <div
              key={`evidence-${task.id}`}
              style={{
                position: 'absolute',
                top: '30%',
                left: leftPosition,
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '140px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${getStatusColor(task.status)}`,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(5px)',
                zIndex: 2
              }}
            >
              {/* 使用videoUrl作为背景 */}
              {task.videoUrl && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${task.videoUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.9
                }}>
                  {/* 任务类型标识 */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {task.type === 'video' ? '视频' : '音频'}
                  </div>
                  
                  {/* 失败次数与签名字段 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white'
                  }}>
                    <div>失败次数: {task.failedAttempts}</div>
                    <div>签名: {task.issuerSignature.substring(0, 15)}...</div>
                  </div>
                </div>
              )}
              {/* 如果没有videoUrl，显示占位背景 */}
              {!task.videoUrl && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.9
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {task.type === 'video' ? '视频' : '音频'}
                  </div>
                  <span style={{
                    color: 'white',
                    fontSize: '24px',
                    opacity: 0.5
                  }}>
                    无预览
                  </span>
                  
                  {/* 失败次数与签名字段 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white'
                  }}>
                    <div>失败次数: {task.failedAttempts}</div>
                    <div>签名: {task.issuerSignature.substring(0, 15)}...</div>
                  </div>
                </div>
              )}
              {/* 珍珠状态 */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(task.status),
                border: '2px solid rgba(255, 255, 255, 0.5)'
              }}></div>
            </div>
          );
        })}

        {/* 底部：处理节点（放射状排布） */}
        {processTasks.map((task, index) => {
          // 安全计算位置坐标，防止 NaN 注入
          const safeIndex = (typeof index === 'number' && !isNaN(index) && isFinite(index)) ? index : 0;
          const leftPosition = `${20 + (safeIndex * 20)}%`; // 20%, 40%, 60%, 80%
          return (
            <div
              key={`process-${task.id}`}
              style={{
                position: 'absolute',
                top: '70%',
                left: leftPosition,
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '140px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: `1px solid ${getStatusColor(task.status)}`,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(5px)',
                zIndex: 2
              }}
            >
              {/* 使用videoUrl作为背景 */}
              {task.videoUrl && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${task.videoUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.9
                }}>
                  {/* 任务类型标识 */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    传感器数据
                  </div>
                  
                  {/* 失败次数与签名字段 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white'
                  }}>
                    <div>失败次数: {task.failedAttempts}</div>
                    <div>签名: {task.issuerSignature.substring(0, 15)}...</div>
                  </div>
                </div>
              )}
              {/* 如果没有videoUrl，显示占位背景 */}
              {!task.videoUrl && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.9
                }}>
                  {/* 任务类型标识 */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    传感器数据
                  </div>
                  <span style={{
                    color: 'white',
                    fontSize: '24px',
                    opacity: 0.5
                  }}>
                    无预览
                  </span>
                  
                  {/* 失败次数与签名字段 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: 'white'
                  }}>
                    <div>失败次数: {task.failedAttempts}</div>
                    <div>签名: {task.issuerSignature.substring(0, 15)}...</div>
                  </div>
                </div>
              )}
              {/* 珍珠状态 */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(task.status),
                border: '2px solid rgba(255, 255, 255, 0.5)'
              }}></div>
            </div>
          );
        })}
        </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EvidenceCanvas;