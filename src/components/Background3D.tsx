"use client";

import { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
}

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize 3D points
    const pointCount = 100;
    const points: Point3D[] = [];
    const colors = [
      "rgba(56, 189, 248, 0.4)",  // cyan
      "rgba(167, 139, 250, 0.4)",  // purple
      "rgba(96, 165, 250, 0.4)",   // blue
      "rgba(129, 140, 248, 0.4)",  // indigo
    ];

    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 1,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to [-0.5, 0.5]
      mouseRef.current.targetX = (e.clientX / window.innerWidth) - 0.5;
      mouseRef.current.targetY = (e.clientY / window.innerHeight) - 0.5;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Subtle automatic camera rotation angle increments
    const angleY = 0.0005;
    const angleX = 0.0002;

    const fov = 800; // perspective focal length

    const render = () => {
      // Clear canvas to reveal body background and gradients
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate mouse position to prevent lag/jitter
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base rotation + mouse tilt offset
      const rotY = angleY + mouseRef.current.x * 0.002;
      const rotX = angleX + mouseRef.current.y * 0.002;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Project points to 2D
      const projected = points.map((p) => {
        // Rotate Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate X axis
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Wrap Z coordinate to keep points within bounds
        if (z2 < -fov) {
          z2 += 2000;
        } else if (z2 > 2000 - fov) {
          z2 -= 2000;
        }

        // Apply perspective division
        const scale = fov / (z2 + fov);
        // Add coordinates offset by mouse for interactive 3D parallax
        const screenX = x1 * scale + width / 2 + mouseRef.current.x * -70;
        const screenY = y2 * scale + height / 2 + mouseRef.current.y * -70;

        return {
          screenX,
          screenY,
          scale,
          z: z2,
          color: p.color,
          size: p.size,
          rotatedX: x1,
          rotatedY: y2,
          rotatedZ: z2,
        };
      });

      // Update original coordinates with rotated ones
      points.forEach((p, idx) => {
        const proj = projected[idx];
        p.x = proj.rotatedX;
        p.y = proj.rotatedY;
        p.z = proj.rotatedZ;
      });

      // Draw constellation lines between close points
      ctx.lineWidth = 0.55;
      const maxDistance = 280;

      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.screenX < 0 || p1.screenX > width || p1.screenY < 0 || p1.screenY > height) continue;

        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          if (p2.screenX < 0 || p2.screenX > width || p2.screenY < 0 || p2.screenY > height) continue;

          // Compute 3D distance
          const dx = p1.rotatedX - p2.rotatedX;
          const dy = p1.rotatedY - p2.rotatedY;
          const dz = p1.rotatedZ - p2.rotatedZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            // Opacity decreases with distance and depth scale
            const alpha = (1 - dist / maxDistance) * 0.12 * Math.min(p1.scale, p2.scale);
            if (alpha > 0) {
              ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.screenX, p1.screenY);
              ctx.lineTo(p2.screenX, p2.screenY);
              ctx.stroke();
            }
          }
        }
      }

      // Draw particle spheres
      projected.forEach((p) => {
        if (p.screenX < 0 || p.screenX > width || p.screenY < 0 || p.screenY > height) return;

        const radius = p.size * p.scale;
        if (radius <= 0) return;

        // Glow opacity based on depth scale
        const alpha = Math.min(1, p.scale) * 0.55;
        ctx.fillStyle = p.color.replace("0.4", alpha.toString());

        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // High-contrast bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 block"
    />
  );
}
