export interface AliVisionResult {
  success: boolean;
  result?: {
    description: string;
    style_tags: string[];
    visual_features: {
      color_palette: string[];
      composition: string;
      lighting: string;
      subject: string;
    };
    image_content: Array<{
      index: number;
      type: string;
      dominant_color: string;
      main_subject: string;
      description: string;
    }>;
  };
  error?: string;
  timestamp: number;
}

export interface VisionAnalysisRequest {
  images: string[];
  prompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

const ALI_VISION_MODEL = 'qwen-vl-plus';

// 图片压缩辅助函数
const compressImage = async (imageBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建 Image 对象
      const img = new Image();
      
      // 创建临时 URL
      const imgUrl = URL.createObjectURL(imageBlob);
      
      img.onload = () => {
        // 释放临时 URL
        URL.revokeObjectURL(imgUrl);
        
        // 计算压缩后的尺寸，宽度限制在 1920px 以内
        const maxWidth = 1920;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        // 创建 Canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // 获取 Canvas 上下文
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'));
          return;
        }
        
        // 绘制图片到 Canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // 将 Canvas 内容转换为 JPEG Blob，质量为 0.8
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              console.log(`📉 图片过大，已自动物理压缩至安全范围内。原大小: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB, 压缩后: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedBlob);
            } else {
              reject(new Error('Canvas 转 Blob 失败'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imgUrl);
        reject(new Error('图片加载失败'));
      };
      
      // 加载图片
      img.src = imgUrl;
    } catch (error) {
      reject(error);
    }
  });
};

// Blob 转 Base64 辅助函数
const blobToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    // 检查是否是 blob URL
    if (!blobUrl.startsWith('blob:')) {
      return blobUrl;
    }

    console.log(`[AliVision] 正在转换 blob URL 到 Base64: ${blobUrl}`);
    
    // 从 blob URL 加载数据
    const response = await fetch(blobUrl);
    let blob = await response.blob();
    
    // 图片压缩：作为通用保险，对所有图片进行压缩处理
    blob = await compressImage(blob);
    
    // 将 Blob 转换为 ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // 将 ArrayBuffer 转换为二进制字符串
    const binaryString = Array.from(new Uint8Array(arrayBuffer))
      .map(b => String.fromCharCode(b))
      .join('');
    
    // 将二进制字符串转换为 Base64
    const base64String = btoa(binaryString);
    
    // 根据文件类型生成完整的 Base64 URL
    const mimeType = blob.type || 'image/jpeg';
    const fullBase64 = `data:${mimeType};base64,${base64String}`;
    
    console.log(`✅ 已完成本地 Blob 到 Base64 的物理转换，准备发射...`);
    return fullBase64;
  } catch (error) {
    console.error(`[AliVision] Blob 转 Base64 失败: ${error}`);
    throw new Error(`Blob 转 Base64 失败: ${error}`);
  }
};

export const callAliVision = async (request: VisionAnalysisRequest): Promise<AliVisionResult> => {
  const { images, prompt, maxTokens = 1024, temperature = 0.7, model = ALI_VISION_MODEL } = request;

  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || '';
  if (!apiKey) {
    throw new Error("请配置阿里 DashScope API 密钥 (VITE_DASHSCOPE_API_KEY)");
  }

  const apiEndpoint = '/api/dashscope/api/v1/services/aigc/multimodal-generation/generation';

  const startTime = Date.now();
  console.log(`[AliVision] 开始调用视觉分析 API，端点: ${apiEndpoint}`);
  console.log(`[AliVision] 待分析图片数量: ${images.length}`);

  try {
    if (!images || images.length === 0) {
      throw new Error('没有可分析的图片素材');
    }

    const analysisPrompt = prompt || '请详细分析这些图片的内容，包括：1. 图片的主要内容和主题 2. 视觉风格特征（如：现代、复古、简约、复杂等）3. 色彩搭配 4. 构图特点 5. 适合的用途。请用 JSON 格式输出分析结果，字段包括：description（总体描述）、style_tags（风格标签数组）、color_palette（主色调数组）、composition（构图特点）、main_subject（主要主体）。';

    // 转换所有图片 URL，特别是 blob: 开头的地址
    const processedImages = await Promise.all(images.map(blobToBase64));

    const payload = {
      model: model,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              ...processedImages.map((imageData: string) => {
                // 修正阿里 JSON 协议格式：使用 type: 'image' 和 image: 'Base64数据' 结构
                return {
                  type: 'image',
                  image: imageData
                };
              })
            ]
          }
        ]
      },
      parameters: {
        max_new_tokens: maxTokens,
        temperature: temperature
      }
    };

    console.log(`[AliVision] 发送请求到阿里 DashScope...`);
    console.log(`[AliVision] 请求体预览: ${JSON.stringify(payload).substring(0, 500)}...`);

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const response = await window.fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[AliVision] 响应状态: ${response.status}, 耗时: ${duration}ms`);

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorJson = await response.json();
        console.error(`[AliVision] API 错误响应:`, JSON.stringify(errorJson, null, 2));
        errorMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
      } catch {
        const errorText = await response.text();
        console.error(`[AliVision] API 错误文本:`, errorText);
        errorMessage = errorText;
      }
      throw new Error(`阿里视觉 API 调用失败 (HTTP ${response.status}): ${errorMessage}`);
    }

    const jsonResponse = await response.json();
    console.log(`[AliVision] 原始响应:`, JSON.stringify(jsonResponse, null, 2).substring(0, 1000));

    if (jsonResponse.error) {
      throw new Error(`阿里视觉 API 错误: ${jsonResponse.error.message || JSON.stringify(jsonResponse.error)}`);
    }

    // 修复视觉解析路径：从 output.choices[0].message.content[0].text 中提取
    let contentText = '';
    let parsedResult = {
      description: '',
      style_tags: [],
      visual_features: {
        color_palette: [],
        composition: '',
        lighting: '',
        subject: ''
      },
      image_content: images.map((url, idx) => ({
        index: idx + 1,
        type: url.includes('blob:') || url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') ? 'video' : 'image',
        dominant_color: '',
        main_subject: '',
        description: ''
      }))
    };
    
    try {
      // 1. 物理提取：先提取 output.choices[0].message.content[0].text
      const text = jsonResponse.output.choices[0].message.content[0].text;
      
      // 2. 物理清洗：使用正则移除所有 ```json 和 ``` 标签
      let cleanedText = text.replace(/```json|```/g, '').trim();
      
      // 3. 智能映射字段
      const parsedJson = JSON.parse(cleanedText);
      
      // 智能映射：如果包含 "主要内容和主题"，则使用其描述
      if (parsedJson["主要内容和主题"] && parsedJson["主要内容和主题"]["描述"]) {
        contentText = parsedJson["主要内容和主题"]["描述"];
      } 
      // 否则使用传统的 description 字段
      else if (parsedJson.description && typeof parsedJson.description === 'string') {
        contentText = parsedJson.description;
      }
      // 兜底：使用原始文本的前 500 字符
      else {
        contentText = cleanedText.substring(0, 500);
      }
      
      // 智能映射：如果存在 "色彩搭配"，则转换为 visual_features.color_palette
      if (parsedJson["色彩搭配"] && Array.isArray(parsedJson["色彩搭配"])) {
        parsedResult.visual_features.color_palette = parsedJson["色彩搭配"];
      } else if (parsedJson.color_palette && Array.isArray(parsedJson.color_palette)) {
        parsedResult.visual_features.color_palette = parsedJson.color_palette;
      }
      
      // 填充其他字段
      if (parsedJson.style_tags && Array.isArray(parsedJson.style_tags)) {
        parsedResult.style_tags = parsedJson.style_tags;
      }
      
      console.log(`[AliVision] AI 生成的描述: ${contentText.substring(0, 200)}...`);
    } catch (error) {
      console.error('[AliVision] 提取内容失败，使用兜底逻辑:', error);
      console.log('[AliVision] 原始数据结构:', jsonResponse);
      
      // 4. 兜底保护：即使解析失败，也必须保留一个最简化的 description
      try {
        // 尝试从原始响应中提取一些文本作为兜底
        const text = jsonResponse.output.choices[0].message.content[0].text;
        contentText = text.replace(/```json|```/g, '').trim().substring(0, 500);
      } catch (innerError) {
        // 最极端情况：使用默认描述
        contentText = '无法解析图片内容，但继续执行流程';
      }
    }
    
    // 确保返回的结果中包含有效的 description
    parsedResult.description = contentText;
    parsedResult.image_content.forEach(item => {
      item.description = contentText;
    });

    console.log(`[AliVision] 解析结果: ${JSON.stringify(parsedResult, null, 2).substring(0, 500)}...`);

    return {
      success: true,
      result: parsedResult,
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error(`[AliVision] 调用失败: ${error.message}`);
    throw error;
  }
};

