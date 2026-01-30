/**
 * 老照片修复API测试脚本
 * 用途：测试真实API调用和价格
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

// 直接使用LiblibAI密钥（从ApiVault.ts中复制）
const API_KEY = 'z8_g6KeL5Vac48fUL6am2A';
const SECRET_KEY = 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';

if (!API_KEY || !SECRET_KEY) {
  console.error('❌ 缺少LiblibAI密钥');
  process.exit(1);
}

/**
 * 上传图片到LiblibAI
 */
async function uploadImage(base64Image: string): Promise<string> {
  const liblibKey = `${API_KEY}\n${SECRET_KEY}`;

  // 动态导入sendRequest
  const { sendRequest } = await import('./src/services/apiService');

  const result = await sendRequest(
    {
      method: 'POST',
      url: '/api/liblib/upload/image',
      body: { image: base64Image }
    },
    liblibKey
  );

  if (!result.data?.url) {
    throw new Error('图片上传失败');
  }

  return result.data.url;
}

/**
 * 调用老照片修复API
 */
async function restorePhoto(imageUrl: string) {
  const liblibKey = `${API_KEY}\n${SECRET_KEY}`;

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

  console.log('\n📤 发送API请求...');
  console.log('请求体:', JSON.stringify(requestBody, null, 2));

  const { sendRequest } = await import('./src/services/apiService');

  const result = await sendRequest(
    {
      method: 'POST',
      url: '/api/liblib/api/generate/comfyui/app',
      body: requestBody
    },
    liblibKey
  );

  console.log('\n✅ API响应:', JSON.stringify(result, null, 2));

  if (!result.data?.generateUuid) {
    throw new Error('生成任务失败：未返回generateUuid');
  }

  return result.data.generateUuid;
}

/**
 * 轮询任务状态
 */
async function pollTaskStatus(generateUuid: string): Promise<any> {
  const liblibKey = `${API_KEY}\n${SECRET_KEY}`;
  const { sendRequest } = await import('./src/services/apiService');

  console.log('\n⏳ 开始轮询任务状态...');

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000)); // 每3秒查询一次

    const data = await sendRequest(
      {
        method: 'POST',
        url: '/api/liblib/api/generate/comfy/status',
        body: { generateUuid }
      },
      liblibKey
    );

    const status = data.data?.generateStatus;
    const progress = data.data?.percentCompleted || 0;
    const pointsCost = data.data?.pointsCost;

    console.log(`\n[${attempts}/${maxAttempts}] 状态: ${status}, 进度: ${(progress * 100).toFixed(0)}%`);

    if (pointsCost !== undefined) {
      console.log(`💰 预估费用: ${pointsCost} 点数 (约 ¥${(pointsCost / 100).toFixed(2)})`);
    }

    if (status === 5) {
      // 任务完成
      console.log('\n✨ 任务完成！');
      console.log('完整响应:', JSON.stringify(data.data, null, 2));

      const imageUrl = data.data?.images?.[0]?.imageUrl;
      if (imageUrl) {
        console.log(`\n📸 修复后的图片: ${imageUrl}`);
        return {
          success: true,
          imageUrl,
          pointsCost: data.data.pointsCost,
          accountBalance: data.data.accountBalance
        };
      } else {
        throw new Error('任务完成但未返回图片');
      }
    } else if (status === 6) {
      // 任务失败
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
  console.log('=' .repeat(60));

  try {
    // 检查是否有测试图片
    const testImagePath = process.argv[2];

    if (!testImagePath) {
      console.error('\n❌ 请提供测试图片路径');
      console.error('\n用法:');
      console.error('  npx tsx test-photo-restore.ts <图片路径>');
      console.error('\n示例:');
      console.error('  npx tsx test-photo-restore.ts C:\\Users\\Administrator\\Downloads\\old-photo.jpg');
      process.exit(1);
    }

    if (!fs.existsSync(testImagePath)) {
      console.error(`\n❌ 文件不存在: ${testImagePath}`);
      process.exit(1);
    }

    // 读取图片并转换为base64
    console.log(`\n📁 读取图片: ${testImagePath}`);
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    const fileSize = (imageBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`   文件大小: ${fileSize} MB`);

    // Step 1: 上传图片
    console.log('\n📤 Step 1: 上传图片到LiblibAI...');
    const imageUrl = await uploadImage(base64Image);
    console.log(`✅ 上传成功: ${imageUrl}`);

    // Step 2: 调用修复API
    console.log('\n🔧 Step 2: 调用老照片修复API...');
    const generateUuid = await restorePhoto(imageUrl);
    console.log(`✅ 任务已提交: ${generateUuid}`);

    // Step 3: 轮询任务状态
    console.log('\n⏳ Step 3: 等待AI修复...');
    const result = await pollTaskStatus(generateUuid);

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('🎉 测试完成！');
    console.log('='.repeat(60));
    console.log(`\n💰 实际费用: ${result.pointsCost} 点数 (约 ¥${(result.pointsCost / 100).toFixed(2)})`);
    console.log(`💳 账户余额: ${result.accountBalance} 点数 (约 ¥${(result.accountBalance / 100).toFixed(2)})`);
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
