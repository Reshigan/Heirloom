import { useEffect, useRef } from 'react';
import { FRAGMENT_SHADER } from './fragmentShader';
import { waterRef } from './capture';

const VERTEX = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

/**
 * The living vessel — a full-bleed WebGL shader of family dye diffusing in lit
 * water (depth = time). Mounted ONCE as the global dark-theme backdrop
 * (ClothBackdrop), so it persists unbroken across route changes.
 *
 * GPU-hungry, so: dpr capped at 2, RAF paused when the tab is hidden, a single
 * static frame (no loop) when prefers-reduced-motion is set, and a CSS gradient
 * fallback if WebGL is unavailable. `preserveDrawingBuffer` is on so the book
 * cover can snapshot the water (captureWater).
 */
export default function WaterCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    waterRef.canvas = cv;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const opts: WebGLContextAttributes = {
      preserveDrawingBuffer: true,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    };
    const gl = (cv.getContext('webgl', opts) ||
      cv.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) {
      cv.style.background =
        'linear-gradient(180deg,#233331,#16292c 24%,#102327 52%,#0a181c 78%,#061013)';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    const draw = (tm: number) => {
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, tm);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(cv.clientWidth * dpr);
      cv.height = Math.floor(cv.clientHeight * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      if (reduce) draw(8.0); // re-paint the frozen frame after a resize
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

    // prefers-reduced-motion: paint one still frame, never animate.
    if (reduce) {
      draw(8.0);
      return () => {
        ro.disconnect();
        waterRef.canvas = null;
      };
    }

    const start = performance.now();
    let raf = 0;
    let running = true;
    const frame = () => {
      if (!running) return;
      draw((performance.now() - start) / 1000);
      raf = requestAnimationFrame(frame);
    };
    frame();

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        frame();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      waterRef.canvas = null;
    };
  }, []);

  return (
    <canvas
      id="gl"
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}
