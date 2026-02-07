/**
 * 测试智能字幕烧录API
 *
 * 用途：快速验证新的 /api/video/burn-subtitle 是否正常工作
 *
 * 运行：node tools/test_subtitle_api.js
 */

const axios = require('axios');

const TEST_VIDEO_URL = 'https://dashscope.oss-cn-beijing.aliyuncs.com/outputs/c8f9629a-e914-418b-a2e9-0ad3a93058c9/20250208071052509-yunchaozhi-eue2k.mp4'; // 替换为实际测试视频URL
const TEST_SUBTITLE = '马年大吉，恭喜发财！祝您身体健康，万事如意！阖家欢乐，幸福安康！';

async function test() {
  console.log('🧪 测试智能字幕烧录API');
  console.log('====================\n');

  try {
    console.log('📝 测试参数:');
    console.log(`  视频URL: ${TEST_VIDEO_URL}`);
    console.log(`  字幕内容: ${TEST_SUBTITLE}`);
    console.log();

    console.log('📤 发送请求...');
    const startTime = Date.now();

    const response = await axios.post('http://localhost:3002/api/video/burn-subtitle', {
      videoUrl: TEST_VIDEO_URL,
      subtitle: TEST_SUBTITLE
    }, {
      timeout: 90000, // 90秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const elapsed = Date.now() - startTime;

    console.log('✅ 请求成功！');
    console.log();
    console.log('📊 响应数据:');
    console.log(`  状态: ${response.data.status}`);
    console.log(`  消息: ${response.data.message}`);
    console.log(`  处理时间: ${response.data.processingTime}ms`);
    console.log(`  总耗时: ${elapsed}ms`);
    console.log(`  输出视频: ${response.data.videoUrl}`);
    console.log();

    if (response.data.status === 'success') {
      console.log('✅ 测试通过！字幕烧录功能正常');
      console.log();
      console.log('💡 下一步操作：');
      console.log(`  1. 在浏览器打开: ${response.data.videoUrl}`);
      console.log(`  2. 播放视频，检查字幕是否正确显示`);
      console.log(`  3. 检查字幕分段是否合理（按句号断句）`);
      console.log(`  4. 检查字幕样式是否美观（底部居中、黑色背景框）`);
    } else {
      console.error('❌ 测试失败：', response.data.message || response.data.error);
    }

  } catch (error) {
    console.error('\n❌ 测试失败！');

    if (error.response) {
      // 服务器返回错误
      console.error(`  HTTP状态: ${error.response.status}`);
      console.error(`  错误消息: ${error.response.data?.message || error.response.data?.error}`);
      console.error(`  详细信息: ${error.response.data?.error}`);
    } else if (error.request) {
      // 请求发送但无响应
      console.error('  服务器无响应');
      console.error('  请确认后端服务已启动: node server.js');
    } else {
      // 其他错误
      console.error('  错误:', error.message);
    }

    console.log();
    console.log('🔧 故障排查：');
    console.log('  1. 检查后端服务是否已启动: node server.js');
    console.log('  2. 检查FFmpeg是否已安装: ffmpeg -version');
    console.log('  3. 检查视频URL是否可访问');
    console.log('  4. 查看后端日志输出');
  }
}

test().catch(console.error);
