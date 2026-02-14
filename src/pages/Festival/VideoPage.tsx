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
import { getVisitorId } from '../../utils/visitorId';
import { refundCreditsServer, useCreditStore } from '../../stores/creditStore';
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

// ====== 安全防护：文件类型白名单 ======
const IMAGE_TYPE_WHITELIST = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

const AUDIO_TYPE_WHITELIST = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
];

// ====== 安全防护：URL验证（防SSRF）======
function validateMediaURL(url: string, type: 'image' | 'audio'): boolean {
  try {
    const parsed = new URL(url);

    // 1. 只允许HTTPS
    if (parsed.protocol !== 'https:') {
      console.warn('[Security] 只允许HTTPS协议:', url);
      return false;
    }

    // 2. 禁止访问私有IP和内网地址
    const hostname = parsed.hostname;
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,  // AWS元数据
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        console.error('[Security] 禁止访问内网地址:', hostname);
        return false;
      }
    }

    // 3. 白名单域名（根据实际使用的CDN配置）
    const trustedDomains = [
      'oss.aliyuncs.com',
      'cos.ap-beijing.myqcloud.com',
      'qiniucdn.com',
      // TODO: 添加你实际使用的CDN域名
    ];

    const isTrustedDomain = trustedDomains.some(domain =>
      hostname.includes(domain)
    );

    if (!isTrustedDomain) {
      console.warn('[Security] 不在白名单内的域名:', hostname);
      // 暂时只警告不阻止，避免影响现有功能
      // return false;
    }

    return true;
  } catch (error) {
    console.error('[Security] URL验证失败:', error);
    return false;
  }
}

