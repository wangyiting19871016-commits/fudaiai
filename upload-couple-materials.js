/**
 * 上传情侣素材到腾讯云COS - M3模板目录
 *
 * 文件来源: C:\Users\Administrator\Desktop\素材\情侣素材1
 * 上传到: festival-templates/m3/
 */

require('dotenv').config();
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// 腾讯云COS配置
const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

if (!secretId || !secretKey) {
  console.error('❌ 缺少腾讯云COS密钥，请检查.env文件');
  process.exit(1);
}

// 初始化COS
const cos = new COS({
  SecretId: secretId,
  SecretKey: secretKey
});

// 源文件目录
const sourceDir = 'C:\\Users\\Administrator\\Desktop\\素材\\情侣素材1';

// 文件映射（下载.png -> couple-material-1）
const fileMapping = [
  { source: '下载.png', name: 'couple-material-1' },
  { source: '下载 (1).png', name: 'couple-material-2' },
  { source: '下载 (2).png', name: 'couple-material-3' },
  { source: '下载 (3).png', name: 'couple-material-4' },
  { source: '下载 (4).png', name: 'couple-material-5' },
  { source: '下载 (5).png', name: 'couple-material-6' },
  { source: '下载 (6).png', name: 'couple-material-7' },
  { source: '下载 (7).png', name: 'couple-material-8' }
];

// 上传函数
async function uploadFile(sourcePath, targetKey) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(sourcePath);

    console.log(`📤 上传中: ${path.basename(sourcePath)} -> ${targetKey}`);
    console.log(`   文件大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: targetKey,
        Body: fileBuffer,
        ACL: 'public-read'
      },
      (err, data) => {
        if (err) {
          console.error(`❌ 上传失败: ${targetKey}`, err.message);
          reject(err);
        } else {
          const url = `https://${bucket}.cos.${region}.myqcloud.com/${targetKey}`;
          console.log(`✅ 上传成功: ${url}`);
          resolve(url);
        }
      }
    );
  });
}

// 主函数
async function main() {
  console.log('🚀 开始上传情侣素材到M3模板目录...\n');
  console.log(`📁 源目录: ${sourceDir}`);
  console.log(`📦 COS目录: festival-templates/m3/\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of fileMapping) {
    const sourcePath = path.join(sourceDir, file.source);
    const timestamp = Date.now();
    const targetKey = `festival-templates/m3/${file.name}-${timestamp}.png`;

    // 检查文件是否存在
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 文件不存在: ${sourcePath}`);
      failCount++;
      continue;
    }

    try {
      await uploadFile(sourcePath, targetKey);
      successCount++;
      // 等待1秒，避免时间戳重复
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failCount++;
    }
  }

  console.log(`\n📊 上传完成！`);
  console.log(`   ✅ 成功: ${successCount} 个`);
  console.log(`   ❌ 失败: ${failCount} 个`);
  console.log(`\n💡 提示: 刷新前端页面即可看到新模板`);
}

// 执行
main().catch(error => {
  console.error('❌ 上传过程出错:', error);
  process.exit(1);
});
