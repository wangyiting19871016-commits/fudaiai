#!/usr/bin/env node

/**
 * 可灵JWT签名诊断工具
 * 目标: 找出为什么有时成功有时401
 */

const https = require('https');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

console.log('🔬 可灵JWT签名诊断工具');
console.log('目标: 找出为什么有时成功有时401\n');

// 测试不同的JWT配置
const jwtVariants = [
  {
    name: '当前实现(server.js)',
    generate: () => {
      const now = Math.floor(Date.now() / 1000);
      return jwt.sign({
        iss: KLING_ACCESS_KEY,
        exp: now + 1800,
        nbf: now - 5,
        jti: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        header: { alg: 'HS256', typ: 'JWT' }
      });
    }
  },
  {
    name: '更宽松的nbf(-30秒)',
    generate: () => {
      const now = Math.floor(Date.now() / 1000);
      return jwt.sign({
        iss: KLING_ACCESS_KEY,
        exp: now + 1800,
        nbf: now - 30,
        jti: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        header: { alg: 'HS256', typ: 'JWT' }
      });
    }
  },
  {
    name: '不带jti字段',
    generate: () => {
      const now = Math.floor(Date.now() / 1000);
      return jwt.sign({
        iss: KLING_ACCESS_KEY,
        exp: now + 1800,
        nbf: now - 5
      }, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        header: { alg: 'HS256', typ: 'JWT' }
      });
    }
  },
  {
    name: '标准iat字段',
    generate: () => {
      const now = Math.floor(Date.now() / 1000);
      return jwt.sign({
        iss: KLING_ACCESS_KEY,
        exp: now + 1800,
        nbf: now - 5,
        iat: now,
        jti: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, KLING_SECRET_KEY, {
        algorithm: 'HS256',
        header: { alg: 'HS256', typ: 'JWT' }
      });
    }
  }
];

// 测试单个API调用
async function testAPICall(token, variantName) {
  return new Promise((resolve) => {
    const requestBody = JSON.stringify({
      effect_scene: 'celebration',
      input: {
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3'
      }
    });

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
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            success: response.code === 0,
            code: response.code,
            message: response.message,
            hasTaskId: !!(response.data && response.data.task_id)
          });
        } catch (err) {
          resolve({ statusCode: res.statusCode, success: false, parseError: true });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.write(requestBody);
    req.end();
  });
}

// 连续测试10次,观察稳定性
async function testStability(variant) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`测试配置: ${variant.name}`);
  console.log('='.repeat(80));

  const results = [];

  for (let i = 0; i < 10; i++) {
    const token = variant.generate();
    const tokenPayload = jwt.decode(token);

    console.log(`\n第${i+1}次测试:`);
    console.log(`  Token生成时间: ${new Date().toISOString()}`);
    console.log(`  exp: ${new Date(tokenPayload.exp * 1000).toISOString()}`);
    console.log(`  nbf: ${new Date(tokenPayload.nbf * 1000).toISOString()}`);
    if (tokenPayload.iat) {
      console.log(`  iat: ${new Date(tokenPayload.iat * 1000).toISOString()}`);
    }
    console.log(`  jti: ${tokenPayload.jti ? tokenPayload.jti.substring(0, 20) + '...' : 'N/A'}`);

    const result = await testAPICall(token, variant.name);

    const status = result.success ? '✅ 成功' : `❌ 失败 (${result.code || result.error})`;
    console.log(`  结果: ${status}`);

    results.push({
      attempt: i + 1,
      success: result.success,
      statusCode: result.statusCode,
      code: result.code,
      message: result.message
    });

    // 等待2秒避免速率限制
    if (i < 9) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 统计
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n📊 统计结果:`);
  console.log(`  总测试次数: ${results.length}`);
  console.log(`  ✅ 成功: ${successCount} (${(successCount/results.length*100).toFixed(1)}%)`);
  console.log(`  ❌ 失败: ${failCount} (${(failCount/results.length*100).toFixed(1)}%)`);

  // 分析失败原因
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    const errorCodes = {};
    failures.forEach(f => {
      const key = f.code || f.message || 'unknown';
      errorCodes[key] = (errorCodes[key] || 0) + 1;
    });

    console.log(`\n  失败原因分布:`);
    Object.entries(errorCodes).forEach(([code, count]) => {
      console.log(`    ${code}: ${count}次`);
    });
  }

  return {
    variant: variant.name,
    successRate: successCount / results.length,
    successCount,
    failCount,
    results
  };
}

// 主函数
async function main() {
  console.log(`当前时间: ${new Date().toISOString()}`);
  console.log(`Access Key前缀: ${KLING_ACCESS_KEY.substring(0, 12)}...`);
  console.log(`Secret Key前缀: ${KLING_SECRET_KEY.substring(0, 12)}...`);

  const allResults = [];

  // 测试每个JWT配置变体
  for (const variant of jwtVariants) {
    const result = await testStability(variant);
    allResults.push(result);

    // 等待5秒再测试下一个配置
    if (variant !== jwtVariants[jwtVariants.length - 1]) {
      console.log('\n⏳ 等待5秒后测试下一个配置...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 最终总结
  console.log('\n' + '='.repeat(80));
  console.log('🎯 最终总结');
  console.log('='.repeat(80));

  allResults.sort((a, b) => b.successRate - a.successRate);

  console.log('\n配置成功率排名:');
  allResults.forEach((r, i) => {
    const emoji = r.successRate >= 0.8 ? '🏆' : r.successRate >= 0.5 ? '⚠️' : '🔴';
    console.log(`${emoji} ${i+1}. ${r.variant}: ${(r.successRate * 100).toFixed(1)}% (${r.successCount}/${r.successCount + r.failCount})`);
  });

  // 推荐配置
  const best = allResults[0];
  console.log(`\n💡 推荐配置: ${best.variant}`);

  if (best.successRate < 0.8) {
    console.log('\n⚠️ 警告: 所有配置的成功率都低于80%，可能存在以下问题:');
    console.log('1. 可灵API服务端限制或异常');
    console.log('2. 系统时间与API服务器时间偏差过大');
    console.log('3. API密钥权限不足或配额用尽');
    console.log('4. 网络或防火墙问题');
  }

  console.log('\n📝 建议操作:');
  console.log('1. 检查系统时间同步: w32tm /query /status');
  console.log('2. 检查可灵账户余额和配额');
  console.log('3. 联系可灵技术支持确认JWT要求');
  console.log('4. 尝试使用成功率最高的JWT配置');
}

main().catch(err => {
  console.error('❌ 诊断工具执行失败:', err);
  process.exit(1);
});
