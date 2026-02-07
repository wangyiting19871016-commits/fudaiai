#!/usr/bin/env node

/**
 * 模拟server.js逻辑测试可灵API
 * 
 * 完全复制server.js中的JWT生成和API调用逻辑
 * 验证server.js的代码是否真的有问题
 */

const https = require('https');
const jwt = require('jsonwebtoken');

// 加载环境变量
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
  console.error('❌ 错误：缺少可灵API密钥配置');
  console.error('请检查.env文件中的KLING_ACCESS_KEY和KLING_SECRET_KEY');
  process.exit(1);
}

// 从KlingTemplateModal.tsx中提取的模板列表
const KLING_TEMPLATES = [
  // 春节拜年系列
  { id: 'new_year_greeting', name: '拜年讨红包', effect_scene: 'new_year_greeting' },
  { id: 'lion_dance', name: '舞狮', effect_scene: 'lion_dance' },
  { id: 'fortune_knocks', name: '财神敲门', effect_scene: 'fortune_knocks_cartoon' },
  { id: 'fortune_god', name: '财神驾到', effect_scene: 'fortune_god_transform' },
  { id: 'spring_couplets', name: '专属对联', effect_scene: 'unique_spring_couplets' },
  { id: 'lantern_cuju', name: '蹴鞠闹元宵', effect_scene: 'lantern_festival_cuju' },
  
  // 通用庆祝系列
  { id: 'firework', name: '专属烟花', effect_scene: 'unique_firework' },
  { id: 'celebration', name: '欢庆时刻', effect_scene: 'celebration' },
  { id: 'rocket', name: '冲天火箭', effect_scene: 'rocket_rocket' },
  { id: 'dollar_rain', name: '金钱雨', effect_scene: 'dollar_rain' },
  { id: 'bloom', name: '花花世界', effect_scene: 'bloom_bloom' },
  { id: 'expansion', name: '万物膨胀', effect_scene: 'expansion' },
];

// 测试图片
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';