function sanitizeRemoteMediaUrl(raw: string): string {
  let value = String(raw || '').trim().replace(/[\r\n\t]/g, '');
  if (!value) return '';
  if (value.startsWith('/')) return value;
  if (value.startsWith('blob:') || value.startsWith('data:')) return value;

  const firstProto = value.search(/https?:\/\//i);
  if (firstProto > 0) {
    value = value.slice(firstProto);
  }

  const protoMatches = [...value.matchAll(/https?:\/\//gi)];
  if (protoMatches.length > 1) {
    const cutAt = protoMatches[1].index ?? -1;
    if (cutAt > 0) {
      value = value.slice(0, cutAt);
    }
  }

  return value.trim();
}

function isBlobUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith('blob:');
}

function getBackendBaseUrl(): string {
  return String(import.meta.env.VITE_API_BASE_URL || '').trim();
}

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
  const [persistedVideoUrl, setPersistedVideoUrl] = useState<string>('');
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>('');
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
      if (navState.image) setImage(navState.image);
      if (navState.audio) setAudio(navState.audio);
      if (navState.text) setText(navState.text);

      return;
    }

    // 优先级2: 从临时会话恢复素材
    const tempMaterials = SessionMaterialManager.getAllTempMaterials();
    if (tempMaterials && Object.keys(tempMaterials).length > 0) {
      if (tempMaterials.text) setText(tempMaterials.text);
      if (tempMaterials.audio) {
        const restoredAudioUrl = tempMaterials.audio.url || '';
        if (isBlobUrl(restoredAudioUrl)) {
          SessionMaterialManager.clearTempMaterial('audio');
        } else {
          setAudio(restoredAudioUrl);
        }
      }
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

  // ========== Blob URL 清理（防止内存泄露）==========
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有Blob URLs
      if (audio && audio.startsWith('blob:')) {
        URL.revokeObjectURL(audio);
      }
      if (wanVideoUrl && wanVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(wanVideoUrl);
      }
      if (subtitleUrl && subtitleUrl.startsWith('blob:')) {
        URL.revokeObjectURL(subtitleUrl);
      }
    };
  }, [audio, wanVideoUrl, subtitleUrl]);

  // ========== 素材操作：图片 ==========
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ 安全检查：文件类型
    if (!IMAGE_TYPE_WHITELIST.includes(file.type)) {
      message.error('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // ✅ 安全检查：文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
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

    // ✅ 安全检查：文件类型
    if (!AUDIO_TYPE_WHITELIST.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      message.error('仅支持 MP3、WAV、M4A、AAC、OGG 格式的音频');
      return;
    }

    // ✅ 安全检查：文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      message.error('音频大小不能超过 20MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudio(url);
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

    const VIDEO_CREDITS_COST = 200;
    const enforceCredits = String(import.meta.env.VITE_CREDIT_ENFORCE ?? 'on').toLowerCase();
    if (!['off', 'false', '0'].includes(enforceCredits)) {
      if (!useCreditStore.getState().checkCredits(VIDEO_CREDITS_COST)) {
        message.error(`积分不足，视频生成需要 ${VIDEO_CREDITS_COST} 积分`);
        return;
      }
    }

    setIsSaved(false);
    setGeneratedAudioUrl('');
    setPersistedVideoUrl('');

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
        // ✅ 安全检查：URL验证（防SSRF）
        if (!validateMediaURL(image, 'image')) {
          throw new Error('图片URL不符合安全要求，请使用HTTPS协议和可信域名');
        }

        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const reader = new FileReader();
          imageToUpload = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn('[VideoPage] HTTP图片转换失败，尝试直接使用:', err);
        }
      }

      // 上传图片
      const imageUploadResult = await uploadImage(imageToUpload);
      if (!imageUploadResult.success) {
        throw new Error(imageUploadResult.error || '图片上传失败');
      }
      const safeImageUrl = sanitizeRemoteMediaUrl(String(imageUploadResult.url || ''));
      if (!safeImageUrl) {
        throw new Error('图片上传URL异常，请重试');
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
          try {
            const response = await fetch(audioUrl);
            if (!response.ok) {
              throw new Error(`blob audio fetch failed: ${response.status}`);
            }
            audioBlob = await response.blob();
          } catch {
            throw new Error('闊抽涓存椂閾炬帴宸插け鏁堬紝璇烽噸鏂颁笂浼犳垨閲嶆柊鐢熸垚闊抽');
          }
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
        const safeAudioUrl = sanitizeRemoteMediaUrl(String(audioUploadResult.url || ''));
        if (!safeAudioUrl) {
          throw new Error('音频上传URL异常，请重试');
        }
        audioUploadResult.url = safeAudioUrl;
        setGeneratedAudioUrl(safeAudioUrl);

        setGenerationState({
          stage: 'tts',
          progress: 13,
          message: '音频上传完成'
        });

        const parseEnvInt = (raw: unknown, fallback: number): number => {
          const n = Number(String(raw ?? '').trim());
          return Number.isFinite(n) && n > 0 ? n : fallback;
        };

        const maxWaitMs = parseEnvInt(import.meta.env.VITE_WAN_MAX_WAIT_MS, 8 * 60 * 1000);
        const maxStatusErrors = Math.max(3, parseEnvInt(import.meta.env.VITE_WAN_MAX_STATUS_ERRORS, 8));

        // WAN数字人视频生成
        setGenerationState({
          stage: 'wan',
          progress: 13,
          message: `生成数字人视频中，最长约${Math.max(1, Math.round(maxWaitMs / 60000))}分钟`
        });

        // 启动进度模拟定时器
        const startTime = Date.now();
        const estimatedTime = maxWaitMs;
        const progressTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const simulatedProgress = Math.min(90, 13 + (elapsed / estimatedTime) * 77);
          const remainingSeconds = Math.max(0, Math.ceil((estimatedTime - elapsed) / 1000));

          setGenerationState({
            stage: 'wan',
            progress: Math.floor(simulatedProgress),
            message: `生成数字人视频中，最长还需${remainingSeconds}秒`
          });
        }, 1000);

        const backendUrl = getBackendBaseUrl() || 'http://localhost:3002';

        // WAN API异步任务 - 通过后端代理调用
        let wanResult;
        try {

          const preferredModel = (import.meta.env.VITE_WAN_MODEL || '').trim();
          const modelCandidates = Array.from(new Set([preferredModel, 'wan2.2-s2v'].filter(Boolean)));

          let taskId = '';
          let createTaskError = '';
          for (const modelName of modelCandidates) {
            const response = await fetch(`${backendUrl}/api/dashscope/proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                visitorId: getVisitorId(),
                endpoint: '/api/v1/services/aigc/image2video/video-synthesis',
                method: 'POST',
                customHeaders: {
                  'X-DashScope-Async': 'enable'
                },
                body: {
                  model: modelName,
                  input: {
                    image_url: safeImageUrl,
                    audio_url: audioUploadResult.url
                  },
                  parameters: {
                    resolution: '720P'
                  }
                }
              })
            });

            const resultText = await response.text();
            let resultJson: any = null;
            try {
              resultJson = JSON.parse(resultText);
            } catch {
              resultJson = null;
            }

            if (response.ok) {
              const maybeTaskId = resultJson?.output?.task_id || '';
              if (maybeTaskId) {
                taskId = maybeTaskId;
                break;
              }
            }

            createTaskError = resultJson?.message || resultJson?.error || resultText || `model=${modelName} failed`;
            if ([400, 401, 403, 404].includes(response.status)) {
              throw new Error(createTaskError);
            }
          }

          if (!taskId) {
            throw new Error(`未获取到任务ID: ${createTaskError}`);
          }

          // 轮询任务状态 - 渐进式间隔
          let taskStatus = 'PENDING';
          let videoUrl = '';
          let pollCount = 0;
          const pollStartTime = Date.now();

          let consecutiveStatusErrors = 0;
          while (taskStatus !== 'SUCCEEDED' && taskStatus !== 'FAILED' && (Date.now() - pollStartTime) < maxWaitMs) {
            // 渐进式轮询：前10次每3秒，之后每5秒
            const pollInterval = pollCount < 10 ? 3000 : 5000;
            await new Promise(resolve => setTimeout(resolve, pollInterval));
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
              consecutiveStatusErrors += 1;
              let statusErrorMessage = `状态查询失败(${statusResponse.status})`;
              try {
                const statusErrorText = await statusResponse.text();
                const statusErrorJson = JSON.parse(statusErrorText);
                statusErrorMessage = statusErrorJson?.message || statusErrorJson?.error || statusErrorMessage;
              } catch {
                // ignore
              }
              if ([400, 401, 403, 404].includes(statusResponse.status)) {
                throw new Error(statusErrorMessage);
              }
              if (consecutiveStatusErrors >= maxStatusErrors) {
                throw new Error(statusErrorMessage);
              }
              continue;
            }

            consecutiveStatusErrors = 0;
            const statusData = await statusResponse.json();
            taskStatus = statusData.output?.task_status || 'UNKNOWN';

            if (taskStatus === 'SUCCEEDED') {
              videoUrl = statusData.output?.results?.video_url || '';
              break;
            } else if (taskStatus === 'FAILED') {
              throw new Error('视频生成失败');
            }
          }

          if (!videoUrl) {
            refundCreditsServer(200, '视频生成超时自动退回');
            throw new Error('视频生成超时，积分已自动退回，请重试');
          }

          wanResult = { output: { results: { video_url: videoUrl } } };

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
          const postProcessResponse = await fetch(`${backendUrl}/api/video/burn-subtitle`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              videoUrl: remoteVideoUrl,
              subtitle: text.trim()
            })
          });

          const postProcessResult = await postProcessResponse.json();

          if (postProcessResult.status === 'success' && postProcessResult.downloadUrl) {
            remoteVideoUrl = postProcessResult.downloadUrl;
          }
        } catch (subtitleErr) {
          console.error('[VideoPage] 字幕烧录失败:', subtitleErr);
          // 失败不影响流程，继续使用原视频
        }
      }

      // 步骤6: 将视频转为本地Blob URL（关键！这样才能长按保存）
      setGenerationState({
        stage: 'wan',
        progress: 95,
        message: '加载视频中...'
      });

      // Try blob URL first for better download behavior; fallback to remote URL if fetch is blocked.
      const safeRemoteVideoUrl = sanitizeRemoteMediaUrl(String(remoteVideoUrl || '')) || String(remoteVideoUrl || '').trim();
      setPersistedVideoUrl(safeRemoteVideoUrl);
      if (!safeRemoteVideoUrl) {
        throw new Error('瑙嗛URL寮傚父锛岃閲嶈瘯');
      }
      try {
        const videoResponse = await fetch(safeRemoteVideoUrl);
        if (!videoResponse.ok) {
          throw new Error(`video fetch failed: ${videoResponse.status}`);
        }
        const videoBlob = await videoResponse.blob();
        const localBlobUrl = URL.createObjectURL(videoBlob);
        setWanVideoUrl(localBlobUrl);
      } catch {
        setWanVideoUrl(safeRemoteVideoUrl);
      }

      setGenerationState({
        stage: 'complete',
        progress: 100,
        message: '视频生成完成！'
      });

    } catch (err) {
      console.error('[VideoPage] 生成失败:', err);
      const errorMessage = err instanceof Error ? err.message : '视频生成失败';
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
    if (!wanVideoUrl) {
      message.error('视频链接无效，请重新生成');
      return;
    }

    // 直接显示长按保存引导
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    if (!isMobile) {
      const a = document.createElement('a');
      a.href = wanVideoUrl;
      a.download = `春节视频_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      message.success('下载已开始');
      return;
    }

    setShowDownloadModal(true);
  };

  // ========== 保存到我的作品 ==========
  const handleSave = () => {
    if (!wanVideoUrl) {
      message.error('视频链接无效，请重新生成');
      return;
    }
    if (isSaved) {
      message.info('已保存到【我的作品】');
      return;
    }

    const now = Date.now();
    const videoMaterial: MaterialAtom = {
      id: `material_video_${now}`,
      type: 'video',
      data: { url: persistedVideoUrl || wanVideoUrl },
      metadata: {
        createdAt: now,
        featureId: 'M11',
        featureName: '数字人拜年',
        greetingText: text
      },
      connectors: {
        roles: ['videoResult'],
        canCombineWith: []
      }
    };
    MaterialService.saveMaterial(videoMaterial);

    // 同步保存一份音频素材，保证“我的作品”可预览音频
    const audioForSave = sanitizeRemoteMediaUrl(generatedAudioUrl || audio || '');
    if (audioForSave) {
      const audioMaterial: MaterialAtom = {
        id: `material_video_audio_${now}`,
        type: 'audio',
        data: {
          url: audioForSave,
          text: text.trim() || undefined,
        },
        metadata: {
          createdAt: now,
          featureId: 'M11',
          featureName: '数字人拜年配音',
          greetingText: text,
        },
        connectors: {
          roles: ['videoAudio'],
          canCombineWith: ['image', 'text', 'video'],
        },
      };
      MaterialService.saveMaterial(audioMaterial);
    }

    setIsSaved(true);
    message.success('已保存到【我的作品】');
  };

  // ========== 清除素材 ==========
  const handleClearImage = () => {
    setImage('');
    SessionMaterialManager.clearTempMaterial('image');
  };

  const handleClearAudio = () => {
    setAudio('');
    setGeneratedAudioUrl('');
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
              />
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
              <div className="video-result-button-grid">
                <button
                  className="action-btn action-btn-primary"
                  onClick={handleDownload}
                >
                  下载视频
                </button>
                <button
                  className={`action-btn ${isSaved ? 'action-btn-secondary is-saved' : 'action-btn-primary'}`}
                  onClick={handleSave}
                >
                  {isSaved ? '已保存到我的作品' : '保存到我的作品'}
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => {
                    setWanVideoUrl(null);
                    setSubtitleUrl(null);
                    setGeneratedAudioUrl('');
                    setPersistedVideoUrl('');
                    setIsSaved(false);
                    setGenerationState({
                      stage: 'idle',
                      progress: 0,
                      message: ''
                    });
                  }}
                >
                  重新生成
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => navigate('/')}
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
                data: { url: persistedVideoUrl || wanVideoUrl },
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

