/**
 * ClothCanvas3D — world-first 3D textile cloth for Heirloom.
 *
 * Pure Three.js (no React Three Fiber) — minimal wrapper overhead.
 * Lazy-load this component: it pulls Three.js (~600KB).
 *
 * The cloth is a ShaderMaterial PlaneGeometry with:
 *  - Vertex shader: sinusoidal breathing displacement
 *  - Fragment shader: woven textile cross-hatch pattern
 *  - Weft threads: TubeGeometry along CatmullRomCurve3 per entry
 *  - Camera: slow drift backward + mouse parallax tilt
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ClothEntry {
  date: Date;
  dye: 'madder' | 'cochineal' | 'kermes' | 'saffron' | 'weld' | 'walnut' | 'oakgall' | 'woad' | 'indigo' | 'iron';
  locked?: boolean;
}

const DYE_HEX: Record<string, number> = {
  madder:    0xe84030,
  cochineal: 0xd42868,
  kermes:    0xf05268,
  saffron:   0xf5c832,
  weld:      0xedae2e,
  walnut:    0xa07040,
  oakgall:   0x7c5c4a,
  woad:      0x4898d8,
  indigo:    0x3878e8,
  iron:      0x4a4a46,
};

const VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 0.18 + uTime * 0.55) * 0.28
               + sin(pos.y * 0.22 + uTime * 0.40) * 0.18
               + sin((pos.x + pos.y) * 0.12 + uTime * 0.30) * 0.14;
    pos.z += wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  varying vec2 vUv;

  void main() {
    // Woven cross-hatch — warp and weft threads interleaved
    float warpFreq = 160.0;
    float weftFreq =  80.0;
    float warp = smoothstep(0.35, 0.50, fract(vUv.x * warpFreq))
               - smoothstep(0.50, 0.65, fract(vUv.x * warpFreq));
    float weft = smoothstep(0.35, 0.50, fract(vUv.y * weftFreq))
               - smoothstep(0.50, 0.65, fract(vUv.y * weftFreq));
    // Alternate over/under interlacing
    float overUnder = step(0.5, fract((floor(vUv.x * warpFreq) + floor(vUv.y * weftFreq)) * 0.5));
    float thread = mix(warp, weft, overUnder);
    // Ink base + subtle bone thread glints
    vec3 ink  = vec3(0.055, 0.055, 0.047);
    vec3 bone = vec3(0.957, 0.925, 0.847);
    vec3 warm = vec3(0.686, 0.478, 0.290);
    vec3 col  = mix(ink, mix(bone, warm, overUnder * 0.18), thread * 0.22);
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  entries: ClothEntry[];
  yearStart?: number;
  yearEnd?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ClothCanvas3D({
  entries,
  yearStart = 1952,
  yearEnd = 2026,
  className,
  style,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x0e0e0c);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0e0e0c, 22, 56);
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 600);
    camera.position.set(0, 1.5, 26);

    // ── Cloth surface ─────────────────────────────────────────────
    const clothW = 52, clothH = 22;
    const clothGeo = new THREE.PlaneGeometry(clothW, clothH, 240, 80);
    const clothMat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: { uTime: { value: 0 } },
      side: THREE.FrontSide,
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.rotation.x = -0.08;
    scene.add(cloth);

    // ── Weft threads (entries) ────────────────────────────────────
    const totalYears = yearEnd - yearStart;
    const threadGroup = new THREE.Group();
    scene.add(threadGroup);

    entries.forEach((e, i) => {
      const t = (e.date.getFullYear() + e.date.getMonth() / 12 - yearStart) / totalYears;
      if (t < 0 || t > 1) return;
      const xStart = -clothW / 2 + t * clothW - 0.1;
      const xEnd   = xStart + 0.22;
      const lane   = i % 7;
      const yBase  = (lane / 7 - 0.5) * clothH * 0.78;

      // Weft curve weaving through warp threads
      const pts: THREE.Vector3[] = [];
      const warpCount = 28;
      for (let w = 0; w <= warpCount; w++) {
        const wx = xStart + (w / warpCount) * (xEnd - xStart);
        const uo = w % 2 === 0 ? 0.08 : -0.08;
        pts.push(new THREE.Vector3(wx, yBase + uo, uo * 0.5 + 0.12));
      }

      const curve  = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 60, 0.045, 6, false);
      const color   = DYE_HEX[e.dye] ?? 0xf4ecd8;
      const opacity = e.locked ? 0.28 : 0.82;
      const tubeMat = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity,
        shininess: 24,
        specular: new THREE.Color(0xf4ecd8),
      });
      threadGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    });

    // ── Lighting ──────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xf4ecd8, 0.15));
    const dir = new THREE.DirectionalLight(0xf4ecd8, 0.4);
    dir.position.set(-10, 12, 18);
    scene.add(dir);

    // ── Mouse parallax ────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMove = (ev: MouseEvent) => {
      mouseX = (ev.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (ev.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouch = (ev: TouchEvent) => {
      if (ev.touches.length === 0) return;
      mouseX = (ev.touches[0].clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (ev.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mousemove', onMove);

    // ── Resize ────────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ───────────────────────────────────────────────────
    let raf: number;
    let tick = 0;
    const startZ = 32, targetZ = 24;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      tick += 0.008;
      clothMat.uniforms.uTime.value = tick;
      // Slow drift back over ~8 seconds
      const frac = Math.min(1, tick / 64);
      camera.position.z = startZ + (targetZ - startZ) * (1 - Math.pow(1 - frac, 3));
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.018;
      camera.position.y += (-mouseY * 0.6 + 1.5 - camera.position.y) * 0.018;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      clothGeo.dispose();
      clothMat.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', ...style }} />;
}
