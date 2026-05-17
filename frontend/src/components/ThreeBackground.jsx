import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ThreeBackground — Floating 3D particles in the chat background.
 * Renders 180 softly glowing particles using THREE.Points with
 * BufferGeometry. Particles drift slowly with bounce-back physics.
 */
const PARTICLE_COUNT = 180;
const BOUNDS = { x: 8, y: 6, z: 4 };

const ThreeBackground = () => {
  const mountRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x667eea, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    const purple = new THREE.Color("#667eea");
    const teal = new THREE.Color("#22e87a");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * BOUNDS.x * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * BOUNDS.y * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2;

      // Random velocity (slow drift)
      velocities[i3] = (Math.random() - 0.5) * 0.004;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.004;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;

      // Mix colors
      const mix = Math.random();
      const color = purple.clone().lerp(teal, mix);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Particle material — circular texture generated on canvas
    const canvas2D = document.createElement("canvas");
    canvas2D.width = 32;
    canvas2D.height = 32;
    const ctx2D = canvas2D.getContext("2d");
    const gradient = ctx2D.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx2D.fillStyle = gradient;
    ctx2D.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas2D);

    const material = new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      map: texture,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Update position
        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];

        // Bounce-back at boundaries
        if (Math.abs(pos[i3]) > BOUNDS.x) velocities[i3] *= -1;
        if (Math.abs(pos[i3 + 1]) > BOUNDS.y) velocities[i3 + 1] *= -1;
        if (Math.abs(pos[i3 + 2]) > BOUNDS.z) velocities[i3 + 2] *= -1;
      }

      geometry.attributes.position.needsUpdate = true;

      // Slow rotation
      points.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup reference
    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <div
      ref={mountRef}
      className="three-bg-container"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
};

export default ThreeBackground;
