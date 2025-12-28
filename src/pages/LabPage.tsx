import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle, Monitor, Activity, Zap, FileText, Headphones, Play, Square, Settings, BookOpen, Heart } from 'lucide-react';

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
  const [isVerified, setIsVerified] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // F. 页面内容（视频、标题、心法描述）必须实时指向 mission.steps[currentSubStep]
  const hasSubSteps = targetMission && targetMission.steps && Array.isArray(targetMission.steps) && targetMission.steps.length > 0;
  const steps = targetMission?.steps || [];
  const currentStep = hasSubSteps ? targetMission.steps[currentSubStep] : targetMission;

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
      setIsVerified(false);
      setInputText('');
      setAudioData(null);
      setIsRecording(false);
      console.log("【状态锁定】任务切换，重置所有状态为初始值");
    }
  }, [stepId, localMissions, targetMission?.id]);

  // 【状态锁定】监听 currentSubStep 变化，保存到 sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`current_step_index_${stepId}`, currentSubStep.toString());
      console.log("【状态锁定】保存步骤索引到 sessionStorage:", currentSubStep);
    }
  }, [currentSubStep, stepId]);

  // --- 3. 自动流转 ---
  useEffect(() => {
    let timer: any;
    if (isVerified) {
      timer = setTimeout(() => {
        handleNextStep(undefined);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isVerified]);

  const handleNextStep = (e?: React.MouseEvent) => {
    // 【状态锁定】防止表单默认行为和事件冒泡
    e?.preventDefault();
    e?.stopPropagation();
    
    // 1. 获取当前任务包
    const mission = targetMission;
    const steps = mission?.steps || [];
    
    // 调试日志：显示当前进度
    console.log("【状态锁定】当前步骤:", currentSubStep, "/ 总步骤:", steps.length);
    
    if (currentSubStep < steps.length - 1) {
      // 【关键】强行推进到下一子步骤
      setCurrentSubStep(prev => {
        const nextStep = prev + 1;
        console.log("【逻辑锁定】推进到下一步:", nextStep);
        return nextStep;
      });
      
      // 重置所有状态
      setIsVerified(false);
      setInputText('');
      setAudioData(null);
      setIsRecording(false);
      
      // 原子任务积分：每个子步骤完成后给 100 分
      const oldScore = parseInt(localStorage.getItem('user_points') || '0');
      const newScore = oldScore + 100;
      localStorage.setItem('user_points', newScore.toString());
      console.log("【逻辑锁定】原子任务完成，积分 +100，当前总分:", newScore);
       
     } else {
       // 【关键】所有子步骤完成，结算积分
       const oldScore = parseInt(localStorage.getItem('user_points') || '0');
       const newScore = oldScore + 500; // 整个任务包完成给500分
       localStorage.setItem('user_points', newScore.toString());
      
      console.log("【逻辑锁定】任务包完成，积分 +500，当前总分:", newScore);
      
      // 记录任务完成状态
      localStorage.setItem(`completed_step_${mission.id}`, 'true');
      
      alert("真迹协议全流程达成！获得 500 积分");
      // 强行刷新回首页，触发大树重载
      window.location.href = '/';
    }
  };

  // --- 智能工具箱状态 ---
  const [isToolboxExpanded, setIsToolboxExpanded] = useState(true);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- 逻辑适配：根据type字段动态渲染组件 ---
  const handleVerify = () => {
    // TEXT任务：检查输入框内容
    if (currentStep.type === 'TEXT' && !inputText.trim()) {
      return;
    }
    // VOICE任务：检查录音数据
    if (currentStep.type === 'VOICE' && !audioData) {
      return;
    }
    setIsVerified(true);
  };

  // --- 录音功能 ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioData(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('录音启动失败:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const themeColor = currentStep.color || "#06b6d4";
  const displayType = (currentStep.type || 'TEXT').toUpperCase();

  // --- 4. 视觉渲染 (完全保留刚才满意的内联样式) ---
  return (
    <div style={{
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
        position: 'relative'
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
            PROTOCOL {String(currentStep.id).padStart(2, '0')}
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
      </div>

      {/* === 右舱 (55%) === */}
      <div key={`right-panel-${currentSubStep}`} style={{ 
        width: '55%', height: '100%', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000'
      }}>
        {/* 网格背景 */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15,
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          
          {/* 动态渲染：根据type字段显示不同组件 */}
          {displayType === 'TEXT' ? (
            // TEXT模式：黑金风格文本输入框
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666' }}>
                <FileText size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>TEXT INPUT REQUIRED</span>
              </div>
              <textarea 
                value={inputText} onChange={e => setInputText(e.target.value)}
                placeholder={`验证核心参数: ${currentStep.key}`}
                style={{ 
                  width: '100%', height: 160, background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)', 
                  border: '1px solid #333', borderRadius: 16, padding: 20, color: '#fff', fontSize: 18, 
                  outline: 'none', resize: 'none', fontFamily: 'sans-serif',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  borderImage: 'linear-gradient(45deg, #ffd700, #b8860b) 1'
                }}
              />
              <button 
                onClick={handleVerify} disabled={!inputText.trim() || isVerified}
                style={{ 
                  width: '100%', marginTop: 25, padding: 18, 
                  background: isVerified ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)', 
                  color: isVerified ? '#fff' : '#000', 
                  border: 'none', borderRadius: 16, 
                  fontWeight: 'bold', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s',
                  opacity: !inputText.trim() && !isVerified ? 0.5 : 1,
                  boxShadow: isVerified ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
                }}
              >
                {isVerified ? 'VERIFIED' : '确认提交'}
              </button>
            </div>
          ) : displayType === 'VOICE' ? (
            // VOICE模式：录音组件（保持呼吸灯样式）
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15, color: '#666', justifyContent: 'center' }}>
                <Mic size={16} /> <span style={{ fontSize: 12, fontWeight: 'bold' }}>VOICE RECORDING REQUIRED</span>
              </div>
              
              {/* 录音按钮 */}
              <div 
                onClick={isRecording ? stopRecording : startRecording}
                style={{ 
                  width: 180, height: 180, borderRadius: '50%', cursor: 'pointer',
                  background: isRecording ? '#ef4444' : audioData ? '#10b981' : '#0a0a0a',
                  border: `1px solid ${isRecording ? '#ef4444' : audioData ? '#10b981' : '#333'}`,
                  boxShadow: isRecording ? '0 0 80px rgba(239,68,68,0.5)' : audioData ? '0 0 80px rgba(16,185,129,0.5)' : `0 0 40px ${themeColor}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative', margin: '0 auto'
                }}
              >
                {!isRecording && !audioData && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${themeColor}`, opacity: 0.3, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>}
                {isRecording ? (
                  <Square size={60} color="#fff" />
                ) : audioData ? (
                  <Play size={60} color="#fff" />
                ) : (
                  <Mic size={60} color="#666" />
                )}
              </div>
              
              {/* 录音状态显示 */}
              <div style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
                {isRecording ? '录音中...' : audioData ? '录音完成' : '点击开始录音'}
              </div>
              
              <button 
                onClick={handleVerify} disabled={!audioData || isVerified}
                style={{ 
                  width: '100%', marginTop: 25, padding: 18, 
                  background: isVerified ? '#10b981' : 'linear-gradient(135deg, #ffd700, #b8860b)', 
                  color: isVerified ? '#fff' : '#000', 
                  border: 'none', borderRadius: 16, 
                  fontWeight: 'bold', fontSize: 16, cursor: 'pointer', transition: 'all 0.2s',
                  opacity: (!audioData && !isVerified) ? 0.5 : 1,
                  boxShadow: isVerified ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(255,215,0,0.3)'
                }}
              >
                {isVerified ? 'VERIFIED' : '确认提交'}
              </button>
            </div>
          ) : (
            // 其他模式（SCREEN等）
            <>
              <div 
                onClick={() => setIsVerified(true)}
                style={{ 
                  width: 180, height: 180, borderRadius: '50%', cursor: 'pointer',
                  background: isVerified ? '#10b981' : '#0a0a0a',
                  border: `1px solid ${isVerified ? '#10b981' : '#333'}`,
                  boxShadow: isVerified ? '0 0 80px rgba(16,185,129,0.5)' : `0 0 40px ${themeColor}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative'
                }}
              >
                {!isVerified && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${themeColor}`, opacity: 0.3, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>}
                {isVerified ? (
                  <CheckCircle size={80} color="#fff" />
                ) : (
                  <Monitor size={60} color="#666" />
                )}
              </div>
              <div style={{ marginTop: 50, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#555', letterSpacing: 3, marginBottom: 10 }}>TARGET KEY</p>
                <h2 style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>"{currentStep.key}"</h2>
              </div>
            </>
          )}

          {/* 验证成功印章 */}
          {isVerified && (
             <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 100 }}>
               <div style={{ border: '6px solid #ef4444', color: '#ef4444', padding: '15px 50px', fontSize: 60, fontWeight: 900, transform: 'rotate(-15deg)', opacity: 1, textShadow: '0 0 20px rgba(239,68,68,0.5)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
                 验证成功
               </div>
             </div>
          )}

        </div>
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
        @keyframes toolboxSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toolboxSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LabPage;