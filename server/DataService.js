/**
 * 数据服务层 - 处理所有数据的读写操作
 * 使用JSON文件存储，支持数据备份和恢复
 */

const fs = require('fs');
const path = require('path');

class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, '../data/admin');
    this.ensureDataDir();
  }

  /**
   * 确保数据目录存在
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 读取JSON文件
   */
  readJSON(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[DataService] 读取${filename}失败:`, error);
      return [];
    }
  }

  /**
   * 写入JSON文件
   */
  writeJSON(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`[DataService] 写入${filename}失败:`, error);
      return false;
    }
  }

  // ========== 访客数据 ==========

  /**
   * 记录访客
   */
  recordVisitor(visitorData) {
    const visitors = this.readJSON('visitors.json');
    const existing = visitors.find(v => v.id === visitorData.id);

    if (!existing) {
      visitors.push({
        ...visitorData,
        firstVisit: Date.now(),
        lastVisit: Date.now(),
        totalVisits: 1
      });
    } else {
      existing.lastVisit = Date.now();
      existing.totalVisits = (existing.totalVisits || 1) + 1;
    }

    this.writeJSON('visitors.json', visitors);
    return true;
  }

  /**
   * 获取所有访客
   */
  getVisitors(options = {}) {
    const { limit = 1000, offset = 0, sortBy = 'lastVisit', order = 'desc' } = options;
    let visitors = this.readJSON('visitors.json');

    // 排序
    visitors.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // 分页
    return {
      total: visitors.length,
      data: visitors.slice(offset, offset + limit)
    };
  }

  /**
   * 获取独立访客数（UV）
   */
  getUniqueVisitorsCount(startTime = 0) {
    const visitors = this.readJSON('visitors.json');
    return visitors.filter(v => v.firstVisit >= startTime).length;
  }

  // ========== API调用日志 ==========

  /**
   * 记录API调用
   */
  logAPICall(logData) {
    const logs = this.readJSON('api_logs.json');
    logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...logData
    });

    // 只保留最近10000条记录（防止文件过大）
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }

    this.writeJSON('api_logs.json', logs);
    return true;
  }

  /**
   * 获取API调用日志
   */
  getAPILogs(options = {}) {
    const {
      limit = 100,
      offset = 0,
      visitorId = null,
      featureId = null,
      startTime = 0,
      endTime = Date.now()
    } = options;

    let logs = this.readJSON('api_logs.json');

    // 筛选
    logs = logs.filter(log => {
      if (log.timestamp < startTime || log.timestamp > endTime) return false;
      if (visitorId && log.visitorId !== visitorId) return false;
      if (featureId && log.featureId !== featureId) return false;
      return true;
    });

    // 排序（最新的在前）
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return {
      total: logs.length,
      data: logs.slice(offset, offset + limit)
    };
  }

  /**
   * 获取API调用统计
   */
  getAPIStats(startTime = 0) {
    const logs = this.readJSON('api_logs.json');
    const filteredLogs = logs.filter(log => log.timestamp >= startTime);

    // 按功能分组统计
    const featureStats = {};
    filteredLogs.forEach(log => {
      const feature = log.featureId || 'unknown';
      if (!featureStats[feature]) {
        featureStats[feature] = {
          featureId: feature,
          featureName: log.featureName || feature,
          totalCalls: 0,
          successCalls: 0,
          failedCalls: 0
        };
      }
      featureStats[feature].totalCalls++;
      if (log.success) {
        featureStats[feature].successCalls++;
      } else {
        featureStats[feature].failedCalls++;
      }
    });

    return {
      totalCalls: filteredLogs.length,
      features: Object.values(featureStats).sort((a, b) => b.totalCalls - a.totalCalls)
    };
  }

  // ========== 页面访问记录 ==========

  /**
   * 记录页面访问
   */
  recordPageView(pageData) {
    const pageViews = this.readJSON('page_views.json');
    pageViews.push({
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...pageData
    });

    // 只保留最近20000条记录
    if (pageViews.length > 20000) {
      pageViews.splice(0, pageViews.length - 20000);
    }

    this.writeJSON('page_views.json', pageViews);
    return true;
  }

  /**
   * 获取页面访问统计
   */
  getPageViewStats(startTime = 0) {
    const pageViews = this.readJSON('page_views.json');
    const filtered = pageViews.filter(pv => pv.timestamp >= startTime);

    // 按路径分组
    const pathStats = {};
    filtered.forEach(pv => {
      const path = pv.path || 'unknown';
      if (!pathStats[path]) {
        pathStats[path] = { path, count: 0 };
      }
      pathStats[path].count++;
    });

    return {
      totalPV: filtered.length,
      paths: Object.values(pathStats).sort((a, b) => b.count - a.count)
    };
  }

  // ========== 综合统计 ==========

  /**
   * 获取今日统计数据
   */
  getTodayStats() {
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const uvCount = this.getUniqueVisitorsCount(todayStart);
    const pvStats = this.getPageViewStats(todayStart);
    const apiStats = this.getAPIStats(todayStart);

    return {
      today: {
        uv: uvCount,
        pv: pvStats.totalPV,
        apiCalls: apiStats.totalCalls
      }
    };
  }

  /**
   * 获取总体统计数据
   */
  getTotalStats() {
    const visitors = this.readJSON('visitors.json');
    const apiLogs = this.readJSON('api_logs.json');
    const pageViews = this.readJSON('page_views.json');

    return {
      total: {
        visitors: visitors.length,
        apiCalls: apiLogs.length,
        pageViews: pageViews.length
      }
    };
  }

  /**
   * 获取管理后台完整统计数据
   */
  getDashboardStats() {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    // 今日数据
    const todayUV = this.getUniqueVisitorsCount(todayStart);
    const todayPV = this.getPageViewStats(todayStart).totalPV;
    const todayAPI = this.getAPIStats(todayStart);

    // 昨日数据（用于对比）
    const yesterdayUV = this.getUniqueVisitorsCount(yesterdayStart) - todayUV;
    const yesterdayPV = this.getPageViewStats(yesterdayStart).totalPV - todayPV;

    // 总数据
    const totalStats = this.getTotalStats();

    // 功能使用排行
    const apiStats = this.getAPIStats(0);

    return {
      today: {
        uv: todayUV,
        pv: todayPV,
        apiCalls: todayAPI.totalCalls,
        uvChange: yesterdayUV > 0 ? ((todayUV - yesterdayUV) / yesterdayUV * 100).toFixed(1) : 0,
        pvChange: yesterdayPV > 0 ? ((todayPV - yesterdayPV) / yesterdayPV * 100).toFixed(1) : 0
      },
      total: totalStats.total,
      topFeatures: apiStats.features.slice(0, 10)
    };
  }

  // ========== 数据导出 ==========

  /**
   * 导出所有数据为CSV
   */
  exportToCSV(dataType) {
    try {
      let data = [];
      let headers = [];

      switch (dataType) {
        case 'visitors':
          data = this.readJSON('visitors.json');
          headers = ['ID', '首次访问', '最后访问', '访问次数', '设备', '浏览器'];
          break;
        case 'api_logs':
          data = this.readJSON('api_logs.json');
          headers = ['时间', '访客ID', '功能', '状态', '耗时'];
          break;
        case 'page_views':
          data = this.readJSON('page_views.json');
          headers = ['时间', '访客ID', '路径', '来源'];
          break;
        default:
          return null;
      }

      // 转换为CSV格式（简化版）
      const csv = [headers.join(',')];
      data.forEach(row => {
        const values = headers.map(h => {
          // 这里需要根据实际字段映射
          return JSON.stringify(row[h.toLowerCase()] || '');
        });
        csv.push(values.join(','));
      });

      return csv.join('\n');
    } catch (error) {
      console.error('[DataService] 导出CSV失败:', error);
      return null;
    }
  }

  // ========== 管理员账号 ==========

  /**
   * 验证管理员登录
   */
  validateAdmin(username, password) {
    const admins = this.readJSON('admin_users.json');
    const admin = admins.find(a => a.username === username);

    if (!admin) {
      return null;
    }

    // 从环境变量读取管理员密码（生产环境必须配置）
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === ADMIN_PASSWORD) {
      // 更新最后登录时间
      admin.lastLogin = Date.now();
      this.writeJSON('admin_users.json', admins);

      return {
        id: admin.id,
        username: admin.username,
        role: admin.role
      };
    }

    return null;
  }
}

module.exports = new DataService();
