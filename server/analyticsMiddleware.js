/**
 * 数据分析中间件 - 自动收集访客和API调用数据
 */

const DataService = require('./DataService');

/**
 * 访客追踪中间件
 * 从请求头中获取访客信息并记录
 */
function visitorTrackingMiddleware(req, res, next) {
  try {
    // 从请求头获取访客信息（前端会发送）
    const visitorId = req.headers['x-visitor-id'];
    const visitorData = req.headers['x-visitor-data'];

    if (visitorId && visitorData) {
      try {
        const data = JSON.parse(decodeURIComponent(visitorData));
        DataService.recordVisitor({
          id: visitorId,
          ...data
        });
      } catch (parseError) {
        // 解析失败不影响主流程
        console.warn('[Analytics] 访客数据解析失败');
      }
    }

    // 记录页面访问
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      DataService.recordPageView({
        visitorId: visitorId || 'anonymous',
        path: req.path,
        referer: req.headers.referer || '',
        userAgent: req.headers['user-agent'] || ''
      });
    }
  } catch (error) {
    console.error('[Analytics] 访客追踪失败:', error);
  }

  next();
}

/**
 * API调用追踪中间件
 * 记录所有API调用的详细信息
 */
function apiTrackingMiddleware(req, res, next) {
  // 只追踪API请求
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // 排除健康检查和管理后台接口
  if (req.path === '/api/health' || req.path.startsWith('/api/admin/')) {
    return next();
  }

  const startTime = Date.now();
  const visitorId = req.headers['x-visitor-id'] || 'anonymous';

  // 拦截响应以记录结果
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 解析功能ID
    let featureId = 'unknown';
    let featureName = 'Unknown';

    // 从路径推断功能
    if (req.path.includes('/liblib') || req.path.includes('/siliconflow')) {
      featureId = 'image_generation';
      featureName = '图片生成';
    } else if (req.path.includes('/deepseek')) {
      featureId = 'text_generation';
      featureName = '文案生成';
    } else if (req.path.includes('/fish')) {
      featureId = 'voice_generation';
      featureName = '语音合成';
    } else if (req.path.includes('/dashscope') || req.path.includes('/wan')) {
      featureId = 'video_generation';
      featureName = '视频生成';
    } else if (req.path.includes('/payment')) {
      featureId = 'payment';
      featureName = '支付';
    }

    // 从请求体获取更详细的功能ID
    if (req.body && req.body.featureId) {
      featureId = req.body.featureId;
    }

    // 判断是否成功
    const success = res.statusCode >= 200 && res.statusCode < 400;

    // 记录日志
    DataService.logAPICall({
      visitorId,
      featureId,
      featureName,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      success,
      duration,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });

    // 调用原始send
    originalSend.call(this, data);
  };

  next();
}

/**
 * 追踪特定功能的调用
 * 在具体API中手动调用，可以传递更详细的信息
 */
function trackFeatureUsage(visitorId, featureId, featureName, metadata = {}) {
  try {
    DataService.logAPICall({
      visitorId,
      featureId,
      featureName,
      success: true,
      duration: 0,
      ...metadata
    });
  } catch (error) {
    console.error('[Analytics] 功能追踪失败:', error);
  }
}

module.exports = {
  visitorTrackingMiddleware,
  apiTrackingMiddleware,
  trackFeatureUsage
};
