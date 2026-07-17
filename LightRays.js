/**
 * LightRays — vanilla JS/WebGL port of the React Bits LightRays component.
 * No framework or build step required. Uses raw WebGL (no OGL dependency).
 *
 * Usage:
 *   const lr = new LightRays(containerElement, { raysColor: '#00ffff', ... });
 *   lr.destroy(); // cleanup
 */

(function (global) {
  'use strict';

  /* ── helpers ─────────────────────────────────────────────────── */

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
      : [1, 1, 1];
  }

  function getAnchorAndDir(origin, w, h) {
    const outside = 0.2;
    switch (origin) {
      case 'top-left':     return { anchor: [0,             -outside * h],      dir: [0,  1] };
      case 'top-right':    return { anchor: [w,             -outside * h],      dir: [0,  1] };
      case 'left':         return { anchor: [-outside * w,  0.5 * h],           dir: [1,  0] };
      case 'right':        return { anchor: [(1+outside)*w, 0.5 * h],           dir: [-1, 0] };
      case 'bottom-left':  return { anchor: [0,             (1+outside) * h],   dir: [0, -1] };
      case 'bottom-center':return { anchor: [0.5 * w,       (1+outside) * h],   dir: [0, -1] };
      case 'bottom-right': return { anchor: [w,             (1+outside) * h],   dir: [0, -1] };
      default:             return { anchor: [0.5 * w,       -outside * h],      dir: [0,  1] }; // top-center
    }
  }

  /* ── shaders ─────────────────────────────────────────────────── */

  const VERT_SRC = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const FRAG_SRC = `
precision highp float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2  sourceToCoord = coord - raySource;
  vec2  dirNorm       = normalize(sourceToCoord);
  float cosAngle      = dot(dirNorm, rayRefDirection);
  float distortedAngle= cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor  = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  float distance      = length(sourceToCoord);
  float maxDistance   = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff   = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse         = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
  float baseStrength  = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.30 + 0.20 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0);
  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }
  vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214,  21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991,  18.0234,  1.1 * raysSpeed);
  fragColor  = rays1 * 0.65 + rays2 * 0.55;
  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }
  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;
  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }
  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}`;

  /* ── WebGL helpers ───────────────────────────────────────────── */

  function createShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function createProgram(gl, vertSrc, fragSrc) {
    const vert = createShader(gl, gl.VERTEX_SHADER,   vertSrc);
    const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return prog;
  }

  /* ── LightRays class ─────────────────────────────────────────── */

  /**
   * @param {HTMLElement} container
   * @param {Object}      opts
   */
  function LightRays(container, opts) {
    opts = Object.assign({
      raysOrigin:     'top-center',
      raysColor:      '#ffffff',
      raysSpeed:      1,
      lightSpread:    0.5,
      rayLength:      1.0,
      pulsating:      false,
      fadeDistance:   1.0,
      saturation:     1.0,
      followMouse:    false,
      mouseInfluence: 0.5,
      noiseAmount:    0.0,
      distortion:     0.0,
    }, opts || {});

    this._container = container;
    this._opts      = opts;
    this._rafId     = null;
    this._mouse     = { x: 0.5, y: 0.5 };
    this._smoothMouse = { x: 0.5, y: 0.5 };
    this._gl        = null;
    this._prog      = null;
    this._uniforms  = {};
    this._canvas    = null;

    this._onResize  = this._resize.bind(this);
    this._onMouse   = this._handleMouse.bind(this);

    this._init();
  }

  LightRays.prototype._init = function () {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    // Clear any existing canvas we created
    const old = this._container.querySelector('canvas.lr-canvas');
    if (old) old.remove();
    canvas.classList.add('lr-canvas');
    this._container.appendChild(canvas);
    this._canvas = canvas;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
               canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) { console.warn('LightRays: WebGL not available'); return; }
    this._gl = gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const prog = createProgram(gl, VERT_SRC, FRAG_SRC);
    if (!prog) return;
    this._prog = prog;

    // Full-screen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    const names = ['iTime','iResolution','rayPos','rayDir','raysColor','raysSpeed',
                   'lightSpread','rayLength','pulsating','fadeDistance','saturation',
                   'mousePos','mouseInfluence','noiseAmount','distortion'];
    gl.useProgram(prog);
    names.forEach(n => { this._uniforms[n] = gl.getUniformLocation(prog, n); });

    this._resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    if (this._opts.followMouse) {
      window.addEventListener('mousemove', this._onMouse, { passive: true });
    }
    this._loop(0);
  };

  LightRays.prototype._resize = function () {
    const gl     = this._gl;
    const canvas = this._canvas;
    if (!gl || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = this._container.clientWidth;
    const h   = this._container.clientHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    const o = this._opts;
    const { anchor, dir } = getAnchorAndDir(o.raysOrigin, canvas.width, canvas.height);
    gl.useProgram(this._prog);
    gl.uniform2fv(this._uniforms.iResolution,  [canvas.width, canvas.height]);
    gl.uniform2fv(this._uniforms.rayPos,        anchor);
    gl.uniform2fv(this._uniforms.rayDir,        dir);
  };

  LightRays.prototype._handleMouse = function (e) {
    const rect = this._container.getBoundingClientRect();
    this._mouse.x = (e.clientX - rect.left) / rect.width;
    this._mouse.y = (e.clientY - rect.top)  / rect.height;
  };

  LightRays.prototype._loop = function (t) {
    const gl = this._gl;
    if (!gl) return;
    gl.useProgram(this._prog);
    const o = this._opts;
    const u = this._uniforms;

    // Smoothly interpolate mouse
    if (o.followMouse && o.mouseInfluence > 0) {
      const s = 0.92;
      this._smoothMouse.x = this._smoothMouse.x * s + this._mouse.x * (1 - s);
      this._smoothMouse.y = this._smoothMouse.y * s + this._mouse.y * (1 - s);
    }

    gl.uniform1f(u.iTime,          t * 0.001);
    gl.uniform3fv(u.raysColor,     hexToRgb(o.raysColor));
    gl.uniform1f(u.raysSpeed,      o.raysSpeed);
    gl.uniform1f(u.lightSpread,    o.lightSpread);
    gl.uniform1f(u.rayLength,      o.rayLength);
    gl.uniform1f(u.pulsating,      o.pulsating ? 1.0 : 0.0);
    gl.uniform1f(u.fadeDistance,   o.fadeDistance);
    gl.uniform1f(u.saturation,     o.saturation);
    gl.uniform2fv(u.mousePos,      [this._smoothMouse.x, this._smoothMouse.y]);
    gl.uniform1f(u.mouseInfluence, o.followMouse ? o.mouseInfluence : 0.0);
    gl.uniform1f(u.noiseAmount,    o.noiseAmount);
    gl.uniform1f(u.distortion,     o.distortion);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    this._rafId = requestAnimationFrame(this._loop.bind(this));
  };

  /** Update one or more options at runtime without recreating the WebGL context. */
  LightRays.prototype.setOptions = function (newOpts) {
    Object.assign(this._opts, newOpts);
    // If origin changed we need to recalc anchor/dir
    if (newOpts.raysOrigin) this._resize();
  };

  /** Fully destroy the instance and free GPU resources. */
  LightRays.prototype.destroy = function () {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize',    this._onResize);
    window.removeEventListener('mousemove', this._onMouse);
    const gl = this._gl;
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    this._gl = null;
    this._prog = null;
    this._canvas = null;
  };

  /* ── export ──────────────────────────────────────────────────── */
  global.LightRays = LightRays;

}(window));
