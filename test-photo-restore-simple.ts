/**
 * 老照片修复API测试脚本（简化版）
 * 直接调用API，不依赖项目代码
 */
import fs from 'fs';
import crypto from 'crypto';

// LiblibAI密钥
const API_KEY = 'z8_g6KeL5Vac48fUL6am2A';
const SECRET_KEY = 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';
const P4LAB_BASE_URL = 'https://api.n1n.dev';

/**
 * Base64 URL编码（无padding）
 */
function base64UrlNoPad(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * HMAC-SHA1签名
 */
function hmacSha1(secret: string, message: string): string {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(message);
  const signature = hmac.digest();
  return base64UrlNoPad(new Uint8Array(signature));
}

/**
 * 签名LiblibAI URL
 */
function signLiblibUrl(rawUrl: string, accessKey: string, secretKey: string): string {
  const urlObj = new URL(rawUrl, P4LAB_BASE_URL);

  const timestamp = String(Date.now());
  const signatureNonce = crypto.randomUUID();

  const uri = urlObj.pathname.startsWith('/api/liblib')
    ? urlObj.pathname.replace(/^\/api\/liblib/, '') || '/'
    : urlObj.pathname || '/';

  const content = `${uri}&${timestamp}&${signatureNonce}`;
  const signature = hmacSha1(secretKey, content);

  urlObj.searchParams.set('AccessKey', accessKey);
  urlObj.searchParams.set('Signature', signature);
  urlObj.searchParams.set('Timestamp', timestamp);
  urlObj.searchParams.set('SignatureNonce', signatureNonce);

  return urlObj.toString();
}

/**
 * 发送API请求
 */
async function sendRequest(url: string, body: any): Promise<any> {
  // LiblibAI需要签名URL
  const signedUrl = signLiblibUrl(url, API_KEY, SECRET_KEY);

  console.log('🔐 已签名URL:', signedUrl);

  const response = await fetch(signedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API请求失败 (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * 上传图片到LiblibAI
 */
async function uploadImage(base64Image: string): Promise<string> {
  console.log('📤 正在上传图片...');

  const result = await sendRequest('/api/liblib/upload/image', {
    image: base64Image
  });

  if (!result.data?.url) {
    throw new Error('图片上传失败');
  }

  console.log(`✅ 上传成功: ${result.data.url}`);
  return result.data.url;
}

/**
 * 调用老照片修复API
 */
async function restorePhoto(imageUrl: string): Promise<string> {
  console.log('\n🔧 正在调用老照片修复API...');

  const requestBody = {
    templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
    generateParams: {
      '14': {
        class_type: 'GeminiImage2Node',
        inputs: {
          prompt: 'This photo will be repaired to eliminate cracks, enhance clarity, correct colors, restore the original image, and achieve ultra-high-definition quality.'
        }
      },
      '15': {
        class_type: 'LoadImage',
        inputs: {
          image: imageUrl
        }
      },
      workflowUuid: '485582355f1b4e07a6a962380bae2292'
    }
  };

  console.log('请求体:', JSON.stringify(requestBody, null, 2));

  const result = await sendRequest('/api/liblib/api/generate/comfyui/app', requestBody);

  console.log('✅ API响应:', JSON.stringify(result, null, 2));

  if (!result.data?.generateUuid) {
    throw new Error('生成任务失败：未返回generateUuid');
  }

  console.log(`✅ 任务已提交: ${result.data.generateUuid}`);
  return result.data.generateUuid;
}

/**
 * 轮询任务状态
 */
async function pollTaskStatus(generateUuid: string): Promise<any> {
  console.log('\n⏳ 开始轮询任务状态...');

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000));

    const data = await sendRequest('/api/liblib/api/generate/comfy/status', {
      generateUuid
    });

    const status = data.data?.generateStatus;
    const progress = data.data?.percentCompleted || 0;
    const pointsCost = data.data?.pointsCost;

    console.log(`\n[${attempts}/${maxAttempts}] 状态: ${status}, 进度: ${(progress * 100).toFixed(0)}%`);

    if (pointsCost !== undefined) {
      const yuan = (pointsCost / 100).toFixed(2);
      console.log(`💰 费用: ${pointsCost} 点数 (¥${yuan})`);
    }

    if (status === 5) {
      console.log('\n✨ 任务完成！');

      const imageUrl = data.data?.images?.[0]?.imageUrl;
      if (!imageUrl) {
        throw new Error('任务完成但未返回图片');
      }

      return {
        success: true,
        imageUrl,
        pointsCost: data.data.pointsCost,
        accountBalance: data.data.accountBalance
      };
    } else if (status === 6) {
      throw new Error(`任务失败: ${data.data?.generateMsg || '未知错误'}`);
    }
  }

  throw new Error('任务超时');
}

/**
 * 主测试流程
 */
async function main() {
  console.log('🧪 开始测试老照片修复API\n');
  console.log('='.repeat(60));

  try {
    const testImagePath = process.argv[2];

    if (!testImagePath) {
      console.error('\n❌ 请提供测试图片路径');
      console.error('\n用法:');
      console.error('  npx tsx test-photo-restore-simple.ts <图片路径>');
      process.exit(1);
    }

    if (!fs.existsSync(testImagePath)) {
      console.error(`\n❌ 文件不存在: ${testImagePath}`);
      process.exit(1);
    }

    // 读取图片
    console.log(`\n📁 读取图片: ${testImagePath}`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    const fileSize = (imageBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`   文件大小: ${fileSize} MB`);

    // Step 1: 上传图片
    const imageUrl = await uploadImage(base64Image);

    // Step 2: 调用修复API
    const generateUuid = await restorePhoto(imageUrl);

    // Step 3: 轮询任务状态
    const result = await pollTaskStatus(generateUuid);

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('🎉 测试完成！');
    console.log('='.repeat(60));
    console.log(`\n💰 实际费用: ${result.pointsCost} 点数 (¥${(result.pointsCost / 100).toFixed(2)})`);
    console.log(`💳 账户余额: ${result.accountBalance} 点数 (¥${(result.accountBalance / 100).toFixed(2)})`);
    console.log(`\n📸 修复后的图片URL:`);
    console.log(result.imageUrl);
    console.log('\n提示: 图片URL有效期7天，请及时保存');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('\n错误堆栈:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
