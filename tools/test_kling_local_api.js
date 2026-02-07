#!/usr/bin/env node

/**
 * 本地可灵API测试脚本
 * 
 * 通过调用本地的server.js API端点来测试可灵特效模板
 * 这样可以测试整个流程（包括JWT生成、错误处理等）
 */

const https = require('https');
const http = require('http');

// 配置
const LOCAL_API_URL = 'http://localhost:3002/api/kling/video-effects';
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';

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

// 调用本地API
async function testLocalAPI(effect_scene, templateName) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      effect_scene: effect_scene,
      image_url: TEST_IMAGE_URL
    });

    console.log(`\n🔍 测试模板: ${templateName} (${effect_scene})`);
    console.log(`📤 请求本地API: ${LOCAL_API_URL}`);

    const url = new URL(LOCAL_API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3002,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`📥 响应状态码: ${res.statusCode}`);
      console.log(`📥 响应头:`, {
        'content-type': res.headers['content-type'],
        'content-length': res.headers['content-length']
      });
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 响应体长度: ${data.length} 字节`);
        
        try {
          const response = JSON.parse(data);
          console.log(`📥 解析响应:`, {
            status: response.status,
            message: response.message,
            has_task_id: !!(response.taskId || (response.details && response.details.task_id))
          });
          
          resolve({
            template: templateName,
            effect_scene: effect_scene,
            status_code: res.statusCode,
            response: response,
            success: response.status === 'success' || (response.code === 0)
          });
        } catch (error) {
          console.log(`❌ 响应解析失败: ${error.message}`);
          console.log(`📥 原始响应:`, data.substring(0, 500));
          
          resolve({
            template: templateName,
            effect_scene: effect_scene,
            status_code: res.statusCode,
            parse_error: error.message,
            raw_data: data.substring(0, 500),
            success: false
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ 请求失败: ${error.message}`);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.log(`❌ 请求超时`);
      req.destroy();
      reject(new Error('请求超时'));
    });

    // 写入请求体
    req.write(requestBody);
    req.end();
  });
}

// 批量测试
async function batchTest() {
  console.log('🚀 开始通过本地API测试可灵视频模板');
  console.log(`📁 测试图片: ${TEST_IMAGE_URL}`);
  console.log(`🌐 本地API: ${LOCAL_API_URL}`);
  console.log(`📅 测试时间: ${new Date().toISOString()}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('开始批量测试所有模板...');
  console.log('='.repeat(80) + '\n');
  
  const results = [];
  
  for (let i = 0; i < KLING_TEMPLATES.length; i++) {
    const template = KLING_TEMPLATES[i];
    
    // 添加延迟避免本地API速率限制
    if (i > 0) {
      const delay = 3000; // 3秒
      console.log(`\n⏳ 等待${delay/1000}秒...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试 ${i+1}/${KLING_TEMPLATES.length}: ${template.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await testLocalAPI(template.effect_scene, template.name);
      results.push(result);
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
      results.push({
        template: template.name,
        effect_scene: template.effect_scene,
        error: error.message,
        success: false
      });
    }
  }
  
  // 生成报告
  generateReport(results);
}

