// Dye diffusing in lit water, coloured by the family's natural dyes. Domain-
// warped fbm gives the plumes; caustics + light shafts + a sharp focal drop
// finish it. Ported from NewUI/heirloom-dyebath, then re-lit for The Deep — the
// ambient light (rays + focal shaft) is cold deep-water blue, not gold, so the
// family-less ground reads as the abyss; family dye plumes (u_dye0..5) still
// carry each family's colour through the cold light.
export const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_depth; // 0 = surface (now) … 1 = deep past; scroll-linked
uniform float u_rippleT; // seconds since an entry settled (large = no ripple)
uniform vec3 u_tint;     // dye of the entry being read (deep:tint)
uniform float u_tintAmt; // 0 = no reading tint … 1 = fully suffused
uniform vec2 u_ptr;      // slow-following pointer, p-space (desktop only)
uniform float u_ptrAmt;  // 0 until the hand first moves
// The family's six ramp colours (surface → deep). Defaults to the approved
// ground; reseeded from the signed-in family's actual dyes by WaterCanvas.
uniform vec3 u_dye0,u_dye1,u_dye2,u_dye3,u_dye4,u_dye5;

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
  vec3 c;
  if(t<.20) c=mix(u_dye0,u_dye1,t/.20);
  else if(t<.42) c=mix(u_dye1,u_dye2,(t-.20)/.22);
  else if(t<.62) c=mix(u_dye2,u_dye3,(t-.42)/.20);
  else if(t<.82) c=mix(u_dye3,u_dye4,(t-.62)/.20);
  else c=mix(u_dye4,u_dye5,(t-.82)/.18);
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
  // Lower the surface lift so the upper field stays deep — text lives up here,
  // and the constitution wants 60–70% calm negative space, not a blown-out pool.
  float lift = mix(0.55, 1.35, pow(1.0-d, 0.5));
  vec3 c = mix(water, col*1.7, dens*lift);

  float caust = fbm(vec2(p.x*9.0 + t*2.2, p.y*3.0 - t));
  caust = pow(max(caust,0.0), 2.0);
  c += vec3(0.55,0.80,0.70) * caust * smoothstep(0.0,0.42,1.0-d) * 0.16;

  float ray = pow(max(0.0,1.0-d),1.6) * (0.5+0.5*sin(p.x*5.0+1.2)) * (0.5+0.5*sin(p.x*11.0)) * 0.07;
  c += vec3(0.60,0.80,0.95) * ray;

  // The focal shaft — pulled WAY down from a sun-bright bloom to a distant deep-
  // water glow. The old hotspot sat exactly where headlines and form fields land
  // (upper-centre), washing cream type to near-illegible. A dimmer core + halo
  // keeps the light's direction without competing with the type (Rule 1).
  vec2 dp = vec2(0.60*asp, 0.70);
  float dd = length(p - dp);
  c += vec3(0.72,0.90,1.0) * exp(-dd*dd*2600.0) * 0.80;
  c += vec3(0.38,0.64,0.86) * exp(-dd*dd*240.0) * 0.15;
  float tail = exp(-pow((p.x-dp.x)*70.0,2.0)) * smoothstep(0.70,0.42,uv.y) * 0.11;
  c += vec3(0.40,0.62,0.80)*tail;

  // The water notices the hand: a faint luminance drifting after the pointer
  // (heavily smoothed on the JS side — presence, not a cursor effect).
  float pd = length(p - u_ptr);
  c += vec3(0.45, 0.68, 0.80) * exp(-pd*pd*70.0) * 0.10 * u_ptrAmt;

  c *= mix(0.88, 0.40, d);
  float vig = smoothstep(1.25, 0.35, length(uv-0.5));
  c *= vig;

  c = pow(max(c,0.0), vec3(0.92));
  c = (c-0.5)*1.14 + 0.5;
  float l = dot(c, vec3(0.299,0.587,0.114));
  c = mix(vec3(l), c, 1.12);
  c = max(c, vec3(0.0));
  // The settle ripple: when an entry is lowered in (deep:settled), one ring
  // expands from mid-water and fades — the water acknowledging what it holds.
  if (u_rippleT < 6.0) {
    vec2 rc = vec2(0.5*asp, 0.55);
    float rr = length(p - rc);
    float ring = exp(-pow((rr - u_rippleT*0.20)*18.0, 2.0)) * exp(-u_rippleT*0.8);
    c += vec3(0.93, 0.86, 0.72) * ring * 0.26;
  }

  // The reading tint: the water suffuses toward the dye of the entry being
  // read — the room takes the author's colour while their words are open.
  c = mix(c, c * (vec3(0.45) + u_tint * 1.4), u_tintAmt * 0.38);

  // Depth = time: as the reader scrolls into the past the water deepens —
  // darker, cooler, stiller. Driven by the deep:depth event (ClothShell scroll).
  c *= mix(1.0, 0.45, u_depth);
  c = mix(c, c * vec3(0.82, 0.94, 1.10), u_depth * 0.6);
  gl_FragColor = vec4(c, 1.0);
}
`
