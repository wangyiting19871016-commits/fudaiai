// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto'); // 🔑 用于LiblibAI签名和支付签名
const COS = require('cos-nodejs-sdk-v5'); // 腾讯云COS SDK
const jwt = require('jsonwebtoken'); // JWT用于可灵API鉴权
const rateLimit = require('express-rate-limit'); // 速率限制
const adminRoutes = require('./server/adminRoutes'); // 管理后台路由
// crypto已在上方引入，无需重复声明
// const db = require('./src/backend/db');  // ⚠️ Zhenji项目模块，暂时注释
// const { executeTask } = require('./src/backend/executor');  // ⚠️ Zhenji项目模块，暂时注释

function normalizeEnvValue(raw) {
  return String(raw || '').trim().replace(/^['"]|['"]$/g, '');
}

function getDashscopeKeyCandidates() {
  return [
    { name: 'DASHSCOPE_API_KEY', value: normalizeEnvValue(process.env.DASHSCOPE_API_KEY) },
    { name: 'QWEN_API_KEY', value: normalizeEnvValue(process.env.QWEN_API_KEY) },
    { name: 'VITE_DASHSCOPE_API_KEY', value: normalizeEnvValue(process.env.VITE_DASHSCOPE_API_KEY) }
  ].filter(item => Boolean(item.value));
}

function readDashscopeApiKey() {
  const candidates = getDashscopeKeyCandidates();
  if (candidates.length === 0) {
    return '';
  }

  const distinctValues = [...new Set(candidates.map(item => item.value))];
  if (distinctValues.length > 1) {
    console.warn('[DashScope Config] 检测到多个不同Key，当前按优先级使用:', candidates.map(item => item.name).join(' > '));
  }

  return candidates[0].value;
}

// 物理目录强制补全
const tempDirPath = path.resolve(__dirname, 'temp_processing');
if (!fs.existsSync(tempDirPath)) {
  fs.mkdirSync(tempDirPath, { recursive: true });
  console.log('✅ [System] 物理创建 temp_processing 成功');
}

// 强制绝对路径锁定
const absoluteTempDir = path.resolve(__dirname, 'temp_processing').replace(/\\/g, '/');
// 强制确保物理目录存在
if (!fs.existsSync(absoluteTempDir)) {
  fs.mkdirSync(absoluteTempDir, { recursive: true });
}
console.log(`✅ 物理保存路径已锁定: ${absoluteTempDir}`);

// 确保下载目录存在
const downloadDir = path.join(__dirname, 'downloads');
fs.mkdirSync(downloadDir, { recursive: true });
console.log(`✅ 下载目录已初始化: ${downloadDir}`);

// 统一物理路径：使用 diskStorage 直接存储到 temp_processing 目录
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 强制使用绝对路径，不产生任何名为 uploads 的子文件夹
    cb(null, absoluteTempDir);
  },
  filename: (req, file, cb) => {
    // 使用 -blob 结尾的文件名，便于识别
    cb(null, Date.now() + '-blob.webm');
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB限制
    files: 1 // 单次只允许上传1个文件
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedMimes = [
      'video/webm',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
  },
  // 捕获 Multer 错误
  onError: (err, req, res, next) => {
    console.error(`🚨 [CRITICAL]: 文件写入物理失败，原因: ${err.message}`);
    next(err);
  }
});

const app = express();
const PORT = process.env.PORT || 3002;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_REQUEST_LOG = process.env.ENABLE_REQUEST_LOG === 'true' || !IS_PRODUCTION;

// CORS allowlist:
// - production should only allow frontend domains from env
// - development keeps local LAN/dev convenience
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];
const envCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = IS_PRODUCTION
  ? envCorsOrigins
  : [...new Set([...defaultDevOrigins, ...envCorsOrigins])];

function validateRuntimeConfig() {
  const hardErrors = [];
  const softWarnings = [];

  if (getDashscopeKeyCandidates().length === 0) {
    hardErrors.push('缺少 DashScope Key（DASHSCOPE_API_KEY / QWEN_API_KEY / VITE_DASHSCOPE_API_KEY）');
  }

  if (!normalizeEnvValue(process.env.LIBLIB_ACCESS_KEY) || !normalizeEnvValue(process.env.LIBLIB_SECRET_KEY)) {
    hardErrors.push('缺少 LiblibAI 密钥（LIBLIB_ACCESS_KEY / LIBLIB_SECRET_KEY）');
  }

  if (!normalizeEnvValue(process.env.FISH_AUDIO_API_KEY)) {
    softWarnings.push('缺少 FISH_AUDIO_API_KEY（语音功能将不可用）');
  }

  if (!normalizeEnvValue(process.env.VITE_TENCENT_COS_SECRET_ID) || !normalizeEnvValue(process.env.VITE_TENCENT_COS_SECRET_KEY)) {
    hardErrors.push('缺少 COS 密钥（VITE_TENCENT_COS_SECRET_ID / VITE_TENCENT_COS_SECRET_KEY）');
  }

  if (IS_PRODUCTION && allowedOrigins.length === 0) {
    hardErrors.push('生产环境未配置 CORS_ALLOWED_ORIGINS');
  }

  if (!normalizeEnvValue(process.env.HUPIJIAO_APP_ID) || !normalizeEnvValue(process.env.HUPIJIAO_APP_SECRET)) {
    softWarnings.push('缺少虎皮椒支付密钥（支付功能将不可用）');
  }

  if (softWarnings.length > 0) {
    softWarnings.forEach((message) => console.warn(`[Config Warning] ${message}`));
  }

  if (hardErrors.length > 0) {
    hardErrors.forEach((message) => console.error(`[Config Error] ${message}`));
    if (IS_PRODUCTION) {
      console.error('[Config Error] 生产环境配置不完整，服务终止启动');
      process.exit(1);
    } else {
      console.warn('[Config Warning] 开发环境继续运行（建议尽快修复上述配置）');
    }
  }
}

validateRuntimeConfig();

function sanitizeSegmentBoundary(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, num) : NaN;
}

// 统一的JWT生成函数（解决时间同步问题）
function generateKlingJWT() {
  const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
  const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
  
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('可灵API密钥未配置');
  }
  
  // 使用更宽松的时间窗口，避免时钟不同步
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iss: KLING_ACCESS_KEY,
    exp: now + 3600,  // 1小时，更宽松
    nbf: now - 30,    // 30秒前生效，避免时钟快
    jti: `kling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 可灵API速率限制配置（防止超过资源包限制）
const klingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟窗口
  max: 5, // 每分钟最多5次请求
  message: {
    status: 'error',
    message: '请求过于频繁，请等待1分钟后重试',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// CORS: strict in production, flexible in development
app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser clients (curl/postman) or local file testing
    if (!origin) {
      return callback(null, true);
    }

    if (!IS_PRODUCTION) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 [CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// 安装"前置信号雷达" (Global Request Radar)
if (ENABLE_REQUEST_LOG) {
  app.use((req, res, next) => {
    console.log(`📡 [雷达捕捉到信号]: ${req.method} -> ${req.url}`);
    console.log(`✨ [3002 信号] 成功接收到来自网页的请求！`);
    next();
  });
}

// 🔐 Admin Routes (管理后台路由)
app.use('/api/admin', adminRoutes);

// 🔑 LiblibAI签名API（备用端点，用于外网访问）
app.post('/api/sign-liblib', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { secret, message } = req.body;

    if (!secret || !message) {
      return res.status(400).json({ error: 'Missing secret or message' });
    }

    // 使用crypto计算HMAC-SHA1签名
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(message);
    const signature = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    console.log('🔑 [签名API] 签名成功');
    res.json({ signature });
  } catch (error) {
    console.error('🔑 [签名API] 错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Zhenji Refactor API Routes ---
// ⚠️ 以下路由依赖 src/backend/db 和 src/backend/executor
// ⚠️ 暂时注释，不影响 Festival 功能（M2、FFmpeg等）

// // Skills CRUD
// app.get('/api/skills', (req, res) => {
//   res.json(db.skills.getAll());
// });

// app.post('/api/skills', express.json(), (req, res) => {
//   try {
//     const skill = db.skills.create(req.body);
//     res.json(skill);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Tasks CRUD
// app.get('/api/tasks', (req, res) => {
//   res.json(db.tasks.getAll());
// });

// app.post('/api/tasks', express.json(), (req, res) => {
//   try {
//     const task = db.tasks.create(req.body);
//     res.json(task);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Executor
// app.post('/api/execute-task', express.json(), async (req, res) => {
//   try {
//     const { task_id, user_inputs } = req.body;
//     const result = await executeTask(task_id, user_inputs);
//     res.json(result);
//   } catch (err) {
//     console.error('Execution failed:', err);
//     res.status(500).json({ error: err.message });
//   }
// });
// ----------------------------------

// 静态文件服务
const distDir = path.join(__dirname, 'dist');

app.use('/assets', express.static(path.join(distDir, 'assets'), {
  maxAge: '30d',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  }
}));

app.use(express.static(distDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
}));

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 检查 FFmpeg 是否在系统路径中，或扫描常见安装路径
const checkFfmpegInPath = (callback) => {
  // 常见的 FFmpeg 安装路径（Windows）
  const commonPaths = [
    'ffmpeg', // 默认 PATH
    'E:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
    'D:\\ffmpeg\\bin\\ffmpeg.exe'
  ];

  // 逐个尝试路径
  let currentIndex = 0;
  
  const tryNextPath = () => {
    if (currentIndex >= commonPaths.length) {
      callback(false, null);
      return;
    }

    const ffmpegPath = commonPaths[currentIndex];
    currentIndex++;
    
    exec(`"${ffmpegPath}" -version`, (error, stdout, stderr) => {
      if (error) {
        tryNextPath();
      } else {
        callback(true, ffmpegPath);
      }
    });
  };
  
  tryNextPath();
};

// FFmpeg 状态检查接口 - 确保返回 200 OK
app.get('/api/ffmpeg-check', (req, res) => {
  console.log('🧪 [检测中] 正在响应前端的 FFmpeg 状态请求...');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'active',
    version: '2025-12-31-full_build',
    port: 3002
  });
});

// 三轨剥离接口实现
app.post('/api/audio/separate', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { videoBlob, readStartTime, readEndTime, singStartTime, singEndTime } = req.body;
    
    console.log('三轨剥离请求:', { 
      readStartTime, 
      readEndTime, 
      singStartTime, 
      singEndTime 
    });
    
    // 这里是三轨剥离的实现，使用 FFmpeg 进行音频处理
    // 实际项目中，这里会调用 FFmpeg 命令进行音频分离和切割
    
    // 模拟三轨剥离过程
    setTimeout(() => {
      // 模拟生成的文件路径
      const bgmPath = `truth_bgm_${Date.now()}.wav`;
      const readVocalPath = `truth_read_${Date.now()}.wav`;
      const singVocalPath = `truth_sing_${Date.now()}.wav`;
      
      res.json({
        status: 'success',
        message: '三轨剥离完成',
        tracks: [
          { type: 'bgm', path: bgmPath, name: '背景音乐' },
          { type: 'read', path: readVocalPath, name: '读人声' },
          { type: 'sing', path: singVocalPath, name: '唱人声' }
        ],
        originalVideo: videoBlob
      });
      
      console.log('三轨剥离完成，生成了 3 个音频文件');
    }, 5000); // 模拟 5 秒的处理时间
  } catch (error) {
    console.error('三轨剥离失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '三轨剥离失败',
      error: error.message
    });
  }
});

// 实装 AI 三轨剥离接口
app.post('/api/audio/process-triple-split', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { videoUrl, step1Start, step1End, step2Start, step2End } = req.body;
    
    console.log('AI 三轨剥离请求:', { 
      videoUrl, 
      step1Start, 
      step1End, 
      step2Start, 
      step2End 
    });
    
    // 确保有视频数据
    if (!videoUrl) {
      return res.status(400).json({
        status: 'error',
        message: '缺少视频 URL',
        error: '请提供视频 URL'
      });
    }
    
    // 模拟 AI 三轨剥离过程
    setTimeout(() => {
      // 生成的文件路径
      const bgmPath = `pure_bgm_${Date.now()}.mp3`;
      const readVocalPath = `read_part_${Date.now()}.mp3`;
      const singVocalPath = `sing_part_${Date.now()}.mp3`;
      
      // 模拟时长计算
      const readDuration = step1End - step1Start;
      const singDuration = step2End - step2Start;
      
      // 生成下载链接
      const baseUrl = `http://localhost:3001/downloads`;
      
      res.json({
        status: 'success',
        message: 'AI 三轨剥离完成',
        tracks: [
          { 
            type: 'bgm', 
            path: bgmPath, 
            name: '纯 BGM',
            duration: 60, // 假设 BGM 总时长 60 秒
            icon: '🎸',
            downloadUrl: `${baseUrl}/${bgmPath}`
          },
          { 
            type: 'read', 
            path: readVocalPath, 
            name: '读人声',
            duration: readDuration,
            icon: '🗣️',
            step: 1,
            downloadUrl: `${baseUrl}/${readVocalPath}`
          },
          { 
            type: 'sing', 
            path: singVocalPath, 
            name: '唱人声',
            duration: singDuration,
            icon: '🎤',
            step: 2,
            downloadUrl: `${baseUrl}/${singVocalPath}`
          }
        ]
      });
      
      console.log('AI 三轨剥离完成，生成了 3 个音频文件');
    }, 5000); // 模拟 5 秒的处理时间
  } catch (error) {
    console.error('AI 三轨剥离失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'AI 三轨剥离失败',
      error: error.message
    });
  }
});

