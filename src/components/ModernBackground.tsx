import React, { useEffect, useRef } from 'react';

const ModernBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create floating geometric shapes
    const createShape = (type: 'circle' | 'triangle' | 'square', delay: number) => {
      const shape = document.createElement('div');
      shape.className = `absolute opacity-10 pointer-events-none`;
      
      const size = Math.random() * 100 + 50;
      const startX = Math.random() * window.innerWidth;
      const startY = window.innerHeight + 100;
      
      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.left = `${startX}px`;
      shape.style.top = `${startY}px`;
      shape.style.animationDelay = `${delay}s`;
      
      switch (type) {
        case 'circle':
          shape.style.borderRadius = '50%';
          shape.style.background = 'linear-gradient(45deg, #3b82f6, #8b5cf6)';
          shape.className += ' floating';
          break;
        case 'triangle':
          shape.style.width = '0';
          shape.style.height = '0';
          shape.style.borderLeft = `${size/2}px solid transparent`;
          shape.style.borderRight = `${size/2}px solid transparent`;
          shape.style.borderBottom = `${size}px solid rgba(59, 130, 246, 0.3)`;
          shape.className += ' rotate-slow';
          break;
        case 'square':
          shape.style.background = 'linear-gradient(135deg, #06b6d4, #3b82f6)';
          shape.style.transform = 'rotate(45deg)';
          shape.className += ' pulse-glow';
          break;
      }
      
      container.appendChild(shape);
      
      // Remove shape after animation
      setTimeout(() => {
        if (container.contains(shape)) {
          container.removeChild(shape);
        }
      }, 15000);
    };

    // Create shapes periodically
    const interval = setInterval(() => {
      const shapes = ['circle', 'triangle', 'square'] as const;
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      createShape(randomShape, Math.random() * 2);
    }, 3000);

    // Initial shapes
    for (let i = 0; i < 5; i++) {
      const shapes = ['circle', 'triangle', 'square'] as const;
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      setTimeout(() => createShape(randomShape, 0), i * 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl morphing-blob"></div>
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl morphing-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl morphing-blob" style={{ animationDelay: '4s' }}></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900/80"></div>
    </div>
  );
};

export default ModernBackground;