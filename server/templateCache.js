/**
 * 模板缓存服务
 *
 * 功能：
 * 1. 内存缓存COS模板列表，避免重复请求
 * 2. 自动刷新机制（每30分钟）
 * 3. 手动刷新接口
 */

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

class TemplateCache {
  constructor() {
    // 缓存存储
    this.cache = {
      m2: {}, // { male: [...], female: [...], child: [...], couple: [...] }
      m3: []  // 情侣模板（不分性别）
    };

    // 缓存时间戳
    this.lastUpdate = {
      m2: {},
      m3: null
    };

    // 缓存有效期（30分钟）
    this.CACHE_TTL = 30 * 60 * 1000;

    // 是否正在刷新
    this.isRefreshing = {
      m2: {},
      m3: false
    };

    // COS配置
    this.cosConfig = {
      secretId: process.env.VITE_TENCENT_COS_SECRET_ID,
      secretKey: process.env.VITE_TENCENT_COS_SECRET_KEY,
      bucket: process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527',
      region: process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai'
    };

    // 初始化COS客户端
    this.cos = new COS({
      SecretId: this.cosConfig.secretId,
      SecretKey: this.cosConfig.secretKey
    });

    // 读取M2分类数据库
    this.assetDatabase = this.loadAssetDatabase();
  }