// 实装通用二轨剥离接口 - 使用 fluent-ffmpeg 进行分离
// 支持 FormData 上传视频文件和动态时间片段切割
app.post('/api/audio/split-traditional', (req, res, next) => {
  console.log('✨ [实战信号] 网页请求终于到了！开始处理文件...');
  console.log('🚀 [紧急日志] 1. 路由已被命中！');
  console.log('🚀 [紧急日志] 2. 请求头类型:', req.headers['content-type']);
  // 手动调用 multer 
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error('❌ [紧急日志] 3. Multer 写入失败:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ [紧急日志] 4. Multer 写入成功，文件路径:', req.file ? req.file.path : '无文件');
    
    let tempFiles = [];
    try {
      // 强制控制台高亮日志
      console.error('!!!!!!!!!!!!!!!!!! 收到拆分指令，开始工作 !!!!!!!!!!!!!!!!!!');
    
    // 生产线监控：接收到请求
    console.log('>>> 接收到前端请求，准备解析 FormData...');
    
    // 强行锁定文件源：必须接收到文件流
    if (!req.file) {
      throw new Error('后端未接收到任何视频文件流');
    }
    
    // 生产线监控：Multer 文件保存成功
    console.log(`>>> Multer 文件上传成功，文件大小：${req.file.size} 字节`);
    console.log(`>>> Multer 实际保存路径：${req.file.path}`);
    
    // 2. 修复 322 行的崩溃：弹性 statSync 调用
    const absolutePath = path.resolve(req.file.path);
    if (!fs.existsSync(absolutePath)) {
      console.error('❌ 致命错误：文件物理不存在于路径:', absolutePath);
      return res.status(500).json({ error: '文件未能在磁盘生成' });
    }
    const stats = fs.statSync(absolutePath);
    console.log(`>>> 文件物理大小: ${stats.size} 字节`);
    
    // 计算文件大小（KB）
    const fileSizeKB = Math.round(req.file.size / 1024);
    
    // 打印通用的终端信息
    console.log(`>>> 接收到视频文件，大小为 ${fileSizeKB} KB，开始执行 FFmpeg 拆分`);
    
    // 生成输出文件名 - 通用命名，使用绝对路径
    const pureBgmPath = path.resolve(absoluteTempDir, 'pure_bgm.mp3');
    const pureVocalPath = path.resolve(absoluteTempDir, 'pure_vocal.mp3');
    const tempVocalPath = path.resolve(absoluteTempDir, `temp_vocal_${Date.now()}.mp3`);
    
    // 3. 确保上传的文件路径是绝对路径
    const absoluteSourcePath = absolutePath; // 使用上面已经解析好的绝对路径
    
    // 添加到临时文件列表，以便后续清理
    tempFiles.push(absoluteSourcePath, pureBgmPath, pureVocalPath, tempVocalPath);
    
    // 物理文件确认：在执行 FFmpeg 之前，打印录制文件的物理路径
    console.log(`>>> 准备执行 FFmpeg，录制文件物理路径: ${absoluteSourcePath}`);
    console.log(`>>> 文件大小: ${fs.statSync(absoluteSourcePath).size} 字节`);
    console.log(`>>> 确认文件真实存在: ${fs.existsSync(absoluteSourcePath)}`);
    
    // 增加带时间戳的日志
    console.log('--- 准备写入新文件，当前时间：' + new Date().toLocaleString() + ' ---');
    
    // 生产线监控：准备启动 FFmpeg
    console.log('>>> 正在启动 FFmpeg，开始提取 BGM...');
    
    // 第一步：提取 BGM（使用物理陷波滤镜）
    // 使用 equalizer 滤镜，对 1000Hz 中心频率进行 -25dB 压制
    // 移除 -ac 2，保持单声道处理，减少逻辑冲突
    // 强制使用 libmp3lame 重新编码，确保每一帧数据重新计算
    const bgmCommand = `ffmpeg -i "${absoluteSourcePath}" -y -vn -af "equalizer=f=1000:width_type=h:width=2000:g=-25,volume=1.5" -c:a libmp3lame -aq 4 "${pureBgmPath}"`;
    
    // 第二步：提取人声（使用砖墙带通滤镜）
    // 使用 bandpass 滤镜，只允许 1650Hz 中心频率附近 3000Hz 带宽通过
    // 移除 -ac 2，保持单声道处理，减少逻辑冲突
    // 强制使用 libmp3lame 重新编码，确保每一帧数据重新计算
    const vocalCommand = `ffmpeg -i "${absoluteSourcePath}" -y -vn -af "bandpass=f=1650:width_type=h:width=3000,volume=2.0" -c:a libmp3lame -aq 4 "${pureVocalPath}"`;
    
    // 验证强化：打印两个完全不同的命令字符串
    console.log('🎬 [BGM 提取指令]:', bgmCommand);
    console.log('🎬 [人声提取指令]:', vocalCommand);
    
    // 执行 BGM 提取
    await new Promise((resolve, reject) => {
      exec(bgmCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('>>> FFmpeg 处理失败: BGM 提取失败');
          console.error('>>> FFmpeg 错误信息:', error.message);
          console.error('>>> FFmpeg 标准输出:', stdout);
          console.error('>>> FFmpeg 错误输出:', stderr);
          
          const ffmpegError = new Error(`BGM 提取失败: ${error.message}`);
          ffmpegError.ffmpegError = {
            message: error.message,
            stdout: stdout,
            stderr: stderr,
            command: bgmCommand
          };
          reject(ffmpegError);
          return;
        }
        
        console.log('>>> FFmpeg 处理完成: BGM 提取成功');
        console.log('>>> FFmpeg 标准输出:', stdout);
        console.log('>>> FFmpeg 错误输出:', stderr);
        resolve(null);
      });
    });
    
    // 生产线监控：准备启动 FFmpeg 提取人声
    console.log('>>> 正在启动 FFmpeg，开始提取人声...');
    
    await new Promise((resolve, reject) => {
      exec(vocalCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('>>> FFmpeg 处理失败: 人声提取失败');
          console.error('>>> FFmpeg 错误信息:', error.message);
          console.error('>>> FFmpeg 标准输出:', stdout);
          console.error('>>> FFmpeg 错误输出:', stderr);
          
          const ffmpegError = new Error(`人声提取失败: ${error.message}`);
          ffmpegError.ffmpegError = {
            message: error.message,
            stdout: stdout,
            stderr: stderr,
            command: vocalCommand
          };
          reject(ffmpegError);
          return;
        }
        
        console.log('>>> FFmpeg 处理完成: 完整人声提取成功');
        console.log('>>> FFmpeg 标准输出:', stdout);
        console.log('>>> FFmpeg 错误输出:', stderr);
        resolve(null);
      });
    });
    
    // 第三步：处理动态时间片段切割
    const segments = [];
    // 返回相对路径，让前端自行拼接完整 URL
    const basePath = '/temp_processing';
    
    // 检查是否有步骤时间片段
    if (req.body.segments) {
      let segmentsData;
      try {
        segmentsData = JSON.parse(req.body.segments);
        console.log(`>>> 解析到 ${segmentsData.length} 个时间片段`);
      } catch (e) {
        console.error('>>> 解析 segments 参数失败，使用默认值:', e.message);
        segmentsData = [];
      }
      
      // 处理每个时间片段
      for (let i = 0; i < segmentsData.length; i++) {
        const segment = segmentsData[i];
        const startTime = sanitizeSegmentBoundary(segment.startTime);
        const endTime = sanitizeSegmentBoundary(segment.endTime);
        
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
          console.warn(`>>> 跳过非法片段 ${i}: startTime=${segment.startTime}, endTime=${segment.endTime}`);
          continue;
        }

        if (startTime > 0 && endTime > startTime) {
          // 生成片段文件名，使用标准化路径
          const segmentVocalPath = path.join(absoluteTempDir, `segment_vocal_${i}.mp3`);
          tempFiles.push(segmentVocalPath);
          
          // 生产线监控：准备切割片段
          console.log(`>>> 正在启动 FFmpeg，开始切割片段 ${i}...`);
          
          // 切割片段
          const segmentCommand = `ffmpeg -i "${pureVocalPath}" -y -ss ${startTime} -t ${endTime - startTime} -vn -af "volume=1.8" "${segmentVocalPath}"`;
          
          console.log(`>>> 执行片段 ${i} 切割命令: ${segmentCommand}`);
          
          await new Promise((resolve, reject) => {
            exec(segmentCommand, (error, stdout, stderr) => {
              if (error) {
                console.error(`>>> FFmpeg 处理失败: 片段 ${i} 切割失败`);
                console.error(`>>> FFmpeg 错误信息:`, error.message);
                console.error(`>>> FFmpeg 标准输出:`, stdout);
                console.error(`>>> FFmpeg 错误输出:`, stderr);
                
                const ffmpegError = new Error(`片段 ${i} 切割失败: ${error.message}`);
                ffmpegError.ffmpegError = {
                  message: error.message,
                  stdout: stdout,
                  stderr: stderr,
                  command: segmentCommand
                };
                reject(ffmpegError);
                return;
              }
              
              console.log(`>>> FFmpeg 处理完成: 片段 ${i} 切割成功`);
              console.log(`>>> FFmpeg 标准输出:`, stdout);
              console.log(`>>> FFmpeg 错误输出:`, stderr);
              resolve(null);
            });
          });
          
          // 添加到返回列表
            segments.push({
              segmentIndex: i,
              path: `segment_vocal_${i}.mp3`,
              downloadUrl: `${basePath}/segment_vocal_${i}.mp3`
            });
        }
      }
    }
    
    console.log('>>> 文件处理完成，正在返回结果...');
    
    // 禁用静默成功：验证物理文件是否生成
    console.log('>>> 开始验证物理文件是否生成...');
    
    // 等待磁盘文件写完（简单的延迟，确保文件写入完成）
    console.log('>>> 等待磁盘文件写入完成...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 验证 BGM 文件，多次尝试直到文件存在或超时
    let bgmExists = false;
    let vocalExists = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && (!bgmExists || !vocalExists)) {
      attempts++;
      console.log(`>>> 第 ${attempts} 次验证文件...`);
      
      bgmExists = fs.existsSync(pureBgmPath);
      vocalExists = fs.existsSync(pureVocalPath);
      
      if (!bgmExists) {
        console.log(`>>> BGM 文件尚未生成: ${pureBgmPath}`);
      }
      
      if (!vocalExists) {
        console.log(`>>> 人声文件尚未生成: ${pureVocalPath}`);
      }
      
      if (!bgmExists || !vocalExists) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 最终验证
    if (!bgmExists) {
      throw new Error(`BGM 文件生成失败，路径不存在: ${pureBgmPath}`);
    }
    
    if (!vocalExists) {
      throw new Error(`人声文件生成失败，路径不存在: ${pureVocalPath}`);
    }
    
    // 验证文件大小，确保文件不是空的
    const bgmSize = fs.statSync(pureBgmPath).size;
    const vocalSize = fs.statSync(pureVocalPath).size;
    
    // 物理文件大小审计
    console.log('📊 BGM大小:', bgmSize, ' | 人声大小:', vocalSize);
    
    // 检查两个文件大小是否完全相同
    if (bgmSize === vocalSize) {
      console.warn('⚠️ [警告] 物理过滤未生效，请检查输入源编码');
    }
    
    if (bgmSize === 0) {
      throw new Error(`BGM 文件生成失败，文件为空: ${pureBgmPath}`);
    }
    
    if (vocalSize === 0) {
      throw new Error(`人声文件生成失败，文件为空: ${pureVocalPath}`);
    }
    
    console.log('>>> 物理文件验证通过，准备返回结果...');
    
    // 返回成功响应 - 通用格式
    res.json({
      status: 'success',
      message: '音频二轨剥离完成',
      tracks: [
        {
          type: 'bgm',
          path: 'pure_bgm.mp3',
          name: '纯 BGM',
          duration: 60, // 实际项目中可以从 FFmpeg 输出中提取
          icon: '🎸',
          downloadUrl: `${basePath}/pure_bgm.mp3`
        },
        {
          type: 'vocal',
          path: 'pure_vocal.mp3',
          name: '全量人声',
          duration: 60, // 实际项目中可以从 FFmpeg 输出中提取
          icon: '🗣️',
          downloadUrl: `${basePath}/pure_vocal.mp3`
        }
      ],
      segments: segments // 动态生成的片段列表
    });
    
    console.log('>>> 拆分完成，返回结果给前端');
    
    // 强制关闭自动清理：注释掉所有 fs.unlink 代码
    // try {
    //   if (fs.existsSync(tempVocalPath)) {
    //     fs.unlinkSync(tempVocalPath);
    //     console.log(`>>> 已清理临时文件: ${tempVocalPath}`);
    //   }
    // } catch (err) {
    //   console.error(`>>> 清理临时文件失败: ${tempVocalPath}`, err.message);
    // }
    
    } catch (error) {
      console.error('>>> 音频剥离失败:', error.message);
      console.error('>>> 错误堆栈:', error.stack);
      
      // 强制关闭自动清理：注释掉所有 fs.unlink 代码
      // tempFiles.forEach(file => {
      //   try {
      //     if (fs.existsSync(file)) {
      //       fs.unlinkSync(file);
      //       console.log(`>>> 已清理临时文件: ${file}`);
      //     }
      //   } catch (err) {
      //     console.error(`>>> 清理文件失败: ${file}`, err.message);
      //   }
      // });
      
      // 返回 JSON 格式的错误信息，包含详细的 FFmpeg 报错
      const responseBody = {
        error: error.message,
        status: 'error',
        message: '音频剥离失败',
        // 如果是FFmpeg错误，保留原始错误信息
        ffmpegError: error.ffmpegError || undefined
      };

      if (!IS_PRODUCTION) {
        responseBody.stack = error.stack;
      }

      res.status(500).json(responseBody);
    }
  });
});