function parseVisionResponse(assistantMessage: string, images: string[]): AliVisionResult['result'] {
  try {
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 AI 返回的内容');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      description: parsed.description || '无法获取图片描述',
      style_tags: parsed.style_tags || [],
      visual_features: {
        color_palette: parsed.color_palette || [],
        composition: parsed.composition || '未知',
        lighting: parsed.lighting || '未知',
        subject: parsed.main_subject || '未知'
      },
      image_content: images.map((url, idx) => ({
        index: idx + 1,
        type: url.includes('blob:') || url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') ? 'video' : 'image',
        dominant_color: parsed.color_palette?.[0] || '未知',
        main_subject: parsed.main_subject || '未知',
        description: `这是第 ${idx + 1} 张素材`
      }))
    };
  } catch (parseError) {
    console.error(`[AliVision] 解析失败，尝试提取文本: ${parseError}`);

    return {
      description: assistantMessage.substring(0, 500),
      style_tags: extractTags(assistantMessage),
      visual_features: {
        color_palette: extractColors(assistantMessage),
        composition: extractComposition(assistantMessage),
        lighting: extractLighting(assistantMessage),
        subject: extractSubject(assistantMessage)
      },
      image_content: images.map((url, idx) => ({
        index: idx + 1,
        type: url.includes('blob:') || url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') ? 'video' : 'image',
        dominant_color: '分析中',
        main_subject: '分析中',
        description: assistantMessage.substring(idx * 100, (idx + 1) * 100)
      }))
    };
  }
}

