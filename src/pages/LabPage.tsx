import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle, Monitor, Activity, Zap, FileText, Headphones, Play, Square, Settings, BookOpen, Heart } from 'lucide-react';
import ReferenceCard from '../components/ReferenceCard';
import VerifyPanel from '../components/VerifyPanel';

// 解决浏览器环境下对 NodeJS 命名空间的误报
declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

// --- 1. 官方静态库 (保留这 5 关作为默认体验) ---
const STATIC_MISSIONS = [
  {
    id: 1,
    title: "声韵刻录 · 频率共振",
    type: "VOICE",
    desc: "请调动你的横膈膜，用腹式呼吸朗读屏幕中央的关键句。注意：系统将捕捉你的声纹颤动频率。",
    key: "Can I get a Latte?",
    color: "#06b6d4" // Cyan
  },
  {
    id: 2,
    title: "视觉定格 · 核心大纲",
    type: "SCREEN",
    desc: "请打开 Gamma 演示文档，切换至大纲视图。系统将截取并验证你的思维结构。",
    key: "Gamma Outline",
    color: "#8b5cf6" // Purple
  },
  {
    id: 3,
    title: "听觉解码 · 噪嘴训练",
    type: "TEXT",
    desc: "请听写视频中 Maker 提到的第二个核心参数（咖啡粉的克数）。",
    key: "18g",
    color: "#f59e0b" // Amber
  },
  {
    id: 4,
    title: "高阶复盘 · 心流自述",
    type: "VOICE",
    desc: "请用 30 秒时间，口述你刚才在操作中的心流感受。",
    key: "Flow State",
    color: "#10b981" // Green
  },
  {
    id: 5,
    title: "最终签署 · 真迹封存",
    type: "TEXT",
    desc: "请输入你的代号，作为本阶段真迹的数字签名。",
    key: "SIGNATURE",
    color: "#ec4899" // Pink
  },
  // 兼容 P2 旧 ID
  { id: "step_1", title: "核心名录 (Step 1)", type: "TEXT", desc: "输入核心关键词", key: "Success", color: "#06b6d4" },
  { id: "step_2", title: "声韵刻录 (Step 2)", type: "VOICE", desc: "朗读关键句", key: "Latte", color: "#06b6d4" }
];

