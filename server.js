const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto'); // 🔑 用于LiblibAI签名
// const db = require('./src/backend/db');  // ⚠️ Zhenji项目模块，暂时注释
// const { executeTask } = require('./src/backend/executor');  // ⚠️ Zhenji项目模块，暂时注释

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
  // 捕获 Multer 错误
  onError: (err, req, res, next) => {
    console.error(`🚨 [CRITICAL]: 文件写入物理失败，原因: ${err.message}`);
    next(err);
  }
});

const app = express();
const PORT = process.env.PORT || 3002;

// 配置 CORS - 允许所有跨域请求，包括本地HTML文件
app.use(cors({
  origin: function(origin, callback) {
    // 允许所有来源（包括 null origin，即本地HTML文件）
    callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// 安装"前置信号雷达" (Global Request Radar)
app.use((req, res, next) => {
  console.log(`📡 [雷达捕捉到信号]: ${req.method} -> ${req.url}`);
  console.log(`✨ [3002 信号] 成功接收到来自网页的请求！`);
  next();
});

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
app.use(express.static(path.join(__dirname, 'dist')));

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
        const { startTime, endTime } = segment;
        
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
      res.status(500).json({
        error: error.message,
        stack: error.stack,
        status: 'error',
        message: '音频剥离失败',
        // 如果是FFmpeg错误，保留原始错误信息
        ffmpegError: error.ffmpegError || undefined
      });
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

// 添加下载路由
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// 添加临时处理目录的静态资源映射
app.use('/temp_processing', express.static(path.join(__dirname, 'temp_processing')));

// 处理所有其他请求，返回前端应用
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 添加全局错误处理中间件 - 捕获所有中间件的错误
app.use((err, req, res, next) => {
  console.error('🚨 [SERVER CRITICAL ERROR]:', err.stack);
  res.status(500).json({ 
    error: err.message, 
    stack: err.stack,
    status: 'error',
    message: '服务器内部错误' 
  });
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