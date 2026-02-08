/**
 * 视频制作中心
 *
 * 设计理念：制作中心，而非单纯生成页
 * - 三种素材（图片/音频/文案）卡片式展示
 * - 每种素材都有多种获取方式（上传/素材库/AI生成/一键操作）
 * - 支持双模式：有音频直接用，无音频TTS生成
 * - 流转清晰：跳转生成页后自动返回，素材自动填充
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { MissionExecutor } from '../../services/MissionExecutor';
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import { FishAudioService } from '../../services/FishAudioService';
import { sendRequest } from '../../services/apiService';
import { useAPISlotStore } from '../../stores/APISlotStore';
import { getAllVoices } from '../../configs/festival/voicePresets';
import { uploadImage, uploadAudio } from '../../services/imageHosting';
import { getNavigationState, createNavigationState, type NavigationState } from '../../types/navigationState';
import { SessionMaterialManager } from '../../services/SessionMaterialManager';
import { ImageGeneratorSelector } from '../../components/ImageGeneratorSelector';
import { TextGeneratorSelector } from '../../components/TextGeneratorSelector';
import { MaterialSelector } from '../../components/MaterialSelector';
import type { MaterialAtom } from '../../types/material';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import TextTemplateSelector from '../../components/TextTemplateSelector';
import { MaterialService } from '../../services/MaterialService';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { ContinueCreationPanel } from '../../components/ContinueCreationPanel';
import {
  generateSubtitleSegments,
  generateVTT,
  createSubtitleBlobURL,
  getAudioDuration
} from '../../services/SubtitleService';
import '../../styles/festival-video.css';
import '../../styles/festival-result-glass.css';
import '../../styles/kling-template-modal.css';

const FestivalVideoPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { slots } = useAPISlotStore();
  const voicePresets = getAllVoices();

  // ========== 素材状态 ==========
  const [image, setImage] = useState<string>('');
  const [audio, setAudio] = useState<string>('');
  const [text, setText] = useState<string>('新年快乐，恭喜发财！祝您身体健康，万事如意！');

  // ========== 生成状态 ==========
  const [generationState, setGenerationState] = useState<{
    stage: 'idle' | 'uploading' | 'tts' | 'wan' | 'kling' | 'subtitle' | 'complete' | 'error';
    progress: number;
    message: string;
    error?: string;
  }>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [wanVideoUrl, setWanVideoUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // ========== 一键配音模式 ==========
  const [ttsMode, setTtsMode] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('59cb5986671546eaa6ca8ae6f29f6d22');

  // ========== 选择器状态 ==========
  const [imageSelectorVisible, setImageSelectorVisible] = useState(false);
  const [textSelectorVisible, setTextSelectorVisible] = useState(false);
  const [templateSelectorVisible, setTemplateSelectorVisible] = useState(false);
  const [materialSelectorVisible, setMaterialSelectorVisible] = useState(false);
  const [materialSelectorType, setMaterialSelectorType] = useState<'image' | 'audio' | 'text'>('image');

  // VideoPage现在只做数字人拜年（可灵特效已独立到KlingEffectsPage）


  // ========== 初始化：素材恢复 ==========
  useEffect(() => {
    // 优先级1: 从 NavigationState 接收素材（从生成页返回）
    const navState = getNavigationState(location.state);
    if (navState) {
      console.log('[VideoPage] 收到NavigationState:', navState);

      if (navState.image) setImage(navState.image);
      if (navState.audio) setAudio(navState.audio);
      if (navState.text) setText(navState.text);

      return;
    }

    // 优先级2: 从临时会话恢复素材
    const tempMaterials = SessionMaterialManager.getAllTempMaterials();
    if (tempMaterials && Object.keys(tempMaterials).length > 0) {
      console.log('[VideoPage] 从临时会话恢复素材:', tempMaterials);

      // 🔍 调试：检查恢复的图片数据
      if (tempMaterials.image?.url) {
        console.log('[VideoPage] 🔍 恢复的图片URL类型:', typeof tempMaterials.image.url);
        console.log('[VideoPage] 🔍 恢复的图片URL长度:', tempMaterials.image.url.length);
        console.log('[VideoPage] 🔍 恢复的图片URL前200字符:', tempMaterials.image.url.substring(0, 200));
      }

      if (tempMaterials.text) setText(tempMaterials.text);
      if (tempMaterials.audio) setAudio(tempMaterials.audio.url);
      if (tempMaterials.image) setImage(tempMaterials.image.url);

      return;
    }

    // 优先级3: 兼容旧版从LocalStorage获取任务结果
    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        setImage(savedResult.image || '');
        setText(savedResult.caption || '马年大吉，恭喜发财！');
      }
    }
  }, [taskId, location.state]);

  // ========== 素材操作：图片 ==========
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      // 🔍 调试：检查上传的图片数据
      console.log('[VideoPage] 🔍 上传图片数据类型:', typeof imageData);
      console.log('[VideoPage] 🔍 上传图片数据长度:', imageData.length);

      // 🔧 精确检测上传数据
      const uploadMatches = imageData.match(/data:image\//g);
      const uploadCount = uploadMatches ? uploadMatches.length : 0;
      console.log('[VideoPage] 🔍 上传数据中"data:image/"数量:', uploadCount);

      if (uploadCount !== 1) {
        console.error('[VideoPage] ❌ 上传的图片数据异常！应该只有1个data:image/，实际:', uploadCount);
      }

      setImage(imageData);
      SessionMaterialManager.setTempImage(imageData, undefined, 'video-page');
      message.success('图片已上传');
    };
    reader.readAsDataURL(file);
  };

  const handleImageFromLibrary = () => {
    setMaterialSelectorType('image');
    setMaterialSelectorVisible(true);
  };

  const handleImageGenerate = (option: any) => {
    // ✅ 使用标准NavigationState传递数据
    const navState = createNavigationState({
      text,
      audio,
      textSource: text ? 'user' : undefined,
      sourcePagePath: '/festival/video',
      sourceFeatureId: 'video-production'
    });

    navigate(option.path, { state: navState });
    setImageSelectorVisible(false);
  };

  // ========== 素材操作：音频 ==========
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudio(url);
    SessionMaterialManager.setTempAudio(url, text, 'video-page');
    message.success('音频已上传');
  };

  const handleAudioFromLibrary = () => {
    setMaterialSelectorType('audio');
    setMaterialSelectorVisible(true);
  };

  const handleAudioGenerate = () => {
    // ✅ 使用标准NavigationState传递数据
    const navState = createNavigationState({
      text,
      image,
      textSource: text ? 'user' : undefined,
      sourcePagePath: '/festival/video',
      sourceFeatureId: 'video-production'
    });

    navigate('/festival/voice', { state: navState });
  };

  const handleQuickTTS = async () => {
    if (!text.trim()) {
      message.error('请先输入文案');
      return;
    }

    try {
      setTtsMode(false);
      message.loading({ content: '生成音频中...', key: 'tts', duration: 0 });

      const ttsResult = await FishAudioService.generateTTS({
        text: text.trim(),
        reference_id: selectedVoiceId,
        enhance_audio_quality: true
      });

      if (!ttsResult.blob) {
        throw new Error('音频生成失败');
      }

      // 创建blob URL
      const audioUrl = URL.createObjectURL(ttsResult.blob);
      setAudio(audioUrl);
      SessionMaterialManager.setTempAudio(audioUrl, text.trim(), 'video-page');

      message.destroy('tts');
      message.success('音频生成成功');
    } catch (err) {
      message.destroy('tts');
      message.error('音频生成失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // ========== 素材操作：文案 ==========
  const handleTextFromLibrary = () => {
    setMaterialSelectorType('text');
    setMaterialSelectorVisible(true);
  };

  const handleTextGenerate = (featureId: string) => {
    // ✅ 使用标准NavigationState传递数据
    const navState = createNavigationState({
      image,
      audio,
      sourcePagePath: '/festival/video',
      sourceFeatureId: 'video-production'
    });

    navigate(`/festival/text/${featureId}`, { state: navState });
    setTextSelectorVisible(false);
  };

  // ========== 素材库选择回调 ==========
  const handleMaterialSelect = (material: MaterialAtom) => {
    switch (material.type) {
      case 'image':
        if (material.data.url) {
          setImage(material.data.url);
          SessionMaterialManager.setTempImage(material.data.url);
        }
        break;
      case 'audio':
        if (material.data.url) {
          setAudio(material.data.url);
          SessionMaterialManager.setTempAudio(material.data.url, material.data.text);
        }
        break;
      case 'text':
        if (material.data.text) {
          setText(material.data.text);
          SessionMaterialManager.setTempText(material.data.text);
        }
        break;
    }
    setMaterialSelectorVisible(false);
  };

  // ========== 生成视频 ==========
  const handleGenerateVideo = async () => {
    // 验证素材完整性
    if (!image) {
      message.error('请选择或上传图片');
      return;
    }
    if (!text.trim()) {
      message.error('请输入文案');
      return;
    }

    setGenerationState({
      stage: 'uploading',
      progress: 0,
      message: '开始上传素材...'
    });

    try {
      // 步骤1: 处理图片 - 区分HTTP URL和data URL (0% → 5%)
      setGenerationState({
        stage: 'uploading',
        progress: 2,
        message: '上传图片中...'
      });
      let imageToUpload: File | string = image;

      // 如果是HTTP URL，先fetch转成blob
      if (image.startsWith('http://') || image.startsWith('https://')) {
        console.log('[VideoPage] 图片是HTTP URL，转换为blob...');
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const reader = new FileReader();
          imageToUpload = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log('[VideoPage] 图片已转换为data URL');
        } catch (err) {
          console.warn('[VideoPage] HTTP图片转换失败，尝试直接使用:', err);
        }
      }

      // 🔍 调试：检查上传前的图片数据
      console.log('[VideoPage] 准备上传图片，数据类型:', typeof imageToUpload);
      if (typeof imageToUpload === 'string') {
        console.log('[VideoPage] 图片数据长度:', imageToUpload.length);

        // 🔧 精确检测：查找所有"data:image/"出现的位置
        const dataUrlMatches = imageToUpload.match(/data:image\//g);
        const dataUrlCount = dataUrlMatches ? dataUrlMatches.length : 0;
        console.log('[VideoPage] 🚨 检测到"data:image/"数量:', dataUrlCount);

        if (dataUrlCount > 1) {
          console.error('[VideoPage] ❌ 图片数据已损坏，包含多个data URL前缀！');
          // 找出所有位置
          let idx = 0;
          const positions = [];
          while ((idx = imageToUpload.indexOf('data:image/', idx)) !== -1) {
            positions.push(idx);
            idx++;
          }
          console.error('[VideoPage] 损坏位置:', positions);
        }
      }

      // 上传图片
      const imageUploadResult = await uploadImage(imageToUpload);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }

      setGenerationState({
        stage: 'uploading',
        progress: 5,
        message: '图片上传完成'
      });

      // 步骤4: 生成视频
      let remoteVideoUrl: string;
      let audioUploadResult: any = null; // 用于后处理字幕

      // === 使用WAN数字人（需要音频）===
      // 步骤2: 获取音频URL
        let audioUrl: string;
        if (audio) {
          audioUrl = audio;
          console.log('[VideoPage] 使用已有音频');
        } else {
          // TTS生成
          if (!selectedVoiceId) {
            message.error('请选择音色或生成音频');
            return;
          }
          setGenerationState({
            stage: 'tts',
            progress: 6,
            message: '生成语音中...'
          });
          const ttsResult = await FishAudioService.generateTTS({
            text: text.trim(),
            reference_id: selectedVoiceId,
            enhance_audio_quality: true
          });

          if (!ttsResult.blob) {
            throw new Error('语音生成失败');
          }
          audioUrl = URL.createObjectURL(ttsResult.blob);
          console.log('[VideoPage] TTS生成音频');
        }

        // 步骤3: 处理音频 - 转换为Blob
        setGenerationState({
          stage: 'tts',
          progress: 11,
          message: '上传音频中...'
        });
        let audioBlob: Blob;

        if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
          const response = await fetch(audioUrl);
          audioBlob = await response.blob();
        } else if (audioUrl.startsWith('blob:')) {
          const response = await fetch(audioUrl);
          audioBlob = await response.blob();
        } else if (audioUrl.startsWith('data:')) {
          const response = await fetch(audioUrl);
          audioBlob = await response.blob();
        } else {
          throw new Error('不支持的音频格式');
        }

        // 上传音频
        audioUploadResult = await uploadAudio(audioBlob);
        if (!audioUploadResult.success) {
          throw new Error(audioUploadResult.error || '音频上传失败');
        }

        setGenerationState({
          stage: 'tts',
          progress: 13,
          message: '音频上传完成'
        });

        // WAN数字人视频生成
        setGenerationState({
          stage: 'wan',
          progress: 13,
          message: '生成数字人视频中，预计需要90秒'
        });

        // 获取DashScope API Key
        const dashscopeSlot = slots.find(s => s.provider === 'Qwen');
        if (!dashscopeSlot?.authKey) {
          throw new Error('未配置DashScope API Key');
        }

        // 启动进度模拟定时器
        const startTime = Date.now();
        const estimatedTime = 90000; // 90秒
        const progressTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const simulatedProgress = Math.min(90, 13 + (elapsed / estimatedTime) * 77);
          const remainingSeconds = Math.ceil((estimatedTime - elapsed) / 1000);

          setGenerationState({
            stage: 'wan',
            progress: Math.floor(simulatedProgress),
            message: `生成数字人视频中，预计还需${remainingSeconds}秒`
          });
        }, 1000);

        // WAN API异步任务 - 通过后端代理调用
        let wanResult;
        try {
          const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

          // 调用后端代理（启用异步模式）
          const response = await fetch(`${backendUrl}/api/dashscope/proxy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: '/api/v1/services/aigc/image2video/video-synthesis',
              method: 'POST',
              headers: {
                'X-DashScope-Async': 'enable'  // 关键：启用异步任务模式
              },
              body: {
                model: 'wan2.2-s2v',
                input: {
                  image_url: imageUploadResult.url,
                  audio_url: audioUploadResult.url
                },
                parameters: {
                  resolution: '720P'
                }
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`视频生成请求失败: ${response.status} ${errorText}`);
          }

          const initialResult = await response.json();
          const taskId = initialResult.output?.task_id;

          if (!taskId) {
            throw new Error('未获取到任务ID');
          }

          console.log('[VideoPage] 任务已创建:', taskId);

          // 轮询任务状态
          let taskStatus = 'PENDING';
          let videoUrl = '';
          const maxPolls = 60; // 最多轮询60次（5分钟）
          let pollCount = 0;

          while (taskStatus !== 'SUCCEEDED' && taskStatus !== 'FAILED' && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
            pollCount++;

            const statusResponse = await fetch(`${backendUrl}/api/dashscope/proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                endpoint: `/api/v1/tasks/${taskId}`,
                method: 'GET',
                body: {}
              })
            });

            if (!statusResponse.ok) {
              console.error('[VideoPage] 查询任务状态失败:', statusResponse.status);
              continue;
            }

            const statusData = await statusResponse.json();
            taskStatus = statusData.output?.task_status || 'UNKNOWN';

            if (taskStatus === 'SUCCEEDED') {
              videoUrl = statusData.output?.results?.video_url || '';
              break;
            } else if (taskStatus === 'FAILED') {
              throw new Error('视频生成失败');
            }

            console.log('[VideoPage] 任务状态:', taskStatus, `(${pollCount}/${maxPolls})`);
          }

          if (!videoUrl) {
            throw new Error('视频生成超时或失败');
          }

          wanResult = { video_url: videoUrl };

          clearInterval(progressTimer);
        } catch (error) {
          clearInterval(progressTimer);
          throw error;
        }

        if (!wanResult.output?.results?.video_url) {
          throw new Error('WAN视频生成失败');
        }

        remoteVideoUrl = wanResult.output.results.video_url;

      // 步骤5: 后处理 - 字幕烧录（WAN数字人需要）
      if (text.trim() && audioUploadResult) {
        setGenerationState({
          stage: 'subtitle',
          progress: 90,
          message: '正在添加字幕...'
        });

        try {
          console.log('[VideoPage] 调用后处理API烧录字幕（实时字幕+ASR）');
          const postProcessResponse = await fetch('http://localhost:3002/api/video/post-process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              videoUrl: remoteVideoUrl,
              audioUrl: audioUploadResult.url, // 用于ASR生成实时字幕
              subtitle: text.trim(), // 静态字幕（fallback）
              decorations: [], // TODO: 后续添加装饰元素模板
              enableRealtimeSubtitle: true // 启用实时字幕
            })
          });

          const postProcessResult = await postProcessResponse.json();

          if (postProcessResult.status === 'success' && postProcessResult.downloadUrl) {
            remoteVideoUrl = postProcessResult.downloadUrl;
            console.log('[VideoPage] 字幕烧录成功，新视频URL:', remoteVideoUrl);
          } else {
            console.warn('[VideoPage] 字幕烧录失败，使用原视频:', postProcessResult.message);
          }
        } catch (subtitleErr) {
          console.error('[VideoPage] 字幕烧录失败:', subtitleErr);
          console.warn('[VideoPage] 降级使用原视频（无字幕）');
          // 失败不影响流程，继续使用原视频
        }
      }

      // 步骤6: 将视频转为本地Blob URL（关键！这样才能长按保存）
      setGenerationState({
        stage: 'wan',
        progress: 95,
        message: '加载视频中...'
      });

      console.log('[VideoPage] 开始转换视频为Blob URL:', remoteVideoUrl);

      // 转换为Blob URL - 只有blob: URL才支持长按保存
      const videoResponse = await fetch(remoteVideoUrl);
      const videoBlob = await videoResponse.blob();
      const localBlobUrl = URL.createObjectURL(videoBlob);

      console.log('[VideoPage] Blob URL生成成功:', localBlobUrl);
      setWanVideoUrl(localBlobUrl);

      // 🎉 字幕已在后端烧录，无需前端WebVTT字幕
      console.log('[VideoPage] ✅ 字幕已烧录到视频中，下载后保留字幕');

      setGenerationState({
        stage: 'complete',
        progress: 100,
        message: '视频生成完成！'
      });

    } catch (err) {
      console.error('[VideoPage] 生成失败:', err);
      const errorMessage = err instanceof Error ? err.message : '视频生成失败';
      console.error('[VideoPage] 错误详情:', errorMessage);
      setGenerationState({
        stage: 'error',
        progress: 0,
        message: '',
        error: errorMessage
      });
      message.error(errorMessage);
    }
  };

  // ========== 保存视频（长按保存）==========
  const handleDownload = () => {
    if (!wanVideoUrl) return;

    // 直接显示长按保存引导
    setShowDownloadModal(true);
  };

  // ========== 下载视频到文件 ==========
  const handleSave = () => {
    if (!wanVideoUrl) return;
    if (isSaved) {
      message.info('视频已下载');
      setShowDownloadModal(true);
      return;
    }

    // 下载视频到文件
    const a = document.createElement('a');
    a.href = wanVideoUrl;
    a.download = `春节视频_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 保存到素材库（保留原有功能）
    const material: MaterialAtom = {
      id: `material_video_${Date.now()}`,
      type: 'video',
      data: { url: wanVideoUrl },
      metadata: {
        createdAt: Date.now(),
        featureId: 'M11',
        featureName: '数字人拜年',
        greetingText: text
      },
      connectors: {
        roles: ['videoResult'],
        canCombineWith: []
      }
    };
    MaterialService.saveMaterial(material);

    // 立即显示下载引导Modal
    setIsSaved(true);
    setShowDownloadModal(true);
    message.success('视频开始下载，请查看引导');
  };

  // ========== 清除素材 ==========
  const handleClearImage = () => {
    setImage('');
    SessionMaterialManager.clearTempMaterial('image');
  };

  const handleClearAudio = () => {
    setAudio('');
    setTtsMode(false);
    SessionMaterialManager.clearTempMaterial('audio');
  };

  const handleClearText = () => {
    setText('');
    SessionMaterialManager.clearTempMaterial('text');
  };

  // ========== 检查素材完整性 ==========
  const canGenerate = image && text.trim() && (audio || selectedVoiceId);
  const missingMaterials = [];
  if (!image) missingMaterials.push('图片');
  if (!text.trim()) missingMaterials.push('文案');
  if (!audio && !selectedVoiceId) missingMaterials.push('音频或音色');

  return (
    <div className="festival-video-page">
      {/* 顶部导航 */}
      <header className="video-header">
        <BackButton />
        <h1 className="page-title">制作数字人视频</h1>
        <HomeButton />
      </header>

      <div className="video-content">
        {/* 视频预览区 */}
        <div className="preview-section">
          {generationState.stage !== 'idle' && generationState.stage !== 'complete' && generationState.stage !== 'error' && !wanVideoUrl ? (
            <ZJFullscreenLoader
              stage="generating"
              progress={generationState.progress}
              message={generationState.message}
              uploadedImage={image}
            />
          ) : wanVideoUrl ? (
            <div className="video-preview">
              <video
                src={wanVideoUrl}
                controls
                playsInline
                className="result-video"
                poster={image}
              >
                {subtitleUrl && (
                  <track
                    kind="captions"
                    src={subtitleUrl}
                    srcLang="zh"
                    label="中文字幕"
                    default
                  />
                )}
              </video>
            </div>
          ) : (
            <div className="template-preview-large">
              {image ? (
                <img src={image} alt="预览" className="preview-image" />
              ) : (
                <div className="preview-placeholder">
                </div>
              )}
            </div>
          )}
        </div>

        {!wanVideoUrl && (
          <>
            {/* ========== 素材准备区 ========== */}
            <div className="materials-section">
              <div className="section-title">
                准备素材
              </div>

              {/* 图片素材卡片 */}
              <div className="material-card">
                <div className="material-card-header">
                  <span className="material-card-title">图片素材</span>
                  <span className={`material-status-badge ${image ? 'has-value' : 'no-value'}`}>
                    {image ? '已选择' : '未选择'}
                  </span>
                </div>
                <div className="material-card-body">
                  <div className="material-actions">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="action-btn-small">
                      上传图片
                    </label>
                    <button className="action-btn-small" onClick={handleImageFromLibrary}>
                      素材库
                    </button>
                    <button className="action-btn-small action-btn-primary" onClick={() => setImageSelectorVisible(true)}>
                      AI生成
                    </button>
                    {image && (
                      <button className="action-btn-small action-btn-ghost" onClick={handleClearImage}>
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 音频素材卡片 */}
              <div className="material-card">
                  <div className="material-card-header">
                    <span className="material-card-title">音频素材</span>
                    <span className={`material-status-badge ${audio ? 'has-value' : 'no-value'}`}>
                      {audio ? '已选择' : '未选择'}
                    </span>
                  </div>
                <div className="material-card-body">
                  {audio ? (
                    <div className="audio-player-wrapper">
                      <audio src={audio} controls className="audio-player" />
                    </div>
                  ) : ttsMode ? (
                    <div className="tts-quick-mode">
                      <select
                        className="voice-selector-small"
                        value={selectedVoiceId}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                      >
                        {voicePresets.map(voice => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name}
                          </option>
                        ))}
                      </select>
                      <button className="action-btn-small action-btn-primary" onClick={handleQuickTTS}>
                        生成
                      </button>
                      <button className="action-btn-small action-btn-ghost" onClick={() => setTtsMode(false)}>
                        取消
                      </button>
                    </div>
                  ) : null}
                  <div className="material-actions">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      style={{ display: 'none' }}
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="action-btn-small">
                      上传音频
                    </label>
                    <button className="action-btn-small" onClick={handleAudioFromLibrary}>
                      素材库
                    </button>
                    <button className="action-btn-small action-btn-primary" onClick={handleAudioGenerate}>
                      AI生成
                    </button>
                    {!audio && !ttsMode && (
                      <button className="action-btn-small" onClick={() => setTtsMode(true)}>
                        一键配音
                      </button>
                    )}
                    {audio && (
                      <button className="action-btn-small action-btn-ghost" onClick={handleClearAudio}>
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 文案内容卡片 */}
              <div className="material-card">
                <div className="material-card-header">
                  <span className="material-card-title">文案内容</span>
                  <span className={`material-status-badge ${text.length > 80 ? 'warning' : text ? 'has-value' : 'no-value'}`}>
                    {text.length > 80 ? '过长' : text ? '已填写' : '未填写'}
                  </span>
                </div>
                <div className="material-card-body">
                  <textarea
                    className="text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="请输入拜年祝福语..."
                    maxLength={200}
                    rows={4}
                  />
                  <div className="char-count-wrapper">
                    <div className={`char-count ${text.length > 80 ? 'warning' : ''}`}>
                      {text.length}/80字（推荐）
                    </div>
                    <div className="duration-estimate">
                      预计约{Math.ceil(text.length / 3.5)}秒
                    </div>
                  </div>
                  <div className="material-actions">
                    <button className="action-btn-small action-btn-primary" onClick={() => setTemplateSelectorVisible(true)}>
                      快速模板
                    </button>
                    <button className="action-btn-small" onClick={handleTextFromLibrary}>
                      素材库
                    </button>
                    <button className="action-btn-small" onClick={() => setTextSelectorVisible(true)}>
                      AI生成
                    </button>
                    {text && (
                      <button className="action-btn-small action-btn-ghost" onClick={handleClearText}>
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {generationState.stage === 'error' && generationState.error && (
              <div className="error-section">
                <span className="error-icon"></span>
                <span className="error-text">{generationState.error}</span>
              </div>
            )}

            {/* 缺少素材提示 */}
            {!canGenerate && missingMaterials.length > 0 && (
              <div className="missing-tip">
                还缺少：{missingMaterials.join('、')}
              </div>
            )}

            {/* ========== 生成视频 ========== */}
            <div className="action-section" style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <FestivalButton
                variant="primary"
                fullWidth
                onClick={handleGenerateVideo}
                disabled={!canGenerate || (generationState.stage !== 'idle' && generationState.stage !== 'error' && generationState.stage !== 'complete')}
                loading={generationState.stage !== 'idle' && generationState.stage !== 'error' && generationState.stage !== 'complete'}
              >
                {generationState.stage !== 'idle' && generationState.stage !== 'error' && generationState.stage !== 'complete'
                  ? '生成中...'
                  : '生成数字人视频'}
              </FestivalButton>
              </div>

            {/* 提示信息 */}
            <div className="tips-section">
              <p className="tip">视频时长与音频时长一致，建议15秒以内效果最佳</p>
              <p className="tip">生成的视频可以直接发送到朋友圈或抖音</p>
              <p className="tip">生成时间约1-2分钟，请耐心等待</p>
            </div>
          </>
        )}

        {/* 生成完成后的按钮 */}
        {wanVideoUrl && (
          <>
            <div className="result-actions">
              {/* 主功能按钮 - 2x2网格，参考ResultPage */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px',
                padding: '0 16px'
              }}>
                <button
                  className="action-btn action-btn-primary"
                  onClick={handleDownload}
                  style={{
                    padding: '14px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px'
                  }}
                >
                  保存视频
                </button>
                <button
                  className={`action-btn ${isSaved ? 'action-btn-secondary' : 'action-btn-primary'}`}
                  onClick={handleSave}
                  style={{
                    padding: '14px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    opacity: isSaved ? 0.7 : 1
                  }}
                >
                  {isSaved ? '已下载' : '下载视频'}
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => {
                    setWanVideoUrl(null);
                    setSubtitleUrl(null);
                    setGenerationState({
                      stage: 'idle',
                      progress: 0,
                      message: ''
                    });
                  }}
                  style={{
                    padding: '14px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px'
                  }}
                >
                  重新生成
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '14px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '12px'
                  }}
                >
                  返回首页
                </button>
              </div>

              {/* 保存成功提示 */}
              {isSaved && (
                <div style={{
                  padding: '16px',
                  margin: '0 16px 16px',
                  background: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#4CAF50', marginBottom: '8px' }}>
                    已保存到【我的作品】
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.6)' }}>
                    可在【我的作品】中查看
                  </div>
                </div>
              )}
            </div>

            {/* 继续创作面板 - 智能推荐 */}
            <ContinueCreationPanel
              currentMaterial={{
                id: `video_${Date.now()}`,
                type: 'video',
                data: { url: wanVideoUrl },
                metadata: {
                  createdAt: Date.now(),
                  featureId: 'M11',
                  featureName: '数字人拜年',
                  greetingText: text
                },
                connectors: {
                  roles: ['videoResult'],
                  canCombineWith: []
                }
              }}
            />
          </>
        )}
      </div>

      {/* 选择器弹窗 */}
      <ImageGeneratorSelector
        visible={imageSelectorVisible}
        onSelect={handleImageGenerate}
        onCancel={() => setImageSelectorVisible(false)}
      />

      <TextGeneratorSelector
        visible={textSelectorVisible}
        onSelect={handleTextGenerate}
        onCancel={() => setTextSelectorVisible(false)}
      />

      <TextTemplateSelector
        visible={templateSelectorVisible}
        onClose={() => setTemplateSelectorVisible(false)}
        onSelect={(selectedText) => {
          setText(selectedText);
          SessionMaterialManager.setTempText(selectedText, 'video-page');
          message.success('已选择文案模板');
        }}
      />

      <MaterialSelector
        type={materialSelectorType}
        visible={materialSelectorVisible}
        onSelect={handleMaterialSelect}
        onCancel={() => setMaterialSelectorVisible(false)}
      />

      {/* 下载引导弹窗 - 移动端优化版 */}
      {showDownloadModal && wanVideoUrl && (
        <div className="festival-share-modal" onClick={() => setShowDownloadModal(false)}>
          <div
            className="festival-share-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '85vh',
              overflowY: 'auto',
              margin: '8vh auto'
            }}
          >
            <div className="festival-share-modal-header">
              <h3>视频下载成功</h3>
              <button className="festival-share-close-btn" onClick={() => setShowDownloadModal(false)}>
                ✕
              </button>
            </div>

            {/* 下载成功提示 */}
            <div style={{
              padding: '16px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>✓</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '6px'
              }}>
                视频已开始下载
              </div>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                请按照以下步骤查找您的视频
              </div>
            </div>

            {/* 详细引导步骤 - 紧凑版 */}
            <div style={{
              background: '#f8f9fa',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e0e0e0'
              }}>
                📱 如何找到下载的视频
              </div>

              {/* 步骤1 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    background: '#FFD700',
                    color: '#000',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '13px',
                    marginRight: '10px',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '3px'
                    }}>
                      打开"文件" App
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      在iPhone主屏幕找到蓝色的"文件"图标
                    </div>
                  </div>
                </div>
              </div>

              {/* 步骤2 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    background: '#FFD700',
                    color: '#000',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '13px',
                    marginRight: '10px',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '3px'
                    }}>
                      点击"浏览" → "下载"
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      在底部导航栏点击"浏览"，然后找到"下载"文件夹
                    </div>
                  </div>
                </div>
              </div>

              {/* 步骤3 */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    background: '#FFD700',
                    color: '#000',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '13px',
                    marginRight: '10px',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '3px'
                    }}>
                      找到您的视频文件
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      视频文件名为"春节视频_xxx.mp4"，点击即可播放
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 移动到相册提示 - 紧凑版 */}
            <div style={{
              background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #90CAF9'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1976D2',
                marginBottom: '6px'
              }}>
                💡 如何保存到相册
              </div>
              <div style={{
                fontSize: '12px',
                color: '#1565C0',
                lineHeight: '1.5'
              }}>
                在"文件" App中找到视频后，长按视频文件 → 点击"分享" → 选择"存储视频"，即可保存到相册
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalVideoPage;
