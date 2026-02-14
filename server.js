// 鍔犺浇鐜鍙橀噺
// 鐢熶骇鐜浼樺厛璇?.env.production锛堣窡闅?git锛夛紝鍏滃簳璇?.env锛堟湰鍦版墜鍔ㄧ淮鎶わ級
const path = require('path');
const fs = require('fs');
const envProductionPath = path.join(__dirname, '.env.production');
if (process.env.NODE_ENV === 'production' && fs.existsSync(envProductionPath)) {
  require('dotenv').config({ path: envProductionPath });
} else {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');
const http = require('http');
const net = require('net');
const { Readable } = require('stream');
const crypto = require('crypto'); // 馃攽 鐢ㄤ簬LiblibAI绛惧悕鍜屾敮浠樼鍚?
const COS = require('cos-nodejs-sdk-v5'); // 鑵捐浜慍OS SDK
const jwt = require('jsonwebtoken'); // JWT鐢ㄤ簬鍙伒API閴存潈
const rateLimit = require('express-rate-limit'); // 閫熺巼闄愬埗
const adminRoutes = require('./server/adminRoutes'); // 绠＄悊鍚庡彴璺敱
// crypto宸插湪涓婃柟寮曞叆锛屾棤闇€閲嶅澹版槑
// const db = require('./src/backend/db');  // 鈿狅笍 Zhenji椤圭洰妯″潡锛屾殏鏃舵敞閲?
// const { executeTask } = require('./src/backend/executor');  // 鈿狅笍 Zhenji椤圭洰妯″潡锛屾殏鏃舵敞閲?

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
    console.warn('[DashScope Config] 妫€娴嬪埌澶氫釜涓嶅悓Key锛屽綋鍓嶆寜浼樺厛绾т娇鐢?', candidates.map(item => item.name).join(' > '));
  }

  return candidates[0].value;
}

// 鐗╃悊鐩綍寮哄埗琛ュ叏
const tempDirPath = path.resolve(__dirname, 'temp_processing');
if (!fs.existsSync(tempDirPath)) {
  fs.mkdirSync(tempDirPath, { recursive: true });
  console.log('鉁?[System] 鐗╃悊鍒涘缓 temp_processing 鎴愬姛');
}

// 寮哄埗缁濆璺緞閿佸畾
const absoluteTempDir = path.resolve(__dirname, 'temp_processing').replace(/\\/g, '/');
// 寮哄埗纭繚鐗╃悊鐩綍瀛樺湪
if (!fs.existsSync(absoluteTempDir)) {
  fs.mkdirSync(absoluteTempDir, { recursive: true });
}
console.log(`鉁?鐗╃悊淇濆瓨璺緞宸查攣瀹? ${absoluteTempDir}`);

// 纭繚涓嬭浇鐩綍瀛樺湪
const downloadDir = path.join(__dirname, 'downloads');
fs.mkdirSync(downloadDir, { recursive: true });
console.log(`鉁?涓嬭浇鐩綍宸插垵濮嬪寲: ${downloadDir}`);

// 缁熶竴鐗╃悊璺緞锛氫娇鐢?diskStorage 鐩存帴瀛樺偍鍒?temp_processing 鐩綍
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 寮哄埗浣跨敤缁濆璺緞锛屼笉浜х敓浠讳綍鍚嶄负 uploads 鐨勫瓙鏂囦欢澶?
    cb(null, absoluteTempDir);
  },
  filename: (req, file, cb) => {
    // 浣跨敤 -blob 缁撳熬鐨勬枃浠跺悕锛屼究浜庤瘑鍒?
    cb(null, Date.now() + '-blob.webm');
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB闄愬埗
    files: 1 // 鍗曟鍙厑璁镐笂浼?涓枃浠?
  },
  fileFilter: (req, file, cb) => {
    // 鍏佽鐨勬枃浠剁被鍨?
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
      cb(new Error(`涓嶆敮鎸佺殑鏂囦欢绫诲瀷: ${file.mimetype}`), false);
    }
  },
  // 鎹曡幏 Multer 閿欒
  onError: (err, req, res, next) => {
    console.error(`馃毃 [CRITICAL]: 鏂囦欢鍐欏叆鐗╃悊澶辫触锛屽師鍥? ${err.message}`);
    next(err);
  }
});

const app = express();
app.set('trust proxy', true);
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
  'http://127.0.0.1:5174',
  'http://192.168.2.2:5173',
  'http://192.168.2.2:5174'
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
    hardErrors.push('Missing DashScope Key: DASHSCOPE_API_KEY / QWEN_API_KEY / VITE_DASHSCOPE_API_KEY');
  }

  if (!normalizeEnvValue(process.env.LIBLIB_ACCESS_KEY) || !normalizeEnvValue(process.env.LIBLIB_SECRET_KEY)) {
    hardErrors.push('Missing LiblibAI keys: LIBLIB_ACCESS_KEY / LIBLIB_SECRET_KEY');
  }

  if (!normalizeEnvValue(process.env.FISH_AUDIO_API_KEY)) {
    softWarnings.push('缂哄皯 FISH_AUDIO_API_KEY锛堣闊冲姛鑳藉皢涓嶅彲鐢級');
  }

  if (!normalizeEnvValue(process.env.VITE_TENCENT_COS_SECRET_ID) || !normalizeEnvValue(process.env.VITE_TENCENT_COS_SECRET_KEY)) {
    hardErrors.push('Missing COS keys: VITE_TENCENT_COS_SECRET_ID / VITE_TENCENT_COS_SECRET_KEY');
  }

  if (IS_PRODUCTION && allowedOrigins.length === 0) {
    hardErrors.push('鐢熶骇鐜鏈厤缃?CORS_ALLOWED_ORIGINS');
  }

  if (!normalizeEnvValue(process.env.HUPIJIAO_APP_ID) || !normalizeEnvValue(process.env.HUPIJIAO_APP_SECRET)) {
    softWarnings.push('Missing HUPIJIAO_APP_ID/HUPIJIAO_APP_SECRET (payment may be unavailable)');
  }

  if (softWarnings.length > 0) {
    softWarnings.forEach((message) => console.warn(`[Config Warning] ${message}`));
  }

  if (hardErrors.length > 0) {
    hardErrors.forEach((message) => console.error(`[Config Error] ${message}`));
    if (IS_PRODUCTION) {
      console.error('[Config Error] 鐢熶骇鐜閰嶇疆涓嶅畬鏁达紝鏈嶅姟缁堟鍚姩');
      process.exit(1);
    } else {
      console.warn('[Config Warning] Development mode continues with incomplete config');
    }
  }
}

validateRuntimeConfig();

function sanitizeSegmentBoundary(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, num) : NaN;
}

// 缁熶竴鐨凧WT鐢熸垚鍑芥暟锛堣В鍐虫椂闂村悓姝ラ棶棰橈級
function generateKlingJWT() {
  const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
  const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
  
  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    throw new Error('Kling API key is not configured');
  }
  
  // 浣跨敤鏇村鏉剧殑鏃堕棿绐楀彛锛岄伩鍏嶆椂閽熶笉鍚屾
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({
    iss: KLING_ACCESS_KEY,
    exp: now + 3600,  // 1灏忔椂锛屾洿瀹芥澗
    nbf: now - 30,    // 30绉掑墠鐢熸晥锛岄伩鍏嶆椂閽熷揩
    jti: `kling_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, KLING_SECRET_KEY, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' }
  });
}

// 鍙伒API閫熺巼闄愬埗閰嶇疆锛堥槻姝㈣秴杩囪祫婧愬寘闄愬埗锛?
const klingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1鍒嗛挓绐楀彛
  max: 5, // 姣忓垎閽熸渶澶?娆¤姹?
  message: {
    status: 'error',
    message: 'Too many requests, please retry after 1 minute',
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

    console.warn(`馃毇 [CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// 瀹夎"鍓嶇疆淇″彿闆疯揪" (Global Request Radar)
if (ENABLE_REQUEST_LOG) {
  app.use((req, res, next) => {
    console.log(`馃摗 [闆疯揪鎹曟崏鍒颁俊鍙穄: ${req.method} -> ${req.url}`);
    console.log(`[3002 Signal] Request accepted from web page`);
    next();
  });
}

// 馃攼 Admin Routes (绠＄悊鍚庡彴璺敱)
app.use('/api/admin', adminRoutes);

// ========== 绉垎 API ==========
const DataService = require('./server/DataService');

// 鑾峰彇鐢ㄦ埛绉垎浣欓
app.get('/api/credits/balance/:visitorId', (req, res) => {
  try {
    const { visitorId } = req.params;
    if (!visitorId) return res.status(400).json({ error: '缂哄皯璁垮ID' });
    const data = DataService.getOrInitCredits(visitorId);
    res.json({ success: true, balance: data.credits, totalRecharged: data.totalRecharged, totalConsumed: data.totalConsumed });
  } catch (error) {
    console.error('[Credits] 鑾峰彇浣欓澶辫触:', error);
    res.status(500).json({ error: '鑾峰彇浣欓澶辫触' });
  }
});

// 娑堣€楃Н鍒?
app.post('/api/credits/consume', express.json(), (req, res) => {
  try {
    const { visitorId, amount, featureId, description } = req.body;
    if (!visitorId || !amount) return res.status(400).json({ error: '缂哄皯鍙傛暟' });
    const result = DataService.consumeServerCredits(visitorId, Number(amount), featureId, description);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    console.error('[Credits] 鎵ｅ噺澶辫触:', error);
    res.status(500).json({ error: '鎵ｅ噺澶辫触' });
  }
});

// 澧炲姞绉垎
// /api/credits/add removed - use /api/admin/credits/add-to-user (protected) instead

// 閫€娆剧Н鍒?
app.post('/api/credits/refund', express.json(), (req, res) => {
  try {
    const { visitorId, amount, description } = req.body;
    if (!visitorId || !amount) return res.status(400).json({ error: '缂哄皯鍙傛暟' });
    const result = DataService.refundServerCredits(visitorId, Number(amount), description);
    res.json(result);
  } catch (error) {
    console.error('[Credits] 閫€娆惧け璐?', error);
    res.status(500).json({ error: 'Refund failed' });
  }
});

// 杩佺Щ鏈湴绉垎鍒版湇鍔＄
app.post('/api/credits/migrate', express.json(), (req, res) => {
  try {
    const { visitorId, localCredits } = req.body;
    if (!visitorId) return res.status(400).json({ error: '缂哄皯璁垮ID' });
    const result = DataService.migrateCredits(visitorId, localCredits);
    res.json(result);
  } catch (error) {
    console.error('[Credits] 杩佺Щ澶辫触:', error);
    res.status(500).json({ error: '杩佺Щ澶辫触' });
  }
});

// 馃巵 绀煎搧鐮佸厬鎹紙鍏戞崲鍚庡悓鏃跺啓鍏ユ湇鍔＄绉垎锛?
app.post('/api/credits/redeem', express.json(), (req, res) => {
  try {
    const { code, visitorId } = req.body;

    if (!code || !visitorId) {
      return res.status(400).json({ error: '缂哄皯绀煎搧鐮佹垨璁垮ID' });
    }

    const result = DataService.redeemGiftCode(code.trim().toUpperCase(), visitorId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // 鍚屾鍐欏叆鏈嶅姟绔Н鍒?
    DataService.addServerCredits(visitorId, result.credits, `redeem_${Date.now()}`, result.description);

    res.json({
      success: true,
      credits: result.credits,
      description: result.description
    });
  } catch (error) {
    console.error('[Credits] 鍏戞崲绀煎搧鐮佸け璐?', error);
    res.status(500).json({ error: '鍏戞崲澶辫触' });
  }
});

// 馃攽 LiblibAI绛惧悕API锛堝鐢ㄧ鐐癸紝鐢ㄤ簬澶栫綉璁块棶锛?
app.post('/api/sign-liblib', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { secret, message } = req.body;

    if (!secret || !message) {
      return res.status(400).json({ error: 'Missing secret or message' });
    }

    // 浣跨敤crypto璁＄畻HMAC-SHA1绛惧悕
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(message);
    const signature = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    console.log('馃攽 [绛惧悕API] 绛惧悕鎴愬姛');
    res.json({ signature });
  } catch (error) {
    console.error('馃攽 [绛惧悕API] 閿欒:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Zhenji Refactor API Routes ---
// 鈿狅笍 浠ヤ笅璺敱渚濊禆 src/backend/db 鍜?src/backend/executor
// 鈿狅笍 鏆傛椂娉ㄩ噴锛屼笉褰卞搷 Festival 鍔熻兘锛圡2銆丗Fmpeg绛夛級

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

// 闈欐€佹枃浠舵湇鍔?
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

// 鍋ュ悍妫€鏌ユ帴鍙?
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 妫€鏌?FFmpeg 鏄惁鍦ㄧ郴缁熻矾寰勪腑锛屾垨鎵弿甯歌瀹夎璺緞
const checkFfmpegInPath = (callback) => {
  // 甯歌鐨?FFmpeg 瀹夎璺緞锛圵indows锛?
  const commonPaths = [
    'ffmpeg', // 榛樿 PATH
    'E:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
    'D:\\ffmpeg\\bin\\ffmpeg.exe'
  ];

  // 閫愪釜灏濊瘯璺緞
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

// FFmpeg 鐘舵€佹鏌ユ帴鍙?- 纭繚杩斿洖 200 OK
app.get('/api/ffmpeg-check', (req, res) => {
  console.log('馃И [妫€娴嬩腑] 姝ｅ湪鍝嶅簲鍓嶇鐨?FFmpeg 鐘舵€佽姹?..');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'active',
    version: '2025-12-31-full_build',
    port: 3002
  });
});

// 涓夎建鍓ョ鎺ュ彛瀹炵幇
app.post('/api/audio/separate', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { videoBlob, readStartTime, readEndTime, singStartTime, singEndTime } = req.body;
    
    console.log('涓夎建鍓ョ璇锋眰:', { 
      readStartTime, 
      readEndTime, 
      singStartTime, 
      singEndTime 
    });
    
    // 杩欓噷鏄笁杞ㄥ墺绂荤殑瀹炵幇锛屼娇鐢?FFmpeg 杩涜闊抽澶勭悊
    // 瀹為檯椤圭洰涓紝杩欓噷浼氳皟鐢?FFmpeg 鍛戒护杩涜闊抽鍒嗙鍜屽垏鍓?
    
    // 妯℃嫙涓夎建鍓ョ杩囩▼
    setTimeout(() => {
      // 妯℃嫙鐢熸垚鐨勬枃浠惰矾寰?
      const bgmPath = `truth_bgm_${Date.now()}.wav`;
      const readVocalPath = `truth_read_${Date.now()}.wav`;
      const singVocalPath = `truth_sing_${Date.now()}.wav`;
      
      res.json({
        status: 'success',
        message: '涓夎建鍓ョ瀹屾垚',
        tracks: [
          { type: 'bgm', path: bgmPath, name: '鑳屾櫙闊充箰' },
          { type: 'read', path: readVocalPath, name: 'Read Vocal' },
          { type: 'sing', path: singVocalPath, name: 'Sing Vocal' }
        ],
        originalVideo: videoBlob
      });
      
      console.log('Triple-track split completed, generated 3 audio files');
    }, 5000); // 妯℃嫙 5 绉掔殑澶勭悊鏃堕棿
  } catch (error) {
    console.error('涓夎建鍓ョ澶辫触:', error.message);
    res.status(500).json({
      status: 'error',
      message: '涓夎建鍓ョ澶辫触',
      error: error.message
    });
  }
});

// 瀹炶 AI 涓夎建鍓ョ鎺ュ彛
app.post('/api/audio/process-triple-split', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { videoUrl, step1Start, step1End, step2Start, step2End } = req.body;
    
    console.log('AI 涓夎建鍓ョ璇锋眰:', { 
      videoUrl, 
      step1Start, 
      step1End, 
      step2Start, 
      step2End 
    });
    
    // 纭繚鏈夎棰戞暟鎹?
    if (!videoUrl) {
      return res.status(400).json({
        status: 'error',
        message: '缂哄皯瑙嗛 URL',
        error: '璇锋彁渚涜棰?URL'
      });
    }
    
    // 妯℃嫙 AI 涓夎建鍓ョ杩囩▼
    setTimeout(() => {
      // 鐢熸垚鐨勬枃浠惰矾寰?
      const bgmPath = `pure_bgm_${Date.now()}.mp3`;
      const readVocalPath = `read_part_${Date.now()}.mp3`;
      const singVocalPath = `sing_part_${Date.now()}.mp3`;
      
      // 妯℃嫙鏃堕暱璁＄畻
      const readDuration = step1End - step1Start;
      const singDuration = step2End - step2Start;
      
      // 鐢熸垚涓嬭浇閾炬帴
      const baseUrl = `http://localhost:3001/downloads`;
      
      res.json({
        status: 'success',
        message: 'AI 涓夎建鍓ョ瀹屾垚',
        tracks: [
          { 
            type: 'bgm', 
            path: bgmPath, 
            name: '绾?BGM',
            duration: 60, // 鍋囪 BGM 鎬绘椂闀?60 绉?
            icon: '馃幐',
            downloadUrl: `${baseUrl}/${bgmPath}`
          },
          { 
            type: 'read', 
            path: readVocalPath, 
            name: 'Read Vocal',
            duration: readDuration,
            icon: 'read',
            step: 1,
            downloadUrl: `${baseUrl}/${readVocalPath}`
          },
          { 
            type: 'sing', 
            path: singVocalPath, 
            name: 'Sing Vocal',
            duration: singDuration,
            icon: '馃帳',
            step: 2,
            downloadUrl: `${baseUrl}/${singVocalPath}`
          }
        ]
      });
      
      console.log('AI triple-track split completed, generated 3 audio files');
    }, 5000); // 妯℃嫙 5 绉掔殑澶勭悊鏃堕棿
  } catch (error) {
    console.error('AI 涓夎建鍓ョ澶辫触:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'AI 涓夎建鍓ョ澶辫触',
      error: error.message
    });
  }
});

