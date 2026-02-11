/**
 * Feature Card Background Components
 * Pure CSS/SVG animated backgrounds for Spring Festival features
 */

import React from 'react';
import './FeatureCardBackgrounds.css';

// 1. 拜年文案 - Traditional Elegance with Flowing Clouds
export const BlessingTextBackground: React.FC = () => {
  return (
    <div className="card-bg blessing-text-bg" data-emoji="✍️">
      {/* Animated Chinese cloud patterns */}
      <svg className="clouds-pattern" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#FF6B6B', stopOpacity: 0.2 }} />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF8C42', stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 0.15 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Cloud shapes with traditional Chinese aesthetics */}
        <g className="cloud cloud-1" filter="url(#glow)">
          <path d="M 50,150 Q 100,100 150,120 Q 200,80 250,110 Q 280,90 320,120 Q 350,140 320,170 Q 280,200 230,180 Q 180,190 140,170 Q 90,180 50,150 Z"
                fill="url(#cloudGrad1)" />
        </g>

        <g className="cloud cloud-2" filter="url(#glow)">
          <path d="M 450,80 Q 500,40 560,60 Q 620,30 680,70 Q 720,50 750,90 Q 780,120 740,150 Q 690,180 630,160 Q 570,175 520,150 Q 470,160 450,80 Z"
                fill="url(#cloudGrad2)" />
        </g>

        <g className="cloud cloud-3" filter="url(#glow)">
          <path d="M 100,400 Q 140,360 190,380 Q 240,350 290,380 Q 330,370 360,400 Q 380,430 350,460 Q 310,490 260,470 Q 210,485 170,460 Q 130,475 100,400 Z"
                fill="url(#cloudGrad1)" />
        </g>

        <g className="cloud cloud-4" filter="url(#glow)">
          <path d="M 520,420 Q 570,380 620,400 Q 680,370 730,410 Q 770,390 790,430 Q 810,470 770,500 Q 720,530 670,510 Q 620,525 580,500 Q 540,515 520,420 Z"
                fill="url(#cloudGrad2)" />
        </g>
      </svg>

      {/* Floating sparkles */}
      <div className="sparkles-container">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }} />
        ))}
      </div>
    </div>
  );
};

// 2. 语音贺卡 - Sonic Waves with Audio Visualization
export const VoiceCardBackground: React.FC = () => {
  return (
    <div className="card-bg voice-card-bg" data-emoji="🎵">
      {/* Animated waveform bars */}
      <div className="waveform-container">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              animationDelay: `${i * 0.05}s`,
              left: `${(i / 40) * 100}%`
            }}
          />
        ))}
      </div>

      {/* Concentric ripples */}
      <div className="ripples-container">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="ripple"
            style={{
              animationDelay: `${i * 0.6}s`
            }}
          />
        ))}
      </div>

      {/* Pulsing orb */}
      <div className="pulse-orb" />
    </div>
  );
};

// 3. 赛博算命 - Neon Cyberpunk with Matrix Rain
export const CyberFortuneBackground: React.FC = () => {
  // Generate random characters for matrix effect
  const matrixChars = '01卦易命运吉凶福祸阴阳五行天地人'.split('');

  return (
    <div className="card-bg cyber-fortune-bg" data-emoji="🔮">
      {/* Matrix rain columns */}
      <div className="matrix-container">
        {[...Array(20)].map((_, colIndex) => (
          <div
            key={colIndex}
            className="matrix-column"
            style={{
              left: `${(colIndex / 20) * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          >
            {[...Array(15)].map((_, charIndex) => (
              <span
                key={charIndex}
                className="matrix-char"
                style={{
                  animationDelay: `${charIndex * 0.1}s`
                }}
              >
                {matrixChars[Math.floor(Math.random() * matrixChars.length)]}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Glitch overlay */}
      <div className="glitch-overlay glitch-1" />
      <div className="glitch-overlay glitch-2" />

      {/* Hexagonal grid pattern */}
      <svg className="hex-pattern" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
            <polygon
              points="10,0 20,5 20,12.32 10,17.32 0,12.32 0,5"
              fill="none"
              stroke="rgba(0, 255, 255, 0.15)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#hexagons)" />
      </svg>

      {/* Neon scanner line */}
      <div className="scanner-line" />
    </div>
  );
};

// 4. 高情商回复 - Conversational Flow with Soft Bubbles
export const HighEQBackground: React.FC = () => {
  return (
    <div className="card-bg high-eq-bg" data-emoji="💬">
      {/* Floating gradient bubbles */}
      <div className="bubbles-container">
        {[
          { size: 180, x: 15, y: 20, delay: 0, duration: 8 },
          { size: 140, x: 70, y: 15, delay: 1.5, duration: 10 },
          { size: 220, x: 50, y: 60, delay: 0.8, duration: 12 },
          { size: 160, x: 85, y: 55, delay: 2, duration: 9 },
          { size: 120, x: 25, y: 75, delay: 1, duration: 11 },
          { size: 100, x: 60, y: 85, delay: 2.5, duration: 7 }
        ].map((bubble, i) => (
          <div
            key={i}
            className="gradient-bubble"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`
            }}
          />
        ))}
      </div>

      {/* Curved flowing lines */}
      <svg className="flow-lines" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgba(139, 92, 246, 0)', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: 'rgba(139, 92, 246, 0.4)', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(139, 92, 246, 0)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: 'rgba(59, 130, 246, 0.4)', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <path className="flow-path flow-path-1"
              d="M 0,150 Q 200,100 400,150 T 800,150"
              stroke="url(#flowGrad1)"
              strokeWidth="3"
              fill="none" />

        <path className="flow-path flow-path-2"
              d="M 0,300 Q 200,350 400,300 T 800,300"
              stroke="url(#flowGrad2)"
              strokeWidth="3"
              fill="none" />

        <path className="flow-path flow-path-3"
              d="M 0,450 Q 200,400 400,450 T 800,450"
              stroke="url(#flowGrad1)"
              strokeWidth="3"
              fill="none" />
      </svg>

      {/* Soft light spots */}
      <div className="light-spots">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="light-spot"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
              animationDelay: `${i * 0.4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Export all backgrounds as a collection
export const FeatureCardBackgrounds = {
  BlessingText: BlessingTextBackground,
  VoiceCard: VoiceCardBackground,
  CyberFortune: CyberFortuneBackground,
  HighEQ: HighEQBackground
};

export default FeatureCardBackgrounds;
