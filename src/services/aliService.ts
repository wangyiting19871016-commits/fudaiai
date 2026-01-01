// 仅处理阿里 TTS 逻辑
// 严禁与 deepseekService.ts 共享任何 Header 变量或全局配置

/**
 * 使用阿里 CosyVoice 合成音频
 * @param text 要合成的文本
 * @returns 音频合成结果
 */
export const callAliTTS = async (text: string): Promise<any> => {
  console.log('🔧 使用阿里 CosyVoice 合成音频:', text);
  
  // 使用真实阿里CosyVoice API，禁用所有Mock模式
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || '';
  if (!apiKey) {
    throw new Error("请配置阿里DashScope API密钥");
  }
  
  try {
    // 自检逻辑：检查 input.text 是否存在
    if (!text || text.trim() === '') {
      console.error('❌ CosyVoice API调用失败: 输入文本不能为空');
      throw new Error('CosyVoice API调用失败: 输入文本不能为空');
    }
    
    // 日志透视：明确输出正在请求CosyVoice专用端点
    console.log(`📞 正在请求 CosyVoice 专用端点...`);
    const startTime = Date.now();
    
    // 官方指引 - 锁定最简 Header (排除 ID 冲突)
    const cosyVoiceHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // 小助手官方 JSON 结构 - AIGC 专线规范
    const payload = {
      "model": "cosyvoice-v3-flash",
      "input": {
        "text": text.trim(),
        "voice": "longanyang",
        "format": "wav"
      }
    };
    
    // 小助手终极修正 - 音频服务专用路径
    const apiEndpoint = '/api/dashscope/api/v1/services/audio/tts/text-to-speech';
    
    // 强制日志输出：打印最终发往阿里的完整Body JSON
    console.log('--- FINAL ALIBABA BODY ---', JSON.stringify(payload, null, 2));
    
    // 强制打印请求指纹
    console.log('--- Request Audit - CosyVoice API ---', {
      url: apiEndpoint,
      headers: cosyVoiceHeaders
    });
    
    // 使用window.fetch绕过任何潜在的拦截
    const response = await window.fetch(apiEndpoint, {
      method: 'POST',
      headers: cosyVoiceHeaders,
      body: JSON.stringify(payload)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 物理级响应校验
    console.log(`📊 响应状态码: ${response.status}`);
    
    // 1. 检查响应状态
    if (!response.ok) {
      console.error(`❌ CosyVoice API 请求失败 (${duration}ms): 状态码=${response.status}`);
      
      // 官方最后一次修正 - 修复 TypeError：只对 response 调用一次读取方法
      let errorMessage = '';
      try {
        // 先尝试解析 JSON 错误
        const errorJson = await response.json();
        console.error(`❌ 阿里返回详细 Error Payload:`, JSON.stringify(errorJson, null, 2));
        errorMessage = JSON.stringify(errorJson);
      } catch (parseError) {
        // 如果不是 JSON，使用 text 读取一次
        console.error(`❌ 解析 JSON 错误，尝试读取文本响应`);
        const errorText = await response.text();
        console.error(`❌ 阿里返回原始错误文本:`, errorText);
        errorMessage = errorText;
      }
      
      throw new Error(`阿里CosyVoice API调用失败: 状态码=${response.status} - ${errorMessage}`);
    }
    
    // 2. 检查 Content-Type
    const contentType = response.headers.get('Content-Type');
    console.log(`📋 成功响应 Content-Type: ${contentType}`);
    
    // 3. 直接解析响应的 JSON 对象
    console.log(`📊 直接解析 JSON 响应...`);
    const jsonResponse = await response.json();
    console.log(`📋 解析后的完整 JSON 响应:`, jsonResponse);
    
    // 4. 检查是否包含错误
    if (jsonResponse.error || jsonResponse.code === 400) {
      console.error(`❌ 阿里返回错误数据:`, jsonResponse);
      throw new Error(`阿里CosyVoice API错误: ${jsonResponse.message || jsonResponse.error?.message || JSON.stringify(jsonResponse)}`);
    }
    
    // 5. 提取 output.audio_url
    if (jsonResponse.output?.audio_url) {
      console.log(`✅ 从 JSON 响应中直接获取到 audio_url: ${jsonResponse.output.audio_url}`);
      return {
        success: true,
        result: {
          audioUrl: jsonResponse.output.audio_url,
          duration: text.length * 0.1,
          timestamp: Date.now()
        }
      };
    }
    
    // 6. 如果没有找到音频链接，返回错误
    console.error(`❌ 阿里 JSON 返回中没有找到 audio_url`);
    throw new Error(`阿里CosyVoice API JSON 返回中没有找到 audio_url`);
    
  } catch (error: any) {
    console.error("❌ 阿里CosyVoice API调用失败:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// 保持向后兼容
export const synthesizeAudioByAli = callAliTTS;