// 瀹炶閫氱敤浜岃建鍓ョ鎺ュ彛 - 浣跨敤 fluent-ffmpeg 杩涜鍒嗙
// 鏀寔 FormData 涓婁紶瑙嗛鏂囦欢鍜屽姩鎬佹椂闂寸墖娈靛垏鍓?
app.post('/api/audio/split-traditional', (req, res, next) => {
  console.log('[split-traditional] Request received');
  console.log('[split-traditional] Route matched');
  console.log('[split-traditional] Content-Type:', req.headers['content-type']);
  // 鎵嬪姩璋冪敤 multer 
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error('[split-traditional] Multer failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[split-traditional] Multer success, file path:', req.file ? req.file.path : 'none');
    
    let tempFiles = [];
    try {
      // 寮哄埗鎺у埗鍙伴珮浜棩蹇?
      console.error('!!!!!!!!!!!!!!!!!! split command received, start processing !!!!!!!!!!!!!!!!!!');
    
    // 鐢熶骇绾跨洃鎺э細鎺ユ敹鍒拌姹?
    console.log('>>> Received request, preparing to parse FormData...');
    
    // 寮鸿閿佸畾鏂囦欢婧愶細蹇呴』鎺ユ敹鍒版枃浠舵祦
    if (!req.file) {
      throw new Error('Backend did not receive any video file stream');
    }
    
    // 鐢熶骇绾跨洃鎺э細Multer 鏂囦欢淇濆瓨鎴愬姛
    console.log(`>>> Multer upload success, file size: ${req.file.size} bytes`);
    console.log(`>>> Multer saved path: ${req.file.path}`);
    
    // 2. 淇 322 琛岀殑宕╂簝锛氬脊鎬?statSync 璋冪敤
    const absolutePath = path.resolve(req.file.path);
    if (!fs.existsSync(absolutePath)) {
      console.error('Fatal error: file does not physically exist at path:', absolutePath);
      return res.status(500).json({ error: 'File was not created on disk' });
    }
    const stats = fs.statSync(absolutePath);
    console.log(`>>> 鏂囦欢鐗╃悊澶у皬: ${stats.size} 瀛楄妭`);
    
    // 璁＄畻鏂囦欢澶у皬锛圞B锛?
    const fileSizeKB = Math.round(req.file.size / 1024);
    
    // 鎵撳嵃閫氱敤鐨勭粓绔俊鎭?
    console.log(`>>> 鎺ユ敹鍒拌棰戞枃浠讹紝澶у皬涓?${fileSizeKB} KB锛屽紑濮嬫墽琛?FFmpeg 鎷嗗垎`);
    
    // 鐢熸垚杈撳嚭鏂囦欢鍚?- 閫氱敤鍛藉悕锛屼娇鐢ㄧ粷瀵硅矾寰?
    const pureBgmPath = path.resolve(absoluteTempDir, 'pure_bgm.mp3');
    const pureVocalPath = path.resolve(absoluteTempDir, 'pure_vocal.mp3');
    const tempVocalPath = path.resolve(absoluteTempDir, `temp_vocal_${Date.now()}.mp3`);
    
    // 3. 纭繚涓婁紶鐨勬枃浠惰矾寰勬槸缁濆璺緞
    const absoluteSourcePath = absolutePath; // 浣跨敤涓婇潰宸茬粡瑙ｆ瀽濂界殑缁濆璺緞
    
    // 娣诲姞鍒颁复鏃舵枃浠跺垪琛紝浠ヤ究鍚庣画娓呯悊
    tempFiles.push(absoluteSourcePath, pureBgmPath, pureVocalPath, tempVocalPath);
    
    // 鐗╃悊鏂囦欢纭锛氬湪鎵ц FFmpeg 涔嬪墠锛屾墦鍗板綍鍒舵枃浠剁殑鐗╃悊璺緞
    console.log(`>>> 鍑嗗鎵ц FFmpeg锛屽綍鍒舵枃浠剁墿鐞嗚矾寰? ${absoluteSourcePath}`);
    console.log(`>>> 鏂囦欢澶у皬: ${fs.statSync(absoluteSourcePath).size} 瀛楄妭`);
    console.log(`>>> 纭鏂囦欢鐪熷疄瀛樺湪: ${fs.existsSync(absoluteSourcePath)}`);
    
    // 澧炲姞甯︽椂闂存埑鐨勬棩蹇?
    console.log(`--- Prepare output files, current time: ${new Date().toLocaleString()} ---`);
    
    // 鐢熶骇绾跨洃鎺э細鍑嗗鍚姩 FFmpeg
    console.log('>>> 姝ｅ湪鍚姩 FFmpeg锛屽紑濮嬫彁鍙?BGM...');
    
    // 绗竴姝ワ細鎻愬彇 BGM锛堜娇鐢ㄧ墿鐞嗛櫡娉㈡护闀滐級
    // 浣跨敤 equalizer 婊ら暅锛屽 1000Hz 涓績棰戠巼杩涜 -25dB 鍘嬪埗
    // 绉婚櫎 -ac 2锛屼繚鎸佸崟澹伴亾澶勭悊锛屽噺灏戦€昏緫鍐茬獊
    // 寮哄埗浣跨敤 libmp3lame 閲嶆柊缂栫爜锛岀‘淇濇瘡涓€甯ф暟鎹噸鏂拌绠?
    const bgmCommand = `ffmpeg -i "${absoluteSourcePath}" -y -vn -af "equalizer=f=1000:width_type=h:width=2000:g=-25,volume=1.5" -c:a libmp3lame -aq 4 "${pureBgmPath}"`;
    
    // 绗簩姝ワ細鎻愬彇浜哄０锛堜娇鐢ㄧ爾澧欏甫閫氭护闀滐級
    // 浣跨敤 bandpass 婊ら暅锛屽彧鍏佽 1650Hz 涓績棰戠巼闄勮繎 3000Hz 甯﹀閫氳繃
    // 绉婚櫎 -ac 2锛屼繚鎸佸崟澹伴亾澶勭悊锛屽噺灏戦€昏緫鍐茬獊
    // 寮哄埗浣跨敤 libmp3lame 閲嶆柊缂栫爜锛岀‘淇濇瘡涓€甯ф暟鎹噸鏂拌绠?
    const vocalCommand = `ffmpeg -i "${absoluteSourcePath}" -y -vn -af "bandpass=f=1650:width_type=h:width=3000,volume=2.0" -c:a libmp3lame -aq 4 "${pureVocalPath}"`;
    
    // 楠岃瘉寮哄寲锛氭墦鍗颁袱涓畬鍏ㄤ笉鍚岀殑鍛戒护瀛楃涓?
    console.log('馃幀 [BGM 鎻愬彇鎸囦护]:', bgmCommand);
    console.log('馃幀 [浜哄０鎻愬彇鎸囦护]:', vocalCommand);
    
    // 鎵ц BGM 鎻愬彇
    await new Promise((resolve, reject) => {
      exec(bgmCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('>>> FFmpeg 澶勭悊澶辫触: BGM 鎻愬彇澶辫触');
          console.error('>>> FFmpeg 閿欒淇℃伅:', error.message);
          console.error('>>> FFmpeg 鏍囧噯杈撳嚭:', stdout);
          console.error('>>> FFmpeg 閿欒杈撳嚭:', stderr);
          
          const ffmpegError = new Error(`BGM 鎻愬彇澶辫触: ${error.message}`);
          ffmpegError.ffmpegError = {
            message: error.message,
            stdout: stdout,
            stderr: stderr,
            command: bgmCommand
          };
          reject(ffmpegError);
          return;
        }
        
        console.log('>>> FFmpeg 澶勭悊瀹屾垚: BGM 鎻愬彇鎴愬姛');
        console.log('>>> FFmpeg 鏍囧噯杈撳嚭:', stdout);
        console.log('>>> FFmpeg 閿欒杈撳嚭:', stderr);
        resolve(null);
      });
    });
    
    // 鐢熶骇绾跨洃鎺э細鍑嗗鍚姩 FFmpeg 鎻愬彇浜哄０
    console.log('>>> 姝ｅ湪鍚姩 FFmpeg锛屽紑濮嬫彁鍙栦汉澹?..');
    
    await new Promise((resolve, reject) => {
      exec(vocalCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('>>> FFmpeg 澶勭悊澶辫触: 浜哄０鎻愬彇澶辫触');
          console.error('>>> FFmpeg 閿欒淇℃伅:', error.message);
          console.error('>>> FFmpeg 鏍囧噯杈撳嚭:', stdout);
          console.error('>>> FFmpeg 閿欒杈撳嚭:', stderr);
          
          const ffmpegError = new Error(`浜哄０鎻愬彇澶辫触: ${error.message}`);
          ffmpegError.ffmpegError = {
            message: error.message,
            stdout: stdout,
            stderr: stderr,
            command: vocalCommand
          };
          reject(ffmpegError);
          return;
        }
        
        console.log('>>> FFmpeg 澶勭悊瀹屾垚: 瀹屾暣浜哄０鎻愬彇鎴愬姛');
        console.log('>>> FFmpeg 鏍囧噯杈撳嚭:', stdout);
        console.log('>>> FFmpeg 閿欒杈撳嚭:', stderr);
        resolve(null);
      });
    });
    
    // 绗笁姝ワ細澶勭悊鍔ㄦ€佹椂闂寸墖娈靛垏鍓?
    const segments = [];
    // 杩斿洖鐩稿璺緞锛岃鍓嶇鑷鎷兼帴瀹屾暣 URL
    const basePath = '/temp_processing';
    
    // 妫€鏌ユ槸鍚︽湁姝ラ鏃堕棿鐗囨
    if (req.body.segments) {
      let segmentsData;
      try {
        segmentsData = JSON.parse(req.body.segments);
        console.log(`>>> Parsed ${segmentsData.length} time segments`);
      } catch (e) {
        console.error('>>> Failed to parse segments, using default:', e.message);
        segmentsData = [];
      }
      
      // 澶勭悊姣忎釜鏃堕棿鐗囨
      for (let i = 0; i < segmentsData.length; i++) {
        const segment = segmentsData[i];
        const startTime = sanitizeSegmentBoundary(segment.startTime);
        const endTime = sanitizeSegmentBoundary(segment.endTime);
        
        if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
          console.warn(`>>> 璺宠繃闈炴硶鐗囨 ${i}: startTime=${segment.startTime}, endTime=${segment.endTime}`);
          continue;
        }

        if (startTime > 0 && endTime > startTime) {
          // 鐢熸垚鐗囨鏂囦欢鍚嶏紝浣跨敤鏍囧噯鍖栬矾寰?
          const segmentVocalPath = path.join(absoluteTempDir, `segment_vocal_${i}.mp3`);
          tempFiles.push(segmentVocalPath);
          
          // 鐢熶骇绾跨洃鎺э細鍑嗗鍒囧壊鐗囨
          console.log(`>>> 姝ｅ湪鍚姩 FFmpeg锛屽紑濮嬪垏鍓茬墖娈?${i}...`);
          
          // 鍒囧壊鐗囨
          const segmentCommand = `ffmpeg -i "${pureVocalPath}" -y -ss ${startTime} -t ${endTime - startTime} -vn -af "volume=1.8" "${segmentVocalPath}"`;
          
          console.log(`>>> 鎵ц鐗囨 ${i} 鍒囧壊鍛戒护: ${segmentCommand}`);
          
          await new Promise((resolve, reject) => {
            exec(segmentCommand, (error, stdout, stderr) => {
              if (error) {
                console.error(`>>> FFmpeg 澶勭悊澶辫触: 鐗囨 ${i} 鍒囧壊澶辫触`);
                console.error(`>>> FFmpeg 閿欒淇℃伅:`, error.message);
                console.error(`>>> FFmpeg 鏍囧噯杈撳嚭:`, stdout);
                console.error(`>>> FFmpeg 閿欒杈撳嚭:`, stderr);
                
                const ffmpegError = new Error(`鐗囨 ${i} 鍒囧壊澶辫触: ${error.message}`);
                ffmpegError.ffmpegError = {
                  message: error.message,
                  stdout: stdout,
                  stderr: stderr,
                  command: segmentCommand
                };
                reject(ffmpegError);
                return;
              }
              
              console.log(`>>> FFmpeg 澶勭悊瀹屾垚: 鐗囨 ${i} 鍒囧壊鎴愬姛`);
              console.log(`>>> FFmpeg 鏍囧噯杈撳嚭:`, stdout);
              console.log(`>>> FFmpeg 閿欒杈撳嚭:`, stderr);
              resolve(null);
            });
          });
          
          // 娣诲姞鍒拌繑鍥炲垪琛?
            segments.push({
              segmentIndex: i,
              path: `segment_vocal_${i}.mp3`,
              downloadUrl: `${basePath}/segment_vocal_${i}.mp3`
            });
        }
      }
    }
    
    console.log('>>> 鏂囦欢澶勭悊瀹屾垚锛屾鍦ㄨ繑鍥炵粨鏋?..');
    
    // 绂佺敤闈欓粯鎴愬姛锛氶獙璇佺墿鐞嗘枃浠舵槸鍚︾敓鎴?
    console.log('>>> 寮€濮嬮獙璇佺墿鐞嗘枃浠舵槸鍚︾敓鎴?..');
    
    // 绛夊緟纾佺洏鏂囦欢鍐欏畬锛堢畝鍗曠殑寤惰繜锛岀‘淇濇枃浠跺啓鍏ュ畬鎴愶級
    console.log('>>> 绛夊緟纾佺洏鏂囦欢鍐欏叆瀹屾垚...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 楠岃瘉 BGM 鏂囦欢锛屽娆″皾璇曠洿鍒版枃浠跺瓨鍦ㄦ垨瓒呮椂
    let bgmExists = false;
    let vocalExists = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && (!bgmExists || !vocalExists)) {
      attempts++;
      console.log(`>>> 绗?${attempts} 娆￠獙璇佹枃浠?..`);
      
      bgmExists = fs.existsSync(pureBgmPath);
      vocalExists = fs.existsSync(pureVocalPath);
      
      if (!bgmExists) {
        console.log(`>>> BGM 鏂囦欢灏氭湭鐢熸垚: ${pureBgmPath}`);
      }
      
      if (!vocalExists) {
        console.log(`>>> 浜哄０鏂囦欢灏氭湭鐢熸垚: ${pureVocalPath}`);
      }
      
      if (!bgmExists || !vocalExists) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 鏈€缁堥獙璇?
    if (!bgmExists) {
      throw new Error(`BGM 鏂囦欢鐢熸垚澶辫触锛岃矾寰勪笉瀛樺湪: ${pureBgmPath}`);
    }
    
    if (!vocalExists) {
      throw new Error(`浜哄０鏂囦欢鐢熸垚澶辫触锛岃矾寰勪笉瀛樺湪: ${pureVocalPath}`);
    }
    
    // 楠岃瘉鏂囦欢澶у皬锛岀‘淇濇枃浠朵笉鏄┖鐨?
    const bgmSize = fs.statSync(pureBgmPath).size;
    const vocalSize = fs.statSync(pureVocalPath).size;
    
    // 鐗╃悊鏂囦欢澶у皬瀹¤
    console.log('馃搳 BGM澶у皬:', bgmSize, ' | 浜哄０澶у皬:', vocalSize);
    
    // 妫€鏌ヤ袱涓枃浠跺ぇ灏忔槸鍚﹀畬鍏ㄧ浉鍚?
    if (bgmSize === vocalSize) {
      console.warn('鈿狅笍 [璀﹀憡] 鐗╃悊杩囨护鏈敓鏁堬紝璇锋鏌ヨ緭鍏ユ簮缂栫爜');
    }
    
    if (bgmSize === 0) {
      throw new Error(`BGM 鏂囦欢鐢熸垚澶辫触锛屾枃浠朵负绌? ${pureBgmPath}`);
    }
    
    if (vocalSize === 0) {
      throw new Error(`浜哄０鏂囦欢鐢熸垚澶辫触锛屾枃浠朵负绌? ${pureVocalPath}`);
    }
    
    console.log('>>> 鐗╃悊鏂囦欢楠岃瘉閫氳繃锛屽噯澶囪繑鍥炵粨鏋?..');
    
    // 杩斿洖鎴愬姛鍝嶅簲 - 閫氱敤鏍煎紡
    res.json({
      status: 'success',
      message: '闊抽浜岃建鍓ョ瀹屾垚',
      tracks: [
        {
          type: 'bgm',
          path: 'pure_bgm.mp3',
          name: '绾?BGM',
          duration: 60, // 瀹為檯椤圭洰涓彲浠ヤ粠 FFmpeg 杈撳嚭涓彁鍙?
          icon: '馃幐',
          downloadUrl: `${basePath}/pure_bgm.mp3`
        },
        {
          type: 'vocal',
          path: 'pure_vocal.mp3',
          name: '鍏ㄩ噺浜哄０',
          duration: 60, // 瀹為檯椤圭洰涓彲浠ヤ粠 FFmpeg 杈撳嚭涓彁鍙?
          icon: 'vocal',
          downloadUrl: `${basePath}/pure_vocal.mp3`
        }
      ],
      segments: segments // 鍔ㄦ€佺敓鎴愮殑鐗囨鍒楄〃
    });
    
    console.log('>>> 鎷嗗垎瀹屾垚锛岃繑鍥炵粨鏋滅粰鍓嶇');
    
    // 寮哄埗鍏抽棴鑷姩娓呯悊锛氭敞閲婃帀鎵€鏈?fs.unlink 浠ｇ爜
    // try {
    //   if (fs.existsSync(tempVocalPath)) {
    //     fs.unlinkSync(tempVocalPath);
    //     console.log(`>>> 宸叉竻鐞嗕复鏃舵枃浠? ${tempVocalPath}`);
    //   }
    // } catch (err) {
    //   console.error(`>>> 娓呯悊涓存椂鏂囦欢澶辫触: ${tempVocalPath}`, err.message);
    // }
    
    } catch (error) {
      console.error('>>> 闊抽鍓ョ澶辫触:', error.message);
      console.error('>>> 閿欒鍫嗘爤:', error.stack);
      
      // 寮哄埗鍏抽棴鑷姩娓呯悊锛氭敞閲婃帀鎵€鏈?fs.unlink 浠ｇ爜
      // tempFiles.forEach(file => {
      //   try {
      //     if (fs.existsSync(file)) {
      //       fs.unlinkSync(file);
      //       console.log(`>>> 宸叉竻鐞嗕复鏃舵枃浠? ${file}`);
      //     }
      //   } catch (err) {
      //     console.error(`>>> 娓呯悊鏂囦欢澶辫触: ${file}`, err.message);
      //   }
      // });
      
      // 杩斿洖 JSON 鏍煎紡鐨勯敊璇俊鎭紝鍖呭惈璇︾粏鐨?FFmpeg 鎶ラ敊
      const responseBody = {
        error: error.message,
        status: 'error',
        message: '闊抽鍓ョ澶辫触',
        // 濡傛灉鏄疐Fmpeg閿欒锛屼繚鐣欏師濮嬮敊璇俊鎭?
        ffmpegError: error.ffmpegError || undefined
      };

      if (!IS_PRODUCTION) {
        responseBody.stack = error.stack;
      }

      res.status(500).json(responseBody);
    }
  });
});

