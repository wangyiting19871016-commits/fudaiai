import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { missionData, Mission, AtomicStep } from '../data/missionData';
import useTaskManager from '../hooks/useTaskManager';

// --- 类型定义 (与 missionData.ts 保持一致) ---

const LabPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('missionId');
  const { completeTask } = useTaskManager();
  
  // === 实验室身份核验成功 ===
  // 锁定这个名字：stepId (这是控制台亲口告诉我们的真相)
  const currentId = params.stepId;
  
  console.log("=== 实验室身份核验成功 ===");
  console.log("捕获到的真实任务 ID:", currentId);

  // 状态管理
  const [status, setStatus] = useState<'idle' | 'success'>('idle'); // 移除 recording 状态
  const [textInput, setTextInput] = useState('');
  const [errorHint, setErrorHint] = useState('');
  const [showAuthenticStamp, setShowAuthenticStamp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null); // 修正定时器类型

  // 从 missionData 中获取当前 Slot 数据
  const currentMission = missionData.find(m => m.id === missionId) || missionData[0];
  const allSteps = currentMission.phases.flatMap(p => p.steps);
  const currentSlot = allSteps.find(s => s.id === currentId) || {
    id: currentId || 'unknown',
    title: "核心动作刻录",
    content: "确保动作连贯，并在第10秒完成关键定格",
    type: 'TEXT' as const
  };

  // 数据自检
  console.log("Entering Slot:", currentId, "with type:", currentSlot?.type);

  // 初始化文本输入框内容（首次渲染或切换节点时重置，未编辑过才覆盖）
  const userEdited = useRef(false);
  useEffect(() => {
    if (currentSlot.content && !userEdited.current) {
      setTextInput(currentSlot.content);
    }
  }, [currentSlot]);

  // 标记用户已编辑输入框
  useEffect(() => {
    if (textInput !== currentSlot.content) {
      userEdited.current = true;
    }
  }, [textInput, currentSlot.content]);

  useEffect(() => {
    // 彻底隐藏摄像头组件 (仅保留文本验证逻辑)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // 文本校验逻辑 - 彻底简化：只要内容长度>2就判定为成功
  const validateText = (text: string): boolean => {
    if (text.length <= 2) {
      return false;
    }
    setErrorHint(''); // 校验通过时清除错误提示
    return true;
  };

  // 放弃逻辑
  const handleAbort = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    navigate(-1);
  };

  // 录制逻辑
  // 实装 occupySlot 函数
  const occupySlot = (slotId: string, missionId: string, content: string) => {
    try {
      if (slotId && missionId) {
        // 由于 AtomicStep 接口中没有 currentBenchmark 属性，这里只做日志记录
        console.log('Slot verified:', slotId, 'with content:', content);
      }
    } catch (error) {
      // 捕获所有错误，不干扰用户
      console.log('occupySlot error:', error);
    }
  };

  const handleVerify = () => {
    if (!currentId || currentId === 'unknown') {
      alert("致命错误：无法获取任务ID，当前识别为: " + currentId);
      return;
    }
    
    // 物理写入：必须用这个 ID
    localStorage.setItem(`completed_${currentId}`, 'true');
    localStorage.setItem(`completed_step_${currentId}`, 'true');
    
    // 分数逻辑保持
    const oldScore = parseInt(localStorage.getItem('user_credit_score') || '896');
    localStorage.setItem('user_credit_score', (oldScore + 10).toString());
    
    window.history.back();
  };

  const handleReset = () => {
    // 1. 清除信用分
    localStorage.removeItem('user_credit_score');
    
    // 2. 暴力清除所有以 'completed_' 开头的任务记录
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('completed_')) {
        localStorage.removeItem(key);
      }
    });
    
    // 3. 或者最彻底的方法（如果你不打算存别的）
    // localStorage.clear();
    
    // 4. 强制刷新页面确保状态同步
    window.location.reload();
  };

  // 已废弃：统一使用 handleVerify 处理文本验证

  return (
    <div style={{ position: 'relative', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Prominent slot title */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
        {currentSlot.title}
      </div>
      
      {/* Prominent red AUTHENTIC stamp */}
      {showAuthenticStamp && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'red',
          zIndex: 9999,
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          padding: '20px',
          border: '5px solid red'
        }}>
          AUTHENTIC
        </div>
      )}
      
      {/* 顶部：真迹轨道 */}
      <div style={{ height: '60px', borderBottom: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '58px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <button 
                onClick={() => navigate(-1)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ef4444', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  letterSpacing: '1px', 
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                [ 终止刻录 ]
              </button>
              <div style={{ fontSize: '14px', letterSpacing: '2px', color: '#666' }}>
                FORGE // <span style={{ color: '#fff' }}>{currentSlot.title}</span>
              </div>
            </div>
          </div>
      </div>

      {/* 中间：对抗分屏 */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* 左屏：展示 officialCriteria 文案 */}
        <div style={{ flex: 1, borderRight: '1px solid #222', background: '#0a0a0a', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '200px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>任务卡片</div>
          <div style={{ width: '80%', color: '#888', borderLeft: '2px solid #06b6d4', paddingLeft: '15px' }}>
            <h4 style={{ color: '#06b6d4', margin: '0 0 10px 0', fontSize: '24px' }}>验证标准</h4>
            <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#fff' }}>{currentSlot.content}</p>
          </div>
        </div>

        {/* 右屏：根据 task.type 显示对应的交互占位 */}
        <div style={{ flex: 1, background: '#000', position: 'relative' }}>
          {currentSlot.type === 'TEXT' ? (
            <div className="text-forge">
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: '#111', 
                    border: '1px solid #333', 
                    color: '#fff', 
                    padding: '20px', 
                    fontSize: '16px', 
                    lineHeight: '1.6',
                    resize: 'none'
                  }}
                  placeholder="在这里输入你的真迹指令..."
                />
              </div>
            </div>
          ) : (
            <div className="audio-forge" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '64px', color: '#06b6d4' }}>🎤</div>
              <div style={{ marginTop: '20px', fontSize: '24px', color: '#fff', textAlign: 'center' }}>录音刻录</div>
            </div>
          )}
          {showAuthenticStamp && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%) rotate(-15deg)', 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: 'red', 
              border: '5px solid red', 
              padding: '20px', 
              backgroundColor: 'rgba(255, 0, 0, 0.7)', 
              zIndex: 999999 // 最高z-index
            }}>
              AUTHENTIC
            </div>
          )}
        </div>
      </div>

      {/* 底部：指挥台 */}
      <div style={{ height: '100px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {status === 'idle' ? (
          <>
            <button 
              onClick={handleVerify}
              style={{ 
                padding: '12px 60px', 
                background: 'transparent', 
                border: '1px solid #06b6d4', 
                color: '#06b6d4', 
                cursor: 'pointer', 
                fontSize: '16px', 
                letterSpacing: '2px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {currentSlot.type === 'TEXT' ? '🚀 盖章验证' : '▶ 启动刻录'}
            </button>
            <button 
              onClick={handleAbort}
              style={{ 
                padding: '12px 40px', 
                background: 'transparent', 
                border: '1px solid #ef4444', 
                color: '#ef4444', 
                cursor: 'pointer', 
                fontSize: '14px', 
                letterSpacing: '2px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              放弃
            </button>
            <button 
              onClick={handleReset}
              style={{ 
                padding: '12px 30px', 
                background: 'transparent', 
                border: '1px solid #f59e0b', 
                color: '#f59e0b', 
                cursor: 'pointer', 
                fontSize: '12px', 
                letterSpacing: '1px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              重置进度
            </button>
          </>
        ) : (
          <div style={{ color: '#444', fontSize: '12px', letterSpacing: '1px' }}>
            正在将真迹同步至主干网络...
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes stamp {
          0% {
            transform: rotate(-15deg) scale(2);
            opacity: 0;
          }
          80% {
            transform: rotate(-15deg) scale(1.1);
            opacity: 1;
          }
          90% {
            transform: rotate(-15deg) scale(0.95);
          }
          100% {
            transform: rotate(-15deg) scale(1);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LabPage;