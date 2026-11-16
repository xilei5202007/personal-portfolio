/* Original portfolio display studies, not replicas of in-game models or maps.
 * Y is up; +Z faces the viewer. Surface-area sampling is deterministic.
 * The river composition is interpretive, not a geographical survey of Wuhan.
 */
export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function unit(n) { const l = Math.hypot(...n); return l > 1e-9 ? n.map(v => v/l) : [0,1,0]; }

export function createSurfaceStudy(seed) {
  const triangles = [];
  let total = 0, state = seed >>> 0;
  const random = () => { state = (Math.imul(state,1664525)+1013904223) >>> 0; return state/4294967296; };
  function tri(a,b,c,group,part,weight=1) {
    const area = Math.hypot(...cross(sub(b.p,a.p),sub(c.p,a.p)))*.5;
    if (area < 1e-10) return;
    total += area*weight;
    triangles.push({a,b,c,group,part,end:total});
  }
  function surface(nu,nv,fn,tone,group,part,weight=1,flip=false,accept=null) {
    const rows = [];
    for (let j=0;j<=nv;j++) {
      const row=[];
      for (let i=0;i<=nu;i++) {
        const u=i/nu,v=j/nv,e=.0001,p=fn(u,v);
        const du=sub(fn(Math.min(1,u+e),v),fn(Math.max(0,u-e),v));
        const dv=sub(fn(u,Math.min(1,v+e)),fn(u,Math.max(0,v-e)));
        row.push({p,n:unit(flip?cross(dv,du):cross(du,dv)),t:typeof tone==='function'?tone(u,v,p):tone});
      }
      rows.push(row);
    }
    function add(a,b,c) {
      if (accept && !accept(a.p,b.p,c.p)) return;
      tri(a,b,c,group,part,weight);
    }
    for (let j=0;j<nv;j++) for (let i=0;i<nu;i++) {
      add(rows[j][i],rows[j][i+1],rows[j+1][i+1]);
      add(rows[j][i],rows[j+1][i+1],rows[j+1][i]);
    }
  }
  function quad(a,b,c,d,n,t,g,p,w=1) {
    const vertex = x=>({p:x,n,t});
    a=vertex(a);b=vertex(b);c=vertex(c);d=vertex(d);
    tri(a,b,c,g,p,w);tri(a,c,d,g,p,w);
  }
  function box(cx,cy,cz,sx,sy,sz,t,g,p,yaw=0,w=1) {
    const c=Math.cos(yaw),s=Math.sin(yaw),x=sx/2,y=sy/2,z=sz/2;
    const at=(x,y,z)=>[cx+x*c+z*s,cy+y,cz-x*s+z*c];
    const normal=(x,y,z)=>[x*c+z*s,y,-x*s+z*c];
    quad(at(-x,-y,z),at(x,-y,z),at(x,y,z),at(-x,y,z),normal(0,0,1),t,g,p,w);
    quad(at(x,-y,-z),at(-x,-y,-z),at(-x,y,-z),at(x,y,-z),normal(0,0,-1),t*.91,g,p,w);
    quad(at(x,-y,z),at(x,-y,-z),at(x,y,-z),at(x,y,z),normal(1,0,0),t*.94,g,p,w);
    quad(at(-x,-y,-z),at(-x,-y,z),at(-x,y,z),at(-x,y,-z),normal(-1,0,0),t*.94,g,p,w);
    quad(at(-x,y,z),at(x,y,z),at(x,y,-z),at(-x,y,-z),[0,1,0],Math.min(.98,t*1.07),g,p,w);
    quad(at(-x,-y,-z),at(x,-y,-z),at(x,-y,z),at(-x,-y,z),[0,-1,0],t*.72,g,p,w*.4);
  }
  function ellipsoid(cx,cy,cz,rx,ry,rz,t,g,p,w=1,warp=0) {
    surface(24,14,(u,v)=>{
      const a=u*TAU,b=v*Math.PI,k=1+warp*Math.sin(a*5+.6)*Math.sin(b*3);
      return [cx+rx*k*Math.cos(a)*Math.sin(b),cy+ry*k*Math.cos(b),cz+rz*k*Math.sin(a)*Math.sin(b)];
    },t,g,p,w);
  }
  function tube(fn,r,t,g,p,w=1,steps=18,sides=8,endRadius=r) {
    surface(steps,sides,(u,v)=>{
      const a=fn(u), tangent=unit(sub(fn(Math.min(1,u+.0001)),fn(Math.max(0,u-.0001))));
      const normal=unit(cross(tangent,Math.abs(tangent[1])<.92?[0,1,0]:[1,0,0]));
      const bitangent=unit(cross(tangent,normal)),theta=v*TAU,rr=r+(endRadius-r)*u;
      return a.map((x,i)=>x+rr*(normal[i]*Math.cos(theta)+bitangent[i]*Math.sin(theta)));
    },t,g,p,w,true);
  }
  const beam=(a,b,r,t,g,p,w=1)=>tube(u=>a.map((x,i)=>x+(b[i]-x)*u),r,t,g,p,w,3,8);
  function roof(cx,y,cz,width,depth,height,t,g,p,w=1) {
    for(let side=0;side<4;side++) {
      const co=Math.cos(side*Math.PI/2),si=Math.sin(side*Math.PI/2);
      const sideWidth=side%2?depth:width,sideDepth=side%2?width:depth;
      const at=(u,v,underside=0)=>{
        const r=.15+.85*v,a=(2*u-1),x=a*sideWidth*r/2,z=sideDepth*r/2;
        const yy=y+height*Math.pow(1-v,.68)+.10*Math.pow(v,4)*(Math.pow(Math.abs(a),3)+.13)
          +.006*Math.cos(u*TAU*10)*Math.sin(v*Math.PI)-underside;
        return [cx+x*co+z*si,yy,cz-x*si+z*co];
      };
      surface(20,12,(u,v)=>at(u,v), (u,v)=>t+.045*Math.cos(u*TAU*10),g,p,w,true);
      surface(10,5,(u,v)=>at(u,v,.035),t*.58,g,p,w*.35,false);
      tube(u=>at(u,1),.017,Math.min(.96,t+.16),g,2,w*1.5,24,6);
      tube(v=>at(0,v),.014,Math.min(.93,t+.13),g,2,w,12,6);
    }
    box(cx,y+height-.016,cz,width*.15,.035,depth*.15,t*.8,g,p,0,w*.5);
  }
  function finish(count,storyOrigin) {
    const positions=new Float32Array(count*3),normals=new Float32Array(count*3);
    const tones=new Float32Array(count),groups=new Float32Array(count),parts=new Float32Array(count),seeds=new Float32Array(count);
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<count;i++) {
      const target=random()*total;
      let lo=0,hi=triangles.length-1;
      while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].end<target)lo=mid+1;else hi=mid;}
      const q=triangles[lo],r=Math.sqrt(random()),s=random(),weights=[1-r,r*(1-s),r*s],vv=[q.a,q.b,q.c];
      const n=unit([0,1,2].map(k=>vv.reduce((sum,v,j)=>sum+v.n[k]*weights[j],0)));
      for(let k=0;k<3;k++) {
        const x=vv.reduce((sum,v,j)=>sum+v.p[k]*weights[j],0);
        positions[i*3+k]=x;normals[i*3+k]=n[k];min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);
      }
      tones[i]=clamp(vv.reduce((sum,v,j)=>sum+v.t*weights[j],0)*( .96+random()*.08),.1,1);
      groups[i]=q.group;parts[i]=q.part;seeds[i]=random();
    }
    return {positions,normals,tones,groups,parts,seeds,count,bounds:{min,max},storyOrigin};
  }
  return {surface,box,ellipsoid,tube,beam,roof,quad,random,finish};
}