function extractTags(text: string): string[] {
  const tagPatterns = [
    /风格[：:]\s*([^\n。]+)/,
    /特点[：:]\s*([^\n。]+)/,
    /标签[：:]\s*([^\n。]+)/
  ];

  const tags: string[] = [];
  for (const pattern of tagPatterns) {
    const match = text.match(pattern);
    if (match) {
      tags.push(...match[1].split(/[,，、]/).map(t => t.trim()).filter(Boolean));
    }
  }

  const commonTags = ['现代', '简约', '复古', '科技感', '自然', '城市', '动态', '静态', '明亮', '暗调'];
  for (const tag of commonTags) {
    if (text.includes(tag)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)].slice(0, 10);
}

function extractColors(text: string): string[] {
  const colorPatterns = [
    /色彩[：:]\s*([^\n。]+)/,
    /颜色[：:]\s*([^\n。]+)/,
    /色调[：:]\s*([^\n。]+)/
  ];

  for (const pattern of colorPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].split(/[,，、]/).map(c => c.trim()).filter(Boolean);
    }
  }

  const commonColors = ['蓝色', '红色', '绿色', '黄色', '橙色', '紫色', '粉色', '黑色', '白色', '金色', '银色'];
  const foundColors: string[] = [];
  for (const color of commonColors) {
    if (text.includes(color)) {
      foundColors.push(color);
    }
  }

  return foundColors.length > 0 ? foundColors : ['彩色'];
}

function extractComposition(text: string): string {
  const compositionMatch = text.match(/构图[：:]\s*([^\n。]+)/);
  if (compositionMatch) {
    return compositionMatch[1].trim();
  }

  if (text.includes('对称') || text.includes('平衡')) return '对称平衡';
  if (text.includes('不对称') || text.includes('不平衡')) return '不对称';
  if (text.includes('层次') || text.includes('丰富')) return '层次丰富';
  if (text.includes('简单') || text.includes('简洁')) return '简洁';

  return '标准构图';
}

function extractLighting(text: string): string {
  const lightingMatch = text.match(/光[照线]?[：:]\s*([^\n。]+)/);
  if (lightingMatch) {
    return lightingMatch[1].trim();
  }

  if (text.includes('明亮') || text.includes('高光') || text.includes('亮')) return '明亮';
  if (text.includes('暗') || text.includes('低光') || text.includes('暗调')) return '暗调';
  if (text.includes('柔和') || text.includes('柔光')) return '柔和';
  if (text.includes('强烈') || text.includes('对比')) return '强对比';

  return '自然光';
}

function extractSubject(text: string): string {
  const subjectMatch = text.match(/主题[：:]\s*([^\n。]+)/);
  if (subjectMatch) {
    return subjectMatch[1].trim();
  }

  if (text.includes('人物') || text.includes('人像') || text.includes('人')) return '人物';
  if (text.includes('风景') || text.includes('自然') || text.includes('山水')) return '风景';
  if (text.includes('建筑') || text.includes('城市') || text.includes('街道')) return '建筑';
  if (text.includes('产品') || text.includes('商品')) return '产品';
  if (text.includes('食物') || text.includes('美食')) return '食物';

  return '综合内容';
}

export const analyzeImageWithQwenVL = callAliVision;
