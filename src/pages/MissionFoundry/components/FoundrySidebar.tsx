import React from 'react';
import { Sparkles, Video, FileText, Cpu, Loader2, Upload, Save, Monitor, Square } from 'lucide-react';

interface FoundrySidebarProps {
  // 状态
  mediaUrl: string;
  instruction: string;
  audioTrackName: string;
  verifyType: string;
  matchKeyword: string;
  isAnalyzing: boolean;
  logs: string[];
  uploadedFile: File | null;
  draftMission: any;
  isManualMode: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isScreenCapturing: boolean;
  capturedVideoUrl: string;
  verification: { type: string; keyword: string } | any;
  
  // 方法
  handleFormChange: (field: string, value: any) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: () => Promise<void>;
  handleSignAndRelease: () => void;
  handleIdentifyKeyFrames: () => Promise<void>;
  setIsManualMode: (isManual: boolean) => void;
  handleStartScreenCapture: () => Promise<void>;
  handleStopScreenCapture: () => Promise<void>;
}

const FoundrySidebar: React.FC<FoundrySidebarProps> = ({
  mediaUrl,
  instruction,
  audioTrackName,
  verifyType,
  matchKeyword,
  isAnalyzing,
  logs,
  uploadedFile,
  draftMission,
  isManualMode,
  fileInputRef,
  isScreenCapturing,
  capturedVideoUrl,
  handleFormChange,
  handleFileUpload,
  handleAnalyze,
  handleSignAndRelease,
  handleIdentifyKeyFrames,
  setIsManualMode,
  handleStartScreenCapture,
  handleStopScreenCapture
}) => {
  return (
    <div style={{
        flex: '0 0 25%',
        height: '100%',
        borderRight: '1px solid #222',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 40px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
      <h1 style={{ fontSize: 28, fontWeight: '900', marginBottom: 10 }}>MISSION <span style={{ color: '#06b6d4' }}>FOUNDRY</span></h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 30 }}>真迹协议铸造厂：通过 AI 提取实战原子任务</p>
      
      {/* 双模切换控制台 */}
      <div style={{
        marginBottom: 30,
        background: '#111',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 20
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={16}/> 任务生成模式
        </h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setIsManualMode(false)} 
            style={{
              flex: 1,
              padding: 12,
              background: !isManualMode ? '#06b6d4' : '#000',
              color: !isManualMode ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} 
          >
            🤖 AI 智能拆解
          </button>
          <button 
            onClick={() => setIsManualMode(true)} 
            style={{
              flex: 1,
              padding: 12,
              background: isManualMode ? '#06b6d4' : '#000',
              color: isManualMode ? '#000' : '#fff',
              border: '1px solid #444',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} 
          >
            ✏️ 手动自由创建
          </button>
        </div>
      </div>

      {/* 启动 DeepSeek 入口 */}
      <div style={{ marginBottom: 30 }}>
        <button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing} 
          style={{
            width: '100%',
            padding: '12px 20px',
            height: '42px',
            background: isAnalyzing ? '#222' : '#06b6d4',
            color: isAnalyzing ? '#666' : '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 14,
            cursor: isAnalyzing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          {isAnalyzing ? <><Loader2 className="animate-spin" size={16}/> 生成中...</> : <><Sparkles size={16}/> 启动 3-10 步 DeepSeek</>}
        </button>
      </div>

      {/* 任务配置面板 */}
      <div style={{ marginBottom: 25, background: '#111', border: '1px solid #333', borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={16}/> 任务配置面板
        </h3>
        
        {/* Media URL */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            <Video size={14}/> Media URL
            <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
          </label>
          <input 
            value={mediaUrl} 
            onChange={e => handleFormChange('mediaUrl', e.target.value)} 
            placeholder="粘贴 YouTube/Bilibili 链接..." 
            style={{ width: '100%', padding: 15, background: '#000', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 10 }} 
          />
        </div>
        
        {/* 任务指令 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            <FileText size={14}/> 任务指令
            <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
          </label>
          <textarea 
            value={instruction} 
            onChange={e => handleFormChange('instruction', e.target.value)} 
            placeholder="例如：请观看视频第 2 分钟，将代码中的 speed 变量修改为 50..." 
            style={{ width: '100%', height: 120, padding: 15, background: '#000', border: '1px solid #444', borderRadius: 8, color: '#fff', resize: 'none', lineHeight: 1.6 }} 
          />
        </div>
        
        {/* 音轨名 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            <FileText size={14}/> 音轨名
          </label>
          <input 
            value={audioTrackName} 
            onChange={e => handleFormChange('audioTrackName', e.target.value)} 
            placeholder="例如：主声道、背景音乐..." 
            style={{ width: '100%', padding: 15, background: '#000', border: '1px solid #444', borderRadius: 8, color: '#fff' }} 
          />
        </div>
        
        {/* 验证逻辑 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            <FileText size={14}/> 验证逻辑
            <span style={{ color: '#ef4444', fontSize: 10 }}>●</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <select 
              value={verifyType} 
              onChange={e => handleFormChange('verifyType', e.target.value)} 
              style={{ padding: 15, background: '#000', border: '1px solid #444', borderRadius: 8, color: '#fff', width: 150 }} 
            >
              <option value="TEXT">TEXT (文本验证)</option>
              <option value="SCREEN">SCREEN (屏幕验证)</option>
              <option value="VOICE">VOICE (语音验证)</option>
            </select>
            <input 
              value={matchKeyword} 
              onChange={e => handleFormChange('matchKeyword', e.target.value)} 
              placeholder="匹配关键词..." 
              style={{ flex: 1, padding: 15, background: '#000', border: '1px solid #444', borderRadius: 8, color: '#fff' }} 
            />
          </div>
        </div>
        
          {/* 吞噬站 - 全窗捕捉功能 */}
          <div style={{ marginBottom: 20, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 12, fontWeight: 'bold' }}>
            <Monitor size={14}/> 吞噬站 (Feeder) - 全窗捕捉
            <span style={{ color: isScreenCapturing ? '#ef4444' : '#06b6d4', fontSize: 10 }}>●</span>
          </label>
          
          {/* 音频捕捉提示 */}
          <div style={{ marginBottom: 15, padding: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', fontSize: 12 }}>
            ⚠️ 请务必勾选弹出框左下角的「分享系统音频」，否则将无法获取声音。
          </div>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
            <button 
              onClick={handleStartScreenCapture} 
              disabled={isScreenCapturing}
              style={{
                flex: 1,
                padding: 15,
                background: !isScreenCapturing ? '#06b6d4' : '#333',
                color: !isScreenCapturing ? '#000' : '#666',
                border: '1px solid #444',
                borderRadius: 8,
                cursor: isScreenCapturing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }} 
            >
              <Monitor size={14}/> {isScreenCapturing ? '捕捉中...' : '开启捕捉'}
            </button>
            <button 
              onClick={handleStopScreenCapture} 
              disabled={!isScreenCapturing}
              style={{
                flex: 1,
                padding: 15,
                background: isScreenCapturing ? '#ef4444' : '#333',
                color: isScreenCapturing ? '#fff' : '#666',
                border: '1px solid #444',
                borderRadius: 8,
                cursor: !isScreenCapturing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }} 
            >
              <Square size={14}/> 停止捕捉
            </button>
          </div>
          
          {capturedVideoUrl && (
            <div style={{
              padding: 12,
              background: '#000',
              border: '1px solid #444',
              borderRadius: 8,
              color: '#06b6d4',
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Video size={14}/> 已捕获视频素材
            </div>
          )}
        </div>
        
        {/* 文件上传区 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>
            <Upload size={14}/> 本地上传补给站
            <span style={{ color: '#f59e0b', fontSize: 10 }}>●</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              style={{
                padding: 15,
                background: '#000',
                border: '1px solid #444',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }} 
            >
              <Upload size={14}/> 选择文件
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="audio/mp3,video/mp4,image/jpg,image/jpeg,image/png,image/webp" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            {uploadedFile && (
              <div style={{
                flex: 1,
                padding: 10,
                background: '#000',
                border: '1px solid #444',
                borderRadius: 8,
                color: '#06b6d4',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                {/* 如果是图片文件，显示缩略图 */}
                {uploadedFile.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(uploadedFile)} 
                    alt={uploadedFile.name} 
                    style={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid #444'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: 60,
                    height: 60,
                    background: '#111',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #444'
                  }}>
                    {uploadedFile.type.startsWith('audio/') ? (
                      <audio style={{ width: 40 }} controls />
                    ) : (
                      <video style={{ width: 40 }} controls />
                    )}
                  </div>
                )}
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {uploadedFile.name}
                </span>
              </div>
            )}
          </div>
          
          {/* AI 识别关键帧按钮 - 仅当有媒体 URL 或已上传文件时显示 */}
          {(mediaUrl.trim() || uploadedFile || capturedVideoUrl) && (
            <button 
              onClick={handleIdentifyKeyFrames} 
              style={{
                width: '100%',
                marginTop: 15,
                padding: 15,
                background: '#000',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14
              }}
            >
              <Sparkles size={16}/> AI 识别关键帧
            </button>
          )}
        </div>
        
        {/* 日志区 */}
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: 20, maxHeight: '200px', overflowY: 'auto', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#06b6d4', marginBottom: 15 }}>操作日志</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log, index) => (
              <div key={index} style={{ fontSize: 12, color: '#fff', lineHeight: 1.5 }}>
                {log}
              </div>
            ))}
          </div>
        </div>
        
      </div>
      
      {/* 固定在左栏底部的【签署并发布真迹】按钮 */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 20,
        borderTop: '1px solid #222'
      }}>
        <button 
          onClick={handleSignAndRelease} 
          style={{
            width: '100%',
            padding: '15px 20px',
            background: '#06b6d4',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
            transition: 'all 0.2s ease'
          }}
          disabled={draftMission.steps.length === 0}
        >
          <Save size={20} />
          签署并发布真迹
        </button>
        {draftMission.steps.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: 12,
            marginTop: 10
          }}>
            请至少添加一个任务步骤
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundrySidebar;