/**
 * M11 数字人健康检查工具
 * 用于诊断 INTERNAL SERVER ERROR 问题
 */

export const diagnosisM11 = async () => {
  console.log('%c=== M11 数字人健康检查 ===', 'color: #1890ff; font-size: 16px; font-weight: bold');
  console.log('');

  // 1. 检查API Key配置
  console.log('%c📝 步骤1: 检查API Key配置', 'color: #52c41a; font-weight: bold');
  const slotsStr = localStorage.getItem('apiSlots');
  if (!slotsStr) {
    console.error('❌ API插槽未配置');
    return false;
  }

  const slots = JSON.parse(slotsStr);
  const qwenSlot = slots.find((s: any) => s.id === 'qwen-primary');

  if (!qwenSlot) {
    console.error('❌ qwen-primary插槽不存在');
    console.log('   可用插槽:', slots.map((s: any) => s.id));
    return false;
  }

  const apiKey = qwenSlot.authKey?.trim();
  if (!apiKey || apiKey.length < 20) {
    console.error('❌ API Key无效，长度:', apiKey?.length || 0);
    console.log('   请前往 P4LabPage 配置阿里云DashScope API Key');
    return false;
  }

  console.log('✅ API Key配置正常');
  console.log('   长度:', apiKey.length);
  console.log('   前10位:', apiKey.substring(0, 10) + '...');
  console.log('');

  // 2. 测试API连通性
  console.log('%c🔍 步骤2: 测试阿里云DashScope连通性', 'color: #52c41a; font-weight: bold');
  try {
    const testResponse = await fetch('/api/dashscope/api/v1/services/aigc/image2video/video-synthesis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wan2.2-s2v',
        input: {
          image_url: 'https://via.placeholder.com/512',
          audio_url: 'https://example.com/test.mp3'
        },
        parameters: {
          resolution: '720P'
        }
      })
    });

    console.log('   响应状态:', testResponse.status, testResponse.statusText);

    const result = await testResponse.json();
    console.log('   响应内容:', result);

    if (testResponse.status === 500) {
      console.error('%c❌ 服务器内部错误（500）', 'color: #ff4d4f; font-weight: bold');

      const message = JSON.stringify(result).toLowerCase();
      if (message.includes('balance') || message.includes('余额')) {
        console.error('   💰 可能原因: 账户余额不足');
        console.log('   解决方法: 访问 https://dashscope.console.aliyun.com/ 充值');
      } else if (message.includes('quota') || message.includes('配额')) {
        console.error('   📊 可能原因: API配额耗尽');
        console.log('   解决方法: 申请更高配额或等待配额重置');
      } else if (message.includes('invalid') || message.includes('key')) {
        console.error('   🔑 可能原因: API Key无效');
        console.log('   解决方法: 重新生成并配置API Key');
      } else {
        console.error('   ⚠️ 其他错误:', result.message || '未知');
      }
      return false;
    }

    if (testResponse.status === 429) {
      console.error('%c❌ 请求频率超限（429）', 'color: #ff4d4f; font-weight: bold');
      console.log('   请等待5-10分钟后重试');
      return false;
    }

    if (testResponse.status === 401 || testResponse.status === 403) {
      console.error('%c❌ 认证失败（' + testResponse.status + '）', 'color: #ff4d4f; font-weight: bold');
      console.log('   请检查API Key是否正确');
      return false;
    }

    if (testResponse.ok || result.output?.task_id) {
      console.log('%c✅ API连通性正常', 'color: #52c41a; font-weight: bold');
      if (result.output?.task_id) {
        console.log('   测试任务ID:', result.output.task_id);
      }
      console.log('');
      return true;
    }

    console.warn('⚠️ API返回异常，但不是典型错误');
    console.log('   响应:', result);
    console.log('');
    return false;

  } catch (error: any) {
    console.error('%c❌ API连接失败', 'color: #ff4d4f; font-weight: bold');
    console.error('   错误:', error.message);
    console.error('   可能原因: 网络问题或代理配置错误');
    console.log('');
    return false;
  }
};

/**
 * 查看M11错误历史
 */
export const viewM11Errors = () => {
  const errors = JSON.parse(localStorage.getItem('m11_wan_errors') || '[]');
  console.log('%c=== M11 错误历史记录 ===', 'color: #1890ff; font-size: 16px; font-weight: bold');
  console.log('');

  if (errors.length === 0) {
    console.log('暂无错误记录');
    return;
  }

  errors.forEach((err: any, index: number) => {
    console.log(`%c错误 #${index + 1}`, 'color: #ff4d4f; font-weight: bold');
    console.log('  时间:', err.time);
    console.log('  错误:', err.error);
    console.log('  图片URL:', err.imageUrl);
    console.log('  音频URL:', err.audioUrl);
    console.log('');
  });
};

/**
 * 清除M11错误历史
 */
export const clearM11Errors = () => {
  localStorage.removeItem('m11_wan_errors');
  console.log('✅ M11错误历史已清除');
};

// 导出到全局window供Console使用
if (typeof window !== 'undefined') {
  (window as any).diagnosisM11 = diagnosisM11;
  (window as any).viewM11Errors = viewM11Errors;
  (window as any).clearM11Errors = clearM11Errors;

  console.log('%c💡 M11诊断工具已加载', 'color: #1890ff; font-weight: bold');
  console.log('   运行 diagnosisM11() 进行健康检查');
  console.log('   运行 viewM11Errors() 查看错误历史');
  console.log('   运行 clearM11Errors() 清除错误历史');
}
