/*
 * Original architectural study for 乱世执棋.
 * Coordinates: Y up, +Z toward the entrance. No external assets or dependencies.
 * The arch, roofs, walls, seal and flags are sampled surfaces, including backs.
 */
export function buildCommandProjection() {
  "use strict";
  var triangles = [];
  var totalWeight = 0;
  // Surface role keeps the ground quiet while the arch, eaves and seal stay legible.
  var activePart = 1;
  var randomState = 0x71a2026;
  var TAU = Math.PI * 2;
  function random() {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function unit(a) {
    var length = Math.hypot(a[0], a[1], a[2]);
    return length > 1e-12 ? [a[0] / length, a[1] / length, a[2] / length] : [0, 1, 0];
  }
  function vertex(p, n, tone) { return { p: p, n: n, tone: tone }; }
  function triangle(a, b, c, group, importance) {
    var area = Math.hypot.apply(null, cross(sub(b.p, a.p), sub(c.p, a.p))) * 0.5;
    if (area < 1e-10) return;
    totalWeight += area * (importance || 1);
    triangles.push({ a: a, b: b, c: c, group: group, part: activePart, end: totalWeight });
  }
  function quad(a, b, c, d, normal, tone, group, importance) {
    a = vertex(a, normal, tone); b = vertex(b, normal, tone);
    c = vertex(c, normal, tone); d = vertex(d, normal, tone);
    triangle(a, b, c, group, importance);
    triangle(a, c, d, group, importance);
  }
  function surface(nu, nv, evaluate, toneAt, group, importance, flip) {
    var rows = [];
    var epsilon = 0.0001;
    for (var j = 0; j <= nv; j++) {
      var row = [];
      for (var i = 0; i <= nu; i++) {
        var u = i / nu, v = j / nv;
        var du = sub(evaluate(Math.min(1, u + epsilon), v), evaluate(Math.max(0, u - epsilon), v));
        var dv = sub(evaluate(u, Math.min(1, v + epsilon)), evaluate(u, Math.max(0, v - epsilon)));
        var normal = unit(flip ? cross(dv, du) : cross(du, dv));
        row.push(vertex(evaluate(u, v), normal, typeof toneAt === "function" ? toneAt(u, v) : toneAt));
      }
      rows.push(row);
    }
    for (var y = 0; y < nv; y++) {
      for (var x = 0; x < nu; x++) {
        triangle(rows[y][x], rows[y][x + 1], rows[y + 1][x + 1], group, importance);
        triangle(rows[y][x], rows[y + 1][x + 1], rows[y + 1][x], group, importance);
      }
    }
  }
  function box(cx, cy, cz, sx, sy, sz, tone, group, yaw, importance) {
    var co = Math.cos(yaw || 0), si = Math.sin(yaw || 0);
    function point(x, y, z) { return [cx + x * co + z * si, cy + y, cz - x * si + z * co]; }
    function normal(x, y, z) { return [x * co + z * si, y, -x * si + z * co]; }
    var x = sx / 2, y = sy / 2, z = sz / 2;
    quad(point(-x,-y,z), point(x,-y,z), point(x,y,z), point(-x,y,z), normal(0,0,1), tone, group, importance);
    quad(point(x,-y,-z), point(-x,-y,-z), point(-x,y,-z), point(x,y,-z), normal(0,0,-1), tone * 0.63, group, (importance || 1) * 0.55);
    quad(point(x,-y,z), point(x,-y,-z), point(x,y,-z), point(x,y,z), normal(1,0,0), tone * 0.96, group, importance);
    quad(point(-x,-y,-z), point(-x,-y,z), point(-x,y,z), point(-x,y,-z), normal(-1,0,0), tone * 0.96, group, importance);
    quad(point(-x,y,z), point(x,y,z), point(x,y,-z), point(-x,y,-z), normal(0,1,0), Math.min(1, tone * 1.07), group, importance);
    quad(point(-x,-y,-z), point(x,-y,-z), point(x,-y,z), point(-x,-y,z), normal(0,-1,0), tone * 0.38, group, (importance || 1) * 0.22);
  }
  function cylinder(cx, y0, cz, radius, height, tone, group, topRadius, importance) {
    var rt = topRadius === undefined ? radius : topRadius;
    surface(32, 4, function(u, v) {
      var a = u * TAU, r = radius + (rt - radius) * v;
      return [cx + r * Math.cos(a), y0 + v * height, cz + r * Math.sin(a)];
    }, tone, group, importance, true);
    surface(32, 3, function(u, v) {
      return [cx + rt * v * Math.cos(u * TAU), y0 + height, cz + rt * v * Math.sin(u * TAU)];
    }, tone * 1.05, group, importance, false);
    surface(32, 3, function(u, v) {
      return [cx + radius * v * Math.cos(u * TAU), y0, cz + radius * v * Math.sin(u * TAU)];
    }, tone * 0.8, group, importance, true);
  }
  function ellipsoid(cx, cy, cz, rx, ry, rz, tone, group, importance) {
    surface(32, 16, function(u, v) {
      var a = u * TAU, b = v * Math.PI;
      return [cx + rx * Math.cos(a) * Math.sin(b), cy + ry * Math.cos(b), cz + rz * Math.sin(a) * Math.sin(b)];
    }, tone, group, importance, false);
  }
  // Closed rounded members follow real 3D paths; no billboard detail is used.
  function tube(segments, path, radius, tone, group, importance) {
    function frame(t) {
      var tangent = unit(sub(path(Math.min(1,t+0.0001)),path(Math.max(0,t-0.0001))));
      var side = unit(cross(tangent,Math.abs(tangent[1]) > 0.95 ? [1,0,0] : [0,1,0]));
      return [side,unit(cross(tangent,side)),tangent];
    }
    surface(segments,8,function(u,v) {
      var p=path(u), f=frame(u), a=v*TAU;
      return p.map(function(value,axis) { return value+radius*(Math.cos(a)*f[0][axis]+Math.sin(a)*f[1][axis]); });
    },tone,group,importance,true);
    [0,1].forEach(function(end) {
      var p=path(end), f=frame(end), n=f[2].map(function(value){return value*(end?1:-1);});
      for (var i=0;i<8;i++) {
        function rim(a) { return p.map(function(value,axis){return value+radius*(Math.cos(a)*f[0][axis]+Math.sin(a)*f[1][axis]);}); }
        triangle(vertex(p,n,tone),vertex(rim(i*TAU/8),n,tone),vertex(rim((i+1)*TAU/8),n,tone),group,importance);
      }
    });
  }

  // A naturally broken oval foundation, with a closed sloping edge.
  activePart = 0;
  function groundEdge(a) { return 1 + 0.055 * Math.sin(a * 3 + 0.6) + 0.025 * Math.sin(a * 7); }
  function groundHeight(x, z, r) { return -0.85 - 0.09 * r * r + 0.018 * Math.sin(x * 4.1) * Math.cos(z * 4); }
  surface(100, 28, function(u, v) {
    var a = u * TAU, r = v * groundEdge(a);
    var x = 2.86 * r * Math.cos(a), z = 1.39 * r * Math.sin(a);
    return [x, groundHeight(x, z, v), z];
  }, function(u, v) { return 0.24 + 0.03 * Math.sin(u * 37) * Math.sin(v * 13); }, 0, 0.12, false);
  surface(100, 4, function(u, v) {
    var a = u * TAU, r = groundEdge(a) * (1 - 0.06 * v);
    var x = 2.86 * r * Math.cos(a), z = 1.39 * r * Math.sin(a);
    return [x, groundHeight(x, z, 1) * (1 - v) - 1.075 * v, z];
  }, 0.21, 0, 0.09, false);
  surface(100, 8, function(u, v) {
    var a = u * TAU, r = v * groundEdge(a) * 0.94;
    return [2.86 * r * Math.cos(a), -1.075, 1.39 * r * Math.sin(a)];
  }, 0.12, 0, 0.025, true);

  // Main gate: both facades are cut around the same arched aperture.
  activePart = 1;
  var gateRadius = 0.43, gateSpring = -0.075, gateBottom = -0.86, gateTop = 0.66;
  var gateHalfWidth = 1.24, gateDepth = 0.91;
  function archHeight(x) { return gateSpring + Math.sqrt(Math.max(0, gateRadius * gateRadius - x * x)); }
  function masonryTone(x, y, side) {
    var row = Math.floor((y + 0.9) / 0.14);
    var col = Math.floor((x + 1.5 + (row % 2) * 0.12) / 0.24);
    return 0.60 + 0.035 * Math.sin(row * 7.13 + col * 11.79) + (side === 1 ? 0.04 : -0.19);
  }
  [1, -1].forEach(function(side) {
    [-1, 1].forEach(function(wing) {
      surface(18, 22, function(u, v) {
        var x = wing * (gateRadius + (gateHalfWidth - gateRadius) * u);
        return [x, gateBottom + (gateTop - gateBottom) * v, side * gateDepth / 2];
      }, function(u, v) {
        return masonryTone(wing * (gateRadius + (gateHalfWidth - gateRadius) * u), gateBottom + (gateTop - gateBottom) * v, side);
      }, 0, side > 0 ? 1.25 : 0.5, side * wing < 0);
    });
    surface(40, 12, function(u, v) {
      var x = (u * 2 - 1) * gateRadius, y0 = archHeight(x);
      return [x, y0 + (gateTop - y0) * v, side * gateDepth / 2];
    }, function(u, v) {
      var x = (u * 2 - 1) * gateRadius;
      return masonryTone(x, archHeight(x) + (gateTop - archHeight(x)) * v, side);
    }, 0, side > 0 ? 1.25 : 0.5, side < 0);
  });
  [-1, 1].forEach(function(side) {
    quad([side*gateHalfWidth,gateBottom,-gateDepth/2], [side*gateHalfWidth,gateBottom,gateDepth/2],
      [side*gateHalfWidth,gateTop,gateDepth/2], [side*gateHalfWidth,gateTop,-gateDepth/2],
      [side,0,0], 0.51, 0);
    quad([side*gateRadius,gateBottom,gateDepth/2], [side*gateRadius,gateBottom,-gateDepth/2],
      [side*gateRadius,gateSpring,-gateDepth/2], [side*gateRadius,gateSpring,gateDepth/2],
      [-side,0,0], 0.39, 0);
  });
  quad([-gateHalfWidth,gateTop,gateDepth/2], [gateHalfWidth,gateTop,gateDepth/2],
    [gateHalfWidth,gateTop,-gateDepth/2], [-gateHalfWidth,gateTop,-gateDepth/2], [0,1,0], 0.61, 0);
  surface(44, 12, function(u, v) {
    var a = u * Math.PI;
    return [gateRadius * Math.cos(a), gateSpring + gateRadius * Math.sin(a), (v - 0.5) * gateDepth];
  }, 0.43, 0, 1.2, true);
  // Separate shallow stone courses leave recessed mortar gaps. Blocks above the
  // arch are clipped against its curve, so detail can never close the opening.
  activePart = 2;
  [1,-1].forEach(function(side) {
    for (var row=0;row<10;row++) {
      var bottom=gateBottom+row*0.151+0.008, top=Math.min(gateTop-0.01,bottom+0.137);
      for (var col=-5;col<=5;col++) {
        var x0=Math.max(-gateHalfWidth+0.014,col*0.256+(row%2)*0.128-0.006);
        var x1=Math.min(gateHalfWidth-0.014,x0+0.241);
        if(x1<=x0 || x0>=gateHalfWidth-0.014) continue;
        // Central low courses are the empty arch, not masonry.
        var left=Math.max(x0,-gateRadius-0.11),right=Math.min(x1,gateRadius+0.11);
        var intersectsOpening=left<right && top<gateSpring+gateRadius+0.11;
        if(intersectsOpening && bottom<gateSpring && x0<gateRadius+0.11 && x1>-gateRadius-0.11) continue;
        (function(x0,x1,bottom,top,row,col) {
          var relief=0.017+0.007*(1+Math.sin(row*9.21+col*3.17));
          var z0=side*(gateDepth/2+0.002),z1=side*(gateDepth/2+relief);
          function lower(x) {
            var radius=gateRadius+0.112;
            return Math.max(bottom,Math.abs(x)<radius ? gateSpring+Math.sqrt(radius*radius-x*x)+0.006 : bottom);
          }
          // Entire spans inside the arch's reserved stone surround are omitted.
          if(lower((x0+x1)/2)>=top || lower(x0)>=top || lower(x1)>=top) return;
          var tone=0.61+0.055*Math.sin(row*7.13+col*11.79);
          surface(6,1,function(u,v) {var x=x0+(x1-x0)*u,y=lower(x);return [x,y+(top-y)*v,z1];},tone,0,1.65,side<0);
          surface(6,1,function(u,v) {var x=x0+(x1-x0)*u;return [x,lower(x),z0+(z1-z0)*v];},tone*0.7,0,1.2,side>0);
          quad([x0,top,z0],[x1,top,z0],[x1,top,z1],[x0,top,z1],[0,1,0],tone*1.1,0,1.3);
          [-1,1].forEach(function(edge) {var x=edge<0?x0:x1;quad([x,lower(x),z0],[x,lower(x),z1],[x,top,z1],[x,top,z0],[edge,0,0],tone*0.84,0,1.2);});
        })(x0,x1,bottom,top,row,col);
      }
    }
  });
  // Segmented stone archivolts have real radial width and shallow relief.
  activePart = 2;
  [1, -1].forEach(function(side) {
    for (var k = 0; k < 17; k++) {
      (function(segment) {
        surface(3, 2, function(u, v) {
          var a = (segment + 0.05 + u * 0.9) * Math.PI / 17;
          var r = gateRadius + 0.007 + v * 0.096;
          return [r * Math.cos(a), gateSpring + r * Math.sin(a), side * (gateDepth / 2 + 0.022)];
        }, 0.88 + 0.035 * Math.sin(segment * 5.7), 0, side > 0 ? 2.1 : 0.65, side > 0);
        // Inner, outer and radial faces make each voussoir a solid wedge.
        [0,1].forEach(function(edge) {
          surface(4,1,function(u,v) {
            var a=(segment+0.05+u*0.9)*Math.PI/17,r=gateRadius+0.007+edge*0.096;
            return [r*Math.cos(a),gateSpring+r*Math.sin(a),side*(gateDepth/2+0.002+v*0.033)];
          },edge?0.69:0.78,0,1.85,side*(edge?1:-1)<0);
        });
        [0.05,0.95].forEach(function(edge) {
          surface(1,1,function(u,v) {
            var a=(segment+edge)*Math.PI/17,r=gateRadius+0.007+u*0.096;
            return [r*Math.cos(a),gateSpring+r*Math.sin(a),side*(gateDepth/2+0.002+v*0.033)];
          },0.65,0,1.6,side*(edge>.5?1:-1)>0);
        });
      })(k);
    }
    [-1, 1].forEach(function(wing) {
      box(wing * (gateRadius + 0.051), (gateBottom + gateSpring) / 2, side * (gateDepth / 2 + 0.01),
        0.093, gateSpring - gateBottom, 0.04, 0.7, 0, 0, 1.2);
    });
  });
  // Recessed barrel-vault bands and jamb courses reveal the passage's depth.
  [-0.30,0,0.30].forEach(function(z) {
    surface(32,2,function(u,v) {
      var a=u*Math.PI;
      return [(gateRadius-0.012)*Math.cos(a),gateSpring+(gateRadius-0.012)*Math.sin(a),z+(v-0.5)*0.035];
    },0.64,0,2.0,true);
    [-1,1].forEach(function(side) {
      box(side*(gateRadius-0.009),-0.46,z,0.018,0.76,0.034,0.56,0,0,1.7);
    });
  });
  // Heavy leaves open into the courtyard, leaving the centre of the arch clear.
  [-1,1].forEach(function(side) {
    var angle=1.31, width=0.365;
    function doorPoint(u,y,d) {
      return [side*(gateRadius-0.012-u*Math.cos(angle))+d*Math.sin(angle),y,-0.35-u*Math.sin(angle)-side*d*Math.cos(angle)];
    }
    function leaf(u0,u1,y0,y1,d0,d1,tone,importance) {
      var corners=[doorPoint(u0,y0,d0),doorPoint(u1,y0,d0),doorPoint(u1,y1,d0),doorPoint(u0,y1,d0),
        doorPoint(u0,y0,d1),doorPoint(u1,y0,d1),doorPoint(u1,y1,d1),doorPoint(u0,y1,d1)];
      [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach(function(face) {
        var p=face.map(function(index){return corners[index];});
        quad(p[0],p[1],p[2],p[3],unit(cross(sub(p[2],p[0]),sub(p[1],p[0]))),tone,0,importance);
      });
    }
    leaf(0,width,-0.80,-0.055,-0.032,0.032,0.45,1.2);
    for(var plank=0;plank<4;plank++) leaf(plank*width/4+0.008,(plank+1)*width/4-0.008,-0.775,-0.08,-0.041,0.041,0.54,1.8);
    [-0.68,-0.19].forEach(function(y) {
      leaf(0.008,width-0.008,y-0.025,y+0.025,-0.051,0.051,0.74,2.4);
      var hinge=doorPoint(0,y,0);
      cylinder(hinge[0],y-0.055,hinge[2],0.025,0.11,0.81,0,0.025,3);
      [0.08,0.20,0.31].forEach(function(u) {
        [-1,1].forEach(function(face) {
          var stud=doorPoint(u,y,face*0.057);
          ellipsoid(stud[0],stud[1],stud[2],0.015,0.015,0.015,0.86,0,3);
        });
      });
    });
  });
  // Stone cap courses and shallow buttresses anchor the facade.
  box(0, 0.66, 0, 2.64, 0.12, 1.09, 0.73, 0);
  box(0, 0.747, 0, 2.48, 0.055, 0.98, 0.65, 0);
  [-1, 1].forEach(function(side) {
    box(side * 1.14, -0.12, 0.48, 0.17, 1.12, 0.17, 0.6, 0);
    box(side * 1.14, -0.77, 0.50, 0.24, 0.16, 0.25, 0.67, 0);
    // Plinths turn the corner and continue along the rear facade.
    box(side*0.87,-0.80,0,0.76,0.12,1.02,0.64,0,0,1.3);
    box(side*1.14,-0.12,-0.48,0.17,1.12,0.17,0.58,0,0,1.2);
    box(side*1.14,-0.77,-0.50,0.24,0.16,0.25,0.67,0,0,1.5);
    for(var course=0;course<9;course++) {
      for(var stone=0;stone<3;stone++) {
        var z=-0.31+stone*0.30+(course%2)*0.025;
        box(side*(gateHalfWidth+0.012),-0.70+course*0.145,z,0.028,0.13,0.275,0.54+0.03*Math.sin(course*8+stone),0,0,1.35);
      }
    }
  });
  // Entry stones lead through the gate without filling the aperture.
  activePart = 0;
  for (var step = 0; step < 4; step++) {
    box(0, -0.836 + step * 0.015, 0.93 - step * 0.18, 0.91 - step * 0.055, 0.045, 0.18, 0.54, 0, 0, 0.7);
  }
  for(var rearStep=0;rearStep<3;rearStep++) {
    box(0,-0.816-rearStep*0.015,-0.49-rearStep*0.16,0.70+rearStep*0.05,0.04,0.148,0.47,0,0,0.65);
  }

  // Hip roofs: curved tile surfaces, upward corners, a solid eave rim and underside.
  function roof(cx, cz, halfX, halfZ, ridgeHalf, eaveY, ridgeY, tone, detailScale) {
    var previousPart = activePart;
    detailScale = detailScale || 1;
    function height(u, t, x) {
      var fall = ridgeY - eaveY;
      var corner = 0.12 * detailScale * Math.pow(Math.abs(2 * u - 1), 5) * Math.pow(t, 3);
      var upturn = 0.04 * detailScale * Math.pow(t, 10);
      var tiles = 0.009 * detailScale * Math.cos(x * 31 / detailScale) * Math.sin(Math.min(1, t * 12) * Math.PI / 2);
      return ridgeY - fall * Math.pow(t, 0.79) + corner + upturn + tiles;
    }
    var patches = [];
    [1, -1].forEach(function(side) {
      patches.push({
        flip: side < 0,
        p: function(u, t, offset) {
          var x = (2 * u - 1) * (ridgeHalf + (halfX - ridgeHalf) * t);
          return [cx + x, height(u, t, x) + (offset || 0), cz + side * halfZ * t];
        }
      });
      patches.push({
        flip: side > 0,
        p: function(u, t, offset) {
          var x = side * (ridgeHalf + (halfX - ridgeHalf) * t);
          return [cx + x, height(u, t, x) + (offset || 0), cz + (2 * u - 1) * halfZ * t];
        }
      });
    });
    patches.forEach(function(patch) {
      activePart = 1;
      surface(64, 20, function(u, v) { return patch.p(u, v); }, function(u, v) {
        return tone + 0.045 * Math.cos(u * 36 * Math.PI) + 0.018 * Math.cos(v * 22 * Math.PI);
      }, 1, 1.35, !patch.flip);
      surface(28, 9, function(u, v) { return patch.p(u, v, -0.055 * detailScale); }, tone * 0.42, 1, 0.15, patch.flip);
      activePart = 2;
      surface(64, 2, function(u, v) { return patch.p(u, 1, -v * 0.055 * detailScale); }, tone * 1.05, 1, 1.4, !patch.flip);
      // Raised half-round tile caps form individual curved rows on all slopes.
      // They have cylindrical depth and round drip ends, including the rear roof.
      var rowCount=Math.max(7,Math.round(halfX*13));
      for(var row=1;row<rowCount;row++) {
        (function(u) {
          tube(16,function(t) { return patch.p(u,0.17+t*0.83,0.012*detailScale); },0.011*detailScale,tone*1.16,1,3.5);
          var drip=patch.p(u,1,0.009*detailScale);
          ellipsoid(drip[0],drip[1],drip[2],0.015*detailScale,0.014*detailScale,0.015*detailScale,tone*1.2,1,3);
        })(row/rowCount);
      }
      // A second fascia below the rim separates the eaves from the rafters.
      tube(24,function(u){return patch.p(u,0.965,-0.071*detailScale);},0.015*detailScale,tone*0.89,1,2.0);
    });
    // A tiled barrel ridge, sampled as a surface rather than drawn as a line.
    activePart = 2;
    surface(40, 18, function(u, v) {
      var a = v * TAU, x = (2 * u - 1) * (ridgeHalf + 0.035);
      return [cx + x, ridgeY + 0.03 * detailScale + 0.035 * detailScale * Math.cos(a), cz + 0.035 * detailScale * Math.sin(a)];
    }, tone * 1.08, 1, 1.4, true);
    // Small turned-up ridge ends keep the silhouette legible at low point density.
    [-1, 1].forEach(function(side) {
      ellipsoid(cx + side * (ridgeHalf + 0.025), ridgeY + 0.071 * detailScale, cz,
        0.05 * detailScale, 0.075 * detailScale, 0.035 * detailScale, tone * 1.08, 1, 1.6);
    });
    activePart = previousPart;
  }
  function column(x, z, y0, y1, radius) {
    cylinder(x, y0, z, radius, y1 - y0, 0.59, 1, radius * 0.9, 1.25);
    cylinder(x, y0 - 0.025, z, radius * 1.4, 0.06, 0.73, 1, radius * 1.3, 1.25);
    box(x, y1 - 0.015, z, radius * 2.8, 0.06, radius * 2.8, 0.72, 1, 0, 1.25);
  }
  function lattice(x,y,z,width,height,yaw,tone) {
    var co=Math.cos(yaw),si=Math.sin(yaw);
    function member(lx,ly,sx,sy,depth) {
      box(x+lx*co,y+ly,z-lx*si,sx,sy,depth,tone,1,yaw,2.1);
    }
    member(0,-height/2,width+0.05,0.045,0.08);
    member(0,height/2,width+0.05,0.045,0.08);
    [-1,1].forEach(function(side){member(side*width/2,0,0.038,height,0.07);});
    for(var bar=1;bar<5;bar++) member(-width/2+width*bar/5,0,0.014,height-0.035,0.035);
    [-1,1].forEach(function(side){member(0,side*height*0.19,width-0.035,0.014,0.035);});
  }
  // Gallery walls and windows have volume; front columns leave an open colonnade.
  activePart = 1;
  box(0,0.82,-0.40,2.04,0.14,0.1,0.43,1,0,0.75);
  box(0,1.29,-0.40,2.04,0.08,0.1,0.48,1,0,1);
  [-0.98,-0.34,0.34,0.98].forEach(function(x){box(x,1.07,-0.40,0.09,0.36,0.1,0.52,1,0,1.2);});
  [-0.66,0,0.66].forEach(function(x){lattice(x,1.07,-0.43,0.51,0.32,0,0.67);});
  [-1, 1].forEach(function(side) {
    box(side*1.00,0.82,0,0.09,0.14,0.81,0.44,1,0,0.8);
    box(side*1.00,1.29,0,0.09,0.08,0.81,0.49,1,0,1);
    [-0.36,0.36].forEach(function(z){box(side*1.00,1.07,z,0.09,0.36,0.09,0.52,1,0,1.2);});
    lattice(side*1.02,1.07,0,0.56,0.32,Math.PI/2,0.66);
    [-0.46, 0.46].forEach(function(z) { column(side * 1.09, z, 0.76, 1.36, 0.049); });
    box(side * 0.71, 0.93, 0.47, 0.60, 0.06, 0.075, 0.70, 1);
    for (var b = 0; b < 5; b++) box(side * (0.43 + b * 0.14), 0.84, 0.47, 0.025, 0.17, 0.028, 0.58, 1, 0, 1.2);
  });
  [-0.38, 0.38].forEach(function(x) { column(x, 0.46, 0.76, 1.36, 0.048); });
  box(0, 1.30, 0.48, 2.31, 0.09, 0.11, 0.74, 1);
  box(0, 1.30, -0.48, 2.31, 0.09, 0.11, 0.66, 1);
  // Stepped bracket clusters under each eave, with cantilevered short members.
  activePart = 2;
  [-1.09,-0.38,0.38,1.09].forEach(function(x) {
    [-0.48, 0.48].forEach(function(z) {
      box(x, 1.345, z, 0.14, 0.055, 0.16, 0.77, 1, 0, 1.4);
      box(x, 1.39, z * 1.10, 0.24, 0.045, 0.21, 0.70, 1, 0, 1.4);
      box(x, 1.425, z * 1.17, 0.18, 0.035, 0.29, 0.78, 1, 0, 1.4);
      [-1,1].forEach(function(arm) {
        tube(2,function(t){return [x+arm*(0.035+t*0.092),1.35+t*0.065,z*(1+0.13*t)];},0.018,0.76,1,3.1);
      });
    });
  });
  roof(0, 0, 1.65, 0.91, 0.61, 1.34, 1.88, 0.66, 1);
  // Smaller upper pavilion rises out of the lower roof's central ridge.
  activePart = 1;
  box(0,1.68,-0.29,1.11,0.08,0.08,0.49,1,0,0.9);
  box(0,2.06,-0.29,1.11,0.08,0.08,0.54,1,0,0.9);
  [-0.52,0,0.52].forEach(function(x){box(x,1.87,-0.29,0.055,0.30,0.08,0.57,1,0,1.3);});
  [-0.26,0.26].forEach(function(x){lattice(x,1.87,-0.315,0.40,0.28,0,0.69);});
  [-1,1].forEach(function(side) {
    box(side*0.54,1.68,0,0.07,0.08,0.59,0.49,1,0,0.8);
    box(side*0.54,2.06,0,0.07,0.08,0.59,0.54,1,0,0.9);
    [-0.27,0.27].forEach(function(z){box(side*0.54,1.87,z,0.07,0.30,0.055,0.57,1,0,1.3);});
    lattice(side*0.56,1.87,0,0.40,0.28,Math.PI/2,0.69);
    [-0.32,0.32].forEach(function(z) { column(side * 0.61, z, 1.62, 2.095, 0.041); });
  });
  box(0, 2.06, 0.34, 1.30, 0.07, 0.08, 0.76, 1);
  box(0, 1.72, 0.32, 1.18, 0.065, 0.08, 0.67, 1);
  // Quiet central opening with no invented writing, logos or portraits.
  for (var l = -2; l <= 2; l++) box(l * 0.13, 1.88, -0.21, 0.018, 0.28, 0.022, 0.67, 1, 0, 1.3);
  roof(0, 0, 1.01, 0.66, 0.41, 2.04, 2.53, 0.71, 0.83);

  // Low side walls and corner towers establish the gate's fortification context.
  activePart = 1;
  [-1,1].forEach(function(side) {
    box(side * 1.66, -0.35, -0.04, 0.84, 0.99, 0.46, 0.48, 0);
    box(side * 1.66, 0.17, -0.04, 0.91, 0.075, 0.56, 0.66, 0);
    for (var j = 0; j < 4; j++) box(side * (1.32 + j * 0.215), 0.30, -0.04, 0.12, 0.19, 0.47, 0.59, 0);
    box(side * 2.15, -0.16, -0.035, 0.61, 1.36, 0.68, 0.51, 0);
    box(side * 2.15, 0.54, -0.035, 0.72, 0.10, 0.79, 0.73, 0);
    [-1,1].forEach(function(sx) {
      [-1,1].forEach(function(sz) {
        column(side * 2.15 + sx * 0.255, -0.035 + sz * 0.28, 0.60, 0.88, 0.03);
      });
    });
    box(side * 2.15, 0.70, -0.25, 0.46, 0.24, 0.07, 0.41, 1);
    roof(side * 2.15, -0.035, 0.49, 0.47, 0.15, 0.86, 1.17, 0.62, 0.5);
  });

  // The seal is a secondary focal point; its offset leaves the aperture unobstructed.
  activePart = 3;
  var sealCenter = [1.18,-0.57,1.11], sealYaw = -0.34;
  function sealPoint(x,y,z) {
    x *= 1.34; y *= 1.34; z *= 1.34;
    return [sealCenter[0] + x * Math.cos(sealYaw) + z * Math.sin(sealYaw),
      sealCenter[1] + y, sealCenter[2] - x * Math.sin(sealYaw) + z * Math.cos(sealYaw)];
  }
  var octagon = [[-1,-0.78],[-0.78,-1],[0.78,-1],[1,-0.78],[1,0.78],[0.78,1],[-0.78,1],[-1,0.78]];
  // A turned octagonal profile includes two cut channels and a recessed top.
  // These recesses are in the solid itself rather than brighter surface stripes.
  var ringSpec = [[-0.145,0.205],[-0.120,0.231],[-0.090,0.231],[-0.077,0.219],
    [-0.061,0.219],[-0.048,0.231],[0.072,0.231],[0.083,0.219],
    [0.100,0.219],[0.116,0.231],[0.142,0.205],[0.142,0.170],[0.124,0.157],[0.124,0]];
  for (var r = 0; r < ringSpec.length-1; r++) {
    for (var k = 0; k < 8; k++) {
      var next = (k+1)%8, a = octagon[k], b = octagon[next];
      var p0 = sealPoint(a[0]*ringSpec[r][1],ringSpec[r][0],a[1]*ringSpec[r][1]);
      var p1 = sealPoint(b[0]*ringSpec[r][1],ringSpec[r][0],b[1]*ringSpec[r][1]);
      var p2 = sealPoint(b[0]*ringSpec[r+1][1],ringSpec[r+1][0],b[1]*ringSpec[r+1][1]);
      var p3 = sealPoint(a[0]*ringSpec[r+1][1],ringSpec[r+1][0],a[1]*ringSpec[r+1][1]);
      var groove=r===3||r===7, faceTone=groove?0.62:(r===5?0.79:0.94);
      quad(p0,p1,p2,p3,unit(cross(sub(p2,p0),sub(p1,p0))),faceTone,2,groove?3.1:2.5);
    }
  }
  [0].forEach(function(index) {
    var spec = ringSpec[index], ny = -1;
    for (var k = 0; k < 8; k++) {
      triangle(vertex(sealPoint(0,spec[0],0),[0,ny,0],0.88),
        vertex(sealPoint(octagon[k][0]*spec[1],spec[0],octagon[k][1]*spec[1]),[0,ny,0],0.88),
        vertex(sealPoint(octagon[(k+1)%8][0]*spec[1],spec[0],octagon[(k+1)%8][1]*spec[1]),[0,ny,0],0.88),2,1.5);
    }
  });
  // Carved bridge handle: a solid rounded loop, without fabricated inscription.
  surface(40,16,function(u,v) {
    var a = u*TAU, b = v*TAU;
    return sealPoint((0.102 + 0.027*Math.cos(b))*Math.cos(a),
      0.241 + (0.102 + 0.027*Math.cos(b))*Math.sin(a),0.027*Math.sin(b));
  },0.92,2,4.5,false);
  // Two collar feet and raised circular bosses join the handle to the inset face.
  [-1,1].forEach(function(side) {
    var foot=sealPoint(side*0.064,0.149,0);
    box(foot[0],foot[1],foot[2],0.088,0.043,0.11,0.84,2,sealYaw,3.4);
    [-1,1].forEach(function(face) {
      var boss=sealPoint(side*0.064,0.153,face*0.035);
      ellipsoid(boss[0],boss[1],boss[2],0.014,0.014,0.014,0.97,2,4);
    });
  });

  // Two restrained curved cloth banners, each with a genuine front and back.
  activePart = 4;
  function banner(x,z,height,width,direction) {
    cylinder(x,-0.79,z,0.014,height+0.79,0.78,2,0.012,2.2);
    ellipsoid(x,height+0.035,z,0.024,0.048,0.024,0.92,2,2);
    function cloth(u,v,back) {
      var taper = 1 - 0.15*v;
      return [x + direction * width * u * taper,
        height - 0.11 - v*0.48 - 0.07*u + 0.025*Math.sin(u*Math.PI),
        z + 0.105*Math.sin(u*Math.PI*1.7+v*0.8)*u + back];
    }
    surface(30,18,function(u,v){return cloth(u,v,0.006);},
      function(u,v){return 0.71+0.06*Math.sin(u*8+v*2);},2,1.8,direction>0);
    surface(30,18,function(u,v){return cloth(u,v,-0.006);},
      function(u,v){return 0.66+0.04*Math.sin(u*8+v*2);},2,1.4,direction<0);
  }
  banner(-1.56,-0.58,1.72,0.52,-1);
  banner(1.55,-0.58,1.54,0.47,1);

  // A few deliberately understated broken stones break the plinth outline.
  activePart = 0;
  [[-2.56,-0.86,0.59,0.17,0.075,0.13],[-1.75,-0.88,1.01,0.13,0.06,0.10],
    [2.60,-0.90,-0.62,0.15,0.07,0.11],[0.69,-0.87,1.26,0.12,0.045,0.09]].forEach(function(s) {
    ellipsoid(s[0],s[1],s[2],s[3],s[4],s[5],0.42,0,0.55);
  });

  // Area-weighted stratification gives small details coverage without a grid.
  var count = 60000;
  var positions = new Float32Array(count*3), normals = new Float32Array(count*3);
  var tones = new Float32Array(count), groups = new Float32Array(count), seeds = new Float32Array(count);
  var parts = new Float32Array(count);
  var triIndex = 0;
  for (var i = 0; i < count; i++) {
    var desired = (i + random()) * totalWeight / count;
    while (triIndex < triangles.length-1 && triangles[triIndex].end < desired) triIndex++;
    var tri = triangles[triIndex];
    var root = Math.sqrt(random()), b = root * random(), c = root-b, a = 1-root;
    var nx = a*tri.a.n[0]+b*tri.b.n[0]+c*tri.c.n[0];
    var ny = a*tri.a.n[1]+b*tri.b.n[1]+c*tri.c.n[1];
    var nz = a*tri.a.n[2]+b*tri.b.n[2]+c*tri.c.n[2];
    var normalLength = Math.hypot(nx,ny,nz) || 1;
    for (var axis = 0; axis < 3; axis++) positions[i*3+axis] = a*tri.a.p[axis]+b*tri.b.p[axis]+c*tri.c.p[axis];
    normals[i*3] = nx/normalLength; normals[i*3+1] = ny/normalLength; normals[i*3+2] = nz/normalLength;
    tones[i] = Math.max(0,Math.min(1,a*tri.a.tone+b*tri.b.tone+c*tri.c.tone+(random()-0.5)*0.028));
    groups[i] = tri.group;
    parts[i] = tri.part;
    seeds[i] = random();
  }
  var minimum = [Infinity,Infinity,Infinity], maximum = [-Infinity,-Infinity,-Infinity];
  for (var i = 0; i < count; i++) {
    for (var axis = 0; axis < 3; axis++) {
      minimum[axis] = Math.min(minimum[axis],positions[i*3+axis]);
      maximum[axis] = Math.max(maximum[axis],positions[i*3+axis]);
    }
  }
  return { positions:positions, normals:normals, tones:tones, groups:groups, seeds:seeds,
    parts:parts, storyOrigin:sealCenter.slice(),
    bounds:{ min:minimum, max:maximum }, count:count };
}
