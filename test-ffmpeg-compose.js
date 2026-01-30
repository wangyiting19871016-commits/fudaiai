/**
 * FFmpeg视频合成接口测试脚本
 *
 * 用法：
 *   node test-ffmpeg-compose.js
 *
 * 前置条件：
 *   - server.js 必须在运行（端口3002）
 *   - FFmpeg 已安装
 */

const fetch = require('node-fetch');

const SERVER_URL = 'http://localhost:3002';

// 测试用例配置
const testCases = [
  {
    name: '测试1：图片转视频（带字幕）',
    payload: {
      inputUrl: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen_female_1.jpg',
      type: 'image',
      subtitle: '恭喜发财，财神到！',
      duration: 5
    }
  },
  {
    name: '测试2：图片转视频（无字幕）',
    payload: {
      inputUrl: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen_female_1.jpg',
      type: 'image',
      duration: 3
    }
  },
  {
    name: '测试3：图片转视频（长时间）',
    payload: {
      inputUrl: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen_female_1.jpg',
      type: 'image',
      subtitle: '🧧 财神爷来送福啦 🎊',
      duration: 10
    }
  }
];

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查服务器健康状态
async function checkServerHealth() {
  try {
    log('\n🔍 检查服务器状态...', 'cyan');
    const response = await fetch(`${SERVER_URL}/api/health`);
    const data = await response.json();

    if (data.status === 'ok') {
      log('✅ 服务器运行正常', 'green');
      return true;
    } else {
      log('❌ 服务器状态异常', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 无法连接到服务器: ${error.message}`, 'red');
    log('💡 请确保运行: node server.js', 'yellow');
    return false;
  }
}

// 检查FFmpeg状态
async function checkFFmpegStatus() {
  try {
    log('\n🔍 检查FFmpeg状态...', 'cyan');
    const response = await fetch(`${SERVER_URL}/api/ffmpeg-check`);
    const data = await response.json();

    if (data.status === 'active') {
      log(`✅ FFmpeg 可用: ${data.version}`, 'green');
      return true;
    } else {
      log('❌ FFmpeg 不可用', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ FFmpeg检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 执行单个测试用例
async function runTestCase(testCase, index) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`📋 ${testCase.name}`, 'cyan');
  log(`${'='.repeat(60)}`, 'blue');

  console.log('\n请求参数:');
  console.log(JSON.stringify(testCase.payload, null, 2));

  try {
    log('\n🚀 发送请求...', 'yellow');
    const startTime = Date.now();

    const response = await fetch(`${SERVER_URL}/api/video/compose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.payload)
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ 请求失败 (${response.status}): ${errorText}`, 'red');
      return false;
    }

    const result = await response.json();

    if (result.status === 'success') {
      log(`\n✅ 测试通过！耗时: ${duration}秒`, 'green');
      log(`\n📁 输出文件: ${result.fileName}`, 'cyan');
      log(`🔗 下载链接: ${result.downloadUrl}`, 'cyan');
      log(`💾 本地路径: ${result.outputPath}`, 'cyan');
      return true;
    } else {
      log(`\n❌ 测试失败: ${result.message}`, 'red');
      console.log(result);
      return false;
    }

  } catch (error) {
    log(`\n❌ 测试异常: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// 主测试流程
async function runAllTests() {
  log('\n🎬 FFmpeg视频合成接口测试', 'cyan');
  log('=' .repeat(60), 'blue');

  // 1. 检查服务器
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    log('\n❌ 测试终止：服务器不可用', 'red');
    process.exit(1);
  }

  // 2. 检查FFmpeg
  const ffmpegOk = await checkFFmpegStatus();
  if (!ffmpegOk) {
    log('\n⚠️  警告：FFmpeg可能不可用，测试可能失败', 'yellow');
  }

  // 3. 运行测试用例
  log('\n\n🧪 开始执行测试用例...', 'cyan');

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const passed = await runTestCase(testCases[i], i);
    results.push({ name: testCases[i].name, passed });

    // 等待一段时间，避免过快请求
    if (i < testCases.length - 1) {
      log('\n⏳ 等待2秒后继续...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 4. 输出测试总结
  log('\n\n' + '='.repeat(60), 'blue');
  log('📊 测试总结', 'cyan');
  log('='.repeat(60), 'blue');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} 测试${index + 1}: ${result.name}`, color);
  });

  log(`\n总计: ${passedCount}/${totalCount} 通过`, passedCount === totalCount ? 'green' : 'yellow');

  if (passedCount === totalCount) {
    log('\n🎉 所有测试通过！', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  部分测试失败，请检查日志', 'yellow');
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(error => {
  log(`\n❌ 测试执行异常: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
