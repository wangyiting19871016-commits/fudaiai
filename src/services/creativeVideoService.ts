/**
 * 创意视频 WAN2.6 API 服务
 *
 * 完全参照 VideoPage.tsx 的轮询逻辑：
 * - 相同的超时配置（8分钟，可通过环境变量覆盖）
 * - 相同的渐进式轮询间隔（前10次3秒，之后5秒）
 * - 相同的连续错误容忍度
 * - 相同的进度模拟算法
 * - 相同的错误处理与退积分逻辑
 */

import { getBackendBaseUrl } from '../utils/backendBase';
import { getVisitorId } from '../utils/visitorId';
import { refundCreditsServer } from '../stores/creditStore';

const WAN26_MODEL = 'wan2.6-i2v-flash';
const WAN26_CREDITS_COST = 300;

// 与 VideoPage 一致的环境变量解析
function parseEnvInt(raw: unknown, fallback: number): number {
  const n = Number(String(raw ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// 与 VideoPage 完全一致：默认 8 分钟，可通过 VITE_WAN_MAX_WAIT_MS 覆盖
const WAN26_MAX_WAIT_MS = parseEnvInt(import.meta.env.VITE_WAN_MAX_WAIT_MS, 8 * 60 * 1000);
const WAN26_MAX_STATUS_ERRORS = Math.max(3, parseEnvInt(import.meta.env.VITE_WAN_MAX_STATUS_ERRORS, 8));

export interface CreativeVideoParams {
  imgUrl: string;
  prompt: string;
  resolution?: string;
  duration?: number;
  shotType?: 'single' | 'multi';
  audio?: boolean;
  promptExtend?: boolean;
  subtitleText?: string;
}

export interface GenerationProgress {
  stage: 'uploading' | 'generating' | 'subtitle' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

type ProgressCallback = (state: GenerationProgress) => void;

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

/**
 * 创建 WAN2.6 视频生成任务
 * 与 VideoPage 一致的请求结构
 */
async function createTask(params: CreativeVideoParams): Promise<string> {
  const backendUrl = getBackendBaseUrl();

  const response = await fetch(`${backendUrl}/api/dashscope/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: getVisitorId(),
      endpoint: '/api/v1/services/aigc/video-generation/video-synthesis',
      method: 'POST',
      customHeaders: { 'X-DashScope-Async': 'enable' },
      body: {
        model: WAN26_MODEL,
        input: {
          img_url: params.imgUrl,
          prompt: params.prompt
        },
        parameters: {
          resolution: params.resolution || '720P',
          duration: params.duration || 10,
          shot_type: params.shotType || 'multi',
          audio: params.audio !== false,
          prompt_extend: params.promptExtend !== false,
          watermark: false
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

  if (!response.ok) {
    const errorMsg = resultJson?.message || resultJson?.error || resultText || '任务创建失败';
    throw new Error(errorMsg);
  }

  const taskId = resultJson?.output?.task_id || '';
  if (!taskId) {
    throw new Error(`未获取到任务ID: ${resultJson?.message || '未知错误'}`);
  }

  return taskId;
}

/**
 * 轮询任务状态
 * 完全照搬 VideoPage.tsx 的轮询逻辑
 */
async function pollTaskStatus(
  taskId: string,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<string> {
  const backendUrl = getBackendBaseUrl();
  let taskStatus = 'PENDING';
  let videoUrl = '';
  let pollCount = 0;
  const pollStartTime = Date.now();
  let consecutiveStatusErrors = 0;

  while (
    taskStatus !== 'SUCCEEDED' &&
    taskStatus !== 'FAILED' &&
    (Date.now() - pollStartTime) < WAN26_MAX_WAIT_MS
  ) {
    if (abortSignal?.aborted) {
      throw new Error('用户取消了生成');
    }

    // 与 VideoPage 一致：前10次每3秒，之后每5秒
    const pollInterval = pollCount < 10 ? 3000 : 5000;
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    pollCount++;

    // 与 VideoPage 一致的进度模拟：13% ~ 90%
    const elapsed = Date.now() - pollStartTime;
    const simulatedProgress = Math.min(90, 13 + (elapsed / WAN26_MAX_WAIT_MS) * 77);
    onProgress({
      stage: 'generating',
      progress: Math.floor(simulatedProgress),
      message: `生成创意视频中，最长约${Math.max(1, Math.round((WAN26_MAX_WAIT_MS - elapsed) / 60000))}分钟`
    });

    // 与 VideoPage 完全一致的状态查询
    const statusResponse = await fetch(`${backendUrl}/api/dashscope/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      // 与 VideoPage 一致：4xx 立刻抛出
      if ([400, 401, 403, 404].includes(statusResponse.status)) {
        throw new Error(statusErrorMessage);
      }
      // 与 VideoPage 一致：连续错误达上限才抛出
      if (consecutiveStatusErrors >= WAN26_MAX_STATUS_ERRORS) {
        throw new Error(statusErrorMessage);
      }
      continue;
    }

    consecutiveStatusErrors = 0;
    const statusData = await statusResponse.json();
    taskStatus = statusData.output?.task_status || 'UNKNOWN';

    if (taskStatus === 'SUCCEEDED') {
      // WAN2.6 返回 output.video_url（非 output.results.video_url）
      const rawUrl = statusData.output?.video_url
        || statusData.output?.results?.video_url
        || '';
      // dashscope 可能返回 http://，HTTPS 页面会被浏览器拦截
      videoUrl = rawUrl.replace(/^http:\/\//, 'https://');
      break;
    } else if (taskStatus === 'FAILED') {
      throw new Error('视频生成失败');
    }
  }

  if (!videoUrl) {
    refundCreditsServer(WAN26_CREDITS_COST, '创意视频生成超时自动退回');
    throw new Error('视频生成超时，积分已自动退回，请重试');
  }

  return videoUrl;
}

/**
 * 字幕烧录（可选，复用现有 burn-subtitle）
 */
async function burnSubtitle(videoUrl: string, subtitleText: string): Promise<string> {
  const backendUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${backendUrl}/api/video/burn-subtitle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        subtitle: subtitleText.trim()
      })
    });

    const result = await response.json();

    if (result.status === 'success' && result.downloadUrl) {
      return result.downloadUrl;
    }
  } catch (err) {
    console.error('[CreativeVideo] 字幕烧录失败，使用原视频:', err);
  }

  // 降级：返回原视频
  return videoUrl;
}

/**
 * 完整的创意视频生成流程
 */
export async function generateCreativeVideo(
  params: CreativeVideoParams,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<{ videoUrl: string; persistedUrl: string }> {
  // 1. 创建任务
  onProgress({
    stage: 'generating',
    progress: 5,
    message: '正在提交视频生成任务...'
  });

  const taskId = await createTask(params);

  // 2. 轮询等待
  let videoUrl = await pollTaskStatus(taskId, onProgress, abortSignal);

  // 3. 字幕烧录（可选）
  if (params.subtitleText?.trim()) {
    onProgress({
      stage: 'subtitle',
      progress: 92,
      message: '正在添加字幕...'
    });
    videoUrl = await burnSubtitle(videoUrl, params.subtitleText);
  }

  // 4. 处理视频URL
  const safeVideoUrl = sanitizeRemoteMediaUrl(videoUrl) || videoUrl.trim();
  if (!safeVideoUrl) {
    throw new Error('视频URL异常，请重试');
  }

  onProgress({
    stage: 'complete',
    progress: 100,
    message: '视频生成完成！'
  });

  return {
    videoUrl: safeVideoUrl,
    persistedUrl: safeVideoUrl
  };
}

export { WAN26_CREDITS_COST, WAN26_MODEL };