// 杈呭姪鍑芥暟锛氫笅杞芥枃浠跺埌鏈湴
function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || '';
  return `${protocol}://${host}`;
}

function isPrivateIp(ip) {
  const value = String(ip || '').trim().toLowerCase();
  if (!value) return true;
  if (value === '0.0.0.0') return true;
  if (value === '::1') return true;
  if (value.startsWith('fe80:')) return true;
  if (value.startsWith('fc') || value.startsWith('fd')) return true;

  const parts = value.split('.').map((x) => Number(x));
  if (parts.length === 4 && parts.every((x) => Number.isInteger(x) && x >= 0 && x <= 255)) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 192 && b === 0) return true;
  }
  return false;
}

function isBlockedDownloadHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '127.0.0.1' || host === '::1') return true;
  if (host === '0.0.0.0') return true;
  if (host === '169.254.169.254') return true;
  if (net.isIP(host) && isPrivateIp(host)) return true;
  return false;
}

function getMaxDownloadBytes(destPath) {
  const ext = String(path.extname(destPath || '')).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 25 * 1024 * 1024;
  if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) return 80 * 1024 * 1024;
  if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) return 350 * 1024 * 1024;
  return 200 * 1024 * 1024;
}

function downloadFile(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      reject(new Error('下载链接无效'));
      return;
    }

    if (isBlockedDownloadHostname(parsedUrl.hostname)) {
      reject(new Error('下载链接被拒绝'));
      return;
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const request = protocol.get(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || undefined,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*'
        }
      },
      (response) => {
        const statusCode = response.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(statusCode) && response.headers.location) {
          if (redirectCount >= 5) {
            reject(new Error('下载重定向次数过多'));
            return;
          }
          const redirectedUrl = new URL(response.headers.location, parsedUrl).toString();
          response.resume();
          downloadFile(redirectedUrl, destPath, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (statusCode !== 200) {
          response.resume();
          reject(new Error(`下载失败: HTTP ${statusCode}`));
          return;
        }

        const maxBytes = getMaxDownloadBytes(destPath);
        const contentLengthRaw = response.headers['content-length'];
        const contentLength = typeof contentLengthRaw === 'string' ? Number(contentLengthRaw) : Array.isArray(contentLengthRaw) ? Number(contentLengthRaw[0]) : NaN;
        if (Number.isFinite(contentLength) && contentLength > maxBytes) {
          response.resume();
          reject(new Error('下载文件过大'));
          return;
        }

        const file = fs.createWriteStream(destPath);
        let downloadedBytes = 0;
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (downloadedBytes > maxBytes) {
            request.destroy(new Error('下载文件过大'));
            try {
              response.destroy();
            } catch {}
          }
        });
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(destPath);
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );

    request.setTimeout(90000, () => {
      request.destroy(new Error('下载超时'));
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function getMediaDurationMs(mediaPath, fallbackMs = 5000) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(mediaPath, (err, metadata) => {
      if (err) {
        console.warn(`鈿狅笍 [鏃堕暱鎺㈡祴] 澶辫触锛屼娇鐢ㄩ粯璁ゆ椂闀?${fallbackMs}ms:`, err.message);
        resolve(fallbackMs);
        return;
      }

      const durationSec = metadata?.format?.duration;
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        console.warn(`鈿狅笍 [鏃堕暱鎺㈡祴] 鏃犳湁鏁堟椂闀匡紝浣跨敤榛樿鏃堕暱 ${fallbackMs}ms`);
        resolve(fallbackMs);
        return;
      }

      resolve(Math.max(1000, Math.floor(durationSec * 1000)));
    });
  });
}

