import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Video, FileText, Save, Cpu, Loader2, Volume2, VolumeX, Mic, Square } from 'lucide-react';
import { generateMissionSteps } from '../services/aiService';

// 直接在全局作用域定义这个变量，彻底终结 ts(2304) 
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;

const EditorPage = () => {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [videoUrl, setVideoUrl] = useState('');
  const [videoScript, setVideoScript] = useState(''); // 视频事实/脚本
  const [mindset, setMindset] = useState(''); // 核心心法/备注
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
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
    setLogs(["正在握手 DeepSeek API...", "正在传输视频物料与脚本...", "AI 正在像素级拆解..."]);
    
    try {
      const steps = await generateMissionSteps(videoUrl, videoScript, mindset);
      setGeneratedSteps(steps);
      setLogs(prev => [...prev, "原子任务生成成功！请在右侧查阅。"]);
    } catch (error: any) {
      console.error(error);
      setLogs(prev => [...prev, `❌ 错误: ${error.message}`]);
      alert(`拆解失败: ${error.message}`);
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

    // 如果正在播放，先停止
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // 创建新的语音合成实例
    const utterance = new SpeechSynthesisUtterance(videoScript);
    
    // 配置语音参数
    utterance.rate = 0.9; // 语速稍慢，便于跟读
    utterance.pitch = 1.0; // 音调正常
    utterance.volume = 0.8; // 音量适中
    utterance.lang = 'zh-CN'; // 中文语音

    // 设置事件监听器
    utterance.onstart = () => {
      setIsPlaying(true);
      console.log("TTS 语音开始播放");
    };

    utterance.onend = () => {
      setIsPlaying(false);
      console.log("TTS 语音播放结束");
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      console.error("TTS 语音播放错误:", event);
      alert("语音合成失败，请检查浏览器是否支持语音合成功能");
    };

    // 保存引用并开始播放
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // --- 实时语音识别功能 ---
  const handleStartRecording = () => {
    // 检查浏览器是否支持语音识别
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器");
      return;
    }

    // 创建语音识别实例
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // 配置识别参数
    recognition.continuous = true; // 持续识别
    recognition.interimResults = true; // 显示中间结果
    recognition.lang = 'zh-CN'; // 中文识别

    // 设置事件监听器
    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      console.log("语音识别开始");
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // 更新转录内容
      setTranscript(prev => prev + finalTranscript);
      
      // 实时更新到视频事实框
      if (finalTranscript) {
        setVideoScript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("语音识别错误:", event.error);
      if (event.error === 'not-allowed') {
        alert("请允许浏览器访问麦克风权限");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log("语音识别结束");
    };

    // 开始识别
    try {
      recognition.start();
    } catch (error) {
      console.error("语音识别启动失败:", error);
      alert("语音识别启动失败，请检查麦克风权限");
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- 发布逻辑 ---
  const handlePublish = () => {
    if (generatedSteps.length === 0) return;
    
    const missionId = `custom_${Date.now()}`;
    const newMission = {
      id: missionId,
      title: videoScript.slice(0, 15) + "...",
      description: videoScript,
      notes: mindset, // 保存心法作为备注
      steps: generatedSteps,
      type: "MIXED",
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('custom_missions') || '[]');
    localStorage.setItem('custom_missions', JSON.stringify([...existing, newMission]));
    
    alert("真迹协议已签署，正在存入任务基地！");
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

          {/* 模块 A: 视频事实/脚本 (必填) */}
          <div style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#06b6d4', fontWeight: 'bold' }}>
                <FileText size={14}/> 【视频事实/脚本】 (必填)
                <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
              </label>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {/* 实时采集音频事实按钮 */}
                <button 
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: isRecording ? '#ef4444' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = isRecording ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isRecording ? <Square size={12} /> : <Mic size={12} />}
                  {isRecording ? '停止采集' : '实时采集音频事实'}
                </button>
                
                {/* 合成测试音频按钮 */}
                <button 
                  onClick={handleTTSPlay}
                  disabled={!videoScript.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: isPlaying ? '#ef4444' : '#06b6d4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 'bold',
                    cursor: videoScript.trim() ? 'pointer' : 'not-allowed',
                    opacity: videoScript.trim() ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (videoScript.trim()) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (videoScript.trim()) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  {isPlaying ? '停止播放' : '合成测试音频'}
                </button>
              </div>
            </div>
            
            <textarea 
              value={videoScript} 
              onChange={e => setVideoScript(e.target.value)} 
              placeholder="粘贴从 YouTube 或 B站 导出的台词、字幕、或具体的动作描述..." 
              style={{ width: '100%', height: 200, padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
            />
            
            {/* 功能说明和教程链接 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ color: '#666', fontSize: 10 }}>
                {isRecording ? (
                  <span style={{ color: '#10b981' }}>🎤 实时采集中... 请播放视频音频或口述画面</span>
                ) : isPlaying ? (
                  <span style={{ color: '#06b6d4' }}>🔊 语音播放中...</span>
                ) : (
                  <span>💡 实时采集：播放视频音频或口述画面 → 合成测试：生成语音用于影子练习</span>
                )}
              </div>
              
              {/* 实时转录预览 */}
              {isRecording && transcript && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 8,
                  fontSize: 10,
                  color: '#10b981',
                  zIndex: 10
                }}>
                  <strong>实时转录:</strong> {transcript}
                </div>
              )}
              
              <a 
                href="https://support.google.com/youtube/answer/100078?hl=zh-Hans" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#06b6d4', fontSize: 10, textDecoration: 'none', cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                📺 查看获取脚本教程
              </a>
            </div>
          </div>

          {/* 模块 B: 核心心法/备注 (选填) */}
          <div style={{ marginBottom: 25 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 'bold' }}>
              <FileText size={14}/> 【核心心法/备注】 (选填)
            </label>
            <textarea 
              value={mindset} 
              onChange={e => setMindset(e.target.value)} 
              placeholder="写下你对这段视频的特殊感悟或想要练习的重点..." 
              style={{ width: '100%', height: 120, padding: 15, background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
            />
            <div style={{ color: '#666', fontSize: 10, marginTop: 5 }}>
              用于辅助调整任务的难度和语气
            </div>
          </div>
        </div>

        {/* 悬浮启动按钮 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '30px 40px', background: 'linear-gradient(to top, #050505 80%, transparent)' }}>
          <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ width: '100%', padding: 18, background: isAnalyzing ? '#222' : '#06b6d4', color: isAnalyzing ? '#666' : '#000', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16, cursor: isAnalyzing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {isAnalyzing ? <><Loader2 className="animate-spin" size={20}/> 协议生成中...</> : <><Sparkles size={20}/> 启动 DEEPSEEK 协议</>}
          </button>
        </div>
      </div>

      {/* 右舱: 蓝图预览 */}
      <div style={{ width: '60%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', padding: '80px 60px', overflowY: 'auto' }}>
        {generatedSteps.length === 0 ? (
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
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={20} className="text-cyan-500" /> 协议蓝图 (BLUEPRINT)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {generatedSteps.map((step, idx) => (
                <div key={idx} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
                   <div style={{ color: '#06b6d4', fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>STEP {idx + 1} - {step.type}</div>
                   <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>{step.title}</h3>
                   <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 40, borderTop: '1px solid #222', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={handlePublish} style={{ padding: '15px 40px', background: '#fff', color: '#000', border: 'none', borderRadius: 50, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Save size={18} /> 签署并发布真迹
               </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default EditorPage;