const LabPage = () => {
  const { stepId } = useParams();
  const navigate = useNavigate();

  // --- 2. P3 数据解析逻辑：多步接管 ---
  // A. 寻址升级：先在 localStorage 的 custom_missions 中寻找匹配该 ID 的任务包
  const localMissions = JSON.parse(localStorage.getItem('custom_missions') || '[]');
  
  // B. 优先从本地任务中查找，确保 P4 生成的任务优先处理
  let targetMission = localMissions.find((m: any) => String(m.id) === String(stepId));
  
  // C. 如果本地任务中找不到，再从静态任务中查找
  if (!targetMission) {
    targetMission = STATIC_MISSIONS.find(m => String(m.id) === String(stepId));
  }
  
  // D. 如果都找不到，使用默认任务（防崩溃保护）
  if (!targetMission) {
    targetMission = STATIC_MISSIONS[0];
  }

  // E. 状态维护：定义 currentSubStep (当前子步骤索引，默认从 sessionStorage 读取)
  const [currentSubStep, setCurrentSubStep] = useState(() => {
    // 【状态锁定】终极兜底：从 sessionStorage 读取暂存的步骤索引
    if (typeof window !== 'undefined') {
      const savedStep = sessionStorage.getItem(`current_step_index_${stepId}`);
      return savedStep ? parseInt(savedStep, 10) : 0;
    }
    return 0;
  });
  
  // 【物理级止血】强制刷新 Key，确保组件完全重建
  const [instanceKey, setInstanceKey] = useState(0);
  
  // F. 页面内容（视频、标题、心法描述）必须实时指向 mission.steps[currentSubStep]
  const hasSubSteps = targetMission && targetMission.steps && Array.isArray(targetMission.steps) && targetMission.steps.length > 0;
  const steps = targetMission?.steps || [];
  const currentStep = hasSubSteps ? targetMission.steps[currentSubStep] : targetMission;
  
  // === 🔗 强制物理约束：定义当前激活的参考资料 ===
  const activeReference = steps[currentSubStep]?.reference_material;

  // 监听 URL 变化，仅在任务真正切换时重置子步骤状态
  useEffect(() => {
    // 重新查找任务对象
    let newTargetMission = localMissions.find((m: any) => String(m.id) === String(stepId));
    if (!newTargetMission) {
      newTargetMission = STATIC_MISSIONS.find(m => String(m.id) === String(stepId));
    }
    if (!newTargetMission) {
      newTargetMission = STATIC_MISSIONS[0];
    }
    
    // 【状态锁定】仅在任务 ID 真正变化时才重置子步骤索引
    if (newTargetMission.id !== targetMission?.id) {
      setCurrentSubStep(0);
      console.log("【状态锁定】任务切换，重置子步骤索引为初始值");
    }
  }, [stepId, localMissions, targetMission?.id]);

  // 【状态回显】保存和恢复输入文本状态


  // 【状态回显】加载当前步骤的输入状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(`input_state_${stepId}_${currentSubStep}`);
      if (savedState) {
        // 状态恢复由VerifyPanel组件内部管理
      }
    }
  }, [stepId, currentSubStep]);

  // 【状态锁定】监听 currentSubStep 变化，保存到 sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 防止死循环：仅在有效步骤时保存
      if (currentSubStep >= 0) {
        sessionStorage.setItem(`current_step_index_${stepId}`, currentSubStep.toString());
        console.log("【状态锁定】保存步骤索引到 sessionStorage:", currentSubStep);
      }
    }
  }, [currentSubStep, stepId]);





  const handleNextStep = () => {
    // 核心逻辑：只管切步骤，不管重置状态
    if (currentSubStep < steps.length - 1) {
      setCurrentSubStep(prev => prev + 1);
    } else {
      // 整个任务结束的逻辑（可选）
      console.log("Mission Accomplished");
    }
  };

  // --- 智能工具箱状态 ---
  const [isToolboxExpanded, setIsToolboxExpanded] = useState(true);

  // --- 逻辑适配：根据type字段动态渲染组件 ---
  const displayType = currentStep.type === 'SCREEN_SHOT' ? 'SCREEN' : currentStep.type;

  // --- 空杯重置功能 (物理级止血) ---
  const handleReset = () => {
    // 【空杯重置】强制执行物理级重置，任何残留缓存都必须死
    
    // A. 物理清空所有缓存
    sessionStorage.clear();
    localStorage.removeItem(`completed_step_${stepId}`);
    
    // B. 物理触发组件重连
    setInstanceKey(prev => prev + 1);
    
    // C. 物理跳转（可选，确保路由刷新）
    console.log("【物理重置】所有状态已强制初始化");
  };



  const themeColor = currentStep.color || "#06b6d4";
  // 类型映射：将P4生成的三种标准类型映射到对应的渲染组件


  // --- 4. 视觉渲染 (完全保留刚才满意的内联样式) ---
  return (
    <div key={instanceKey} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#050505', color: '#fff', 
      display: 'flex', flexDirection: 'row', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* 顶部进度条 */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#222', zIndex: 200 }}>
          <div style={{ 
            // 动态进度显示：支持子步骤进度
            width: hasSubSteps 
              ? `${((currentSubStep + 1) / targetMission.steps.length) * 100}%`
              : '100%', 
            maxWidth: '100%',
            height: '100%', background: themeColor, 
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 10px ${themeColor}`
          }}></div>
        </div>
      
      {/* 返回按钮 */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          position: 'absolute', top: 24, left: 24, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', border: '1px solid #333', borderRadius: '50%',
          padding: 12, cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)',
          transition: 'transform 0.2s'
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* === 左舱 (45%) === */}
      <div key={`left-panel-${currentSubStep}`} style={{ 
        width: '45%', height: '100%', borderRight: '1px solid rgba(255,255,255,0.05)',
        background: `linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(5,5,5,1) 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px',
        position: 'relative',
        overflowY: 'auto' // 👈 核心修改：允许左侧面板内容滚动
      }}>
        {/* 背景光晕 */}
        <div style={{ 
          position: 'absolute', top: '20%', left: '-20%', width: '500px', height: '500px', 
          background: themeColor, opacity: 0.05, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' 
        }}></div>

        {/* 标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <span style={{ 
            padding: '4px 12px', background: `${themeColor}1a`, border: `1px solid ${themeColor}4d`, 
            color: themeColor, fontSize: 12, borderRadius: 4, letterSpacing: 2, fontWeight: 'bold'
          }}>
            PROTOCOL {String(currentStep.id || currentSubStep + 1).padStart(2, '0')}
          </span>
          <span style={{ color: '#666', fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Activity size={14} /> {displayType} MODE
          </span>
          
          {/* 子步骤进度显示 */}
          {hasSubSteps && (
            <span style={{ 
              padding: '4px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              color: '#fff', fontSize: 11, borderRadius: 4, fontWeight: 'bold'
            }}>
              STEP {currentSubStep + 1}/{targetMission.steps.length}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 30, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff' }}>
          {steps[currentSubStep]?.title}
        </h1>

        {/* 描述 */}
        <div style={{ paddingLeft: 24, borderLeft: `3px solid ${themeColor}`, position: 'relative' }}>
          <p style={{ fontSize: 18, color: '#a3a3a3', lineHeight: 1.8, fontWeight: 300 }}>
            {steps[currentSubStep]?.desc || steps[currentSubStep]?.description}
          </p>
        </div>

        {/* === 🔗 强制物理约束：锁定代码框尺寸 === */}
        {activeReference && (
          <ReferenceCard 
            content={activeReference.content}
            title="📦 核心情报 / 咒语"
          />
        )}

        {/* 2. 渲染当前步骤的动作指令 (最重要！) */}
        {steps[currentSubStep]?.action_instruction && (
          <div style={{ marginTop: 30, fontSize: 16, lineHeight: 1.6, color: '#ccc', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold', marginBottom: '8px' }}>🎯 动作指令</div>
            {steps[currentSubStep]?.action_instruction}
          </div>
        )}

        {/* 2. 渲染全局情报卡 (代码/咒语) */}
        {targetMission?.reference_material && (
          <div style={{ marginTop: 30, padding: '15px', background: '#111', border: '1px solid #333', borderRadius: '8px' }}>
            <div style={{ color: '#06b6d4', fontSize: 12, fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              📂 核心情报 / 咒语 (点击复制)
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '13px', color: '#a6e3a1', overflowY: 'auto',maxHeight: '260px', margin: 0, lineHeight: '1.4' }}>
              {targetMission.reference_material.content}
            </pre>
          </div>
        )}
      </div>

      {/* 右侧面板 */}
      <div style={{ flex: 1, background: '#000', position: 'relative' }}>
        <VerifyPanel 
          step={steps[currentSubStep]}
          onVerified={handleNextStep}
          themeColor={themeColor || '#06b6d4'}
        />
      </div>

      {/* === 可收缩工具箱 === */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {isToolboxExpanded ? (
          // 展开状态
          <div style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
            border: '1px solid #333',
            borderRadius: 16,
            padding: 20,
            width: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            borderImage: 'linear-gradient(45deg, #ffd700, #b8860b) 1'
          }}>
            {/* 工具箱标题栏 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
              paddingBottom: 10,
              borderBottom: '1px solid #333'
            }}>
              <span style={{ color: '#ffd700', fontSize: 14, fontWeight: 'bold' }}>智能工具箱</span>
              <button 
                onClick={() => setIsToolboxExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: 5
                }}
              >
                <Settings size={16} />
              </button>
            </div>

            {/* 工具箱内容 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 当前验证插件 */}
              <div style={{
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }} onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,215,0,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255,215,0,0.3)';
              }} onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="#ffd700" />
                  <span style={{ color: '#ffd700', fontSize: 12, fontWeight: 'bold' }}>当前验证插件</span>
                </div>
                <div style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>{displayType} 模式激活中</div>
              </div>

              {/* 验证关键词 */}
              <div style={{
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.3)',
                borderRadius: 8,
                padding: 12,
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <FileText size={14} color="#06b6d4" />
                  <span style={{ color: '#06b6d4', fontSize: 12, fontWeight: 'bold' }}>验证关键词</span>
                </div>
                <div style={{ color: '#fff', fontSize: 10, lineHeight: 1.4, fontFamily: 'monospace' }}>
                  {Array.isArray(currentStep.verify_key) ? 
                   currentStep.verify_key.join(' 或 ') : 
                   currentStep.key || '无验证关键词'}
                </div>
              </div>

              {/* 参考物料查看 */}
              <div style={{
                background: 'rgba(139, 69, 19, 0.1)',
                border: '1px solid rgba(139, 69, 19, 0.3)',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }} onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 69, 19, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(139, 69, 19, 0.3)';
              }} onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(139, 69, 19, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={14} color="#8b4513" />
                  <span style={{ color: '#8b4513', fontSize: 12, fontWeight: 'bold' }}>参考物料查看</span>
                </div>
                <div style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>查看任务相关参考资料</div>
              </div>

              {/* 一键重置 */}
              <div 
                onClick={handleReset}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }} onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
                }} onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Square size={14} color="#ef4444" />
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>一键重置</span>
                </div>
                <div style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>清空用户内容，保持任务描述</div>
              </div>

              {/* 心法回顾 */}
              <div style={{
                background: 'rgba(220, 20, 60, 0.1)',
                border: '1px solid rgba(220, 20, 60, 0.3)',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }} onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(220, 20, 60, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(220, 20, 60, 0.3)';
              }} onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(220, 20, 60, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={14} color="#dc143c" />
                  <span style={{ color: '#dc143c', fontSize: 12, fontWeight: 'bold' }}>心法回顾</span>
                </div>
                <div style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>回顾当前任务的核心要点</div>
              </div>
            </div>
          </div>
        ) : (
          // 收缩状态
          <button
            onClick={() => setIsToolboxExpanded(true)}
            style={{
              width: 50,
              height: 50,
              background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
              border: '1px solid #333',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffd700',
              boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
              borderImage: 'linear-gradient(45deg, #ffd700, #b8860b) 1'
            }}
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes toolboxSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toolboxSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes confetti {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes zoomIn {
          0% { transform: rotate(-15deg) scale(0.5); opacity: 0; }
          100% { transform: rotate(-15deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LabPage;