import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  active?: number;
  closest?: Point[];
  circle?: Circle;
}

interface Circle {
  pos: Point;
  radius: number;
  color: string;
  active?: number;
  draw: () => void;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);
  const targetRef = useRef({ x: 0, y: 0 });
  const animateHeaderRef = useRef(true);

  useEffect(() => {
    let width: number, height: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;

    const initHeader = () => {
      if (!canvasRef.current || !containerRef.current) return;

      width = window.innerWidth;
      height = window.innerHeight;
      targetRef.current = { x: width / 2, y: height / 2 };

      canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d')!;

      // create points
      pointsRef.current = [];
      for (let x = 0; x < width; x = x + width / 20) {
        for (let y = 0; y < height; y = y + height / 20) {
          const px = x + Math.random() * width / 20;
          const py = y + Math.random() * height / 20;
          const p: Point = { x: px, originX: px, y: py, originY: py };
          pointsRef.current.push(p);
        }
      }

      // for each point find the 5 closest points
      for (let i = 0; i < pointsRef.current.length; i++) {
        const closest: Point[] = [];
        const p1 = pointsRef.current[i];
        for (let j = 0; j < pointsRef.current.length; j++) {
          const p2 = pointsRef.current[j];
          if (!(p1 === p2)) {
            let placed = false;
            for (let k = 0; k < 5; k++) {
              if (!placed) {
                if (closest[k] === undefined) {
                  closest[k] = p2;
                  placed = true;
                }
              }
            }

            for (let k = 0; k < 5; k++) {
              if (!placed) {
                if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                  closest[k] = p2;
                  placed = true;
                }
              }
            }
          }
        }
        p1.closest = closest;
      }

      // assign a circle to each point
      for (const point of pointsRef.current) {
        const c = createCircle(point, 2 + Math.random() * 2, 'rgba(255,255,255,0.3)');
        point.circle = c;
      }
    };

    const createCircle = (pos: Point, rad: number, color: string): Circle => {
      return {
        pos,
        radius: rad,
        color,
        active: 0,
        draw() {
          if (!this.active) return;
          ctx.beginPath();
          ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = `rgba(156,217,249,${this.active})`;
          ctx.fill();
        }
      };
    };

    const mouseMove = (e: MouseEvent) => {
      let posx = 0, posy = 0;
      if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
      } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      targetRef.current.x = posx;
      targetRef.current.y = posy;
    };

    const scrollCheck = () => {
      if (document.body.scrollTop > height) {
        animateHeaderRef.current = false;
      } else {
        animateHeaderRef.current = true;
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    const animate = () => {
      if (animateHeaderRef.current && ctx) {
        ctx.clearRect(0, 0, width, height);
        for (const point of pointsRef.current) {
          // detect points in range
          const distance = Math.abs(getDistance(targetRef.current, point));
          if (distance < 4000) {
            point.active = 0.3;
            if (point.circle) point.circle.active = 0.6;
          } else if (distance < 20000) {
            point.active = 0.1;
            if (point.circle) point.circle.active = 0.3;
          } else if (distance < 40000) {
            point.active = 0.02;
            if (point.circle) point.circle.active = 0.1;
          } else {
            point.active = 0;
            if (point.circle) point.circle.active = 0;
          }

          drawLines(point);
          point.circle?.draw();
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawLines = (p: Point) => {
      if (!p.active || !p.closest) return;
      for (const closest of p.closest) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(closest.x, closest.y);
        ctx.strokeStyle = `rgba(156,217,249,${p.active})`;
        ctx.stroke();
      }
    };

    const shiftPoint = (p: Point) => {
      // Simple animation without TweenLite
      const duration = 1000 + Math.random() * 1000;
      const startTime = Date.now();
      const startX = p.x;
      const startY = p.y;
      const targetX = p.originX - 50 + Math.random() * 100;
      const targetY = p.originY - 50 + Math.random() * 100;

      const animatePoint = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (similar to Circ.easeInOut)
        const easeInOutCirc = (t: number) => {
          return t < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
        };

        const easedProgress = easeInOutCirc(progress);
        p.x = startX + (targetX - startX) * easedProgress;
        p.y = startY + (targetY - startY) * easedProgress;

        if (progress < 1) {
          requestAnimationFrame(animatePoint);
        } else {
          shiftPoint(p);
        }
      };

      requestAnimationFrame(animatePoint);
    };

    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    };

    // Initialize
    initHeader();
    animate();
    
    // Start point animations
    setTimeout(() => {
      for (const point of pointsRef.current) {
        shiftPoint(point);
      }
    }, 100);

    // Event listeners
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('scroll', scrollCheck);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 75%, #3b82f6 100%)'
        }}
      />
    </div>
  );
};

export default AnimatedBackground;