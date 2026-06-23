import { useEffect, useRef } from 'react'
import { FRAGMENT_SHADER } from './fragmentShader'
import { waterRef } from './capture'

const VERTEX = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'

/**
 * The living vessel. A full-viewport WebGL shader that runs behind the whole
 * app. `preserveDrawingBuffer` is on so the Volume cover can snapshot it.
 *
 * Production notes: this is GPU-hungry. Pause the RAF loop when the tab is
 * hidden (done below), and consider a pre-rendered fallback / reduced
 * resolution on low-end devices and when prefers-reduced-motion is set.
 */
export default function WaterCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    waterRef.canvas = cv

    const opts: WebGLContextAttributes = {
      preserveDrawingBuffer: true,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    }
    const gl = (cv.getContext('webgl', opts) ||
      cv.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null
    if (!gl) {
      cv.style.background =
        'linear-gradient(180deg,#233331,#16292c 24%,#102327 52%,#0a181c 78%,#061013)'
      return
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s))
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.floor(cv.clientWidth * dpr)
      cv.height = Math.floor(cv.clientHeight * dpr)
      gl.viewport(0, 0, cv.width, cv.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    const start = performance.now()
    let raf = 0
    let running = true
    const frame = () => {
      if (!running) return
      const tm = (performance.now() - start) / 1000
      gl.uniform2f(uRes, cv.width, cv.height)
      gl.uniform1f(uTime, tm)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(frame)
    }
    frame()

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        frame()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      waterRef.canvas = null
    }
  }, [])

  return <canvas id="gl" ref={ref} aria-hidden="true" />
}
