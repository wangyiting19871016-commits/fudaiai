import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Video, FileText, Save, Cpu, Loader2, Volume2, VolumeX, Mic, Square } from 'lucide-react';
// 确保这里引用的是正确的服务文件路径
import { generateMissionSteps } from '../services/aiService';

// 直接在全局作用域定义这个变量，彻底终结 ts(2304) 
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const EditorPage = () => {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [videoUrl, setVideoUrl] = useState('');
  const [videoScript, setVideoScript] = useState(''); // 视频事实/脚本
  const [mindset, setMindset] = useState(''); // 核心心法/备注
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // --- 编辑态状态管理 ---
  // 使用 any 避免复杂的嵌套类型报错
  const [missionData, setMissionData] = useState<any>(null);
  
  // --- TTS 语音生成器状态 ---
  const [isPlaying, setIsPlaying] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // --- 实时语音识别状态 ---
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  // --- 真实 API 触发 ---
  const handleAnalyze = async () => {
    if (!videoScript.trim()) {
      alert("请填写【视频事实/脚本】内容（必填）");
      return;
    }

    setIsAnalyzing(true);
    setLogs(["正在握手 DeepSeek API...", "正在传输视频物料与脚本...", "AI 正在生成真迹协议任务包..."]);
    
    try {
      // 调用 AI 接口
      const missionPackage = await generateMissionSteps(videoScript, videoUrl, mindset);
      
      // 检查新的任务包结构（兼容新旧格式）
      if (!missionPackage || !missionPackage.steps) {
        throw new Error("AI 返回的任务包格式不正确，缺少必要字段");
      }
      
      // 保存到编辑态状态
      setMissionData({
        title: missionPackage.title || "未命名任务",
        tags: missionPackage.tags || [],
        reference_material: missionPackage.reference_material || {
          type: "MARKDOWN",
          content: `# 基于素材生成的任务包\n\n**原始素材:** ${videoScript}\n\n**核心心法:** ${mindset || "无特殊备注"}`
        },
        steps: missionPackage.steps.map((step: any, index: number) => ({
          step_id: step.step_id || index + 1,
          type: step.type || "TEXT_INPUT",
          title: step.title || `步骤 ${index + 1}`,
          action_instruction: step.action_instruction || "",
          evidence_desc: step.evidence_desc || "",
          interaction: {
            question: step.interaction?.question || "",
            correct_answers: step.interaction?.correct_answers || [],
            hint: step.interaction?.hint || "",
            error_feedback: step.interaction?.error_feedback || ""
          }
        }))
      });
      
      setLogs(prev => [...prev, `数字技能任务包生成成功！任务标题: ${missionPackage.title}`]);
    } catch (error: any) {
      console.error(error);
      setLogs(prev => [...prev, `❌ 错误: ${error.message}`]);
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- TTS 语音生成器功能 ---
  const handleTTSPlay = () => {
    if (!videoScript.trim()) {
      alert("请先填写【视频事实/脚本】内容");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(videoScript);
    utterance.rate = 0.9;
    utterance.lang = 'zh-CN';

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      setIsPlaying(false);
      console.error("TTS error:", event);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // --- 实时语音识别功能 ---
  const handleStartRecording = () => {
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      if (finalTranscript) {
        setVideoScript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- 发布逻辑 ---
  const handlePublish = () => {
    if (!missionData || !missionData.steps) {
      alert("请先生成任务数据");
      return;
    }
    
    // 构建标准的"真迹协议"数据结构
    const newMission = {
      id: `custom_${Date.now()}`,
      title: missionData.title,
      description: videoScript,
      notes: mindset,
      type: "MIXED",
      createdAt: new Date().toISOString(),
      
      // 【关键补丁】确保代码卡在最外层，P3 实验台才能一眼看到
      reference_material: missionData.reference_material || { type: "MARKDOWN", content: "" },

      steps: missionData.steps.map((step: any) => ({
        ...step,
        // 兼容 P3 校验逻辑
        verify_key: step.interaction?.correct_answers || [],
        interaction: step.interaction
      }))
    };

    const existing = JSON.parse(localStorage.getItem('custom_missions') || '[]');
    localStorage.setItem('custom_missions', JSON.stringify([...existing, newMission]));
    
    alert("✅ 发布成功！代码已同步至协议根目录。");
    navigate('/');
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex' }}>
      
      {/* 返回按钮 */}
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, background: '#222', border: '1px solid #333', borderRadius: '50%', padding: 10, color: '#fff', cursor: 'pointer' }}>
        <ArrowLeft size={20} />
      </button>

      {/* 左舱: 输入区 */}
      <div style={{ width: '40%', height: '100%', borderRight: '1px solid #222', background: '#050505', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '80px 40px 120px 40px', overflowY: 'auto', flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: '900', marginBottom: 10 }}>MISSION <span style={{ color: '#06b6d4' }}>FOUNDRY</span></h1>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 30 }}>真迹协议铸造厂：通过 AI 提取实战原子任务</p>

          <div style={{ marginBottom: 25 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 'bold' }}><Video size={14}/> 视频源 (URL/PATH)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="粘贴视频链接..." style={{ width: '100%', padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
          </div>

          {/* 模块 A: 视频事实/脚本 */}
          <div style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#06b6d4', fontWeight: 'bold' }}>
                <FileText size={14}/> 【视频事实/脚本】 (必填)
                <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
              </label>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: isRecording ? '#ef4444' : '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isRecording ? <Square size={12} /> : <Mic size={12} />}
                  {isRecording ? '停止采集' : '实时采集'}
                </button>
                <button 
                  onClick={handleTTSPlay}
                  disabled={!videoScript.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: isPlaying ? '#ef4444' : '#06b6d4', color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 'bold', cursor: videoScript.trim() ? 'pointer' : 'not-allowed', opacity: videoScript.trim() ? 1 : 0.5 }}
                >
                  {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {isPlaying ? '停止播放' : '合成测试'}
                </button>
              </div>
            </div>
            
            <textarea 
              value={videoScript} 
              onChange={e => setVideoScript(e.target.value)} 
              placeholder="输入任务意图，例如：教我用 HTML 写一个粉色的贪吃蛇..." 
              style={{ width: '100%', height: 200, padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
            />
          </div>

          {/* 模块 B: 核心心法 */}
          <div style={{ marginBottom: 25 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 'bold' }}>
              <FileText size={14}/> 【核心心法/备注】 (选填)
            </label>
            <textarea 
              value={mindset} 
              onChange={e => setMindset(e.target.value)} 
              placeholder="备注..." 
              style={{ width: '100%', height: 120, padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
            />
          </div>
        </div>

        {/* 启动按钮 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '30px 40px', background: 'linear-gradient(to top, #050505 80%, transparent)' }}>
          <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ width: '100%', padding: 18, background: isAnalyzing ? '#222' : '#06b6d4', color: isAnalyzing ? '#666' : '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16, cursor: isAnalyzing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {isAnalyzing ? <><Loader2 className="animate-spin" size={20}/> 协议生成中...</> : <><Sparkles size={20}/> 启动 DEEPSEEK 协议</>}
          </button>
        </div>
      </div>

      {/* 右舱: 编辑态预览 */}
      <div style={{ width: '60%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', padding: '80px 60px', overflowY: 'auto' }}>
        
        {!missionData && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.3 }}>
            {isAnalyzing ? (
              <div style={{ fontFamily: 'monospace', width: '100%', maxWidth: 450 }}>
                {logs.map((log, i) => <div key={i} style={{ marginBottom: 8, color: '#06b6d4' }}>{`> ${log}`}</div>)}
              </div>
            ) : (
              <>
                <Cpu size={60} style={{ marginBottom: 20 }} />
                <p style={{ letterSpacing: 2 }}>AWAITING NEURAL INPUT...</p>
              </>
            )}
          </div>
        )}
        
        {missionData && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={20} className="text-cyan-500" /> 真迹协议任务包 - 编辑模式
            </h2>
            
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#06b6d4', fontWeight: 'bold', marginBottom: 8 }}>任务标题</label>
              <input 
                value={missionData.title} 
                onChange={e => setMissionData({...missionData, title: e.target.value})}
                style={{ width: '100%', padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff' }} 
              />
            </div>
            
            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#10b981', fontWeight: 'bold', marginBottom: 8 }}>情报卡内容 (Markdown)</label>
              <textarea 
                value={missionData.reference_material?.content || ""} 
                onChange={e => setMissionData({
                  ...missionData, 
                  reference_material: {...missionData.reference_material, content: e.target.value}
                })}
                style={{ width: '100%', height: 150, padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
              />
            </div>
            
            <div style={{ marginBottom: 25 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <label style={{ fontSize: 12, color: '#f59e0b', fontWeight: 'bold' }}>步骤列表</label>
                <button 
                  onClick={() => {
                    const newStep = {
                      step_id: (missionData.steps?.length || 0) + 1,
                      type: "TEXT_INPUT",
                      title: "新步骤",
                      action_instruction: "",
                      evidence_desc: "",
                      interaction: { question: "", correct_answers: [], hint: "", error_feedback: "" }
                    };
                    setMissionData({...missionData, steps: [...(missionData.steps || []), newStep]});
                  }}
                  style={{ padding: '8px 16px', background: '#06b6d4', color: '#000', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + 新增步骤
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {missionData.steps?.map((step: any, idx: number) => (
                  <div key={idx} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: 20, position: 'relative' }}>
                    <button 
                      onClick={() => {
                        const newSteps = missionData.steps.filter((_: any, i: number) => i !== idx);
                        setMissionData({...missionData, steps: newSteps});
                      }}
                      style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, fontSize: 12, cursor: 'pointer' }}
                    >
                      ×
                    </button>
                    
                    <div style={{ color: '#06b6d4', fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>STEP {step.step_id} - {step.type}</div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>步骤标题</label>
                      <input 
                        value={step.title} 
                        onChange={e => {
                          const newSteps = [...missionData.steps];
                          newSteps[idx] = {...step, title: e.target.value};
                          setMissionData({...missionData, steps: newSteps});
                        }}
                        style={{ width: '100%', padding: 10, background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', fontSize: 14 }} 
                      />
                    </div>

                    {/* ... 动作指令 ... */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>动作指令</label>
                        <textarea
                            value={step.action_instruction}
                            onChange={e => {
                                const newSteps = [...missionData.steps];
                                newSteps[idx] = {...step, action_instruction: e.target.value};
                                setMissionData({...missionData, steps: newSteps});
                            }}
                            style={{ width: '100%', height: 60, padding: 10, background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', fontSize: 14 }}
                        />
                    </div>

                    {/* ... 验证问题 ... */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#ef4444', marginBottom: 4 }}>验证问题 (Question)</label>
                        <input
                            value={step.interaction?.question || ""}
                            onChange={e => {
                                const newSteps = [...missionData.steps];
                                newSteps[idx] = {
                                    ...step,
                                    interaction: { ...step.interaction, question: e.target.value }
                                };
                                setMissionData({...missionData, steps: newSteps});
                            }}
                            style={{ width: '100%', padding: 10, background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', fontSize: 14 }}
                        />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: 'auto', borderTop: '1px solid #222', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handlePublish} 
            disabled={!missionData || !missionData.steps || missionData.steps.length === 0}
            style={{ padding: '15px 40px', background: !missionData ? '#666' : '#fff', color: !missionData ? '#999' : '#000', border: 'none', borderRadius: 50, fontWeight: 'bold', cursor: !missionData ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Save size={18} /> {!missionData ? '等待任务生成' : '签署并发布真迹'}
          </button>
        </div>
      </div>
      
      {/* --- 紧急强制保存按钮 (已修复) --- */}
      <button 
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, padding: '20px 40px', backgroundColor: 'red', color: 'white', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', boxShadow: '0 0 20px rgba(255,0,0,0.5)', border: '2px solid white' }} 
        onClick={() => { 
          // 修复点：使用 missionData 代替 generatedSteps
          if (!missionData || !missionData.steps || missionData.steps.length === 0) { 
            alert('内存中没有数据！请先点击生成'); 
            return; 
          } 
          const missionToSave = {
            id: `force_save_${Date.now()}`,
            title: missionData.title || "未命名任务",
            description: videoScript,
            notes: mindset,
            // 【关键补丁】确保代码卡在最外层，P3 实验台才能一眼看到
            reference_material: missionData.reference_material || { type: "MARKDOWN", content: "" },
            steps: missionData.steps.map((s: any) => ({ ...s, verify_key: s.interaction?.correct_answers || s.verify_key || 'ANY' })), 
            type: "MIXED",
            createdAt: new Date().toISOString()
          }; 
          const existing = JSON.parse(localStorage.getItem('custom_missions') || '[]'); 
          existing.push(missionToSave); 
          localStorage.setItem('custom_missions', JSON.stringify(existing)); 
          alert('✅ 暴力保存成功！代码已同步至协议根目录。'); 
          window.location.href = '/'; 
        }} 
      > 
        🚨 强制发布 (DEBUG) 
      </button> 
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default EditorPage;