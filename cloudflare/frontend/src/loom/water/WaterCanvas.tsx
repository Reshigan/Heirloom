import { useEffect, useRef } from 'react';
import { FRAGMENT_SHADER } from './fragmentShader';
import { waterRef } from './capture';
import { waterRamp, memberWaterDye, DYE_WATER_RGB } from './waterDyes';
import { familyApi, memoriesApi, lettersApi } from '../../services/api';
import { dyeFromMetadata, dyeForId, type Dye } from '../dye';
import { useAuthStore } from '../../stores/authStore';

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
    const uDepth = gl.getUniformLocation(prog, 'u_depth');
    const uRippleT = gl.getUniformLocation(prog, 'u_rippleT');
    const uTint = gl.getUniformLocation(prog, 'u_tint');
    const uTintAmt = gl.getUniformLocation(prog, 'u_tintAmt');
    const uPtr = gl.getUniformLocation(prog, 'u_ptr');
    const uPtrAmt = gl.getUniformLocation(prog, 'u_ptrAmt');

    // The reading tint (deep:tint): the water suffuses toward the open entry's
    // dye; eased in the loop so rooms bleed into each other like water, not UI.
    const tintCur: [number, number, number] = [0, 0, 0];
    let tintTarget: [number, number, number] = [0, 0, 0];
    let tintAmt = 0;
    let tintAmtTarget = 0;
    const onTint = (e: Event) => {
      const d = (e as CustomEvent<{ dye?: string } | null>).detail;
      const rgb = d?.dye ? (DYE_WATER_RGB as Record<string, [number, number, number]>)[d.dye] : undefined;
      if (rgb) { tintTarget = rgb; tintAmtTarget = 1; }
      else tintAmtTarget = 0;
      if (reduce) { tintAmt = tintAmtTarget; tintCur[0] = tintTarget[0]; tintCur[1] = tintTarget[1]; tintCur[2] = tintTarget[2]; draw(8.0); }
    };
    window.addEventListener('deep:tint', onTint);

    // The hand on the water (desktop, fine pointers, motion allowed): a slow-
    // following point of luminance. Raw listener → eased uniform; no React.
    const ptrCur: [number, number] = [0.5, 0.5];
    const ptrTarget: [number, number] = [0.5, 0.5];
    let ptrAmt = 0;
    const finePointer = window.matchMedia?.('(pointer: fine)').matches && !reduce;
    const onPointer = (e: PointerEvent) => {
      ptrTarget[0] = e.clientX / window.innerWidth;
      ptrTarget[1] = 1 - e.clientY / window.innerHeight;
      ptrAmt = 1;
    };
    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });

    // The settle ripple: deep:settled stamps a start time; the draw loop feeds
    // seconds-since into the shader, which renders one expanding, fading ring.
    // (Skipped under reduced motion — a static frame can't carry a ripple.)
    let rippleStart = -1;

    // Depth = time. Rooms dispatch deep:depth (0 surface … 1 deep past) as the
    // reader scrolls into older entries; the draw loop eases toward it so the
    // water deepens like a dive, not a switch.
    let depth = 0;
    let depthTarget = 0;
    const onDepth = (e: Event) => {
      const v = (e as CustomEvent<number>).detail;
      if (typeof v === 'number' && isFinite(v)) {
        depthTarget = Math.max(0, Math.min(1, v));
        if (reduce) { depth = depthTarget; draw(8.0); }
      }
    };
    window.addEventListener('deep:depth', onDepth);

    // The six ramp colours. Seed with the approved default ground (empty
    // family → waterRamp returns the verbatim original palette), then reseed
    // from the signed-in family's actual dyes once the roster loads.
    const uDye = Array.from({ length: 6 }, (_, i) => gl.getUniformLocation(prog, `u_dye${i}`));
    const setRamp = (ramp: [number, number, number][]) =>
      ramp.forEach(([r, g, b], i) => gl.uniform3f(uDye[i], r, g, b));
    setRamp(waterRamp([]));

    const draw = (tm: number) => {
      depth += (depthTarget - depth) * 0.035;
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, tm);
      gl.uniform1f(uDepth, depth);
      gl.uniform1f(uRippleT, rippleStart < 0 ? 999.0 : (performance.now() - rippleStart) / 1000);
      tintAmt += (tintAmtTarget - tintAmt) * 0.02;
      for (let i = 0; i < 3; i++) tintCur[i] += (tintTarget[i] - tintCur[i]) * 0.02;
      gl.uniform3f(uTint, tintCur[0], tintCur[1], tintCur[2]);
      gl.uniform1f(uTintAmt, tintAmt);
      const aspNow = cv.height > 0 ? cv.width / cv.height : 1;
      ptrCur[0] += (ptrTarget[0] - ptrCur[0]) * 0.025;
      ptrCur[1] += (ptrTarget[1] - ptrCur[1]) * 0.025;
      gl.uniform2f(uPtr, ptrCur[0] * aspNow, ptrCur[1]);
      gl.uniform1f(uPtrAmt, ptrAmt);
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

    // Reseed the ramp from what the family has actually lowered in — the most
    // recent entries' dyes LEAD the ramp (a fresh letter visibly re-tints the
    // water), member dyes fill behind them. Fire-and-forget: stays on the
    // default ground until data resolves; any failure leaves it untouched.
    let cancelled = false;
    const seedFromDeep = () => {
      Promise.allSettled([
        memoriesApi.getAll().catch(() => null),
        lettersApi.getAll().catch(() => null),
        familyApi.getAll().catch(() => null),
      ]).then(([memRes, letRes, famRes]) => {
        if (cancelled) return;
        const list = (r: PromiseSettledResult<any>): any[] => {
          if (r.status !== 'fulfilled' || !r.value) return [];
          const d = r.value.data;
          return Array.isArray(d) ? d : d?.data ?? d?.letters ?? d?.memories ?? [];
        };
        const entries = [...list(memRes), ...list(letRes)]
          .filter((e) => e && (e.createdAt || e.created_at))
          .sort((a, b) =>
            String(b.createdAt ?? b.created_at).localeCompare(String(a.createdAt ?? a.created_at)));
        const entryDyes: Dye[] = entries
          .slice(0, 9)
          .map((e) => dyeFromMetadata(e.metadata) ?? dyeForId(String(e.userId ?? e.user_id ?? e.id)));
        const roster: Array<{ id: string; dye?: string | null; pendingDeletion?: boolean }> =
          (list(famRes) as any) ?? [];
        const memberDyes = roster.filter((m) => !m.pendingDeletion).map(memberWaterDye);
        const dyes = [...entryDyes, ...memberDyes];
        if (!dyes.length) return;
        setRamp(waterRamp(dyes));
        if (reduce) draw(8.0); // static frame won't repaint itself — do it once
      });
    };
    if (useAuthStore.getState().isAuthenticated) seedFromDeep();
    // The first authed session signs in AFTER this canvas has mounted
    // (logged-out landing → sign-in), so re-seed when auth flips true — else the
    // family hue never lands until a full reload.
    const unsubAuth = useAuthStore.subscribe((s, prev) => {
      if (s.isAuthenticated && !prev.isAuthenticated) seedFromDeep();
    });
    // Something new settled into the Deep (any entry POST — see api.ts, which
    // fires this event) → the water takes up its dye while you watch.
    const onSettled = () => {
      if (!reduce) rippleStart = performance.now();
      if (useAuthStore.getState().isAuthenticated) seedFromDeep();
    };
    window.addEventListener('deep:settled', onSettled);

    // prefers-reduced-motion: paint one still frame, never animate.
    if (reduce) {
      draw(8.0);
      return () => {
        cancelled = true;
        unsubAuth();
        window.removeEventListener('deep:settled', onSettled);
        window.removeEventListener('deep:depth', onDepth);
        window.removeEventListener('deep:tint', onTint);
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
      cancelled = true;
      unsubAuth();
      window.removeEventListener('deep:settled', onSettled);
      window.removeEventListener('deep:depth', onDepth);
      window.removeEventListener('deep:tint', onTint);
      if (finePointer) window.removeEventListener('pointermove', onPointer);
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
