/**
 * 快速测试老照片修复 - 使用已知图片URL
 */
import crypto from 'crypto';

const API_KEY = 'z8_g6KeL5Vac48fUL6am2A';
const SECRET_KEY = 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up';
const P4LAB_BASE_URL = 'https://api.n1n.dev';

// 使用一个已知的测试图片URL
const TEST_IMAGE_URL = 'https://liblibai-tmp-image.liblib.cloud/img/46987de339ac47e0965172f7ccd1b939/a6610deb4a0ab4e77cb6c8bb66464f7ffcc86d9156c66757eb72b0b41d8ccb49.jpg';

function base64UrlNoPad(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function hmacSha1(secret: string, message: string): string {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(message);
  return base64UrlNoPad(new Uint8Array(hmac.digest()));
}

function signLiblibUrl(rawUrl: string): string {
  const urlObj = new URL(rawUrl, P4LAB_BASE_URL);
  const timestamp = String(Date.now());
  const signatureNonce = crypto.randomUUID();
  const uri = urlObj.pathname.replace(/^\/api\/liblib/, '') || '/';
  const content = `${uri}&${timestamp}&${signatureNonce}`;
  const signature = hmacSha1(SECRET_KEY, content);

  urlObj.searchParams.set('AccessKey', API_KEY);
  urlObj.searchParams.set('Signature', signature);
  urlObj.searchParams.set('Timestamp', timestamp);
  urlObj.searchParams.set('SignatureNonce', signatureNonce);

  return urlObj.toString();
}

async function main() {
  console.log('🧪 快速测试老照片修复\n');
  console.log('测试图片:', TEST_IMAGE_URL);
  console.log('\n' + '='.repeat(60));

  try {
    // Step 1: 提交修复任务
    console.log('\n📤 提交修复任务...');

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
            image: TEST_IMAGE_URL
          }
        },
        workflowUuid: '485582355f1b4e07a6a962380bae2292'
      }
    };

    const signedUrl = signLiblibUrl('/api/liblib/api/generate/comfyui/app');

    const response = await fetch(signedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${error}`);
    }

    const result = await response.json();
    console.log('✅ 任务已提交');
    console.log('响应:', JSON.stringify(result, null, 2));

    const generateUuid = result.data?.generateUuid;
    if (!generateUuid) {
      throw new Error('未返回generateUuid');
    }

    // Step 2: 轮询任务状态
    console.log('\n⏳ 等待AI修复...');

    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusUrl = signLiblibUrl('/api/liblib/api/generate/comfy/status');
      const statusRes = await fetch(statusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateUuid })
      });

      if (!statusRes.ok) {
        console.error('❌ 状态查询失败:', statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.data?.generateStatus;
      const progress = statusData.data?.percentCompleted || 0;
      const pointsCost = statusData.data?.pointsCost;

      console.log(`[${i+1}/60] 状态:${status} 进度:${(progress*100).toFixed(0)}%`);

      if (pointsCost !== undefined) {
        console.log(`💰 费用: ${pointsCost} 点数 = ¥${(pointsCost/100).toFixed(2)}`);
      }

      if (status === 5) {
        console.log('\n✨ 修复完成！');
        console.log('\n' + '='.repeat(60));
        console.log('💰 实际费用:', pointsCost, '点数 = ¥' + (pointsCost/100).toFixed(2));
        console.log('💳 账户余额:', statusData.data?.accountBalance, '点数');
        console.log('\n📸 修复后的图片:');
        console.log(statusData.data?.images?.[0]?.imageUrl || '(未返回)');
        return;
      } else if (status === 6) {
        throw new Error('任务失败: ' + (statusData.data?.generateMsg || '未知错误'));
      }
    }

    throw new Error('超时');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();
