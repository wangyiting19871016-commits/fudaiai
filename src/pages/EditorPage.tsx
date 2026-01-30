import React, { useState, useRef } from 'react';
import { useMissionLogic } from './MissionFoundry/hooks/useMissionLogic';
import { useAssetStore } from '../stores/AssetStore';
import FoundrySidebar from './MissionFoundry/components/FoundrySidebar';
import TaskMatrix from './MissionFoundry/components/TaskMatrix';
import MissionFacade from './MissionFoundry/components/MissionFacade';
import ToolConfigurationPanel from './MissionFoundry/components/ToolConfigurationPanel';
import ValidatedCapabilitiesPanel from './MissionFoundry/components/ValidatedCapabilitiesPanel';

// Components & Hooks
import { AssetLibraryContent } from './EditorPage/components/AssetLibraryContent';
import { P2PreviewModal } from './EditorPage/components/P2PreviewModal';
import { ExportModal } from './EditorPage/components/ExportModal';
import { EditorHeader } from './EditorPage/components/EditorHeader';
import { SmartCommandBar } from './EditorPage/components/SmartCommandBar';
import { useSmartCommand } from './EditorPage/hooks/useSmartCommand';
import { useMissionRunner } from './EditorPage/hooks/useMissionRunner';

import { initDefaultCapabilities } from '../stores/CapabilityStore';