// 闃块噷浜慉SR API - 鑾峰彇闊抽鏂囧瓧鍙婃椂闂磋酱
async function getAudioTranscription(audioUrl) {
  return new Promise((resolve, reject) => {
    const DASHSCOPE_API_KEY = readDashscopeApiKey();

    if (!DASHSCOPE_API_KEY) {
      console.error('[ASR] Dashscope API key not configured');
      return reject(new Error('ASR API key not configured'));
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
        enable_words: true // 鍚敤璇嶇骇鏃堕棿鎴?
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
          console.log('鉁?[ASR] 杞綍鎴愬姛');
          console.log('馃攳 [ASR] 鍝嶅簲鏁版嵁:', JSON.stringify(response, null, 2));
          console.log('馃攳 [ASR] sentences鏁伴噺:', response.output?.sentences?.length || 0);
          resolve(response);
        } catch (error) {
          console.error('鉂?[ASR] 鍝嶅簲瑙ｆ瀽澶辫触:', data);
          reject(new Error('ASR鍝嶅簲瑙ｆ瀽澶辫触'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('鉂?[ASR] 璇锋眰澶辫触:', error);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// 鏅鸿兘瀛楀箷鐢熸垚锛氭寜瀛楁暟鏉冮噸鍒嗛厤鏃堕棿锛岄伩鍏嶆椂闂磋酱鍫嗗彔
function generateSimpleSRT(text, audioDurationMs, outputPath) {
  try {
    console.log("[SRT] text:", text.substring(0, 60), "duration:", audioDurationMs);

    // Split by ALL Chinese/English punctuation including commas
    const splitPattern = /([。！？；，.!?;,])/;
    const segments = text.split(splitPattern).filter(s => s.trim());

    // Merge text with trailing punctuation
    const rawSentences = [];
    for (let i = 0; i < segments.length; i += 2) {
      const content = segments[i] + (segments[i + 1] || "");
      if (content.trim()) rawSentences.push(content.trim());
    }

    // Merge short fragments (max 15 chars per segment)
    const MAX_CHARS = 15;
    const sentences = [];
    let buf = "";
    for (const seg of rawSentences) {
      if (buf.length + seg.length <= MAX_CHARS) {
        buf += seg;
      } else {
        if (buf) sentences.push(buf);
        buf = seg;
      }
    }
    if (buf) sentences.push(buf);

    // Fallback: force split by char count if still 1 long segment
    if (sentences.length <= 1 && text.length > MAX_CHARS) {
      sentences.length = 0;
      for (let i = 0; i < text.length; i += MAX_CHARS) {
        sentences.push(text.substring(i, Math.min(i + MAX_CHARS, text.length)));
      }
    }

    console.log("[SRT] segments:", sentences.length);

    if (sentences.length === 0) {
      console.warn('鈿狅笍 [SRT绠€鍗曟ā寮廬 鏂囨湰涓虹┖');
      fs.writeFileSync(outputPath, '', 'utf8');
      return outputPath;
    }

    const sentenceCharCounts = sentences.map((sentence) => {
      const normalized = sentence.replace(/[\s\uff0c\u3002\uff01\uff1f\uff1b,.!?;:\uff1a?"\u201c\u201d\u2018\u2019\uff08\uff09()\u3010\u3011\[\]]/g, '');
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

    // 浣跨敤 UTF-8 with BOM 缂栫爜锛岀‘淇滷Fmpeg姝ｇ‘璇嗗埆涓枃
    fs.writeFileSync(outputPath, srtContent, 'utf8');
    console.log('鉁?[SRT鏅鸿兘妯″紡] 瀛楀箷宸茬敓鎴?', outputPath);
    console.log('鉁?[SRT绠€鍗曟ā寮廬 瀛楀箷鍐呭棰勮:\n', srtContent.substring(0, 200));
    return outputPath;
  } catch (error) {
    console.error('鉂?[SRT鏅鸿兘妯″紡] 澶辫触:', error);
    throw error;
  }
}

function parseSrtTimestampToMs(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = Number(match[3]);
  const ms = Number(match[4]);
  if (![h, m, s, ms].every(Number.isFinite)) return NaN;
  return (((h * 60 + m) * 60) + s) * 1000 + ms;
}

function validateSrtFile(srtPath, durationMs) {
  if (!srtPath || !fs.existsSync(srtPath)) return { ok: false, reason: 'srt_missing' };
  let content = '';
  try {
    content = fs.readFileSync(srtPath, 'utf8');
  } catch {
    return { ok: false, reason: 'srt_read_failed' };
  }

  const lines = content.split(/\r?\n/);
  let lastEnd = 0;
  let cueCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || '').trim();
    if (!line) continue;
    if (!/^\d+$/.test(line)) continue;

    const timeLine = String(lines[i + 1] || '').trim();
    const timeMatch = timeLine.match(/^(.+?)\s*-->\s*(.+?)$/);
    if (!timeMatch) return { ok: false, reason: 'srt_time_format' };

    const start = parseSrtTimestampToMs(timeMatch[1]);
    const end = parseSrtTimestampToMs(timeMatch[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return { ok: false, reason: 'srt_time_parse' };
    if (start < 0 || end <= start) return { ok: false, reason: 'srt_time_order' };
    if (start < lastEnd) return { ok: false, reason: 'srt_overlap' };
    if (Number.isFinite(durationMs) && durationMs > 0 && end > durationMs + 1500) return { ok: false, reason: 'srt_duration_overflow' };

    lastEnd = end;
    cueCount += 1;
    i += 1;
  }

  if (cueCount < 2) return { ok: false, reason: 'srt_not_segmented' };
  return { ok: true, reason: '' };
}

// 鐢熸垚SRT瀛楀箷鏂囦欢锛圓SR妯″紡锛?
function generateSRTFile(transcription, outputPath) {
  try {
    // 浠嶢SR鍝嶅簲涓彁鍙栧彞瀛愬拰鏃堕棿鎴?
    const sentences = transcription.output?.sentences || [];

    if (sentences.length === 0) {
      console.warn('[SRT] No transcription sentences found, generating empty subtitle file');
      fs.writeFileSync(outputPath, '', 'utf8');
      return outputPath;
    }

    let srtContent = '';

    sentences.forEach((sentence, index) => {
      const startTime = sentence.begin_time || 0;
      const endTime = sentence.end_time || (startTime + 2000);
      const text = sentence.text || '';

      // 杞崲鏃堕棿鎴筹紙姣 -> SRT鏍煎紡 HH:MM:SS,mmm锛?
      const formatTime = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
      };

      // SRT鏍煎紡锛氬簭鍙穃n鏃堕棿鑼冨洿\n鏂囨湰\n绌鸿
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${text}\n\n`;
    });

    fs.writeFileSync(outputPath, srtContent, 'utf8');
    console.log(`鉁?[SRT] 瀛楀箷鏂囦欢宸茬敓鎴? ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('鉂?[SRT] 鐢熸垚澶辫触:', error);
    throw error;
  }
}

// 瑙嗛鍚堟垚鎺ュ彛 - FFmpeg 楂樿川閲忓瓧骞曠儳褰曪紙浼樺寲鐗堬細鍏堜笅杞藉啀澶勭悊锛?
app.post('/api/video/compose', express.json({ limit: '50mb' }), async (req, res) => {
  let tempInputPath = null;  // 涓存椂杈撳叆鏂囦欢璺緞

  try {
    const {
      inputUrl,        // 杈撳叆鏂囦欢URL锛堝浘鐗囨垨瑙嗛锛?
      type,            // 'image' 鎴?'video'
      subtitle,        // 瀛楀箷鏂囨湰
      duration = 5,    // 鍥剧墖杞棰戞椂鐨勬寔缁椂闂达紙绉掞級
      outputFormat = 'mp4' // 杈撳嚭鏍煎紡
    } = req.body;

    console.log('馃幀 [瑙嗛鍚堟垚] 鏀跺埌璇锋眰:', { inputUrl, type, subtitle, duration, outputFormat });

    if (!inputUrl || !type) {
      return res.status(400).json({
        status: 'error',
        message: '缂哄皯蹇呰鍙傛暟锛歩nputUrl 鍜?type'
      });
    }

    // 鐢熸垚鍞竴鐨勮緭鍑烘枃浠跺悕
    const timestamp = Date.now();
    const outputFileName = `composed_${timestamp}.${outputFormat}`;
    const outputPath = path.join(downloadDir, outputFileName);

    // 馃殌 浼樺寲锛氬厛涓嬭浇杈撳叆鏂囦欢鍒版湰鍦颁复鏃剁洰褰?
    const inputExt = path.extname(inputUrl) || (type === 'image' ? '.png' : '.mp4');
    tempInputPath = path.join(tempDirPath, `temp_input_${timestamp}${inputExt}`);

    console.log('馃摜 [瑙嗛鍚堟垚] 涓嬭浇杈撳叆鏂囦欢:', inputUrl);
    console.log('馃搧 [瑙嗛鍚堟垚] 涓存椂鏂囦欢:', tempInputPath);

    await downloadFile(inputUrl, tempInputPath);
    console.log('鉁?[瑙嗛鍚堟垚] 涓嬭浇瀹屾垚锛屾枃浠跺ぇ灏?', fs.statSync(tempInputPath).size);

    console.log('馃搧 [瑙嗛鍚堟垚] 杈撳嚭璺緞:', outputPath);

    // 妫€鏌?FFmpeg 鍙敤鎬?
    checkFfmpegInPath((found, ffmpegPath) => {
      if (!found) {
        console.error('[video-merge] FFmpeg not found');
        return res.status(500).json({
          status: 'error',
          message: 'FFmpeg is not installed or not in PATH'
        });
      }

      console.log('鉁?[瑙嗛鍚堟垚] 浣跨敤 FFmpeg:', ffmpegPath);
      ffmpeg.setFfmpegPath(ffmpegPath);

      // 馃殌 浣跨敤鏈湴涓存椂鏂囦欢鑰屼笉鏄綉缁淯RL
      let command = ffmpeg(tempInputPath);

      // 鏍规嵁绫诲瀷澶勭悊
      if (type === 'image') {
        // 鍥剧墖杞棰戯細寰幆鏄剧ず鎸囧畾鏃堕暱
        command = command
          .inputOptions([
            `-loop 1`,           // 寰幆鍥剧墖
            `-t ${duration}`     // 鎸佺画鏃堕棿
          ])
          .outputOptions([
            '-c:v libx264',      // 浣跨敤 H.264 缂栫爜
            '-pix_fmt yuv420p',  // 鍏煎鎬у儚绱犳牸寮?
            '-preset ultrafast', // 馃殌 瓒呭揩閫熺紪鐮侊紙娴嬭瘯鐢級
            '-crf 28'            // 绋嶄綆璐ㄩ噺浣嗘洿蹇紙18-28锛屽€艰秺澶ц秺蹇級
          ]);
      } else if (type === 'video') {
        // 瑙嗛澶勭悊锛氫繚鎸佸師鏈夌紪鐮?
        command = command
          .outputOptions([
            '-c:v libx264',      // 閲嶆柊缂栫爜浠ョ儳褰曞瓧骞?
            '-c:a copy',         // 闊抽娴佸鍒讹紙濡傛灉鏈夛級
            '-preset ultrafast', // 馃殌 瓒呭揩閫熺紪鐮?
            '-crf 28'
          ]);
      }

      // 娣诲姞瀛楀箷婊ら暅锛堝鏋滄彁渚涳級
      if (subtitle && subtitle.trim()) {
        // 杞箟瀛楀箷鏂囨湰涓殑鐗规畩瀛楃
        const escapedSubtitle = subtitle
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:')
          .replace(/,/g, '\\,');

        // 楂樿川閲忓瓧骞曟牱寮?- 浼樺寲鐗堟湰
        const subtitleFilter = `drawtext=` +
          `text='${escapedSubtitle}':` +
          (process.platform === 'linux' ? '' : `fontfile='C\:/Windows/Fonts/msyh.ttc':`) +
          `fontsize=80:` +         // 瀛楀彿80锛堝師48锛屾姌涓柟妗堬級
          `fontcolor=white:` +
          `borderw=4:` +           // 鎻忚竟瀹藉害4锛堝師3锛?
          `bordercolor=black:` +   // 鎻忚竟棰滆壊
          `shadowcolor=black@0.7:` + // 闃村奖
          `shadowx=2:` +           // 闃村奖X鍋忕Щ
          `shadowy=2:` +           // 闃村奖Y鍋忕Щ
          `box=1:` +               // 娣诲姞鑳屾櫙妗?
          `boxcolor=black@0.5:` +  // 鍗婇€忔槑榛戣壊鑳屾櫙
          `boxborderw=12:` +       // 鑳屾櫙妗嗗唴杈硅窛
          `x=(w-text_w)/2:` +      // 姘村钩灞呬腑
          `y=h-th-120:` +          // 璺濈搴曢儴120px锛堝師50px锛屾洿闈犱笂锛?
          `enable='between(t,0.5,${type === 'image' ? duration - 0.5 : 'duration-0.5'})'`; // 娣″叆娣″嚭鏃堕棿

        command = command.videoFilters(subtitleFilter);
        console.log('馃摑 [瑙嗛鍚堟垚] 娣诲姞瀛楀箷婊ら暅');
      }

      // 璁剧疆杈撳嚭璺緞
      command = command.output(outputPath);

      // 鐩戝惉杩涘害
      command.on('start', (commandLine) => {
        console.log('馃幀 [FFmpeg] 鍛戒护:', commandLine);
      });

      command.on('progress', (progress) => {
        console.log(`馃搳 [FFmpeg] 杩涘害: ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
      });

      command.on('end', () => {
        console.log('鉁?[瑙嗛鍚堟垚] 瀹屾垚:', outputFileName);

        // 馃Ч 娓呯悊涓存椂鏂囦欢
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlink(tempInputPath, (err) => {
            if (err) console.error('鈿狅笍 鍒犻櫎涓存椂鏂囦欢澶辫触:', err);
            else console.log('Temporary file deleted');
          });
        }

        // 杩斿洖涓嬭浇閾炬帴锛堜娇鐢ㄨ姹傛潵婧愭瀯寤篣RL锛屽吋瀹圭Щ鍔ㄧ灞€鍩熺綉璁块棶锛?
        const reqOrigin = getRequestOrigin(req);
        const downloadUrl = `${reqOrigin}/downloads/${outputFileName}`;
        res.json({
          status: 'success',
          message: '瑙嗛鍚堟垚瀹屾垚',
          outputPath: outputPath,
          downloadUrl: downloadUrl,
          fileName: outputFileName
        });
      });

      command.on('error', (err, stdout, stderr) => {
        console.error('鉂?[FFmpeg] 閿欒:', err.message);
        console.error('鉂?[FFmpeg] stderr:', stderr);

        // 馃Ч 娓呯悊涓存椂鏂囦欢
        if (tempInputPath && fs.existsSync(tempInputPath)) {
          fs.unlink(tempInputPath, (err) => {
            if (err) console.error('鈿狅笍 鍒犻櫎涓存椂鏂囦欢澶辫触:', err);
          });
        }

        res.status(500).json({
          status: 'error',
          message: 'FFmpeg 澶勭悊澶辫触',
          error: err.message,
          details: stderr
        });
      });

      // 鎵ц鍛戒护
      command.run();
    });

  } catch (error) {
    console.error('鉂?[瑙嗛鍚堟垚] 寮傚父:', error.message);

    // 馃Ч 娓呯悊涓存椂鏂囦欢
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      fs.unlink(tempInputPath, (err) => {
        if (err) console.error('鈿狅笍 鍒犻櫎涓存椂鏂囦欢澶辫触:', err);
      });
    }

    res.status(500).json({
      status: 'error',
      message: '瑙嗛鍚堟垚澶辫触',
      error: error.message
    });
  }
});

// 瑙嗛鍚庡鐞嗘帴鍙?- 瀛楀箷鐑у綍 + 瑁呴グ鍏冪礌鍙犲姞锛堟槬鑺傛嫓骞翠笓鐢級
app.post(['/api/video/post-process', '/api/video/burn-subtitle'], express.json({ limit: '50mb' }), async (req, res) => {
  let tempVideoPath = null;
  let tempAudioPath = null;
  let tempSrtPath = null;
  const tempDecorationPaths = [];

  try {
    const {
      videoUrl,        // WAN鐢熸垚鐨勫師濮嬭棰慤RL
      audioUrl,        // 闊抽URL锛堢敤浜嶢SR鐢熸垚瀹炴椂瀛楀箷锛?
      subtitle,        // 闈欐€佸瓧骞曟枃鏈紙澶囩敤锛?
      decorations = [], // 瑁呴グ鍏冪礌鏁扮粍 [{url, position, size}]
      enableRealtimeSubtitle = true // 鏄惁鍚敤瀹炴椂瀛楀箷
    } = req.body;
    const isBurnSubtitleRoute = String(req.path || '').endsWith('/api/video/burn-subtitle') || String(req.path || '').endsWith('/video/burn-subtitle');
    const useRealtimeSubtitle = isBurnSubtitleRoute || enableRealtimeSubtitle === true;
    const subtitleDebugEnabled = String(process.env.SUBTITLE_DEBUG || '').trim() === '1';

    const cleanupTempFiles = () => {
      try {
        if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      } catch {}
      try {
        if (tempAudioPath && fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
      } catch {}
      try {
        if (tempSrtPath && fs.existsSync(tempSrtPath)) fs.unlinkSync(tempSrtPath);
      } catch {}
      try {
        tempDecorationPaths.forEach(dec => {
          if (dec?.tempPath && fs.existsSync(dec.tempPath)) fs.unlinkSync(dec.tempPath);
        });
      } catch {}
    };

    const respondDegradedNoSubtitle = (reason) => {
      cleanupTempFiles();
      return res.json({
        status: 'success',
        message: '字幕已降级为无字幕',
        subtitleApplied: false,
        degraded: true,
        reason: String(reason || ''),
        downloadUrl: videoUrl,
        fileName: ''
      });
    };

    if (subtitleDebugEnabled) {
      const diagLog = `[${new Date().toISOString()}] path=${req.path} isBurnSubtitle=${isBurnSubtitleRoute} useRealtime=${useRealtimeSubtitle} audioUrl=${!!audioUrl} subtitle=${!!(subtitle && subtitle.trim())} enableRealtimeSubtitle=${enableRealtimeSubtitle}\n`;
      fs.appendFileSync(path.join(__dirname, 'subtitle_debug.log'), diagLog);
    }

    console.log('馃帹 [瑙嗛鍚庡鐞哴 鏀跺埌璇锋眰:', {
      videoUrl,
      audioUrl,
      subtitle,
      decorationCount: decorations.length,
      enableRealtimeSubtitle: useRealtimeSubtitle,
      subtitleMode: useRealtimeSubtitle ? 'realtime-srt' : 'static-drawtext'
    });

    if (!videoUrl) {
      return res.status(400).json({
        status: 'error',
        message: '缂哄皯蹇呰鍙傛暟锛歷ideoUrl'
      });
    }

    // 鐢熸垚鍞竴鐨勮緭鍑烘枃浠跺悕
    const timestamp = Date.now();
    const outputFileName = `processed_${timestamp}.mp4`;
    const outputPath = path.join(downloadDir, outputFileName);

    // 涓嬭浇鍘熷瑙嗛鍒颁复鏃剁洰褰?
    tempVideoPath = path.join(tempDirPath, `temp_video_${timestamp}.mp4`);
    console.log('馃摜 [瑙嗛鍚庡鐞哴 涓嬭浇鍘熷瑙嗛:', videoUrl);
    await downloadFile(videoUrl, tempVideoPath);
    console.log('鉁?[瑙嗛鍚庡鐞哴 涓嬭浇瀹屾垚');

    // 涓嬭浇瑁呴グ鍏冪礌鍥剧墖
    for (let i = 0; i < decorations.length; i++) {
      const decoration = decorations[i];
      if (decoration.url) {
        const tempPath = path.join(tempDirPath, `temp_decoration_${timestamp}_${i}.png`);
        await downloadFile(decoration.url, tempPath);
        tempDecorationPaths.push({ ...decoration, tempPath });
        console.log(`馃摜 [瑙嗛鍚庡鐞哴 涓嬭浇瑁呴グ鍏冪礌 ${i + 1}`);
      }
    }

    // 鍏堝皾璇曚笅杞介煶棰戯紝鐢ㄤ簬淇濈暀鏈€缁堥煶杞?
    if (audioUrl && useRealtimeSubtitle) {
      try {
        tempAudioPath = path.join(tempDirPath, `temp_audio_${timestamp}.mp3`);
        await downloadFile(audioUrl, tempAudioPath);
        console.log('鉁?[瑙嗛鍚庡鐞哴 闊抽涓嬭浇瀹屾垚');
      } catch (err) {
        tempAudioPath = null;
        console.warn('[video-post] audio download failed, will try to keep original video audio');
      }
    }

    // 鍏堟鏌?FFmpeg 鍙敤鎬у苟璁剧疆璺緞锛堝繀椤诲湪 ffprobe 涔嬪墠锛?
    const ffmpegReady = await new Promise((resolve) => {
      checkFfmpegInPath((found, fp) => resolve({ found, path: fp }));
    });

    if (!ffmpegReady.found) {
      console.error('[video-post] FFmpeg not found');
      return res.status(500).json({
        status: 'error',
        message: 'FFmpeg is not installed or not in PATH'
      });
    }

    console.log('鉁?[瑙嗛鍚庡鐞哴 浣跨敤 FFmpeg:', ffmpegReady.path);
    ffmpeg.setFfmpegPath(ffmpegReady.path);

    let subtitleDurationMs = 0;

    // 鐢熸垚鏅鸿兘瀛楀箷锛堟寜瀛楁暟鏉冮噸鍒嗛厤鏃堕棿杞达級
    if (useRealtimeSubtitle && subtitle && subtitle.trim()) {
      try {
        const durationSourcePath = tempAudioPath || tempVideoPath;
        console.log('[subtitle] duration source:', durationSourcePath, 'exists:', fs.existsSync(durationSourcePath));
        const durationMs = await getMediaDurationMs(durationSourcePath, 5000);
        subtitleDurationMs = durationMs;
        console.log('✅ [时长探测] 媒体时长:', durationMs, 'ms, 来源:', durationSourcePath === tempAudioPath ? 'audio' : 'video');
        if (subtitleDebugEnabled) {
          fs.appendFileSync(path.join(__dirname, 'subtitle_debug.log'), `[DURATION] source=${durationSourcePath === tempAudioPath ? 'audio' : 'video'} durationMs=${durationMs}\n`);
        }
        tempSrtPath = path.join(tempDirPath, `temp_subtitle_${timestamp}.srt`);
        generateSimpleSRT(subtitle.trim(), durationMs, tempSrtPath);
        console.log('[subtitle] subtitle file generated');
        if (subtitleDebugEnabled) {
          const size = fs.existsSync(tempSrtPath) ? fs.statSync(tempSrtPath).size : 0;
          fs.appendFileSync(path.join(__dirname, 'subtitle_debug.log'), `[SRT-GENERATED] tempSrtPath=${tempSrtPath} size=${size}\n`);
        }
        if (isBurnSubtitleRoute) {
          const validation = validateSrtFile(tempSrtPath, durationMs);
          if (!validation.ok) {
            return respondDegradedNoSubtitle(validation.reason);
          }
        }
      } catch (error) {
        console.warn('[subtitle] generate subtitle failed, fallback to static subtitle:', error.message);
        if (subtitleDebugEnabled) {
          fs.appendFileSync(require('path').join(__dirname, 'subtitle_debug.log'), `[SRT-FAILED] error=${error.message}\n`);
        }
        if (isBurnSubtitleRoute) {
          return respondDegradedNoSubtitle('srt_generate_failed');
        }
      }
    }

    {

      let command = ffmpeg(tempVideoPath);
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        command = command.input(tempAudioPath);
      }

      // 鏋勫缓澶嶆潅婊ら暅閾?
      const filters = [];
      let currentInput = '[0:v]';

      // 1. 娣诲姞瑁呴グ鍏冪礌鍙犲姞锛堜娇鐢╫verlay婊ら暅锛?
      if (tempDecorationPaths.length > 0) {
        const decorationInputStartIndex = tempAudioPath ? 2 : 1;
        tempDecorationPaths.forEach((decoration, index) => {
          command = command.input(decoration.tempPath);

          // 璁＄畻浣嶇疆
          let overlayPosition = 'x=10:y=10'; // 榛樿宸︿笂瑙?
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

      // 2. 娣诲姞瀛楀箷婊ら暅锛堝疄鏃跺瓧骞?or 闈欐€佸瓧骞曪級
      if (subtitleDebugEnabled) {
        fs.appendFileSync(require('path').join(__dirname, 'subtitle_debug.log'), `[FILTER-CHOICE] tempSrtPath=${tempSrtPath} exists=${tempSrtPath ? fs.existsSync(tempSrtPath) : false}\n`);
      }
      if (tempSrtPath && fs.existsSync(tempSrtPath)) {
        // 浣跨敤瀹炴椂瀛楀箷锛圫RT鏂囦欢锛?
        // Windows璺緞杞崲锛欳:\temp\sub.srt 鈫?C:/temp/sub.srt 鈫?C\\:/temp/sub.srt
        const escapedSrtPath = tempSrtPath
          .replace(/\\/g, '/') // 鍙嶆枩鏉犺浆姝ｆ枩鏉?
          .replace(/:/g, '\\:'); // 鍐掑彿杞箟

        console.log('馃幀 [瀛楀箷] 鍘熷SRT璺緞:', tempSrtPath);
        console.log('馃幀 [瀛楀箷] 杞箟鍚庤矾寰?', escapedSrtPath);

        const srtFontName = process.platform === 'linux' ? 'Noto Sans CJK SC' : 'Microsoft YaHei';
        const subtitleFilter = `${currentInput}subtitles='${escapedSrtPath}':charenc=UTF-8:` +
          `force_style='FontName=${srtFontName},FontSize=22,` +
          `PrimaryColour=&H00FFFFFF&,OutlineColour=&H00000000&,BorderStyle=1,` +
          `Outline=2,Shadow=1,ShadowColour=&H80000000&,MarginV=35,Alignment=2,Bold=1,WrapStyle=2'[output]`;

        filters.push(subtitleFilter);
        currentInput = '[output]';
        console.log('馃幀 [瀛楀箷] 浣跨敤瀹炴椂瀛楀箷锛圫RT锛夛紝婊ら暅:', subtitleFilter.substring(0, 150) + '...');
      } else if (!isBurnSubtitleRoute && subtitle && subtitle.trim()) {
        // fallback: 浣跨敤闈欐€佸瓧骞曪紙drawtext锛? 淇瀛楀彿鍜屼綅缃?
        const escapedSubtitle = subtitle
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:')
          .replace(/,/g, '\\,');

        const subtitleFilter = `${currentInput}drawtext=` +
          `text='${escapedSubtitle}':` +
          (process.platform === 'linux' ? '' : `fontfile='C\\:/Windows/Fonts/msyh.ttc':`) +
          `fontsize=60:` + // 淇锛?0 -> 60
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
        console.log('[subtitle] using static subtitle fallback');
      }

      // 搴旂敤婊ら暅閾?
      if (filters.length > 0) {
        command = command.complexFilter(filters.join(';'));
      }

      // 璁剧疆杈撳嚭閫夐」
      command = command
        .outputOptions([
          '-map', currentInput === '[0:v]' ? '0:v' : currentInput,
          '-map', tempAudioPath ? '1:a:0' : '0:a?',
          '-c:v libx264',
          '-c:a aac',
          '-b:a 128k',
          '-ar', '44100',
          '-ac', '2',
          '-preset ultrafast',
          '-crf 23',
          '-movflags +faststart'
        ])
        .output(outputPath);

      // 鐩戝惉杩涘害
      command.on('start', (commandLine) => {
        console.log('馃幀 [FFmpeg] 鍛戒护:', commandLine);
      });

      command.on('progress', (progress) => {
        console.log(`馃搳 [FFmpeg] 杩涘害: ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
      });

      command.on('end', () => {
        console.log('鉁?[瑙嗛鍚庡鐞哴 瀹屾垚:', outputFileName);

        const subtitleApplied = Boolean(tempSrtPath && fs.existsSync(tempSrtPath));
        cleanupTempFiles();

        // 浣跨敤璇锋眰鏉ユ簮鏋勫缓URL锛屽吋瀹圭Щ鍔ㄧ灞€鍩熺綉璁块棶
        const reqOrigin = getRequestOrigin(req);
        const downloadUrl = `${reqOrigin}/downloads/${outputFileName}`;
        res.json({
          status: 'success',
          message: '瀛楀箷鐑у綍瀹屾垚',
          downloadUrl: downloadUrl,
          fileName: outputFileName,
          subtitleApplied,
          degraded: false
        });
      });

      command.on('error', (err, stdout, stderr) => {
        console.error('鉂?[FFmpeg] 閿欒:', err.message);
        console.error('鉂?[FFmpeg] stderr:', stderr);

        cleanupTempFiles();

        if (isBurnSubtitleRoute) {
          return respondDegradedNoSubtitle('ffmpeg_subtitles_failed');
        }

        res.status(500).json({
          status: 'error',
          message: 'FFmpeg 澶勭悊澶辫触',
          error: err.message
        });
      });

      command.run();
    }

  } catch (error) {
    console.error('鉂?[瑙嗛鍚庡鐞哴 寮傚父:', error.message);

    // 娓呯悊涓存椂鏂囦欢
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

    const isBurnSubtitleRoute = String(req.path || '').endsWith('/api/video/burn-subtitle') || String(req.path || '').endsWith('/video/burn-subtitle');
    if (isBurnSubtitleRoute) {
      return res.json({
        status: 'success',
        message: '字幕已降级为无字幕',
        subtitleApplied: false,
        degraded: true,
        reason: 'unexpected_error',
        downloadUrl: String(req.body?.videoUrl || ''),
        fileName: ''
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Video post-processing failed',
      error: error.message
    });
  }
});

// ========== 鍙伒AI瑙嗛鐢熸垚 API ==========

/**
 * 鍙伒AI - 鍥剧敓瑙嗛鎺ュ彛
 * POST /api/kling/video-generation
 *
 * 璇锋眰浣?
 * {
 *   "image_url": "鍥剧墖URL",
 *   "prompt": "瑙嗛鎻忚堪(鍙€?",
 *   "duration": 5 鎴?10,
 *   "mode": "std" 鎴?"pro",
 *   "audio_url": "闊抽URL(鍙€?鐢ㄤ簬闊崇敾鍚屾)"
 * }
 */
app.post('/api/kling/video-generation', express.json(), async (req, res) => {
  try {
    const { image_url, prompt = '', duration = 5, mode = 'std', audio_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        status: 'error',
        message: '缂哄皯蹇呴渶鍙傛暟: image_url'
      });
    }

    const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return res.status(500).json({
        status: 'error',
        message: '鏈嶅姟鍣ㄦ湭閰嶇疆鍙伒API瀵嗛挜'
      });
    }

    const jwtToken = generateKlingJWT();
    console.log('[鍙伒API] 鍒涘缓瑙嗛鐢熸垚浠诲姟:', { image_url, prompt, duration, mode });

    // 鏋勫缓璇锋眰浣擄紙涓ユ牸鎸夌収瀹樻柟鏂囨。锛?
    const requestBody = {
      model_name: 'kling-v2-6', // 鍗囩骇鍒皏2.6浠ユ敮鎸乿oice_list鍙傛暟
      image: image_url,           // 瀹樻柟瀛楁鍚嶆槸 image锛屼笉鏄?image_url
      prompt: prompt,
      duration: String(duration), // 瀹樻柟瑕佹眰瀛楃涓叉牸寮?
      mode: mode
    };

    // 娉ㄦ剰锛氬畼鏂瑰浘鐢熻棰慉PI涓嶆敮鎸乤udio_url鍙傛暟锛?
    // 闊崇敾鍚屾闇€瑕佷娇鐢╲oice_list鍙傛暟锛堜粎V2.6鍙婂悗缁増鏈敮鎸侊級

    // 璋冪敤鍙伒API
    const klingResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestBody);

      const options = {
        hostname: 'api-beijing.klingai.com',  // 瀹樻柟鍩熷悕
        path: '/v1/videos/image2video',        // 瀹樻柟绔偣锛堟敞鎰忔槸videos澶嶆暟锛?
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,  // 浣跨敤鐢熸垚鐨凧WT token
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
            reject(new Error(`瑙ｆ瀽鍝嶅簲澶辫触: ${data}`));
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.write(postData);
      apiReq.end();
    });

    console.log('[鍙伒API] 浠诲姟鍒涘缓鍝嶅簲:', klingResponse);

    // 鎸夌収瀹樻柟鏂囨。瑙ｆ瀽鍝嶅簲
    if (klingResponse.code !== 0) {
      return res.status(500).json({
        status: 'error',
        message: klingResponse.message || '鍙伒API璋冪敤澶辫触',
        details: klingResponse
      });
    }

    if (!klingResponse.data || !klingResponse.data.task_id) {
      return res.status(500).json({
        status: 'error',
        message: '鍙伒API鍝嶅簲鏍煎紡寮傚父',
        details: klingResponse
      });
    }

    const taskId = klingResponse.data.task_id;

    // 寮€濮嬭疆璇换鍔＄姸鎬侊紙鏈€澶氱瓑寰?鍒嗛挓锛?
    const maxAttempts = 60; // 60娆?脳 5绉?= 5鍒嗛挓
    const pollInterval = 5000; // 5绉?
    let attempts = 0;

    const pollTask = async () => {
      attempts++;
      console.log(`[鍙伒API] 鏌ヨ浠诲姟鐘舵€?(${attempts}/${maxAttempts}):`, taskId);

      const statusResponse = await new Promise((resolve, reject) => {
          const queryToken = generateKlingJWT();

        const options = {
          hostname: 'api-beijing.klingai.com',       // 瀹樻柟鍩熷悕
          path: `/v1/videos/image2video/${taskId}`,  // 瀹樻柟绔偣
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${queryToken}`   // 浣跨敤JWT token
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let data = '';
          apiRes.on('data', (chunk) => { data += chunk; });
          apiRes.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`瑙ｆ瀽鍝嶅簲澶辫触: ${data}`));
            }
          });
        });

        apiReq.on('error', reject);
        apiReq.end();
      });

      // 鎸夌収瀹樻柟鏂囨。瑙ｆ瀽鍝嶅簲
      if (statusResponse.code !== 0) {
        throw new Error(`鏌ヨ浠诲姟澶辫触: ${statusResponse.message}`);
      }

      const taskData = statusResponse.data;
      const status = taskData.task_status;  // submitted/processing/succeed/failed
      console.log(`[鍙伒API] 浠诲姟鐘舵€? ${status}`);

      if (status === 'succeed') {
        // 浠诲姟鎴愬姛
        const videoUrl = taskData.task_result?.videos?.[0]?.url;

        if (!videoUrl) {
          throw new Error('浠诲姟瀹屾垚浣嗘湭鎵惧埌瑙嗛URL');
        }

        console.log('[鍙伒API] 鉁?瑙嗛鐢熸垚鎴愬姛:', videoUrl);
        return res.json({
          status: 'success',
          videoUrl: videoUrl,
          taskId: taskId
        });
      } else if (status === 'failed') {
        // 浠诲姟澶辫触
        throw new Error(`瑙嗛鐢熸垚澶辫触: ${taskData.task_status_msg || '鏈煡閿欒'}`);
      } else if (attempts >= maxAttempts) {
        // 瓒呮椂
        throw new Error('Video generation timed out (10 minutes)');
      } else {
        // 缁х画杞锛坰ubmitted 鎴?processing 鐘舵€侊級
        setTimeout(pollTask, pollInterval);
      }
    };

    // 鍚姩杞
    setTimeout(pollTask, pollInterval);

  } catch (error) {
    console.error('鉂?[鍙伒API] 寮傚父:', error.message);
    res.status(500).json({
      status: 'error',
      message: '鍙伒瑙嗛鐢熸垚澶辫触',
      error: error.message
    });
  }
});

// ========== 鍙伒瑙嗛鐗规晥 API ==========
app.post('/api/kling/video-effects', klingRateLimiter, express.json(), async (req, res) => {
  try {
    const { effect_scene, image_url } = req.body;

    if (!effect_scene || !image_url) {
      return res.status(400).json({
        status: 'error',
        message: '缂哄皯蹇呴渶鍙傛暟: effect_scene, image_url'
      });
    }

    const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return res.status(500).json({
        status: 'error',
        message: '鏈嶅姟鍣ㄦ湭閰嶇疆鍙伒API瀵嗛挜'
      });
    }

    const jwtToken = generateKlingJWT();
    console.log('[鍙伒鐗规晥API] 鍒涘缓瑙嗛鐗规晥浠诲姟:', { effect_scene, image_url });

    // 鏋勫缓璇锋眰浣?
    const requestBody = {
      effect_scene: effect_scene,
      input: {
        image: image_url
      }
    };

    // 璋冪敤鍙伒鐗规晥API
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
            reject(new Error(`瑙ｆ瀽鍝嶅簲澶辫触: ${data}`));
          }
        });
      });

      apiReq.on('error', reject);
      apiReq.write(postData);
      apiReq.end();
    });

    console.log('[鍙伒鐗规晥API] 浠诲姟鍒涘缓鍝嶅簲:', klingResponse);

    if (klingResponse.code !== 0) {
      return res.status(500).json({
        status: 'error',
        message: klingResponse.message || '鍙伒鐗规晥API璋冪敤澶辫触',
        details: klingResponse
      });
    }

    if (!klingResponse.data || !klingResponse.data.task_id) {
      return res.status(500).json({
        status: 'error',
        message: '鍙伒鐗规晥API鍝嶅簲鏍煎紡寮傚父',
        details: klingResponse
      });
    }

    const taskId = klingResponse.data.task_id;

    // 杞浠诲姟鐘舵€?
    const maxAttempts = 60;
    const pollInterval = 5000;
    let attempts = 0;

    const pollTask = async () => {
      attempts++;
      console.log(`[鍙伒鐗规晥API] 鏌ヨ浠诲姟鐘舵€?(${attempts}/${maxAttempts}):`, taskId);

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
            timeout: 10000 // 10绉掕秴鏃?
          };

          const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error(`瑙ｆ瀽鍝嶅簲澶辫触: ${data}`));
              }
            });
          });

          apiReq.on('error', (err) => {
            console.warn(`鈿狅笍 [鍙伒鐗规晥API] 缃戠粶閿欒 (${attempts}/${maxAttempts}):`, err.message);
            reject(err);
          });

          apiReq.on('timeout', () => {
            apiReq.destroy();
            reject(new Error('璇锋眰瓒呮椂'));
          });

          apiReq.end();
        });
      } catch (networkError) {
        // 缃戠粶閿欒锛岄噸璇?
        console.warn(`鈿狅笍 [鍙伒鐗规晥API] 缃戠粶閿欒锛屽皢鍦?绉掑悗閲嶈瘯:`, networkError.message);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
          return;
        } else {
          return res.status(500).json({
            status: 'error',
            message: '缃戠粶杩炴帴澶辫触锛岃妫€鏌ョ綉缁滃悗閲嶈瘯',
            error: networkError.message
          });
        }
      }

      console.log('[鍙伒鐗规晥API] 浠诲姟鐘舵€佸搷搴?', {
        code: statusResponse.code,
        message: statusResponse.message,
        hasData: !!statusResponse.data,
        taskStatus: statusResponse.data?.task_status
      });

        if (statusResponse.code !== 0) {
          // 绛惧悕閿欒锛坈ode === 1000锛夊簲璇ョ珛鍗冲け璐ワ紝涓嶉噸璇?
          if (statusResponse.code === 1000 && statusResponse.message.includes('signature')) {
            console.error(`鉂?[鍙伒鐗规晥API] 绛惧悕閿欒锛屾棤娉曠户缁噸璇?`, statusResponse.message);
            return res.status(500).json({
              status: 'error',
              message: 'API signature verification failed',
              errorCode: statusResponse.code,
              details: statusResponse.message
            });
          }
          
          console.warn(`鈿狅笍 [鍙伒鐗规晥API] 鏌ヨ澶辫触锛屽皢鍦?绉掑悗閲嶈瘯 (${attempts}/${maxAttempts}):`, statusResponse.message);
          
          // 鍏朵粬閿欒缁х画閲嶈瘯
          if (attempts < maxAttempts) {
            setTimeout(pollTask, pollInterval);
            return;
          } else {
            return res.status(500).json({
              status: 'error',
              message: 'Failed to query task status',
              details: statusResponse
            });
          }
        }

      const taskStatus = statusResponse.data?.task_status;
      
      // 澶勭悊undefined鐘舵€?- 甯歌浜庡垰鍒涘缓鐨勪换鍔?
      if (taskStatus === undefined) {
        console.log(`馃攧 [鍙伒鐗规晥API] 浠诲姟鐘舵€佷负undefined锛屽皢鍦?绉掑悗閲嶈瘯 (${attempts}/${maxAttempts})`);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
          return;
        } else {
          return res.status(500).json({
            status: 'error',
            message: 'Failed to get task status, please retry later'
          });
        }
      }

      console.log(`[鍙伒鐗规晥API] 褰撳墠浠诲姟鐘舵€? ${taskStatus}`);

      if (taskStatus === 'succeed') {
        const videoUrl = statusResponse.data?.task_result?.videos?.[0]?.url;
        if (!videoUrl) {
          console.error('鉂?[鍙伒鐗规晥API] 浠诲姟鎴愬姛浣嗘湭鎵惧埌瑙嗛URL');
          return res.status(500).json({
            status: 'error',
            message: '鏈幏鍙栧埌瑙嗛URL'
          });
        }

        console.log('[鍙伒鐗规晥API] 鉁?瑙嗛鐢熸垚鎴愬姛:', videoUrl);
        return res.json({
          status: 'success',
          videoUrl: videoUrl
        });
      } else if (taskStatus === 'failed') {
        console.error('鉂?[鍙伒鐗规晥API] 浠诲姟澶辫触:', statusResponse.data?.task_status_msg);
        return res.status(500).json({
          status: 'error',
          message: '鍙伒鐗规晥瑙嗛鐢熸垚澶辫触',
          details: statusResponse.data
        });
      } else if (taskStatus === 'submitted' || taskStatus === 'processing') {
        // 姝ｅ父鐘舵€侊紝缁х画杞
        if (attempts >= maxAttempts) {
          console.log('鈴?[鍙伒鐗规晥API] 杞瓒呮椂锛屼换鍔′粛鍦ㄥ鐞嗕腑');
          return res.status(500).json({
            status: 'error',
            message: '浠诲姟澶勭悊瓒呮椂锛岃绋嶅悗鏌ヨ缁撴灉',
            taskId: taskId
          });
        }
        setTimeout(pollTask, pollInterval);
      } else {
        // 鏈煡鐘舵€侊紝璁板綍骞剁户缁疆璇?
        console.warn(`鈿狅笍 [鍙伒鐗规晥API] 鏈煡浠诲姟鐘舵€? ${taskStatus}锛屽皢鍦?绉掑悗閲嶈瘯`);
        if (attempts < maxAttempts) {
          setTimeout(pollTask, pollInterval);
        } else {
          return res.status(500).json({
            status: 'error',
            message: '浠诲姟澶勭悊寮傚父',
            taskStatus: taskStatus
          });
        }
      }
    };

    setTimeout(pollTask, pollInterval);

  } catch (error) {
    console.error('鉂?[鍙伒鐗规晥API] 寮傚父:', error.message);
    res.status(500).json({
      status: 'error',
      message: '鍙伒鐗规晥瑙嗛鐢熸垚澶辫触',
      error: error.message
    });
  }
});

