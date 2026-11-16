import { createSurfaceStudy, TAU, clamp } from './surface-study.js';

/** An interpretive river city: five eaves, a long bridge, and a child looking home. */
export function buildMemoryProjection() {
  const s=createSurfaceStudy(0x19a62026);
  const center=z=>.24+.38*Math.sin(z*1.22+.5);
  const halfWidth=z=>.51+.08*Math.cos(z*1.8);
  const bankHeight=(x,z)=>-.52+.055*Math.sin(x*1.9-z*.7)+.025*Math.cos(z*4.1+x*2);
  const edge=a=>1+.045*Math.sin(a*5+.3)+.035*Math.cos(a*3);
  function onLand(p) { return Math.abs(p[0]-center(p[2]))>halfWidth(p[2])+.012; }
  s.surface(128,34,(u,v)=>{
    const a=u*TAU,r=v*edge(a),x=3.06*r*Math.cos(a),z=1.82*r*Math.sin(a);
    return [x,bankHeight(x,z),z];
  },(u,v,p)=>.25+.045*Math.sin(p[0]*2.3+p[2]*3),0,0,.42,false,(a,b,c)=>onLand(a)&&onLand(b)&&onLand(c));
  s.surface(128,4,(u,v)=>{
    const a=u*TAU,r=edge(a)*(1-.05*v),x=3.06*r*Math.cos(a),z=1.82*r*Math.sin(a);
    return [x,bankHeight(x,z)-.18*v,z];
  },.24,0,0,.33,false,(a,b,c)=>onLand(a)&&onLand(b)&&onLand(c));
  // The current bends toward the child; a restrained highlight makes the water legible.
  s.surface(80,26,(u,v)=>{
    const z=-1.78+3.56*u,x=center(z)+(v*2-1)*halfWidth(z);
    return [x,-.572+.009*Math.sin(z*15+x*18),z];
  },(u,v)=>.34+.045*Math.sin(u*62+v*8)+.025*Math.cos(v*39),0,2,.75);
  [-1,1].forEach(side=>{
    s.surface(90,4,(u,v)=>{
      const z=-1.74+3.48*u,x=center(z)+side*(halfWidth(z)+v*.075);
      return [x,bankHeight(x,z)-.025*(1-v),z];
    },.55,0,2,1.2,side<0);
    for(let k=0;k<3;k++) s.tube(u=>{
      const z=-1.45+u*2.9,x=center(z)+side*(.13+k*.105)+.025*Math.sin(z*6+k);
      return [x,-.55,z];
    },.006,.50-k*.045,0,2,.65,32,5);
    // A low retaining wall follows the curved bank, with three legible stone courses.
    s.surface(88,4,(u,v)=>{
      const z=-1.65+3.25*u,x=center(z)+side*(halfWidth(z)+.035+.022*v);
      return [x,-.60+v*(bankHeight(x,z)+.60),z];
    },(u,v)=>.37+.035*Math.cos(u*TAU*15)+.035*v,0,1,.85,side<0);
    for(let course=1;course<=2;course++) s.tube(u=>{
      const z=-1.60+3.12*u,x=center(z)+side*(halfWidth(z)+.036);
      return [x,-.60+(bankHeight(x,z)+.60)*course/3,z];
    },.0055,.55,0,2,1.25,56,5);
    for(let i=0;i<16;i++) {
      const z=-1.57+i*.197,x=center(z)+side*(halfWidth(z)+.037);
      s.beam([x,-.588,z],[x,bankHeight(x,z)-.012,z],.0048,.47,0,2,1.15);
    }
  });

  // Five diminishing eaves and open colonnades evoke Yellow Crane Tower.
  const tx=-1.54,tz=-.48,base=bankHeight(tx,tz);
  s.box(tx,base+.025,tz,1.23,.065,1.07,.42,1,1,0,.9);
  s.box(tx,base+.085,tz,1.15,.09,1.0,.49,1,1,0,1.2);
  s.box(tx,base+.139,tz,1.20,.025,1.04,.68,1,2,0,1.5);
  for(let k=0;k<5;k++) {
    const floor=base+.17+k*.46,width=1.60-k*.18,depth=1.27-k*.135;
    const coreWidth=width*.53,coreDepth=depth*.54;
    s.box(tx,floor+.14,tz,coreWidth,.28,coreDepth,.42+.015*k,1,1,0,1.3);
    s.box(tx,floor+.015,tz,width*.71,.055,depth*.72,.65,1,2,0,1.5);
    [-1,1].forEach(a=>[-1,1].forEach(b=>{
      s.beam([tx+a*width*.31,floor+.04,tz+b*depth*.30],[tx+a*width*.31,floor+.33,tz+b*depth*.30],.026,.75,1,2,2);
    }));
    // All four facades carry windows and a complete wraparound gallery.
    for(let face=0;face<4;face++) {
      const co=Math.cos(face*Math.PI/2),si=Math.sin(face*Math.PI/2);
      const span=face%2?depth:width,reach=face%2?width:depth;
      const coreSpan=face%2?coreDepth:coreWidth,coreReach=face%2?coreWidth:coreDepth;
      const at=(x,y,z)=>[tx+x*co+z*si,floor+y,tz-x*si+z*co];
      for(let j=0;j<7;j++) {
        const x=(j-3)*span*.108;
        s.beam(at(x,.055,reach*.335),at(x,.155,reach*.335),.009,.68,1,2,2);
      }
      [.075,.168].forEach(y=>s.beam(at(-span*.34,y,reach*.335),at(span*.34,y,reach*.335),.012,.77,1,2,2.2));
      // Recessed window panels and restrained cross lattice give the core a human scale.
      for(let window=-1;window<=1;window++) {
        const x=window*coreSpan*.29,z=coreReach*.506;
        const panel=at(x,.185,z);
        s.box(panel[0],panel[1],panel[2],coreSpan*.225,.155,.012,.30,1,1,face*Math.PI/2,1.7);
        [-1,0,1].forEach(m=>s.beam(at(x+m*coreSpan*.085,.11,z+.009),at(x+m*coreSpan*.085,.26,z+.009),.0062,.66,1,2,3));
        [.11,.185,.26].forEach(y=>s.beam(at(x-coreSpan*.105,y,z+.01),at(x+coreSpan*.105,y,z+.01),.0065,.71,1,2,3));
      }
      // Bracket arms physically connect each column to the overhanging eave.
      [-1,0,1].forEach(j=>{
        const x=j*span*.31;
        s.beam(at(x,.265,reach*.29),at(x,.32,reach*.39),.016,.70,1,2,2.7);
        s.beam(at(x-span*.048,.302,reach*.34),at(x+span*.048,.302,reach*.34),.011,.80,1,2,2.5);
        s.beam(at(x-span*.064,.33,reach*.37),at(x+span*.064,.33,reach*.37),.010,.69,1,2,2.1);
      });
    }
    s.roof(tx,floor+.33,tz,width,depth,.23,.64,1,1,1.8);
    // Raised tile rolls follow each hip slope; upturned corners remain a readable silhouette.
    for(let face=0;face<4;face++) {
      const co=Math.cos(face*Math.PI/2),si=Math.sin(face*Math.PI/2);
      const sw=face%2?depth:width,sd=face%2?width:depth;
      const onRoof=(a,v)=>{
        const r=.15+.85*v,x=a*sw*r/2,z=sd*r/2;
        const y=floor+.341+.23*Math.pow(1-v,.68)+.10*Math.pow(v,4)*(Math.pow(Math.abs(a),3)+.13);
        return [tx+x*co+z*si,y,tz-x*si+z*co];
      };
      for(let tile=0;tile<=12;tile++) {
        const a=-.92+tile*1.84/12;
        s.tube(v=>onRoof(a,.12+.88*v),.0068,.71,1,2,2.1,12,5);
      }
      s.tube(v=>onRoof(-1,v),.016,.79,1,2,2.1,16,6);
      const tip=onRoof(-1,1);
      s.tube(u=>[tip[0]+(-co+si)*u*.046,tip[1]+.05*u*u,tip[2]+(si+co)*u*.046],.010,.79,1,2,2.5,6,5,.004);
    }
  }
  s.beam([tx,base+2.53,tz],[tx,base+2.84,tz],.024,.86,1,2,2);
  s.ellipsoid(tx,base+2.73,tz,.075,.08,.075,.8,1,2,1.8);
  // A real stair surface leads down from the tower, rather than a floating plinth.
  for(let i=0;i<5;i++) {
    const y=base+.09-i*.029,z=tz+.56+i*.072;
    s.box(tx,y-.04,z,.52,.08,.10,.47,1,1,0,.8);
    s.beam([tx-.26,y+.001,z+.048],[tx+.26,y+.001,z+.048],.007,.66,1,2,1.5);
  }

  // Low rear bridge: solid deck, tapered piers, and volumetric steel trusses.
  const bz=-1.24,deckY=-.12;
  s.box(.08,deckY,bz,5.2,.10,.32,.42,1,1,.025,.85);
  [-1.95,-.66,.64,1.94].forEach(x=>{
    s.surface(8,3,(u,v)=>{
      const a=u*TAU,rx=.107-.034*v,rz=.18-.045*v;
      return [x+Math.cos(a)*rx,-.63+.40*v,bz+Math.sin(a)*rz];
    },.45,1,1,1.1,true);
    s.box(x,-.60,bz,.25,.065,.38,.40,1,1,0,.9);
    s.box(x,-.20,bz,.25,.075,.36,.56,1,2,0,1);
  });
  [-1,1].forEach(side=>{
    const z=bz+side*.17;
    s.beam([-2.52,deckY+.08,z],[2.68,deckY+.08,z],.014,.62,1,2,1.1);
    s.beam([-2.52,deckY+.32,z],[2.68,deckY+.32,z],.017,.68,1,2,1.5);
    for(let i=0;i<12;i++) {
      const x=-2.52+i*5.2/12,next=x+5.2/12;
      s.beam([x,deckY+.07,z],[x,deckY+.32,z],.012,.62,1,2,1.8);
      s.beam([x,deckY+.08,z],[next,deckY+.32,z],.014,.64,1,2,1.3);
      s.beam([x,deckY+.32,z],[next,deckY+.08,z],.011,.54,1,2,.9);
    }
  });
  for(let i=0;i<=12;i++) {
    const x=-2.52+i*5.2/12;
    s.beam([x,deckY-.075,bz-.19],[x,deckY-.075,bz+.19],.014,.60,1,2,1.4);
    if(i%3===0)s.beam([x,deckY+.32,bz-.17],[x,deckY+.32,bz+.17],.011,.64,1,2,1.5);
  }
  [-1,1].forEach(side=>s.beam([-2.52,deckY-.078,bz+side*.13],[2.68,deckY-.078,bz+side*.13],.023,.50,1,1,1.2));

  // A single small moored boat gives the broad water a quiet scale reference.
  const boatX=center(.28)-.10,boatZ=.28,water=-.561;
  s.surface(32,10,(u,v)=>{
    const a=u*TAU,r=.10+.90*v;
    return [boatX+.13*Math.cos(a)*r,water-.072+.086*Math.pow(v,1.3),boatZ+.31*Math.sin(a)*r];
  },(u,v)=>.40+.10*v,0,2,1.8,true);
  s.tube(u=>[boatX+.13*Math.cos(u*TAU),water+.014,boatZ+.31*Math.sin(u*TAU)],.010,.68,0,2,2.6,32,6);
  [-.12,.11].forEach(z=>s.box(boatX,water-.001,boatZ+z,.21,.017,.045,.60,0,2,0,2.4));
  s.beam([boatX-.03,water+.025,boatZ-.1],[boatX+.28,water+.021,boatZ+.22],.007,.65,0,2,2);

  // The backpack is on +Z, so the child faces the river and the far city.
  const cx=1.48,cz=1.16,foot=bankHeight(cx,cz)+.025;
  // A lightly asymmetric coat has shoulders, a tapered waist, and an actual hem.
  s.surface(28,16,(u,v)=>{
    const a=u*TAU,y=.29+.37*v;
    const rx=.112+.035*Math.sin(v*Math.PI*.91),rz=.083+.030*Math.sin(v*Math.PI);
    return [cx+rx*Math.cos(a),foot+y,cz+rz*Math.sin(a)];
  },(u,v)=>.64+.06*v,2,3,5,true);
  s.ellipsoid(cx,foot+.62,cz,.143,.061,.099,.70,2,3,4);
  s.tube(u=>[cx+.114*Math.cos(u*TAU),foot+.302,cz+.085*Math.sin(u*TAU)],.008,.84,2,3,5,28,6);
  s.ellipsoid(cx,foot+.69,cz-.008,.046,.060,.049,.83,2,3,6);
  s.tube(u=>[cx+.055*Math.cos(u*TAU),foot+.655+.009*Math.sin(u*TAU),cz-.004+.053*Math.sin(u*TAU)],.011,.86,2,3,5,20,6);
  s.ellipsoid(cx,foot+.83,cz-.015,.158,.175,.143,.83,2,3,5);
  // The scalp is a shaped cap, leaving the forehead and face exposed on -Z.
  s.surface(36,16,(u,v)=>{
    const a=u*TAU,b=v*(1.60+.31*Math.sin(a)),lock=1+.022*Math.cos(a*9)*Math.sin(b);
    return [cx+.161*lock*Math.cos(a)*Math.sin(b),foot+.837+.177*Math.cos(b),cz-.012+.149*lock*Math.sin(a)*Math.sin(b)];
  },(u,v)=>.43+.045*Math.sin(u*TAU*5)+.035*(1-v),2,3,5.5);
  s.ellipsoid(cx,foot+.812,cz-.154,.026,.035,.031,.87,2,3,8);
  s.ellipsoid(cx,foot+.763,cz-.130,.064,.035,.030,.80,2,3,4);
  [-1,1].forEach(side=>{
    s.ellipsoid(cx+side*.155,foot+.811,cz-.012,.023,.038,.028,.79,2,3,7);
    s.ellipsoid(cx+side*.160,foot+.812,cz-.024,.015,.022,.013,.55,2,3,5);
    s.ellipsoid(cx+side*.060,foot+.852,cz-.148,.018,.010,.007,.40,2,3,7);
    // Separate trouser legs and stepped shoes remain clear from the rear and sides.
    const legX=cx+side*.070,kneeX=cx+side*.082,ankleX=cx+side*.095;
    const step=side<0?-.025:.025;
    s.tube(u=>[legX+(kneeX-legX)*u,foot+.30-.13*u,cz+step*u],.052,.56,2,3,5,8,10,.044);
    s.tube(u=>[kneeX+(ankleX-kneeX)*u,foot+.17-.10*u,cz+step],.043,.59,2,3,5,8,10,.035);
    s.ellipsoid(kneeX,foot+.17,cz+step,.044,.043,.044,.60,2,3,3);
    s.ellipsoid(ankleX,foot+.043,cz-.027+step,.062,.039,.106,.69,2,3,5);
    s.ellipsoid(ankleX,foot+.015,cz-.027+step,.065,.014,.109,.89,2,3,6);
    for(let lace=0;lace<2;lace++)s.beam([ankleX-.028,foot+.075,cz-.045+step-lace*.025],[ankleX+.028,foot+.075,cz-.045+step-lace*.025],.004,.92,2,3,7);
    // Upper sleeve, elbow, forearm, cuff, and a small hand replace a single capsule.
    const elbow=[cx+side*.19,foot+.47,cz+(side<0?-.022:.018)];
    const wrist=[cx+side*.20,foot+.355,cz-.044];
    s.ellipsoid(cx+side*.13,foot+.609,cz,.059,.068,.062,.71,2,3,4);
    s.tube(u=>[cx+side*.13+(elbow[0]-cx-side*.13)*u,foot+.61+(elbow[1]-foot-.61)*u,cz+(elbow[2]-cz)*u],.055,.71,2,3,5,8,10,.044);
    s.tube(u=>elbow.map((x,i)=>x+(wrist[i]-x)*u),.044,.73,2,3,5,8,10,.032);
    s.ellipsoid(...elbow,.045,.045,.045,.71,2,3,3);
    s.ellipsoid(wrist[0],wrist[1]+.007,wrist[2],.037,.019,.036,.88,2,3,6);
    s.ellipsoid(wrist[0],wrist[1]-.036,wrist[2]-.004,.032,.043,.029,.85,2,3,7);
    s.ellipsoid(wrist[0]-side*.027,wrist[1]-.025,wrist[2]-.010,.013,.025,.014,.79,2,3,7);
    // Coat seams and a side pocket stay visible when orbiting around the figure.
    s.tube(u=>[cx+side*(.116+.025*Math.sin(u*Math.PI)),foot+.32+.25*u,cz+.015],.0045,.82,2,3,5,10,5);
    s.beam([cx+side*.093,foot+.43,cz-.080],[cx+side*.066,foot+.38,cz-.086],.006,.84,2,3,5);
  });
  s.beam([cx,foot+.33,cz-.089],[cx,foot+.625,cz-.102],.005,.82,2,3,5);
  s.ellipsoid(cx,foot+.495,cz+.135,.133,.173,.080,.43,2,3,6);
  s.ellipsoid(cx,foot+.433,cz+.207,.090,.067,.027,.62,2,3,8);
  s.tube(u=>[cx-.085+.17*u,foot+.477+.009*Math.sin(u*Math.PI),cz+.220],.006,.90,2,3,8,14,6);
  s.beam([cx+.053,foot+.479,cz+.228],[cx+.053,foot+.456,cz+.230],.005,.94,2,3,8);
  s.tube(u=>[cx-.047+.094*u,foot+.648+.044*Math.sin(u*Math.PI),cz+.137],.010,.87,2,3,7,14,6);
  [-1,1].forEach(side=>{
    s.tube(u=>[cx+side*(.092+.025*Math.sin(u*Math.PI)),foot+.34+.30*u,cz+.07+.071*Math.sin(u*Math.PI)],.013,.88,2,3,5,16,7);
    s.tube(u=>[cx+side*(.105-.016*u),foot+.64+.036*Math.sin(u*Math.PI)-.065*u,cz+.116-.217*u],.012,.88,2,3,6,16,7);
    s.ellipsoid(cx+side*.122,foot+.44,cz+.136,.023,.048,.040,.62,2,3,5);
  });
  // Worn foreground embankment and a few stones anchor the figure to their home.
  s.tube(u=>[1.03+u*1.45,bankHeight(1.03+u*1.45,1.39)+.016,1.39+.13*Math.sin(u*2.3)],.026,.46,2,2,1,22,6);
  // A short set of water steps belongs to the bank; it does not become a new focal point.
  for(let step=0;step<4;step++) {
    const z=.68,x=center(z)+halfWidth(z)+.055+step*.065,y=-.57+step*.028;
    s.box(x,y-.028,z,.079,.056,.32,.41,0,1,0,.9);
    s.beam([x-.037,y+.002,z-.16],[x-.037,y+.002,z+.16],.006,.57,0,2,1.5);
  }
  [[1.00,1.52,.15],[2.11,1.24,.13],[2.35,.70,.09]].forEach(([x,z,r])=>s.ellipsoid(x,bankHeight(x,z),z,r,r*.55,r*.8,.40,2,0,.7,.08));
  return {...s.finish(56000,[cx,foot+.42,cz]),storyMode:1};
}