// 生成报告
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 本地API测试报告');
  console.log('='.repeat(80));
  
  const total = results.length;
  const success = results.filter(r => r.success).length;
  const server_errors = results.filter(r => r.status_code && r.status_code >= 500).length;
  const client_errors = results.filter(r => r.status_code && r.status_code >= 400 && r.status_code < 500).length;
  const other_errors = results.filter(r => !r.success && !r.status_code).length;
  
  console.log(`\n📈 测试统计:`);
  console.log(`   总计模板: ${total}`);
  console.log(`   ✅ 本地API调用成功: ${success}`);
  console.log(`   🔴 服务器错误 (5xx): ${server_errors}`);
  console.log(`   🟡 客户端错误 (4xx): ${client_errors}`);
  console.log(`   ⚠️ 其他错误: ${other_errors}`);
  
  console.log('\n📋 详细结果:');
  
  // 成功的结果
  const successResults = results.filter(r => r.success);
  if (successResults.length > 0) {
    console.log('\n✅ 本地API调用成功的模板:');
    successResults.forEach(r => {
      const taskId = r.response?.taskId || r.response?.details?.task_id || '无任务ID';
      console.log(`   • ${r.template} (${r.effect_scene}) - 状态码: ${r.status_code}, 任务ID: ${taskId}`);
    });
  }
  
  // 客户端错误
  const clientErrorResults = results.filter(r => r.status_code && r.status_code >= 400 && r.status_code < 500);
  if (clientErrorResults.length > 0) {
    console.log('\n🟡 客户端错误的模板:');
    clientErrorResults.forEach(r => {
      console.log(`   • ${r.template} (${r.effect_scene}) - HTTP ${r.status_code}`);
      if (r.response?.message) {
        console.log(`     错误信息: ${r.response.message}`);
      }
      if (r.response?.details?.message) {
        console.log(`     详细信息: ${r.response.details.message}`);
      }
    });
  }
  
  // 服务器错误
  const serverErrorResults = results.filter(r => r.status_code && r.status_code >= 500);
  if (serverErrorResults.length > 0) {
    console.log('\n🔴 服务器错误的模板:');
    serverErrorResults.forEach(r => {
      console.log(`   • ${r.template} (${r.effect_scene}) - HTTP ${r.status_code}`);
    });
  }
  
  // 其他错误
  const otherErrorResults = results.filter(r => !r.success && !r.status_code);
  if (otherErrorResults.length > 0) {
    console.log('\n⚠️ 其他错误的模板:');
    otherErrorResults.forEach(r => {
      console.log(`   • ${r.template} (${r.effect_scene}) - ${r.error || '未知错误'}`);
    });
  }
  
  console.log('\n💡 分析结果:');
  
  if (success === total) {
    console.log(`   ✅ 所有${total}个模板的本地API调用都成功！`);
    console.log(`   这说明server.js的JWT生成和API调用逻辑是正确的。`);
    console.log(`   之前测试脚本的问题可能是JWT生成不一致或网络问题。`);
  } else if (success === 0) {
    console.log(`   ❌ 所有模板都失败了！`);
    console.log(`   可能的原因：`);
    console.log(`   1. server.js没有正确运行`);
    console.log(`   2. 环境变量配置错误`);
    console.log(`   3. 可灵API密钥失效`);
  } else {
    console.log(`   ⚠️ ${success}/${total}个模板成功，${total-success}个失败`);
    
    // 分析失败模式
    const failedTemplates = results.filter(r => !r.success).map(r => r.template);
    console.log(`   失败的模板: ${failedTemplates.join(', ')}`);
    
    // 检查是否有特定的错误模式
    const signatureErrors = results.filter(r => 
      r.response?.message?.includes('signature') || 
      r.response?.details?.message?.includes('signature')
    );
    
    if (signatureErrors.length > 0) {
      console.log(`   🔐 发现${signatureErrors.length}个签名错误`);
      console.log(`      这可能说明部分模板需要特定的JWT参数或API密钥权限`);
    }
    
    const invalidParamErrors = results.filter(r => 
      r.response?.message?.includes('invalid') || 
      r.response?.details?.message?.includes('invalid')
    );
    
    if (invalidParamErrors.length > 0) {
      console.log(`   📝 发现${invalidParamErrors.length}个参数错误`);
      console.log(`      可能某些effect_scene值不正确或已失效`);
    }
  }
  
  // 保存报告
  const report = {
    summary: {
      total,
      success,
      server_errors,
      client_errors,
      other_errors
    },
    results: results.map(r => ({
      template: r.template,
      effect_scene: r.effect_scene,
      status_code: r.status_code,
      success: r.success,
      error: r.error,
      response_summary: r.response ? {
        status: r.response.status,
        message: r.response.message,
        code: r.response.code
      } : null
    })),
    timestamp: new Date().toISOString(),
    test_config: {
      local_api_url: LOCAL_API_URL,
      test_image_url: TEST_IMAGE_URL,
      total_templates: KLING_TEMPLATES.length
    },
    recommendations: [
      success > 0 ? '本地API调用成功，说明server.js的JWT生成逻辑正确' : null,
      client_errors > 0 ? '部分模板可能存在参数错误或API限制' : null,
      '建议使用前端界面进行实际视频生成测试'
    ].filter(Boolean)
  };
  
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'kling_local_api_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 详细报告已保存至: ${reportPath}`);
}

// 主函数
async function main() {
  try {
    // 首先检查服务器是否运行
    console.log('🔍 检查本地服务器是否运行...');
    
    try {
      const checkResponse = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3002/api/health', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              reject(new Error(`健康检查响应解析失败: ${e.message}`));
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('健康检查超时'));
        });
        req.end();
      });
      
      console.log(`✅ 服务器健康状态: ${checkResponse.statusCode} - ${JSON.stringify(checkResponse.data)}`);
    } catch (error) {
      console.error(`❌ 无法连接到本地服务器: ${error.message}`);
      console.error(`请确保server.js正在运行: node server.js`);
      process.exit(1);
    }
    
    // 运行批量测试
    await batchTest();
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
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
    testLocalAPI(effectScene, templateName)
      .then(result => {
        console.log('\n📋 测试结果:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 测试失败:', error);
        process.exit(1);
      });
  } else if (command === 'help') {
    console.log(`
本地可灵API测试脚本
使用方法:
  
  1. 批量测试所有模板:
     node tools/test_kling_local_api.js
  
  2. 测试单个模板:
     node tools/test_kling_local_api.js single <effect_scene> <模板名称>
     示例: node tools/test_kling_local_api.js single celebration "欢庆时刻"
  
  3. 查看帮助:
     node tools/test_kling_local_api.js help
    `);
    process.exit(0);
  } else {
    console.log(`❌ 未知命令: ${command}`);
    console.log(`使用 "node tools/test_kling_local_api.js help" 查看帮助`);
    process.exit(1);
  }
} else {
  // 运行主函数
  main().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}