// ========== 鑵捐浜慍OS涓婁紶 API ==========

/**
 * 鍥剧墖/闊抽涓婁紶鍒拌吘璁簯COS
 * POST /api/upload-cos
 *
 * 鏇夸唬Vite涓棿浠讹紝鐩存帴鍦ㄥ悗绔鐞嗭紝閬垮厤鍝嶅簲閲嶅闂
 */
function sanitizeCosPublicUrl(url) {
  let value = String(url || '').trim().replace(/[\r\n\t]/g, '');
  const firstProto = value.search(/https?:\/\//i);
  if (firstProto === -1) return '';
  if (firstProto > 0) value = value.slice(firstProto);

  // Hard cut on duplicated protocol prefix first.
  const protoMatches = [...value.matchAll(/https?:\/\//gi)];
  if (protoMatches.length > 1) {
    const cutAt = protoMatches[1].index ?? -1;
    if (cutAt > 0) value = value.slice(0, cutAt);
  }

  const mediaUrlMatch = value.match(/https?:\/\/[^\s"'<>]+?\.(jpg|jpeg|png|webp|mp3|wav|m4a|ogg|mp4)(\?[^\s"'<>]*)?/i);
  if (mediaUrlMatch && mediaUrlMatch[0]) return mediaUrlMatch[0];

  return value;
}

app.post('/api/upload-cos', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { image, type, format } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // 鑾峰彇鑵捐浜戦厤缃?
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '鏈嶅姟鍣ㄦ湭閰嶇疆鑵捐浜慍OS瀵嗛挜' });
    }

    // 鍒濆鍖朇OS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // Base64杞珺uffer锛堟敮鎸佸浘鐗囧拰闊抽锛?
    let base64Data;
    let fileExtension;

    if (type === 'audio') {
      // 闊抽鏂囦欢澶勭悊
      base64Data = image.replace(/^data:audio\/\w+;base64,/, '');
      fileExtension = format || 'mp3';
    } else {
      // 鍥剧墖鏂囦欢澶勭悊锛堥粯璁わ級
      base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      fileExtension = 'jpg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `festival/user/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`;

    console.log('[COS Backend] 涓婁紶鏂囦欢:', fileName, '绫诲瀷:', type || 'image', '澶у皬:', buffer.length);

    // 涓婁紶鍒癈OS
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
          console.error('[COS Backend] 鉂?涓婁紶澶辫触:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 馃敡 銆愪慨澶峌RL閲嶅闂 - 澶氶噸楠岃瘉銆戝弬鑰冿細docs/CONTEXT_HANDOFF.md

        // 绗?灞傦細鎵嬪姩鏋勫缓骞插噣URL锛堜笉浣跨敤COS杩斿洖鐨凩ocation锛?
        let cleanUrl = sanitizeCosPublicUrl(`https://${bucket}.cos.${region}.myqcloud.com/${fileName}`);

        // 绗?灞傦細妫€娴嬪苟淇URL涓殑閲嶅https://
        const httpsCount = (cleanUrl.match(/https:\/\//g) || []).length;
        if (httpsCount > 1) {
          console.warn('[COS Backend] 鈿狅笍 妫€娴嬪埌URL閲嶅锛屾鍦ㄤ慨澶?..');
          const parts = cleanUrl.split('https://').filter(p => p);
          cleanUrl = 'https://' + parts[parts.length - 1]; // 鍙栨渶鍚庝竴娈?
        }

        // 绗?灞傦細JSON搴忓垪鍖栧悗浜屾楠岃瘉
        const responseData = { url: sanitizeCosPublicUrl(cleanUrl) };
        const jsonString = JSON.stringify(responseData);
        const jsonHttpsCount = (jsonString.match(/https:\/\//g) || []).length;

        if (jsonHttpsCount > 1) {
          console.error('[COS Backend] 鉂?JSON搴忓垪鍖栧悗浠嶆湁閲嶅URL:', jsonString);
          // 寮哄埗淇
          const urlMatch = jsonString.match(/"url":"(https:\/\/[^"]+)"/);
          if (urlMatch) {
            const fixedUrl = urlMatch[1].split('https://').filter(p => p);
            responseData.url = 'https://' + fixedUrl[fixedUrl.length - 1];
          }
        }

        if (!responseData.url) {
          return res.status(500).json({ error: 'Failed to build COS URL' });
        }

        console.log('[COS Backend] 鉁?涓婁紶鎴愬姛:', responseData.url);
        console.log('[COS Backend] 馃攳 URL闀垮害:', responseData.url.length);

        // 绗?灞傦細娣诲姞寮洪槻缂撳瓨鍝嶅簲澶达紙闃叉浠ｇ悊灞傞噸澶嶏級
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // 绗?灞傦細妫€鏌ュ搷搴旀槸鍚﹀凡鍙戦€侊紙闃叉閲嶅鍙戦€侊級
        if (res.writableEnded) {
          console.warn('[COS Backend] response already sent, skip duplicate send');
          return;
        }

        return res.json(responseData);
      }
    );

  } catch (error) {
    console.error('[COS Backend] 鉂?寮傚父:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 浠嶤OS鍔ㄦ€佽幏鍙朚2妯℃澘鍒楄〃
 * GET /api/m2-templates?gender=male&category=modern
 *
 * 鍔熻兘锛氫粠COS bucket璇诲彇鍥剧墖锛屽苟鏍规嵁category绛涢€?
 * 鏀寔鍒嗙被锛歮odern, qipao, hanfu, tangzhuang, caishen, traditional
 */
app.get('/api/m2-templates', async (req, res) => {
  try {
    const { gender, category } = req.query;

    if (!gender || !['male', 'female', 'child', 'couple'].includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender parameter (male/female/child/couple required)' });
    }

    // 鑾峰彇COS閰嶇疆
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '鏈嶅姟鍣ㄦ湭閰嶇疆鑵捐浜慍OS瀵嗛挜' });
    }

    // 鍒濆鍖朇OS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // 鍒楀嚭鎸囧畾鐩綍涓嬬殑鎵€鏈夋枃浠?
    const prefix = `festival-templates/m2/${gender}/`;

    // 璇诲彇鏁版嵁搴撹幏鍙栧垎绫讳俊鎭?
    const databasePath = path.join(__dirname, 'template-analysis', 'asset-database.json');
    let assetDatabase = {};
    try {
      if (fs.existsSync(databasePath)) {
        assetDatabase = JSON.parse(fs.readFileSync(databasePath, 'utf-8')).assets || {};
      }
    } catch (e) {
      console.warn('[M2 Templates API] failed to read local database, category merge disabled');
    }

    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix
      },
      (err, data) => {
        if (err) {
          console.error('[M2 Templates API] 鉂?鑾峰彇澶辫触:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 杩囨护鍑哄浘鐗囨枃浠跺苟娣诲姞鍒嗙被淇℃伅
        let templates = data.Contents
          .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file.Key))
          .map(file => {
            const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com/${file.Key}`;

            // 馃敟 浣跨敤鑵捐浜戞暟鎹竾璞″疄鏃跺鐞嗭紙URL鍙傛暟鏂瑰紡锛?
            // imageMogr2: 鍥剧墖澶勭悊鍛戒护
            // thumbnail/800x: 缂╂斁鍒板搴?00px
            // strip: 鍘婚櫎EXIF鍏冧俊鎭?
            // format/webp: 杞崲涓篧ebP鏍煎紡
            // quality/85: 璐ㄩ噺85
            const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;

            const fileName = file.Key.split('/').pop();
            const id = fileName.split('.')[0]; // 浣跨敤鏂囦欢鍚嶏紙涓嶅惈鎵╁睍鍚嶏級浣滀负ID

            // 浠庢暟鎹簱鑾峰彇鍒嗙被淇℃伅
            const assetInfo = assetDatabase[id] || {};
            const assetCategory = assetInfo.category || 'modern';

            return {
              id: id,
              name: fileName,
              imagePath: compressedUrl,  // 馃敟 杩斿洖鍘嬬缉鍚庣殑URL
              originalImagePath: baseUrl,  // 淇濈暀鍘熷浘URL锛堝闇€楂樻竻棰勮锛?
              gender: gender,
              category: assetCategory,
              size: file.Size,
              lastModified: file.LastModified
            };
          });

        // 鏍规嵁category绛涢€?
        if (category && category !== 'all') {
          if (category === 'traditional') {
            // 浼犵粺瑁呭寘鎷細hanfu, tangzhuang, caishen
            templates = templates.filter(t =>
              ['hanfu', 'tangzhuang', 'caishen'].includes(t.category)
            );
          } else {
            // 鍏朵粬鍒嗙被鐩存帴鍖归厤
            templates = templates.filter(t => t.category === category);
          }
        }

        console.log(`[M2 Templates API] 鉁?杩斿洖 ${templates.length} 涓?{gender}妯℃澘 (鍒嗙被: ${category || 'all'})`);
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
    console.error('[M2 Templates API] 鉂?寮傚父:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== 馃敟 M3 鎯呬荆妯℃澘 API锛堝鍒?M2 閫昏緫锛?=========
app.get('/api/m3-templates', async (req, res) => {
  console.log('馃摗 [闆疯揪鎹曟崏鍒颁俊鍙穄: GET -> /api/m3-templates');
  console.log('[3002 Signal] request accepted from web page');

  try {
    const secretId = process.env.VITE_TENCENT_COS_SECRET_ID;
    const secretKey = process.env.VITE_TENCENT_COS_SECRET_KEY;
    const bucket = process.env.VITE_TENCENT_COS_BUCKET || 'fudaiai-1400086527';
    const region = process.env.VITE_TENCENT_COS_REGION || 'ap-shanghai';

    if (!secretId || !secretKey) {
      return res.status(500).json({ error: '鏈嶅姟鍣ㄦ湭閰嶇疆鑵捐浜慍OS瀵嗛挜' });
    }

    // 鍒濆鍖朇OS
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    // M3 鎯呬荆妯℃澘鐩綍锛堜笉鍒嗘€у埆锛?
    const prefix = `festival-templates/m3/`;

    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix
      },
      (err, data) => {
        if (err) {
          console.error('[M3 Templates API] 鉂?鑾峰彇澶辫触:', err.message);
          return res.status(500).json({ error: err.message });
        }

        // 杩囨护鍑哄浘鐗囨枃浠讹紙鎺掗櫎杩囧ぇ鐨勬枃浠讹級
        const excludeFiles = ['4 (68).jpeg', '4 (69).jpeg', '4 (71).jpeg'];
        let templates = data.Contents
          .filter(file => {
            const fileName = file.Key.split('/').pop();
            return /\.(jpg|jpeg|png|webp)$/i.test(file.Key) && !excludeFiles.includes(fileName);
          })
          .map(file => {
            // 馃敟 瀵规枃浠惰矾寰勮繘琛孶RL缂栫爜锛堝鐞嗙┖鏍笺€佹嫭鍙风瓑鐗规畩瀛楃锛?
            const encodedKey = file.Key.split('/').map(part => encodeURIComponent(part)).join('/');
            const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com/${encodedKey}`;

            // 馃敟 浣跨敤鑵捐浜戞暟鎹竾璞″疄鏃跺鐞嗭紙URL鍙傛暟鏂瑰紡锛?
            const compressedUrl = `${baseUrl}?imageMogr2/thumbnail/800x/strip/format/webp/quality/85`;

            const fileName = file.Key.split('/').pop();
            const id = fileName.split('.')[0];

            return {
              id: id,
              name: fileName,
              imagePath: compressedUrl,  // 馃敟 杩斿洖鍘嬬缉鍚庣殑URL
              originalImagePath: baseUrl,  // 淇濈暀鍘熷浘URL
              size: file.Size,
              lastModified: file.LastModified
            };
          });

        console.log(`[M3 Templates API] return ${templates.length} templates`);
        res.json({
          success: true,
          count: templates.length,
          templates: templates
        });
      }
    );

  } catch (error) {
    console.error('[M3 Templates API] 鉂?寮傚父:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 媒体代理：解决 HTTPS 页面播放 HTTP 视频、跨域/Range 等兼容问题
app.get('/api/media/proxy', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) {
      return res.status(400).json({ error: 'url is required' });
    }

    const target = new URL(rawUrl);
    if (!['http:', 'https:'].includes(target.protocol)) {
      return res.status(400).json({ error: 'invalid media url protocol' });
    }

    const range = req.headers.range ? String(req.headers.range) : undefined;
    const upstreamResp = await fetch(rawUrl, {
      method: 'GET',
      headers: {
        ...(range ? { Range: range } : {}),
        'User-Agent': 'Mozilla/5.0',
        'Accept': req.headers.accept ? String(req.headers.accept) : '*/*'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(90000)
    });

    res.status(upstreamResp.status);
    const passthroughHeaders = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'cache-control',
      'etag',
      'last-modified'
    ];
    passthroughHeaders.forEach((headerName) => {
      const headerValue = upstreamResp.headers.get(headerName);
      if (headerValue) {
        res.setHeader(headerName, headerValue);
      }
    });

    if (!upstreamResp.body) {
      return res.end();
    }

    Readable.fromWeb(upstreamResp.body).pipe(res);
  } catch (error) {
    console.error('[media proxy] error:', error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'media proxy failed' });
    }
  }
});

// 娣诲姞涓嬭浇璺敱
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// 娣诲姞涓存椂澶勭悊鐩綍鐨勯潤鎬佽祫婧愭槧灏?
app.use('/temp_processing', express.static(path.join(__dirname, 'temp_processing')));

// ========== 鏀粯绯荤粺 API ==========

// 璁㈠崟瀛樺偍锛堢敓浜х幆澧冨簲浣跨敤鏁版嵁搴擄級
const ordersFilePath = path.join(__dirname, 'data', 'orders.json');

// 纭繚鏁版嵁鐩綍瀛樺湪
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 鍒濆鍖栬鍗曟枃浠?
if (!fs.existsSync(ordersFilePath)) {
  fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
}

/**
 * 璇诲彇璁㈠崟鏁版嵁
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
 * 淇濆瓨璁㈠崟鏁版嵁
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
 * 鐢熸垚璁㈠崟ID
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
  basic: { packageName: '灏忚瘯鐗涘垁', amount: 9.9, credits: 600 },
  value: { packageName: 'Value Pack', amount: 29.9, credits: 2300 },
  premium: { packageName: '鏄ヨ妭璞ぜ', amount: 59.9, credits: 6000 },

  // Backward-compatible aliases
  starter: { packageName: '灏忚瘯鐗涘垁', amount: 9.9, credits: 600 },
  standard: { packageName: 'Value Pack', amount: 29.9, credits: 2300 },
  pro: { packageName: '鏄ヨ妭璞ぜ', amount: 59.9, credits: 6000 },
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
      throw new Error('缂哄皯蹇呰鍙傛暟');
    }
    return {
      packageId,
      packageName: packageName || packageId,
      amount: parsedAmount,
      credits: parsedCredits,
    };
  }

  throw new Error('Invalid package id, please use backend configured package');
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
 * 鐢熸垚铏庣毊妞掔鍚?
 */
function generateHupijiaoSign(params, appSecret) {
  // 1. 杩囨护绌哄€?
  const filteredParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      filteredParams[key] = params[key];
    }
  });

  // 2. 鎸塳ey鎺掑簭
  const sortedKeys = Object.keys(filteredParams).sort();

  // 3. 鎷兼帴瀛楃涓?
  const signStr = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&') + appSecret;

  // 4. MD5鍔犲瘑
  return crypto.createHash('md5').update(signStr).digest('hex');
}

