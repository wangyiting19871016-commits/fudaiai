/**
 * 上传 M3 情侣模板到 COS
 * 从本地 Desktop\素材\换脸情侣 文件夹上传到 COS festival-templates/m3/
 */

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// COS 配置
const cos = new COS({
  SecretId: process.env.VITE_TENCENT_COS_SECRET_ID,
  SecretKey: process.env.VITE_TENCENT_COS_SECRET_KEY
});

const bucket = 'fudaiai-1400086527';
const region = 'ap-shanghai';
const sourceDir = 'C:\\Users\\Administrator\\Desktop\\素材\\换脸情侣';
const cosPrefix = 'festival-templates/m3/';

// 读取本地文件夹
const files = fs.readdirSync(sourceDir).filter(file => {
  return /\.(jpg|jpeg|png)$/i.test(file);
});

console.log(`📂 找到 ${files.length} 张情侣照片`);

// 上传函数
async function uploadFile(localPath, cosKey) {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: cosKey,
      Body: fs.createReadStream(localPath),
      onProgress: (progressData) => {
        const percent = (progressData.percent * 100).toFixed(2);
        process.stdout.write(`\r📤 上传中: ${path.basename(cosKey)} ${percent}%`);
      }
    }, (err, data) => {
      if (err) {
        console.error(`\n❌ 上传失败: ${cosKey}`, err);
        reject(err);
      } else {
        console.log(`\n✅ 上传成功: ${cosKey}`);
        resolve(data);
      }
    });
  });
}

// 批量上传
(async () => {
  console.log('\n🚀 开始上传 M3 情侣模板到 COS...\n');

  for (const file of files) {
    const localPath = path.join(sourceDir, file);
    const cosKey = cosPrefix + file;

    try {
      await uploadFile(localPath, cosKey);
    } catch (error) {
      console.error(`上传 ${file} 失败，跳过...`);
    }
  }

  console.log('\n\n🎉 所有文件上传完成！');
  console.log(`\n📊 统计:`);
  console.log(`   - 成功上传: ${files.length} 张`);
  console.log(`   - COS 路径: ${cosPrefix}`);
  console.log(`   - Bucket: ${bucket}`);
})();
