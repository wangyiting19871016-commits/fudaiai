import React, { useEffect, useRef } from 'react';

/**
 * 🎆 Festival-Fireworks - 春节烟花动画组件
 * 
 * 功能：
 * - Canvas烟花粒子效果
 * - 飘落的红灯笼
 * - 金色光晕
 * - 爆竹闪光
 */

interface Firework {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Lantern {
  x: number;
  y: number;
  speed: number;
  swing: number;
  swingSpeed: number;
}

const FestivalFireworks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireworks: Firework[] = [];
    const lanterns: Lantern[] = [];

    // 初始化灯笼
    for (let i = 0; i < 8; i++) {
      lanterns.push({
        x: Math.random() * canvas.width,
        y: -100 - Math.random() * 500,
        speed: 0.3 + Math.random() * 0.4,
        swing: 0,
        swingSpeed: 0.02 + Math.random() * 0.02
      });
    }

    // 创建烟花
    const createFirework = (x?: number, y?: number) => {
      const colors = ['#FFD700', '#FF6B6B', '#FFA000', '#FF8A80'];
      const particleCount = 30;
      const sourceX = x || Math.random() * canvas.width;
      const sourceY = y || Math.random() * canvas.height * 0.5;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 3;
        
        fireworks.push({
          x: sourceX,
          y: sourceY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 60 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2
        });
      }
    };

    // 定期创建烟花
    const fireworkInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        createFirework();
      }
    }, 1000);

    // 动画循环
    const animate = () => {
      // 透明背景，让底层渐变背景显示出来
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制烟花粒子
      fireworks.forEach((fw, index) => {
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.05;  // 重力
        fw.life--;

        if (fw.life <= 0) {
          fireworks.splice(index, 1);
          return;
        }

        const opacity = fw.life / fw.maxLife;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
        ctx.fillStyle = fw.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        ctx.fill();

        // 发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = fw.color;
      });

      ctx.shadowBlur = 0;

      // 绘制灯笼
      lanterns.forEach((lantern) => {
        lantern.y += lantern.speed;
        lantern.swing += lantern.swingSpeed;

        // 重置位置
        if (lantern.y > canvas.height + 100) {
          lantern.y = -100;
          lantern.x = Math.random() * canvas.width;
        }

        const swingX = Math.sin(lantern.swing) * 20;

        // 绘制灯笼（简化为圆形+文字）
        ctx.save();
        ctx.translate(lantern.x + swingX, lantern.y);
        
        // 灯笼主体
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(211, 47, 47, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 灯笼穗
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, 25);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();

    // 响应窗口大小变化
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 点击创建烟花
    const handleClick = (e: MouseEvent) => {
      createFirework(e.clientX, e.clientY);
    };
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleClick);
      clearInterval(fireworkInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="festival-fireworks-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
        zIndex: 0
      }}
    />
  );
};

export default FestivalFireworks;