/**
 * 鍒涘缓鍏呭€艰鍗?
 */
app.post('/api/payment/create-order', express.json(), async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: '缂哄皯蹇呰鍙傛暟' });
    }

    const pricing = resolveOrderPricing(req.body);

    // 鐢熸垚璁㈠崟ID
    const orderId = generateOrderId();

    // 鍒涘缓璁㈠崟
    const order = {
      orderId,
      visitorId,
      packageId: pricing.packageId,
      packageName: pricing.packageName,
      amount: pricing.amount,
      credits: pricing.credits,
      status: 'pending',
      createdAt: Date.now(),
      expiredAt: Date.now() + 30 * 60 * 1000, // 30鍒嗛挓鍚庤繃鏈?
    };

    // 淇濆瓨璁㈠崟
    const orders = readOrders();
    orders.push(order);
    saveOrders(orders);

    // 铏庣毊妞掗厤缃紙姝ｅ紡鐜锛屽繀椤婚厤缃幆澧冨彉閲忥級
    const hupijiaoAppId = process.env.HUPIJIAO_APP_ID;
    const hupijiaoAppSecret = process.env.HUPIJIAO_APP_SECRET;
    const notifyUrl = process.env.HUPIJIAO_NOTIFY_URL;
    const paymentGateway = process.env.HUPIJIAO_PAYMENT_GATEWAY || 'https://api.xunhupay.com/payment/do.html';

    // 楠岃瘉蹇呴渶鐨勯厤缃?
    if (!hupijiaoAppId || !hupijiaoAppSecret) {
      console.error('馃毃 [閰嶇疆閿欒] 缂哄皯铏庣毊妞掗厤缃紝璇锋鏌?env鏂囦欢');
      return res.status(500).json({ error: 'Payment config error, please contact admin' });
    }

    if (!notifyUrl || notifyUrl.includes('your-domain')) {
      console.warn('[Config Warning] notify URL is not configured correctly, credits may not auto-arrive');
    }

    // 铏庣毊妞掓敮浠樺弬鏁?
    const paymentParams = {
      version: '1.1',
      lang: 'zh-CN',
      plugins: 'festival-ai',
      appid: hupijiaoAppId,
      trade_order_id: orderId,
      total_fee: Number(pricing.amount).toFixed(2), // 铏庣毊妞掍娇鐢ㄥ厓
      title: `${pricing.packageName} - ${pricing.credits}绉垎`,
      time: Math.floor(Date.now() / 1000).toString(),
      notify_url: notifyUrl,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${orderId}`,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?orderId=${orderId}`,
    };

    // 鐢熸垚绛惧悕
    const sign = generateHupijiaoSign(paymentParams, hupijiaoAppSecret);
    paymentParams.hash = sign;

    console.log(`馃挵 [鏀粯淇℃伅]`);
    console.log(`   AppID: ${hupijiaoAppId}`);
    console.log(`   璁㈠崟鍙? ${orderId}`);
    console.log(`   閲戦: 楼${pricing.amount}`);
    console.log(`   鍥炶皟URL: ${notifyUrl}`);

    // 璋冪敤铏庣毊妞扐PI鍒涘缓鏀粯璁㈠崟
    const paymentRequestUrl = `${paymentGateway}?${Object.keys(paymentParams).map(key => `${key}=${encodeURIComponent(paymentParams[key])}`).join('&')}`;

    console.log(`馃敆 [璇锋眰铏庣毊妞抅 ${paymentRequestUrl}`);

    // 浣跨敤https妯″潡璋冪敤铏庣毊妞扐PI
    const httpsModule = paymentGateway.startsWith('https') ? https : http;

    httpsModule.get(paymentRequestUrl, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const hupijiaoResponse = JSON.parse(data);

          console.log(`鉁?[铏庣毊妞掑搷搴擼`, hupijiaoResponse);

          if (hupijiaoResponse.errcode === 0) {
            // 鎴愬姛锛岃繑鍥炴敮浠楿RL
            console.log(`馃挵 [璁㈠崟鍒涘缓] ${orderId} - ${pricing.packageName} - 楼${pricing.amount} - ${pricing.credits}绉垎`);

            res.json({
              ...order,
              paymentUrl: hupijiaoResponse.url, // 浣跨敤铏庣毊妞掕繑鍥炵殑URL
              qrcodeUrl: hupijiaoResponse.url_qrcode, // 浜岀淮鐮乁RL
              hupijiaoOrderId: hupijiaoResponse.openid, // 铏庣毊妞掕鍗旾D
            });
          } else {
            console.error(`鉂?[铏庣毊妞掗敊璇痌 ${hupijiaoResponse.errmsg}`);
            res.status(500).json({ error: `鏀粯骞冲彴閿欒: ${hupijiaoResponse.errmsg}` });
          }
        } catch (parseError) {
          console.error(`鉂?[瑙ｆ瀽閿欒]`, parseError);
          console.error(`   鍝嶅簲鏁版嵁: ${data}`);
          res.status(500).json({ error: '鏀粯骞冲彴鍝嶅簲寮傚父' });
        }
      });
    }).on('error', (err) => {
      console.error(`鉂?[璇锋眰澶辫触]`, err);
      res.status(500).json({ error: '鏃犳硶杩炴帴鏀粯骞冲彴' });
    });
  } catch (error) {
    console.error('鍒涘缓璁㈠崟澶辫触:', error);
    if (error && (error.message === '缂哄皯蹇呰鍙傛暟' || error.message.includes('鏃犳晥濂楅ID'))) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: '鍒涘缓璁㈠崟澶辫触' });
  }
});