const EditorPage = () => {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 反馈提示状态
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // P2预览生成状态
  const [showP2Preview, setShowP2Preview] = useState(false);
  
  // 素材库侧边栏状态
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  
  // 导出配置弹窗状态
  const [showExportModal, setShowExportModal] = useState(false);
  
  // 从 useAssetStore 获取资产数据和方法
  const { assets, addAsset } = useAssetStore();
  
  // 显示反馈提示
  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage('');
    }, 2000);
  };

  // 使用核心逻辑 Hook
  const {
    // 状态
    instruction,
    isAnalyzing,
    uploadedFileUrl,
    previewFocusUrl,
    activePreviewUrl,
    draftMission,
    selectedStepIndex,
    isManualMode,
    facadeCoverUrl,
    
    // 方法
    handleFileUpload,
    handleAnalyze,
    handleAddStep,
    handleDeleteStep,
    handleCopyStep,
    handleMoveStepUp,
    handleMoveStepDown,
    handleSignAndRelease,
    handleVoiceAI,
    analyzeStepAssets,
    handleAutoFill,
    setSelectedStepIndex,
    setPreviewFocusUrl,
    setActivePreviewUrl,
    setIsManualMode,
    updateStep,
    updateDraftMission,
    downloadVideo,
    downloadAudio,
    setFacadeCover
  } = useMissionLogic();

  // 使用智能指令 Hook
  const { handleSmartCommand } = useSmartCommand({
    draftMission,
    selectedStepIndex,
    updateDraftMission,
    updateStep,
    handleAddStep,
    handleDeleteStep,
    handleMoveStepUp,
    handleMoveStepDown,
    analyzeStepAssets,
    handleAutoFill,
    handleVoiceAI,
    showFeedback,
    instruction
  });

  // 使用任务执行器 Hook
  const { handleRunStep, isRunning } = useMissionRunner({
      draftMission,
      updateStep,
      showFeedback
  });

  // 默认进入手动模式，确保任务列表是空的
  React.useEffect(() => {
    setIsManualMode(true);
    initDefaultCapabilities();
  }, [setIsManualMode]);
  
  // 添加消息监听，处理来自LabPage的下载事件
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DOWNLOAD_VIDEO') {
        console.log('收到下载视频请求');
        downloadVideo();
      } else if (event.data.type === 'DOWNLOAD_AUDIO') {
        console.log('收到下载音频请求');
        downloadAudio();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [downloadVideo, downloadAudio]);
  
  // 添加协议加载事件监听，实现强制跳转P3
  React.useEffect(() => {
    const handleForceNavigateToP3 = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[FORCE_NAVIGATE] 收到强制跳转到P3的事件:', customEvent.detail);
      
      // 强制切换到P3预览区
      setSelectedStepIndex(0);
      
      // 确保P3镜像引擎读取到新注入的协议
      window.dispatchEvent(new CustomEvent('p3EngineIgnite', {
        detail: customEvent.detail.missionData
      }));
    };
    
    window.addEventListener('forceNavigateToP3', handleForceNavigateToP3);
    return () => {
      window.removeEventListener('forceNavigateToP3', handleForceNavigateToP3);
    };
  }, [setSelectedStepIndex]);
  
  // 添加P4实验室返回事件监听，实现实验室与P4的通信
  React.useEffect(() => {
    const handleP4LabReturn = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { stepIndex, updatedStep } = customEvent.detail;
      
      console.log('[P4_LAB_RETURN] 收到实验室返回数据:', { stepIndex, updatedStep });
      
      // 更新对应的步骤数据
      updateStep(stepIndex, updatedStep);
      showFeedback(`实验室参数已同步至步骤 ${stepIndex + 1}`);
      
      // 检查localStorage中是否有实验室更新
      const storedUpdate = localStorage.getItem(`lab_updated_step_${stepIndex}`);
      if (storedUpdate) {
        console.log('[LOCAL_STORAGE] 检测到实验室更新备份，确保数据完整性');
      }
    };
    
    window.addEventListener('p4-lab-return', handleP4LabReturn);
    return () => {
      window.removeEventListener('p4-lab-return', handleP4LabReturn);
    };
  }, [updateStep, showFeedback]);
  
  // 组件挂载时检查localStorage中是否有实验室更新
  React.useEffect(() => {
    const lastSyncTime = localStorage.getItem('lab_last_sync_time');
    if (lastSyncTime) {
      console.log('[LOCAL_STORAGE] 检测到实验室同步记录，时间:', lastSyncTime);
      for (let i = 0; i < (draftMission.steps?.length || 0); i++) {
        const storedUpdate = localStorage.getItem(`lab_updated_step_${i}`);
        if (storedUpdate) {
          try {
            const updatedStep = JSON.parse(storedUpdate);
            updateStep(i, updatedStep);
            console.log(`[LOCAL_STORAGE] 恢复实验室更新至步骤 ${i + 1}`);
            localStorage.removeItem(`lab_updated_step_${i}`);
          } catch (error) {
            console.error(`[LOCAL_STORAGE] 恢复实验室更新失败步骤 ${i + 1}:`, error);
          }
        }
      }
    }
  }, [draftMission.steps?.length, updateStep]);

  // 指令处理器 - 处理输入框和发送按钮的指令
  const handleExecute = () => {
    if (inputValue.trim()) {
      console.log('【P4 指令触发】:', inputValue);
      // 智能指令处理逻辑 - 直接操作 MissionContext 里的数据
      handleSmartCommand(inputValue);
      
      // 清空输入框 - 用户要求的视觉反馈
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };
  
  // 创始人审计：这是将 P4LAB 的能力包一键注入 P4 任务的物理通道
  const handleCapabilitySelect = (capability: any) => {
    console.log('[CAPABILITY_MOUNT] 正在挂载能力包到当前步骤:', capability);
    if (selectedStepIndex >= 0) {
      // 物理覆盖：将实验室的能力包直接注入任务节点
      updateStep(selectedStepIndex, {
        mountedCapability: capability,
        // 清除旧的 pluginIds 和 toolType，确保纯净模式
        pluginIds: [],
        toolType: undefined,
        // 初始化 dynamic params 的默认值
        params: {
          ...(capability.parameter_config?.dynamic?.reduce((acc: any, param: any) => {
             acc[param.id] = param.defaultValue;
             return acc;
          }, {}) || {})
        }
      });
      showFeedback(`✅ 已挂载能力: ${capability.meta.name || '未命名能力'}`);
    } else {
      showFeedback('⚠️ 请先选择一个步骤');
    }
  };

  return (
    <div className="foundry-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', background: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <EditorHeader 
          draftMission={draftMission}
          setShowP2Preview={setShowP2Preview}
          setShowExportModal={setShowExportModal}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
             {/* Open Builder 按钮已移除，功能整合至 EditorPage */}
        </div>
      </div>

      {/* 中间内容区 - 三栏布局：左侧边栏 + 中间任务列表 + 右侧工具坞 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧边栏 - 上传区域和抽屉 */}
        <FoundrySidebar
          isAnalyzing={isAnalyzing}
          draftMission={draftMission}
          selectedStepIndex={selectedStepIndex}
          handleAnalyze={handleAnalyze}
          handleSignAndRelease={handleSignAndRelease}
        />

        {/* 中间任务列表区 - 宽度收缩，轻量化设计 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', maxWidth: 'calc(100% - 400px)' }}>
          {/* 任务门面配置 */}
          <MissionFacade
            difficulty={draftMission.difficulty || 1}
            creditScore={draftMission.creditScore || 0}
            title={draftMission.title}
            onDifficultyChange={(difficulty) => updateDraftMission({ difficulty })}
            onCreditScoreChange={(score) => updateDraftMission({ creditScore: score })}
            onTitleChange={(title) => updateDraftMission({ title })}
            coverUrl={facadeCoverUrl || draftMission.facadeCoverUrl}
            onCoverUpload={async (file) => {
              const oldUploadedFileUrl = uploadedFileUrl;
              handleFileUpload({ target: { files: [file] } } as any);
              setTimeout(() => {
                if (uploadedFileUrl !== oldUploadedFileUrl) {
                  setFacadeCover(uploadedFileUrl);
                }
              }, 100);
            }}
          />
          
          <TaskMatrix
            steps={draftMission.steps}
            isManualMode={isManualMode}
            selectedStepIndex={selectedStepIndex}
            onAddStep={handleAddStep}
            onSelectStep={setSelectedStepIndex}
            onMoveStepUp={handleMoveStepUp}
            onMoveStepDown={handleMoveStepDown}
            onDeleteStep={handleDeleteStep}
            onCopyStep={handleCopyStep}
            onUpdateStep={updateStep}
            onVoiceAI={handleVoiceAI}
            onAutoFill={handleAutoFill}
            analyzeStepAssets={analyzeStepAssets}
            previewFocusUrl={previewFocusUrl}
            setPreviewFocusUrl={setPreviewFocusUrl}
            onImageClick={setActivePreviewUrl}
            activePreviewUrl={activePreviewUrl}
            onRunStep={handleRunStep}
            onUploadImage={(index, file) => {
              const fileUrl = URL.createObjectURL(file);
              const updatedSteps = [...draftMission.steps];
              const currentStep = updatedSteps[index];
              if (currentStep) {
                let assetType: 'image' | 'audio' | 'video';
                if (file.type.startsWith('image/')) assetType = 'image';
                else if (file.type.startsWith('audio/')) assetType = 'audio';
                else if (file.type.startsWith('video/')) assetType = 'video';
                else return false;
                
                addAsset({
                  name: file.name,
                  url: fileUrl,
                  type: assetType,
                  size: file.size
                });
                
                const newAsset = assets.find(asset => asset.name === file.name && asset.url === fileUrl);
                
                if (newAsset) {
                  updatedSteps[index] = {
                    ...currentStep,
                    mediaAssets: [...(currentStep.mediaAssets || []), newAsset.id],
                    sourceImage: fileUrl
                  };
                } else return false;
                
                updateDraftMission({ steps: updatedSteps });
                console.log(`步骤 \${index + 1} 上传了新的媒体资产: \${file.name}`);
              }
            }}
          />
        </div>

        {/* 右侧工具坞 - 至少400px宽，动态加载配置界面 */}
        <div style={{ 
          width: '400px', 
          backgroundColor: '#1a1a1a', 
          borderLeft: '1px solid #333', 
          overflowY: 'auto', 
          padding: '20px', 
          boxSizing: 'border-box' 
        }}>
          <ValidatedCapabilitiesPanel onCapabilitySelect={handleCapabilitySelect} />
          <ToolConfigurationPanel
            step={selectedStepIndex >= 0 && draftMission.steps[selectedStepIndex] ? draftMission.steps[selectedStepIndex] : null}
            onUpdateStep={updateStep}
            stepIndex={selectedStepIndex}
          />
        </div>
        
        {/* 可折叠素材库侧边栏 */}
      {showAssetLibrary && (
          <div style={{
            width: '400px',
            backgroundColor: '#1a1a1a',
            borderLeft: '1px solid #333',
            overflowY: 'auto',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #333'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#a3a3a3', margin: 0 }}>📦 素材库</h2>
              <button
                onClick={() => setShowAssetLibrary(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                ✕ 关闭
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AssetLibraryContent 
                onSelectAsset={(asset) => {
                  if (selectedStepIndex >= 0 && draftMission.steps[selectedStepIndex]) {
                    const currentStep = draftMission.steps[selectedStepIndex];
                    const updatedSteps = [...draftMission.steps];
                    updatedSteps[selectedStepIndex] = {
                      ...currentStep,
                      mediaAssets: [...(currentStep.mediaAssets || []), asset.id],
                      sourceImage: asset.url
                    };
                    updateDraftMission({ steps: updatedSteps });
                    showFeedback(`已从素材库添加素材到步骤 \${selectedStepIndex + 1}`);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      <SmartCommandBar 
        inputValue={inputValue}
        setInputValue={setInputValue}
        inputRef={inputRef}
        handleExecute={handleExecute}
        feedbackMessage={feedbackMessage}
        showAssetLibrary={showAssetLibrary}
        setShowAssetLibrary={setShowAssetLibrary}
      />
      
      {/* P2预览模态框 */}
      <P2PreviewModal 
        show={showP2Preview}
        onClose={() => setShowP2Preview(false)}
        draftMission={draftMission}
        instruction={instruction}
      />
      
      {/* 导出配置弹窗 */}
      <ExportModal 
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        draftMission={draftMission}
        onFeedback={showFeedback}
      />
    </div>
  );
};

export default EditorPage;