  /**
   * 加载资源分类数据库
   */
  loadAssetDatabase() {
    const databasePath = path.join(__dirname, '..', 'template-analysis', 'asset-database.json');
    try {
      if (fs.existsSync(databasePath)) {
        const data = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
        return data.assets || {};
      }
    } catch (e) {
      console.warn('[TemplateCache] ⚠️ 无法读取分类数据库');
    }
    return {};
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(type, gender = null) {
    if (type === 'm2' && gender) {
      const timestamp = this.lastUpdate.m2[gender];
      if (!timestamp) return false;
      return (Date.now() - timestamp) < this.CACHE_TTL;
    } else if (type === 'm3') {
      const timestamp = this.lastUpdate.m3;
      if (!timestamp) return false;
      return (Date.now() - timestamp) < this.CACHE_TTL;
    }
    return false;
  }

  /**
   * 获取M2模板（带缓存）
   * @param {string} gender - male/female/child/couple
   * @param {string} category - modern/qipao/hanfu/tangzhuang/caishen/traditional/all
   */
  async getM2Templates(gender, category = 'all') {
    // 检查缓存
    if (this.isCacheValid('m2', gender)) {
      console.log(`[TemplateCache] ✅ 使用缓存 (M2-${gender})`);
      return this.filterByCategory(this.cache.m2[gender], category);
    }

    // 避免并发刷新
    if (this.isRefreshing.m2[gender]) {
      console.log(`[TemplateCache] ⏳ 等待刷新完成 (M2-${gender})`);
      // 等待刷新完成（最多10秒）
      await this.waitForRefresh('m2', gender, 10000);
      return this.filterByCategory(this.cache.m2[gender], category);
    }

    // 刷新缓存
    await this.refreshM2Cache(gender);
    return this.filterByCategory(this.cache.m2[gender], category);
  }

  /**
   * 获取M3模板（带缓存）
   */
  async getM3Templates() {
    // 检查缓存
    if (this.isCacheValid('m3')) {
      console.log('[TemplateCache] ✅ 使用缓存 (M3)');
      return this.cache.m3;
    }

    // 避免并发刷新
    if (this.isRefreshing.m3) {
      console.log('[TemplateCache] ⏳ 等待刷新完成 (M3)');
      await this.waitForRefresh('m3', null, 10000);
      return this.cache.m3;
    }

    // 刷新缓存
    await this.refreshM3Cache();
    return this.cache.m3;
  }

  /**
   * 等待刷新完成
   */
  waitForRefresh(type, gender, timeout) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const isRefreshing = type === 'm2'
          ? this.isRefreshing.m2[gender]
          : this.isRefreshing.m3;

        if (!isRefreshing || (Date.now() - startTime) > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * 刷新M2缓存
   */
  refreshM2Cache(gender) {
    return new Promise((resolve, reject) => {
      this.isRefreshing.m2[gender] = true;
      const prefix = `festival-templates/m2/${gender}/`;

      console.log(`[TemplateCache] 🔄 刷新M2缓存 (${gender})...`);

      this.cos.getBucket(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Prefix: prefix
        },
        (err, data) => {
          this.isRefreshing.m2[gender] = false;

          if (err) {
            console.error(`[TemplateCache] ❌ M2缓存刷新失败 (${gender}):`, err.message);
            return reject(err);
          }

          // 处理模板数据
          const templates = data.Contents
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file.Key))
            .map(file => {
              const baseUrl = `https://${this.cosConfig.bucket}.cos.${this.cosConfig.region}.myqcloud.com/${file.Key}`;
              const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;
              const fileName = file.Key.split('/').pop();
              const id = fileName.split('.')[0];
              const assetInfo = this.assetDatabase[id] || {};
              const assetCategory = assetInfo.category || 'modern';

              return {
                id,
                name: fileName,
                imagePath: compressedUrl,
                originalImagePath: baseUrl,
                gender,
                category: assetCategory,
                size: file.Size,
                lastModified: file.LastModified
              };
            });

          this.cache.m2[gender] = templates;
          this.lastUpdate.m2[gender] = Date.now();

          console.log(`[TemplateCache] ✅ M2缓存已更新 (${gender}): ${templates.length} 个模板`);
          resolve(templates);
        }
      );
    });
  }

  /**
   * 刷新M3缓存
   */
  refreshM3Cache() {
    return new Promise((resolve, reject) => {
      this.isRefreshing.m3 = true;
      const prefix = 'festival-templates/m3/';

      console.log('[TemplateCache] 🔄 刷新M3缓存...');

      this.cos.getBucket(
        {
          Bucket: this.cosConfig.bucket,
          Region: this.cosConfig.region,
          Prefix: prefix
        },
        (err, data) => {
          this.isRefreshing.m3 = false;

          if (err) {
            console.error('[TemplateCache] ❌ M3缓存刷新失败:', err.message);
            return reject(err);
          }

          // 排除过大的文件
          const excludeFiles = ['4 (68).jpeg', '4 (69).jpeg', '4 (71).jpeg'];

          const templates = data.Contents
            .filter(file => {
              const fileName = file.Key.split('/').pop();
              return /\.(jpg|jpeg|png|webp)$/i.test(file.Key) && !excludeFiles.includes(fileName);
            })
            .map(file => {
              const encodedKey = file.Key.split('/').map(part => encodeURIComponent(part)).join('/');
              const baseUrl = `https://${this.cosConfig.bucket}.cos.${this.cosConfig.region}.myqcloud.com/${encodedKey}`;
              const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;
              const fileName = file.Key.split('/').pop();
              const id = fileName.split('.')[0];

              return {
                id,
                name: fileName,
                imagePath: compressedUrl,
                originalImagePath: baseUrl,
                size: file.Size,
                lastModified: file.LastModified
              };
            });

          this.cache.m3 = templates;
          this.lastUpdate.m3 = Date.now();

          console.log(`[TemplateCache] ✅ M3缓存已更新: ${templates.length} 个模板`);
          resolve(templates);
        }
      );
    });
  }

  /**
   * 根据分类过滤模板
   */
  filterByCategory(templates, category) {
    if (!category || category === 'all') {
      return templates;
    }

    if (category === 'traditional') {
      return templates.filter(t => ['hanfu', 'tangzhuang', 'caishen'].includes(t.category));
    }

    return templates.filter(t => t.category === category);
  }

  /**
   * 手动刷新所有缓存
   */
  async refreshAll() {
    console.log('[TemplateCache] 🔄 开始全量刷新缓存...');

    try {
      // 刷新M2所有性别
      await Promise.all([
        this.refreshM2Cache('male'),
        this.refreshM2Cache('female'),
        this.refreshM2Cache('child'),
        this.refreshM2Cache('couple')
      ]);

      // 刷新M3
      await this.refreshM3Cache();

      console.log('[TemplateCache] ✅ 全量刷新完成');
      return true;
    } catch (error) {
      console.error('[TemplateCache] ❌ 全量刷新失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      m2: {
        male: {
          count: this.cache.m2.male?.length || 0,
          lastUpdate: this.lastUpdate.m2.male,
          isValid: this.isCacheValid('m2', 'male')
        },
        female: {
          count: this.cache.m2.female?.length || 0,
          lastUpdate: this.lastUpdate.m2.female,
          isValid: this.isCacheValid('m2', 'female')
        },
        child: {
          count: this.cache.m2.child?.length || 0,
          lastUpdate: this.lastUpdate.m2.child,
          isValid: this.isCacheValid('m2', 'child')
        },
        couple: {
          count: this.cache.m2.couple?.length || 0,
          lastUpdate: this.lastUpdate.m2.couple,
          isValid: this.isCacheValid('m2', 'couple')
        }
      },
      m3: {
        count: this.cache.m3?.length || 0,
        lastUpdate: this.lastUpdate.m3,
        isValid: this.isCacheValid('m3')
      }
    };
  }
}

// 导出单例
module.exports = new TemplateCache();
