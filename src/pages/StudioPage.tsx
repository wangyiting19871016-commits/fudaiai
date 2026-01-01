import React, { useState, useEffect } from 'react';
import LabPage from './LabPage';
import { missionDecompiler } from '../services/MissionDecompiler';
import { MissionProvider } from '../stores/MissionContext';

// 左侧配置面板组件 - 核心配置面板
const ConfigurationPanel = ({ 
  draftMission, 
  setDraftMission, 
  onGenerate, 
  generatedJson, 
  onUserInputChange, 
  userInput, 
  isGenerating,
  onFileUpload 
}: { 
  draftMission: any; 
  setDraftMission: (mission: any) => void;
  onGenerate: () => void; 
  generatedJson: any; 
  onUserInputChange: (input: string) => void;
  userInput: string;
  isGenerating: boolean;
  onFileUpload: (file: File, type: 'audio' | 'video') => void;
}) => {
  // 处理视频URL变化
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftMission(prev => ({
      ...prev,
      video: {
        ...prev.video,
        url: e.target.value
      }
    }));
  };

  // 处理指令变化
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftMission(prev => ({
      ...prev,
      instruction: e.target.value
    }));
  };

  // 处理音轨名称变化
  const handleTrackNameChange = (index: number, value: string) => {
    setDraftMission(prev => {
      const updatedTracks = [...(prev.audio?.tracks || [])];
      updatedTracks[index] = {
        ...updatedTracks[index],
        name: value
      };
      return {
        ...prev,
        audio: {
          ...prev.audio,
          tracks: updatedTracks
        }
      };
    });
  };

  // 处理关键帧预览时间变化
  const handleKeyframeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftMission(prev => ({
      ...prev,
      keyframePreviewTime: parseInt(e.target.value) || 0
    }));
  };

  return (
    <div style={{
      width: '450px',
      height: '100vh',
      backgroundColor: '#0f0f0f',
      borderRight: '1px solid #333',
      padding: '16px',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>工业化工作室</h2>

      {/* 必备字段 A - 任务配置 */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>必备字段 A [任务配置]</h3>
        
        {/* 视频URL输入 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '4px' }}>视频URL</label>
          <input
            type="text"
            value={draftMission.video?.url || ''}
            onChange={handleVideoUrlChange}
            placeholder="输入视频URL或B站链接"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 指令输入 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '4px' }}>指令</label>
          <textarea
            value={draftMission.instruction || ''}
            onChange={handleInstructionChange}
            placeholder="输入任务指令"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              height: '80px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* 关键帧预览时间 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '4px' }}>关键帧预览时间 (秒)</label>
          <input
            type="number"
            value={draftMission.keyframePreviewTime || 0}
            onChange={handleKeyframeTimeChange}
            placeholder="视频起始偏移时间"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* 必备字段 B - 原料包（文件上传） */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>必备字段 B [原料包]</h3>
        
        {/* 音频文件上传 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '4px' }}>音频文件 (MP3)</label>
          <input
            type="file"
            accept=".mp3"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file, 'audio');
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* 视频文件上传 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#ccc', fontSize: '14px', display: 'block', marginBottom: '4px' }}>视频文件 (MP4)</label>
          <input
            type="file"
            accept=".mp4"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file, 'video');
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* 音轨配置 */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>音轨配置</h3>
        
        {draftMission.audio?.tracks?.map((track: any, index: number) => (
          <div key={index} style={{
            marginBottom: '8px',
            display: 'flex',
            gap: '8px'
          }}>
            <label style={{
              color: '#ccc',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              minWidth: '60px'
            }}>
              音轨 {index + 1}:
            </label>
            <input
              type="text"
              value={track.name || `音轨 ${index + 1}`}
              onChange={(e) => handleTrackNameChange(index, e.target.value)}
              placeholder={`音轨 ${index + 1} 名称`}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
        ))}
      </div>

      {/* AI任务解析器 */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>AI任务解析器</h3>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <textarea
            placeholder="输入视频文案/教程文字或B站链接"
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
              height: '120px',
              resize: 'vertical',
              fontFamily: 'monospace'
            }}
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
          />
          <button
            onClick={onGenerate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#06b6d4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: isGenerating ? 0.6 : 1
            }}
            disabled={isGenerating || !userInput.trim()}
          >
            {isGenerating ? '生成中...' : '启动 DeepSeek'}
          </button>
        </div>
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          padding: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          fontSize: '12px',
          color: '#ddd',
          fontFamily: 'monospace'
        }}>
          {generatedJson ? JSON.stringify(generatedJson, null, 2) : '等待生成...'}
        </div>
      </div>
    </div>
  );
};