/**
 * 鏌ヨ璁㈠崟鐘舵€?
 */
app.get('/api/payment/order-status/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    const orders = readOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 妫€鏌ヨ鍗曟槸鍚﹁繃鏈?
    if (order.status === 'pending' && Date.now() > order.expiredAt) {
      order.status = 'expired';
      saveOrders(orders);
    }

    res.json(order);
  } catch (error) {
    console.error('鏌ヨ璁㈠崟澶辫触:', error);
    res.status(500).json({ error: '鏌ヨ璁㈠崟澶辫触' });
  }
});

/**
 * 铏庣毊妞掓敮浠樺洖璋?
 */
app.post('/api/payment/notify', express.urlencoded({ extended: true }), (req, res) => {
  try {
    console.log('馃敂 [鏀粯鍥炶皟] 鏀跺埌铏庣毊妞掑洖璋?', req.body);

    const {
      trade_order_id,
      total_fee,
      transaction_id,
      order_id,
      status,
      hash,
    } = req.body;

    // 楠岃瘉绛惧悕
    const hupijiaoAppSecret = process.env.HUPIJIAO_APP_SECRET;
    if (!hupijiaoAppSecret) {
      console.error('馃毃 [鏀粯鍥炶皟] 缂哄皯鏀粯瀵嗛挜閰嶇疆');
      return res.send('fail');
    }

    const verifyParams = { ...req.body };
    delete verifyParams.hash;
    const expectedSign = generateHupijiaoSign(verifyParams, hupijiaoAppSecret);

    if (hash !== expectedSign) {
      console.error('馃毃 [鏀粯鍥炶皟] 绛惧悕楠岃瘉澶辫触');
      console.error(`   鏀跺埌绛惧悕: ${hash}`);
      console.error(`   鏈熸湜绛惧悕: ${expectedSign}`);
      return res.send('fail');
    }

    // 鏌ユ壘璁㈠崟
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.orderId === trade_order_id);

    if (orderIndex === -1) {
      console.error('馃毃 [鏀粯鍥炶皟] 璁㈠崟涓嶅瓨鍦?', trade_order_id);
      return res.send('fail');
    }

    const order = orders[orderIndex];

    // 闃叉閲嶅鍥炶皟
    if (order.status === 'paid') {
      console.log('鉁?[鏀粯鍥炶皟] 璁㈠崟宸插鐞嗭紝蹇界暐閲嶅鍥炶皟');
      return res.send('success');
    }

    // 鏇存柊璁㈠崟鐘舵€?
    if (status === 'OD') {
      if (!isCallbackAmountMatch(order.amount, total_fee)) {
        console.error('馃毃 [鏀粯鍥炶皟] 閲戦鏍￠獙澶辫触');
        console.error(`   璁㈠崟閲戦: ${order.amount}`);
        console.error(`   鍥炶皟閲戦: ${total_fee}`);
        return res.send('fail');
      }

      order.status = 'paid';
      order.paidAt = Date.now();
      order.paymentId = transaction_id || order_id;
      saveOrders(orders);

      console.log(`鉁?[鏀粯鎴愬姛] ${trade_order_id} - 楼${total_fee / 100} - ${order.credits}绉垎`);

      // 鍙戞斁绉垎鍒版湇鍔＄绉垎绯荤粺
      if (order.visitorId && order.credits > 0) {
        const creditResult = DataService.addServerCredits(
          order.visitorId,
          order.credits,
          order.orderId,
          `Payment settled: ${order.packageName || 'recharge'} ¥${order.amount}`
        );
        console.log(`馃挵 [绉垎鍙戞斁] ${order.visitorId} +${order.credits}绉垎, 浣欓: ${creditResult.newBalance}`);
      }

      return res.send('success');
    } else {
      order.status = 'failed';
      saveOrders(orders);

      console.log(`鉂?[鏀粯澶辫触] ${trade_order_id}`);
      return res.send('success');
    }
  } catch (error) {
    console.error('馃毃 [鏀粯鍥炶皟] 澶勭悊澶辫触:', error);
    return res.send('fail');
  }
});