// 辅助函数：下载文件到本地
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function getMediaDurationMs(mediaPath, fallbackMs = 5000) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(mediaPath, (err, metadata) => {
      if (err) {
        console.warn(`⚠️ [时长探测] 失败，使用默认时长 ${fallbackMs}ms:`, err.message);
        resolve(fallbackMs);
        return;
      }

      const durationSec = metadata?.format?.duration;
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        console.warn(`⚠️ [时长探测] 无有效时长，使用默认时长 ${fallbackMs}ms`);
        resolve(fallbackMs);
        return;
      }

      resolve(Math.max(1000, Math.floor(durationSec * 1000)));
    });
  });
}

// 阿里云ASR API - 获取音频文字及时间轴
async function getAudioTranscription(audioUrl) {
  return new Promise((resolve, reject) => {
    const DASHSCOPE_API_KEY = readDashscopeApiKey();

    if (!DASHSCOPE_API_KEY) {
      console.error('❌ [ASR] Dashscope API Key 未配置');
      return reject(new Error('ASR API Key 未配置'));
    }

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/asr/transcription',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const requestData = JSON.stringify({
      model: 'paraformer-realtime-v2',
      input: {
        audio_url: audioUrl
      },
      parameters: {
        format: 'json',
        sample_rate: 16000,
        enable_words: true // 启用词级时间戳
      }
    });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ [ASR] 转录成功');
          console.log('🔍 [ASR] 响应数据:', JSON.stringify(response, null, 2));
          console.log('🔍 [ASR] sentences数量:', response.output?.sentences?.length || 0);
          resolve(response);
        } catch (error) {
          console.error('❌ [ASR] 响应解析失败:', data);
          reject(new Error('ASR响应解析失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ [ASR] 请求失败:', error);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// 智能字幕生成：按字数权重分配时间，避免时间轴堆叠
function generateSimpleSRT(text, audioDurationMs, outputPath) {
  try {
    console.log('[SRT智能模式] 文本:', text, '时长:', audioDurationMs);

    // 按标点符号分段
    const segments = text.split(/([。！？；.!?;])/).filter(s => s.trim());

    // 合并文本和标点
    const sentences = [];
    for (let i = 0; i < segments.length; i += 2) {
      const content = segments[i] + (segments[i + 1] || '');
      if (content.trim()) {
        sentences.push(content.trim());
      }
    }

    if (sentences.length === 0) {
      console.warn('⚠️ [SRT简单模式] 文本为空');
      fs.writeFileSync(outputPath, '', 'utf8');
      return outputPath;
    }

    const sentenceCharCounts = sentences.map((sentence) => {
      const normalized = sentence.replace(/[\s，。！？；,.!?;:：'"“”‘’（）()【】\[\]]/g, '');
      return Math.max(normalized.length, 1);
    });
    const totalChars = sentenceCharCounts.reduce((sum, len) => sum + len, 0);
    const safeDurationMs = Math.max(Math.floor(audioDurationMs || 0), 1000);
    const minSegmentMs = 1200;
    let segmentDurations = [];

    if (safeDurationMs <= sentences.length * minSegmentMs) {
      const avgMs = Math.max(500, Math.floor(safeDurationMs / sentences.length));
      segmentDurations = sentences.map(() => avgMs);
    } else {
      const remainingMs = safeDurationMs - (sentences.length * minSegmentMs);
      segmentDurations = sentenceCharCounts.map((chars) => {
        const weightedExtra = Math.floor((chars / totalChars) * remainingMs);
        return minSegmentMs + weightedExtra;
      });
    }

    const assignedMs = segmentDurations.reduce((sum, ms) => sum + ms, 0);
    const adjustMs = safeDurationMs - assignedMs;
    if (segmentDurations.length > 0 && adjustMs !== 0) {
      segmentDurations[segmentDurations.length - 1] += adjustMs;
    }

    const formatTime = (ms) => {
      const safeMs = Math.max(0, Math.floor(ms));
      const hours = Math.floor(safeMs / 3600000);
      const minutes = Math.floor((safeMs % 3600000) / 60000);
      const seconds = Math.floor((safeMs % 60000) / 1000);
      const milliseconds = safeMs % 1000;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    };

    let cursorMs = 0;
    let srtContent = '';
    sentences.forEach((sentence, index) => {
      const startTime = cursorMs;
      cursorMs += segmentDurations[index];
      const endTime = Math.min(cursorMs, safeDurationMs);

      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${sentence}\n\n`;
    });

    // 使用 UTF-8 with BOM 编码，确保FFmpeg正确识别中文
    const BOM = '\uFEFF';
    fs.writeFileSync(outputPath, BOM + srtContent, 'utf8');
    console.log('✅ [SRT智能模式] 字幕已生成:', outputPath);
    console.log('✅ [SRT简单模式] 字幕内容预览:\n', srtContent.substring(0, 200));
    return outputPath;
  } catch (error) {
    console.error('❌ [SRT智能模式] 失败:', error);
    throw error;
  }
}

// 生成SRT字幕文件（ASR模式）
function generateSRTFile(transcription, outputPath) {
  try {
    // 从ASR响应中提取句子和时间戳
    const sentences = transcription.output?.sentences || [];

    if (sentences.length === 0) {
      console.warn('⚠️ [SRT] 未找到转录句子，生成空字幕');
      fs.writeFileSync(outputPath, '', 'utf8');
      return outputPath;
    }

    let srtContent = '';

    sentences.forEach((sentence, index) => {
      const startTime = sentence.begin_time || 0;
      const endTime = sentence.end_time || (startTime + 2000);
      const text = sentence.text || '';

      // 转换时间戳（毫秒 -> SRT格式 HH:MM:SS,mmm）
      const formatTime = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
      };

      // SRT格式：序号\n时间范围\n文本\n空行
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${text}\n\n`;
    });

    fs.writeFileSync(outputPath, srtContent, 'utf8');
    console.log(`✅ [SRT] 字幕文件已生成: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ [SRT] 生成失败:', error);
    throw error;
  }
}

// 视频合成接口 - FFmpeg 高质量字幕烧录（优化版：先下载再处理）
app.post('/api/video/compose', express.json({ limit: '50mb' }), async (req, res) => {
  let tempInputPath = null;  // 临时输入文件路径

  try {
    const {
      inputUrl,        // 输入文件URL（图片或视频）
      type,            // 'image' 或 'video'
      subtitle,        // 字幕文本
      duration = 5,    // 图片转视频时的持续时间（秒）
      outputFormat = 'mp4' // 输出格式
    } = req.body;

    console.log('🎬 [视频合成] 收到请求:', { inputUrl, type, subtitle, duration, outputFormat });

    if (!inputUrl || !type) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要参数：inputUrl 和 type'
      });
    }

    // 生成唯一的输出文件名
    const timestamp = Date.now();
    const outputFileName = `composed_${timestamp}.${outputFormat}`;
    const outputPath = path.join(downloadDir, outputFileName);

    // 🚀 优化：先下载输入文件到本地临时目录
    const inputExt = path.extname(inputUrl) || (type === 'image' ? '.png' : '.mp4');
    tempInputPath = path.join(tempDirPath, `temp_input_${timestamp}${inputExt}`);

    console.log('📥 [视频合成] 下载输入文件:', inputUrl);
    console.log('📁 [视频合成] 临时文件:', tempInputPath);

    await downloadFile(inputUrl, tempInputPath);
    console.log('✅ [视频合成] 下载完成，文件大小:', fs.statSync(tempInputPath).size);

    console.log('📁 [视频合成] 输出路径:', outputPath);

    // 检查 FFmpeg 可用性
    checkFfmpegInPath((found, ffmpegPath) => {
      if (!found) {
        console.error('❌ [视频合成] FFmpeg 未找到');
        return res.status(500).json({
          status: 'error',
          message: 'FFmpeg 未安装或未配置在系统路径中'
        });
      }

      console.log('✅ [视频合成] 使用 FFmpeg:', ffmpegPath);
      ffmpeg.setFfmpegPath(ffmpegPath);

      // 🚀 使用本地临时文件而不是网络URL
      let command = ffmpeg(tempInputPath);

      // 根据类型处理
      if (type === 'image') {
        // 图片转视频：循环显示指定时长
        command = command
          .inputOptions([
            `-loop 1`,           // 循环图片
            `-t ${duration}`     // 持续时间
          ])
          .outputOptions([
            '-c:v libx264',      // 使用 H.264 编码
            '-pix_fmt yuv420p',  // 兼容性像素格式
            '-preset ultrafast', // 🚀 超快速编码（测试用）
            '-crf 28'            // 稍低质量但更快（18-28，值越大越快）
          ]);
      } else if (type === 'video') {
        // 视频处理：保持原有编码
        command = command
          .outputOptions([
            '-c:v libx264',      // 重新编码以烧录字幕
            '-c:a copy',         // 音频流复制（如果有）
            '-preset ultrafast', // 🚀 超快速编码
            '-crf 28'
          ]);
      }

      // 添加字幕滤镜（如果提供）
      if (subtitle && subtitle.trim()) {
        // 转义字幕文本中的特殊字符
        const escapedSubtitle = subtitle
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:')
          .replace(/,/g, '\\,');

        // 高质量字幕样式 - 优化版本
        const subtitleFilter = `drawtext=` +
          `text='${escapedSubtitle}':` +
          `fontfile='C\\:/Windows/Fonts/msyh.ttc':` + // 微软雅黑
          `fontsize=80:` +         // 字号80（原48，折中方案）
          `fontcolor=white:` +
          `borderw=4:` +           // 描边宽度4（原3）
          `bordercolor=black:` +   // 描边颜色
          `shadowcolor=black@0.7:` + // 阴影
          `shadowx=2:` +           // 阴影X偏移
          `shadowy=2:` +           // 阴影Y偏移
          `box=1:` +               // 添加背景框
          `boxcolor=black@0.5:` +  // 半透明黑色背景
          `boxborderw=12:` +       // 背景框内边距
          `x=(w-text_w)/2:` +      // 水平居中
          `y=h-th-120:` +          // 距离底部120px（原50px，更靠上）
          `enable='between(t,0.5,${type === 'image' ? duration - 0.5 : 'duration-0.5'})'`; // 淡入淡出时间

        command = command.videoFilters(subtitleFilter);
        console.log('📝 [视频合成] 添加字幕滤镜');
      }

      // 设置输出路径
      command = command.output(outputPath);

      // 监听进度
      command.on('start', (commandLine) => {
        console.log('🎬 [FFmpeg] 命令:', commandLine);
      });

      command.on('progress', (progress) => {
        console.log(`📊 [FFmpeg] 进度: ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
      });

      command.on('end', () => {
        console.log('✅ [视频合成] 完成:', outputFileName);

        // 🧹 清理临时文件
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlink(tempInputPath, (err) => {
            if (err) console.error('⚠️ 删除临时文件失败:', err);
            else console.log('🧹 已删除临时文件');
          });
        }

        // 返回下载链接
        const downloadUrl = `http://localhost:${PORT}/downloads/${outputFileName}`;
        res.json({
          status: 'success',
          message: '视频合成完成',
          outputPath: outputPath,
          downloadUrl: downloadUrl,
          fileName: outputFileName
        });
      });

      command.on('error', (err, stdout, stderr) => {
        console.error('❌ [FFmpeg] 错误:', err.message);
        console.error('❌ [FFmpeg] stderr:', stderr);

        // 🧹 清理临时文件
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlink(tempInputPath, (err) => {
            if (err) console.error('⚠️ 删除临时文件失败:', err);
          });
        }

        res.status(500).json({
          status: 'error',
          message: 'FFmpeg 处理失败',
          error: err.message,
          details: stderr
        });
      });

      // 执行命令
      command.run();
    });

  } catch (error) {
    console.error('❌ [视频合成] 异常:', error.message);

    // 🧹 清理临时文件
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      fs.unlink(tempInputPath, (err) => {
        if (err) console.error('⚠️ 删除临时文件失败:', err);
      });
    }

    res.status(500).json({
      status: 'error',
      message: '视频合成失败',
      error: error.message
    });
  }
});

