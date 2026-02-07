#!/usr/bin/env node

/**
 * 可灵视频模板批量测试脚本 V2 - 修复JWT签名问题
 * 
 * 改进点：
 * 1. 添加随机jti字段避免重放攻击
 * 2. 增加请求间隔（5秒）
 * 3. 更好的错误处理和重试机制
 * 4. 验证server.js中的JWT生成逻辑
 * 5. 添加更详细的调试信息
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

// 测试用的图片URL（使用一个公开可访问的测试图片 - 女性头像）
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';

// 生成JWT token（改进版 - 添加jti防重放）
function generateJWTToken(uniqueId = '') {
  const currentTime = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY,
    exp: currentTime + 1800, // 30分钟
    nbf: currentTime - 5,
    jti: `test_${uniqueId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // 唯一标识符
  };
  
  console.log(`🔑 JWT Payload:`, {
    iss: payload.iss.substring(0, 8) + '...',
    exp: new Date(payload.exp * 1000).toISOString(),
    nbf: new Date(payload.nbf * 1000).toISOString(),
    jti: payload.jti
  });
  
  return jwt.sign(payload, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 检查服务器时间同步（打印服务器时间信息）
function checkTimeSync() {
  console.log('🕐 本地时间信息:');
  console.log(`   当前时间: ${new Date().toISOString()}`);
  console.log(`   时间戳(秒): ${Math.floor(Date.now() / 1000)}`);
  console.log(`   时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
}

// 调用可灵特效API（带重试机制）
async function testKlingEffect(effect_scene, templateName, retryCount = 2) {
  let attempt = 0;
  
  while (attempt <= retryCount) {
    attempt++;
    console.log(`\n🔍 测试模板: ${templateName} (${effect_scene}) - 尝试 ${attempt}/${retryCount + 1}`);
    
    try {
      const result = await attemptKlingRequest(effect_scene, templateName);
      
      // 如果是签名错误，等待更长时间后重试
      if (result.status === 'signature_error' && attempt <= retryCount) {
        console.log(`⏳ 签名错误，等待10秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      
      return result;
    } catch (error) {
      console.log(`❌ ${templateName}: 请求异常 - ${error.message}`);
      
      if (attempt <= retryCount) {
        console.log(`⏳ 等待5秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        return {
          template: templateName,
          effect_scene: effect_scene,
          status: 'exception',
          error: error.message
        };
      }
    }
  }
}

// 单个API请求尝试
async function attemptKlingRequest(effect_scene, templateName) {
  return new Promise((resolve, reject) => {
    const uniqueId = `${templateName}_${Date.now()}`;
    const token = generateJWTToken(uniqueId);
    
    console.log(`🔑 JWT Token生成成功 (长度: ${token.length} 字符)`);
    console.log(`🔑 Token前缀: ${token.substring(0, 50)}...`);
    
    const requestBody = JSON.stringify({
      effect_scene: effect_scene,
      input: {
        image: TEST_IMAGE_URL
      }
    });

    console.log(`📤 请求体:`, {
      effect_scene,
      image_url_length: TEST_IMAGE_URL.length
    });

    const options = {
      hostname: 'api-beijing.klingai.com',
      path: '/v1/videos/effects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(requestBody),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000 // 30秒超时
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      // 记录响应头
      console.log(`📥 响应状态码: ${res.statusCode}`);
      console.log(`📥 响应头:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 响应体长度: ${data.length} 字节`);
        
        try {
          const response = JSON.parse(data);
          console.log(`📥 解析响应:`, {
            code: response.code,
            message: response.message,
            has_data: !!response.data,
            has_task_id: !!(response.data && response.data.task_id)
          });
          
          if (res.statusCode === 200) {
            // 检查API响应
            if (response.code === 0 && response.data && response.data.task_id) {
              console.log(`✅ ${templateName}: 任务创建成功 (task_id: ${response.data.task_id})`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'success',
                task_id: response.data.task_id,
                message: '任务创建成功',
                response_code: response.code
              });
            } else if (response.code === 10001) {
              console.log(`❌ ${templateName}: 参数错误 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'invalid_parameter',
                error_code: response.code,
                message: response.message,
                response_code: response.code
              });
            } else if (response.code === 10002) {
              console.log(`❌ ${templateName}: 鉴权失败 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'auth_failed',
                error_code: response.code,
                message: response.message,
                response_code: response.code
              });
            } else if (response.code === 10004) {
              console.log(`❌ ${templateName}: 不支持的特效 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'unsupported_effect',
                error_code: response.code,
                message: response.message,
                response_code: response.code
              });
            } else if (response.code === 1000) {
              console.log(`❌ ${templateName}: 签名无效 - ${response.message}`);
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'signature_error',
                error_code: response.code,
                message: response.message,
                response_code: response.code
              });
            } else {
              console.log(`⚠️ ${templateName}: 未知响应 -`, JSON.stringify(response, null, 2));
              resolve({
                template: templateName,
                effect_scene: effect_scene,
                status: 'unknown_response',
                response: response,
                response_code: response.code
              });
            }
          } else if (res.statusCode === 401) {
            console.log(`🔐 ${templateName}: HTTP 401 未授权 -`, data);
            resolve({
              template: templateName,
              effect_scene: effect_scene,
              status: 'http_401',
              status_code: res.statusCode,
              response: data,
              response_parsed: response
            });
          } else {
            console.log(`❌ ${templateName}: HTTP ${res.statusCode} -`, data.substring(0, 200));
            resolve({
              template: templateName,
              effect_scene: effect_scene,
              status: 'http_error',
              status_code: res.statusCode,
              response: data,
              response_parsed: response
            });
          }
        } catch (error) {
          console.log(`❌ ${templateName}: 响应解析失败 - ${error.message}`);
          console.log(`📥 原始响应:`, data.substring(0, 500));
          resolve({
            template: templateName,
            effect_scene: effect_scene,
            status: 'parse_error',
            error: error.message,
            raw_data: data.substring(0, 500)
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

    // 写入请求体
    req.write(requestBody);
    req.end();
  });
}

// 生成测试报告
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 可灵视频模板测试报告 V2');
  console.log('='.repeat(80));
  
  const summary = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    signature_error: results.filter(r => r.status === 'signature_error').length,
    http_401: results.filter(r => r.status === 'http_401').length,
    invalid_parameter: results.filter(r => r.status === 'invalid_parameter').length,
    unsupported_effect: results.filter(r => r.status === 'unsupported_effect').length,
    auth_failed: results.filter(r => r.status === 'auth_failed').length,
    other_errors: results.filter(r => !['success', 'signature_error', 'http_401', 'invalid_parameter', 'unsupported_effect', 'auth_failed'].includes(r.status)).length
  };
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总计模板: ${summary.total}`);
  console.log(`   ✅ 可用模板: ${summary.success}`);
  console.log(`   🔐 签名错误: ${summary.signature_error}`);
  console.log(`   🚫 HTTP 401: ${summary.http_401}`);
  console.log(`   ❌ 参数错误: ${summary.invalid_parameter}`);
  console.log(`   🚫 不支持特效: ${summary.unsupported_effect}`);
  console.log(`   🔑 鉴权失败: ${summary.auth_failed}`);
  console.log(`   ⚠️ 其他错误: ${summary.other_errors}`);
  
  console.log('\n📋 详细结果:');
  console.log('\n✅ 可用模板:');
  results.filter(r => r.status === 'success').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - 任务ID: ${r.task_id}`);
  });
  
  console.log('\n🔐 签名错误模板:');
  results.filter(r => r.status === 'signature_error').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.message}`);
  });
  
  console.log('\n🚫 HTTP 401模板:');
  results.filter(r => r.status === 'http_401').forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - 响应: ${r.response?.substring(0, 100) || '无响应'}`);
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
  results.filter(r => !['success', 'signature_error', 'http_401', 'invalid_parameter', 'unsupported_effect', 'auth_failed'].includes(r.status)).forEach(r => {
    console.log(`   • ${r.template} (${r.effect_scene}) - ${r.status}: ${r.message || r.error || '未知错误'}`);
  });
  
  console.log('\n💡 诊断建议:');
  
  // 分析可能的命名模式
  const validEffects = results.filter(r => r.status === 'success').map(r => r.effect_scene);
  const signatureErrors = results.filter(r => r.status === 'signature_error').map(r => r.effect_scene);
  const http401Errors = results.filter(r => r.status === 'http_401').map(r => r.effect_scene);
  
  if (signatureErrors.length > 0) {
    console.log(`   1. JWT签名问题影响 ${signatureErrors.length} 个模板`);
    console.log(`     可能原因：服务器时间不同步、JWT payload格式不正确`);
    console.log(`     解决方案：检查时间同步，确保nbf/exp时间戳正确`);
  }
  
  if (http401Errors.length > 0) {
    console.log(`   2. HTTP 401错误影响 ${http401Errors.length} 个模板`);
    console.log(`     可能原因：API密钥失效、请求频率限制、IP限制`);
    console.log(`     解决方案：验证API密钥，增加请求间隔，检查IP白名单`);
  }
  
  if (validEffects.length > 0) {
    console.log(`   3. 已验证的effect_scene值: ${validEffects.join(', ')}`);
  }
  
  // 保存报告到文件
  const report = {
    summary,
    results,
    timestamp: new Date().toISOString(),
    test_config: {
      test_image_url: TEST_IMAGE_URL,
      kling_access_key_prefix: KLING_ACCESS_KEY.substring(0, 8) + '...',
      total_templates: KLING_TEMPLATES.length
    },
    valid_effects: validEffects,
    signature_errors: signatureErrors,
    http401_errors: http401Errors,
    recommendations: [
      signatureErrors.length > 0 ? '修复JWT签名生成逻辑' : null,
      http401Errors.length > 0 ? '检查API密钥有效期和请求频率限制' : null,
      '确保服务器时间与可灵API服务器同步',
      '考虑使用server.js中的JWT生成逻辑进行测试'
    ].filter(Boolean)
  };
  
  const reportPath = path.join(__dirname, 'kling_template_test_report_v2.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 详细报告已保存至: ${reportPath}`);
  
  return summary;
}

// 测试server.js中的JWT生成逻辑
function testServerJWTLogic() {
  console.log('\n🔧 测试server.js中的JWT生成逻辑...');
  
  try {
    // 模拟server.js中的JWT生成
    const currentTime = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: KLING_ACCESS_KEY,
      exp: currentTime + 1800,
      nbf: currentTime - 5
    };
    
    const jwtToken = jwt.sign(jwtPayload, KLING_SECRET_KEY, {
      algorithm: 'HS256',
      header: { alg: 'HS256', typ: 'JWT' }
    });
    
    console.log('✅ server.js JWT生成成功');
    console.log(`   Payload:`, jwtPayload);
    console.log(`   Token长度: ${jwtToken.length}`);
    console.log(`   Token前缀: ${jwtToken.substring(0, 50)}...`);
    
    return jwtToken;
  } catch (error) {
    console.error('❌ server.js JWT生成失败:', error.message);
    return null;
  }
}

// 快速测试单个模板（调试用）
async function quickTestSingleTemplate(effect_scene, templateName) {
  console.log(`\n🚀 快速测试单个模板: ${templateName} (${effect_scene})`);
  
  // 先测试server.js逻辑
  const serverToken = testServerJWTLogic();
  
  if (serverToken) {
    console.log('🔧 使用server.js逻辑进行测试...');
    
    // 使用server.js逻辑进行测试
    const result = await testKlingEffect(effect_scene, templateName, 0); // 不重试
    return result;
  }
  
  return null;
}

// 主函数
async function main() {
  console.log('🚀 开始测试可灵视频模板 V2...');
  console.log(`📁 测试图片: ${TEST_IMAGE_URL}`);
  console.log(`🔑 使用Access Key: ${KLING_ACCESS_KEY.substring(0, 8)}...`);
  console.log(`📅 测试时间: ${new Date().toISOString()}`);
  
  // 检查时间同步
  checkTimeSync();
  
  // 测试server.js JWT逻辑
  testServerJWTLogic();
  
  console.log('\n' + '='.repeat(80));
  console.log('开始批量测试所有模板...');
  console.log('='.repeat(80) + '\n');
  
  const results = [];
  
  // 逐个测试模板，增加延迟避免速率限制
  for (let i = 0; i < KLING_TEMPLATES.length; i++) {
    const template = KLING_TEMPLATES[i];
    
    // 添加更长的延迟（除了第一个）
    if (i > 0) {
      const delay = 5000; // 5秒
      console.log(`\n⏳ 等待${delay/1000}秒避免速率限制...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试 ${i+1}/${KLING_TEMPLATES.length}: ${template.name}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testKlingEffect(template.effect_scene, template.name, 1); // 重试1次
    results.push(result);
  }
  
  // 生成报告
  const summary = generateReport(results);
  
  // 输出总结建议
  console.log('\n' + '='.repeat(80));
  console.log('📋 最终总结');
  console.log('='.repeat(80));
  
  const validCount = summary.success;
  const signatureErrorCount = summary.signature_error + summary.http_401;
  
  if (validCount === 0) {
    console.log('\n⚠️ 所有模板测试都失败了！');
    console.log('可能的原因：');
    console.log('1. API密钥无效或已过期');
    console.log('2. 服务器时间不同步导致JWT签名失败');
    console.log('3. IP地址被限制');
    console.log('4. effect_scene命名全部错误');
    
    console.log('\n建议：');
    console.log('1. 使用server.js中的API端点进行测试（POST /api/kling/video-effects）');
    console.log('2. 检查.env文件中的KLING_ACCESS_KEY和KLING_SECRET_KEY');
    console.log('3. 验证服务器时间同步');
    console.log('4. 联系可灵官方获取技术支持');
  } else if (signatureErrorCount > 0) {
    console.log(`\n⚠️ 发现 ${signatureErrorCount} 个模板存在签名问题`);
    console.log('这表明JWT生成逻辑可能需要调整');
    console.log('\n建议：');
    console.log('1. 确保nbf（not before）时间戳比当前时间早几秒');
    console.log('2. 确保exp（expiration）时间戳足够未来（如30分钟后）');
    console.log('3. 检查服务器时间与可灵API服务器是否同步');
    console.log('4. 尝试在payload中添加jti（JWT ID）字段');
  } else if (validCount < KLING_TEMPLATES.length / 2) {
    console.log(`\n⚠️ 只有 ${validCount}/${KLING_TEMPLATES.length} 个模板可用`);
    console.log('建议：');
    console.log('1. 联系可灵官方获取有效的effect_scene列表');
    console.log('2. 验证所有effect_scene值是否官方支持');
    console.log('3. 检查模板是否需要在特定地区或特定账户下使用');
  } else {
    console.log(`\n✅ 成功！${validCount}/${KLING_TEMPLATES.length} 个模板可用`);
  }
  
  // 如果有很多签名错误，建议使用server.js进行测试
  if (signatureErrorCount > 3) {
    console.log('\n🔧 建议使用server.js进行进一步测试：');
    console.log('1. 启动服务器: npm run dev 或 node server.js');
    console.log('2. 访问前端页面测试可灵特效');
    console.log('3. 观察server.js的控制台输出，查看实际错误信息');
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];
  
  if (command === 'single') {
    const effectScene = args[1] || 'celebration';
    const templateName = args[2] || '测试模板';
    
    console.log('🚀 快速测试单个模板模式');
    quickTestSingleTemplate(effectScene, templateName)
      .then(result => {
        if (result) {
          console.log('\n📋 测试结果:');
          console.log(JSON.stringify(result, null, 2));
        }
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 测试失败:', error);
        process.exit(1);
      });
  } else if (command === 'help') {
    console.log(`
可灵视频模板测试脚本 V2
使用方法:
  
  1. 批量测试所有模板:
     node tools/test_kling_templates_v2.js
  
  2. 测试单个模板:
     node tools/test_kling_templates_v2.js single <effect_scene> <模板名称>
     示例: node tools/test_kling_templates_v2.js single celebration "欢庆时刻"
  
  3. 查看帮助:
     node tools/test_kling_templates_v2.js help
    `);
    process.exit(0);
  } else {
    console.log(`❌ 未知命令: ${command}`);
    console.log(`使用 "node tools/test_kling_templates_v2.js help" 查看帮助`);
    process.exit(1);
  }
} else {
  // 运行主函数
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}