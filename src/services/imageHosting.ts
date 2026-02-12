// 图床上传服务
// 支持将本地图片上传到公网图床，获取可访问的URL

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function sanitizeCosUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';

  let value = raw.trim().replace(/[\r\n\t]/g, '');
  const firstProto = value.search(/https?:\/\//i);
  if (firstProto === -1) return '';
  if (firstProto > 0) value = value.slice(firstProto);

  const mediaUrlMatch = value.match(/https?:\/\/[^\s"'<>]+?\.(jpg|jpeg|png|webp|mp3|wav|m4a|ogg|mp4)(\?[^\s"'<>]*)?/i);
  if (mediaUrlMatch?.[0]) {
    return mediaUrlMatch[0];
  }

  const protoMatches = [...value.matchAll(/https?:\/\//gi)];
  if (protoMatches.length > 1) {
    const cutAt = protoMatches[1].index ?? -1;
    if (cutAt > 0) {
      value = value.slice(0, cutAt);
    }
  }

  return value;
}

/**
 * 上传图片到腾讯云COS（通过后端中间件）
 * @param file 本地图片文件或base64字符串
 */
export async function uploadToTencentCOS(file: File | string): Promise<UploadResult> {
  try {
    console.log('[COS] 通过后端上传到腾讯云COS...');

    // 处理base64
    let base64Data: string;
    if (typeof file === 'string') {
      // 🔧 直接使用传入的字符串（VideoPage已经验证过数据干净）
      base64Data = file;
      console.log('[COS] ✅ 使用原始data URL，长度:', base64Data.length);
    } else {
      // File对象转base64
      const reader = new FileReader();
      base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      console.log('[COS] 🔍 File转base64完成，长度:', base64Data.length);
    }

    // 🔧 调用后端上传（同源 /api 形式，避免跨域CORS；开发期由Vite代理，部署期由后端同域提供）
    const uploadUrl = '/api/upload-cos';
    console.log('[COS] 🔍 base64Data长度:', base64Data.length);
    console.log('[COS] 🔍 调用后端上传:', uploadUrl);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
      cache: 'no-store'
    });

    console.log('[COS] 🔍 收到响应，status:', response.status);
    console.log('[COS] 🔍 响应headers:', Object.fromEntries(response.headers.entries()));
    console.log('[COS] 🔍 响应bodyUsed:', response.bodyUsed);

    if (!response.ok) {
      const errorText = await response.text();
      const hint = !errorText
        ? '（响应为空：常见原因是后端3002未启动/被占用，或Vite代理未转发成功。请先确认 http://localhost:3002/api/health 可访问）'
        : '';
      throw new Error(`上传失败: status=${response.status} ${errorText}${hint}`);
    }

    // 🔧 直接用response.json()避免文本处理bug
    console.log('[COS] 🔍 准备读取JSON响应...');
    const data = await response.json();
    console.log('[COS] 📦 收到响应数据:', JSON.stringify(data));

    // 🔧 直接从data中提取，不做任何处理
    if (!data.url) {
      throw new Error('后端返回的数据中没有url字段');
    }

    const finalUrl = sanitizeCosUrl(data.url);
    if (!finalUrl) {
      throw new Error('后端返回的COS URL无效');
    }

    console.log('[COS] ✅ 最终URL:', finalUrl);

    return {
      success: true,
      url: finalUrl
    };
  } catch (error: any) {
    console.error('[COS] 上传失败:', error);
    return {
      success: false,
      error: error.message || '上传失败'
    };
  }
}

/**
 * 上传图片到ImgBB图床（备用方案）
 * @param file 本地图片文件或base64字符串
 * @param apiKey ImgBB API Key
 */
export async function uploadToImgBB(file: File | string, apiKey: string): Promise<UploadResult> {
  try {
    let base64Data: string;

    if (typeof file === 'string') {
      // 已经是base64格式
      base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    } else {
      // File对象，需要转换为base64
      const reader = new FileReader();
      base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.replace(/^data:image\/\w+;base64,/, ''));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // 调用ImgBB API
    const formData = new FormData();
    formData.append('image', base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.url
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed'
      };
    }
  } catch (error: any) {
    console.error('[ImageHosting] ImgBB upload failed:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * 上传图片到Cloudinary（备选方案）
 * @param file 本地图片文件
 * @param cloudName Cloudinary cloud name
 * @param uploadPreset Unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return {
        success: true,
        url: data.secure_url
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed'
      };
    }
  } catch (error: any) {
    console.error('[ImageHosting] Cloudinary upload failed:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
}

/**
 * 上传音频到腾讯云COS（通过后端中间件）
 * @param blob 音频Blob对象
 * @param format 音频格式（mp3, wav等）
 */
export async function uploadAudioToTencentCOS(blob: Blob, format: string = 'mp3'): Promise<UploadResult> {
  try {
    console.log('[COS] 上传音频到腾讯云COS...', { size: blob.size, format });

    // Blob转base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // 🔧 调用后端上传音频（同源 /api 形式，避免跨域CORS；开发期由Vite代理，部署期由后端同域提供）
    const uploadUrl = '/api/upload-cos';
    console.log('[COS] 🔍 发送音频上传请求到后端:', uploadUrl);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Data,  // 虽然参数名叫image，但实际支持所有base64数据
        type: 'audio',
        format: format
      }),
      cache: 'no-store'
    });

    console.log('[COS] 🔍 收到响应，status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      const hint = !errorText
        ? '（响应为空：常见原因是后端3002未启动/被占用，或Vite代理未转发成功。请先确认 http://localhost:3002/api/health 可访问）'
        : '';
      throw new Error(`上传失败: status=${response.status} ${errorText}${hint}`);
    }

    // 🔧 直接用response.json()
    const data = await response.json();

    if (!data.url) {
      throw new Error('后端返回的数据中没有url字段');
    }

    const finalUrl = sanitizeCosUrl(data.url);
    if (!finalUrl) {
      throw new Error('无效的音频URL');
    }

    console.log('[COS] ✅ 音频最终URL:', finalUrl);

    return {
      success: true,
      url: finalUrl
    };
  } catch (error: any) {
    console.error('[COS] 音频上传失败:', error);
    return {
      success: false,
      error: error.message || '音频上传失败'
    };
  }
}

/**
 * 通用图片上传接口
 * 自动选择可用的图床服务（优先腾讯云COS）
 */
export async function uploadImage(file: File | string): Promise<UploadResult> {
  // 直接使用后端腾讯云COS上传（密钥在后端，安全）
  console.log('[ImageHosting] 通过后端上传到腾讯云COS...');
  const result = await uploadToTencentCOS(file);

  // COS成功就直接返回
  if (result.success) {
    return result;
  }

  // COS失败，返回错误
  console.error('[ImageHosting] COS上传失败:', result.error);
  return {
    success: false,
    error: `图片上传失败: ${result.error}`
  };
}

/**
 * 上传音频文件（通用接口）
 * @param blob 音频Blob对象
 * @param format 音频格式
 */
export async function uploadAudio(blob: Blob, format: string = 'mp3'): Promise<UploadResult> {
  // 直接使用后端腾讯云COS上传（密钥在后端，安全）
  console.log('[AudioHosting] 通过后端上传音频到腾讯云COS...');
  return uploadAudioToTencentCOS(blob, format);
}
