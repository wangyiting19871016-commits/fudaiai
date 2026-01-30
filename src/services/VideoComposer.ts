/**
 * VideoComposer - 前端视频合成引擎
 *
 * 核心功能：
 * - Canvas绘制背景+图片+文字+动效
 * - MediaRecorder录制视频
 * - 音频同步播放
 * - 导出MP4/WebM
 *
 * 技术栈：Canvas + MediaRecorder + Web Audio API
 */

import { VideoTemplate, BackgroundAnimation, ImageAnimation, TextAnimation } from '../configs/festival/videoTemplates';

export interface ComposerInput {
  image: string;       // 图片URL或Base64
  caption: string;     // 祝福文案
  audioUrl: string;    // 语音URL
  template: VideoTemplate;
}

export interface ComposerProgress {
  stage: 'loading' | 'preparing' | 'recording' | 'encoding' | 'complete' | 'error';
  progress: number;    // 0-100
  message: string;
}

export interface ComposerResult {
  blob: Blob;
  url: string;
  duration: number;
  format: string;
}

// 粒子类
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  type: 'particle' | 'petal' | 'firework' | 'star';

  constructor(canvasWidth: number, canvasHeight: number, color: string, type: 'particle' | 'petal' | 'firework' | 'star' = 'particle') {
    this.type = type;
    this.color = color;
    this.reset(canvasWidth, canvasHeight, true);
  }

  reset(canvasWidth: number, canvasHeight: number, initial = false) {
    this.x = Math.random() * canvasWidth;
    this.y = initial ? Math.random() * canvasHeight : -20;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = Math.random() * 2 + 1;
    this.size = Math.random() * 4 + 2;
    this.opacity = Math.random() * 0.5 + 0.5;
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.type === 'petal') {
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vx = Math.max(-2, Math.min(2, this.vx));
    }

    if (this.y > canvasHeight + 20) {
      this.reset(canvasWidth, canvasHeight);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    if (this.type === 'petal') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.size, this.size * 1.5, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'star') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? this.size : this.size / 2;
        const x = this.x + Math.cos(angle) * r;
        const y = this.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// 烟花类
class Firework {
  x: number;
  y: number;
  targetY: number;
  particles: FireworkParticle[];
  exploded: boolean;
  vy: number;
  color: string;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth * 0.8 + canvasWidth * 0.1;
    this.y = canvasHeight;
    this.targetY = Math.random() * canvasHeight * 0.4 + canvasHeight * 0.1;
    this.vy = -8 - Math.random() * 4;
    this.exploded = false;
    this.particles = [];
    this.color = `hsl(${Math.random() * 60 + 340}, 100%, 60%)`;
  }

  update(canvasWidth: number, canvasHeight: number) {
    if (!this.exploded) {
      this.y += this.vy;
      this.vy += 0.1;

      if (this.y <= this.targetY || this.vy >= 0) {
        this.explode();
      }
    } else {
      this.particles.forEach(p => p.update());
      this.particles = this.particles.filter(p => p.opacity > 0);
    }
  }

  explode() {
    this.exploded = true;
    const count = 50 + Math.random() * 30;
    for (let i = 0; i < count; i++) {
      this.particles.push(new FireworkParticle(this.x, this.y, this.color));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.exploded) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      this.particles.forEach(p => p.draw(ctx));
    }
  }

  isDead(): boolean {
    return this.exploded && this.particles.length === 0;
  }
}

class FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  color: string;
  size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.opacity = 1;
    this.color = color;
    this.size = Math.random() * 2 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.vx *= 0.98;
    this.opacity -= 0.015;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class VideoComposer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private template: VideoTemplate;
  private mainImage: HTMLImageElement | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private particles: Particle[] = [];
  private fireworks: Firework[] = [];
  private animationId: number = 0;
  private startTime: number = 0;
  private audioDuration: number = 0;
  private onProgress?: (progress: ComposerProgress) => void;
  private isRecording: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 检测浏览器是否支持视频录制
   */
  static isSupported(): boolean {
    return !!(
      window.MediaRecorder &&
      window.HTMLCanvasElement &&
      HTMLCanvasElement.prototype.captureStream
    );
  }

  /**
   * 获取支持的视频格式
   */
  static getSupportedFormat(): string {
    const formats = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format;
      }
    }

    return 'video/webm';
  }

  /**
   * 合成视频
   */
  async compose(
    input: ComposerInput,
    onProgress?: (progress: ComposerProgress) => void
  ): Promise<ComposerResult> {
    this.onProgress = onProgress;
    this.template = input.template;
    this.chunks = [];

    try {
      // 阶段1: 加载资源
      this.updateProgress({ stage: 'loading', progress: 10, message: '正在加载资源...' });
      await this.loadAssets(input.image, input.audioUrl);

      // 阶段2: 准备画布
      this.updateProgress({ stage: 'preparing', progress: 30, message: '正在准备画布...' });
      this.setupCanvas();
      this.initParticles();

      // 阶段3: 录制视频
      this.updateProgress({ stage: 'recording', progress: 40, message: '正在录制视频...' });
      const blob = await this.record(input.caption);

      // 阶段4: 完成
      this.updateProgress({ stage: 'complete', progress: 100, message: '视频生成完成!' });

      const url = URL.createObjectURL(blob);
      return {
        blob,
        url,
        duration: this.audioDuration,
        format: VideoComposer.getSupportedFormat()
      };
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '视频生成失败'
      });
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * 加载资源
   */
  private async loadAssets(imageUrl: string, audioUrl: string): Promise<void> {
    // 加载图片
    this.mainImage = await this.loadImage(imageUrl);

    // 加载音频
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      this.audioElement!.onloadedmetadata = () => {
        this.audioDuration = this.audioElement!.duration;
        resolve();
      };
      this.audioElement!.onerror = () => reject(new Error('音频加载失败'));
      this.audioElement!.src = audioUrl;
    });
  }

  /**
   * 加载图片
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = src;
    });
  }

  /**
   * 设置画布
   */
  private setupCanvas(): void {
    this.canvas.width = this.template.canvas.width;
    this.canvas.height = this.template.canvas.height;
  }

  /**
   * 初始化粒子系统
   */
  private initParticles(): void {
    this.particles = [];
    this.fireworks = [];

    const bg = this.template.background;
    const count = bg.animationParams?.count || 20;
    const color = bg.particleColor || '#FFD700';

    if (bg.animation === 'particles') {
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this.canvas.width, this.canvas.height, color, 'particle'));
      }
    } else if (bg.animation === 'petals') {
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this.canvas.width, this.canvas.height, color, 'petal'));
      }
    } else if (bg.animation === 'stars') {
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this.canvas.width, this.canvas.height, '#FFFFFF', 'star'));
      }
    }
  }

  /**
   * 录制视频
   */
  private record(caption: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = this.canvas.captureStream(this.template.canvas.fps);

      // 添加音频轨道
      if (this.audioElement) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(this.audioElement);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);  // 同时播放声音

        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      const mimeType = VideoComposer.getSupportedFormat();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (e) => {
        reject(new Error('录制失败'));
      };

      // 开始录制
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTime = performance.now();

      // 播放音频
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
        this.audioElement.play();
      }

      // 开始动画循环
      this.animate(caption);

      // 音频结束时停止录制
      if (this.audioElement) {
        this.audioElement.onended = () => {
          this.stopRecording();
        };
      }

      // 安全超时（最长20秒）
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, 20000);
    });
  }

  /**
   * 动画循环
   */
  private animate(caption: string): void {
    if (!this.isRecording) return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const progress = Math.min(elapsed / this.audioDuration, 1);

    // 更新进度
    this.updateProgress({
      stage: 'recording',
      progress: 40 + progress * 50,
      message: `正在录制... ${Math.floor(progress * 100)}%`
    });

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制背景
    this.drawBackground(elapsed);

    // 更新和绘制粒子
    this.updateAndDrawParticles();

    // 绘制烟花
    this.updateAndDrawFireworks(elapsed);

    // 绘制主图
    this.drawMainImage(elapsed);

    // 绘制装饰
    this.drawDecorations(elapsed);

    // 绘制文字
    this.drawCaption(caption, elapsed);

    // 绘制水印
    this.drawWatermark();

    // 继续动画
    this.animationId = requestAnimationFrame(() => this.animate(caption));
  }

  /**
   * 绘制背景
   */
  private drawBackground(time: number): void {
    const bg = this.template.background;

    if (bg.type === 'gradient') {
      const gradient = this.parseGradient(bg.value);
      this.ctx.fillStyle = gradient;
    } else if (bg.type === 'color') {
      this.ctx.fillStyle = bg.value;
    }

    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 解析CSS渐变
   */
  private parseGradient(cssGradient: string): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);

    // 简单解析 linear-gradient
    const colorMatches = cssGradient.match(/#[A-Fa-f0-9]{6}/g) || ['#000000', '#333333'];
    const stops = colorMatches.length;

    colorMatches.forEach((color, i) => {
      gradient.addColorStop(i / (stops - 1), color);
    });

    return gradient;
  }

  /**
   * 更新和绘制粒子
   */
  private updateAndDrawParticles(): void {
    this.particles.forEach(p => {
      p.update(this.canvas.width, this.canvas.height);
      p.draw(this.ctx);
    });
  }

  /**
   * 更新和绘制烟花
   */
  private updateAndDrawFireworks(time: number): void {
    if (this.template.background.animation !== 'fireworks') return;

    // 随机发射烟花
    if (Math.random() < 0.03 && this.fireworks.length < 5) {
      this.fireworks.push(new Firework(this.canvas.width, this.canvas.height));
    }

    this.fireworks.forEach(f => {
      f.update(this.canvas.width, this.canvas.height);
      f.draw(this.ctx);
    });

    // 移除消亡的烟花
    this.fireworks = this.fireworks.filter(f => !f.isDead());
  }

  /**
   * 绘制主图
   */
  private drawMainImage(time: number): void {
    if (!this.mainImage) return;

    const cfg = this.template.mainImage;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // 计算位置和大小
    const w = cw * cfg.size.width / 100;
    const h = ch * cfg.size.height / 100;
    let x = cw * cfg.position.x / 100 - w / 2;
    let y = ch * cfg.position.y / 100 - h / 2;

    // 应用动画
    const anim = cfg.animation;
    const params = cfg.animationParams || { amplitude: 5, speed: 2 };
    let scale = 1;
    let rotation = 0;

    if (anim === 'float') {
      y += Math.sin(time * params.speed!) * params.amplitude!;
    } else if (anim === 'breathe') {
      scale = 1 + Math.sin(time * params.speed!) * (params.amplitude! / 100);
    } else if (anim === 'bounce') {
      y += Math.abs(Math.sin(time * params.speed!)) * params.amplitude!;
    } else if (anim === 'rotate') {
      rotation = Math.sin(time * (params.speed! / 10)) * (params.amplitude! * Math.PI / 180);
    } else if (anim === 'zoom') {
      scale = 1 + Math.sin(time * params.speed!) * 0.05;
    }

    this.ctx.save();
    this.ctx.translate(x + w / 2, y + h / 2);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);

    // 阴影
    if (cfg.shadow) {
      this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowOffsetY = 10;
    }

    // 圆角裁剪
    if (cfg.borderRadius) {
      const radius = Math.min(w, h) * cfg.borderRadius / 100;
      this.roundRect(-w / 2, -h / 2, w, h, radius);
      this.ctx.clip();
    }

    this.ctx.drawImage(this.mainImage, -w / 2, -h / 2, w, h);
    this.ctx.restore();
  }

  /**
   * 绘制圆角矩形路径
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  /**
   * 绘制装饰元素
   */
  private drawDecorations(time: number): void {
    this.template.decorations.forEach(dec => {
      const x = this.canvas.width * dec.position.x / 100;
      let y = this.canvas.height * dec.position.y / 100;
      const params = dec.animationParams || { amplitude: 5, speed: 2 };

      // 应用动画
      if (dec.animation === 'float') {
        y += Math.sin(time * params.speed! + dec.position.x) * params.amplitude!;
      } else if (dec.animation === 'bounce') {
        y += Math.abs(Math.sin(time * params.speed!)) * params.amplitude!;
      }

      this.ctx.save();
      this.ctx.font = `${dec.size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (dec.animation === 'rotate') {
        this.ctx.translate(x, y);
        this.ctx.rotate(time * (params.speed! / 5));
        this.ctx.fillText(dec.value, 0, 0);
      } else {
        this.ctx.fillText(dec.value, x, y);
      }

      this.ctx.restore();
    });
  }

  /**
   * 绘制文字
   */
  private drawCaption(text: string, time: number): void {
    const cfg = this.template.caption;
    const delay = cfg.delay;

    if (time < delay) return;

    const elapsed = time - delay;
    const style = cfg.style;
    const x = this.canvas.width * cfg.position.x / 100;
    const y = this.canvas.height * cfg.position.y / 100;
    const maxWidth = this.canvas.width * cfg.maxWidth / 100;

    this.ctx.save();
    this.ctx.font = `bold ${style.fontSize}px ${style.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = style.color;

    // 应用动画
    let opacity = 1;
    let displayText = text;

    if (cfg.animation === 'fadeIn') {
      opacity = Math.min(elapsed / 0.5, 1);
    } else if (cfg.animation === 'typewriter') {
      const charCount = Math.floor(elapsed * 8);
      displayText = text.substring(0, charCount);
    } else if (cfg.animation === 'glow') {
      const glowIntensity = 10 + Math.sin(time * 3) * 5;
      this.ctx.shadowColor = style.shadowColor || style.color;
      this.ctx.shadowBlur = glowIntensity;
    } else if (cfg.animation === 'slideUp') {
      const slideProgress = Math.min(elapsed / 0.5, 1);
      const offsetY = (1 - slideProgress) * 50;
      this.ctx.translate(0, offsetY);
      opacity = slideProgress;
    }

    this.ctx.globalAlpha = opacity;

    // 阴影
    if (style.shadow) {
      this.ctx.shadowColor = style.shadowColor || 'rgba(0,0,0,0.5)';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetY = 4;
    }

    // 描边
    if (style.strokeColor && style.strokeWidth) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth;
    }

    // 自动换行
    this.wrapText(displayText, x, y, maxWidth, style.fontSize * (style.lineHeight || 1.4));

    this.ctx.restore();
  }

  /**
   * 文字自动换行
   */
  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const lines: string[] = [];
    let currentLine = '';

    for (const char of text) {
      const testLine = currentLine + char;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    const totalHeight = lines.length * lineHeight;
    const startY = y - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
      this.ctx.fillText(line, x, startY + i * lineHeight);
    });
  }

  /**
   * 绘制水印
   */
  private drawWatermark(): void {
    const wm = this.template.watermark;
    if (!wm) return;

    this.ctx.save();
    this.ctx.globalAlpha = wm.style.opacity;
    this.ctx.font = `${wm.style.fontSize}px Arial`;
    this.ctx.fillStyle = wm.style.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const x = this.canvas.width * wm.position.x / 100;
    const y = this.canvas.height * wm.position.y / 100;

    this.ctx.fillText(wm.text, x, y);
    this.ctx.restore();
  }

  /**
   * 停止录制
   */
  private stopRecording(): void {
    this.isRecording = false;
    cancelAnimationFrame(this.animationId);

    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    cancelAnimationFrame(this.animationId);
    this.particles = [];
    this.fireworks = [];

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
  }

  /**
   * 更新进度
   */
  private updateProgress(progress: ComposerProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
}

// 导出单例
export const videoComposer = new VideoComposer();