/**
 * 鎵嬪姩瀹屾垚璁㈠崟锛堟祴璇曠敤锛屾棤闇€鏀粯鍥炶皟锛?
 * 鐢ㄤ簬鏈湴娴嬭瘯锛屾棤娉曟帴鏀舵敮浠樺洖璋冩椂浣跨敤
 */
app.post('/api/payment/manual-complete', express.json(), (req, res) => {
  try {
    if (!ALLOW_MANUAL_COMPLETE) {
      return res.status(403).json({ error: 'Manual complete is disabled in production' });
    }

    if (MANUAL_COMPLETE_TOKEN) {
      const token = req.headers['x-admin-token'];
      if (token !== MANUAL_COMPLETE_TOKEN) {
        return res.status(403).json({ error: 'Invalid admin token' });
      }
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: '缂哄皯璁㈠崟ID' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[orderIndex];

    if (order.status === 'paid') {
      return res.json({
        success: true,
        message: 'Order already completed',
        order
      });
    }

    // 鎵嬪姩鏍囪涓哄凡鏀粯
    order.status = 'paid';
    order.paidAt = Date.now();
    order.paymentId = 'manual_test_' + Date.now();
    orders[orderIndex] = order;
    saveOrders(orders);

    console.log(`鉁?[鎵嬪姩瀹屾垚] ${orderId} - ${order.credits}绉垎`);

    // 鍙戞斁绉垎
    if (order.visitorId && order.credits > 0) {
      DataService.addServerCredits(order.visitorId, order.credits, order.orderId, `Manual complete: ${order.packageName || 'recharge'}`);
    }

    res.json({
      success: true,
      message: 'Order manually completed',
      order
    });
  } catch (error) {
    console.error('鎵嬪姩瀹屾垚璁㈠崟澶辫触:', error);
    res.status(500).json({ error: '鎿嶄綔澶辫触' });
  }
});

// 馃敀 鍔犺浇API浠ｇ悊绔偣 (瀹夊叏鍦颁唬鐞嗙涓夋柟API璋冪敤)
// 鈿狅笍 蹇呴』鍦╟atch-all涓棿浠朵箣鍓嶅姞杞斤紝鍚﹀垯浼氳鎷︽埅
const apiProxyRoutes = require('./api-proxy-endpoints');
apiProxyRoutes(app);

// ==================== 用户反馈系统 ====================
const feedbackFilePath = path.join(__dirname, 'data', 'feedback.json');

function loadFeedback() {
  try {
    if (fs.existsSync(feedbackFilePath)) {
      return JSON.parse(fs.readFileSync(feedbackFilePath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

function saveFeedback(data) {
  const dir = path.dirname(feedbackFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(feedbackFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/feedback — 用户提交反馈
app.post('/api/feedback', express.json(), (req, res) => {
  try {
    const { message, contact, visitorId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '请输入反馈内容' });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: '反馈内容不能超过2000字' });
    }
    const feedback = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      message: message.trim(),
      contact: (contact || '').trim().slice(0, 200),
      visitorId: visitorId || 'unknown',
      createdAt: Date.now(),
      status: 'pending',
      reply: ''
    };
    const feedbacks = loadFeedback();
    feedbacks.unshift(feedback);
    saveFeedback(feedbacks);
    console.log('[Feedback] New feedback from', feedback.visitorId, ':', feedback.message.substring(0, 50));
    return res.json({ success: true, id: feedback.id });
  } catch (err) {
    console.error('[Feedback] Error:', err.message);
    return res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

// GET /api/admin/feedback — 管理员查看反馈列表
app.get('/api/admin/feedback', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const feedbacks = loadFeedback();
    return res.json({ feedbacks, total: feedbacks.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/feedback/:id/reply — 管理员回复
app.post('/api/admin/feedback/:id/reply', express.json(), (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { reply } = req.body;
    const feedbacks = loadFeedback();
    const idx = feedbacks.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '反馈不存在' });
    feedbacks[idx] = { ...feedbacks[idx], reply: (reply || '').trim(), status: 'replied', repliedAt: Date.now() };
    saveFeedback(feedbacks);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// ==================== 用户反馈系统 END ====================


// 澶勭悊鎵€鏈夊叾浠栬姹傦紝杩斿洖鍓嶇搴旂敤锛堝繀椤绘斁鍦ㄦ渶鍚庯級
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 娣诲姞鍏ㄥ眬閿欒澶勭悊涓棿浠?- 鎹曡幏鎵€鏈変腑闂翠欢鐨勯敊璇?
app.use((err, req, res, next) => {
  console.error('馃毃 [SERVER CRITICAL ERROR]:', err.stack);
  const payload = {
    error: IS_PRODUCTION ? 'Internal Server Error' : err.message,
    status: 'error',
    message: 'Server internal error'
  };
  if (!IS_PRODUCTION) {
    payload.stack = err.stack;
  }
  res.status(500).json(payload);
});

// 鍚姩鏈嶅姟鍣?- 寮哄埗鎸佷箙杩愯

const server = app.listen(PORT, '0.0.0.0', () => {
  // 鎵撳嵃鐗╃悊杩涚▼淇℃伅
  console.log(`馃敟 [鏍稿績鐩戝惉鍚姩] 鍚庣蹇冭剰宸茶烦鍔紝绔彛: ${PORT}`);
  console.log('馃敟 鐗╃悊杩涚▼宸插紑鍚紝PID:', process.pid);
  console.log(`
馃殌 Server is running on http://localhost:${PORT}`);
  console.log(`馃摗 API endpoints available at:`);
  console.log(`   - Health check: http://localhost:${PORT}/api/health`);
  console.log(`   - FFmpeg check: http://localhost:${PORT}/api/ffmpeg-check`);
  console.log(`   - Audio separate: http://localhost:${PORT}/api/audio/separate`);
  console.log(`   - AI Triple Split: http://localhost:${PORT}/api/audio/process-triple-split`);
  console.log(`   - Traditional Split: http://localhost:${PORT}/api/audio/split-traditional`);
  console.log(`   - Video Compose: http://localhost:${PORT}/api/video/compose`);
  console.log(`
馃幆 Frontend available at: http://localhost:${PORT}`);
  console.log(`馃殌 鍚庣鏈嶅姟宸插湪 ${PORT} 绔彛灏辩华锛屽噯澶囪皟鐢?FFmpeg`);
  console.log('DashScope API Key: ' + (readDashscopeApiKey() ? 'loaded' : 'missing'));
  console.log(`
馃攳 Checking FFmpeg installation...`);
  
  // 鍚姩鏃舵鏌?FFmpeg 鏄惁鍦ㄧ郴缁熻矾寰勪腑
  checkFfmpegInPath((found, path) => {
    if (!found) {
      console.log(`
鈿狅笍  FFmpeg NOT FOUND in PATH:`);
      console.log(`   Please install FFmpeg and add it to your PATH.`);
      console.log(`   Installation guide: https://ffmpeg.org/download.html`);
      console.log(`   Simulating FFmpeg availability for frontend...`);
      console.log(`   FFmpeg service is now simulated and reachable`);
    } else {
      // 鎵ц FFmpeg 鐗堟湰鍛戒护
      exec('ffmpeg -version', (error, stdout, stderr) => {
        if (error) {
          console.log(`
鈿狅笍  FFmpeg PATH found but command failed:`);
          console.log(`   Path: ${path}`);
          console.log(`   Error: ${error.message}`);
          console.log(`   Simulating FFmpeg availability for frontend...`);
          console.log(`   FFmpeg service is now simulated and reachable`);
        } else {
          const versionMatch = stdout.match(/ffmpeg version (.+?) /);
          const version = versionMatch ? versionMatch[1] : 'unknown';
          console.log(`
鉁?FFmpeg FOUND:`);
          console.log(`   Path: ${path}`);
          console.log(`   Version: ${version}`);
          console.log(`   FFmpeg service is now active and reachable`);
        }
      });
    }
  });
});

// 澧炲姞鑷繚閫昏緫
server.on('error', (e) => {
  console.error(`馃毃 [鐩戝惉澶辫触] 妫€鏌?${PORT} 鏄惁琚崰鐢紒`, e);
});

// 鍏ㄥ眬寮傚父鎹曡幏锛岄槻姝㈢▼搴忓洜缁嗗井閿欒闂€€
process.on('uncaughtException', (error) => {
  console.error('馃敶 [鍏ㄥ眬寮傚父鎹曡幏] 绋嬪簭閬囧埌鑷村懡閿欒锛屼絾宸茶鎹曡幏锛屼笉浼氶棯閫€:', error.message);
  console.error('馃敶 閿欒鍫嗘爤:', error.stack);
});

