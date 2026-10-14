// THOUSAND guides: five 3D orbs (WebGL shader on a displaced sphere), each with its own palette and voice.
import * as THREE from 'three';
THREE.ColorManagement.enabled = false;
/* ---------- Guides: five 3D orbs, each with its own palette and voice ---------- */
export const GUIDES={
  ember:{name:'Ember',role:'Direct coach',colors:['#FF4D1A','#FF2E6A','#FFB347'],sample:'No speeches. Show up, log the rep, go to bed.'},
  selah:{name:'Selah',role:'Pastoral, scripture-first',colors:['#E9A825','#FFF0C2','#B45F1E'],sample:'Be still. Then get up and do the next faithful thing.'},
  atlas:{name:'Atlas',role:'Strategist, all numbers',colors:['#5B4BFF','#36D6F2','#16124F'],sample:'You\'re 24 behind. Two extra reps a day closes it in 12.'},
  tide:{name:'Tide',role:'Calm encourager',colors:['#14B8A6','#7CC4FF','#D9FBF3'],sample:'One rep is still a rep. Start there.'},
  volt:{name:'Volt',role:'High energy',colors:['#A3FF3D','#00D9A0','#2F5BFF'],sample:'Let\'s go. Three reps before lunch.'}
};
export const orbGradient=k=>{const c=GUIDES[k].colors;return `radial-gradient(circle at 34% 28%, ${c[1]} 0%, ${c[0]} 45%, ${c[2]} 100%)`};
export const Orb=(()=>{
  const NOISE=`vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;
  const VS=`uniform float uTime;uniform float uAmp;uniform float uFreq;uniform float uBurst;
varying vec3 vN;varying vec3 vV;varying float vD;
${NOISE}
float disp(vec3 p){return snoise(p*uFreq+vec3(uTime*.25,uTime*.18,uTime*.21))*uAmp+uBurst*snoise(p*1.8+uTime*1.7);}
void main(){
  vec3 n=normalize(position);float d=disp(n);vec3 p=n*(1.0+d);
  vec3 t=normalize(abs(n.y)<0.99?cross(n,vec3(0.0,1.0,0.0)):cross(n,vec3(1.0,0.0,0.0)));vec3 b=cross(n,t);float e=0.01;
  vec3 n1=normalize(n+t*e);vec3 n2=normalize(n+b*e);
  vec3 q1=n1*(1.0+disp(n1));vec3 q2=n2*(1.0+disp(n2));
  vec3 nn=normalize(cross(q1-p,q2-p));if(dot(nn,n)<0.0)nn=-nn;
  vD=d;vN=normalize(normalMatrix*nn);
  vec4 mv=modelViewMatrix*vec4(p,1.0);vV=normalize(-mv.xyz);
  gl_Position=projectionMatrix*mv;
}`;
  const FS=`uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;
varying vec3 vN;varying vec3 vV;varying float vD;
void main(){
  vec3 n=normalize(vN);vec3 v=normalize(vV);vec3 l=normalize(vec3(-0.5,0.75,0.7));
  float g=smoothstep(-1.0,1.0,n.y*0.9-n.x*0.5+vD*3.0);
  vec3 col=mix(uC3,uC1,smoothstep(0.0,0.55,g));
  col=mix(col,uC2,smoothstep(0.5,1.0,g));
  col*=0.62+0.45*max(dot(n,l),0.0);
  float fr=pow(1.0-max(dot(n,v),0.0),2.6);
  col=mix(col,mix(uC2,vec3(1.0),0.25),fr*0.55);
  vec3 h=normalize(l+v);col+=vec3(1.0)*pow(max(dot(n,h),0.0),90.0)*0.7;
  col+=vec3(1.0)*pow(max(dot(n,h),0.0),12.0)*0.08;
  gl_FragColor=vec4(col,1.0);
}`;
  const MOODS={calm:{amp:.045,freq:.9,speed:.35},push:{amp:.09,freq:1.25,speed:1.05},celebrate:{amp:.075,freq:1.1,speed:.8}};
  function fallback(canvas,key){
    const d=document.createElement('div');d.className=canvas.className+' orb-fb';d.style.background=orbGradient(key);d.setAttribute('aria-hidden','true');
    canvas.replaceWith(d);
    return {dispose(){},setMood(){},burst(){},setGuide(k){d.style.background=orbGradient(k)}};
  }
  function make(canvas,key,opts={}){
    
    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'})}catch(e){return fallback(canvas,key)}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,20);cam.position.z=4.7;
    let target=GUIDES[key].colors.map(c=>new THREE.Color(c));
    const U={uTime:{value:Math.random()*10},uAmp:{value:.11},uFreq:{value:1.35},uBurst:{value:0},
      uC1:{value:target[0].clone()},uC2:{value:target[1].clone()},uC3:{value:target[2].clone()}};
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,opts.detail||40),new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS}));
    scene.add(mesh);
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mood=MOODS.calm;const cur={...MOODS.calm};let last=performance.now(),visible=true,alive=true,raf=0;
    const size=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
    const ro=new ResizeObserver(size);ro.observe(canvas);size();
    const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting});io.observe(canvas);
    const frame=now=>{if(!alive)return;if(!canvas.isConnected){dispose();return}raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(!visible)return;
      for(const k in cur)cur[k]+=(mood[k]-cur[k])*Math.min(1,dt*2.2);
      U.uTime.value+=dt*cur.speed*(reduce?.15:1);U.uAmp.value=cur.amp;U.uFreq.value=cur.freq;
      U.uBurst.value*=Math.pow(.2,dt);
      U.uC1.value.lerp(target[0],Math.min(1,dt*3));U.uC2.value.lerp(target[1],Math.min(1,dt*3));U.uC3.value.lerp(target[2],Math.min(1,dt*3));
      mesh.rotation.y+=dt*.18*cur.speed*(reduce?.2:1);mesh.rotation.x=Math.sin(U.uTime.value*.3)*.18;
      renderer.render(scene,cam)};
    const dispose=()=>{if(!alive)return;alive=false;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();mesh.geometry.dispose();mesh.material.dispose();renderer.dispose();renderer.forceContextLoss()};
    raf=requestAnimationFrame(frame);
    return {dispose,
      setMood(m){mood=MOODS[m]||MOODS.calm},
      burst(){if(!reduce)U.uBurst.value=.16},
      setGuide(k){target=GUIDES[k].colors.map(c=>new THREE.Color(c));if(!reduce)U.uBurst.value=.12}
    };
  }
  return {make};
})();
