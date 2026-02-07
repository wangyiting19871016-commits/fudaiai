/**
 * 字幕生成和处理服务
 * 支持生成SRT/VTT格式字幕，以及字幕烧录到视频
 */

export interface SubtitleSegment {
  index: number;
  start: number;  // 开始时间（秒）
  end: number;    // 结束时间（秒）
  text: string;   // 字幕文本
}

/**
 * 将文本按标点符号断句
 * @param text 原始文本
 * @param maxLength 每句最大长度
 * @returns 断句后的数组
 */
export function splitTextIntoSentences(text: string, maxLength: number = 20): string[] {
  // 中文标点符号
  const punctuation = /[。！？；,.!?;]/g;

  // 按标点符号分割
  const rawSentences = text.split(punctuation).filter(s => s.trim().length > 0);

  // 如果句子过长，进一步分割
  const sentences: string[] = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxLength) {
      sentences.push(sentence.trim());
    } else {
      // 按逗号或空格进一步分割
      const subSentences = sentence.split(/[，、,\s]/g).filter(s => s.trim().length > 0);
      let currentChunk = '';
      for (const sub of subSentences) {
        if ((currentChunk + sub).length <= maxLength) {
          currentChunk += (currentChunk ? '，' : '') + sub;
        } else {
          if (currentChunk) sentences.push(currentChunk.trim());
          currentChunk = sub;
        }
      }
      if (currentChunk) sentences.push(currentChunk.trim());
    }
  }

  return sentences;
}

/**
 * 根据音频时长和文本生成字幕时间轴
 * 平均分配时间（简化版，未来可接入语音识别API获取精确时间轴）
 * @param text 完整文本
 * @param audioDuration 音频总时长（秒）
 * @param maxLength 每句最大长度
 * @returns 字幕段落数组
 */
export function generateSubtitleSegments(
  text: string,
  audioDuration: number,
  maxLength: number = 20
): SubtitleSegment[] {
  const sentences = splitTextIntoSentences(text, maxLength);

  if (sentences.length === 0) {
    return [];
  }

  // 计算每个句子的字符数权重
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  // 根据字符数比例分配时间
  const segments: SubtitleSegment[] = [];
  let currentTime = 0;

  sentences.forEach((sentence, index) => {
    const charRatio = sentence.length / totalChars;
    const duration = audioDuration * charRatio;

    segments.push({
      index: index + 1,
      start: currentTime,
      end: currentTime + duration,
      text: sentence
    });

    currentTime += duration;
  });

  return segments;
}

/**
 * 将时间（秒）转换为SRT时间格式 HH:MM:SS,mmm
 * @param seconds 秒数
 * @returns SRT时间字符串
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * 将时间（秒）转换为VTT时间格式 HH:MM:SS.mmm
 * @param seconds 秒数
 * @returns VTT时间字符串
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/**
 * 生成SRT格式字幕文件内容
 * @param segments 字幕段落数组
 * @returns SRT格式字符串
 */
export function generateSRT(segments: SubtitleSegment[]): string {
  let srt = '';

  for (const segment of segments) {
    srt += `${segment.index}\n`;
    srt += `${formatSRTTime(segment.start)} --> ${formatSRTTime(segment.end)}\n`;
    srt += `${segment.text}\n\n`;
  }

  return srt.trim();
}

/**
 * 生成WebVTT格式字幕文件内容
 * @param segments 字幕段落数组
 * @returns VTT格式字符串
 */
export function generateVTT(segments: SubtitleSegment[]): string {
  let vtt = 'WEBVTT\n\n';

  for (const segment of segments) {
    vtt += `${segment.index}\n`;
    vtt += `${formatVTTTime(segment.start)} --> ${formatVTTTime(segment.end)}\n`;
    vtt += `${segment.text}\n\n`;
  }

  return vtt.trim();
}

/**
 * 将VTT字幕内容转换为Blob URL
 * @param vttContent VTT格式字符串
 * @returns Blob URL
 */
export function createSubtitleBlobURL(vttContent: string): string {
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

/**
 * 获取音频时长
 * @param audioUrl 音频URL
 * @returns Promise<音频时长（秒）>
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });

    audio.addEventListener('error', (err) => {
      reject(new Error('Failed to load audio'));
    });

    // 开始加载
    audio.load();
  });
}