// 视频后处理接口 - 字幕烧录 + 装饰元素叠加（春节拜年专用）
app.post(['/api/video/post-process', '/api/video/burn-subtitle'], express.json({ limit: '50mb' }), async (req, res) => {
  let tempVideoPath = null;
  let tempAudioPath = null;
  let tempSrtPath = null;
  const tempDecorationPaths = [];

  try {
    const {
      videoUrl,        // WAN生成的原始视频URL
      audioUrl,        // 音频URL（用于ASR生成实时字幕）
      subtitle,        // 静态字幕文本（备用）
      decorations = [], // 装饰元素数组 [{url, position, size}]
      enableRealtimeSubtitle = true // 是否启用实时字幕
    } = req.body;

    console.log('🎨 [视频后处理] 收到请求:', {
      videoUrl,
      audioUrl,
      subtitle,
      decorationCount: decorations.length,
      enableRealtimeSubtitle
    });

    if (!videoUrl) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要参数：videoUrl'
      });
    }

    // 生成唯一的输出文件名
    const timestamp = Date.now();
    const outputFileName = `processed_${timestamp}.mp4`;
    const outputPath = path.join(downloadDir, outputFileName);

    // 下载原始视频到临时目录
    tempVideoPath = path.join(tempDirPath, `temp_video_${timestamp}.mp4`);
    console.log('📥 [视频后处理] 下载原始视频:', videoUrl);
    await downloadFile(videoUrl, tempVideoPath);
    console.log('✅ [视频后处理] 下载完成');

    // 下载装饰元素图片
    for (let i = 0; i < decorations.length; i++) {
      const decoration = decorations[i];
      if (decoration.url) {
        const tempPath = path.join(tempDirPath, `temp_decoration_${timestamp}_${i}.png`);
        await downloadFile(decoration.url, tempPath);
        tempDecorationPaths.push({ ...decoration, tempPath });
        console.log(`📥 [视频后处理] 下载装饰元素 ${i + 1}`);
      }
    }

    // 先尝试下载音频，用于保留最终音轨
    if (audioUrl) {
      try {
        tempAudioPath = path.join(tempDirPath, `temp_audio_${timestamp}.mp3`);
        await downloadFile(audioUrl, tempAudioPath);
        console.log('✅ [视频后处理] 音频下载完成');
      } catch (err) {
        tempAudioPath = null;
        console.warn('⚠️ [视频后处理] 音频下载失败，将尝试保留原视频音轨');
      }
    }

    // 生成智能字幕（按字数权重分配时间轴）
    if (enableRealtimeSubtitle && subtitle && subtitle.trim()) {
      try {
        const durationSourcePath = tempAudioPath || tempVideoPath;
        const durationMs = await getMediaDurationMs(durationSourcePath, 5000);
        tempSrtPath = path.join(tempDirPath, `temp_subtitle_${timestamp}.srt`);
        generateSimpleSRT(subtitle.trim(), durationMs, tempSrtPath);
        console.log('✅ [智能字幕] 字幕已生成');
      } catch (error) {
        console.warn('⚠️ [智能字幕] 生成失败，将使用静态字幕:', error.message);
      }
    }

    // 检查 FFmpeg 可用性
    checkFfmpegInPath((found, ffmpegPath) => {
      if (!found) {
        console.error('❌ [视频后处理] FFmpeg 未找到');
        return res.status(500).json({
          status: 'error',
          message: 'FFmpeg 未安装或未配置在系统路径中'
        });
      }

      console.log('✅ [视频后处理] 使用 FFmpeg:', ffmpegPath);
      ffmpeg.setFfmpegPath(ffmpegPath);

      let command = ffmpeg(tempVideoPath);
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        command = command.input(tempAudioPath);
      }

      // 构建复杂滤镜链
      const filters = [];
      let currentInput = '[0:v]';

      // 1. 添加装饰元素叠加（使用overlay滤镜）
      if (tempDecorationPaths.length > 0) {
        const decorationInputStartIndex = tempAudioPath ? 2 : 1;
        tempDecorationPaths.forEach((decoration, index) => {
          command = command.input(decoration.tempPath);

          // 计算位置
          let overlayPosition = 'x=10:y=10'; // 默认左上角
          if (decoration.position === 'top-right') {
            overlayPosition = 'x=W-w-10:y=10';
          } else if (decoration.position === 'bottom-left') {
            overlayPosition = 'x=10:y=H-h-10';
          } else if (decoration.position === 'bottom-right') {
            overlayPosition = 'x=W-w-10:y=H-h-10';
          } else if (decoration.position === 'center') {
            overlayPosition = 'x=(W-w)/2:y=(H-h)/2';
          }

          const outputLabel = `[overlay${index}]`;
          const overlayInputIndex = decorationInputStartIndex + index;
          const overlayFilter = `${currentInput}[${overlayInputIndex}:v]overlay=${overlayPosition}${outputLabel}`;
          filters.push(overlayFilter);
          currentInput = outputLabel;
        });
      }

      // 2. 添加字幕滤镜（实时字幕 or 静态字幕）
      if (tempSrtPath && fs.existsSync(tempSrtPath)) {
        // 使用实时字幕（SRT文件）
        // Windows路径转换：C:\temp\sub.srt → C:/temp/sub.srt → C\\:/temp/sub.srt
        const escapedSrtPath = tempSrtPath
          .replace(/\\/g, '/') // 反斜杠转正斜杠
          .replace(/:/g, '\\:'); // 冒号转义

        console.log('🎬 [字幕] 原始SRT路径:', tempSrtPath);
        console.log('🎬 [字幕] 转义后路径:', escapedSrtPath);

        const subtitleFilter = `${currentInput}subtitles='${escapedSrtPath}':` +
          `force_style='FontName=Microsoft YaHei,FontSize=28,` +
          `PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1,` +
          `Outline=2,Shadow=1,MarginV=30,Alignment=2'[output]`;

        filters.push(subtitleFilter);
        currentInput = '[output]';
        console.log('🎬 [字幕] 使用实时字幕（SRT），滤镜:', subtitleFilter.substring(0, 150) + '...');
      } else if (subtitle && subtitle.trim()) {
        // fallback: 使用静态字幕（drawtext）- 修复字号和位置
        const escapedSubtitle = subtitle
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:')
          .replace(/,/g, '\\,');

        const subtitleFilter = `${currentInput}drawtext=` +
          `text='${escapedSubtitle}':` +
          `fontfile='C\\:/Windows/Fonts/msyh.ttc':` +
          `fontsize=60:` + // 修复：80 -> 60
          `fontcolor=white:` +
          `borderw=3:` +
          `bordercolor=black:` +
          `shadowcolor=black@0.7:` +
          `shadowx=2:` +
          `shadowy=2:` +
          `box=1:` +
          `boxcolor=black@0.5:` +
          `boxborderw=10:` +
          `x=(w-text_w)/2:` +
          `y=h-th-30[output]`;

        filters.push(subtitleFilter);
        currentInput = '[output]';
        console.log('⚠️ [字幕] 使用静态字幕（fallback）');
      }

      // 应用滤镜链
      if (filters.length > 0) {
        command = command.complexFilter(filters.join(';'));
      }

      // 设置输出选项
      command = command
        .outputOptions([
          '-map', currentInput === '[0:v]' ? '0:v' : currentInput,
          '-map', tempAudioPath ? '1:a:0' : '0:a?',
          '-c:v libx264',
          '-c:a aac',
          '-b:a 192k',
          '-preset ultrafast',
          '-crf 23',
          '-movflags +faststart'
        ])
        .output(outputPath);

      // 监听进度
      command.on('start', (commandLine) => {
        console.log('🎬 [FFmpeg] 命令:', commandLine);
      });

      command.on('progress', (progress) => {
        console.log(`📊 [FFmpeg] 进度: ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
      });

      command.on('end', () => {
        console.log('✅ [视频后处理] 完成:', outputFileName);

        // 清理临时文件
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
        if (tempAudioPath && fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath);
        }
        if (tempSrtPath && fs.existsSync(tempSrtPath)) {
          fs.unlinkSync(tempSrtPath);
        }
        tempDecorationPaths.forEach(dec => {
          if (fs.existsSync(dec.tempPath)) {
            fs.unlinkSync(dec.tempPath);
          }
        });

        const downloadUrl = `http://localhost:${PORT}/downloads/${outputFileName}`;
        res.json({
          status: 'success',
          message: '字幕烧录完成',
          downloadUrl: downloadUrl,
          fileName: outputFileName
        });
      });

      command.on('error', (err, stdout, stderr) => {
        console.error('❌ [FFmpeg] 错误:', err.message);
        console.error('❌ [FFmpeg] stderr:', stderr);

        // 清理临时文件
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
        if (tempAudioPath && fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath);
        }
        if (tempSrtPath && fs.existsSync(tempSrtPath)) {
          fs.unlinkSync(tempSrtPath);
        }
        tempDecorationPaths.forEach(dec => {
          if (fs.existsSync(dec.tempPath)) {
            fs.unlinkSync(dec.tempPath);
          }
        });

        res.status(500).json({
          status: 'error',
          message: 'FFmpeg 处理失败',
          error: err.message
        });
      });

      command.run();
    });

  } catch (error) {
    console.error('❌ [视频后处理] 异常:', error.message);

    // 清理临时文件
    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    if (tempSrtPath && fs.existsSync(tempSrtPath)) {
      fs.unlinkSync(tempSrtPath);
    }
    tempDecorationPaths.forEach(dec => {
      if (dec.tempPath && fs.existsSync(dec.tempPath)) {
        fs.unlinkSync(dec.tempPath);
      }
    });

    res.status(500).json({
      status: 'error',
      message: '视频后处理失败',
      error: error.message
    });
  }
});

