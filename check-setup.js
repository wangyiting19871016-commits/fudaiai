/**
 * 快速检查配置脚本
 * 运行: node check-setup.js
 */

require('dotenv').config();
const http = require('http');

console.log('\n🔍 正在检查项目配置...\n');

// 1. 检查环境变量
console.log('📋 环境变量检查：');
console.log('━'.repeat(50));

const requiredEnvVars = {
  'PORT': process.env.PORT || '3002',
  'VITE_API_BASE_URL': process.env.VITE_API_BASE_URL,
  'VITE_DASHSCOPE_API_KEY': process.env.VITE_DASHSCOPE_API_KEY,
  'DASHSCOPE_API_KEY': process.env.DASHSCOPE_API_KEY,
  'QWEN_API_KEY': process.env.QWEN_API_KEY,
  'VITE_DEEPSEEK_API_KEY': process.env.VITE_DEEPSEEK_API_KEY,
  'FISH_AUDIO_API_KEY': process.env.FISH_AUDIO_API_KEY
};

let missingKeys = [];
for (const [key, value] of Object.entries(requiredEnvVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = value
    ? (value.length > 20 ? value.substring(0, 10) + '...' : value)
    : '未配置';

  console.log(`${status} ${key.padEnd(30)} ${displayValue}`);

  if (!value && key.includes('DASHSCOPE')) {
    missingKeys.push(key);
  }
}

console.log('');

// 2. 检查必需的API Key
if (missingKeys.length > 0) {
  console.log('⚠️  警告：以下API Key未配置，视频功能将无法使用：');
  missingKeys.forEach(key => console.log(`   - ${key}`));
  console.log('\n请在.env文件中配置Dashscope API Key');
  console.log('参考: VIDEO_SETUP_GUIDE.md\n');
} else {
  console.log('✅ 所有Dashscope API Key已配置\n');
}

// 3. 检查后端服务器
console.log('🌐 后端服务器检查：');
console.log('━'.repeat(50));

const port = process.env.PORT || 3002;
const options = {
  hostname: 'localhost',
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log(`✅ 后端服务器运行正常 (http://localhost:${port})`);
  } else {
    console.log(`⚠️  后端响应异常 (状态码: ${res.statusCode})`);
  }
  console.log('\n');
  printSummary();
});

req.on('error', (e) => {
  console.log(`❌ 后端服务器未运行 (端口 ${port})`);
  console.log('   请运行: npm run server\n');
  printSummary();
});

req.on('timeout', () => {
  console.log(`⏱️  后端服务器响应超时`);
  req.destroy();
  console.log('\n');
  printSummary();
});

req.end();

// 打印总结
function printSummary() {
  console.log('📊 配置总结：');
  console.log('━'.repeat(50));

  const dashscopeConfigured = process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY;
  const deepseekConfigured = process.env.VITE_DEEPSEEK_API_KEY;
  const fishAudioConfigured = process.env.FISH_AUDIO_API_KEY;

  console.log('功能状态：');
  console.log(`  ${dashscopeConfigured ? '✅' : '❌'} 视频功能 (需要Dashscope API Key)`);
  console.log(`  ${deepseekConfigured ? '✅' : '❌'} 文案功能 (需要DeepSeek API Key)`);
  console.log(`  ${fishAudioConfigured ? '✅' : '❌'} 语音功能 (需要FishAudio API Key)`);

  console.log('\n下一步操作：');
  if (!dashscopeConfigured) {
    console.log('  1. 配置Dashscope API Key到.env文件');
    console.log('  2. 参考 VIDEO_SETUP_GUIDE.md 获取详细步骤');
  }
  console.log('  3. 确保后端运行: npm run server');
  console.log('  4. 启动前端: npm run dev');
  console.log('  5. 访问: http://localhost:5173\n');

  // 打印新功能提示
  console.log('🎨 新功能：动态卡片背景已上线！');
  console.log('  访问分类页面查看：');
  console.log('  - 拜年文案: 红金云纹动画');
  console.log('  - 语音贺卡: 音波律动效果');
  console.log('  - 赛博算命: 霓虹矩阵雨');
  console.log('  - 高情商回复: 柔和气泡流动\n');
}
