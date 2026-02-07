#!/usr/bin/env node

/**
 * 可灵视频模板批量测试脚本
 * 
 * 功能：自动测试所有effect_scene值，找出可用的模板
 * 使用方法：node tools/test_kling_templates.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 配置
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
  console.error('❌ 错误：缺少可灵API密钥配置');
  console.error('请检查.env文件中的KLING_ACCESS_KEY和KLING_SECRET_KEY');
  process.exit(1);
}

// 从KlingTemplateModal.tsx中提取的模板列表（更新版）
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

// 测试用的图片URL（使用一个公开可访问的测试图片）
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';

// 生成JWT token
function generateJWTToken() {
  const currentTime = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: currentTime + 1800, // 30分钟
    nbf: currentTime - 5
  };
  
  return jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 调用可灵特效API
async function testKlingEffect(effect_scene, templateName) {
  return new Promise((resolve, reject) => {
    const token = generateJWTToken();
    const requestBody = JSON.stringify({
      effect_scene: effect_scene,
      input: {
        image: TEST_IMAGE_URL
      }
    });

    console.log(`🔍 测试模板: ${templateName} (effect_scene: ${effect_scene})`);

    const options = {
      hostname: 'api-beijing.klingai.com',
      path: '/v1/videos/effects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 30000 // 30秒超时
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            // 检查API响应
            if (response.code === 0 && response.data && response.data.task_id) {
              console.log(`✅ ${templateName}: 任务创建成功 (task_id: ${response.data.task_id})`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'success',
                task_id: response.data.task_id,
                message: '任务创建成功'
              });
            } else if (response.code === 10001) {
              console.log(`❌ ${templateName}: 参数错误 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'invalid_parameter',
                error_code: response.code,
                message: response.message
              });
            } else if (response.code === 10002) {
              console.log(`❌ ${templateName}: 鉴权失败 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'auth_failed',
                error_code: response.code,
                message: response.message
              });
            } else if (response.code === 10004) {
              console.log(`❌ ${templateName}: 不支持的特效 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'unsupported_effect',
                error_code: response.code,
                message: response.message
              });
            } else {
              console.log(`⚠️ ${templateName}: 未知响应 - ${JSON.stringify(response)}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'unknown_response',
                response: response
              });
            }
          } else {
            console.log(`❌ ${templateName}: HTTP ${res.statusCode} - ${data}`);
            resolve({
              template: templateName,
              effect_scene: effect_scene,
              status: 'http_error',
              status_code: res.statusCode,
              response: data
            });
          }
        } catch (error) {
          console.log(`❌ ${templateName}: 响应解析失败 - ${error.message}`);
          resolve({
            template: templateName,
            effect_scene: effect_scene,
            status: 'parse_error',
            error: error.message,
            raw_data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${templateName}: 请求失败 - ${error.message}`);
      resolve({
        template: templateName,
        effect_scene: effect_scene,
        status: 'request_failed',
        error: error.message
      });
    });

    req.on('timeout', () => {
      console.log(`❌ ${templateName}: 请求超时`);
      req.destroy();
      resolve({
        template: templateName,
        effect_scene: effect_scene,
        status: 'timeout'
      });
    });

    req.write(requestBody);
    req.end();
  });
}

// 生成测试报告
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 可灵视频模板测试报告');
  console.log('='.repeat(80));
  
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    invalid_parameter: results.filter(r => r.status === 'invalid_parameter').length,
    unsupported_effect: results.filter(r => r.status === 'unsupported_effect').length,
    auth_failed: results.filter(r => r.status === 'auth_failed').length,
    other_errors: results.filter(r => !['success', 'invalid_parameter', 'unsupported_effect', 'auth_failed'].includes(r.status)).length
  };
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总计模板: ${summary.total}`);
  console.log(`   ✅ 可用模板: ${summary.success}`);
  console.log(`   ❌ 参数错误: ${summary.invalid_parameter}`);
  console.log(`   🚫 不支持特效: ${summary.unsupported_effect}`);
  console.log(`   🔑 鉴权失败: ${summary.auth_failed}`);
  console.log(`   ⚠️ 其他错误: ${summary.other_errors}`);
  
  console.log('\n📋 详细结果:');
  console.log('\n✅ 可用模板:');
  results.filter(r => r.status === 'success').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - 任务ID: ${r.task_id}`);
  });
  
  console.log('\n❌ 参数错误的模板:');
  results.filter(r => r.status === 'invalid_parameter').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.message}`);
  });
  
  console.log('\n🚫 不支持的特效:');
  results.filter(r => r.status === 'unsupported_effect').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.message}`);
  });
  
  console.log('\n🔑 鉴权失败的模板:');
  results.filter(r => r.status === 'auth_failed').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.message}`);
  });
  
  console.log('\n⚠️ 其他错误的模板:');
  results.filter(r => !['success', 'invalid_parameter', 'unsupported_effect', 'auth_failed'].includes(r.status)).forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.status}: ${r.message || r.error || '未知错误'}`);
  });
  
  console.log('\n💡 建议:');
  
  // 分析可能的命名模式
  const validEffects = results.filter(r => r.status === 'success').map(r => r.effect_scene);
  const invalidEffects = results.filter(r => r.status === 'invalid_parameter' || r.status === 'unsupported_effect').map(r => r.effect_scene);
  
  if (validEffects.length > 0) {
    console.log(`   1. 可用effect_scene值: ${validEffects.join(', ')}`);
  }
  
  if (invalidEffects.length > 0) {
    console.log(`   2. 可能需要修正的effect_scene值:`);
    invalidEffects.forEach(effect => {
      console.log(`      - "${effect}" 可能不是官方标准命名`);
    });
  }
  
  // 尝试猜测正确的命名模式
  const simpleEffects = KLING_TEMPLATES.filter(t => 
    !t.effect_scene.includes('_') || 
    t.effect_scene.split('_').length <= 2
  ).map(t => t.effect_scene);
  
  const complexEffects = KLING_TEMPLATES.filter(t => 
    t.effect_scene.includes('_') && 
    t.effect_scene.split('_').length > 2
  ).map(t => t.effect_scene);
  
  console.log(`\n🔍 命名模式分析:`);
  console.log(`   简洁命名（1-2个单词）: ${simpleEffects.length}个`);
  console.log(`   复杂命名（3+个单词）: ${complexEffects.length}个`);
  console.log(`   建议优先使用简洁命名，如: 'celebration', 'firework', 'lion_dance'`);
  
  console.log('\n' + '='.repeat(80));
  
  // 保存报告到文件
  const report = {
    summary,
    results,
    timestamp: new Date().toISOString(),
    valid_effects: validEffects,
    invalid_effects: invalidEffects,
    recommendations: [
      `使用已验证的effect_scene值: ${validEffects.join(', ')}`,
      `避免使用包含重复单词的命名（如rocket_rocket, bloom_bloom）`,
      `优先使用简洁的命名模式`
    ]
  };
  
  const reportPath = path.join(__dirname, 'kling_template_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 详细报告已保存至: ${reportPath}`);
}

// 主函数
async function main() {
  console.log('🚀 开始测试可灵视频模板...');
  console.log(`📁 测试图片: ${TEST_IMAGE_URL}`);
  console.log(`🔑 使用Access Key: ${KLING_ACCESS_KEY.substring(0, 8)}...`);
  console.log('='.repeat(80) + '\n');
  
  const results = [];
  
  // 逐个测试模板，添加延迟避免速率限制
  for (let i = 0; i < KLING_TEMPLATES.length; i++) {
    const template = KLING_TEMPLATES[i];
    
    // 添加延迟（除了第一个）
    if (i > 0) {
      console.log(`⏳ 等待2秒避免速率限制...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const result = await testKlingEffect(template.effect_scene, template.name);
    results.push(result);
  }
  
  // 生成报告
  generateReport(results);
  
  // 输出总结建议
  const validCount = results.filter(r => r.status === 'success').length;
  if (validCount === 0) {
    console.log('\n⚠️ 警告：所有模板测试都失败了！');
    console.log('可能的原因：');
    console.log('1. API密钥无效或已过期');
    console.log('2. 服务器暂时不可用');
    console.log('3. effect_scene命名全部错误');
    console.log('建议：');
    console.log('1. 检查.env文件中的KLING_ACCESS_KEY和KLING_SECRET_KEY');
    console.log('2. 测试最简单的effect_scene: "celebration"');
    console.log('3. 联系可灵官方获取有效的effect_scene列表');
  } else if (validCount < KLING_TEMPLATES.length / 2) {
    console.log(`\n⚠️ 警告：只有 ${validCount}/${KLING_TEMPLATES.length} 个模板可用`);
    console.log('建议简化effect_scene命名，避免使用复杂或重复的单词');
  } else {
    console.log(`\n✅ 成功！${validCount}/${KLING_TEMPLATES.length} 个模板可用`);
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});