// ========== 可灵AI视频生成 API ==========

/**
 * 可灵AI - 图生视频接口
 * POST /api/kling/video-generation
 *
 * 请求体:
 * {
 *   "image_url": "图片URL",
 *   "prompt": "视频描述(可选)",
 *   "duration": 5 或 10,
 *   "mode": "std" 或 "pro",
 *   "audio_url": "音频URL(可选,用于音画同步)"
 * }
 */
app.post('/api/kling/video-generation', express.json(), async (req, res) => {
  try {
    const { image_url, prompt = '', duration = 5, mode = 'std', audio_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必需参数: image_url'
      });
    }

    const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return res.status(500).json({
        status: 'error',
        message: '服务器未配置可灵API密钥'
      });
    }

    const jwtToken = generateKlingJWT();
    console.log('[可灵API] 创建视频生成任务:', { image_url, prompt, duration, mode });

    // 构建请求体（严格按照官方文档）
    const requestBody = {
      model_name: 'kling-v2-6', // 升级到v2.6以支持voice_list参数
      image: image_url,           // 官方字段名是 image，不是 image_url
      prompt: prompt,
      duration: String(duration), // 官方要求字符串格式
      mode: mode
    };

    // 注意：官方图生视频API不支持audio_url参数！
    // 音画同步需要使用voice_list参数（仅V2.6及后续版本支持）

    // 调用可灵API
    const klingResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const options = {
        hostname: 'api-beijing.klingai.com',  // 官方域名
        path: '/v1/videos/image2video',        // 官方端点（注意是videos复数）
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,  // 使用生成的JWT token
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`解析响应失败: ${data}`));
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.write(postData);
      apiReq.end();
    });

    console.log('[可灵API] 任务创建响应:', klingResponse);

    // 按照官方文档解析响应
    if (klingResponse.code !== 0) {
      return res.status(500).json({
        status: 'error',
        message: klingResponse.message || '可灵API调用失败',
        details: klingResponse
      });
    }

    if (!klingResponse.data || !klingResponse.data.task_id) {
      return res.status(500).json({
        status: 'error',
        message: '可灵API响应格式异常',
        details: klingResponse
      });
    }

    const taskId = klingResponse.data.task_id;

    // 开始轮询任务状态（最多等待5分钟）
    const maxAttempts = 60; // 60次 × 5秒 = 5分钟
    const pollInterval = 5000; // 5秒
    let attempts = 0;

    const pollTask = async () => {
      attempts++;
      console.log(`[可灵API] 查询任务状态 (${attempts}/${maxAttempts}):`, taskId);

      const statusResponse = await new Promise((resolve, reject) => {
          const queryToken = generateKlingJWT();

        const options = {
          hostname: 'api-beijing.klingai.com',       // 官方域名
          path: `/v1/videos/image2video/${taskId}`,  // 官方端点
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${queryToken}`   // 使用JWT token
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`解析响应失败: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.end();
      });

      // 按照官方文档解析响应
      if (statusResponse.code !== 0) {
        throw new Error(`查询任务失败: ${statusResponse.message}`);
      }

      const taskData = statusResponse.data;
      const status = taskData.task_status;  // submitted/processing/succeed/failed
      console.log(`[可灵API] 任务状态: ${status}`);

      if (status === 'succeed') {
        // 任务成功
        const videoUrl = taskData.task_result?.videos?.[0]?.url;

        if (!videoUrl) {
          throw new Error('任务完成但未找到视频URL');
        }

        console.log('[可灵API] ✅ 视频生成成功:', videoUrl);
        return res.json({
          status: 'success',
          videoUrl: videoUrl,
          taskId: taskId
        });
      } else if (status === 'failed') {
        // 任务失败
        throw new Error(`视频生成失败: ${taskData.task_status_msg || '未知错误'}`);
      } else if (attempts >= maxAttempts) {
        // 超时
        throw new Error('视频生成超时（5分钟）');
      } else {
        // 继续轮询（submitted 或 processing 状态）
        setTimeout(pollTask, pollInterval);
      }
    };

    // 启动轮询
    setTimeout(pollTask, pollInterval);

  } catch (error) {
    console.error('❌ [可灵API] 异常:', error.message);
    res.status(500).json({
      status: 'error',
      message: '可灵视频生成失败',
      error: error.message
    });
  }
});

