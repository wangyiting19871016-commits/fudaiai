// 火山引擎（字节）豆包语音 2.0 服务
// 严格按照豆包 2.0 官方API文档实现

/**
 * 使用火山引擎豆包语音 2.0 合成音频
 * @param text 要合成的文本
 * @returns 音频合成结果
 */
export const callVolcTTS = async (text: string): Promise<any> => {
  console.log('🔧 使用火山引擎豆包语音 2.0 合成音频:', text);
  
  // 使用豆包 2.0 配置 - Vite 环境变量需要 VITE_ 前缀
  const accessToken = import.meta.env.VITE_VOLC_TTS_ACCESS_TOKEN || '';
  const appId = import.meta.env.VITE_VOLC_TTS_APP_ID || '';
  const clusterId = import.meta.env.VITE_VOLC_TTS_CLUSTER_ID || 'volcano_tts';
  
  if (!accessToken) {
    throw new Error("请配置火山引擎豆包 2.0 Access Token");
  }
  
  if (!appId) {
    throw new Error("请配置火山引擎豆包 2.0 App ID");
  }
  
  try {
    // 自检逻辑：检查输入文本是否存在
    if (!text || text.trim() === '') {
      console.error('❌ 火山引擎豆包 2.0 API调用失败: 输入文本不能为空');
      throw new Error('火山引擎豆包 2.0 API调用失败: 输入文本不能为空');
    }
    
    console.log(`📞 正在请求火山引擎豆包语音 2.0 API...`);
    const startTime = Date.now();
    
    // 豆包 2.0 Header格式 - 严禁错位
    const volcHeaders = {
      'Authorization': `Bearer;${accessToken}`, // 注意：Bearer后面是分号，不是空格
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // 豆包 2.0 专用Body结构
    const payload = {
      "app": {
        "appid": appId,
        "token": accessToken,
        "cluster": "volcano_tts" // 标准集群，对应bigtts音色
      },
      "user": {
        "uid": "mission_ai_user"
      },
      "audio": {
        "voice_type": "zh_female_vv_uranus_bigtts", // 控制台列表第一项：vivi 2.0
        "encoding": "mp3",
        "compression_rate": 1
      },
      "request": {
        "reqid": `volc_tts_${Date.now()}`, // 生成唯一reqid
        "text": text.trim(),
        "operation": "query"
      }
    };
    
    // 锁定官方REST端点 - 通过Vite Proxy隧道
    const apiEndpoint = '/api/volc/api/v1/tts';
    
    // 强制日志输出：打印最终发往火山的完整Body JSON
    console.log('--- FINAL VOLC BODY ---', JSON.stringify(payload, null, 2));
    
    // 强制打印请求指纹
    console.log('--- Request Audit - Volc TTS API ---', {
      url: apiEndpoint,
      headers: volcHeaders
    });
    
    // 使用window.fetch调用API
    const response = await window.fetch(apiEndpoint, {
      method: 'POST',
      headers: volcHeaders,
      body: JSON.stringify(payload)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📊 响应状态码: ${response.status}`);
    
    // 检查响应状态
    if (!response.ok) {
      console.error(`❌ 火山引擎豆包 2.0 API请求失败 (${duration}ms): 状态码=${response.status}`);
      
      // 彻底修复读取 Bug - 严禁调用两次 response.json()
      let errorMessage = '';
      try {
        // 只调用一次 response.json() 并存储结果
        const errorJson = await response.json();
        const errorStr = JSON.stringify(errorJson, null, 2);
        console.error(`❌ 豆包 2.0 返回详细错误:`, errorStr);
        errorMessage = errorStr;
      } catch (parseError) {
        // 只调用一次 response.text() 并存储结果
        const errorText = await response.text();
        console.error(`❌ 豆包 2.0 返回原始错误文本:`, errorText);
        errorMessage = errorText;
      }
      
      throw new Error(`火山引擎豆包 2.0 API调用失败: 状态码=${response.status} - ${errorMessage}`);
    }
    
    // 解析响应JSON
    const jsonResponse = await response.json();
    console.log(`📋 解析后的完整JSON响应:`, jsonResponse);
    
    // 修正成功状态码判断 - 3000和0都是成功码
    if (jsonResponse.code !== 3000 && jsonResponse.code !== 0) {
      console.error(`❌ 火山引擎返回错误数据:`, jsonResponse);
      throw new Error(`火山引擎API错误: ${jsonResponse.msg || JSON.stringify(jsonResponse)}`);
    }
    
    console.log(`✅ 火山引擎返回成功响应: 状态码=${jsonResponse.code}, 消息=${jsonResponse.msg || 'Success'}`);
    
    // 火山引擎返回的JSON中data字段直接包含base64音频
    const audioBase64 = jsonResponse.data;
    if (!audioBase64) {
      console.error(`❌ 火山引擎响应中音频数据为空:`, jsonResponse);
      throw new Error(`火山引擎豆包 2.0 API返回中音频数据为空`);
    }
    
    console.log(`✅ 从火山引擎响应中获取到base64音频数据`);
    
    // 直接返回base64音频数据，前端可以直接播放
    return {
      success: true,
      result: {
        audioData: audioBase64,
        duration: text.length * 0.1,
        timestamp: Date.now()
      }
    };
    
  } catch (error: any) {
    console.error("❌ 火山引擎豆包 2.0 API调用失败:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// 保持向后兼容
export const synthesizeAudioByVolc = callVolcTTS;