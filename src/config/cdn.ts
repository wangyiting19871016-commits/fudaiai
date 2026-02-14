/**
 * CDN配置
 */

// CDN基础URL
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com';

/**
 * 获取CDN加速后的URL
 * @param path 相对路径（如：festival/test-templates/xxx.png）
 * @returns CDN完整URL
 */
export function getCdnUrl(path: string): string {
  // 移除开头的斜杠（如果有）
  const cleanPath = path.replace(/^\/+/, '');

  return `${CDN_BASE_URL}/${cleanPath}`;
}

/**
 * 将COS直链转换为CDN链接
 * @param url 原始COS URL
 * @returns CDN URL
 */
export function convertToCdnUrl(url: string): string {
  if (!url) return url;

  // 如果已经是CDN链接，直接返回
  if (url.includes(CDN_BASE_URL)) return url;

  // 替换COS域名为CDN域名
  return url.replace(
    'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com',
    CDN_BASE_URL
  );
}

export default {
  getCdnUrl,
  convertToCdnUrl,
  baseUrl: CDN_BASE_URL
};
