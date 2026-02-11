/**
 * 🎯 会话级临时素材管理
 *
 * 用途：管理制作流程中的临时素材（文案、音频、图片）
 * 特点：
 * - 使用 sessionStorage，页面刷新不丢失，关闭标签页自动清理
 * - 不占用 MaterialService 的 50 条限制
 * - 同类素材自动替换，避免垃圾素材积累
 * - 用户点"保存到我的作品"时才存入 MaterialService
 */

interface TempMaterial {
  type: 'text' | 'audio' | 'image';
  data: any;
  createdAt: number;
  sourceFeatureId?: string;
}

interface SessionData {
  // 当前制作会话的临时素材
  tempText?: TempMaterial;
  tempAudio?: TempMaterial;
  tempImage?: TempMaterial;

  // 返回路径追踪
  returnPath?: string;

  // 会话元数据
  sessionId?: string;
  lastUpdated?: number;
}

class SessionMaterialManagerClass {
  private readonly STORAGE_KEY = 'festival_session_materials';

  /**
   * 获取会话数据
   */
  private getSessionData(): SessionData {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to read session data:', error);
      return {};
    }
  }

  /**
   * 保存会话数据
   */
  private saveSessionData(data: SessionData): void {
    try {
      data.lastUpdated = Date.now();
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('[SessionMaterialManager] SessionStorage quota exceeded, clearing...');
        sessionStorage.removeItem(this.STORAGE_KEY);
        // Retry with empty data
        const freshData: SessionData = { lastUpdated: Date.now() };
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(freshData));
      } else {
        console.error('Failed to save session data:', error);
      }
    }
  }

  /**
   * 保存临时文案
   * 会自动替换旧文案，不会累积
   */
  setTempText(text: string, sourceFeatureId?: string): void {
    const sessionData = this.getSessionData();
    sessionData.tempText = {
      type: 'text',
      data: text,
      createdAt: Date.now(),
      sourceFeatureId
    };
    this.saveSessionData(sessionData);
  }

  /**
   * 获取临时文案
   */
  getTempText(): string | null {
    const sessionData = this.getSessionData();
    return sessionData.tempText?.data || null;
  }

  /**
   * 保存临时音频
   * 会自动替换旧音频，不会累积
   */
  setTempAudio(audioUrl: string, text?: string, sourceFeatureId?: string): void {
    const sessionData = this.getSessionData();
    sessionData.tempAudio = {
      type: 'audio',
      data: { url: audioUrl, text },
      createdAt: Date.now(),
      sourceFeatureId
    };
    this.saveSessionData(sessionData);
  }

  /**
   * 获取临时音频
   */
  getTempAudio(): { url: string; text?: string } | null {
    const sessionData = this.getSessionData();
    return sessionData.tempAudio?.data || null;
  }

  /**
   * 保存临时图片
   * 会自动替换旧图片，不会累积
   */
  setTempImage(imageUrl: string, caption?: string, sourceFeatureId?: string): void {
    const sessionData = this.getSessionData();
    sessionData.tempImage = {
      type: 'image',
      data: { url: imageUrl, caption },
      createdAt: Date.now(),
      sourceFeatureId
    };
    this.saveSessionData(sessionData);
  }

  /**
   * 获取临时图片
   */
  getTempImage(): { url: string; caption?: string } | null {
    const sessionData = this.getSessionData();
    return sessionData.tempImage?.data || null;
  }

  /**
   * 设置返回路径
   * 用于从生成页返回制作页
   */
  setReturnPath(path: string): void {
    const sessionData = this.getSessionData();
    sessionData.returnPath = path;
    this.saveSessionData(sessionData);
  }

  /**
   * 获取返回路径
   */
  getReturnPath(): string | null {
    const sessionData = this.getSessionData();
    return sessionData.returnPath || null;
  }

  /**
   * 清除返回路径
   */
  clearReturnPath(): void {
    const sessionData = this.getSessionData();
    delete sessionData.returnPath;
    this.saveSessionData(sessionData);
  }

  /**
   * 获取所有临时素材
   * 用于制作页自动填充
   */
  getAllTempMaterials(): {
    text?: string;
    audio?: { url: string; text?: string };
    image?: { url: string; caption?: string };
  } {
    const sessionData = this.getSessionData();
    return {
      text: sessionData.tempText?.data,
      audio: sessionData.tempAudio?.data,
      image: sessionData.tempImage?.data
    };
  }

  /**
   * 清除所有临时素材
   * 用于：
   * 1. 用户点击"重新制作"
   * 2. 制作完成后
   * 3. 用户主动退出流程
   */
  clearAllTempMaterials(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * 清除特定类型的临时素材
   */
  clearTempMaterial(type: 'text' | 'audio' | 'image'): void {
    const sessionData = this.getSessionData();
    const key = `temp${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SessionData;
    delete sessionData[key];
    this.saveSessionData(sessionData);
  }

  /**
   * 检查是否有临时素材
   */
  hasTempMaterials(): boolean {
    const sessionData = this.getSessionData();
    return !!(sessionData.tempText || sessionData.tempAudio || sessionData.tempImage);
  }

  /**
   * 获取会话年龄（毫秒）
   * 用于检测过期会话
   */
  getSessionAge(): number | null {
    const sessionData = this.getSessionData();
    if (!sessionData.lastUpdated) return null;
    return Date.now() - sessionData.lastUpdated;
  }

  /**
   * 清理过期会话（超过24小时）
   */
  cleanupExpiredSession(): void {
    const age = this.getSessionAge();
    if (age && age > 24 * 60 * 60 * 1000) {
      this.clearAllTempMaterials();
    }
  }
}

// 单例导出
export const SessionMaterialManager = new SessionMaterialManagerClass();
