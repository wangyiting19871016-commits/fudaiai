/**
 * 🎬 视频生成页面（全新版本）
 *
 * 架构设计：
 * - 完全复用LabPage的Stage流程
 * - 集成ZJFullscreenLoader
 * - 玻璃态设计+春节配色
 * - 8岁小孩都能用的交互
 *
 * Stage流程：
 * upload → mode_select → param_config → generating → complete
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { VIDEO_MODES, type VideoModeId } from '../../configs/festival/videoModes';
import { ACTION_PRESETS, type ActionPreset } from '../../configs/festival/actionPresets';
import { QuotaService } from '../../services/QuotaService';
import { MissionExecutor, type MissionResult } from '../../services/MissionExecutor';
import ModeSelector from './components/ModeSelector';
import ActionPresetSelector from './components/ActionPresetSelector';
import VideoResultView from './components/VideoResultView';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-common.css';
import '../../styles/festival-home-glass.css';

type VideoStage =
  | 'upload'
  | 'mode_select'
  | 'param_config'
  | 'generating'
  | 'complete'
  | 'error';

interface VideoPageState {
  image?: string;
  caption?: string;
  audioUrl?: string;
  taskId?: string;
}

const FestivalVideoPageNew: React.FC = () => {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 核心状态
  const [stage, setStage] = useState<VideoStage>('mode_select');
  const [pageState, setPageState] = useState<VideoPageState>({});
  const [selectedMode, setSelectedMode] = useState<VideoModeId | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionPreset | null>(null);

  // 生成状态
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // 初始化：从location.state或LocalStorage获取图片
  useEffect(() => {
    const state = location.state as VideoPageState | undefined;
    if (state) {
      setPageState(state);
      return;
    }

    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        setPageState({
          image: savedResult.image,
          caption: savedResult.caption || '马年大吉',
          taskId: taskId
        });
      }
    }
  }, [taskId, location.state]);

  // 处理模式选择
  const handleModeSelect = (modeId: VideoModeId) => {
    setSelectedMode(modeId);

    if (modeId === 'talk') {
      // 数字人说话：需要检查是否有语音
      if (!pageState.audioUrl) {
        message.warning('需要先生成语音，即将跳转...');
        setTimeout(() => {
          navigate('/festival/voice', {
            state: {
              image: pageState.image,
              caption: pageState.caption,
              returnTo: 'video'
            }
          });
        }, 1500);
        return;
      }
      // 有语音，直接生成
      handleGenerate(modeId);
    } else if (modeId === 'action') {
      // 动作视频：进入动作选择
      setStage('param_config');
    } else if (modeId === 'gif') {
      // GIF表情包：直接生成
      handleGenerate(modeId);
    }
  };

  // 处理动作选择
  const handleActionSelect = (action: ActionPreset) => {
    setSelectedAction(action);
    // 自动开始生成
    handleGenerate('action', action);
  };

  // 开始生成
  const handleGenerate = async (mode: VideoModeId, action?: ActionPreset) => {
    if (!pageState.image) {
      message.error('缺少图片');
      return;
    }

    // 检查配额
    if (!QuotaService.consumeQuota(mode)) {
      const quotaMessage = QuotaService.getQuotaExceededMessage(mode);
      message.error(quotaMessage);
      return;
    }

    setStage('generating');
    setProgress(0);
    setError(null);

    try {
      if (mode === 'talk') {
        // 数字人说话
        await generateTalkVideo();
      } else if (mode === 'action' && action) {
        // 动作视频
        await generateActionVideo(action);
      } else if (mode === 'gif') {
        // GIF表情包
        await generateGif();
      }
    } catch (err) {
      console.error('[VideoPageNew] 生成失败:', err);
      setError(err instanceof Error ? err.message : '生成失败');
      setStage('error');
    }
  };

  // 生成数字人说话视频
  const generateTalkVideo = async () => {
    if (!pageState.image || !pageState.audioUrl) {
      throw new Error('缺少图片或音频');
    }

    setProgressMessage('数字人正在准备...');
    setProgress(10);

    try {
      const executor = new MissionExecutor();
      const result = await executor.execute(
        'M_VIDEO_TALK',
        {
          image: pageState.image,
          customParams: {
            audioUrl: pageState.audioUrl,
            resolution: '720P'
          }
        },
        (progress) => {
          setProgress(progress.progress);
          setProgressMessage(progress.message);
        }
      );

      setResultUrl(result.image); // Video URL in image field
      setStage('complete');
    } catch (error) {
      console.error('[VideoPageNew] Talk video generation failed:', error);
      throw error;
    }
  };

  // 生成动作视频
  const generateActionVideo = async (action: ActionPreset) => {
    if (!pageState.image) {
      throw new Error('缺少图片');
    }

    setProgressMessage(`AI演员正在表演${action.name}...`);
    setProgress(10);

    try {
      const executor = new MissionExecutor();
      const result = await executor.execute(
        'M_VIDEO_ACTION',
        {
          image: pageState.image,
          customParams: {
            action: action.id,
            actionName: action.name,
            resolution: '720P'
          }
        },
        (progress) => {
          setProgress(progress.progress);
          setProgressMessage(progress.message);
        }
      );

      setResultUrl(result.image); // Video URL in image field
      setStage('complete');
    } catch (error) {
      console.error('[VideoPageNew] Action video generation failed:', error);
      throw error;
    }
  };

  // 生成GIF表情包
  const generateGif = async () => {
    if (!pageState.image) {
      throw new Error('缺少图片');
    }

    setProgressMessage('正在制作表情包...');
    setProgress(20);

    try {
      const executor = new MissionExecutor();
      const result = await executor.execute(
        'M_VIDEO_GIF',
        {
          image: pageState.image,
          customParams: {
            format: 'gif',
            duration: 3 // 3 seconds
          }
        },
        (progress) => {
          setProgress(progress.progress);
          setProgressMessage(progress.message);
        }
      );

      setResultUrl(result.image); // GIF URL in image field
      setStage('complete');
    } catch (error) {
      console.error('[VideoPageNew] GIF generation failed:', error);
      throw error;
    }
  };

  // 返回
  const handleBack = () => {
    if (stage === 'param_config') {
      setStage('mode_select');
    } else if (taskId) {
      navigate(`/festival/result/${taskId}`);
    } else {
      navigate(-1);
    }
  };

  // 重新制作
  const handleRetry = () => {
    setStage('mode_select');
    setSelectedMode(null);
    setSelectedAction(null);
    setResultUrl(null);
    setError(null);
    setIsSaved(false);
  };

  // 保存到素材库
  const handleSaveToLibrary = () => {
    if (!resultUrl) {
      message.error('没有可保存的视频');
      return;
    }

    if (isSaved) {
      message.info('作品已保存到素材库');
      return;
    }

    try {
      const { MaterialService } = require('../../services/MaterialService');

      const material = {
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedMode === 'gif' ? 'video' : 'video' as const,
        data: {
          url: resultUrl
        },
        metadata: {
          format: selectedMode === 'gif' ? 'gif' : 'mp4',
          createdAt: Date.now(),
          featureId: 'M_VIDEO',
          featureName: selectedMode === 'talk' ? '数字人说话' : selectedMode === 'action' ? '动作视频' : 'GIF表情包',
          thumbnail: pageState.image
        },
        connectors: {
          roles: ['videoImage' as const],
          canCombineWith: ['text' as const, 'audio' as const]
        }
      };

      MaterialService.saveMaterial(material);
      setIsSaved(true);
      message.success('已保存到素材库');
    } catch (error) {
      console.error('[VideoPageNew] Save to library failed:', error);
      message.error('保存失败');
    }
  };

  return (
    <div className="festival-home-glass">
      {/* 动态背景层 */}
      <div className="bg-aura" />

      {/* 内容区 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部返回按钮（非生成状态时显示） */}
        {stage !== 'generating' && (
          <div style={{ padding: '24px 24px 0' }}>
            <BackButton onClick={handleBack} />
          </div>
        )}

        {/* Stage: 模式选择 */}
        {stage === 'mode_select' && (
          <ModeSelector onSelect={handleModeSelect} />
        )}

        {/* Stage: 参数配置（动作选择） */}
        {stage === 'param_config' && selectedMode === 'action' && (
          <ActionPresetSelector
            onSelect={handleActionSelect}
            onBack={() => setStage('mode_select')}
          />
        )}

        {/* Stage: 生成中 */}
        {stage === 'generating' && (
          <ZJFullscreenLoader
            stage="generating"
            progress={progress}
            message={progressMessage}
            uploadedImage={pageState.image}
          />
        )}

        {/* Stage: 完成 */}
        {stage === 'complete' && resultUrl && (
          <VideoResultView
            resultType={selectedMode === 'gif' ? 'gif' : 'video'}
            resultUrl={resultUrl}
            imageUrl={pageState.image}
            onBack={handleRetry}
            onSaveToLibrary={handleSaveToLibrary}
            isSaved={isSaved}
          />
        )}

        {/* Stage: 错误 */}
        {stage === 'error' && (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}></div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#F44336',
                margin: '0 0 8px 0'
              }}>
                生成失败
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 24px 0'
              }}>
                {error || '视频生成失败，请重试'}
              </p>
              <button
                className="cny-btn-primary"
                onClick={handleRetry}
                style={{ width: '100%' }}
              >
                重新尝试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FestivalVideoPageNew;
