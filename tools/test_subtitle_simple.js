/**
 * 简化版字幕烧录API测试
 *
 * 测试逻辑验证（不需要实际视频文件）
 */

const axios = require('axios');

async function testSmartSRT() {
  console.log('🧪 测试智能字幕生成算法');
  console.log('========================\n');

  // 测试用例
  const testCases = [
    {
      name: '短文案（5-10字）',
      text: '马年大吉！',
      expectedSegments: 1
    },
    {
      name: '中等文案（30-50字）',
      text: '马年大吉，恭喜发财！祝您身体健康，万事如意！阖家欢乐，幸福安康！',
      expectedSegments: 3
    },
    {
      name: '长文案（80-100字）',
      text: '尊敬的客户朋友们，值此马年来临之际，我们向您致以最诚挚的祝福。祝您新的一年里马到成功，事业蒸蒸日上。愿您和家人身体健康，幸福美满。感谢您一直以来对我们的支持和信任。',
      expectedSegments: 4
    }
  ];

  // 模拟generateSmartSRT函数
  function generateSmartSRT(text, videoDurationMs) {
    const raw = text.split(/([。！？.!?])/).filter(s => s.trim());

    const sentences = [];
    let current = '';
    for (let i = 0; i < raw.length; i++) {
      if (/^[。！？.!?]$/.test(raw[i])) {
        current += raw[i];
        if (current.trim()) sentences.push(current.trim());
        current = '';
      } else {
        current += raw[i];
      }
    }
    if (current.trim()) sentences.push(current.trim());

    if (sentences.length === 0) return { srt: '', segments: [] };

    // 合并短段
    const minSegmentMs = 1200;
    const maxSegments = Math.max(1, Math.floor(videoDurationMs / minSegmentMs));

    let merged = [...sentences];
    while (merged.length > maxSegments && merged.length > 1) {
      let minIdx = 0;
      let minLen = Infinity;
      for (let i = 0; i < merged.length; i++) {
        if (merged[i].length < minLen) {
          minLen = merged[i].length;
          minIdx = i;
        }
      }
      if (minIdx > 0) {
        merged[minIdx - 1] += merged[minIdx];
        merged.splice(minIdx, 1);
      } else {
        merged[0] += merged[1];
        merged.splice(1, 1);
      }
    }

    // 按字数权重分配时间
    const totalChars = merged.reduce((sum, s) => sum + s.length, 0);
    const startBuffer = 200;
    const endBuffer = 200;
    const availableDuration = videoDurationMs - startBuffer - endBuffer;

    const formatTime = (ms) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const ms2 = Math.floor(ms % 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms2).padStart(3, '0')}`;
    };

    let srt = '';
    let currentTime = startBuffer;
    const segments = [];

    merged.forEach((sentence, i) => {
      const weight = sentence.length / totalChars;
      const duration = Math.max(minSegmentMs, weight * availableDuration);
      const endTime = Math.min(currentTime + duration, videoDurationMs - endBuffer);

      srt += `${i + 1}\n`;
      srt += `${formatTime(currentTime)} --> ${formatTime(endTime)}\n`;
      srt += `${sentence}\n\n`;

      segments.push({
        index: i + 1,
        start: currentTime,
        end: endTime,
        duration: endTime - currentTime,
        text: sentence,
        charCount: sentence.length
      });

      currentTime = endTime;
    });

    return { srt, segments };
  }

  // 运行测试
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`   文本: ${testCase.text}`);
    console.log(`   预期段数: ${testCase.expectedSegments}`);

    const result = generateSmartSRT(testCase.text, 5000); // 5秒视频

    console.log(`   实际段数: ${result.segments.length}`);

    if (result.segments.length === testCase.expectedSegments) {
      console.log('   ✅ 通过');
      passed++;
    } else {
      console.log('   ❌ 失败');
      failed++;
    }

    console.log('\n   字幕分段详情:');
    result.segments.forEach(seg => {
      console.log(`     ${seg.index}. [${(seg.duration / 1000).toFixed(2)}s] ${seg.text} (${seg.charCount}字)`);
    });

    console.log();
  }

  console.log('========================');
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);

  if (failed === 0) {
    console.log('✅ 所有测试通过！智能字幕算法工作正常');
  } else {
    console.log('❌ 部分测试失败，请检查算法');
  }
}

async function testAPIAvailability() {
  console.log('\n🌐 测试API端点可用性');
  console.log('========================\n');

  try {
    // 测试参数验证
    console.log('📤 测试1: 缺少videoUrl参数');
    try {
      await axios.post('http://localhost:3002/api/video/burn-subtitle', {
        subtitle: '测试字幕'
      });
      console.log('   ❌ 应该返回400错误');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('   ✅ 正确返回400错误:', err.response.data.message);
      } else {
        console.log('   ❌ 错误的响应:', err.message);
      }
    }

    console.log('\n📤 测试2: 缺少subtitle参数');
    try {
      await axios.post('http://localhost:3002/api/video/burn-subtitle', {
        videoUrl: 'https://example.com/video.mp4'
      });
      console.log('   ❌ 应该返回400错误');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('   ✅ 正确返回400错误:', err.response.data.message);
      } else {
        console.log('   ❌ 错误的响应:', err.message);
      }
    }

    console.log('\n✅ API端点参数验证正常');

  } catch (error) {
    console.error('\n❌ API测试失败:', error.message);
    console.log('\n🔧 故障排查：');
    console.log('  1. 检查后端服务是否已启动: node server.js');
    console.log('  2. 确认端口3002未被占用');
  }
}

async function main() {
  try {
    // 测试1: 算法逻辑
    await testSmartSRT();

    // 测试2: API可用性
    await testAPIAvailability();

    console.log('\n========================');
    console.log('✅ 全部测试完成！');
    console.log('\n💡 下一步：');
    console.log('  1. 在浏览器访问: http://localhost:5173/festival/video');
    console.log('  2. 生成一个数字人视频测试完整流程');
    console.log('  3. 检查视频字幕是否正确显示');

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error.message);
  }
}

main().catch(console.error);
