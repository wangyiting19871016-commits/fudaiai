#!/usr/bin/env node

/**
 * 紧急测试：检查可灵API当前状态
 * 直接调用API，绕过server.js逻辑
 */

const https = require('https');
const jwt = require('jsonwebtoken');

// 从.env文件手动加载
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

console.log('🔍 检查API密钥...');
console.log('Access Key前缀:', KLING_ACCESS_KEY.substring(0, 12) + '...');
console.log('Secret Key前缀:', KLING_SECRET_KEY.substring(0, 12) + '...');

if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
  console.error('❌ 缺少API密钥');
  process.exit(1);
}

// 生成JWT
function generateJWT() {
  const currentTime = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: KLING_ACCESS_KEY,
    exp: currentTime + 1800,
    nbf: currentTime - 5,
    jti: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  console.log('🔑 JWT Payload:', {
    iss: jwtPayload.iss.substring(0, 8) + '...',
    exp: new Date(jwtPayload.exp * 1000).toISOString(),
    nbf: new Date(jwtPayload.nbf * 1000).toISOString(),
    jti: jwtPayload.jti.substring(0, 20) + '...'
  });
  
  return jwt.sign(jwtPayload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 测试1：检查API健康状态
async function testAPIHealth() {
  return new Promise((resolve) => {
    const token = generateJWT();
    
    const options = {
      hostname: 'api-beijing.klingai.com',
      path: '/v1/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    };
    
    console.log('\n🩺 测试1：API健康检查');
    console.log('URL: https://api-beijing.klingai.com/v1/health');
    
    const req = https.request(options, (res) => {
      let data = '';
      console.log(`响应状态码: ${res.statusCode}`);
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('响应体:', data);
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      resolve({ error: err.message });
    });
    
    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      resolve({ error: 'timeout' });
    });
    
    req.end();
  });
}

// 测试2：测试单个模板（用已知可用的）
async function testSingleTemplate(effect_scene, name) {
  return new Promise((resolve) => {
    const token = generateJWT();
    
    const requestBody = JSON.stringify({
      effect_scene: effect_scene,
      input: {
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3'
      }
    });
    
    console.log(`\n🎬 测试模板: ${name} (${effect_scene})`);
    
    const options = {
      hostname: 'api-beijing.klingai.com',
      path: '/v1/videos/effects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      console.log(`响应状态码: ${res.statusCode}`);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('响应体长度:', data.length);
        
        try {
          const response = JSON.parse(data);
          console.log('解析响应:', {
            code: response.code,
            message: response.message,
            has_task_id: !!(response.data && response.data.task_id)
          });
          
          if (response.data && response.data.task_id) {
            console.log('✅ 任务ID:', response.data.task_id);
            resolve({ success: true, taskId: response.data.task_id, response });
          } else {
            console.log('❌ 错误响应:', response);
            resolve({ success: false, response });
          }
        } catch (err) {
          console.log('❌ 响应解析失败:', err.message);
          console.log('原始响应前500字符:', data.substring(0, 500));
          resolve({ success: false, parseError: err.message, rawData: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });
    
    req.write(requestBody);
    req.end();
  });
}

// 测试3：查询任务状态
async function queryTaskStatus(taskId) {
  return new Promise((resolve) => {
    const token = generateJWT();
    
    console.log(`\n🔍 查询任务状态: ${taskId}`);
    
    const options = {
      hostname: 'api-beijing.klingai.com',
      path: `/v1/videos/effects/${taskId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      console.log(`响应状态码: ${res.statusCode}`);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('响应体长度:', data.length);
        
        try {
          const response = JSON.parse(data);
          console.log('解析响应:', {
            code: response.code,
            message: response.message,
            task_status: response.data?.task_status
          });
          
          if (response.data) {
            console.log('✅ 任务状态:', response.data.task_status);
            resolve({ success: true, status: response.data.task_status, response });
          } else {
            console.log('❌ 错误响应:', response);
            resolve({ success: false, response });
          }
        } catch (err) {
          console.log('❌ 响应解析失败:', err.message);
          console.log('原始响应前500字符:', data.substring(0, 500));
          resolve({ success: false, parseError: err.message, rawData: data });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });
    
    req.end();
  });
}

// 主函数
async function main() {
  console.log('🚀 紧急测试：可灵API当前状态');
  console.log('📅 时间:', new Date().toISOString());
  
  // 测试1：API健康
  const healthResult = await testAPIHealth();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试2：测试几个模板
  const templates = [
    { effect_scene: 'new_year_greeting', name: '拜年讨红包' },
    { effect_scene: 'celebration', name: '欢庆时刻' },
    { effect_scene: 'lion_dance', name: '舞狮' },
    { effect_scene: 'expansion', name: '万物膨胀' }
  ];
  
  const results = [];
  
  for (const template of templates) {
    console.log('\n' + '='.repeat(60));
    console.log(`测试模板: ${template.name}`);
    console.log('='.repeat(60));
    
    const result = await testSingleTemplate(template.effect_scene, template.name);
    results.push({
      template: template.name,
      effect_scene: template.effect_scene,
      success: result.success,
      taskId: result.taskId,
      error: result.error,
      responseCode: result.response?.code
    });
    
    if (result.success && result.taskId) {
      // 等待2秒后查询状态
      await new Promise(resolve => setTimeout(resolve, 2000));
      await queryTaskStatus(result.taskId);
    }
    
    // 等待5秒避免速率限制
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 总结
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试结果总结');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`测试模板数: ${results.length}`);
  console.log(`✅ 成功创建任务: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  
  console.log('\n详细结果:');
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${i+1}. ${r.template} (${r.effect_scene}) - ${r.success ? `任务ID: ${r.taskId}` : `错误: ${r.error || 'API错误'}`}`);
  });
  
  // 分析可能的问题
  console.log('\n💡 可能的问题分析:');
  
  if (successCount === 0) {
    console.log('1. 🔴 API密钥可能已失效或过期');
    console.log('2. 🔴 可灵API服务端故障');
    console.log('3. 🔴 JWT签名有问题（时间不同步等）');
  } else if (failCount > 0) {
    console.log('1. 🟡 部分模板可能已下架或需要特定权限');
    console.log('2. 🟡 API有IP或账户限制');
    console.log('3. 🟡 effect_scene值变化');
  } else {
    console.log('1. ✅ API工作正常');
    console.log('2. ✅ 所有模板可用');
  }
  
  // 建议
  console.log('\n🎯 建议:');
  console.log('1. 联系可灵技术支持确认API状态');
  console.log('2. 检查账户余额和配额');
  console.log('3. 确认effect_scene值是否正确');
  console.log('4. 检查网络连接和防火墙');
}

main().catch(err => {
  console.error('❌ 测试脚本执行失败:', err);
  process.exit(1);
});