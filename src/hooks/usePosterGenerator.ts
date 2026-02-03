/**
 * 🎨 海报生成React Hook
 *
 * 简化模板化海报生成流程
 */

import { useState, useCallback } from 'react';
import { generatePoster, downloadPoster } from '../utils/posterCanvas';
import type { PosterTemplate } from '../configs/festival/posterTemplates';
import type { PosterData } from '../utils/posterCanvas';

interface UsePosterGeneratorOptions {
  template: PosterTemplate;
  onSuccess?: (dataUrl: string) => void;
  onError?: (error: Error) => void;
}

export function usePosterGenerator(options: UsePosterGeneratorOptions) {
  const { template, onSuccess, onError } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 生成海报
   */
  const generate = useCallback(
    async (data: PosterData) => {
      try {
        setIsGenerating(true);
        setError(null);

        const dataUrl = await generatePoster(template, data);

        setPosterDataUrl(dataUrl);
        onSuccess?.(dataUrl);

        return dataUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('海报生成失败');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [template, onSuccess, onError]
  );

  /**
   * 下载海报
   */
  const download = useCallback(
    (filename?: string) => {
      if (!posterDataUrl) {
        throw new Error('没有可下载的海报');
      }
      downloadPoster(posterDataUrl, filename);
    },
    [posterDataUrl]
  );

  /**
   * 生成并下载海报
   */
  const generateAndDownload = useCallback(
    async (data: PosterData, filename?: string) => {
      const dataUrl = await generate(data);
      downloadPoster(dataUrl, filename);
      return dataUrl;
    },
    [generate]
  );

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setPosterDataUrl(null);
    setError(null);
  }, []);

  return {
    // 状态
    isGenerating,
    posterDataUrl,
    error,

    // 方法
    generate,
    download,
    generateAndDownload,
    reset,
  };
}
