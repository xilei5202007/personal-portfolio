/* Original WebGL point projection study. No animation loop or event ownership. */
export function createProjectionRenderer(canvas, geometry) {
  'use strict';
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: true, premultipliedAlpha: true,
    depth: false, stencil: false, preserveDrawingBuffer: false
  });
  if (!gl) throw new Error('此设备未能创建 WebGL 投影，请使用静态预览。');
  const count = geometry.count || geometry.positions.length / 3;
  const parts = geometry.parts || Float32Array.from(geometry.groups, group => group === 2 ? 3 : 1);
  const fields = [
    ['aPosition', geometry.positions, 3], ['aNormal', geometry.normals, 3],
    ['aTone', geometry.tones, 1], ['aGroup', geometry.groups, 1],
    ['aSeed', geometry.seeds, 1], ['aPart', parts, 1]
  ];
  if (!Number.isInteger(count) || count < 1 || fields.some(([, data, size]) =>
    !(data instanceof Float32Array) || data.length !== count * size)) {
    throw new Error('点云数据不完整，无法创建投影。');
  }
  const programs = [], buffers = [], shaders = [];
  let disposed = false;
  function compile(source, type) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('投影着色器无法分配。');
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = (gl.getShaderInfoLog(shader) || '未知错误').slice(0, 250);
      throw new Error('投影着色器编译失败：' + info);
    }
    return shader;
  }
  function program(vertex, fragment) {
    const item = gl.createProgram();
    if (!item) throw new Error('投影程序无法分配。');
    programs.push(item);
    gl.attachShader(item, compile(vertex, gl.VERTEX_SHADER));
    gl.attachShader(item, compile(fragment, gl.FRAGMENT_SHADER));
    gl.linkProgram(item);
    if (!gl.getProgramParameter(item, gl.LINK_STATUS)) {
      throw new Error('投影程序链接失败：' +
        (gl.getProgramInfoLog(item) || '未知错误').slice(0, 250));
    }
    return item;
  }
  function buffer(data) {
    const item = gl.createBuffer();
    if (!item) throw new Error('投影缓冲区无法分配。');
    buffers.push(item);
    gl.bindBuffer(gl.ARRAY_BUFFER, item);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return item;
  }
  function uniformMap(item, names) {
    const map = {};
    names.forEach(name => { map[name] = gl.getUniformLocation(item, name); });
    return map;
  }
  const pointVertex = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute float aTone;
    attribute float aGroup;
    attribute float aSeed;
    attribute float aPart;
    uniform vec3 uCenter;
    uniform float uScale;
    uniform mat3 uRotation;
    uniform float uCamera;
    uniform float uAspect;
    uniform float uFocal;
    uniform float uDpr;
    uniform float uPointSize;
    uniform vec2 uYRange;
    uniform vec2 uDepthRange;
    uniform float uPass;
    uniform float uPhase;
    uniform float uProgress;
    uniform float uTime;
    uniform float uGlitch;
    uniform float uStoryProgress;
    uniform float uStoryMode;
    uniform vec3 uStoryOrigin;
    uniform float uStoryReach;
    varying float vAlpha;
    varying float vTone;
    varying float vAccent;
    float hash(float value) { return fract(sin(value * 127.1) * 43758.5453); }
    void main() {
      vec3 local = (aPosition - uCenter) * uScale;
      float y = (local.y - uYRange.x) / max(0.001, uYRange.y - uYRange.x);
      float visibility = 1.0;
      float band = 0.0;
      float temporal = 1.0;
      if (uPhase > 0.5) {
        float layer = mod(floor(aGroup + 0.5), 3.0);
        float cutoff = 1.12 - uProgress * 1.31 + layer * 0.035 + aSeed * 0.012;
        band = 1.0 - smoothstep(0.006, 0.035, abs(y - cutoff));
        if (uPhase < 1.5) {
          visibility = smoothstep(cutoff - 0.025, cutoff + 0.025, y);
          local.y -= (1.0 - visibility) * 0.035;
        } else {
          visibility = 1.0 - smoothstep(cutoff - 0.035, cutoff + 0.075, y);
          float release = smoothstep(cutoff - 0.12, cutoff + 0.06, y);
          local.y -= release * (0.035 + aSeed * 0.09);
          local.x += (aSeed - 0.5) * release * 0.028;
        }
        float gate = sin(clamp(uProgress, 0.0, 1.0) * 3.14159265);
        float slice = floor(y * 31.0);
        float tick = floor(uTime * 18.0);
        float disturbance = hash(slice * 3.17 + tick * 0.19);
        local.x += (disturbance - 0.5) * step(0.83, disturbance)
                   * 0.055 * gate * uGlitch;
        temporal = 0.94 + 0.06 * sin(aSeed * 41.0 + uTime * 13.0);
      }
      vec3 view = uRotation * local;
      float distance = max(0.15, uCamera - view.z);
      float depth = clamp((view.z - uDepthRange.x) /
                    max(0.001, uDepthRange.y - uDepthRange.x), 0.0, 0.99999);
      float pass = floor(depth * 6.0);
      vec3 normal = uRotation * aNormal;
      float validNormal = step(0.1, dot(aNormal, aNormal));
      // Suppress reverse surfaces so the gate aperture and roof tiers do not fill with haze.
      float facing = mix(0.82, 0.065 + 0.935 * smoothstep(-0.12, 0.78, normal.z + 0.32 * max(0.0, normal.y)), validNormal);
      float sideLight = 0.83 + 0.17 * max(0.0, normal.x * -0.5 + normal.y * 0.8);
      float proximity = 0.48 + 0.52 * pow(depth, 0.85);
      float quiet = 1.0 - step(0.5, aPart);
      float contour = step(1.5, aPart) * (1.0 - step(2.5, aPart));
      float token = step(2.5, aPart) * (1.0 - step(3.5, aPart));
      float cloth = step(3.5, aPart);
      float roleOpacity = 0.92 - quiet * 0.59 + contour * 0.24 + token * 0.30 - cloth * 0.26;
      vAlpha = min(0.98, visibility * facing * proximity * temporal * roleOpacity);
      vTone = clamp((0.24 + clamp(aTone, 0.0, 1.0) * 0.72 + contour * 0.08 + token * 0.08) * sideLight, 0.0, 1.0);
      vAccent = max(band * 0.92, token * 0.08);
      if (uPhase < 0.5 && uStoryProgress > 0.0 && uStoryProgress < 1.0) {
        float p = uStoryProgress;
        float emit = smoothstep(0.01, 0.09, p) * (1.0 - smoothstep(0.23, 0.35, p));
        float radius = length(local - uStoryOrigin) / max(0.01, uStoryReach);
        float delay = aGroup < 0.5 ? 0.0 : 0.07;
        float front = (p - 0.17 - delay) / 0.64;
        float wave = (1.0 - smoothstep(0.018, 0.095, abs(radius - front)))
                     * smoothstep(0.16, 0.23, p) * (1.0 - smoothstep(0.90, 1.0, p));
        float response = wave * (1.0 - token) * (1.0 - quiet * 0.9);
        float story = max(emit * token, response * (0.78 + contour * 0.22));
        story = max(story, emit * cloth * 0.22);
        if (uStoryMode > 0.5 && uStoryMode < 1.5) {
          float travel = max(0.0, uStoryOrigin.z - local.z) / max(0.01, uStoryReach * 0.66);
          float riverFront = (p - 0.25) / 0.48;
          float river = (1.0 - smoothstep(0.03, 0.16, abs(travel - riverFront)))
                        * smoothstep(0.22, 0.30, p) * (1.0 - smoothstep(0.68, 0.77, p));
          float city = smoothstep(0.62, 0.74, p) * (1.0 - smoothstep(0.85, 1.0, p));
          story = max(emit * token, river * contour * (1.0 - step(0.5, aGroup)));
          story = max(story, city * step(0.5, aGroup) * (1.0 - step(1.5, aGroup)) * (0.6 + contour * 0.4));
        } else if (uStoryMode > 1.5) {
          float centerPulse = emit * (1.0 - smoothstep(0.07, 0.18, radius));
          story = max(centerPulse, response * (0.28 + contour * 0.72));
        }
        vAccent = max(vAccent, story * 0.94);
        vAlpha = min(1.0, vAlpha * (1.0 + story * 0.45));
        vTone = min(1.0, vTone + story * 0.12);
      }
      gl_Position = vec4(view.x * uFocal / uAspect,
                         view.y * uFocal, 0.0, distance);
      if (abs(pass - uPass) > 0.25 || visibility < 0.005) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
      float perspectiveSize = clamp(uCamera / distance, 0.72, 1.35);
      gl_PointSize = uPointSize * uDpr * perspectiveSize
                     * (0.91 + aSeed * 0.18);
    }
  `;
  const pointFragment = `
    precision mediump float;
    uniform vec3 uForeground;
    uniform vec3 uBackground;
    uniform vec3 uAccent;
    varying float vAlpha;
    varying float vTone;
    varying float vAccent;
    void main() {
      float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
      if (radius >= 1.0) discard;
      float feather = 1.0 - smoothstep(0.35, 1.0, radius);
      float core = 1.0 - smoothstep(0.0, 0.48, radius);
      float opacity = (0.60 + core * 0.34) * feather * vAlpha;
      vec3 silver = mix(uBackground, uForeground, vTone);
      vec3 color = mix(silver, uAccent, vAccent);
      gl_FragColor = vec4(color * opacity, opacity);
    }
  `;
  const lineVertex = `
    precision highp float;
    attribute vec3 aPosition;
    uniform mat3 uRotation;
    uniform float uCamera;
    uniform float uAspect;
    uniform float uFocal;
    uniform float uScanY;
    uniform vec2 uScanCenter;
    uniform vec2 uScanSize;
    void main() {
      vec3 local = vec3(uScanCenter.x + aPosition.x * uScanSize.x,
                        uScanY, uScanCenter.y + aPosition.z * uScanSize.y);
      vec3 view = uRotation * local;
      gl_Position = vec4(view.x * uFocal / uAspect,
                         view.y * uFocal, 0.0, max(0.15, uCamera - view.z));
    }
  `;
  const lineFragment = `
    precision mediump float;
    uniform vec3 uAccent;
    uniform float uOpacity;
    void main() {
      gl_FragColor = vec4(uAccent * uOpacity, uOpacity);
    }
  `;
  let pointProgram, lineProgram, attributes, pointUniforms, lineUniforms;
  let lineBuffer, lineAttribute;
  const min = geometry.bounds.min, max = geometry.bounds.max;
  if (!Array.isArray(min) || !Array.isArray(max) || min.length !== 3 || max.length !== 3 ||
      min.some((value, i) => !Number.isFinite(value) || !Number.isFinite(max[i]) || value > max[i])) {
    throw new Error('点云边界无效，无法匹配投影画幅。');
  }
  const center = min.map((value, i) => (value + max[i]) / 2);
  const span = max.map((value, i) => value - min[i]);
  const scale = 2.8 / Math.max(0.001, ...span);
  const half = span.map(value => value * scale / 2);
  const source = Array.isArray(geometry.storyOrigin) && geometry.storyOrigin.length === 3 &&
    geometry.storyOrigin.every(Number.isFinite) ? geometry.storyOrigin : center;
  const storyOrigin = source.map((value, axis) => (value - center[axis]) * scale);
  let storyReach = 0;
  for (let i = 0; i < count; i += 1) {
    storyReach = Math.max(storyReach, Math.hypot(
      (geometry.positions[i * 3] - source[0]) * scale,
      (geometry.positions[i * 3 + 1] - source[1]) * scale,
      (geometry.positions[i * 3 + 2] - source[2]) * scale));
  }
  const minPitch = -10 * Math.PI / 180, maxPitch = 70 * Math.PI / 180;
  const defaultPitch = Number.isFinite(geometry.pitch)
    ? Math.max(minPitch, Math.min(maxPitch, geometry.pitch)) : 0.19;
  let pitch = defaultPitch, cp = Math.cos(pitch), sp = Math.sin(pitch);
  const focal = 1 / Math.tan(34 * Math.PI / 360);
  const margin = 0.92;
  let cssWidth = 1, cssHeight = 1, dpr = 1, aspect = 1, camera = 6, pointSize = 2;
  const rotation = new Float32Array(9);
  // Each point sweeps a horizontal circle as yaw changes. The convex hull of
  // (circle radius, height) retains every support maximum of that swept subject.
  // Build it once, rather than visiting tens of thousands of points while dragging.
  const orbitSamples = [];
  for (let i = 0; i < count; i += 1) {
    // Dim ground texture may feather beyond the stage; identifiable subjects may not.
    if (parts[i] < 0.5) continue;
    const x = (geometry.positions[i * 3] - center[0]) * scale;
    const y = (geometry.positions[i * 3 + 1] - center[1]) * scale;
    const z = (geometry.positions[i * 3 + 2] - center[2]) * scale;
    orbitSamples.push([Math.hypot(x, z), y]);
  }
  orbitSamples.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross2 = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const lower = [], upper = [];
  for (const point of orbitSamples) {
    while (lower.length > 1 && cross2(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  for (let i = orbitSamples.length - 1; i >= 0; i -= 1) {
    const point = orbitSamples[i];
    while (upper.length > 1 && cross2(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  const orbitProfile = orbitSamples.length > 1
    ? lower.slice(0, -1).concat(upper.slice(0, -1)) : orbitSamples.slice();
  orbitSamples.length = 0;
  function fitActualSurface() {
    const spriteRadius = pointSize * 1.35 * 1.09 / 2;
    const kx = focal / (aspect * Math.max(0.5, margin - spriteRadius * 2 / cssWidth));
    const ky = focal / Math.max(0.5, margin - spriteRadius * 2 / cssHeight);
    let distance = 0.4;
    const horizontal = Math.hypot(cp, kx);
    for (const [radius, y] of orbitProfile) {
      // Exact extrema over 360 degrees of yaw, continuous with respect to pitch.
      // This keeps horizontal dragging at a fixed distance and adapts only when
      // the vertical angle changes, without turning the subject back into a box.
      distance = Math.max(distance,
        sp * y + cp * radius + 0.4,
        sp * y + horizontal * radius,
        (sp + ky * cp) * y + Math.abs(cp - ky * sp) * radius,
        (sp - ky * cp) * y + Math.abs(cp + ky * sp) * radius);
    }
    return distance * 1.008;
  }
  // Scan-plane boundaries follow occupied height slices instead of empty box corners.
  const scanSlices = Array.from({ length: 32 }, () => [Infinity, Infinity, -Infinity, -Infinity]);
  for (let i = 0; i < count; i += 1) {
    const x = (geometry.positions[i * 3] - center[0]) * scale;
    const y = (geometry.positions[i * 3 + 1] - center[1]) * scale;
    const z = (geometry.positions[i * 3 + 2] - center[2]) * scale;
    const slot = Math.max(0, Math.min(31, Math.floor((y + half[1]) / (half[1] * 2) * 32)));
    const slice = scanSlices[slot];
    slice[0] = Math.min(slice[0], x); slice[1] = Math.min(slice[1], z);
    slice[2] = Math.max(slice[2], x); slice[3] = Math.max(slice[3], z);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    buffers.forEach(item => gl.deleteBuffer(item));
    programs.forEach(item => gl.deleteProgram(item));
    shaders.forEach(item => gl.deleteShader(item));
  }
  try {
    pointProgram = program(pointVertex, pointFragment);
    lineProgram = program(lineVertex, lineFragment);
    attributes = fields.map(([name, data, size]) => ({
      location: gl.getAttribLocation(pointProgram, name), buffer: buffer(data), size
    }));
    pointUniforms = uniformMap(pointProgram, [
      'uCenter', 'uScale', 'uRotation', 'uCamera', 'uAspect', 'uFocal',
      'uDpr', 'uPointSize', 'uYRange', 'uDepthRange', 'uPass', 'uPhase',
      'uProgress', 'uTime', 'uGlitch', 'uForeground', 'uBackground', 'uAccent',
      'uStoryProgress', 'uStoryMode', 'uStoryOrigin', 'uStoryReach'
    ]);
    lineUniforms = uniformMap(lineProgram, [
      'uRotation', 'uCamera', 'uAspect', 'uFocal', 'uScanY', 'uScanCenter', 'uScanSize', 'uAccent', 'uOpacity'
    ]);
    lineBuffer = buffer(new Float32Array([
      -1, 0, -1, 1, 0, -1,
       1, 0, -1, 1, 0, 1,
       1, 0, 1, -1, 0, 1,
      -1, 0, 1, -1, 0, -1
    ]));
    lineAttribute = gl.getAttribLocation(lineProgram, 'aPosition');
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  } catch (error) {
    dispose();
    throw error;
  }
  function resize(width, height, requestedDpr) {
    if (disposed) return;
    cssWidth = Math.max(1, Number(width) || 1);
    cssHeight = Math.max(1, Number(height) || 1);
    dpr = Math.max(1, Math.min(2, Number(requestedDpr) || 1));
    aspect = cssWidth / cssHeight;
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const density = Math.max(0.78, Math.min(1.12, Math.sqrt(22000 / count)));
    pointSize = Math.max(1.7, Math.min(2.7, (2.0 + Math.min(cssWidth, 900) / 1200) * density));
    camera = fitActualSurface();
  }
  function draw(options) {
    if (disposed || gl.isContextLost()) return;
    const input = options || {};
    const yaw = (Number.isFinite(input.yaw) ? input.yaw % 360 : 0) * Math.PI / 180;
    const nextPitch = Number.isFinite(input.pitch)
      ? Math.max(minPitch, Math.min(maxPitch, input.pitch)) : defaultPitch;
    if (nextPitch !== pitch) {
      pitch = nextPitch; cp = Math.cos(pitch); sp = Math.sin(pitch);
      camera = fitActualSurface();
    }
    const c = Math.cos(yaw), s = Math.sin(yaw);
    rotation.set([c, sp * s, -cp * s, 0, cp, sp, s, -sp * c, cp * c]);
    const distance = camera;
    // The centered box's depth extent is the support of its half-sizes along
    // the current view direction; both yaw and pitch affect the six slices.
    const maxDepth = Math.abs(cp * s) * half[0] + Math.abs(sp) * half[1] + Math.abs(cp * c) * half[2];
    const minDepth = -maxDepth;
    const phase = input.phase === 'reveal' ? 1 : input.phase === 'dissolve' ? 2 : 0;
    const progress = Math.max(0, Math.min(1, Number(input.progress) || 0));
    const foreground = input.foreground || [0.86, 0.88, 0.90];
    const accent = input.accent || foreground;
    const background = input.background || [0, 0, 0];
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pointProgram);
    attributes.forEach(attribute => {
      gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
      gl.enableVertexAttribArray(attribute.location);
      gl.vertexAttribPointer(attribute.location, attribute.size, gl.FLOAT, false, 0, 0);
    });
    const u = pointUniforms;
    gl.uniform3fv(u.uCenter, center);
    gl.uniform1f(u.uScale, scale);
    gl.uniformMatrix3fv(u.uRotation, false, rotation);
    gl.uniform1f(u.uCamera, distance);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform1f(u.uFocal, focal);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uPointSize, pointSize);
    gl.uniform2f(u.uYRange, -half[1], half[1]);
    gl.uniform2f(u.uDepthRange, minDepth, maxDepth);
    gl.uniform1f(u.uPhase, phase);
    gl.uniform1f(u.uProgress, progress);
    gl.uniform1f(u.uTime, Number(input.time) || 0);
    gl.uniform1f(u.uGlitch, input.glitch ? 1 : 0);
    gl.uniform1f(u.uStoryProgress, Math.max(0, Math.min(1, Number(input.storyProgress) || 0)));
    gl.uniform1f(u.uStoryMode, Number(geometry.storyMode) || 0);
    gl.uniform3fv(u.uStoryOrigin, storyOrigin);
    gl.uniform1f(u.uStoryReach, storyReach);
    gl.uniform3fv(u.uForeground, foreground);
    gl.uniform3fv(u.uBackground, background);
    gl.uniform3fv(u.uAccent, accent);
    // Six depth slices keep nearer surfaces in front while retaining transparent sprites.
    for (let pass = 0; pass < 6; pass += 1) {
      gl.uniform1f(u.uPass, pass);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    attributes.forEach(attribute => gl.disableVertexAttribArray(attribute.location));
    const scanY = -half[1] + (1.12 - progress * 1.31) * half[1] * 2;
    const scanSlot = Math.max(0, Math.min(31, Math.floor((scanY + half[1]) / (half[1] * 2) * 32)));
    const scanBounds = scanSlices[scanSlot];
    if (phase && progress > 0.095 && progress < 0.86 && half[1] > 0.001 && Number.isFinite(scanBounds[0])) {
      gl.useProgram(lineProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
      gl.enableVertexAttribArray(lineAttribute);
      gl.vertexAttribPointer(lineAttribute, 3, gl.FLOAT, false, 0, 0);
      const l = lineUniforms;
      gl.uniformMatrix3fv(l.uRotation, false, rotation);
      gl.uniform1f(l.uCamera, distance);
      gl.uniform1f(l.uAspect, aspect);
      gl.uniform1f(l.uFocal, focal);
      gl.uniform1f(l.uScanY, scanY);
      gl.uniform2f(l.uScanCenter, (scanBounds[0] + scanBounds[2]) / 2, (scanBounds[1] + scanBounds[3]) / 2);
      gl.uniform2f(l.uScanSize, (scanBounds[2] - scanBounds[0]) / 2, (scanBounds[3] - scanBounds[1]) / 2);
      gl.uniform3fv(l.uAccent, accent);
      gl.uniform1f(l.uOpacity, 0.34 * Math.sin(progress * Math.PI));
      gl.lineWidth(1);
      gl.drawArrays(gl.LINES, 0, 8);
      gl.disableVertexAttribArray(lineAttribute);
    }
  }
  resize(canvas.clientWidth || 736, canvas.clientHeight || 420, 1);
  return { draw, resize, dispose };
}
