'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

// Animated dotted surface background using Three.js.
// Renders a grid of points that ripple in a sine wave pattern.
// Sits fixed behind all content with pointer-events disabled so it never
// blocks clicks. Re-runs whenever the theme changes to update dot color.
export default function DottedSurface() {
  const mountRef = useRef(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // fully transparent background
    mount.appendChild(renderer.domElement);

    // ── Build the dot grid ──
    // 80 columns × 60 rows of evenly spaced points
    const cols = 80;
    const rows = 60;
    const spacing = 0.38;
    const positions = new Float32Array(cols * rows * 3);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = (row * cols + col) * 3;
        positions[idx]     = (col - cols / 2) * spacing;
        positions[idx + 1] = (row - rows / 2) * spacing;
        positions[idx + 2] = 0;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Dots are darker/subtler in dark mode, slightly bolder in light mode
    const isDark = resolvedTheme !== 'light';
    const material = new THREE.PointsMaterial({
      color: isDark ? 0x2d3748 : 0x94a3b8,
      size: 0.07,
      transparent: true,
      opacity: isDark ? 0.9 : 0.5,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Animation loop ──
    // Each dot's z-position is driven by a sine wave using its row/col index + time
    let animId;
    const posArr = geometry.attributes.position.array;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.0007;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = (row * cols + col) * 3;
          posArr[idx + 2] =
            Math.sin(t + col * 0.28) * 0.45 +
            Math.cos(t * 0.65 + row * 0.28) * 0.3;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();

    // ── Handle browser resize ──
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', handleResize);

    // ── Cleanup when component unmounts or theme changes ──
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [resolvedTheme]); // re-run when theme changes so dot color updates

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