// 完全复制server.js中的JWT生成逻辑
function generateServerJWT() {
  const currentTime = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: KLING_ACCESS_KEY,
    exp: currentTime + 1800,
    nbf: currentTime - 5,
    jti: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  console.log('🔑 使用server.js的JWT生成逻辑:');
  console.log('   Payload:', {
    iss: jwtPayload.iss.substring(0, 8) + '...',
    exp: new Date(jwtPayload.exp * 1000).toISOString(),
    nbf: new Date(jwtPayload.nbf * 1000).toISOString(),
    jti: jwtPayload.jti.substring(0, 30) + '...'
  });
  
  return jwt.sign(jwtPayload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 调用可灵特效API（与server.js相同逻辑）
async function callKlingAPI(effect_scene, templateName) {
  return new Promise((resolve, reject) => {
    const token = generateServerJWT();
    
    const requestBody = JSON.stringify({
      effect_scene: effect_scene,
      input: {
        image: TEST_IMAGE_URL
      }
    });

    console.log(`📤 请求体: { effect_scene: '${effect_scene}' }`);
    
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
      
      console.log(`📥 响应状态码: ${res.statusCode}`);
      console.log(`📥 Content-Type: ${res.headers['content-type']}`);
      
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        console.log(`📥 响应体长度: ${data.length} 字节`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            if (response.code === 0 && response.data && response.data.task_id) {
              console.log(`✅ ${templateName}: 任务创建成功 (task_id: ${response.data.task_id})`);
              resolve({
                success: true,
                task_id: response.data.task_id,
                status: response.data.task_status,
                response: response
              });
            } else {
              console.log(`❌ ${templateName}: API返回错误 (code: ${response.code})`);
              resolve({
                success: false,
                code: response.code,
                message: response.message,
                response: response
              });
            }
          } else {
            console.log(`❌ ${templateName}: HTTP ${res.statusCode}`);
            console.log(`   响应: ${data.substring(0, 200)}`);
            resolve({
              success: false,
              statusCode: res.statusCode,
              response: data
            });
          }
        } catch (error) {
          console.log(`❌ ${templateName}: 响应解析失败`);
          resolve({
            success: false,
            parseError: error.message,
            rawData: data.substring(0, 500)
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${templateName}: 请求失败 - ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`❌ ${templateName}: 请求超时`);
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(requestBody);
    req.end();
  });
}

// 快速测试几个用户确认可用的模板
async function testSpecificTemplates() {
  console.log('🚀 测试用户确认可用的模板');
  console.log('📁 测试图片:', TEST_IMAGE_URL);
  console.log('🔑 Access Key:', KLING_ACCESS_KEY.substring(0, 8) + '...');
  console.log('📅 测试时间:', new Date().toISOString());
  
  // 用户说至少有7个模板可用，测试其中一些
  const testTemplates = [
    { id: 'new_year_greeting', name: '拜年讨红包', effect_scene: 'new_year_greeting' },
    { id: 'lion_dance', name: '舞狮', effect_scene: 'lion_dance' },
    { id: 'fortune_god', name: '财神驾到', effect_scene: 'fortune_god_transform' },
    { id: 'spring_couplets', name: '专属对联', effect_scene: 'unique_spring_couplets' },
    { id: 'firework', name: '专属烟花', effect_scene: 'unique_firework' },
    { id: 'celebration', name: '欢庆时刻', effect_scene: 'celebration' },
    { id: 'expansion', name: '万物膨胀', effect_scene: 'expansion' },
  ];
  
  const results = [];
  
  for (let i = 0; i < testTemplates.length; i++) {
    const template = testTemplates[i];
    
    // 等待间隔
    if (i > 0) {
      console.log(`\n⏳ 等待5秒避免速率限制...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试 ${i+1}/${testTemplates.length}: ${template.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await callKlingAPI(template.effect_scene, template.name);
      results.push({
        template: template.name,
        effect_scene: template.effect_scene,
        success: result.success,
        task_id: result.task_id,
        code: result.code,
        message: result.message
      });
    } catch (error) {
      console.log(`❌ ${template.name}: 测试异常 - ${error.message}`);
      results.push({
        template: template.name,
        effect_scene: template.effect_scene,
        success: false,
        error: error.message
      });
    }
  }
  
  // 输出结果
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n📈 统计:`);
  console.log(`   测试模板数: ${results.length}`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  
  console.log('\n📋 详细结果:');
  
  const successResults = results.filter(r => r.success);
  if (successResults.length > 0) {
    console.log('\n✅ 成功的模板:');
    successResults.forEach(r => {
      console.log(`   • ${r.template} (${r.effect_scene}) - 任务ID: ${r.task_id}`);
    });
  }
  
  const failResults = results.filter(r => !r.success);
  if (failResults.length > 0) {
    console.log('\n❌ 失败的模板:');
    failResults.forEach(r => {
      console.log(`   • ${r.template} (${r.effect_scene})`);
      if (r.code) console.log(`     错误码: ${r.code}`);
      if (r.message) console.log(`     消息: ${r.message}`);
      if (r.error) console.log(`     异常: ${r.error}`);
    });
  }
  
  // 分析
  console.log('\n💡 分析:');
  
  if (successCount === results.length) {
    console.log(`   所有${results.length}个模板都成功了！`);
    console.log(`   说明server.js的JWT生成逻辑是正确的。`);
    console.log(`   之前测试脚本的问题可能与JWT payload或网络有关。`);
  } else if (successCount === 0) {
    console.log(`   所有模板都失败了！`);
    console.log(`   可能原因：`);
    console.log(`   1. API密钥失效`);
    console.log(`   2. 服务器时间不同步`);
    console.log(`   3. 网络连接问题`);
  } else {
    console.log(`   部分成功 (${successCount}/${results.length})`);
    console.log(`   可能某些模板需要特定权限或已失效`);
    
    // 检查是否有特定模式
    const successScenes = successResults.map(r => r.effect_scene);
    const failScenes = failResults.map(r => r.effect_scene);
    
    console.log(`   成功的effect_scene: ${successScenes.join(', ')}`);
    console.log(`   失败的effect_scene: ${failScenes.join(', ')}`);
  }
  
  // 保存结果
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'kling_server_style_test.json');
  
  const report = {
    summary: {
      total: results.length,
      success: successCount,
      fail: failCount
    },
    results: results,
    timestamp: new Date().toISOString(),
    test_config: {
      kling_access_key_prefix: KLING_ACCESS_KEY.substring(0, 8) + '...',
      test_image_url: TEST_IMAGE_URL,
      jwt_method: 'server.js style'
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 报告已保存: ${reportPath}`);
}

// 主函数
async function main() {
  console.log('🔍 检查环境变量...');
  console.log(`   KLING_ACCESS_KEY: ${KLING_ACCESS_KEY ? '已设置' : '未设置'}`);
  console.log(`   KLING_SECRET_KEY: ${KLING_SECRET_KEY ? '已设置' : '未设置'}`);
  
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    console.error('❌ 请正确配置环境变量');
    process.exit(1);
  }
  
  // 检查网络连接
  console.log('\n🔍 检查网络连接...');
  try {
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api-beijing.klingai.com',
        path: '/v1/health',
        method: 'GET',
        timeout: 10000
      }, (res) => {
        console.log(`   ✅ 可连接到可灵API (HTTP ${res.statusCode})`);
        resolve();
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('连接超时'));
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`   ⚠️ 无法连接到可灵API: ${error.message}`);
    console.log('   但继续测试，可能是健康检查端点不存在');
  }
  
  await testSpecificTemplates();
}

// 运行
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});