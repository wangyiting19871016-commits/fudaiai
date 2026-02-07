/**
 * 字幕烧录问题诊断工具
 *
 * 用途：测试FFmpeg字幕烧录的各个环节，定位"一会显示、一会不显示"的根因
 *
 * 运行：node tools/diagnose_subtitle_burning.js
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');

// ========== 配置 ==========
const TEST_VIDEO_URL = 'https://dashscope.oss-cn-beijing.aliyuncs.com/outputs/c8f9629a-e914-418b-a2e9-0ad3a93058c9/20250208071052509-yunchaozhi-eue2k.mp4'; // 替换为实际测试视频URL
const TEST_AUDIO_URL = 'https://cos1.lubanma.net/1738918618889.mp3'; // 替换为实际测试音频URL
const TEST_SUBTITLE = '马年大吉，恭喜发财！祝您身体健康，万事如意！';

const TEMP_DIR = path.join(__dirname, '..', 'temp_processing');
const OUTPUT_DIR = path.join(__dirname, '..', 'downloads');

// ========== 诊断步骤 ==========

console.log('🔍 字幕烧录诊断工具');
console.log('====================\n');

async function diagnose() {
  let testResults = {
    ffmpegAvailable: false,
    tempDirExists: false,
    outputDirExists: false,
    videoDownload: false,
    audioDownload: false,
    audioDuration: null,
    srtGeneration: false,
    srtPathEscape: false,
    ffmpegSubtitles: false,
    ffmpegDrawtext: false
  };

  try {
    // 步骤1: 检查FFmpeg
    console.log('📌 步骤1: 检查FFmpeg可用性');
    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.error('❌ FFmpeg不可用:', err.message);
          reject(err);
        } else {
          console.log('✅ FFmpeg已安装');
          testResults.ffmpegAvailable = true;
          resolve();
        }
      });
    });

    // 步骤2: 检查目录
    console.log('\n📌 步骤2: 检查临时目录');
    if (fs.existsSync(TEMP_DIR)) {
      console.log('✅ 临时目录存在:', TEMP_DIR);
      testResults.tempDirExists = true;
    } else {
      console.log('⚠️ 临时目录不存在，创建中...');
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      testResults.tempDirExists = true;
    }

    if (fs.existsSync(OUTPUT_DIR)) {
      console.log('✅ 输出目录存在:', OUTPUT_DIR);
      testResults.outputDirExists = true;
    } else {
      console.log('⚠️ 输出目录不存在，创建中...');
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      testResults.outputDirExists = true;
    }

    // 步骤3: 下载测试视频（跳过，使用本地测试视频）
    console.log('\n📌 步骤3: 准备测试视频');
    const testVideoPath = path.join(TEMP_DIR, 'test_video.mp4');

    // 创建一个5秒的纯色测试视频
    console.log('⏳ 生成测试视频...');
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=c=blue:s=720x1280:d=5')
        .inputFormat('lavfi')
        .output(testVideoPath)
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p'
        ])
        .on('end', () => {
          console.log('✅ 测试视频生成成功');
          testResults.videoDownload = true;
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ 测试视频生成失败:', err.message);
          reject(err);
        })
        .run();
    });

    // 步骤4: 生成SRT字幕文件
    console.log('\n📌 步骤4: 生成SRT字幕文件');
    const srtPath = path.join(TEMP_DIR, 'test_subtitle.srt');
    const srtContent = `1
00:00:00,000 --> 00:00:05,000
${TEST_SUBTITLE}
`;

    // 测试不同编码
    console.log('🧪 测试UTF-8编码（无BOM）');
    fs.writeFileSync(srtPath, srtContent, 'utf8');
    console.log('✅ SRT文件生成成功:', srtPath);
    console.log('📄 SRT文件内容:');
    console.log(fs.readFileSync(srtPath, 'utf8'));
    testResults.srtGeneration = true;

    // 步骤5: 测试路径转义
    console.log('\n📌 步骤5: 测试Windows路径转义');
    const originalPath = srtPath;
    const escapedPath1 = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedPath2 = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
    const escapedPath3 = srtPath.replace(/\\/g, '/');

    console.log('原始路径:', originalPath);
    console.log('转义方案1 (后端当前):', escapedPath1);
    console.log('转义方案2 (双反斜杠):', escapedPath2);
    console.log('转义方案3 (仅正斜杠):', escapedPath3);

    // 步骤6: 测试FFmpeg subtitles滤镜
    console.log('\n📌 步骤6: 测试FFmpeg subtitles滤镜');
    const outputPath1 = path.join(OUTPUT_DIR, 'test_subtitles_method.mp4');

    try {
      await new Promise((resolve, reject) => {
        // 尝试转义方案3（最简单）
        const filterStr = `subtitles='${escapedPath3}':force_style='FontName=Microsoft YaHei,FontSize=28,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1,Outline=2,Shadow=1,MarginV=50,Alignment=2'`;

        console.log('FFmpeg滤镜:', filterStr);

        ffmpeg(testVideoPath)
          .videoFilters(filterStr)
          .outputOptions([
            '-c:v libx264',
            '-preset ultrafast',
            '-crf 23'
          ])
          .output(outputPath1)
          .on('start', (cmd) => {
            console.log('🎬 FFmpeg命令:', cmd);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              process.stdout.write(`\r📊 进度: ${progress.percent.toFixed(1)}%`);
            }
          })
          .on('end', () => {
            console.log('\n✅ subtitles滤镜测试成功');
            testResults.ffmpegSubtitles = true;
            testResults.srtPathEscape = true;
            resolve();
          })
          .on('error', (err, stdout, stderr) => {
            console.error('\n❌ subtitles滤镜失败:', err.message);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
          })
          .run();
      });
    } catch (err) {
      console.log('⚠️ subtitles滤镜失败，将测试drawtext方法');
    }

    // 步骤7: 测试FFmpeg drawtext滤镜（降级方案）
    console.log('\n📌 步骤7: 测试FFmpeg drawtext滤镜（fallback）');
    const outputPath2 = path.join(OUTPUT_DIR, 'test_drawtext_method.mp4');

    const escapedSubtitle = TEST_SUBTITLE
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,');

    const drawtextFilter = `drawtext=` +
      `text='${escapedSubtitle}':` +
      `fontfile='C\\:/Windows/Fonts/msyh.ttc':` +
      `fontsize=60:` +
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
      `y=h-th-100`;

    await new Promise((resolve, reject) => {
      console.log('FFmpeg滤镜:', drawtextFilter);

      ffmpeg(testVideoPath)
        .videoFilters(drawtextFilter)
        .outputOptions([
          '-c:v libx264',
          '-preset ultrafast',
          '-crf 23'
        ])
        .output(outputPath2)
        .on('start', (cmd) => {
          console.log('🎬 FFmpeg命令:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            process.stdout.write(`\r📊 进度: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('\n✅ drawtext滤镜测试成功');
          testResults.ffmpegDrawtext = true;
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('\n❌ drawtext滤镜失败:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(err);
        })
        .run();
    });

    // 步骤8: 生成诊断报告
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 诊断报告');
    console.log('='.repeat(60));

    console.log('\n✅ 成功的测试:');
    Object.entries(testResults).forEach(([key, value]) => {
      if (value === true || (value && typeof value !== 'boolean')) {
        console.log(`  - ${key}: ${value === true ? '通过' : value}`);
      }
    });

    console.log('\n❌ 失败的测试:');
    let hasFailures = false;
    Object.entries(testResults).forEach(([key, value]) => {
      if (value === false) {
        console.log(`  - ${key}: 失败`);
        hasFailures = true;
      }
    });

    if (!hasFailures) {
      console.log('  无失败项');
    }

    console.log('\n🎯 推荐解决方案:');
    if (testResults.ffmpegSubtitles) {
      console.log('  ✅ subtitles滤镜可用，建议使用SRT实时字幕');
      console.log('  💡 使用转义方案3（仅正斜杠）');
    } else if (testResults.ffmpegDrawtext) {
      console.log('  ⚠️ subtitles滤镜不可用，建议使用drawtext静态字幕');
      console.log('  💡 修改后端优先使用drawtext');
    } else {
      console.log('  ❌ 两种方法都失败，检查FFmpeg安装和字体配置');
    }

    console.log('\n📁 测试文件位置:');
    console.log(`  - 测试视频: ${testVideoPath}`);
    console.log(`  - SRT文件: ${srtPath}`);
    if (testResults.ffmpegSubtitles) {
      console.log(`  - subtitles方法输出: ${outputPath1}`);
    }
    if (testResults.ffmpegDrawtext) {
      console.log(`  - drawtext方法输出: ${outputPath2}`);
    }

    console.log('\n✅ 诊断完成！');

  } catch (error) {
    console.error('\n\n❌ 诊断过程出错:', error.message);
    console.error(error.stack);
  }
}

// 运行诊断
diagnose().catch(console.error);
