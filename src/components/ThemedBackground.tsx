import React from 'react';
import { useTheme } from '../context/ThemeContext';
import AnimatedSVGBackground from './AnimatedSVGBackground';

const ThemedBackground: React.FC = () => {
  const { currentTheme } = useTheme();

  // Разные фоновые компоненты для разных тем
  const getBackgroundComponent = () => {
    switch (currentTheme) {
      case 'black-gold':
        return <BlackGoldBackground />;
      case 'emerald-elegance':
        return <EmeraldBackground />;
      default:
        return <AnimatedSVGBackground />;
    }
  };

  return (
    <>
      {getBackgroundComponent()}
      <div 
        className="absolute inset-0 z-10"
        style={{ 
          background: currentTheme === 'black-gold' 
            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 25%, rgba(45, 45, 45, 0.95) 50%, rgba(26, 26, 26, 0.95) 75%, rgba(0, 0, 0, 0.95) 100%)'
            : currentTheme === 'emerald-elegance'
            ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(6, 95, 70, 0.95) 25%, rgba(4, 120, 87, 0.95) 50%, rgba(6, 95, 70, 0.95) 75%, rgba(6, 78, 59, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 25%, rgba(51, 65, 85, 0.95) 50%, rgba(30, 41, 59, 0.95) 75%, rgba(15, 23, 42, 0.95) 100%)'
        }}
      />
    </>
  );
};

// Чёрно-золотой фон
const BlackGoldBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1820 1080" 
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              .gold-lines {
                fill: none;
                opacity: 0.15;
                stroke: #fbbf24;
                stroke-width: 6;
                stroke-miterlimit: 10;
                animation: goldPulse 8s ease-in-out infinite;
              }
              
              .dark-gold-lines {
                fill: none;
                opacity: 0.08;
                stroke: #d97706;
                stroke-width: 4;
                stroke-miterlimit: 10;
                stroke-dasharray: 100;
                stroke-dashoffset: 400;
                animation: goldFlow 12s ease-in-out infinite;
                animation-delay: 1s;
              }
              
              @keyframes goldPulse {
                0%, 100% { opacity: 0.15; }
                50% { opacity: 0.25; }
              }
              
              @keyframes goldFlow {
                0% { stroke-dashoffset: 400; opacity: 0.08; }
                50% { stroke-dashoffset: 0; opacity: 0.15; }
                100% { stroke-dashoffset: -400; opacity: 0.08; }
              }
            `}
          </style>
        </defs>
        
        <g className="gold-lines">
          <line x1="100" y1="100" x2="300" y2="300"/>
          <line x1="500" y1="200" x2="700" y2="400"/>
          <line x1="900" y1="150" x2="1100" y2="350"/>
          <line x1="1300" y1="250" x2="1500" y2="450"/>
          <line x1="200" y1="600" x2="400" y2="800"/>
          <line x1="600" y1="700" x2="800" y2="900"/>
          <line x1="1000" y1="650" x2="1200" y2="850"/>
          <line x1="1400" y1="750" x2="1600" y2="950"/>
        </g>
        
        <g className="dark-gold-lines">
          <line x1="150" y1="50" x2="350" y2="250"/>
          <line x1="550" y1="150" x2="750" y2="350"/>
          <line x1="950" y1="100" x2="1150" y2="300"/>
          <line x1="1350" y1="200" x2="1550" y2="400"/>
          <line x1="250" y1="550" x2="450" y2="750"/>
          <line x1="650" y1="650" x2="850" y2="850"/>
          <line x1="1050" y1="600" x2="1250" y2="800"/>
          <line x1="1450" y1="700" x2="1650" y2="900"/>
        </g>
        
        {/* Золотые частицы */}
        <defs>
          <radialGradient id="goldParticle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        </defs>
        
        <circle cx="200" cy="200" r="3" fill="url(#goldParticle)" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="800" cy="300" r="2" fill="url(#goldParticle)" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="1400" cy="500" r="4" fill="url(#goldParticle)" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="5s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};

// Изумрудный фон
const EmeraldBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1820 1080" 
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              .emerald-lines {
                fill: none;
                opacity: 0.12;
                stroke: #10b981;
                stroke-width: 5;
                stroke-miterlimit: 10;
                animation: emeraldWave 10s ease-in-out infinite;
              }
              
              .mint-lines {
                fill: none;
                opacity: 0.08;
                stroke: #34d399;
                stroke-width: 3;
                stroke-miterlimit: 10;
                stroke-dasharray: 80;
                stroke-dashoffset: 320;
                animation: mintFlow 14s ease-in-out infinite;
                animation-delay: 2s;
              }
              
              .cyan-lines {
                fill: none;
                opacity: 0.06;
                stroke: #06b6d4;
                stroke-width: 2;
                stroke-miterlimit: 10;
                animation: cyanGlow 6s ease-in-out infinite;
                animation-delay: 3s;
              }
              
              @keyframes emeraldWave {
                0%, 100% { opacity: 0.12; }
                50% { opacity: 0.2; }
              }
              
              @keyframes mintFlow {
                0% { stroke-dashoffset: 320; opacity: 0.08; }
                50% { stroke-dashoffset: 0; opacity: 0.15; }
                100% { stroke-dashoffset: -320; opacity: 0.08; }
              }
              
              @keyframes cyanGlow {
                0%, 100% { opacity: 0.06; }
                50% { opacity: 0.12; }
              }
            `}
          </style>
        </defs>
        
        <g className="emerald-lines">
          <path d="M100,200 Q300,100 500,200 T900,200"/>
          <path d="M200,400 Q400,300 600,400 T1000,400"/>
          <path d="M300,600 Q500,500 700,600 T1100,600"/>
          <path d="M400,800 Q600,700 800,800 T1200,800"/>
        </g>
        
        <g className="mint-lines">
          <path d="M150,150 Q350,50 550,150 T950,150"/>
          <path d="M250,350 Q450,250 650,350 T1050,350"/>
          <path d="M350,550 Q550,450 750,550 T1150,550"/>
          <path d="M450,750 Q650,650 850,750 T1250,750"/>
        </g>
        
        <g className="cyan-lines">
          <circle cx="300" cy="300" r="50" fill="none"/>
          <circle cx="700" cy="500" r="40" fill="none"/>
          <circle cx="1100" cy="700" r="60" fill="none"/>
          <circle cx="1500" cy="300" r="35" fill="none"/>
        </g>
        
        {/* Изумрудные частицы */}
        <defs>
          <radialGradient id="emeraldParticle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>
        </defs>
        
        <circle cx="400" cy="250" r="3" fill="url(#emeraldParticle)" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="900" cy="450" r="2" fill="url(#emeraldParticle)" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="7s" repeatCount="indefinite"/>
        </circle>
        <circle cx="1300" cy="650" r="4" fill="url(#emeraldParticle)" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
};

export default ThemedBackground;