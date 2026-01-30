import { ActiveProtocol, AssetBuffer } from '../stores/ActiveProtocolStore';

/**
 * 通用请求管理器
 * 根据协议定义的参数类型自动将 AssetBuffer 中的数据与 UI 参数合并后发送请求
 */
export class RequestManager {
  /**
   * 发送请求
   * @param protocol 活动协议
   * @param assetBuffer 资产缓冲区
   * @param inputParams UI输入参数
   * @returns 请求结果
   */
  static async sendRequest(
    protocol: ActiveProtocol,
    assetBuffer: AssetBuffer | null,
    inputParams: Record<string, any>
  ): Promise<any> {
    const { endpoint, io_schema } = protocol;
    
    // 准备请求数据
    const requestData = this.prepareRequestData(protocol, assetBuffer, inputParams);
    
    // 获取请求头和请求体
    const headers = this.getHeaders(protocol, requestData);
    const body = await this.getRequestBody(requestData);
    
    // 发送请求
    try {
      const { sendRequest } = await import('./apiService');
      const config = {
        method: 'POST' as const,
        url: endpoint,
        body: requestData,
        outputType: io_schema?.outputType,
        headers: headers
      };
      
      // 获取 authKey，优先从 protocol 中获取，或者尝试从 API_VAULT 中获取 (这里可能需要更复杂的逻辑，但目前先传空或从 protocol 传)
      // 注意：RequestManager 应该接收 authKey 或者由 sendRequest 内部处理
      // 这里的 protocol 是 ActiveProtocol，它通常是从 Store 中获取的，可能已经包含了 auth 信息
      const authKey = ''; // 待优化：需要从调用方或 Store 传入
      
      return await sendRequest(config, authKey);
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }
  
  /**
   * 准备请求数据
   * 根据协议定义的参数类型合并 AssetBuffer 和 UI 参数
   */
  private static prepareRequestData(
    protocol: ActiveProtocol,
    assetBuffer: AssetBuffer | null,
    inputParams: Record<string, any>
  ): any {
    // 创建基础请求数据
    const baseData = {
      ...inputParams,
      model_id: protocol.model_id,
      timestamp: new Date().toISOString()
    };
    
    // 如果有资产缓冲区，根据输入类型处理
    if (assetBuffer) {
      switch (assetBuffer.type) {
        case 'image':
        case 'video':
        case 'audio':
        case 'file':
          // 对于文件类型，我们需要使用 FormData
          return {
            ...baseData,
            asset: assetBuffer
          };
        case 'text':
          // 对于文本类型，直接添加到数据中
          return {
            ...baseData,
            text_input: typeof assetBuffer.data === 'string' ? assetBuffer.data : ''
          };
        default:
          return baseData;
      }
    }
    
    return baseData;
  }
  
  /**
   * 获取请求头
   */
  private static getHeaders(protocol: ActiveProtocol, requestData: any): Record<string, string> {
    // 如果请求数据包含文件，使用 multipart/form-data
    if (requestData.asset) {
      return {
        'Accept': 'application/json'
        // 注意：对于 FormData，浏览器会自动设置 Content-Type 并包含边界
      };
    }
    
    // 默认使用 JSON
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
  
  /**
   * 获取请求体
   */
  private static async getRequestBody(requestData: any): Promise<BodyInit | null> {
    // 如果包含资产，使用 FormData
    if (requestData.asset) {
      const formData = new FormData();
      const { asset, ...otherData } = requestData;
      
      // 添加普通参数
      formData.append('data', JSON.stringify(otherData));
      
      // 添加文件数据
      if (asset.data instanceof Blob) {
        formData.append('file', asset.data, asset.name || `asset_${Date.now()}`);
      } else if (typeof asset.data === 'string' && asset.data.startsWith('blob:')) {
        // 处理 blob URL
        const blob = await fetch(asset.data).then(r => r.blob());
        formData.append('file', blob, asset.name || `asset_${Date.now()}`);
      } else if (typeof asset.data === 'string') {
        // 处理 Base64 字符串
        formData.append('file', this.base64ToBlob(asset.data), asset.name || `asset_${Date.now()}`);
      }
      
      return formData;
    }
    
    // 否则使用 JSON
    return JSON.stringify(requestData);
  }
  
  /**
   * 将 Base64 字符串转换为 Blob 对象
   */
  private static base64ToBlob(base64: string): Blob {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  }
}
