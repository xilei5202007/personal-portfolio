import assert from 'node:assert/strict';
import { createProjectionRenderer } from '../lib/projection/projection-renderer.js';
import { buildCommandProjection } from '../lib/projection/command-geometry.js';
import { buildMemoryProjection, buildTerrainProjection } from '../lib/projection/world-geometries.js';

function mockCanvas() {
  let programId = 0;
  const uniforms = [new Map(), new Map()];
  const gl = {
    ARRAY_BUFFER: 1, STATIC_DRAW: 2, VERTEX_SHADER: 3, FRAGMENT_SHADER: 4,
    COMPILE_STATUS: 5, LINK_STATUS: 6, DEPTH_TEST: 7, BLEND: 8,
    ONE: 9, ONE_MINUS_SRC_ALPHA: 10, FLOAT: 11, COLOR_BUFFER_BIT: 12,
    POINTS: 13, LINES: 14,
    createShader: () => ({}), createBuffer: () => ({}),
    createProgram: () => ({ id: programId++ }),
    getShaderParameter: () => true, getProgramParameter: () => true,
    getAttribLocation: () => 0,
    getUniformLocation: (program, name) => ({ program: program.id, name }),
    isContextLost: () => false,
    uniform1f: (location, value) => uniforms[location.program].set(location.name, value),
    uniform2f: (location, a, b) => uniforms[location.program].set(location.name, [a, b]),
    uniform3fv: (location, value) => uniforms[location.program].set(location.name, [...value]),
    uniformMatrix3fv: (location, transpose, value) => uniforms[location.program].set(location.name, [...value])
  };
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'linkProgram',
    'bindBuffer', 'bufferData', 'disable', 'depthMask', 'enable', 'blendFunc',
    'clearColor', 'viewport', 'clear', 'useProgram', 'enableVertexAttribArray',
    'vertexAttribPointer', 'drawArrays', 'disableVertexAttribArray', 'lineWidth',
    'deleteBuffer', 'deleteProgram', 'deleteShader']) gl[name] = () => {};
  return { canvas: { clientWidth: 736, clientHeight: 420, getContext: () => gl }, uniforms };
}

const radians = degrees => degrees * Math.PI / 180;
const scenes = [
  ['city', buildCommandProjection, .19],
  ['memory', buildMemoryProjection, .25],
  ['terrain', buildTerrainProjection, .5]
];
let projectedSubjects = 0;
for (const [name, build, defaultPitch] of scenes) {
  const geometry = { ...build(), pitch: defaultPitch };
  const { canvas, uniforms } = mockCanvas();
  const renderer = createProjectionRenderer(canvas, geometry);
  const points = geometry.positions;
  for (const [width, height] of [[736, 420], [340, 410], [1120, 420]]) {
    renderer.resize(width, height, 2);
    for (const pitch of [radians(-10), 0, defaultPitch, radians(30), radians(45), radians(60), radians(70)]) {
      let yawDistance;
      for (let yaw = -180; yaw <= 180; yaw += 30) {
        renderer.draw({ yaw, pitch });
        const u = uniforms[0], matrix = u.get('uRotation');
        const center = u.get('uCenter'), scale = u.get('uScale');
        const distance = u.get('uCamera'), aspect = u.get('uAspect'), focal = u.get('uFocal');
        const depthRange = u.get('uDepthRange');
        assert(matrix.every(Number.isFinite), `${name}: finite rotation matrix`);
        assert(Number.isFinite(distance) && distance > 0, `${name}: finite camera distance`);
        if (yawDistance !== undefined) assert.equal(distance, yawDistance, `${name}: yaw must not zoom`);
        yawDistance = distance;
        for (let i = 0; i < geometry.count; i += 1) {
          const x = (points[i * 3] - center[0]) * scale;
          const y = (points[i * 3 + 1] - center[1]) * scale;
          const z = (points[i * 3 + 2] - center[2]) * scale;
          const vx = matrix[0] * x + matrix[3] * y + matrix[6] * z;
          const vy = matrix[1] * x + matrix[4] * y + matrix[7] * z;
          const vz = matrix[2] * x + matrix[5] * y + matrix[8] * z;
          assert(vz >= depthRange[0] - 1e-6 && vz <= depthRange[1] + 1e-6,
            `${name}: depth slices cover point ${i} at yaw ${yaw}`);
          if (geometry.parts[i] < .5) continue;
          const near = distance - vz;
          assert(near >= .399, `${name}: subjects stay behind the near plane`);
          const screenX = Math.abs(vx * focal / (aspect * near));
          const screenY = Math.abs(vy * focal / near);
          assert(screenX <= .92 && screenY <= .92,
            `${name}: point ${i} cropped at ${width}×${height}, yaw ${yaw}, pitch ${pitch}`);
          projectedSubjects += 1;
        }
      }
    }
  }
  renderer.draw({ yaw: 73, pitch: .3 });
  const wrapped = uniforms[0].get('uRotation');
  renderer.draw({ yaw: 433, pitch: .3 });
  assert.deepEqual(uniforms[0].get('uRotation'), wrapped, `${name}: yaw wraps through a full turn`);
  renderer.draw({ yaw: 0, pitch: Infinity });
  assert(Math.abs(uniforms[0].get('uRotation')[4] - Math.cos(defaultPitch)) < 1e-6,
    `${name}: invalid pitch returns to the scene default`);
  renderer.draw({ yaw: 0, pitch: 3 });
  assert(Math.abs(uniforms[0].get('uRotation')[5] - Math.sin(radians(70))) < 1e-6,
    `${name}: upper pitch limit`);
  renderer.draw({ yaw: 0, pitch: -3 });
  assert(Math.abs(uniforms[0].get('uRotation')[5] - Math.sin(radians(-10))) < 1e-6,
    `${name}: lower pitch limit`);
  for (const pitch of [radians(-10) + 1e-5, defaultPitch, radians(45), radians(70) - 1e-5]) {
    renderer.draw({ yaw: 90, pitch: pitch - 1e-6 });
    const before = uniforms[0].get('uCamera');
    renderer.draw({ yaw: 90, pitch: pitch + 1e-6 });
    assert(Math.abs(uniforms[0].get('uCamera') - before) < .0001, `${name}: continuous pitch fitting`);
  }
  let scanDrawn = false;
  for (const progress of [.2, .4, .6, .8]) {
    uniforms[1].clear();
    renderer.draw({ yaw: 135, pitch: radians(60), phase: 'reveal', progress });
    if (!uniforms[1].has('uRotation')) continue;
    scanDrawn = true;
    assert.deepEqual(uniforms[1].get('uRotation'), uniforms[0].get('uRotation'), `${name}: scan plane follows orbit`);
    assert.equal(uniforms[1].get('uCamera'), uniforms[0].get('uCamera'), `${name}: scan shares camera distance`);
  }
  assert(scanDrawn, `${name}: reveal still draws its scan plane`);
  // After initialization, both orbiting and resizing must use the compact profile.
  Object.defineProperty(geometry, 'positions', { get() { throw new Error('Per-frame point traversal'); } });
  renderer.draw({ yaw: 120, pitch: .7 });
  renderer.resize(400, 430, 1);
  renderer.draw({ yaw: -120, pitch: .1 });
  renderer.dispose();
}
console.log(`Projection camera checks passed: ${projectedSubjects.toLocaleString()} subject projections, three aspect ratios, full yaw, pitch limits, continuous framing, depth slices, scan plane and no per-frame point traversal.`);