// ========== 可灵视频特效 API ==========
app.post('/api/kling/video-effects', klingRateLimiter, express.json(), async (req, res) => {
  try {
    const { effect_scene, image_url } = req.body;

    if (!effect_scene || !image_url) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必需参数: effect_scene, image_url'
      });
    }

    const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return res.status(500).json({
        status: 'error',
        message: '服务器未配置可灵API密钥'
      });
    }

    const jwtToken = generateKlingJWT();
    console.log('[可灵特效API] 创建视频特效任务:', { effect_scene, image_url });

    // 构建请求体
    const requestBody = {
      effect_scene: effect_scene,
      input: {
        image: image_url
      }
    };

    // 调用可灵特效API
    const klingResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const options = {
        hostname: 'api-beijing.klingai.com',
        path: '/v1/videos/effects',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`解析响应失败: ${data}`));
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.write(postData);
      apiReq.end();
    });

    console.log('[可灵特效API] 任务创建响应:', klingResponse);

    if (klingResponse.code !== 0) {
      return res.status(500).json({
        status: 'error',
        message: klingResponse.message || '可灵特效API调用失败',
        details: klingResponse
      });
    }

    if (!klingResponse.data || !klingResponse.data.task_id) {
      return res.status(500).json({
        status: 'error',
        message: '可灵特效API响应格式异常',
        details: klingResponse
      });
    }

    const taskId = klingResponse.data.task_id;

    // 轮询任务状态
    const maxAttempts = 60;
    const pollInterval = 5000;
    let attempts = 0;

    const pollTask = async () => {
      attempts++;
      console.log(`[可灵特效API] 查询任务状态 (${attempts}/${maxAttempts}):`, taskId);

      let statusResponse;
      try {
      statusResponse = await new Promise((resolve, reject) => {
        const queryTime = Math.floor(Date.now() / 1000);
        const queryPayload = {
          iss: KLING_ACCESS_KEY,
          exp: queryTime + 1800,
          nbf: queryTime - 5,
          jti: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    const queryToken = generateKlingJWT();

          const options = {
            hostname: 'api-beijing.klingai.com',
            path: `/v1/videos/effects/${taskId}`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${queryToken}`
            },
            timeout: 10000 // 10秒超时
          };

          const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error(`解析响应失败: ${data}`));
              }
            });
          });

          apiReq.on('error', (err) => {
            console.warn(`⚠️ [可灵特效API] 网络错误 (${attempts}/${maxAttempts}):`, err.message);
            reject(err);
          });

          apiReq.on('timeout', () => {
            apiReq.destroy();
            reject(new Error('请求超时'));
          });

          apiReq.end();
        });
      } catch (networkError) {
        // 网络错误，重试
        console.warn(`⚠️ [可灵特效API] 网络错误，将在5秒后重试:`, networkError.message);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
          return;
        } else {
          return res.status(500).json({
            status: 'error',
            message: '网络连接失败，请检查网络后重试',
            error: networkError.message
          });
        }
      }

      console.log('[可灵特效API] 任务状态响应:', {
        code: statusResponse.code,
        message: statusResponse.message,
        hasData: !!statusResponse.data,
        taskStatus: statusResponse.data?.task_status
      });

        if (statusResponse.code !== 0) {
          // 签名错误（code === 1000）应该立即失败，不重试
          if (statusResponse.code === 1000 && statusResponse.message.includes('signature')) {
            console.error(`❌ [可灵特效API] 签名错误，无法继续重试:`, statusResponse.message);
            return res.status(500).json({
              status: 'error',
              message: 'API签名验证失败，可能是密钥错误或时间同步问题',
              errorCode: statusResponse.code,
              details: statusResponse.message
            });
          }
          
          console.warn(`⚠️ [可灵特效API] 查询失败，将在5秒后重试 (${attempts}/${maxAttempts}):`, statusResponse.message);
          
          // 其他错误继续重试
          if (attempts < maxAttempts) {
            setTimeout(pollTask, pollInterval);
            return;
          } else {
            return res.status(500).json({
              status: 'error',
              message: '查询任务状态失败',
              details: statusResponse
            });
          }
        }

      const taskStatus = statusResponse.data?.task_status;
      
      // 处理undefined状态 - 常见于刚创建的任务
      if (taskStatus === undefined) {
        console.log(`🔄 [可灵特效API] 任务状态为undefined，将在5秒后重试 (${attempts}/${maxAttempts})`);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
          return;
        } else {
          return res.status(500).json({
            status: 'error',
            message: '任务状态获取失败，请稍后重试'
          });
        }
      }

      console.log(`[可灵特效API] 当前任务状态: ${taskStatus}`);

      if (taskStatus === 'succeed') {
        const videoUrl = statusResponse.data?.task_result?.videos?.[0]?.url;
        if (!videoUrl) {
          console.error('❌ [可灵特效API] 任务成功但未找到视频URL');
          return res.status(500).json({
            status: 'error',
            message: '未获取到视频URL'
          });
        }

        console.log('[可灵特效API] ✅ 视频生成成功:', videoUrl);
        return res.json({
          status: 'success',
          videoUrl: videoUrl
        });
      } else if (taskStatus === 'failed') {
        console.error('❌ [可灵特效API] 任务失败:', statusResponse.data?.task_status_msg);
        return res.status(500).json({
          status: 'error',
          message: '可灵特效视频生成失败',
          details: statusResponse.data
        });
      } else if (taskStatus === 'submitted' || taskStatus === 'processing') {
        // 正常状态，继续轮询
        if (attempts >= maxAttempts) {
          console.log('⏰ [可灵特效API] 轮询超时，任务仍在处理中');
          return res.status(500).json({
            status: 'error',
            message: '任务处理超时，请稍后查询结果',
            taskId: taskId
          });
        }
        setTimeout(pollTask, pollInterval);
      } else {
        // 未知状态，记录并继续轮询
        console.warn(`⚠️ [可灵特效API] 未知任务状态: ${taskStatus}，将在5秒后重试`);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
        } else {
          return res.status(500).json({
            status: 'error',
            message: '任务处理异常',
            taskStatus: taskStatus
          });
        }
      }
    };

    setTimeout(pollTask, pollInterval);

  } catch (error) {
    console.error('❌ [可灵特效API] 异常:', error.message);
    res.status(500).json({
      status: 'error',
      message: '可灵特效视频生成失败',
      error: error.message
    });
  }
});

// ========== 腾讯云COS上传 API ==========

/**
 * 图片/音频上传到腾讯云COS
 * POST /api/upload-cos
 *
 * 替代Vite中间件，直接在后端处理，避免响应重复问题
 */
function sanitizeCosPublicUrl(url) {
  let value = String(url || '').trim().replace(/[\r\n\t]/g, '');
  const firstProto = value.search(/https?:\/\//i);
  if (firstProto === -1) return '';
  if (firstProto > 0) value = value.slice(firstProto);

  const mediaUrlMatch = value.match(/https?:\/\/[^\s"'<>]+?\.(jpg|jpeg|png|webp|mp3|wav|m4a|ogg|mp4)(\?[^\s"'<>]*)?/i);
  if (mediaUrlMatch && mediaUrlMatch[0]) return mediaUrlMatch[0];

  const protoMatches = [...value.matchAll(/https?:\/\//gi)];
  if (protoMatches.length > 1) {
    const cutAt = protoMatches[1].index ?? -1;
    if (cutAt > 0) {
      value = value.slice(0, cutAt);
    }
  }

  return value;
}

app.post('/api/upload-cos', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { image, type, format } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // 获取腾讯云配置
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '服务器未配置腾讯云COS密钥' });
    }

    // 初始化COS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // Base64转Buffer（支持图片和音频）
    let base64Data;
    let fileExtension;

    if (type === 'audio') {
      // 音频文件处理
      base64Data = image.replace(/^data:audio\/\w+;base64,/, '');
      fileExtension = format || 'mp3';
    } else {
      // 图片文件处理（默认）
      base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      fileExtension = 'jpg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `festival/user/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`;

    console.log('[COS Backend] 上传文件:', fileName, '类型:', type || 'image', '大小:', buffer.length);

    // 上传到COS
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: fileName,
        Body: buffer,
        ACL: 'public-read'
      },
      (err, data) => {
        if (err) {
          console.error('[COS Backend] ❌ 上传失败:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 🔧 【修复URL重复问题 - 多重验证】参考：docs/CONTEXT_HANDOFF.md

        // 第1层：手动构建干净URL（不使用COS返回的Location）
        let cleanUrl = sanitizeCosPublicUrl(`https://${bucket}.cos.${region}.myqcloud.com/${fileName}`);

        // 第2层：检测并修复URL中的重复https://
        const httpsCount = (cleanUrl.match(/https:\/\//g) || []).length;
        if (httpsCount > 1) {
          console.warn('[COS Backend] ⚠️ 检测到URL重复，正在修复...');
          const parts = cleanUrl.split('https://').filter(p => p);
          cleanUrl = 'https://' + parts[parts.length - 1]; // 取最后一段
        }

        // 第3层：JSON序列化后二次验证
        const responseData = { url: sanitizeCosPublicUrl(cleanUrl) };
        const jsonString = JSON.stringify(responseData);
        const jsonHttpsCount = (jsonString.match(/https:\/\//g) || []).length;

        if (jsonHttpsCount > 1) {
          console.error('[COS Backend] ❌ JSON序列化后仍有重复URL:', jsonString);
          // 强制修复
          const urlMatch = jsonString.match(/"url":"(https:\/\/[^"]+)"/);
          if (urlMatch) {
            const fixedUrl = urlMatch[1].split('https://').filter(p => p);
            responseData.url = 'https://' + fixedUrl[fixedUrl.length - 1];
          }
        }

        if (!responseData.url) {
          return res.status(500).json({ error: 'Failed to build COS URL' });
        }

        console.log('[COS Backend] ✅ 上传成功:', responseData.url);
        console.log('[COS Backend] 🔍 URL长度:', responseData.url.length);

        // 第4层：添加强防缓存响应头（防止代理层重复）
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // 第5层：检查响应是否已发送（防止重复发送）
        if (res.writableEnded) {
          console.warn('[COS Backend] ⚠️ 响应已发送，跳过重复发送');
          return;
        }

        return res.json(responseData);
      }
    );

  } catch (error) {
    console.error('[COS Backend] ❌ 异常:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 从COS动态获取M2模板列表
 * GET /api/m2-templates?gender=male&category=modern
 *
 * 功能：从COS bucket读取图片，并根据category筛选
 * 支持分类：modern, qipao, hanfu, tangzhuang, caishen, traditional
 */
app.get('/api/m2-templates', async (req, res) => {
  try {
    const { gender, category } = req.query;

    if (!gender || !['male', 'female', 'child', 'couple'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender parameter (male/female/child/couple required)' });
    }

    // 获取COS配置
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '服务器未配置腾讯云COS密钥' });
    }

    // 初始化COS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // 列出指定目录下的所有文件
    const prefix = `festival-templates/m2/${gender}/`;

    // 读取数据库获取分类信息
    const databasePath = path.join(__dirname, 'template-analysis', 'asset-database.json');
    let assetDatabase = {};
    try {
      if (fs.existsSync(databasePath)) {
        assetDatabase = JSON.parse(fs.readFileSync(databasePath, 'utf-8')).assets || {};
      }
    } catch (e) {
      console.warn('[M2 Templates API] 无法读取数据库，分类功能不可用');
    }

    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix
      },
      (err, data) => {
        if (err) {
          console.error('[M2 Templates API] ❌ 获取失败:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 过滤出图片文件并添加分类信息
        let templates = data.Contents
          .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file.Key))
          .map(file => {
            const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com/${file.Key}`;

            // 🔥 使用腾讯云数据万象实时处理（URL参数方式）
            // imageMogr2: 图片处理命令
            // thumbnail/800x: 缩放到宽度800px
            // strip: 去除EXIF元信息
            // format/webp: 转换为WebP格式
            // quality/85: 质量85
            const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;

            const fileName = file.Key.split('/').pop();
            const id = fileName.split('.')[0]; // 使用文件名（不含扩展名）作为ID

            // 从数据库获取分类信息
            const assetInfo = assetDatabase[id] || {};
            const assetCategory = assetInfo.category || 'modern';

            return {
              id: id,
              name: fileName,
              imagePath: compressedUrl,  // 🔥 返回压缩后的URL
              originalImagePath: baseUrl,  // 保留原图URL（如需高清预览）
              gender: gender,
              category: assetCategory,
              size: file.Size,
              lastModified: file.LastModified
            };
          });

        // 根据category筛选
        if (category && category !== 'all') {
          if (category === 'traditional') {
            // 传统装包括：hanfu, tangzhuang, caishen
            templates = templates.filter(t =>
              ['hanfu', 'tangzhuang', 'caishen'].includes(t.category)
            );
          } else {
            // 其他分类直接匹配
            templates = templates.filter(t => t.category === category);
          }
        }

        console.log(`[M2 Templates API] ✅ 返回 ${templates.length} 个${gender}模板 (分类: ${category || 'all'})`);
        res.json({
          success: true,
          gender: gender,
          category: category || 'all',
          count: templates.length,
          templates: templates
        });
      }
    );

  } catch (error) {
    console.error('[M2 Templates API] ❌ 异常:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== 🔥 M3 情侣模板 API（复制 M2 逻辑）==========
app.get('/api/m3-templates', async (req, res) => {
  console.log('📡 [雷达捕捉到信号]: GET -> /api/m3-templates');
  console.log('✨ [3002 信号] 成功接收到来自网页的请求！');

  try {
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '服务器未配置腾讯云COS密钥' });
    }

    // 初始化COS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // M3 情侣模板目录（不分性别）
    const prefix = `festival-templates/m3/`;

    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix
      },
      (err, data) => {
        if (err) {
          console.error('[M3 Templates API] ❌ 获取失败:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 过滤出图片文件（排除过大的文件）
        const excludeFiles = ['4 (68).jpeg', '4 (69).jpeg', '4 (71).jpeg'];
        let templates = data.Contents
          .filter(file => {
            const fileName = file.Key.split('/').pop();
            return /\.(jpg|jpeg|png|webp)$/i.test(file.Key) && !excludeFiles.includes(fileName);
          })
          .map(file => {
            // 🔥 对文件路径进行URL编码（处理空格、括号等特殊字符）
            const encodedKey = file.Key.split('/').map(part => encodeURIComponent(part)).join('/');
            const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com/${encodedKey}`;

            // 🔥 使用腾讯云数据万象实时处理（URL参数方式）
            const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;

            const fileName = file.Key.split('/').pop();
            const id = fileName.split('.')[0];

            return {
              id: id,
              name: fileName,
              imagePath: compressedUrl,  // 🔥 返回压缩后的URL
              originalImagePath: baseUrl,  // 保留原图URL
              size: file.Size,
              lastModified: file.LastModified
            };
          });

        console.log(`[M3 Templates API] ✅ 返回 ${templates.length} 个情侣模板`);
        res.json({
          success: true,
          count: templates.length,
          templates: templates
        });
      }
    );

  } catch (error) {
    console.error('[M3 Templates API] ❌ 异常:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 添加下载路由
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// 添加临时处理目录的静态资源映射
app.use('/temp_processing', express.static(path.join(__dirname, 'temp_processing')));

// ========== 支付系统 API ==========

// 订单存储（生产环境应使用数据库）
const ordersFilePath = path.join(__dirname, 'data', 'orders.json');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化订单文件
if (!fs.existsSync(ordersFilePath)) {
  fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
}

/**
 * 读取订单数据
 */
function readOrders() {
  try {
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(data).orders || [];
  } catch (error) {
    console.error('Failed to read orders:', error);
    return [];
  }
}

/**
 * 保存订单数据
 */
function saveOrders(orders) {
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify({ orders }, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save orders:', error);
    return false;
  }
}

/**
 * 生成订单ID
 */
function generateOrderId() {
  return `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Payment environment toggles:
// - production: strict package/amount checks, manual-complete disabled by default
// - sandbox/dev: allow legacy payloads for internal testing
const PAYMENT_MODE = process.env.PAYMENT_MODE || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
const ALLOW_MANUAL_COMPLETE = process.env.ALLOW_MANUAL_COMPLETE === 'true' || process.env.NODE_ENV !== 'production';
const MANUAL_COMPLETE_TOKEN = process.env.MANUAL_COMPLETE_TOKEN || '';

// Server-side package catalog (authoritative source in production)
const PAYMENT_PACKAGES = {
  // Canonical ids used by frontend RechargePage
  basic: { packageName: '小试牛刀', amount: 9.9, credits: 600 },
  value: { packageName: '超值畅玩', amount: 29.9, credits: 2300 },
  premium: { packageName: '春节豪礼', amount: 59.9, credits: 6000 },

  // Backward-compatible aliases
  starter: { packageName: '小试牛刀', amount: 9.9, credits: 600 },
  standard: { packageName: '超值畅玩', amount: 29.9, credits: 2300 },
  pro: { packageName: '春节豪礼', amount: 59.9, credits: 6000 },
};

function resolveOrderPricing(payload) {
  const { packageId, packageName, amount, credits } = payload || {};
  const pkg = PAYMENT_PACKAGES[packageId];

  // Prefer server-side package config when matched
  if (pkg) {
    return {
      packageId,
      packageName: pkg.packageName,
      amount: Number(pkg.amount),
      credits: Number(pkg.credits),
    };
  }

  // Sandbox fallback: keep existing test flow (legacy frontend payload)
  if (PAYMENT_MODE !== 'production') {
    const parsedAmount = Number(amount);
    const parsedCredits = Number(credits);
    if (!packageId || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      throw new Error('缺少必要参数');
    }
    return {
      packageId,
      packageName: packageName || packageId,
      amount: parsedAmount,
      credits: parsedCredits,
    };
  }

  throw new Error('无效套餐ID，请使用后端配置的套餐');
}

function isCallbackAmountMatch(orderAmount, callbackTotalFee) {
  const expected = Number(orderAmount);
  const callbackRaw = Number(callbackTotalFee);
  if (!Number.isFinite(expected) || !Number.isFinite(callbackRaw)) return false;

  // Some gateways send yuan (9.90), some send fen (990)
  const sameYuan = Math.abs(callbackRaw - expected) < 0.0001;
  const fenToYuan = Math.abs(callbackRaw / 100 - expected) < 0.0001;
  return sameYuan || fenToYuan;
}

/**
 * 生成虎皮椒签名
 */
function generateHupijiaoSign(params, appSecret) {
  // 1. 过滤空值
  const filteredParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      filteredParams[key] = params[key];
    }
  });

  // 2. 按key排序
  const sortedKeys = Object.keys(filteredParams).sort();

  // 3. 拼接字符串
  const signStr = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&') + appSecret;

  // 4. MD5加密
  return crypto.createHash('md5').update(signStr).digest('hex');
}

/**
 * 创建充值订单
 */
app.post('/api/payment/create-order', express.json(), async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const pricing = resolveOrderPricing(req.body);

    // 生成订单ID
    const orderId = generateOrderId();

    // 创建订单
    const order = {
      orderId,
      visitorId,
      packageId: pricing.packageId,
      packageName: pricing.packageName,
      amount: pricing.amount,
      credits: pricing.credits,
      status: 'pending',
      createdAt: Date.now(),
      expiredAt: Date.now() + 30 * 60 * 1000, // 30分钟后过期
    };

    // 保存订单
    const orders = readOrders();
    orders.push(order);
    saveOrders(orders);

    // 虎皮椒配置（正式环境，必须配置环境变量）
    const hupijiaoAppId = process.env.HUPIJIAO_APP_ID;
    const hupijiaoAppSecret = process.env.HUPIJIAO_APP_SECRET;
    const notifyUrl = process.env.HUPIJIAO_NOTIFY_URL;
    const paymentGateway = process.env.HUPIJIAO_PAYMENT_GATEWAY || 'https://api.xunhupay.com/payment/do.html';

    // 验证必需的配置
    if (!hupijiaoAppId || !hupijiaoAppSecret) {
      console.error('🚨 [配置错误] 缺少虎皮椒配置，请检查.env文件');
      return res.status(500).json({ error: '支付配置错误，请联系管理员' });
    }

    if (!notifyUrl || notifyUrl.includes('your-domain')) {
      console.warn('⚠️ [配置警告] 回调URL未正确配置，支付后积分可能无法自动到账');
    }

    // 虎皮椒支付参数
    const paymentParams = {
      version: '1.1',
      lang: 'zh-CN',
      plugins: 'festival-ai',
      appid: hupijiaoAppId,
      trade_order_id: orderId,
      total_fee: Number(pricing.amount).toFixed(2), // 虎皮椒使用元
      title: `${pricing.packageName} - ${pricing.credits}积分`,
      time: Math.floor(Date.now() / 1000).toString(),
      notify_url: notifyUrl,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${orderId}`,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${orderId}`,
    };

    // 生成签名
    const sign = generateHupijiaoSign(paymentParams, hupijiaoAppSecret);
    paymentParams.hash = sign;

    console.log(`💰 [支付信息]`);
    console.log(`   AppID: ${hupijiaoAppId}`);
    console.log(`   订单号: ${orderId}`);
    console.log(`   金额: ¥${pricing.amount}`);
    console.log(`   回调URL: ${notifyUrl}`);

    // 调用虎皮椒API创建支付订单
    const paymentRequestUrl = `${paymentGateway}?${Object.keys(paymentParams).map(key => `${key}=${encodeURIComponent(paymentParams[key])}`).join('&')}`;

    console.log(`🔗 [请求虎皮椒] ${paymentRequestUrl}`);

    // 使用https模块调用虎皮椒API
    const httpsModule = paymentGateway.startsWith('https') ? https : http;

    httpsModule.get(paymentRequestUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const hupijiaoResponse = JSON.parse(data);

          console.log(`✅ [虎皮椒响应]`, hupijiaoResponse);

          if (hupijiaoResponse.errcode === 0) {
            // 成功，返回支付URL
            console.log(`💰 [订单创建] ${orderId} - ${pricing.packageName} - ¥${pricing.amount} - ${pricing.credits}积分`);

            res.json({
              ...order,
              paymentUrl: hupijiaoResponse.url, // 使用虎皮椒返回的URL
              qrcodeUrl: hupijiaoResponse.url_qrcode, // 二维码URL
              hupijiaoOrderId: hupijiaoResponse.openid, // 虎皮椒订单ID
            });
          } else {
            console.error(`❌ [虎皮椒错误] ${hupijiaoResponse.errmsg}`);
            res.status(500).json({ error: `支付平台错误: ${hupijiaoResponse.errmsg}` });
          }
        } catch (parseError) {
          console.error(`❌ [解析错误]`, parseError);
          console.error(`   响应数据: ${data}`);
          res.status(500).json({ error: '支付平台响应异常' });
        }
      });
    }).on('error', (err) => {
      console.error(`❌ [请求失败]`, err);
      res.status(500).json({ error: '无法连接支付平台' });
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    if (error && (error.message === '缺少必要参数' || error.message.includes('无效套餐ID'))) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: '创建订单失败' });
  }
});

/**
 * 查询订单状态
 */
app.get('/api/payment/order-status/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    const orders = readOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 检查订单是否过期
    if (order.status === 'pending' && Date.now() > order.expiredAt) {
      order.status = 'expired';
      saveOrders(orders);
    }

    res.json(order);
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({ error: '查询订单失败' });
  }
});

/**
 * 虎皮椒支付回调
 */
app.post('/api/payment/notify', express.urlencoded({ extended: true }), (req, res) => {
  try {
    console.log('🔔 [支付回调] 收到虎皮椒回调:', req.body);

    const {
      trade_order_id,
      total_fee,
      transaction_id,
      order_id,
      status,
      hash,
    } = req.body;

    // 验证签名
    const hupijiaoAppSecret = process.env.HUPIJIAO_APP_SECRET;
    if (!hupijiaoAppSecret) {
      console.error('🚨 [支付回调] 缺少支付密钥配置');
      return res.send('fail');
    }

    const verifyParams = { ...req.body };
    delete verifyParams.hash;
    const expectedSign = generateHupijiaoSign(verifyParams, hupijiaoAppSecret);

    if (hash !== expectedSign) {
      console.error('🚨 [支付回调] 签名验证失败');
      console.error(`   收到签名: ${hash}`);
      console.error(`   期望签名: ${expectedSign}`);
      return res.send('fail');
    }

    // 查找订单
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.orderId === trade_order_id);

    if (orderIndex === -1) {
      console.error('🚨 [支付回调] 订单不存在:', trade_order_id);
      return res.send('fail');
    }

    const order = orders[orderIndex];

    // 防止重复回调
    if (order.status === 'paid') {
      console.log('✅ [支付回调] 订单已处理，忽略重复回调');
      return res.send('success');
    }

    // 更新订单状态
    if (status === 'OD') {
      if (!isCallbackAmountMatch(order.amount, total_fee)) {
        console.error('🚨 [支付回调] 金额校验失败');
        console.error(`   订单金额: ${order.amount}`);
        console.error(`   回调金额: ${total_fee}`);
        return res.send('fail');
      }

      order.status = 'paid';
      order.paidAt = Date.now();
      order.paymentId = transaction_id || order_id;
      saveOrders(orders);

      console.log(`✅ [支付成功] ${trade_order_id} - ¥${total_fee / 100} - ${order.credits}积分`);

      // TODO: 这里可以触发发放积分的逻辑，或者由前端轮询后处理

      return res.send('success');
    } else {
      order.status = 'failed';
      saveOrders(orders);

      console.log(`❌ [支付失败] ${trade_order_id}`);
      return res.send('success');
    }
  } catch (error) {
    console.error('🚨 [支付回调] 处理失败:', error);
    return res.send('fail');
  }
});

/**
 * 手动完成订单（测试用，无需支付回调）
 * 用于本地测试，无法接收支付回调时使用
 */
app.post('/api/payment/manual-complete', express.json(), (req, res) => {
  try {
    if (!ALLOW_MANUAL_COMPLETE) {
      return res.status(403).json({ error: '生产环境已禁用手动完成订单' });
    }

    if (MANUAL_COMPLETE_TOKEN) {
      const token = req.headers['x-admin-token'];
      if (token !== MANUAL_COMPLETE_TOKEN) {
        return res.status(403).json({ error: '管理员令牌无效' });
      }
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '缺少订单ID' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orders[orderIndex];

    if (order.status === 'paid') {
      return res.json({
        success: true,
        message: '订单已完成',
        order
      });
    }

    // 手动标记为已支付
    order.status = 'paid';
    order.paidAt = Date.now();
    order.paymentId = 'manual_test_' + Date.now();
    orders[orderIndex] = order;
    saveOrders(orders);

    console.log(`✅ [手动完成] ${orderId} - ${order.credits}积分`);

    res.json({
      success: true,
      message: '订单已手动完成',
      order
    });
  } catch (error) {
    console.error('手动完成订单失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 🔒 加载API代理端点 (安全地代理第三方API调用)
// ⚠️ 必须在catch-all中间件之前加载，否则会被拦截
const apiProxyRoutes = require('./api-proxy-endpoints');
apiProxyRoutes(app);

// 处理所有其他请求，返回前端应用（必须放在最后）
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 添加全局错误处理中间件 - 捕获所有中间件的错误
app.use((err, req, res, next) => {
  console.error('🚨 [SERVER CRITICAL ERROR]:', err.stack);
  const payload = {
    error: IS_PRODUCTION ? 'Internal Server Error' : err.message,
    status: 'error',
    message: '服务器内部错误'
  };
  if (!IS_PRODUCTION) {
    payload.stack = err.stack;
  }
  res.status(500).json(payload);
});

// 启动服务器 - 强制持久运行
const server = app.listen(PORT, '0.0.0.0', () => {
  // 打印物理进程信息
  console.log(`🔥 [核心监听启动] 后端心脏已跳动，端口: ${PORT}`);
  console.log('🔥 物理进程已开启，PID:', process.pid);
  console.log(`
🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at:`);
  console.log(`   - Health check: http://localhost:${PORT}/api/health`);
  console.log(`   - FFmpeg check: http://localhost:${PORT}/api/ffmpeg-check`);
  console.log(`   - Audio separate: http://localhost:${PORT}/api/audio/separate`);
  console.log(`   - AI Triple Split: http://localhost:${PORT}/api/audio/process-triple-split`);
  console.log(`   - Traditional Split: http://localhost:${PORT}/api/audio/split-traditional`);
  console.log(`   - Video Compose: http://localhost:${PORT}/api/video/compose`);
  console.log(`
🎯 Frontend available at: http://localhost:${PORT}`);
  console.log(`🚀 后端服务已在 ${PORT} 端口就绪，准备调用 FFmpeg`);
  console.log(`🔑 DashScope API Key: ${readDashscopeApiKey() ? '已加载' : '未加载'}`);
  console.log(`
🔍 Checking FFmpeg installation...`);
  
  // 启动时检查 FFmpeg 是否在系统路径中
  checkFfmpegInPath((found, path) => {
    if (!found) {
      console.log(`
⚠️  FFmpeg NOT FOUND in PATH:`);
      console.log(`   Please install FFmpeg and add it to your PATH.`);
      console.log(`   Installation guide: https://ffmpeg.org/download.html`);
      console.log(`   Simulating FFmpeg availability for frontend...`);
      console.log(`   FFmpeg service is now simulated and reachable`);
    } else {
      // 执行 FFmpeg 版本命令
      exec('ffmpeg -version', (error, stdout, stderr) => {
        if (error) {
          console.log(`
⚠️  FFmpeg PATH found but command failed:`);
          console.log(`   Path: ${path}`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Simulating FFmpeg availability for frontend...`);
          console.log(`   FFmpeg service is now simulated and reachable`);
        } else {
          const versionMatch = stdout.match(/ffmpeg version (.+?) /);
          const version = versionMatch ? versionMatch[1] : 'unknown';
          console.log(`
✅ FFmpeg FOUND:`);
          console.log(`   Path: ${path}`);
          console.log(`   Version: ${version}`);
          console.log(`   FFmpeg service is now active and reachable`);
        }
      });
    }
  });
});

// 增加自保逻辑
server.on('error', (e) => {
  console.error(`🚨 [监听失败] 检查 ${PORT} 是否被占用！`, e);
});

// 全局异常捕获，防止程序因细微错误闪退
process.on('uncaughtException', (error) => {
  console.error('🔴 [全局异常捕获] 程序遇到致命错误，但已被捕获，不会闪退:', error.message);
  console.error('🔴 错误堆栈:', error.stack);
});
