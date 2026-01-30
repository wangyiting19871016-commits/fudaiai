import React from 'react';
import { AestheticParams } from '../constants/AestheticProtocol';

interface ArtifactEngineParams extends AestheticParams {
  vignette: number;
  filterIntensity: number;
}

interface ArtifactEngineConfig {
  width: number;
  height: number;
}

class ArtifactEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null = null;
  private width: number;
  private height: number;
  private params: ArtifactEngineParams;
  private texture: WebGLTexture | null = null;
  private lutTexture: WebGLTexture | null = null;
  private uniformLocations: Map<string, WebGLUniformLocation | null> = new Map();
  
  // Default parameter values
  private static readonly DEFAULT_PARAMS: ArtifactEngineParams = {
    exposure: 0,
    brilliance: 0,
    highlights: 0,
    shadows: 0,
    contrast: 0,
    brightness: 0,
    blackPoint: 0,
    saturation: 0,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    definition: 0,
    noise: 0,
    vignette: 0,
    filterIntensity: 0
  };

  constructor(canvas: HTMLCanvasElement, config: ArtifactEngineConfig) {
    this.canvas = canvas;
    this.width = config.width;
    this.height = config.height;
    
    // Initialize default parameters
    this.params = { ...ArtifactEngine.DEFAULT_PARAMS };
    
    // Get WebGL context with premultipliedAlpha: false
    this.gl = this.canvas.getContext('webgl', { alpha: false, premultipliedAlpha: false }) as WebGLRenderingContext || this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    
    if (!this.gl) {
      throw new Error('WebGL is not supported in this browser');
    }
    
    // Initialize canvas
    this.initCanvas();
    
    // 放弃延迟初始化：立即编译包含14个参数的主着色器
    this.initShaders();
    this.initTextures();
    
    // Removed event listener - ArtifactEngine now uses direct method calls instead of global events
    // This aligns with Phase 2 architecture: "Simplify communication, remove global event bus"
  }

  private initCanvas(): void {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.width, this.height);
    }
  }

  private initShaders(): void {
    if (!this.gl) return;
    
    // Vertex shader source
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        // Force Y coordinate to be mathematically flipped: 1 becomes 0, 0 becomes 1
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;
    
    // Fragment shader source with parameter support for visual effect comparison
    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      
      // 14 aesthetic parameters
      uniform float u_exposure;
      uniform float u_brilliance;
      uniform float u_highlights;
      uniform float u_shadows;
      uniform float u_contrast;
      uniform float u_brightness;
      uniform float u_blackPoint;
      uniform float u_saturation;
      uniform float u_vibrance;
      uniform float u_warmth;
      uniform float u_tint;
      uniform float u_sharpness;
      uniform float u_definition;
      uniform float u_noise;
      
      // Helper functions
      float linearToSrgb(float c) {
        if (c <= 0.0031308) {
          return 12.92 * c;
        } else {
          return 1.055 * pow(c, 1.0 / 2.4) - 0.055;
        }
      }
      
      vec3 linearToSrgb(vec3 color) {
        return vec3(
          linearToSrgb(color.r),
          linearToSrgb(color.g),
          linearToSrgb(color.b)
        );
      }
      
      void main() {
        // Get original color
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 rgb = color.rgb;
        
        // Apply parameters for visual effect comparison
        rgb += u_exposure;
        rgb += u_brightness;
        rgb = mix(rgb, vec3(0.5), -u_contrast * 0.5);
        rgb = mix(rgb, vec3(1.0), u_highlights);
        rgb = mix(rgb, vec3(0.0), -u_shadows);
        rgb = mix(rgb, vec3(dot(rgb, vec3(0.2126, 0.7152, 0.0722)), dot(rgb, vec3(0.2126, 0.7152, 0.0722)), dot(rgb, vec3(0.2126, 0.7152, 0.0722)), -u_saturation);
        
        // Apply warmth and tint
        rgb.r += u_warmth * 0.1;
        rgb.b -= u_warmth * 0.05;
        rgb.g += u_tint * 0.1;
        rgb.r -= u_tint * 0.05;
        
        // Apply noise
        float noise = fract(sin(dot(v_texCoord, vec2(12.9898, 78.233))) * 43758.5453);
        rgb += noise * u_noise * 0.1;
        
        // Clamp to valid range
        rgb = clamp(rgb, 0.0, 1.0);
        
        gl_FragColor = vec4(rgb, color.a);
      }
    `;
    
    // 源码打印：在控制台显示Fragment Shader源码
    console.log('Current Fragment Shader:', fragmentShaderSource);
    
    // Create and compile shaders
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return;
    
    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) return;
    
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    
    // Check for linking errors
    const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (!success) {
      const info = this.gl.getProgramInfoLog(this.program);
      console.error('WebGL Link Error:', info);
      alert('Shader 报错: ' + info); // 强制弹窗，让我们看到底哪行公式写错了
      this.gl.deleteProgram(this.program);
      this.program = null;
      return;
    }
    
    // Use the program
    this.gl.useProgram(this.program);
    
    // Initialize attributes and uniforms
    this.initAttributes();
    this.initUniforms();
    
    // Create and bind buffer for fullscreen quad
    this.createFullscreenQuad();
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    // Check for compilation errors with enhanced logging
    const compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    const log = this.gl.getShaderInfoLog(shader);
    
    if (log) {
      console.error('--- SHADER COMPILE ERROR ---', log);
      // 如果报错了，把红背景换成黄色，方便肉眼识别
      try {
        const canvasElement = document.querySelector('canvas');
        if (canvasElement) {
          canvasElement.style.background = 'yellow';
        }
      } catch (error) {
        console.error('Failed to set canvas background for shader error:', error);
      }
    }
    
    if (!compileStatus) {
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  private initAttributes(): void {
    if (!this.gl || !this.program) return;
    
    // Get attribute locations
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    
    // Enable attributes
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.enableVertexAttribArray(texCoordLocation);
  }

  private initUniforms(): void {
    if (!this.gl || !this.program) return;
    
    // Get uniform locations and store them in a map
    const uniformNames = [
      'u_image',
      'u_lutImage',
      'u_exposure',
      'u_brilliance',
      'u_highlights',
      'u_shadows',
      'u_contrast',
      'u_brightness',
      'u_blackPoint',
      'u_saturation',
      'u_vibrance',
      'u_warmth',
      'u_tint',
      'u_sharpness',
      'u_definition',
      'u_noise',
      'u_vignette'
    ];
    
    uniformNames.forEach(name => {
      const location = this.gl.getUniformLocation(this.program!, name);
      this.uniformLocations.set(name, location);
    });
    
    // Set initial uniform values
    this.gl.uniform1i(this.uniformLocations.get('u_image')!, 0); // Texture unit 0 for main image
    this.gl.uniform1i(this.uniformLocations.get('u_lutImage')!, 1); // Texture unit 1 for LUT
    
    // Set initial parameter values
    this.setParams(this.params);
  }

  private createFullscreenQuad(): void {
    if (!this.gl || !this.program) return;
    
    // Create buffer for fullscreen quad
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    
    // Coordinates for a fullscreen quad - standard rectangle covering [-1,1] using two triangles
    // 强制补丁：重写顶点缓存初始化，确保矩形覆盖整个 Canvas
    const vertices = [
      // First triangle
      -1.0, -1.0, 0.0, 0.0, // Bottom left
       1.0, -1.0, 1.0, 0.0, // Bottom right
      -1.0,  1.0, 0.0, 1.0, // Top left
      // Second triangle
      -1.0,  1.0, 0.0, 1.0, // Top left
       1.0, -1.0, 1.0, 0.0, // Bottom right
       1.0,  1.0, 1.0, 1.0  // Top right
    ];
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    
    // Get attribute locations
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    
    // Set up vertex attributes
    const stride = 4 * Float32Array.BYTES_PER_ELEMENT; // 4 values per vertex (x, y, u, v)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, stride, 0);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
  }

  private initTextures(): void {
    if (!this.gl) return;
    
    // 简化颜色空间：统一使用标准且兼容性最强的gl.RGBA
    const internalFormat = this.gl.RGBA;
    
    // Generate main texture
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    // Create a 1x1 black pixel as default texture
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    
    // Set texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    // Generate LUT texture
    this.lutTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.lutTexture);
    
    // Create a 1x1 white pixel as default LUT texture
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    
    // Set LUT texture parameters
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    console.log('[COLOR SPACE] Using internalFormat:', internalFormat);
  }

  private getOrientation(image: HTMLImageElement): Promise<number> {
    return new Promise((resolve) => {
      // Fallback to default orientation
      resolve(1);
    });
  }

  private fixOrientation(image: HTMLImageElement, orientation: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const width = image.width;
    const height = image.height;
    
    // Set canvas size based on orientation
    canvas.width = orientation >= 5 ? height : width;
    canvas.height = orientation >= 5 ? width : height;
    
    // Apply rotation and mirroring based on orientation
    ctx.save();
    
    if (orientation > 4 && orientation < 9) {
      canvas.width = height;
      canvas.height = width;
    }
    
    switch (orientation) {
      case 2: ctx.translate(width, 0); ctx.scale(-1, 1); break;
      case 3: ctx.translate(width, height); ctx.rotate(Math.PI); break;
      case 4: ctx.translate(0, height); ctx.scale(1, -1); break;
      case 5: ctx.rotate(0.5 * Math.PI); ctx.scale(1, -1); break;
      case 6: ctx.rotate(0.5 * Math.PI); ctx.translate(0, -height); break;
      case 7: ctx.rotate(0.75 * Math.PI); ctx.translate(-width, 0); ctx.scale(1, -1); break;
      case 8: ctx.rotate(-0.25 * Math.PI); ctx.translate(0, -width); break;
      default: break;
    }
    
    ctx.drawImage(image, 0, 0);
    ctx.restore();
    
    return canvas;
  }

  // 强制纹理更新方法：确保在接收到新的图片或视频源时，执行 gl.texImage2D
  // 确保能处理视频流 - 物理上传：如果是视频，这行代码会将当前帧‘拍’进显存
  public updateTexture(source: HTMLImageElement | HTMLVideoElement) {
    const gl = this.gl;
    // 确保 gl 和 texture 不为 null，提高健壮性
    if (!gl || !this.texture) return;
    
    // 物理验证纹理：检查尺寸
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.videoWidth;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.videoHeight;
    const sourceUrl = source instanceof HTMLImageElement ? source.src : source.currentSrc;
    
    console.log(`[TEXTURE_CHECK] Image size: ${width} x ${height}, Source URL: ${sourceUrl}`);
    
    // 如果是 0x0，立即中止绘制并回退到之前的深灰色
    if (width === 0 || height === 0) {
      console.error('[TEXTURE_CHECK] Aborting texture update: Invalid dimensions');
      return;
    }
    
    // 保存当前激活的纹理单元
    const currentActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    
    // 物理反转 Y 轴
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    // 激活纹理单元 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    // 物理上传：无论图片还是视频帧，都强制写入显存
    // 使用类型断言确保兼容性，避免编译错误
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as any);
    
    // 强制关闭多级纹理 (No Mipmaps) - 针对非幂次方图片
    // 确保 NPOT 纹理能正确处理
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // 恢复之前激活的纹理单元
    gl.activeTexture(currentActiveTexture);
    
    // 立即渲染，确保纹理更新后能立即看到效果
    this.render();
  }

  public loadImage(image: HTMLImageElement | HTMLVideoElement | ImageData): void {
    if (!this.gl || !this.texture) return;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    // Upload texture and render
    const uploadTexture = (finalImage: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData) => {
      try {
        // 强制纹理更新：立即执行gl.texImage2D重新绑定，不管之前有没有绑定过
        if (finalImage instanceof HTMLImageElement || finalImage instanceof HTMLVideoElement) {
          // 使用新的 updateTexture 方法进行纹理上传
          this.updateTexture(finalImage);
        } else {
          // 对于 ImageData 或 Canvas，使用原有的 texImage2D 调用
          this.gl?.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, (finalImage) as any);
          // Force NPOT compatibility
          this.gl?.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
          this.gl?.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          this.gl?.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
          this.gl?.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        }
        
        // Log texture dimensions after upload
        if (finalImage instanceof HTMLImageElement) {
          console.log('Image dimensions after upload:', {
            naturalWidth: finalImage.naturalWidth,
            naturalHeight: finalImage.naturalHeight
          });
          // Force Canvas physical resolution synchronization
          this.canvas.width = finalImage.naturalWidth;
          this.canvas.height = finalImage.naturalHeight;
          this.width = finalImage.naturalWidth;
          this.height = finalImage.naturalHeight;
        } else if (finalImage instanceof HTMLCanvasElement) {
          console.log('Canvas dimensions after upload:', {
            width: finalImage.width,
            height: finalImage.height
          });
          // Force Canvas physical resolution synchronization
          this.canvas.width = finalImage.width;
          this.canvas.height = finalImage.height;
          this.width = finalImage.width;
          this.height = finalImage.height;
        }
        
        // 确保参数注入：图片加载并渲染出第一帧后，立即调用一次setParams
        this.setParams(this.params);
        
        // Render immediately after texture upload
        this.render();
      } catch (error) {
        console.error('Error uploading texture to WebGL:', error);
        throw error;
      }
    };
    
    if (image instanceof HTMLImageElement || image instanceof HTMLVideoElement) {
        if (image instanceof HTMLVideoElement) {
          // Handle video element directly
          uploadTexture(image);
        } else {
          // Process EXIF orientation and upload
          const processImage = async () => {
            try {
              // Log image dimensions before processing
              console.log('Image dimensions before processing:', {
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight
              });
              
              // 检查图像尺寸，如果为0则重新触发加载
              if (image.naturalWidth === 0 || image.naturalHeight === 0) {
                console.error('Image has zero dimensions, retrying...');
                // 重新设置src触发重新加载
                image.src = image.src;
                return;
              }
              
              // Get EXIF orientation
              const orientation = await this.getOrientation(image);
              
              // Fix orientation if needed
              if (orientation !== 1) {
                const fixedCanvas = this.fixOrientation(image, orientation);
                // Log canvas dimensions after orientation fix
                console.log('Canvas dimensions after orientation fix:', {
                  width: fixedCanvas.width,
                  height: fixedCanvas.height
                });
                // 添加纹理绑定日志
                console.log('Texture bound with dimensions:', fixedCanvas.width, fixedCanvas.height);
                uploadTexture(fixedCanvas);
              } else {
                // 添加纹理绑定日志
                console.log('Texture bound with dimensions:', image.naturalWidth, image.naturalHeight);
                uploadTexture(image);
              }
            } catch (error) {
              console.error('Error processing image orientation:', error);
              // Fallback to original image if EXIF processing fails
              uploadTexture(image);
            }
          };
          
          // Check if image is already loaded
          if (image.complete && image.naturalWidth > 0) {
            processImage();
          } else {
            // If image is not loaded, wait for it to load
            const onLoad = () => {
              // Clean up event listeners
              image.removeEventListener('load', onLoad);
              image.removeEventListener('error', onError);
              
              // Process image now that it's loaded
              processImage();
            };
            
            const onError = () => {
              // Clean up event listeners
              image.removeEventListener('load', onLoad);
              image.removeEventListener('error', onError);
              
              console.error('Failed to load image for WebGL texture');
            };
            
            // Set up event listeners
            image.addEventListener('load', onLoad);
            image.addEventListener('error', onError);
          }
        }
      } else {
        // ImageData is already loaded, upload directly
        // 添加纹理绑定日志
        console.log('Texture bound with dimensions:', image.width, image.height);
        uploadTexture(image);
      }
  }

  public setParams(params: Partial<ArtifactEngineParams>): void {
    if (!params || !this.gl || !this.program) return;
    
    // 严格类型检查：确保所有参数都是有效的数字
    const validatedParams: Partial<ArtifactEngineParams> = {};
    
    // 遍历所有参数，进行严格的类型检查
    Object.keys(params).forEach(key => {
      const paramKey = key as keyof ArtifactEngineParams;
      const value = params[paramKey];
      
      // 确保数值是有效的数字
      if (value !== undefined && value !== null) {
        validatedParams[paramKey] = typeof value === 'number' ? value : parseFloat(value);
      }
    });
    
    // 更新参数
    this.params = { ...this.params, ...validatedParams };
    
    // 立即更新所有 uniform 值
    Object.entries(validatedParams).forEach(([key, value]) => {
      const uniformName = `u_${key}`;
      const location = this.uniformLocations.get(uniformName);
      if (location !== null && location !== undefined) {
        this.gl.uniform1f(location, value as number);
      }
    });
    
    // 物理确保：只要参数变了，立刻触发一次渲染
    this.render();
  }

  public getParams(): ArtifactEngineParams {
    return { ...this.params };
  }

  // 确保 render 函数是幂等的
  // 不管 sourceElement 是什么，只要执行 render()，就必须尝试将当前绑定的纹理画出来
  public render(): void {
    const gl = this.gl;
    // 渲染守卫：如果WebGL上下文、纹理或程序不可用，静默返回
    if (!gl || !this.texture || !this.program) {
      // 绘制自检：如果渲染失败，Canvas 必须显示深灰色
      if (this.canvas) {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgb(0.2, 0.2, 0.2)';
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }
      console.log('[RENDER_STATUS] Render failed: Missing WebGL context, texture, or program');
      return;
    }
    
    try {
      console.log('[RENDER_STATUS] Starting render');
      
      // 强制 Canvas 物理尺寸同步
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      
      // 绘制自检：设置深灰色背景
      gl.clearColor(0.2, 0.2, 0.2, 1.0);
      // 静默执行：即使没有纹理，也会静默地刷出一层深灰色
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // 视口对齐：确保执行了正确的视口设置
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      
      // 1. 必须先使用程序
      gl.useProgram(this.program);
      
      // 2. 强制绑定纹理单元
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      // 确保 u_image 明确指向单元 0
      const uImageLocation = gl.getUniformLocation(this.program, "u_image");
      if (uImageLocation !== null) {
        gl.uniform1i(uImageLocation, 0);
      }
      
      // 3. 绘制画面
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      console.log('[RENDER_STATUS] Render completed successfully');
    } catch (error) {
      console.error('[RENDER_STATUS] Render error:', error);
      // 绘制自检：如果渲染失败，Canvas 必须显示深灰色
      gl.clearColor(0.2, 0.2, 0.2, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // 自动恢复机制：如果渲染出错，尝试显示原图
      this.displayOriginalImage();
    }
  }
  
  // 辅助方法：显示原始图片
  private displayOriginalImage(): void {
    console.log('Attempting to display original image');
    const gl = this.gl;
    if (!gl || !this.texture) return;
    
    try {
      // 清除画布
      gl.clearColor(0.04, 0.04, 0.04, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // 如果程序不可用，创建简单着色器程序作为可靠后备
      if (!this.program) {
        console.error('Main program is null, creating simple shader program as fallback');
        this.createSimpleShaderProgram();
        
        // 如果创建后备程序仍然失败，直接返回
        if (!this.program) {
          console.error('Failed to create fallback shader program');
          return;
        }
      }
      
      gl.useProgram(this.program);
      
      // 绑定纹理
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      const imageLoc = gl.getUniformLocation(this.program, "u_image");
      if (imageLoc !== null) {
        gl.uniform1i(imageLoc, 0);
      }
      
      // 绘制
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } catch (error) {
      console.error('Failed to display original image:', error);
    }
  }
  
  // 辅助方法：创建简单的着色器程序来显示原图 - 作为可靠的后备方案
  private createSimpleShaderProgram(): void {
    const gl = this.gl;
    if (!gl) return;
    
    // 简单的顶点着色器：直接传递位置和纹理坐标
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;
    
    // 简单的片段着色器：直接输出纹理颜色
    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `;
    
    try {
      // 创建并编译着色器
      const vertexShader = this.compileShader(vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = this.compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
      
      if (!vertexShader || !fragmentShader) {
        console.error('Failed to compile simple shader');
        return;
      }
      
      // 创建程序
      const program = gl.createProgram();
      if (!program) {
        console.error('Failed to create simple program');
        return;
      }
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      // 检查链接错误
      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        const info = gl.getProgramInfoLog(program);
        console.error('Simple Shader Link Error:', info);
        gl.deleteProgram(program);
        return;
      }
      
      this.program = program;
      console.log('Created simple shader program for displaying original image');
    } catch (error) {
      console.error('Failed to create simple shader program:', error);
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initCanvas();
    this.render();
  }

  public destroy(): void {
    // Check if WebGL context is still valid
    if (!this.gl) return;
    
    // Clean up textures
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
    
    if (this.lutTexture) {
      this.gl.deleteTexture(this.lutTexture);
      this.lutTexture = null;
    }
    
    // Clean up program and shaders with strict checks
    if (this.program) {
      try {
        const shaders = this.gl.getAttachedShaders(this.program);
        if (shaders) {
          shaders.forEach(shader => {
            if (shader) {
              this.gl.detachShader(this.program!, shader);
              this.gl.deleteShader(shader);
            }
          });
        }
        this.gl.deleteProgram(this.program);
      } catch (error) {
        console.error('Error during WebGL program cleanup:', error);
      }
      this.program = null;
    }
  }

  public loadLUT(lutImage: HTMLImageElement): void {
    if (!this.gl || !this.lutTexture) return;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.lutTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, lutImage);
    // Force NPOT compatibility for LUT texture
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    this.render();
  }
}

export default ArtifactEngine;
export type { ArtifactEngineParams };