// Dye diffusing in lit water, coloured by the family's natural dyes.
// Depth = time (gold at the surface, oxblood in the deep). Domain-warped fbm
// gives the plumes; caustics + light shafts + a sharp focal drop finish it.
// Ported verbatim from NewUI/heirloom-dyebath — the living-water ground.
export const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p; a*=.5; }
  return v;
}
vec3 dye(float t){
  vec3 weld=vec3(.92,.72,.30), madder=vec3(.78,.31,.21), woad=vec3(.32,.54,.60),
       indigo=vec3(.15,.27,.43), walnut=vec3(.50,.38,.24), cochineal=vec3(.56,.23,.35);
  vec3 c;
  if(t<.20) c=mix(weld,madder,t/.20);
  else if(t<.42) c=mix(madder,woad,(t-.20)/.22);
  else if(t<.62) c=mix(woad,indigo,(t-.42)/.20);
  else if(t<.82) c=mix(indigo,walnut,(t-.62)/.20);
  else c=mix(walnut,cochineal,(t-.82)/.18);
  return c;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x/u_res.y;
  vec2 p = vec2(uv.x*asp, uv.y);
  float d = 1.0 - uv.y;
  float t = u_time*0.045;

  vec2 q = vec2( fbm(p*1.6 + vec2(0.0,-t)),
                 fbm(p*1.6 + vec2(5.2,1.3) - vec2(0.0,t)) );
  vec2 r = vec2( fbm(p*1.6 + 3.2*q + vec2(1.7,9.2)),
                 fbm(p*1.6 + 3.2*q + vec2(8.3,2.8)) );
  float dens = fbm(p*1.9 + 3.6*r - vec2(0.0,t*1.4));
  dens = smoothstep(0.30, 0.92, dens);

  float ramp = clamp(d + (r.x-0.5)*0.22 + (q.y-0.5)*0.10, 0.0, 1.0);
  vec3 col = dye(ramp);

  vec3 water = vec3(0.015,0.04,0.055);
  float lift = mix(0.55, 1.85, pow(1.0-d, 0.5));
  vec3 c = mix(water, col*1.7, dens*lift);

  float caust = fbm(vec2(p.x*9.0 + t*2.2, p.y*3.0 - t));
  caust = pow(max(caust,0.0), 2.0);
  c += vec3(0.55,0.80,0.70) * caust * smoothstep(0.0,0.42,1.0-d) * 0.16;

  float ray = pow(max(0.0,1.0-d),1.6) * (0.5+0.5*sin(p.x*5.0+1.2)) * (0.5+0.5*sin(p.x*11.0)) * 0.10;
  c += vec3(0.95,0.86,0.6) * ray;

  vec2 dp = vec2(0.60*asp, 0.70);
  float dd = length(p - dp);
  c += vec3(1.0,0.82,0.42) * exp(-dd*dd*2600.0) * 1.8;
  c += vec3(0.95,0.70,0.35) * exp(-dd*dd*240.0) * 0.26;
  float tail = exp(-pow((p.x-dp.x)*70.0,2.0)) * smoothstep(0.70,0.42,uv.y) * 0.16;
  c += vec3(0.9,0.7,0.35)*tail;

  c *= mix(1.06, 0.42, d);
  float vig = smoothstep(1.25, 0.35, length(uv-0.5));
  c *= vig;

  c = pow(max(c,0.0), vec3(0.92));
  c = (c-0.5)*1.14 + 0.5;
  float l = dot(c, vec3(0.299,0.587,0.114));
  c = mix(vec3(l), c, 1.12);
  c = max(c, vec3(0.0));
  gl_FragColor = vec4(c, 1.0);
}
`
