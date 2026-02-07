/**
 * 保存到相册服务
 *
 * Web端限制：无法直接保存到系统相册，只能触发下载
 * - 移动端：下载到Downloads文件夹 + 引导用户移动到相册
 * - PC端：下载到本地
 */

import { Modal, message } from 'antd';

export interface SaveOptions {
  url: string;
  filename?: string;
  type: 'image' | 'video';
}

export class SaveToAlbumService {
  /**
   * 检测是否为移动设备
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 检测是否为iOS设备
   */
  static isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  /**
   * 检测是否为Android设备
   */
  static isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  /**
   * 保存文件（主入口）
   */
  static async saveToAlbum(options: SaveOptions): Promise<boolean> {
    const { url, filename, type } = options;

    try {
      // 移动端：优先尝试Web Share API（可真正保存到相册）
      if (this.isMobile() && this.supportsWebShare()) {
        const success = await this.shareToAlbum(url, filename, type);
        if (success) return true;
      }

      // 降级方案：直接下载 + 引导
      await this.downloadFile(url, filename, type);

      if (this.isMobile()) {
        this.showMobileGuide(type);
      }

      return true;
    } catch (error) {
      console.error('[SaveToAlbum] 保存失败:', error);
      message.error('保存失败，请重试');
      return false;
    }
  }

  /**
   * 检测是否支持Web Share API
   */
  static supportsWebShare(): boolean {
    return 'share' in navigator && 'canShare' in navigator;
  }

  /**
   * 使用Web Share API分享（移动端可保存到相册）
   */
  static async shareToAlbum(url: string, filename?: string, type?: 'image' | 'video'): Promise<boolean> {
    try {
      console.log('[SaveToAlbum] 尝试Web Share API...');

      // 生成文件名
      const ext = type === 'video' ? 'mp4' : 'jpg';
      const finalFilename = filename || `福袋AI_${Date.now()}.${ext}`;

      // 获取文件
      message.loading({ content: '正在准备...', key: 'share', duration: 0 });

      const response = await fetch(url);
      const blob = await response.blob();

      const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
      const file = new File([blob], finalFilename, { type: mimeType });

      message.destroy('share');

      // 检查是否可以分享该文件
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        console.log('[SaveToAlbum] 浏览器不支持分享此类型文件');
        return false;
      }

      // 调用系统分享（iOS/Android会显示"保存到相册"选项）
      await navigator.share({
        files: [file],
        title: type === 'video' ? '保存视频到相册' : '保存图片到相册',
      });

      // 用户完成分享操作后
      console.log('[SaveToAlbum] Web Share成功');
      message.success({
        content: `操作成功！${type === 'video' ? '视频' : '图片'}已保存到相册`,
        duration: 3,
      });

      return true;
    } catch (error: any) {
      // 用户取消分享不算错误
      if (error.name === 'AbortError') {
        console.log('[SaveToAlbum] 用户取消分享');
        return false;
      }

      console.error('[SaveToAlbum] Web Share失败:', error);
      return false;
    }
  }

  /**
   * 直接下载文件
   */
  static async downloadFile(url: string, filename?: string, type?: 'image' | 'video'): Promise<boolean> {
    try {
      // 生成文件名
      const ext = type === 'video' ? 'mp4' : (type === 'image' ? 'jpg' : 'file');
      const finalFilename = filename || `福袋AI_${Date.now()}.${ext}`;

      // 创建隐藏的下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 桌面端提示
      if (!this.isMobile()) {
        message.success('已下载到本地文件夹');
      }

      return true;
    } catch (error) {
      console.error('[SaveToAlbum] 下载失败:', error);
      throw error;
    }
  }

  /**
   * 显示移动端保存引导
   */
  static showMobileGuide(type: 'image' | 'video'): void {
    const isVideo = type === 'video';
    const fileType = isVideo ? '视频' : '图片';

    let guideSteps: string[];

    if (this.isIOS()) {
      // iOS引导
      guideSteps = [
        `1. ${fileType}已保存到"文件"App的"下载"文件夹`,
        `2. 打开"文件"App，找到下载的${fileType}`,
        `3. 长按${fileType}，选择"存储${isVideo ? '视频' : '图像'}"`,
        `4. ${fileType}将保存到相册中`
      ];
    } else if (this.isAndroid()) {
      // Android引导
      guideSteps = [
        `1. ${fileType}已保存到"Downloads"文件夹`,
        `2. 打开"相册"或"图库"App`,
        `3. 查看"下载"或"Downloads"相册`,
        `4. ${fileType}已在相册中，可以移动到其他相册`
      ];
    } else {
      // 其他移动设备
      guideSteps = [
        `1. ${fileType}已保存到下载文件夹`,
        `2. 打开文件管理器或相册App`,
        `3. 查看下载文件夹`,
        `4. 将${fileType}移动到相册`
      ];
    }

    Modal.info({
      title: `${fileType}保存成功`,
      content: (
        <div style={{ paddingTop: 12 }}>
          <p style={{ marginBottom: 16, fontSize: 14, color: '#52c41a', fontWeight: 600 }}>
            {fileType}已下载到手机！
          </p>
          <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
            查看{fileType}：
          </div>
          <div style={{ fontSize: 13, lineHeight: '1.8', color: '#333' }}>
            {guideSteps.map((step, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                {step}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: '知道了',
      width: 400,
      centered: true
    });
  }

  /**
   * 批量保存（多个文件）
   */
  static async saveMultiple(files: SaveOptions[]): Promise<number> {
    let successCount = 0;

    for (const file of files) {
      try {
        await this.downloadFile(file.url, file.filename, file.type);
        successCount++;
        // 延迟，避免触发浏览器的弹窗拦截
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('[SaveToAlbum] 批量保存失败:', error);
      }
    }

    if (successCount === files.length) {
      message.success(`已保存${successCount}个文件`);
      if (this.isMobile()) {
        this.showMobileGuide(files[0].type);
      }
    } else if (successCount > 0) {
      message.warning(`已保存${successCount}/${files.length}个文件`);
    } else {
      message.error('保存失败');
    }

    return successCount;
  }

  /**
   * 获取保存按钮文案
   */
  static getSaveButtonText(type: 'image' | 'video'): string {
    return `保存${type === 'video' ? '视频' : '图片'}`;
  }
}
