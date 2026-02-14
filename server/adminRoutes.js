/**
 * 管理后台API路由
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const DataService = require('./DataService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ========== 认证中间件 ==========

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: '未授权：缺少token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '未授权：token无效' });
  }
}

// ========== 公开路由（无需认证）==========

/**
 * 管理员登录
 */
router.post('/login', express.json(), (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '缺少用户名或密码' });
    }

    const admin = DataService.validateAdmin(username, password);

    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('[Admin] 登录失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ========== 受保护路由（需要认证）==========

/**
 * 获取统计看板数据
 */
router.get('/dashboard', authMiddleware, (req, res) => {
  try {
    const stats = DataService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('[Admin] 获取看板数据失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 获取访客列表
 */
router.get('/visitors', authMiddleware, (req, res) => {
  try {
    const { limit = 50, offset = 0, sortBy = 'lastVisit', order = 'desc' } = req.query;

    const result = DataService.getVisitors({
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      order
    });

    res.json(result);
  } catch (error) {
    console.error('[Admin] 获取访客列表失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 获取单个访客详情
 */
router.get('/visitors/:visitorId', authMiddleware, (req, res) => {
  try {
    const { visitorId } = req.params;

    // 获取访客基本信息
    const visitors = DataService.getVisitors({ limit: 10000 });
    const visitor = visitors.data.find(v => v.id === visitorId);

    if (!visitor) {
      return res.status(404).json({ error: '访客不存在' });
    }

    // 获取该访客的API调用记录
    const apiLogs = DataService.getAPILogs({
      visitorId,
      limit: 1000
    });

    res.json({
      visitor,
      apiLogs: apiLogs.data,
      stats: {
        totalAPICalls: apiLogs.total
      }
    });
  } catch (error) {
    console.error('[Admin] 获取访客详情失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 获取API调用日志
 */
router.get('/api-logs', authMiddleware, (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      visitorId = null,
      featureId = null,
      startTime = 0,
      endTime = Date.now()
    } = req.query;

    const result = DataService.getAPILogs({
      limit: parseInt(limit),
      offset: parseInt(offset),
      visitorId,
      featureId,
      startTime: parseInt(startTime),
      endTime: parseInt(endTime)
    });

    res.json(result);
  } catch (error) {
    console.error('[Admin] 获取API日志失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 获取API统计数据
 */
router.get('/api-stats', authMiddleware, (req, res) => {
  try {
    const { startTime = 0 } = req.query;
    const stats = DataService.getAPIStats(parseInt(startTime));
    res.json(stats);
  } catch (error) {
    console.error('[Admin] 获取API统计失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 获取页面访问统计
 */
router.get('/page-stats', authMiddleware, (req, res) => {
  try {
    const { startTime = 0 } = req.query;
    const stats = DataService.getPageViewStats(parseInt(startTime));
    res.json(stats);
  } catch (error) {
    console.error('[Admin] 获取页面统计失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

/**
 * 导出数据
 */
router.get('/export/:dataType', authMiddleware, (req, res) => {
  try {
    const { dataType } = req.params;
    const csv = DataService.exportToCSV(dataType);

    if (!csv) {
      return res.status(400).json({ error: '无效的数据类型' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataType}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('[Admin] 导出数据失败:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

/**
 * 获取实时统计（WebSocket或轮询）
 */
router.get('/realtime-stats', authMiddleware, (req, res) => {
  try {
    const stats = {
      timestamp: Date.now(),
      ...DataService.getTodayStats()
    };
    res.json(stats);
  } catch (error) {
    console.error('[Admin] 获取实时统计失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// ========== 缓存管理 ==========

const templateCache = require('./templateCache');

/**
 * 获取缓存状态
 */
router.get('/cache/status', authMiddleware, (req, res) => {
  try {
    const status = templateCache.getCacheStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('[Admin] 获取缓存状态失败:', error);
    res.status(500).json({ error: '获取缓存状态失败' });
  }
});

/**
 * 手动刷新缓存
 */
router.post('/cache/refresh', authMiddleware, async (req, res) => {
  try {
    console.log('[Admin] 开始手动刷新缓存...');
    const success = await templateCache.refreshAll();

    if (success) {
      const status = templateCache.getCacheStatus();
      res.json({
        success: true,
        message: '缓存刷新成功',
        ...status
      });
    } else {
      res.status(500).json({ error: '缓存刷新失败' });
    }
  } catch (error) {
    console.error('[Admin] 刷新缓存失败:', error);
    res.status(500).json({ error: '刷新缓存失败' });
  }
});

// ========== 积分礼品码管理 ==========

/**
 * 创建礼品码
 */
router.post('/credits/create-code', authMiddleware, express.json(), (req, res) => {
  try {
    const { code, credits, maxUses, description, expiresAt } = req.body;

    if (!code || !credits) {
      return res.status(400).json({ error: '缺少礼品码或积分数量' });
    }

    if (credits <= 0 || credits > 1000000) {
      return res.status(400).json({ error: '积分数量必须在 1-1000000 之间' });
    }

    const existing = DataService.getGiftCodes().find(c => c.code === code);
    if (existing) {
      return res.status(400).json({ error: '礼品码已存在' });
    }

    const giftCode = DataService.createGiftCode({
      code: code.trim().toUpperCase(),
      credits: parseInt(credits),
      maxUses: parseInt(maxUses) || 1,
      description: description || '',
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      createdBy: req.admin.username
    });

    res.json({ success: true, giftCode });
  } catch (error) {
    console.error('[Admin] 创建礼品码失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * 获取所有礼品码
 */
router.get('/credits/codes', authMiddleware, (req, res) => {
  try {
    const codes = DataService.getGiftCodes();
    res.json({ success: true, codes });
  } catch (error) {
    console.error('[Admin] 获取礼品码列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 删除礼品码
 */
router.delete('/credits/codes/:codeId', authMiddleware, (req, res) => {
  try {
    const { codeId } = req.params;
    const success = DataService.deleteGiftCode(codeId);

    if (!success) {
      return res.status(404).json({ error: '礼品码不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Admin] 删除礼品码失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// ========== 直接发放积分 ==========

/**
 * 管理员直接给用户发放积分
 */
router.post('/credits/add-to-user', authMiddleware, express.json(), (req, res) => {
  try {
    const { visitorId, amount, description } = req.body;

    if (!visitorId || !amount) {
      return res.status(400).json({ error: '缺少访客ID或积分数量' });
    }

    const credits = parseInt(amount);
    if (credits <= 0 || credits > 1000000) {
      return res.status(400).json({ error: '积分数量必须在 1-1000000 之间' });
    }

    const result = DataService.addServerCredits(
      visitorId.trim(),
      credits,
      null,
      description || `管理员${req.admin.username}手动发放`
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Admin] 发放积分失败:', error);
    res.status(500).json({ error: '发放积分失败' });
  }
});

/**
 * 查询用户积分余额
 */
router.get('/credits/user/:visitorId', authMiddleware, (req, res) => {
  try {
    const { visitorId } = req.params;
    const credits = DataService.getOrInitCredits(visitorId);
    const transactions = DataService.getCreditTransactions(visitorId, 20);
    res.json({ success: true, ...credits, transactions });
  } catch (error) {
    console.error('[Admin] 查询积分失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// ========== 密码管理 ==========

/**
 * 修改管理员密码
 */
router.post('/change-password', authMiddleware, express.json(), (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '缺少旧密码或新密码' });
    }

    const result = DataService.changeAdminPassword(req.admin.username, oldPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('[Admin] 修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

module.exports = router;