// 右侧P3镜像组件 - 嵌入式P3实验室
const P3Mirror = ({ draftMission }: { draftMission: any }) => (
  <div style={{
    flex: 1,
    height: '100vh',
    backgroundColor: '#111',
    overflow: 'hidden'
  }}>
    <MissionProvider formData={draftMission}>
      <LabPage />
    </MissionProvider>
  </div>
);

const StudioPage: React.FC = () => {
  // 草稿任务状态 - 实时同步到右侧镜像
  const [draftMission, setDraftMission] = useState<any>({
    missionId: `mission_${Date.now()}`,
    title: '草稿任务',
    type: 'audio',
    description: '草稿任务描述',
    video: {
      url: '',
      type: 'mp4'
    },
    audio: {
      tracks: [
        { type: 'vocal', url: '', name: '人声轨道' },
        { type: 'bgm', url: '', name: '背景音乐' },
        { type: 'ambient', url: '', name: '环境音效' }
      ]
    },
    instruction: '',
    keyframePreviewTime: 0,
    status: {
      isVerified: false,
      isRecorded: false
    }
  });

  // AI生成相关状态
  const [generatedJson, setGeneratedJson] = useState<any>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 处理用户输入变化
  const handleUserInputChange = (input: string) => {
    setUserInput(input);
  };

  // 生成JSON的处理函数
  const handleGenerateJson = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    try {
      // 使用 MissionDecompiler 生成 JSON
      const missionJson = await missionDecompiler.decompileMission(userInput);
      setGeneratedJson(missionJson);
      // 将生成的JSON同步到草稿任务
      setDraftMission(missionJson);
    } catch (error) {
      console.error('生成JSON失败:', error);
      // 生成默认测试JSON作为备选
      const missionId = `mission_${Date.now()}`;
      const defaultJson = {
        missionId,
        title: userInput.substring(0, 20) + '...',
        type: 'audio',
        description: userInput,
        video: {
          url: '',
          type: 'mp4'
        },
        audio: {
          tracks: [
            { type: 'vocal', url: '', name: '人声轨道' },
            { type: 'bgm', url: '', name: '背景音乐' },
            { type: 'ambient', url: '', name: '环境音效' }
          ]
        },
        instruction: '',
        keyframePreviewTime: 0,
        status: {
          isVerified: false,
          isRecorded: false
        }
      };
      setGeneratedJson(defaultJson);
      setDraftMission(defaultJson);
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: File, type: 'audio' | 'video') => {
    // 创建临时URL，用于实时预览
    const fileUrl = URL.createObjectURL(file);
    
    if (type === 'video') {
      // 更新视频URL
      setDraftMission(prev => ({
        ...prev,
        video: {
          url: fileUrl,
          type: 'mp4'
        }
      }));
    } else if (type === 'audio') {
      // 更新第一个音频轨道URL
      setDraftMission(prev => {
        const updatedTracks = [...prev.audio.tracks];
        updatedTracks[0] = {
          ...updatedTracks[0],
          url: fileUrl
        };
        return {
          ...prev,
          audio: {
            ...prev.audio,
            tracks: updatedTracks
          }
        };
      });
    }
  };

  // 当生成的JSON变化时，同步到草稿任务
  useEffect(() => {
    if (generatedJson) {
      setDraftMission(generatedJson);
    }
  }, [generatedJson]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden'
    }}>
      {/* 左侧配置面板 */}
      <ConfigurationPanel 
        draftMission={draftMission}
        setDraftMission={setDraftMission}
        onGenerate={handleGenerateJson}
        generatedJson={generatedJson}
        onUserInputChange={handleUserInputChange}
        userInput={userInput}
        isGenerating={isGenerating}
        onFileUpload={handleFileUpload}
      />
      
      {/* 右侧P3镜像 */}
      <P3Mirror draftMission={draftMission} />
    </div>
  );
};

export default StudioPage;