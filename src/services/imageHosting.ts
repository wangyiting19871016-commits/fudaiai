// 图床上传服务
// 支持将本地图片上传到公网图床，获取可访问的URL

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
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

    // 🔧 直接调用后端，绕过Vite proxy（避免proxy损坏响应）
    console.log('[COS] 🔍 base64Data长度:', base64Data.length);
    console.log('[COS] 🔍 直接调用后端 http://localhost:3002/api/upload-cos...');
    const response = await fetch('http://localhost:3002/api/upload-cos', {
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
      throw new Error(`上传失败: ${errorText}`);
    }

    // 🔧 直接用response.json()避免文本处理bug
    console.log('[COS] 🔍 准备读取JSON响应...');
    const data = await response.json();
    console.log('[COS] 📦 收到响应数据:', JSON.stringify(data));

    // 🔧 直接从data中提取，不做任何处理
    if (!data.url) {
      throw new Error('后端返回的数据中没有url字段');
    }

    let finalUrl = data.url;

    // 🔧 强制清理URL：只保留从第一个https://到第一个文件扩展名
    if (typeof finalUrl === 'string') {
      const extensions = ['.jpg', '.jpeg', '.png', '.mp3', '.wav', '.mp4'];

      // 查找第一个https://的位置
      const firstHttpsIndex = finalUrl.indexOf('https://');
      if (firstHttpsIndex === -1) {
        throw new Error('无效的URL：不包含https://');
      }

      // 从第一个https://开始查找扩展名
      for (const ext of extensions) {
        const extIndex = finalUrl.indexOf(ext, firstHttpsIndex);
        if (extIndex > 0) {
          // 截取从第一个https://到第一个扩展名结束
          const cleanUrl = finalUrl.substring(firstHttpsIndex, extIndex + ext.length);

          if (cleanUrl !== finalUrl) {
            console.log('[COS] 🔧 URL已修复');
            console.log('[COS] 原URL长度:', finalUrl.length);
            console.log('[COS] 新URL长度:', cleanUrl.length);
          }

          finalUrl = cleanUrl;
          break;
        }
      }
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

    // 🔧 直接调用后端，绕过Vite proxy
    console.log('[COS] 🔍 发送音频上传请求到后端...');
    const response = await fetch('http://localhost:3002/api/upload-cos', {
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
      throw new Error(`上传失败: ${errorText}`);
    }

    // 🔧 直接用response.json()
    const data = await response.json();

    if (!data.url) {
      throw new Error('后端返回的数据中没有url字段');
    }

    let finalUrl = data.url;

    // 🔧 强制清理URL
    if (typeof finalUrl === 'string') {
      const extensions = ['.mp3', '.wav', '.m4a', '.ogg'];
      const firstHttpsIndex = finalUrl.indexOf('https://');
      if (firstHttpsIndex === -1) {
        throw new Error('无效的音频URL');
      }

      for (const ext of extensions) {
        const extIndex = finalUrl.indexOf(ext, firstHttpsIndex);
        if (extIndex > 0) {
          const cleanUrl = finalUrl.substring(firstHttpsIndex, extIndex + ext.length);
          if (cleanUrl !== finalUrl) {
            console.log('[COS Audio] 🔧 URL已修复');
          }
          finalUrl = cleanUrl;
          break;
        }
      }
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
  // 优先使用腾讯云COS（生产环境推荐）
  const cosSecretId = import.meta.env.VITE_TENCENT_COS_SECRET_ID;
  const cosSecretKey = import.meta.env.VITE_TENCENT_COS_SECRET_KEY;

  if (cosSecretId && cosSecretKey) {
    console.log('[ImageHosting] Using Tencent COS...');
    const result = await uploadToTencentCOS(file);

    // COS成功就直接返回
    if (result.success) {
      return result;
    }

    // COS失败，尝试降级到ImgBB
    console.warn('[ImageHosting] COS上传失败，尝试降级到ImgBB...', result.error);
  }

  // 降级方案：ImgBB
  const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (imgbbKey) {
    console.log('[ImageHosting] Using ImgBB (fallback)...');
    return uploadToImgBB(file, imgbbKey);
  }

  // 如果没有配置任何图床，返回错误提示
  return {
    success: false,
    error: '未配置图床服务。请在.env文件中设置腾讯云COS或ImgBB配置'
  };
}

/**
 * 上传音频文件（通用接口）
 * @param blob 音频Blob对象
 * @param format 音频格式
 */
export async function uploadAudio(blob: Blob, format: string = 'mp3'): Promise<UploadResult> {
  const cosSecretId = import.meta.env.VITE_TENCENT_COS_SECRET_ID;
  const cosSecretKey = import.meta.env.VITE_TENCENT_COS_SECRET_KEY;

  if (cosSecretId && cosSecretKey) {
    console.log('[AudioHosting] Using Tencent COS...');
    return uploadAudioToTencentCOS(blob, format);
  }

  return {
    success: false,
    error: '未配置音频上传服务。请在.env文件中设置腾讯云COS配置'
  };
}
