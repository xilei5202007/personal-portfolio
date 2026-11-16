import { createSurfaceStudy, TAU, clamp } from './surface-study.js';

/** A continuous strategic landscape; this is a design illustration, not a playable map. */
export function buildTerrainProjection() {
  const s=createSurfaceStudy(0x31c62026);
  const gaussian=(x,z,cx,cz,sx,sz)=>Math.exp(-((x-cx)**2/sx+(z-cz)**2/sz));
  const ridge=(x,z,cx,cz,rx,rz,h)=>{
    const a=(x-cx)/rx,b=(z-cz)/rz;
    return h*Math.pow(Math.max(0,1-Math.max(Math.abs(a),Math.abs(b),Math.abs(a*.72+b*.64))),.85);
  };
  const height=(x,z)=>-.62+.10*Math.sin(x*1.4+z*.8)*Math.cos(z*1.8)
    +ridge(x,z,-1.98,.88,.63,.84,1.02)+ridge(x,z,-1.05,1.27,.48,.65,.82)
    +.20*gaussian(x,z,-1.8,-1.04,.9,.6)-.06*gaussian(x,z,1.8,.2,.8,1.4);
  const edge=a=>1+.07*Math.sin(3*a+.3)+.035*Math.cos(7*a);
  s.surface(136,40,(u,v)=>{
    const a=u*TAU,r=v*edge(a),x=3.06*r*Math.cos(a),z=1.98*r*Math.sin(a);
    return [x,height(x,z),z];
  },(u,v,p)=>.29+.055*Math.sin(p[0]*3.2+p[2]*2)+.06*clamp((p[1]+.4),0,1),0,0,.66);
  s.surface(136,5,(u,v)=>{
    const a=u*TAU,r=edge(a)*(1-.075*v),x=3.06*r*Math.cos(a),z=1.98*r*Math.sin(a);
    return [x,height(x,z)-.18*v,z];
  },.23,0,0,.3);

  // Flat normals and broken strata belong to actual rock faces, including their backs.
  function facet(a,b,c,d,t,g=0,p=1,w=1.5) {
    const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...n);
    if(length>1e-9)s.quad(a,b,c,d,n.map(x=>x/length),t,g,p,w);
  }
  function crag(x,z,rx,h,rz,t,g=0,p=1) {
    const base=height(x,z)-.06,ring=[];
    for(let i=0;i<9;i++) {
      const a=i*TAU/9,k=.87+.16*Math.sin(i*2.71+.8);
      ring.push([Math.cos(a)*rx*k,Math.sin(a)*rz*k]);
    }
    const levels=[0,.30,.66,1],scale=[1,.91,.56,.12];
    const at=(i,j)=>[x+ring[i][0]*scale[j]+h*.07*levels[j],base+h*levels[j]+.018*Math.sin(i*2.4)*levels[j],z+ring[i][1]*scale[j]];
    for(let j=0;j<3;j++)for(let i=0;i<9;i++) {
      const next=(i+1)%9,a=at(i,j),b=at(next,j),c=at(next,j+1),d=at(i,j+1);
      facet(b,a,d,c,t+.035*Math.sin(i*2.6)+j*.015,g,p,1.8);
      if(j>0&&i%3!==1)s.beam(a,b,.0065,t+.13,g,2,1.7);
    }
    for(let i=0;i<9;i++)facet(at((i+1)%9,3),at(i,3),[x+h*.07,base+h+.045,z],[x+h*.07,base+h+.045,z],t+.05,g,p,1.8);
  }
  [[-1.99,.86,.33,.54,.37],[-1.07,1.27,.26,.43,.29],[-2.35,.57,.20,.33,.22],[-1.53,1.42,.18,.30,.22]].forEach(([x,z,rx,h,rz],i)=>crag(x,z,rx,h,rz,.47+i*.018));
  // Loose angular scree marks the pass without closing its open route.
  [[-1.64,.78],[-1.53,.69],[-1.47,1.19],[-2.25,.24],[-.81,1.48]].forEach(([x,z],i)=>crag(x,z,.07+i%2*.018,.13,.06,.46));
  // Northwest woodland: tapered crowns with lower tiers, not flat triangle markers.
  for(let i=0;i<23;i++) {
    const row=Math.floor(i/6),col=i%6,x=-2.35+col*.25+(s.random()-.5)*.13,z=-1.50+row*.24+(s.random()-.5)*.12;
    const y=height(x,z),h=.34+s.random()*.25,r=.12+s.random()*.045;
    s.beam([x,y,z],[x,y+h*.68,z],.022,.40,0,1,1);
    for(let branch=0;branch<3;branch++) {
      const a=branch*TAU/3+i*.7;
      s.beam([x,y+h*.28,z],[x+Math.cos(a)*r*.75,y+h*.36,z+Math.sin(a)*r*.75],.010,.53,0,2,1.4);
    }
    for(let layer=0;layer<3;layer++) {
      const radius=r*(1-layer*.22),bottom=y+.11+layer*h*.19,tip=bottom+h*.55;
      s.surface(18,8,(u,v)=>{
        const a=u*TAU,rr=radius*Math.pow(1-v,.82)*(1+.08*Math.sin(a*5));
        return [x+rr*Math.cos(a),bottom+(tip-bottom)*v,z+rr*Math.sin(a)];
      },.43+layer*.045,0,1,1.65,true);
    }
  }

  // East wetland: the broad bend and low reed islets remain part of the same terrain.
  const wetCenter=z=>1.60+.29*Math.sin(z*2.7+.6);
  s.surface(76,16,(u,v)=>{
    const z=-1.49+2.96*u,x=wetCenter(z)+(2*v-1)*(.17+.04*Math.sin(z*4));
    return [x,height(x,z)+.025,z];
  },(u,v)=>.47+.04*Math.sin(u*43+v*8),0,2,1.2);
  [-1,1].forEach(side=>s.tube(u=>{
    const z=-1.43+2.86*u,x=wetCenter(z)+side*(.18+.04*Math.sin(z*4));
    return [x,height(x,z)+.035,z];
  },.010,.64,0,2,1.1,45,6));
  for(let i=0;i<18;i++) {
    const z=-1.1+(i%9)*.26,x=wetCenter(z)+(i<9?-.29:.30)+(s.random()-.5)*.09,y=height(x,z),h=.11+s.random()*.025;
    s.tube(u=>[x+.025*Math.sin(u*2),y+u*h,z+.026*u*u],.009,.52,0,4,.85,5,5);
    [-1,1].forEach(side=>s.tube(u=>[x+side*.035*u,y+h*.36+h*.50*u-.045*u*u,z+.017*u],.0045,.62,0,4,1.7,6,5,.002));
    s.ellipsoid(x+.022,y+h+.005,z+.026,.013,.035,.012,.72,0,4,2);
  }
  // A modest plank bridge makes the eastward supply route physically continuous.
  const bridgeZ=.44,bridgeX=wetCenter(bridgeZ),bridgeY=height(bridgeX,bridgeZ)+.12;
  for(let plank=0;plank<12;plank++)s.box(bridgeX-.32+plank*.058,bridgeY,bridgeZ,.052,.027,.17,.56,2,2,0,2.2);
  [-1,1].forEach(side=>{
    s.beam([bridgeX-.35,bridgeY-.04,bridgeZ+side*.06],[bridgeX+.35,bridgeY-.04,bridgeZ+side*.06],.018,.48,2,1,1.6);
    for(let post=0;post<4;post++) {
      const x=bridgeX-.31+post*.207;
      s.beam([x,height(x,bridgeZ),bridgeZ+side*.09],[x,bridgeY+.12,bridgeZ+side*.09],.013,.66,2,2,2);
    }
    s.beam([bridgeX-.31,bridgeY+.10,bridgeZ+side*.09],[bridgeX+.31,bridgeY+.10,bridgeZ+side*.09],.009,.70,2,2,2);
  });

  // Central city has a continuous octagonal wall, a gate gap and a low roof hierarchy.
  const cx=.05,cz=-.01,ground=height(cx,cz)+.02,radius=.61;
  for(let i=0;i<8;i++) {
    const a=TAU*i/8,b=TAU*(i+1)/8,ax=cx+radius*Math.cos(a),az=cz+radius*Math.sin(a),bx=cx+radius*Math.cos(b),bz=cz+radius*Math.sin(b);
    const mx=(ax+bx)/2,mz=(az+bz)/2,length=Math.hypot(bx-ax,bz-az),yaw=-Math.atan2(bz-az,bx-ax);
    const co=Math.cos(yaw),si=Math.sin(yaw),at=(x,y,z)=>[mx+x*co+z*si,ground+y,mz-x*si+z*co];
    const gate=i===1||i===5;
    if(!gate) {
      s.box(mx,ground+.14,mz,length+.022,.28,.07,.57,1,1,yaw,1.7);
      s.box(mx,ground+.30,mz,length+.04,.035,.10,.75,1,2,yaw,2.1);
    } else {
      const opening=.088,sideWidth=length/2-opening;
      [-1,1].forEach(side=>{
        const q=at(side*(opening+sideWidth/2),.14,0);
        s.box(...q,sideWidth+.012,.28,.10,.57,1,1,yaw,2.2);
      });
      // The arch is a through opening: two curved facades plus an intrados, no solid plug.
      [-1,1].forEach(side=>s.surface(24,5,(u,v)=>{
        const x=(u*2-1)*opening,arch=.135+Math.sqrt(Math.max(0,opening*opening-x*x));
        return at(x,arch+(.31-arch)*v,side*.051);
      },.69,1,1,2.8,side<0));
      s.surface(24,4,(u,v)=>at(Math.cos(u*Math.PI)*opening,.135+Math.sin(u*Math.PI)*opening,(v-.5)*.102),.60,1,1,2.7,true);
      [-1,1].forEach(side=>{
        s.tube(u=>at(Math.cos(u*Math.PI)*(.099),.135+Math.sin(u*Math.PI)*.099,side*.057),.009,.82,1,2,3,24,6);
        s.beam(at(-.099,0,side*.057),at(-.099,.135,side*.057),.009,.79,1,2,2.5);
        s.beam(at(.099,0,side*.057),at(.099,.135,side*.057),.009,.79,1,2,2.5);
      });
      s.box(mx,ground+.335,mz,.24,.05,.18,.63,1,1,yaw,2);
      s.roof(mx,ground+.365,mz,.32,.26,.09,.73,1,2,2.4);
    }
    // Masonry courses wrap both inner and outer walls; crenels retain open sky gaps.
    [-1,1].forEach(side=>{
      for(let course=1;course<4;course++) {
        const y=course*.073;
        if(!gate||y>.235)s.beam(at(-length/2,y,side*.038),at(length/2,y,side*.038),.0045,.67,1,2,1.8);
        else [-1,1].forEach(end=>s.beam(at(end*.112,y,side*.054),at(end*length/2,y,side*.054),.0045,.67,1,2,1.8));
      }
    });
    for(let tooth=0;tooth<5;tooth++) {
      const x=(tooth-2)*length/5;
      if(gate&&Math.abs(x)<.14)continue;
      const q=at(x,.345,0);
      s.box(...q,length/8,.06,.085,.69,1,1,yaw,2.1);
    }
    if(i%2===0) {
      s.box(ax,ground+.19,az,.17,.38,.17,.63,1,1,0,2);
      s.roof(ax,ground+.39,az,.24,.24,.09,.70,1,2,2);
    }
  }
  s.box(cx,ground+.20,cz,.38,.39,.32,.56,1,1,0,2);
  s.roof(cx,ground+.42,cz,.55,.48,.15,.76,1,1,2.8);
  s.roof(cx,ground+.62,cz,.35,.30,.12,.83,1,2,2.7);
  for(let face=0;face<4;face++) {
    const co=Math.cos(face*Math.PI/2),si=Math.sin(face*Math.PI/2),reach=face%2?.193:.163,span=face%2?.12:.15;
    const at=(x,y,z)=>[cx+x*co+z*si,ground+y,cz-x*si+z*co];
    [-1,1].forEach(side=>s.beam(at(side*span,.05,reach),at(side*span,.38,reach),.012,.81,1,2,3));
    for(let window=-1;window<=1;window++) {
      const q=at(window*span*.62,.25,reach+.003);
      s.box(...q,.047,.11,.009,.32,1,1,face*Math.PI/2,2.2);
      s.beam(at(window*span*.62,.20,reach+.01),at(window*span*.62,.30,reach+.01),.0045,.79,1,2,3);
    }
    s.beam(at(-span,.10,reach+.01),at(span,.10,reach+.01),.008,.74,1,2,2.4);
  }
  [[-.27,.13],[.26,-.19],[-.23,-.25]].forEach(([x,z])=>{
    s.box(cx+x,ground+.07,cz+z,.19,.14,.15,.45,1,1,0,1.1);
    s.roof(cx+x,ground+.15,cz+z,.24,.20,.075,.57,1,1,1.3);
  });

  // Wagons have four wheels, axles, a plank bed, side rails, and a visible load.
  function wagon(x,z,yaw,ore=false) {
    const y=height(x,z)+.005,co=Math.cos(yaw),si=Math.sin(yaw);
    const at=(a,b,c)=>[x+a*co+c*si,y+b,z-a*si+c*co];
    const box=(a,b,c,w,h,d,t,p=3)=>s.box(...at(a,b,c),w,h,d,t,2,p,yaw,3.1);
    box(0,.073,0,.18,.027,.105,.62);
    [-1,1].forEach(side=>{
      box(0,.115,side*.054,.19,.068,.014,.68);
      [-1,1].forEach(end=>{
        s.beam(at(end*.060,.037,-.074),at(end*.060,.037,.074),.009,.55,2,3,3);
        const center=at(end*.060,.037,side*.073);
        s.tube(u=>at(end*.060+.036*Math.cos(u*TAU),.037+.036*Math.sin(u*TAU),side*.073),.008,.81,2,3,5,20,6);
        for(let spoke=0;spoke<6;spoke++)s.beam(center,at(end*.060+.031*Math.cos(spoke*TAU/6),.037+.031*Math.sin(spoke*TAU/6),side*.073),.004,.75,2,3,5);
      });
      s.beam(at(.08,.07,side*.034),at(.20,.055,side*.034),.007,.65,2,3,3);
      for(let plank=0;plank<4;plank++)s.beam(at(-.075+plank*.05,.086,side*.063),at(-.075+plank*.05,.145,side*.063),.004,.83,2,3,4);
    });
    [-1,1].forEach(end=>box(end*.087,.116,0,.014,.065,.11,.60));
    if(ore) {
      for(let lump=0;lump<3;lump++)s.ellipsoid(...at((lump-1)*.047,.148,.004),.030,.040,.037,.77,2,3,4,.12);
    } else {
      s.ellipsoid(...at(0,.151,0),.078,.052,.044,.79,2,3,4);
      [-1,1].forEach(end=>s.tube(u=>at(end*.045,.142+.049*Math.sin(u*Math.PI),-.046+.092*u),.005,.91,2,3,4,12,6));
    }
  }
  // Iron and food remain peripheral alternatives with recognizable working structures.
  [[-2.29,.03],[-.51,1.66]].forEach(([x,z])=>{
    for(let k=0;k<4;k++) {
      const xx=x+(k%2)*.115,zz=z+Math.floor(k/2)*.10;
      crag(xx,zz,.075,.16+(k%2)*.04,.065,.67,1,2);
    }
    const yy=height(x,z);
    // Two timber portal frames leave the mine mouth empty; rails emerge from the opening.
    for(let depth=0;depth<2;depth++) {
      const zz=z+.13-depth*.11;
      [-1,1].forEach(side=>s.beam([x+side*.115,yy,zz],[x+side*.115,yy+.22,zz],.019,.67,1,2,3));
      s.beam([x-.14,yy+.22,zz],[x+.14,yy+.22,zz],.024,.75,1,2,3);
      [-1,1].forEach(side=>s.beam([x+side*.115,yy+.13,zz],[x+side*.045,yy+.22,zz],.011,.79,1,2,3));
    }
    [-1,1].forEach(side=>s.beam([x+side*.055,yy+.015,z+.03],[x+side*.055,height(x,z+.38)+.02,z+.38],.007,.70,1,2,2.4));
    for(let sleeper=0;sleeper<5;sleeper++) {
      const zz=z+.05+sleeper*.07;
      s.box(x,height(x,zz)+.012,zz,.17,.018,.022,.48,1,1,0,1.7);
    }
    wagon(x,z+.27,Math.PI/2,true);
  });
  [[2.05,-.63],[2.28,.55]].forEach(([x,z])=>{
    for(let row=0;row<5;row++) {
      const zz=z+row*.065;
      s.surface(15,2,(u,v)=>{
        const xx=x-.25+.48*u,zp=zz+(v-.5)*.025;
        return [xx,height(xx,zp)+.04+.012*Math.sin(u*28),zp];
      },.61,1,2,1.6,true);
      for(let crop=0;crop<7;crop++) {
        const xx=x-.23+crop*.073,yy=height(xx,zz)+.043;
        s.beam([xx,yy,zz],[xx,yy+.045,zz],.0035,.65,1,2,2.7);
        [-1,1].forEach(side=>s.beam([xx,yy+.025,zz],[xx+side*.018,yy+.038,zz+.009],.003,.73,1,2,2.6));
      }
    }
    const gx=x+.17,gz=z-.18,gy=height(gx,gz);
    // Raised granaries have supporting feet, plank seams, a door and a roof ridge.
    [-1,1].forEach(a=>[-1,1].forEach(b=>s.beam([gx+a*.072,gy,gz+b*.058],[gx+a*.072,gy+.07,gz+b*.058],.013,.57,1,1,2)));
    s.box(gx,gy+.043,gz,.19,.025,.16,.63,1,2,0,2);
    s.box(gx,gy+.125,gz,.17,.14,.13,.46,1,1,0,1.7);
    s.roof(gx,gy+.205,gz,.24,.21,.08,.65,1,1,2.1);
    [-1,1].forEach(side=>{
      for(let plank=0;plank<4;plank++)s.beam([gx-.065+plank*.043,gy+.061,gz+side*.067],[gx-.065+plank*.043,gy+.191,gz+side*.067],.004,.65,1,2,2.5);
      s.beam([gx+side*.087,gy+.065,gz-.05],[gx+side*.087,gy+.18,gz+.05],.005,.71,1,2,2.4);
    });
    s.box(gx,gy+.113,gz+.070,.052,.10,.009,.28,1,1,0,2.1);
    s.box(gx,gy+.04,gz+.10,.08,.025,.06,.59,1,1,0,2);
    // An earthen edge and the separated rows keep the field readable at map scale.
    [-1,1].forEach(side=>s.tube(u=>{
      const xx=x+side*.27,zz=z-.026+.33*u;
      return [xx,height(xx,zz)+.029,zz];
    },.014,.46,1,1,1.1,10,6));
  });

  // Broad, sampled path surfaces reveal central and peripheral routes as a choice.
  function path(points,width,tone,importance=1.6) {
    for(let k=0;k<points.length-1;k++) {
      const a=points[k],b=points[k+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      s.surface(Math.max(7,Math.ceil(length*22)),3,(u,v)=>{
        const x=a[0]+dx*u-dz/length*(v-.5)*width,z=a[1]+dz*u+dx/length*(v-.5)*width;
        return [x,height(x,z)+.045,z];
      },(u,v)=>tone-.09*Math.abs(v*2-1),2,2,importance,true);
    }
  }
  path([[-1.7,-.83],[-.91,-.52],[-.34,-.27]],.055,.80);
  path([[-1.70,.99],[-1.48,.51],[-.72,.28],[-.38,.15]],.057,.82);
  path([[1.98,.58],[1.98,.44],[1.40,.44],[.69,.30],[.43,.27]],.060,.83);
  path([[-2.14,-.87],[-2.48,-.40],[-2.27,.07],[-2.52,.59]],.046,.62,1.2);
  path([[-1.70,1.23],[-1.19,1.58],[-.48,1.65],[.47,1.50],[1.40,1.11],[2.04,.68]],.047,.66,1.2);
  path([[1.99,.52],[2.33,.03],[2.20,-.59],[1.77,-1.15],[.71,-1.46],[-.49,-1.32],[-1.65,-.97]],.045,.64,1.2);
  // A small supply convoy sits on the pass road and gives the path a readable scale.
  [[-.76,.292],[-1.09,.392],[-1.42,.492]].forEach(([x,z])=>wagon(x,z,.29));
  return {...s.finish(62000,[cx,ground+.2,cz]),storyMode:2};
}
