// ================================================================
// PLATFORM ADAPTER — Reddit / Devvit
// reference/blob-drop.html is still the Poki build; this file is the Devvit one,
// and scripts/port.py is the diff between them. Every edit it makes asserts on
// the exact text it expects, so a change upstream fails the port loudly instead
// of half-applying it. Re-run it rather than hand-editing this file.
//
// hub.js is the blob hub's shared adapter — storage, the daily seed, the board
// and the comment bridge — and every game in the app uses it identically.
//
// Nothing below is load-bearing. With hub.js missing or the server unreachable
// the game plays exactly as it does offline: no saves, no board, no comment.
// ================================================================
const HUB = typeof BlobHub!=='undefined' ? BlobHub.create('drop') : null;
function platformInit(){
  if(!HUB)return Promise.resolve();
  return HUB.ready.catch(()=>{});
}
function platformLoaded(){ /* no loading handshake on Devvit; the webview is live. */ }

// Mirrors the webview mode onto <html> so the stylesheet can hand vertical
// panning back to the feed while the post is a card in it. Re-checked on the
// slow timer that heals layout, because expanding does not reload the page.
function syncViewMode(){
  document.documentElement.classList.toggle('inline', !!HUB && HUB.mode==='inline');
}

// gameplayStart/gameplayStop had to strictly alternate for Poki. Devvit asks
// for nothing, but the flag still gates the run funnel, so both stay: a run
// begins on the player's first drop, never on load.
let playActive=false, paused=false;
function beginPlay(){
  if(playActive||paused||gameOver)return;
  playActive=true;
}
function endPlay(){
  if(!playActive)return;
  playActive=false;
}

// Buffered and flushed by the hub; see src/client/hub.ts. Same three-part shape
// as the Poki build so the numbers stay comparable across platforms.
function track(cat,what,action){
  if(HUB)try{HUB.track(cat,what,action);}catch(e){}
}

// ================================================================
// PURE PBD SOFT BODY PHYSICS — no Matter.js, no rigid body solver
//
// Each blob = ring of mass points + internal constraints.
// Position-Based Dynamics: constraints correct positions directly.
// No solver fighting itself — no clipping, no runaway blobs.
// ================================================================

// ---------- canvas ----------
// The canvas covers the viewport; logical W/H are derived from its aspect.
// Two invariants hold across every screen shape, because the physics balance
// is tuned to them: the pit's inner width is always 428 logical px, and the
// pit's capacity (danger line to floor) is always 422 logical px. Screens
// only ever gain margin, never gameplay space.
let W=480,H=836;
const canvas=document.getElementById('c');
// Not const: the draw helpers all target this one binding, so pre-rendering a
// layer is a matter of pointing it at an offscreen context for a moment.
let ctx=canvas.getContext('2d');
// dpr is a live value, not a constant: the perf ladder can step it down
// one-way on devices whose GPU can't fill the canvas (see updateQuality).
let dpr=Math.min(window.devicePixelRatio||1,2);
let RENDER_S=1;   // physical canvas px per logical px

// The iframe lies about the viewport: visualViewport, innerWidth/Height and
// documentElement.client* can all disagree, and resize storms produce
// degenerate readings (352x1 was observed in the wild). Take the SMALLEST
// measurement that is credible (>=200px per axis) and keep the last good
// value when none is; a 1s re-fit timer heals transients.
let lastVW=0,lastVH=0;
function viewportSize(){
  const cands=[];
  if(window.visualViewport)cands.push([visualViewport.width,visualViewport.height]);
  cands.push([innerWidth,innerHeight]);
  if(document.documentElement)cands.push([document.documentElement.clientWidth,document.documentElement.clientHeight]);
  let best=null;
  for(const [w,h] of cands){
    if(w>=200&&h>=200&&(!best||w*h<best[0]*best[1]))best=[w,h];
  }
  return best;
}

// Above this aspect the stacked portrait layout runs out of height and the
// HUD moves into the side margins instead.
const LANDSCAPE_AT=1.05;

function fit(force){
  const v=viewportSize();
  if(v){lastVW=v[0];lastVH=v[1];}
  if(!lastVW)return;               // nothing credible yet, keep waiting
  const vw=lastVW,vh=lastVH;
  if(!force&&Math.abs(vw*dpr-canvas.width)<1&&Math.abs(vh*dpr-canvas.height)<1)return;
  const aspect=vw/vh;
  if(aspect<LANDSCAPE_AT){
    // Portrait/squarish: never narrower than the 480 column, never shorter
    // than the 836 stacked layout needs; extra height becomes fall room.
    W=Math.round(Math.max(480,836*aspect));
    H=Math.round(W/aspect);
  }else{
    // Landscape wraps the pit block (hold row + pit + floor) as tightly as
    // the side panels allow, so the pit renders as LARGE as possible: at 640
    // logical height the pit is ~75% of the screen instead of ~55%. Toward
    // square aspects the height grows again (796/aspect) so the margins keep
    // enough width for the buttons and ticket.
    H=Math.max(640,Math.round(796/aspect));
    W=Math.round(H*aspect);
  }
  canvas.style.width=vw+'px'; canvas.style.height=vh+'px';
  RENDER_S=vw*dpr/W;
  canvas.width=Math.round(W*RENDER_S); canvas.height=Math.round(H*RENDER_S);
  layout();
}

// ---------- layout ----------
// Everything below is recomputed by layout(); nothing is hardcoded to a
// screen shape. The pit is always centred at W/2 in both modes, so W/2 keeps
// meaning "middle of the play field" everywhere in the drawing code.
let MODE='portrait';
let LEFT_X=26,RIGHT_X=454,FLOOR_Y=622,DANGER_Y=200;
// Where the held blob sits while aiming. Kept a fixed 60px above the danger
// line so the drop geometry (and therefore aim feel) is identical on every
// screen shape.
let HOLD_Y=140;
let PS=1;              // panel scale: side-margin HUD grows on wide screens
                       // so labels stay readable at desktop cover sizes
let BTN_SLOTS=[];      // powerup button rects {x,y,w,h}, any arrangement
let TICKET={cx:240,cy:678,vertical:false,maxW:456,dotScale:1};
let SCORE_X=22,SCORE_Y=18,PILL_Y=98,NEXT_X=428,NEXT_Y=30;
let GO_CONT_Y=442,GO_AGAIN_Y=536;
// Pause button: top-centre in portrait (score sits left, NEXT right), and in
// the right panel opposite the score sticker in landscape.
let PAUSE={cx:240,cy:46,r:22};
// Board button. Beside the pause sticker in both modes: restart, pause and
// board make one row.
let TROPHY={cx:296,cy:46,r:22};
// Restart. Pause already offers one behind its menu; this is the direct route.
let RESTART={cx:184,cy:46,r:22};
// Optional rewarded ad during a run: fills every powerup. Self-limiting — it
// only appears while something is actually below full, so it can't be farmed
// on a fully charged board.
// Bounding box of the cached panel UI (ticket + buttons + charge), so that
// layer is blitted at its own size rather than as a full-canvas overlay.
let UI_RECT={x:0,y:600,w:480,h:236};
let layoutInited=false;

function layout(){
  const oldL=LEFT_X,oldF=FLOOR_Y;
  const landscape=W/H>=LANDSCAPE_AT;
  MODE=landscape?'landscape':'portrait';
  LEFT_X=Math.round(W/2)-214; RIGHT_X=Math.round(W/2)+214;
  if(landscape){
    FLOOR_Y=H-48;
    // Panel scale targets real on-screen text size: a small embed shows a
    // logical px well under 1 CSS px, so panel UI must grow or its labels
    // render around 7-10 CSS px. 0.83/cssScale keeps a 17px button label near
    // the ~14px CSS floor; clamped so huge viewports don't shrink it below 1.2.
    const cssScale=(lastVH||H)/H;
    PS=Math.max(1.2,Math.min(2.1,0.83/cssScale));
    DANGER_Y=FLOOR_Y-422; HOLD_Y=DANGER_Y-60;
    const margin=LEFT_X-PLANK;
    // panels hug the pit rather than the screen edge on very wide canvases
    const inset=Math.min(margin,340)/2;
    const lcx=LEFT_X-PLANK-inset, rcx=RIGHT_X+PLANK+inset;
    // left column: score, best pill, next, vertical merge-order ticket
    SCORE_X=lcx; SCORE_Y=40;             // SCORE_X is a CENTER in landscape
    PILL_Y=SCORE_Y+60*PS+24;
    NEXT_X=lcx; NEXT_Y=PILL_Y+46;
    // dotScale shrinks if the column would overflow the tighter landscape
    // height (ticket height ~= 44 + 284*dotScale)
    const tTop=NEXT_Y+74*PS+18;
    TICKET={cx:lcx,cy:tTop,vertical:true,maxW:margin-16,
            dotScale:Math.max(0.85,Math.min(1.2,PS,(H-tTop-60)/284))};
    // Restart, pause, board: one row along the top of the right panel, each
    // with its readout under it (the twist under restart, the rank under the
    // trophy). Sized to the panel the way the portrait row is, so a near
    // square window cannot push the ends onto the plank or off the screen.
    const br=Math.max(14,Math.min(22*PS,(margin-16)/7.2));
    PAUSE={cx:rcx,cy:14+br,r:br};
    RESTART={cx:rcx-br*2.6,cy:PAUSE.cy,r:br};
    TROPHY={cx:rcx+br*2.6,cy:PAUSE.cy,r:br};
    // Bottom of the row plus the two lines of rank text. Nothing in this
    // panel may be placed above it.
    const hudBottom=TROPHY.cy+TROPHY.r+Math.round(30*PS);
    // right column: powerup buttons, 2x2 when the margin allows, else 1x4
    const bw=Math.min(Math.round(120*PS),margin-28), bh=Math.round(60*PS), gap=12;
    BTN_SLOTS=[];
    if(margin>=bw*2+gap+28){
      // anchor the grid off the pit's plank, never past it: centring on rcx
      // can push the left column of buttons onto the field on wide-but-not-
      // huge margins
      const free=margin-(bw*2+gap);
      const x0=RIGHT_X+PLANK+Math.min(free/2,120);
      const gridH=bh*2+gap;
      const y0=Math.min(hudBottom+gap,H-gridH-14);
      for(let i=0;i<4;i++)
        BTN_SLOTS.push({x:x0+(i%2)*(bw+gap),y:y0+Math.floor(i/2)*(bh+gap),w:bw,h:bh});
    }else{
      const gridH=bh*4+gap*3;
      const y0=Math.min(hudBottom+gap,H-gridH-14);
      for(let i=0;i<4;i++)
        BTN_SLOTS.push({x:rcx-bw/2,y:y0+i*(bh+gap),w:bw,h:bh});
    }
    // The jar: centred under the grid, above the plays pill at the bottom of
    // the panel. Halfway between the two when the column has room, pushed up
    // against the pill when it does not.
    let gx=1e9,gr=-1e9,gb=-1e9;
    for(const s of BTN_SLOTS){gx=Math.min(gx,s.x);gr=Math.max(gr,s.x+s.w);gb=Math.max(gb,s.y+s.h);}
    const jcx=Math.round((gx+gr)/2), pillTop=H-Math.round(30*PS);
    const need=r=>r*2.74+Math.round(9*PS)+Math.round(8*PS);   // cork to label, with air
    const jrFull=Math.round(25*Math.min(PS,1.2));
    if(pillTop-gb>=need(jrFull)){
      JAR={cx:jcx,cy:Math.round((gb+pillTop)/2-jrFull*0.08-4*PS),r:jrFull,tight:false};
    }else{
      // A short column (a squat embed at a large panel scale): a smaller jar
      // resting on the bottom edge, and the plays pill beside it instead.
      const jr=Math.round(21*Math.min(PS,1.2));
      JAR={cx:jcx,cy:Math.round(H-4-jr*1.45-Math.round(9*PS)),r:jr,tight:true};
    }
  }else{
    FLOOR_Y=H-214;
    DANGER_Y=FLOOR_Y-422; HOLD_Y=DANGER_Y-60;
    // A tall phone leaves a deep empty band above the pit. Spend a little of
    // it lifting the pit, which buys room UNDER the pit for the charge bar,
    // and let the rest scale the top HUD up — its 9-11px labels are the
    // smallest text in the game and a phone renders a logical px at ~0.8 CSS.
    const lift=Math.max(0,Math.min(26,(DANGER_Y-52)-200));
    FLOOR_Y-=lift; DANGER_Y-=lift; HOLD_Y-=lift;
    const cssScale=(lastVW||W)/W;
    PS=Math.min(1.65,Math.max(
      Math.max(1,0.85/cssScale),                        // legibility floor
      Math.max(1,Math.min(1.5,(DANGER_Y-52)/230))));    // free space above
    SCORE_X=LEFT_X-4; SCORE_Y=18;
    PILL_Y=SCORE_Y+60*PS+20;
    NEXT_X=RIGHT_X-26*PS; NEXT_Y=26;
    // Three buttons where the standalone game had one, and no row was built
    // for three.
    //
    // The top row holds the score card, which grows rightward with every digit
    // the score gains, and the NEXT preview. Under the BEST pill there is
    // often an open band — but the blob waiting to drop sweeps across it as
    // you aim, so that band is only usable where it is deep enough to sit
    // clear of the blob. Tall phones have that depth (and the widest cards,
    // because the HUD scales up into their spare height); squat ones do not,
    // but they have width to spare on the top row instead. So: the band where
    // it is deep, the top row where it is not, sized to what is actually left
    // between the card and NEXT.
    const btnIdeal=22*PS, cardRes=176*PS;   // the reserve the card is held to
    const bandTop=PILL_Y+14*PS+12, bandBot=HOLD_Y-46;
    // Either way they end at the right edge of the pit, under the NEXT
    // preview: the controls have one home, and the HUD reads as two columns
    // rather than as an island floating in the middle of the band.
    if(bandBot-bandTop>=btnIdeal*2){
      PAUSE={cx:RIGHT_X-btnIdeal*3.6,cy:bandTop+btnIdeal,r:btnIdeal};
    }else{
      const rt=NEXT_X-26*PS-12, lf=SCORE_X+cardRes+12;
      const r=Math.max(14,Math.min(btnIdeal,(rt-lf)/7.2));
      PAUSE={cx:rt-r*3.6,cy:SCORE_Y+30*PS,r};
    }
    TROPHY={cx:PAUSE.cx+PAUSE.r*2.6,cy:PAUSE.cy,r:PAUSE.r};
    RESTART={cx:PAUSE.cx-PAUSE.r*2.6,cy:PAUSE.cy,r:PAUSE.r};
    if(bandBot-bandTop>=btnIdeal*2){
      // the deep band: left end, level with the buttons at its right end
      const jr=Math.round(PAUSE.r*1.05);
      JAR={cx:SCORE_X+jr+8,cy:PAUSE.cy+jr*0.25,r:jr};
    }else{
      // no band: tucked under the BEST pill, small, and drawn before the
      // held blob so an aim to the far left passes in front of it
      const jr=Math.round(17*PS);
      JAR={cx:SCORE_X+jr+8,cy:PILL_Y+14*PS+10+jr*1.4,r:jr};
    }
    const bx0=LEFT_X-10, bw=(RIGHT_X+10-bx0-3*BTN_GAP)/4, btnY=H-96;
    BTN_SLOTS=[];
    for(let i=0;i<4;i++)BTN_SLOTS.push({x:bx0+i*(bw+BTN_GAP),y:btnY,w:bw,h:BTN_H-6});
    const tMax=RIGHT_X-LEFT_X+PLANK*2+12, cardH=58;
    const tCy=FLOOR_Y+PLANK+12+cardH/2;
    // The charge button used to sit here and forced the ticket off-centre in a
    // short window to share its row. With it gone the ticket simply centres on
    // the pit in both cases; only the row it sits in still depends on headroom.
    const room=btnY-(tCy+cardH/2);
    TICKET={cx:(LEFT_X+RIGHT_X)/2,cy:room>=52?tCy:H-158,
            vertical:false,maxW:tMax,dotScale:1};
  }
  // Union of everything the cached UI layer draws, generously padded for
  // shadows, tilts and the ticket's halo ring.
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const add=(x,y,w,h)=>{
    if(x<x0)x0=x; if(y<y0)y0=y;
    if(x+w>x1)x1=x+w; if(y+h>y1)y1=y+h;
  };
  for(const s of BTN_SLOTS) add(s.x-8,s.y-8,s.w+16,s.h+22);
  if(TICKET.vertical){
    const s=TICKET.dotScale;
    add(TICKET.cx-(26*s+30),TICKET.cy-12,52*s+60,60+300*s);
  }else{
    add(TICKET.cx-TICKET.maxW/2-10,TICKET.cy-42,TICKET.maxW+20,84);
  }
  UI_RECT={x:Math.max(0,x0),y:Math.max(0,y0),
           w:Math.min(W,x1)-Math.max(0,x0),h:Math.min(H,y1)-Math.max(0,y0)};
  uiKey='';   // geometry moved: the cached layer is stale

  GO_CONT_Y=H/2+24; GO_AGAIN_Y=GO_CONT_Y+(BTN_H+28)*PS;
  if(!layoutInited){
    layoutInited=true;
    aimX=(LEFT_X+RIGHT_X)/2;
    return;
  }
  // The world lives in absolute coordinates, so when the pit moves (rotation,
  // window resize) every physics point and effect moves with it.
  const dx=LEFT_X-oldL, dy=FLOOR_Y-oldF;
  if(dx||dy){
    for(const b of blobs)for(const p of b.pts){p.x+=dx;p.px+=dx;p.y+=dy;p.py+=dy;}
    for(const p of particles){p.x+=dx;p.y+=dy;}
    for(const p of popups){p.x+=dx;p.y+=dy;}
    for(const r of rings){r.x+=dx;r.y+=dy;}
    aimX=clampAim(aimX+dx);
  }
}
// Design system palette. No pure white or black anywhere: cream and ink only.
const INK='#2f2013', INK_SOFT='rgba(47,32,19,0.62)';
const PAPER='#f6ead0';      // app background
const CARD='#fff6e2';       // ticket / card surface
const FIELD='#fbf2dd';      // play field surface
const CREAM='#fff6e0';      // lightest allowed
const DANGER_RED='#d95448';
const TEAL='#35c4bb';       // ready state accent (powerups)
// Button hierarchy: green is the primary "keep playing" action, and anything
// that costs the player an ad view gets the pale purple so it reads as an
// optional offer rather than the main way forward.
const GREEN='#74b83a';
const COMMENT_PURPLE='#cbaef2';
const SCORE_ORANGE='#f09425';
const INK_SHADOW='rgba(47,32,19,0.9)';   // hard sticker shadow
const INK_SOFT_SHADOW='rgba(47,32,19,0.22)';
// Rounded system font for small UI text: resolves to SF Pro Rounded on Apple
// devices, falls back to Varela Round / Nunito / system UI elsewhere.
const FONT="ui-rounded,'SF Pro Rounded','Varela Round','Nunito','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif";
// Modak is a single-weight display face — chunky and blobby, perfect for big
// text, but mushy below ~16px, so small labels stay on FONT. Never combine it
// with "bold": there is no bold cut, and synthetic bold smears the letterforms.
const DISPLAY="'Titan One',"+FONT;
// Chicle is also a display face but far more legible at small sizes than Modak,
// so it carries the interface text: buttons, labels, counters.
const UIFONT="'Baloo 2',"+FONT;
const BTN_H=66,BTN_GAP=8;   // portrait button metrics; landscape scales by PS
const SPAWN_TIERS=5;   // how many of the smallest tiers can appear as a drop

// ---------- PBD constants ----------
const SUBSTEPS   = 8;       // integration substeps per frame (full quality)
const D_ITERS    = 4;       // distance-constraint passes per substep
let dIters=D_ITERS;         // lowered by the quality ladder on weak devices

// --- Adaptive quality -------------------------------------------------
// A weak device can't afford 8 substeps x 4 iterations. Rather than drop
// frames, we drop substeps: physics gets slightly softer under load, which
// reads far better than stuttering. Everything that is defined "per substep"
// has to be rescaled when the count changes, or the feel drifts:
//   - gravity per step scales with sdt^2
//   - damping is compounded per substep, so the per-substep value must be
//     raised to a power that keeps the per-FRAME damping identical
//   - the displacement clamp is px-per-substep, so the speed ceiling it
//     implies would fall with fewer substeps unless scaled back up
let subSteps=SUBSTEPS, SDT_V, G_SDT2_V, DAMP_V, STEP_SCALE;
function setSubsteps(n){
  subSteps=n;
  SDT_V=DT/n;
  G_SDT2_V=GRAVITY*GRAV_MUL*SDT_V*SDT_V;
  DAMP_V=Math.pow(DAMPING,SUBSTEPS/n);
  STEP_SCALE=SUBSTEPS/n;
}
const DT         = 1/60;

const GRAVITY    = 1950;    // px/s²
let MUT='none';             // the post's twist, from init
let GRAV_MUL=1;             // low gravity scales the one gravity term

// Damping is applied per SUBSTEP (480x/sec), so it must be very close to 1.
const DAMPING    = 0.99952; // ~0.79 per second — wobble persists a beat longer
// Asymmetric stiffness is what makes a blob droop and fill its space.
// Stretching is resisted hard (the skin doesn't tear), but compression is
// resisted only weakly, so the surface can fold and flow into gaps instead of
// holding a rigid circle. Area preservation stops it collapsing.
// The skip-2 springs are the bending resistance: they are what stops the ring
// changing SHAPE. Softening them is what lets a blob flatten into an oval and
// squeeze through a gap. The neighbour springs control the perimeter length,
// so they stay comparatively firm or the skin stretches like chewing gum.
const N_STRETCH  = 0.19;   // neighbor spring, resisting stretch
const N_SQUASH   = 0.028;  // neighbor spring, resisting compression
const S2_STRETCH = 0.026;  // skip-2 spring, resisting stretch (shape memory)
const S2_SQUASH  = 0.005;  // skip-2 spring, resisting compression
// Pressure stays strong: it's what makes them read as heavy water balloons
// rather than puddles, and it's what pushes them out into open gaps.
const P_STIFF    = 0.55;    // pressure (volume) stiffness per substep
// No point may move more than this far in one substep, which is what stops
// blobs exploding on hard impacts. It must scale with point radius (tunneling
// risk is a function of size) BUT small blobs have tiny points, and the old
// pure-fraction version capped a tier-0 blob at ~460px/s — a hard terminal
// velocity that had nothing to do with gravity. The absolute floor fixes that.
const MAX_STEP_FRAC = 0.9;
const MAX_STEP_MIN  = 3.4;   // px per substep => ~1630 px/s floor for any size
// Distance constraints don't resist rotation, so a ring that gets spun keeps
// spinning forever. This bleeds off the rigid-rotation component each substep.
const SPIN_DAMP  = 0.055;
setSubsteps(SUBSTEPS);
function setQuality(level){
  const q=QUALITY[level];
  setSubsteps(q[0]);
  dIters=q[1];
}
const FLOOR_FRIC = 0.14;   // horizontal velocity lost per substep while touching a surface
// Mergeable pairs separate a little more weakly so they can nestle together,
// but merging now fires on surface contact so they never need deep overlap.
const MERGE_SEP  = 0.75;
// A newborn blob can't merge immediately. This exists so a blob created BY a
// merge doesn't instantly chain again mid-spawn-animation, which looks broken.
// It is not meant to gate a blob the player just fired: a full-power shot
// crosses the board in ~0.3s, so a 0.4s grace made aiming straight at a
// matching blob bounce off instead of merging, which is the one thing a player
// will try first. Shot blobs therefore get a much shorter grace, just long
// enough that they can't merge before leaving the launcher.
const MERGE_GRACE      = 0.40;   // blobs born from a merge
const MERGE_GRACE_SHOT = 0.06;   // blobs the player dropped or fired

// ---------- tiers ----------
// Every blob outlines in INK rather than a per-tier dark shade: the design
// system puts an ink border on everything structural. `dark` is kept only for
// the pattern overlay drawn inside each blob.
const TIERS=[
  {r:19, col:'#f26d9d',dark:'#c9345f',pat:'dots'    },
  {r:25, col:'#f0862c',dark:'#c05f12',pat:'stripes' },
  {r:32, col:'#f2c230',dark:'#c19412',pat:'rings'   },
  {r:41, col:'#74b83a',dark:'#4b8420',pat:'dots'    },
  {r:52, col:'#1fa8a0',dark:'#127770',pat:'stripes' },
  {r:65, col:'#3d87e0',dark:'#215eae',pat:'rings'   },
  {r:80, col:'#8f5ef2',dark:'#6231bd',pat:'dots'    },
  {r:97, col:'#d14fc4',dark:'#9c2a91',pat:'stripes' },
  {r:116,col:'#e8443a',dark:'#b0231b',pat:'rings'   },
  {r:138,col:'#edc84b',dark:'#bb9720',pat:'star'    },
];
const SCORE_PTS=[1,3,6,10,15,21,28,36,45,55];
const MAXT=TIERS.length-1;

// ---------- powerups ----------
// `hint` fires once per page load the first time each powerup becomes ready.
// A one-word button is fine once you know what it does; the hint is only there
// to get you over that first time. Kept to one short line each.
const POWERUPS=[
  {id:'shake',  label:'摇晃',  need:6,  charge:0, col:'#6fd8d0', hint:'摇动整堆球，让它们重新落位'},
  {id:'pop',    label:'戳破',  need:12, charge:0, col:'#ff8fab', hint:'点任意一只球把它消掉'},
  {id:'sweep',  label:'清扫',  need:16, charge:0, col:'#ffb35c', hint:'清掉最小的两种尺寸'},
  {id:'rainbow',label:'彩虹',  need:20, charge:0, col:'#b78cff', hint:'下一只球可以和任意球合并'},
];

// Session-scoped, NOT per-run: restarting shouldn't re-teach you the same four
// things. Deliberately not persisted to localStorage either, so a player coming
// back after a long gap gets the reminder.
const hintSeen={};
let hintQueue=[], hint=null;
// The missing-verb rescue. Tap-to-drop is self-evident; drag-to-aim is not,
// and a player who never finds it plays a much shallower game. Prompt at 8s
// (30s is useless, bouncers are gone by then; 8s rescued 64% of the players
// it was shown to on the previous game). visible/interact form a measured
// pair: rescue rate = interact/visible on tutorial/aim-prompt.
let aimPromptShown=false, aimedEver=false;
// Playtesters were finishing whole runs without ever firing a powerup. The
// one-word button labels plus an "n/m" counter never say that the buttons are
// FOR anything, so the first one to charge gets an explicit instruction and
// the ready buttons pulse until the player uses one.
let powerupUsedEver=false, powerupPromptShown=false;

function updateHints(dt){
  if(gameOver){hint=null;return;}   // never annotate the game over screen
  for(let i=0;i<POWERUPS.length;i++){
    const pu=POWERUPS[i];
    if(!hintSeen[pu.id]&&pu.charge>=pu.need){
      hintSeen[pu.id]=true;
      hintQueue.push({pu,i});
    }
  }
  if(!aimPromptShown&&!aimedEver&&time>8&&!gameOver){
    aimPromptShown=true;
    track('tutorial','aim-prompt','visible');
    hintQueue.unshift({aim:true});   // jumps the queue: it's the core verb
  }
  // One instruction on screen at a time: queue, don't stack.
  if(!hint&&hintQueue.length){
    const h=hintQueue.shift();
    if(h.aim){
      if(!aimedEver)hint={txt:'按住并向下拖动来瞄准',aim:true,t:0,dur:5.5};
    }else if(!powerupUsedEver){
      // First one ever: name the verb, don't just describe the effect.
      if(!powerupPromptShown){
        powerupPromptShown=true;
        track('tutorial','powerup-prompt','visible');
      }
      hint={txt:'点「'+h.pu.label+'」——'+h.pu.hint,slot:h.i,t:0,dur:5.5};
    }else{
      hint={txt:h.pu.label+'：'+h.pu.hint,slot:h.i,t:0,dur:4.2};
    }
  }
  if(hint){
    hint.t+=dt;
    if((hint.t>hint.dur)||(hint.aim&&aimedEver)) hint=null;
  }
}

// The curved leader from a powerup bubble down to the button it names. Dashed
// and flowing toward the target, because motion along the path is what carries
// the gaze the whole way down — a static line gets dropped at the pit floor.
// Both endpoints pick the edge facing the other, so this works unchanged in
// landscape, where the buttons sit beside the pit rather than under it.
function drawHintLeader(bx,by,bw,bh,s,t){
  const bcx=bx+bw/2, bcy=by+bh/2;
  const scx=s.x+s.w/2, scy=s.y+s.h/2;
  const sideways=Math.abs(scx-bcx)>Math.abs(scy-bcy);
  // leave the bubble from the edge facing the button...
  const sx=sideways?(scx>bcx?bx+bw+4:bx-4):bcx;
  const sy=sideways?bcy:(scy>bcy?by+bh+4:by-4);
  // ...and stop just short of the button's facing edge
  const ex=sideways?(scx>bcx?s.x-14:s.x+s.w+14):scx;
  const ey=sideways?scy:(scy>bcy?s.y-14:s.y+s.h+14);
  const dx=ex-sx, dy=ey-sy;
  if(Math.hypot(dx,dy)<40)return;   // too close to be worth drawing
  // Swing out in the direction of travel and come back in: a straight line
  // reads as a UI divider, an arc reads as something a hand drew.
  const dir=(sideways?dy:dx)>=0?1:-1;
  const bow=Math.max(36,Math.min(120,Math.hypot(dx,dy)*0.34));
  const c1x=sideways?sx+dx*0.40:sx+dir*bow;
  const c1y=sideways?sy+dir*bow:sy+dy*0.40;
  const c2x=sideways?ex-dx*0.28:ex-dir*bow*0.35;
  const c2y=sideways?ey-dir*bow*0.35:ey-dy*0.28;
  ctx.save();
  ctx.strokeStyle=INK;
  ctx.lineWidth=2.5;
  ctx.lineCap='round';
  ctx.setLineDash([9,7]);
  ctx.lineDashOffset=-t*30;
  ctx.beginPath();
  ctx.moveTo(sx,sy);
  ctx.bezierCurveTo(c1x,c1y,c2x,c2y,ex,ey);
  ctx.stroke();
  ctx.restore();
  // arrowhead along the curve's final tangent
  ctx.save();
  ctx.translate(ex,ey);ctx.rotate(Math.atan2(ey-c2y,ex-c2x));
  ctx.beginPath();
  ctx.moveTo(5,0);ctx.lineTo(-9,-6.5);ctx.lineTo(-9,6.5);
  ctx.closePath();
  ctx.fillStyle=INK;ctx.fill();
  ctx.restore();
}

function drawHint(){
  if(!hint)return;
  // fade in over 0.25s, hold, fade out over the last 0.5s
  const a=Math.min(1,hint.t/0.25)*Math.min(1,(hint.dur-hint.t)/0.5);
  const txt=hint.txt;
  const up=!!hint.aim;
  ctx.save();
  ctx.globalAlpha=a;
  ctx.font=`700 ${Math.round(13*PS)}px ${UIFONT}`;
  ctx.textAlign='center';
  const w=ctx.measureText(txt).width+26, h=30*PS;
  // The aim hint sits under the held blob pointing up at it. It converts at
  // ~67%, so it is left exactly as it was.
  //
  // Powerup hints used to sit directly above their button — BELOW the pit —
  // and converted at 18% in fit test #1: 520 of 633 players read a bubble
  // naming the verb and never pressed anything. Same queue, same renderer, same
  // visible/interact pair as the aim prompt, so the difference is placement.
  // The bubble now sits INSIDE the play area, just under the danger line where
  // the eye already is, and a curved leader walks the gaze down to the button
  // (which is already pulsing, see drawReadyPulse).
  const tx=up?aimX:(LEFT_X+RIGHT_X)/2;
  // clamp so the bubble never runs off either edge
  const cx=Math.max(w/2+8,Math.min(W-w/2-8,tx));
  const y=up?HOLD_Y+64:DANGER_Y+52;
  if(!up) drawHintLeader(cx-w/2,y,w,h,BTN_SLOTS[hint.slot],hint.t);
  ctx.beginPath();ctx.roundRect(cx-w/2,y,w,h,12);
  ctx.fillStyle=CARD;ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
  if(up){
    // pointer up toward the held blob
    const px=Math.max(cx-w/2+14,Math.min(cx+w/2-14,tx));
    ctx.beginPath();
    ctx.moveTo(px-7,y+1);ctx.lineTo(px+7,y+1);ctx.lineTo(px,y-9);
    ctx.closePath();
    ctx.fillStyle=CARD;ctx.fill();
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(px-7,y+1);ctx.lineTo(px,y-9);ctx.lineTo(px+7,y+1);ctx.stroke();
  }
  ctx.fillStyle=INK;
  ctx.fillText(txt,cx,y+20*PS);
  ctx.restore();
}

// ================================================================
// STORAGE
// Every key is namespaced with a save_ prefix so it is obvious in devtools
// which entries are ours and they can never collide with another game on the
// same origin. EVERY access is wrapped: in a private window localStorage
// exists but its quota is zero, so setItem throws rather than returning an
// error, and an unguarded write would take the whole game down. Nothing here
// is load-bearing — the game is fully playable with storage disabled.
// ================================================================
const SAVE_PREFIX='save_blobdrop_';
const KEY_BEST=SAVE_PREFIX+'best', KEY_RUN=SAVE_PREFIX+'run';
let storageOK=true;
// Backed by Redis through the hub instead of localStorage, but the contract is
// unchanged: synchronous, and every call safe to make when the store is dead.
// The cache behind it is empty until init lands, which is why the boot tail
// re-reads what depends on it rather than the game waiting on the network.
function storeGet(k){
  if(!HUB){storageOK=false;return null;}
  try{return HUB.get(k);}catch(e){storageOK=false;return null;}
}
function storeSet(k,v){
  if(!HUB){storageOK=false;return;}
  try{HUB.set(k,v);}catch(e){storageOK=false;}
}
function storeDel(k){
  if(!HUB){storageOK=false;return;}
  try{HUB.del(k);}catch(e){storageOK=false;}
}

// ---------- game state ----------
let blobs=[],mergeQueue=[];
let score=0,best=0;
best=+storeGet(KEY_BEST)||0;
let gameOver=false,dangerTimer=0;
let currentTier=0,nextTier=0;
let aimX=W/2;
let canDrop=true,dropT=0;
let overLine=false;   // a settled blob is above the danger line right now
// A run posts its score at most once, and posting buys nothing.
let scorePosted=false, commentPending=false;
// Reported on the score card: the biggest blob reached, and seconds actually
// played (menus, the board and game over do not count).
let maxTier=0, runTime=0;
// ---- the daily layer (MUT and GRAV_MUL live with the physics constants:
// setSubsteps() reads GRAV_MUL at boot, before this block exists) ----
let powerupsUsed=0;       // for the no-power-up goal
let dropsAtLevel=0;       // drops made when maxTier was first reached
const NOLINE_DROPS=30;    // the thirty-drops twist: no danger line, a fixed run
let finishT=0, finishNow=false;
// ---- the community jar ----
let jar=[];            // three slots: {tier, name, idx} (idx into HUB.jar)
let jarUsed=false;     // one swap per run
let jarOpen=false;     // broken open, blobs on offer
let heldOwner='';      // who the blob in hand came from, if the jar
let jarNotes={};       // owner -> best level their blob reached this run
let jarTell=null;      // a pending one-tap "tell them" offer {owner,level,t}
let noteMsg='', noteMsgT=0;   // what became of a blob you gave away
let unlockMsg='', unlockT=0;  // a gold day's new eyes
const JAR_TELL_TIER=4; // Level 5 and up is worth telling someone about
// Game overs this run. A power-up rescue makes a second one possible; the run
// is still one run for the play count, but each death may post its own card,
// since the score changed.
let deaths=0;
let particles=[],popups=[];
let comboCount=0,comboTimer=0;
// Reported in the comment; see postScoreCard.
let maxCombo=0,dropsThisRun=0;
let popMode=false,rainbowArmed=false;
// Run funnel: a run starts on the player's FIRST DROP (a player action), not
// on scene boot — a lifecycle-fired start counts every page load as a played
// round and buries the real funnel. Bucketed so cardinality stays bounded.
let runNumber=0,runStarted=false;
function runBucket(n){return n>10?'run-10plus':'run-'+n;}

// --- Aimed shot --------------------------------------------------------
// Additive layer over tap-to-drop. A tap, or any drag that never pulls far
// enough down, fires a plain vertical drop exactly as before: someone who
// never discovers aiming still plays a complete Suika game.
//
// This is DIRECT aim, not a slingshot. The blob launches toward your finger.
// Slingshot geometry (pull away from the target) is wrong here because the
// blob sits at the top of the screen and the pile is below it, so pulling
// back aims up and out of the play area. Pointing where you want it to go
// needs no explanation and can only ever aim into the field.
const SLING_DEAD    = 30;     // px below the launcher before aiming engages
const SLING_MAX     = 190;    // distance at full power
const SLING_MIN_V   = 170;    // matches the plain-drop launch speed
const SLING_MAX_V   = 1250;   // capped so a full shot is never run-ending
const SLING_MAX_ANG = Math.PI*0.42; // ~75 deg off vertical, so you can cram
                                    // into side gaps but never fire sideways
let dragging=false, armed=false, anchorY=0, dragX=0, dragY=0;

// Aim vector, or null while the gesture still means "reposition".
function slingPull(){
  if(!dragging||!armed)return null;
  const dx=dragX-aimX, dy=dragY-HOLD_Y;
  const len=Math.hypot(dx,dy);
  if(len<1||dy<=0)return{nx:0,ny:1,power:0};
  // Angle measured from straight down, then clamped
  let a=Math.atan2(dx,dy);
  if(a> SLING_MAX_ANG)a= SLING_MAX_ANG;
  if(a<-SLING_MAX_ANG)a=-SLING_MAX_ANG;
  const t=Math.max(0,Math.min(1,(len-SLING_DEAD)/(SLING_MAX-SLING_DEAD)));
  return{nx:Math.sin(a),ny:Math.cos(a),power:t};
}

let time=0;
// juice
let shakeMag=0, shakeX=0, shakeY=0;
let rings=[];
function addShake(m){ shakeMag=Math.min(shakeMag+m,7); }
function addRing(x,y,col,r0,r1){ rings.push({x,y,col,r0,r1,t:0}); }

// THE one gameplay-affecting random in the game. Seeded from the day and the
// subreddit, so everyone in the community gets the identical drop sequence and
// a posted score is a claim somebody else can judge. Everything else that is
// random here — blinks, particles, shake, beep pitch — is cosmetic and stays on
// Math.random, which is why the board does not need deterministic physics.
// Draws so far on this run's seeded stream. Saved with the run, and burned back
// through on resume, so a restored run carries on from where it was rather than
// dealing the opening sequence a second time.
let drawCount=0;
function seededRandom(){
  drawCount++;
  return HUB ? HUB.random() : Math.random();
}
function rndTier(){
  // Odd levels only: tiers 0, 2, 4. Same stream, same count of draws.
  if(MUT==='even')return 2*Math.floor(seededRandom()*3);
  return Math.floor(seededRandom()*SPAWN_TIERS);
}
// A rainbow next: armed by the power-up, or forced by the twist every tenth.
function rainbowNext(){
  return rainbowArmed||(MUT==='rainbow10'&&(dropsThisRun+1)%10===0);
}

// ---------- face state ----------
const previewFace={blink:2,blinkT:0,mood:0};
function tickFace(f,dt){
  f.mood=Math.max(0,f.mood-dt*1.6);
  f.blink-=dt;
  if(f.blink<=0){f.blinkT=0.12;f.blink=Math.random()*4+2.5;}
  if(f.blinkT>0)f.blinkT-=dt;
}

// ================================================================
// BLOB CONSTRUCTION
// ================================================================
function buildBlob(x,y,tier){
  const t=TIERS[tier],R=t.r;
  // Point count scales with radius so that SURFACE RESOLUTION is roughly
  // constant, not the point count. The old formula (R*1.35 capped at 26) gave
  // every blob exactly 26 points because even the smallest exceeded the cap,
  // so a big blob's surface was 7x coarser than a small one's. Under soft
  // springs those wide gaps let neighbours slip inside and stick.
  const N=Math.max(18,Math.min(46,Math.round(R*0.45)+14));
  // Each point has a collision radius equal to half the arc segment
  const ptR=(2*Math.PI*R/N)*0.78;
  // Ring sits slightly inside the nominal radius so the visual hull = nominal radius
  const ringR=R-ptR*0.5;

  const pts=[];
  for(let i=0;i<N;i++){
    const a=(i/N)*Math.PI*2;
    const px=x+Math.cos(a)*ringR, py=y+Math.sin(a)*ringR;
    pts.push({x:px,y:py,px:px,py:py,r:ptR});
  }

  // Rest lengths for distance constraints
  const nLen=[],s2Len=[];
  for(let i=0;i<N;i++){
    const j=(i+1)%N,k=(i+2)%N;
    nLen.push(Math.hypot(pts[j].x-pts[i].x,pts[j].y-pts[i].y));
    s2Len.push(Math.hypot(pts[k].x-pts[i].x,pts[k].y-pts[i].y));
  }

  const blob={
    tier,R,N,ringR,ptR,pts,nLen,s2Len,
    restArea:Math.PI*R*R,
    born:time,grace:MERGE_GRACE,merging:false,rainbow:false,
    prevSpeed:0,pop:0,owner:'',
    face:{blink:Math.random()*4+2,blinkT:0,mood:0},
  };
  return blob;
}
function makeBlob(x,y,tier){
  const blob=buildBlob(x,y,tier);
  blobs.push(blob);
  return blob;
}

function centroid(b){
  let cx=0,cy=0;
  for(const p of b.pts){cx+=p.x;cy+=p.y;}
  return{x:cx/b.N,y:cy/b.N};
}

function blobArea(b){
  let A=0;
  const pts=b.pts,N=b.N;
  for(let i=0;i<N;i++){
    const j=(i+1)%N;
    A+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;
  }
  return Math.abs(A)*0.5;
}

function setVel(b,vx,vy){
  for(const p of b.pts){
    p.px=p.x-vx*SDT_V;
    p.py=p.y-vy*SDT_V;
  }
}

function centroidVel(b){
  let vx=0,vy=0;
  for(const p of b.pts){vx+=p.x-p.px;vy+=p.y-p.py;}
  return{vx:vx/(b.N*SDT_V),vy:vy/(b.N*SDT_V)};
}

// Point-to-point separation has a blind spot: when a blob stretches, the gaps
// between its surface points widen, and a neighbour's point can slip through
// into the interior. Once inside, no point-pair overlaps, so nothing pushes it
// back out and the two blobs stay visibly stuck. This catches that case
// directly: any point found inside another blob's outline is projected out
// through the nearest edge.
function pointInBlob(x,y,b){
  const pts=b.pts;
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

function projectOut(p,b){
  const pts=b.pts,N=b.N;
  let bestD=1e9,qx=0,qy=0;
  for(let i=0;i<N;i++){
    const a=pts[i],c=pts[(i+1)%N];
    const ex=c.x-a.x,ey=c.y-a.y;
    const L2=ex*ex+ey*ey||1;
    let t=((p.x-a.x)*ex+(p.y-a.y)*ey)/L2;
    t=t<0?0:(t>1?1:t);
    const cx=a.x+ex*t,cy=a.y+ey*t;
    const d=(p.x-cx)*(p.x-cx)+(p.y-cy)*(p.y-cy);
    if(d<bestD){bestD=d;qx=cx;qy=cy;}
  }
  const d=Math.sqrt(bestD);
  let nx,ny;
  if(d<0.001){
    const c=centroid(b);
    nx=p.x-c.x; ny=p.y-c.y;
    const L=Math.hypot(nx,ny)||1; nx/=L; ny/=L;
  }else{
    // vector from the edge to an interior point aims inward, so invert it
    nx=-(p.x-qx)/d; ny=-(p.y-qy)/d;
  }
  const vx=p.x-p.px, vy=p.y-p.py;
  p.x=qx+nx*p.r*0.7;
  p.y=qy+ny*p.r*0.7;
  // keep most of the velocity so escaping doesn't fling the blob
  p.px=p.x-vx*0.5; p.py=p.y-vy*0.5;
}

function resolvePenetration(){
  const n=blobs.length;
  if(n<2)return;
  computeCentroids();
  for(let i=0;i<n;i++){
    const bA=blobs[i];
    const cAx=_cxs[i],cAy=_cys[i];
    for(let j=i+1;j<n;j++){
      const bB=blobs[j];
      if(canMergeNow(bA,bB))continue;      // these are about to merge anyway
      const cBx=_cxs[j],cBy=_cys[j];
      const dx=cBx-cAx,dy=cBy-cAy;
      const rr=bA.R+bB.R;
      if(dx*dx+dy*dy>rr*rr)continue;
      const rB2=bB.R*1.05*bB.R*1.05, rA2=bA.R*1.05*bA.R*1.05;
      for(const p of bA.pts){
        const ex=p.x-cBx,ey=p.y-cBy;
        if(ex*ex+ey*ey<rB2&&pointInBlob(p.x,p.y,bB))projectOut(p,bB);
      }
      for(const p of bB.pts){
        const ex=p.x-cAx,ey=p.y-cAy;
        if(ex*ex+ey*ey<rA2&&pointInBlob(p.x,p.y,bA))projectOut(p,bA);
      }
    }
  }
}

function removeBlob(b){blobs=blobs.filter(x=>x!==b);}

// ================================================================
// PBD PHYSICS STEP
// ================================================================
function physicsStep(){
  computePairWeights();
  for(let sub=0;sub<subSteps;sub++){

    // 1. Verlet integration with per-step displacement clamp
    for(const b of blobs){
      const maxStep=Math.max(b.ptR*MAX_STEP_FRAC,MAX_STEP_MIN)*STEP_SCALE;
      const maxStep2=maxStep*maxStep;
      for(const p of b.pts){
        let vx=(p.x-p.px)*DAMP_V;
        let vy=(p.y-p.py)*DAMP_V;
        const m2=vx*vx+vy*vy;
        if(m2>maxStep2){
          const s=maxStep/Math.sqrt(m2);
          vx*=s; vy*=s;
        }
        p.px=p.x; p.py=p.y;
        p.x+=vx; p.y+=vy+G_SDT2_V;
      }
    }

    // 2. Distance constraints (multiple passes)
    rescueDeepOverlap();          // whole-body fix, once per substep
    for(let iter=0;iter<dIters;iter++){
      for(const b of blobs) solveDistances(b);
      // Blob-blob separation on every distance pass
      separateBlobs();
      // Wall containment after separation
      for(const b of blobs) solveWalls(b);
    }

    // 3. Pressure (volume) once per substep — outside distance loop
    //    so it doesn't compound with D_ITERS multiplier
    for(const b of blobs) solvePressure(b);
    for(const b of blobs) solveWalls(b);
    dampSpin();
    // Twice per frame, not once: with springs this soft a point can pass
    // inside a neighbour mid-substep, and catching it only at the end of the
    // frame leaves it stuck there long enough to bond.
    if((sub&3)===3) resolvePenetration();
  }

  for(const b of blobs) solveWalls(b);

  // 4. Merge detection after full physics step
  detectImpacts();
  checkMerges();
}

function solveDistances(b){
  const pts=b.pts,N=b.N;
  for(let i=0;i<N;i++){
    const j=(i+1)%N;
    const p1=pts[i],p2=pts[j];
    const dx=p2.x-p1.x,dy=p2.y-p1.y;
    const d=Math.hypot(dx,dy);
    if(d<0.001)continue;
    const rest=b.nLen[i];
    const k=d>rest?N_STRETCH:N_SQUASH;
    const diff=(d-rest)/d*k*0.5;
    p1.x+=dx*diff; p1.y+=dy*diff;
    p2.x-=dx*diff; p2.y-=dy*diff;
  }
  for(let i=0;i<N;i++){
    const j=(i+2)%N;
    const p1=pts[i],p2=pts[j];
    const dx=p2.x-p1.x,dy=p2.y-p1.y;
    const d=Math.hypot(dx,dy);
    if(d<0.001)continue;
    const rest=b.s2Len[i];
    const k=d>rest?S2_STRETCH:S2_SQUASH;
    const diff=(d-rest)/d*k*0.5;
    p1.x+=dx*diff; p1.y+=dy*diff;
    p2.x-=dx*diff; p2.y-=dy*diff;
  }
}

function solvePressure(b){
  // Push each point along the local surface NORMAL to restore area.
  // The old version scaled points away from the centroid, which quietly forced
  // the blob back toward a circle and cancelled out any droop. Normal-based
  // pressure inflates whatever shape the blob currently has, so a squashed blob
  // bulges sideways into open space instead of springing back to round.
  const A=blobArea(b);
  if(A<1)return;
  const err=(b.restArea-A)/b.restArea;
  if(Math.abs(err)<0.0005)return;
  const amount=err*b.R*P_STIFF*0.5;
  const pts=b.pts,N=b.N;
  for(let i=0;i<N;i++){
    const prev=pts[(i-1+N)%N],next=pts[(i+1)%N];
    // outward normal of the edge through this point
    let nx=next.y-prev.y, ny=-(next.x-prev.x);
    const len=Math.hypot(nx,ny);
    if(len<0.001)continue;
    nx/=len; ny/=len;
    pts[i].x+=nx*amount;
    pts[i].y+=ny*amount;
  }
}

// Distance constraints preserve shape but not orientation, so a ring can rotate
// forever with nothing to stop it. This measures the blob's rigid-rotation
// component and removes a fraction of it, leaving deformation untouched.
function dampSpin(){
  for(const b of blobs){
    const c=centroid(b);
    let L=0,I=0;
    for(const p of b.pts){
      const rx=p.x-c.x,ry=p.y-c.y;
      const vx=p.x-p.px,vy=p.y-p.py;
      L+=rx*vy-ry*vx;
      I+=rx*rx+ry*ry;
    }
    if(I<0.01)continue;
    const omega=L/I;
    for(const p of b.pts){
      const rx=p.x-c.x,ry=p.y-c.y;
      // add the tangential component back into prev-position = remove it from velocity
      p.px+=SPIN_DAMP*(-omega*ry);
      p.py+=SPIN_DAMP*( omega*rx);
    }
  }
}

function solveWalls(b){
  for(const p of b.pts){
    const r=p.r;
    let hit=false;
    if(p.x<LEFT_X+r) { p.x=LEFT_X+r;  hit=true; }
    if(p.x>RIGHT_X-r){ p.x=RIGHT_X-r; hit=true; }
    if(p.y>FLOOR_Y-r){ p.y=FLOOR_Y-r; hit=true; }
    if(p.y<18)       { p.y=18;        hit=true; }
    if(hit){
      // friction: bleed tangential velocity so blobs settle instead of rolling
      p.px+=(p.x-p.px)*FLOOR_FRIC;
      p.py+=(p.y-p.py)*FLOOR_FRIC;
    }
  }
}

// One rule used by BOTH separation and merge detection, so they can never
// disagree. Previously separation exempted all same-tier pairs, including
// max-tier pairs and newborns that could not actually merge — those pairs had
// nothing pushing them apart and fused together permanently.
function canMergeNow(a,b){
  if(a.merging||b.merging)return false;
  if(time-a.born<a.grace||time-b.born<b.grace)return false;
  if(a.rainbow!==b.rainbow)return true;
  if(a.rainbow&&b.rainbow)return false;
  return a.tier===b.tier&&a.tier<MAXT;
}

// Uniform spatial hash. The old separation pass compared every surface point
// against every other point in every candidate pair: ~15k distance checks per
// iteration, run 32 times a frame. The grid buckets points by cell so each one
// only tests the 3x3 cells around it. Cell size is set to the largest point
// diameter on the board, which guarantees any genuinely overlapping pair lands
// within one cell of each other.
// Separation runs subSteps x dIters times a frame — two dozen times — so it
// is the one place where allocation and property lookups actually decide the
// frame rate on a low-end phone. Everything it needs lives in typed arrays
// that are grown once and then reused forever: no per-call arrays, no Map, no
// centroid objects. The MATH and the resolution ORDER are unchanged from the
// original, so the tuned feel is preserved exactly.
let _wt=new Float32Array(0);                     // pair weights, n*n
let _px=new Float64Array(0),_py=new Float64Array(0),_pr=new Float64Array(0);
let _pb=new Int32Array(0),_pnext=new Int32Array(0);
// Spatial hash as a linked list over a fixed bucket table. A generation stamp
// marks buckets live, so a rebuild costs O(points) rather than clearing 4096
// buckets two dozen times a frame.
const _GN=1<<12, _GMASK=_GN-1;
const _ghead=new Int32Array(_GN), _gstamp=new Int32Array(_GN);
let _gen=0;
function _hash(cx,cy){return ((cx*73856093)^(cy*19349663))&_GMASK;}

// Mergeability cannot change during a physics step (blobs are only created or
// removed between steps), so the weights are computed once per step instead of
// once per iteration.
function computePairWeights(){
  const n=blobs.length;
  if(n<2)return;
  if(_wt.length<n*n) _wt=new Float32Array(n*n);
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      // Mergeable pairs push apart weakly so they can still close the gap and
      // merge. Everything else — including max-tier pairs and newborns — gets
      // full separation so nothing can ever fuse and stick.
      const w=canMergeNow(blobs[i],blobs[j])?MERGE_SEP:1;
      _wt[i*n+j]=w; _wt[j*n+i]=w;
    }
  }
}

// Deep-overlap rescue: once two rings have passed through each other, no
// individual points overlap, so point separation alone can't undo it and the
// blobs stay fused. Push the whole bodies apart in that case. O(blobs^2) and
// it moves whole bodies, so it runs once per substep, not once per iteration.
let _cxs=new Float64Array(0),_cys=new Float64Array(0);
// All centroids in one pass, into reused arrays. Calling centroid() inside a
// nested blob loop is O(n^2) traversals AND allocates an object per call,
// which is exactly the kind of thing that shows up as a GC hitch on a phone.
function computeCentroids(){
  const n=blobs.length;
  if(_cxs.length<n){_cxs=new Float64Array(n+16);_cys=new Float64Array(n+16);}
  for(let i=0;i<n;i++){
    const pts=blobs[i].pts;
    let sx=0,sy=0;
    for(let k=0;k<pts.length;k++){sx+=pts[k].x;sy+=pts[k].y;}
    _cxs[i]=sx/pts.length; _cys[i]=sy/pts.length;
  }
}

function rescueDeepOverlap(){
  const n=blobs.length;
  if(n<2)return;
  computeCentroids();
  for(let i=0;i<n;i++){
    const bA=blobs[i];
    for(let j=i+1;j<n;j++){
      const bB=blobs[j];
      if(_wt[i*n+j]===MERGE_SEP)continue;      // mergeable: leave them to it
      const dx=_cxs[j]-_cxs[i],dy=_cys[j]-_cys[i];
      const cd=Math.sqrt(dx*dx+dy*dy);
      if(cd>=(bA.R+bB.R)*0.8||cd<=0.001)continue;
      const nx=dx/cd,ny=dy/cd;
      const push=((bA.R+bB.R)*0.8-cd)*0.5;
      const tot=bA.R+bB.R;
      const wA=bB.R/tot,wB=bA.R/tot;
      for(const p of bA.pts){p.x-=nx*push*wA;p.y-=ny*push*wA;}
      for(const p of bB.pts){p.x+=nx*push*wB;p.y+=ny*push*wB;}
    }
  }
}

function separateBlobs(){
  const n=blobs.length;
  if(n<2)return;

  let total=0,maxPtR=1;
  for(let i=0;i<n;i++){
    total+=blobs[i].N;
    if(blobs[i].ptR>maxPtR)maxPtR=blobs[i].ptR;
  }
  if(_px.length<total){
    const cap=total+64;
    _px=new Float64Array(cap);_py=new Float64Array(cap);_pr=new Float64Array(cap);
    _pb=new Int32Array(cap);_pnext=new Int32Array(cap);
  }

  // Flatten. Reading p.x/p.y once here and writing back once at the end is far
  // cheaper than chasing object properties inside the neighbour loops.
  let k=0;
  for(let bi=0;bi<n;bi++){
    const pts=blobs[bi].pts;
    for(let pi=0;pi<pts.length;pi++,k++){
      const p=pts[pi];
      _px[k]=p.x;_py[k]=p.y;_pr[k]=p.r;_pb[k]=bi;
    }
  }

  const cs=maxPtR*2, inv=1/cs;
  _gen++;
  for(let i=0;i<total;i++){
    const h=_hash(Math.floor(_px[i]*inv),Math.floor(_py[i]*inv));
    if(_gstamp[h]!==_gen){_gstamp[h]=_gen;_ghead[h]=-1;}
    _pnext[i]=_ghead[h];_ghead[h]=i;
  }

  // Resolve. Only a HIGHER blob index is considered, so each pair of points is
  // handled exactly once and points within the same blob are skipped (their
  // spacing is the distance constraint's job, not separation's).
  for(let i=0;i<total;i++){
    const bi=_pb[i], ax=_px[i], ay=_py[i], ar=_pr[i];
    const cx=Math.floor(ax*inv), cy=Math.floor(ay*inv);
    const wRow=bi*n;
    for(let ox=-1;ox<=1;ox++){
      for(let oy=-1;oy<=1;oy++){
        const h=_hash(cx+ox,cy+oy);
        if(_gstamp[h]!==_gen)continue;
        for(let j=_ghead[h];j!==-1;j=_pnext[j]){
          const bj=_pb[j];
          if(bj<=bi)continue;
          const dx=_px[j]-_px[i],dy=_py[j]-_py[i];
          const rs=ar+_pr[j],d2=dx*dx+dy*dy;
          if(d2>=rs*rs||d2<0.0001)continue;
          const d=Math.sqrt(d2);
          const ov=(rs-d)*_wt[wRow+bj],nx=dx/d,ny=dy/d;
          const wA=_pr[j]/rs,wB=ar/rs;
          _px[i]-=nx*ov*wA; _py[i]-=ny*ov*wA;
          _px[j]+=nx*ov*wB; _py[j]+=ny*ov*wB;
        }
      }
    }
  }

  k=0;
  for(let bi=0;bi<n;bi++){
    const pts=blobs[bi].pts;
    for(let pi=0;pi<pts.length;pi++,k++){
      const p=pts[pi];
      p.x=_px[k];p.y=_py[k];
    }
  }
}

// ================================================================
// MERGE DETECTION & PROCESSING
// ================================================================
// A blob that was moving fast and suddenly isn't has just landed or been hit.
// That deceleration is what we turn into shake, sound and a squished face.
function detectImpacts(){
  for(const b of blobs){
    const v=centroidVel(b);
    const sp=Math.hypot(v.vx,v.vy);
    const drop=b.prevSpeed-sp;
    if(drop>120&&b.prevSpeed>200){
      const strength=Math.min(drop/700,1);
      b.face.mood=Math.max(b.face.mood,0.5+strength*0.5);
      addShake((0.8+strength*2.6)*Math.min(b.R/60,1.6));
      beep(120+Math.random()*70,0.09,0.03+strength*0.05,'sine');
    }
    b.prevSpeed=sp;
  }
}

// Contact test between two blobs' surfaces. Centroid distance was the wrong
// measure: two blobs resting against each other sit at roughly the sum of their
// radii, so a threshold below that never fired, and deformation made it worse.
function surfacesTouch(a,b,slack){
  for(const pA of a.pts){
    for(const pB of b.pts){
      const dx=pB.x-pA.x,dy=pB.y-pA.y;
      const rs=(pA.r+pB.r)*slack;
      if(dx*dx+dy*dy<rs*rs)return true;
    }
  }
  return false;
}

function checkMerges(){
  for(let i=0;i<blobs.length;i++){
    const bA=blobs[i];
    if(bA.merging)continue;
    const cA=centroid(bA);
    for(let j=i+1;j<blobs.length;j++){
      const bB=blobs[j];
      if(!canMergeNow(bA,bB))continue;
      const cB=centroid(bB);
      // cheap broad phase first
      if(Math.hypot(cB.x-cA.x,cB.y-cA.y)>bA.R+bB.R+bA.ptR+bB.ptR+6)continue;
      if(surfacesTouch(bA,bB,1.35)){
        bA.merging=bB.merging=true;
        mergeQueue.push([bA,bB]);
        bA.face.mood=bB.face.mood=1;
        break;
      }
    }
  }
}

function processMerges(){
  for(const [A,B] of mergeQueue){
    const cA=centroid(A),cB=centroid(B);
    const mx=(cA.x+cB.x)*0.5, my=(cA.y+cB.y)*0.5;
    const vA=centroidVel(A),vB=centroidVel(B);
    const mvx=(vA.vx+vB.vx)*0.5, mvy=(vA.vy+vB.vy)*0.5;

    // Rainbow hitting max tier: pop rainbow, keep other
    if(A.rainbow!==B.rainbow){
      const other=A.rainbow?B:A,rb=A.rainbow?A:B;
      if(other.tier>=MAXT){
        burst(cA.x,cA.y,'#b78cff',22);
        addScore(SCORE_PTS[MAXT],mx,my-30);
        removeBlob(rb); other.merging=false;
        beep(700,0.25,0.1,'triangle');
        continue;
      }
    }

    const base=A.rainbow?B.tier:(B.rainbow?A.tier:A.tier);
    const newTier=Math.min(base+1,MAXT);
    if(newTier>maxTier){maxTier=newTier;dropsAtLevel=dropsThisRun;}   // made by a merge, never dealt
    removeBlob(A); removeBlob(B);
    const nb=makeBlob(mx,Math.min(my,FLOOR_Y-TIERS[newTier].r-4),newTier);
    // The owner rides through the merge, so a jar blob is still theirs when it
    // becomes something big; that is the mark players leave in each other's
    // games, and the moment worth telling the thread about.
    nb.owner=A.owner||B.owner||'';
    if(nb.owner&&newTier>=JAR_TELL_TIER){
      const lvl=newTier+1;
      popups.push({x:mx,y:my-TIERS[newTier].r-24,txt:nb.owner+' 的球升到了 '+lvl+' 级',t:0});
      if(!(jarNotes[nb.owner]>=lvl))jarNotes[nb.owner]=lvl;
      jarTell={owner:nb.owner,level:lvl,t:7};
    }
    setVel(nb,mvx*0.6,mvy*0.6-60);
    nb.face.mood=1;
    nb.pop=1;                       // spawn scale-up animation

    for(const p of POWERUPS) p.charge=Math.min(p.charge+1,p.need);
    addScore(SCORE_PTS[newTier],mx,my-TIERS[newTier].r);
    burst(mx,my,TIERS[newTier].col,14+newTier*2);
    addRing(mx,my,TIERS[newTier].col,TIERS[newTier].r*0.5,TIERS[newTier].r*2.2);
    addShake(1.4+newTier*0.55);
    const step=Math.min(comboCount-1,7);
    beep(330+newTier*40+step*70,0.16,0.13,'triangle');
    beep(495+newTier*40+step*105,0.24,0.09,'sine');
  }
  mergeQueue=[];
}

// ================================================================
// GAME LOGIC
// ================================================================
function addScore(base,x,y){
  comboCount++;
  if(comboCount>maxCombo)maxCombo=comboCount;
  comboTimer=2;   // display only now: how long the COMBO readout stays up
  const gain=base*comboCount;
  score+=gain;
  popups.push({x,y,txt:'+'+gain+(comboCount>1?'  x'+comboCount:''),t:0});
  checkGoals();
}

function runStats(){
  return {score,level:maxTier+1,combo:maxCombo,drops:dropsThisRun,
          powerups:powerupsUsed,dropsAtLevel};
}
// The hub keeps the bits and reports each hit once; this just says so, inside
// the field, at the moment it happened.
function checkGoals(){
  if(!HUB||!HUB.goals.length||!runStarted)return;
  const lit=HUB.checkGoals(runId,runStats());
  for(const i of lit){
    popups.push({x:(LEFT_X+RIGHT_X)/2,y:DANGER_Y+Math.round(70*PS),txt:'目标：'+HUB.goalLabel(i),t:0});
    beep(880,0.15,0.08,'triangle');
    track('goal','tier-'+i,'complete');
  }
}

const MAX_PARTICLES=260;
function burst(x,y,col,n){
  // A long cascade would otherwise spawn several hundred particles in one
  // frame, all of which are drawn individually.
  n=Math.min(n,MAX_PARTICLES-particles.length);
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=3+Math.random()*7;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,r:3+Math.random()*5,col,life:1});
  }
}

let AC=null;
// iOS creates AudioContexts in a suspended state unless they are started inside
// a user gesture, and a suspended context stays silent forever afterwards.
// Unlock it on the first interaction of any kind rather than on the first beep.
function unlockAudio(){
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
  }catch(e){}
}
// A combo cascade fires two beeps per merge plus one per landing impact, and
// physics can run three steps in a single frame — enough to build dozens of
// audio nodes at once and stall a weak device's audio thread. Past a handful
// per frame nobody can hear the difference anyway.
let beepsThisFrame=0;
const MAX_BEEPS_PER_FRAME=5;
function beep(freq,dur,vol,type){
  if(beepsThisFrame>=MAX_BEEPS_PER_FRAME)return;
  beepsThisFrame++;
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime+dur);
  }catch(e){}
}

// A blob counts as "over the line" once it has had time to land. The old
// version also required it to be nearly stationary (speed < 55), which is what
// made endless spamming safe: each new drop kept the pile jostling above that
// threshold, so a full board never registered as dangerous at all.
function blobOverLine(){
  for(const b of blobs){
    if(time-b.born<1.0)continue;       // still falling; not yet the board's fault
    const c=centroid(b);
    if(c.y-b.R<DANGER_Y)return true;
  }
  return false;
}

function checkDanger(dt){
  // The timer now DECAYS rather than resetting to zero. A hard reset meant a
  // single frame of jostle wiped 1.8s of accumulated danger, so a player who
  // kept the pile agitated could sit over the line indefinitely.
  if(overLine){
    dangerTimer+=dt;
  }else{
    dangerTimer=Math.max(0,dangerTimer-dt*1.5);
  }
  if(((dangerTimer>1.8&&MUT!=='noline')||finishNow)&&!gameOver){
    gameOver=true;
    endPlay();
    if(runStarted){runStarted=false;track('run',runBucket(runNumber),'complete');}
    if(score>best){best=score;storeSet(KEY_BEST,best);}
    // Every finished run reaches the post's board, which keeps each player's
    // best. A run revived by a power-up submits again when it ends; that is
    // play, not a purchase, so it counts.
    deaths++;
    checkGoals();
    if(HUB){
      if(deaths===1)HUB.plays++;   // the server dedupes on runId too
      const notes=Object.keys(jarNotes).map(name=>({name,level:jarNotes[name]}));
      try{HUB.submitScore(score,maxCombo,maxTier+1,runId,notes,dropsThisRun,powerupsUsed);}catch(e){}
    }
    storeDel(KEY_RUN);              // the run is over; nothing to come back to
    beep(200,0.4,0.1,'sawtooth');
  }
}

function puById(id){return POWERUPS.find(p=>p.id===id);}

// Pop and Rainbow are ARMED states that resolve later, so they don't spend
// their charge on activation the way Shake and Sweep do. Spending up front
// meant tapping the button again, or tapping empty space in pop mode, silently
// burned the powerup with nothing to show for it.
// Tapping a powerup that isn't ready should say WHY, not do nothing: a button
// that ignores you reads as broken, and "n/m" alone doesn't tell a new player
// that merges are the currency.
function lockedMessage(pu,slot){
  const n=pu.need-pu.charge;
  hintQueue.length=0;
  hint={txt:'再合并 '+n+' 次就能解锁',slot,t:0,dur:2.4};
  beep(180,0.09,0.05,'square');
}

function usePowerup(pu,slot){
  if(pu.charge>=pu.need&&!powerupUsedEver){
    powerupUsedEver=true;
    if(powerupPromptShown)track('tutorial','powerup-prompt','interact');
    track('verb','powerup-found','complete');
  }
  if(pu.id==='pop'){
    if(popMode){ popMode=false; beep(240,0.07,0.06,'sine'); return; }  // cancel
    if(pu.charge<pu.need){lockedMessage(pu,slot);return;}
    rainbowArmed=false;          // the two armed states are mutually exclusive
    popMode=true;
    beep(400,0.08,0.08,'sine');
    return;
  }
  if(pu.id==='rainbow'){
    if(rainbowArmed){ rainbowArmed=false; beep(240,0.07,0.06,'sine'); return; }
    if(pu.charge<pu.need){lockedMessage(pu,slot);return;}
    popMode=false;
    rainbowArmed=true;
    beep(600,0.12,0.1,'triangle');
    beep(800,0.18,0.07,'sine');
    return;
  }
  if(pu.charge<pu.need){lockedMessage(pu,slot);return;}
  pu.charge=0; powerupsUsed++;
  if(pu.id==='shake'){
    track('powerup','shake','complete');
    for(const b of blobs) for(const p of b.pts){
      const vx=(Math.random()-0.5)*420;
      const vy=-260-Math.random()*160;
      p.px=p.x-vx*SDT_V; p.py=p.y-vy*SDT_V;
    }
    addShake(6);
    beep(110,0.22,0.13,'sine');
  }else if(pu.id==='sweep'){
    const doomed=blobs.filter(b=>b.tier<=1&&!b.merging);
    if(doomed.length===0){
      // nothing to clear, refund the charge
      pu.charge=pu.need;
      beep(160,0.08,0.05,'square');
      return;
    }
    track('powerup','sweep','complete');
    let i=0,pts=0;
    for(const b of doomed){
      const c=centroid(b);
      // colour per blob now that two tiers can be swept
      burst(c.x,c.y,TIERS[b.tier].col,12);
      addRing(c.x,c.y,TIERS[b.tier].col,b.R*0.4,b.R*2.6);
      pts+=SCORE_PTS[b.tier];
      removeBlob(b);
      beep(620+i*35,0.1,0.07,'triangle');
      i++;
    }
    addScore(pts,W/2,DANGER_Y+60);
    addShake(2+Math.min(doomed.length,8)*0.5);
  }
}

// The reward clears everything above the danger line: deterministic, always
// exactly undoes the loss, and never touches the large blobs at the bottom that
// represent the player's progress. Removing random blobs would sometimes delete
// the tier-8 they spent the run building, which reads as a punishment.
// "Touches the line" is tested against the actual deformed hull, not the
// centroid: these are soft bodies, so a squashed blob's real extent can differ
// a lot from centroid minus nominal radius.
function touchesDangerLine(b){
  for(const p of b.pts) if(p.y-p.r<=DANGER_Y) return true;
  return false;
}

function readyPowerups(){ return POWERUPS.some(p=>p.charge>=p.need); }

function rescueWithPowerup(i){
  const pu=POWERUPS[i];
  if(!gameOver||!pu||pu.charge<pu.need)return;
  // Revive BEFORE spending: usePowerup refuses to act on a dead board, and pop
  // and rainbow both need the player able to tap and drop afterwards.
  gameOver=false; dangerTimer=0; overLine=false; canDrop=true; dropT=0;
  scorePosted=false;   // the score will change; the next death may post again
  track('powerup','rescue','complete');
  usePowerup(pu,i);
  beginPlay();
}

// Post score: the run as a reply under the post's stickied comment. Optional,
// once per run, and it gives nothing back. Reddit rejected the version that
// traded a comment for a continue; a player who never posts has the same game.
//
// `ev` must be the player's own trusted tap: the comment is posted as them, and
// Reddit gates that behind a consent prompt only a real gesture can raise.
let commentMsg='';
// Identifies this run to the server, which allows exactly one score card per
// run. `scorePosted` stops the button being offered twice; the id is what stops
// a modified client asking twice.
let runId=newRunId();
function newRunId(){
  return Math.random().toString(36).slice(2)+Date.now().toString(36);
}
function postScoreCard(ev){
  if(commentPending||scorePosted||!HUB)return;
  commentPending=true;
  HUB.postScoreCard(ev,runId+'.'+deaths,score,maxTier+1,Math.round(runTime)).then(r=>{
    commentPending=false;
    if(r.posted){
      scorePosted=true; commentMsg='成绩已发布';
      beep(660,0.2,0.07,'triangle');
      return;
    }
    // `retry` means nothing happened — a declined consent prompt or a dropped
    // connection — so the button stays; anything else retires it.
    if(!r.retry) scorePosted=true;
    commentMsg=r.reason||'无法发布你的成绩。';
    beep(200,0.1,0.05,'square');
  }).catch(()=>{ commentPending=false; });
}

// The opening board: three blobs already resting on the floor, the middle one
// the same size as the held blob and directly under where it drops, so the very
// first tap merges. In a feed the first three seconds carry the game with no
// words, and a merge on tap one is what does that.
//
// Dealt from a rewound seed, so every run on a post opens the same way and then
// gets the same drop sequence — which is what the stickied comment promises.
// Set by layout(): the jar is HUD, not play field. In portrait it sits at the
// left of the band under the BEST pill, level with the buttons; on a squat card
// with no band it tucks under the pill, smaller; in landscape it sits centred
// under the power-up grid, with the plays pill under it.
let JAR={cx:60,cy:150,r:22};
function jarRect(){ return JAR; }
function pickJarBlob(tier,used){
  const pool=(HUB&&HUB.jar)||[];
  for(let i=0;i<pool.length;i++){
    const e=pool[i];
    if(e&&e.tier===tier&&!used.has(i)){used.add(i);return {tier,name:e.name||'',idx:i};}
  }
  return {tier,name:'',idx:-1};
}
// Three of the five spawn sizes, never the one in hand. Which three is drawn
// from the seeded stream, so every player of a post opens the same jar.
function dealJar(){
  jar=[]; jarUsed=false; jarOpen=false;
  const tiers=[];
  for(let t=0;t<SPAWN_TIERS;t++) if(t!==currentTier) tiers.push(t);
  tiers.splice(Math.floor(seededRandom()*tiers.length),1);
  const used=new Set();
  for(const t of tiers) jar.push(pickJarBlob(t,used));
}
// The held blob changed. If it now matches a slot, that slot takes the one
// spare size, which is the size just released.
function jarAvoid(prevTier){
  if(jarUsed||!jar.length)return;
  const i=jar.findIndex(s=>s.tier===currentTier);
  if(i<0)return;
  const used=new Set(jar.filter((_,k)=>k!==i).map(s=>s.idx).filter(k=>k>=0));
  jar[i]=pickJarBlob(prevTier,used);
}
function openJar(){
  if(jarUsed||jarOpen||gameOver||paused||boardOpen||!jar.length)return;
  jarOpen=true; jarOpenSims=null; jarYoursSim=null; track('ui','jar','start');
  beep(520,0.08,0.06,'triangle');
}
function closeJar(){ jarOpen=false; }
// Take one. Yours goes into the jar for whoever comes next: an exchange, not a
// gift, so every blob in the jar came from a real player who used it.
function takeFromJar(i){
  const slot=jar[i];
  if(!slot||jarUsed)return;
  const mine=currentTier;
  jarUsed=true; jarOpen=false;
  if(HUB)try{HUB.swapJar(runId,mine).catch(()=>{});}catch(e){}
  currentTier=slot.tier; heldOwner=slot.name;
  const r=jarRect();
  burst(r.cx,r.cy,TIERS[slot.tier].col,16);
  addShake(3);
  beep(700,0.12,0.09,'triangle');
  track('ui','jar','complete');
}
// "Merged blobfan's blob into Level 7": one tap, as the player, under the
// sticky. Offered for a few seconds at the moment it happened.
function tellJar(ev){
  const t=jarTell; if(!t||!HUB)return;
  jarTell=null;
  HUB.postJarComment(ev,runId,t.owner,t.level,score).then(r=>{
    popups.push({x:W/2,y:DANGER_Y+40,txt:r.posted?'已发布！':(r.reason||'发布失败'),t:0});
  }).catch(()=>{});
}

function openingBoard(){
  if(HUB)try{HUB.reseed();}catch(e){}
  drawCount=0;
  const rnd=seededRandom;
  const t=MUT==='even'?[0,2,4]:[0,1,2,3];
  for(let i=t.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const k=t[i];t[i]=t[j];t[j]=k;}
  const cx=(LEFT_X+RIGHT_X)/2, span=RIGHT_X-LEFT_X;
  for(const [tier,x] of [[t[1],LEFT_X+span*0.2],[t[0],cx],[t[2],RIGHT_X-span*0.2]]){
    const b=makeBlob(x,FLOOR_Y-TIERS[tier].r-2,tier);
    b.pop=0; b.grace=0.5;
  }
  currentTier=t[0]; nextTier=rndTier();
  aimX=cx;
  heldOwner=''; jarNotes={}; jarTell=null;
  dealJar();
}

function restart(){
  blobs=[]; particles=[]; popups=[]; mergeQueue=[];
  score=0; gameOver=false; canDrop=true; paused=false;
  popMode=false; rainbowArmed=false;
  comboCount=0; comboTimer=0; dangerTimer=0;
  maxCombo=0; dropsThisRun=0;
  runId=newRunId();
  scorePosted=false; commentPending=false; commentMsg='';
  maxTier=0; runTime=0; deaths=0;
  powerupsUsed=0; dropsAtLevel=0; finishT=0; finishNow=false;
  runStarted=false;   // the next run reports its start on its first drop
  resumedRun=false; saveT=0;
  storeDel(KEY_RUN);
  for(const p of POWERUPS) p.charge=0;
  openingBoard();
}


// ================================================================
// RUN PERSISTENCE
// A snapshot every few seconds, so closing the tab mid-run and coming back
// does not throw the board away. Deliberately approximate: one coordinate per
// blob, no velocities, no deformation — a resumed pile settles into a
// slightly different shape than it left, which nobody can tell and which is
// far cheaper than serialising the whole soft-body state.
//
// Positions are stored RELATIVE TO THE PIT (left wall, floor), never in
// screen space: the layout is responsive, so a player who leaves in portrait
// and returns in landscape must still get their pile back in the right place.
// ================================================================
const SAVE_EVERY=5;         // seconds between snapshots
const SAVE_MAX_AGE=7*24*3600*1000;
let saveT=0, resumedRun=false;

function saveRun(){
  if(!runStarted||gameOver){return;}
  const live=blobs.filter(b=>!b.merging);
  if(!live.length){storeDel(KEY_RUN);return;}
  const b=live.map(x=>{
    const c=centroid(x);
    return [x.tier,Math.round(c.x-LEFT_X),Math.round(c.y-FLOOR_Y),x.rainbow?1:0,x.owner||''];
  });
  storeSet(KEY_RUN,JSON.stringify({
    v:1,t:Date.now(),score,cur:currentTier,next:nextTier,
    pu:POWERUPS.map(p=>p.charge),run:runNumber,mt:maxTier,rt:Math.round(runTime),
    dc:drawCount,dt:deaths,
    jar:jar.map(s=>[s.tier,s.name,s.idx]),ju:jarUsed?1:0,ho:heldOwner,jn:jarNotes,
    pw:powerupsUsed,dal:dropsAtLevel,
    mc:maxCombo,dr:dropsThisRun,b,
  }));
}

function loadRun(){
  const raw=storeGet(KEY_RUN);
  if(!raw)return false;
  let s;
  try{s=JSON.parse(raw);}catch(e){storeDel(KEY_RUN);return false;}
  // Anything unexpected is discarded rather than trusted: this data has been
  // sitting in a store the player can edit, and a malformed entry must not be
  // able to wedge the game on every future load.
  if(!s||s.v!==1||!Array.isArray(s.b)||!s.b.length){storeDel(KEY_RUN);return false;}
  if(typeof s.t==='number'&&Date.now()-s.t>SAVE_MAX_AGE){storeDel(KEY_RUN);return false;}
  const ok=t=>Number.isFinite(t);
  for(const e of s.b){
    if(!Array.isArray(e)||e.length<3)continue;
    const tier=e[0]|0;
    if(tier<0||tier>=TIERS.length)continue;
    if(!ok(e[1])||!ok(e[2]))continue;
    const r=TIERS[tier].r;
    const x=Math.max(LEFT_X+r,Math.min(RIGHT_X-r,LEFT_X+e[1]));
    const y=Math.max(DANGER_Y-40,Math.min(FLOOR_Y-r,FLOOR_Y+e[2]));
    const nb=makeBlob(x,y,tier);
    nb.rainbow=e[3]===1;
    nb.owner=typeof e[4]==='string'?e[4].slice(0,40):'';
    nb.pop=0;
    // A short grace so a pile that is slightly interpenetrated after the
    // reload gets pushed apart before anything is allowed to merge.
    nb.grace=0.5;
  }
  if(!blobs.length)return false;
  score=Math.max(0,s.score|0);
  maxCombo=Math.max(0,s.mc|0); dropsThisRun=Math.max(0,s.dr|0);
  if(ok(s.cur)&&s.cur>=0&&s.cur<SPAWN_TIERS)currentTier=s.cur|0;
  if(ok(s.next)&&s.next>=0&&s.next<SPAWN_TIERS)nextTier=s.next|0;
  if(Array.isArray(s.pu)) for(let i=0;i<POWERUPS.length;i++){
    const v=s.pu[i];
    if(ok(v)) POWERUPS[i].charge=Math.max(0,Math.min(POWERUPS[i].need,v|0));
  }
  if(ok(s.run)) runNumber=Math.max(0,s.run|0);
  // The seed was just rewound by the caller; walk it forward to the saved spot.
  drawCount=Math.max(0,Math.min(100000,s.dc|0));
  if(HUB)for(let i=0;i<drawCount;i++)HUB.random();
  deaths=Math.max(0,s.dt|0);
  jar=Array.isArray(s.jar)?s.jar.filter(a=>Array.isArray(a)&&ok(a[0])&&a[0]>=0&&a[0]<SPAWN_TIERS)
        .slice(0,3).map(a=>({tier:a[0]|0,name:typeof a[1]==='string'?a[1].slice(0,40):'',idx:ok(a[2])?a[2]|0:-1})):[];
  jarUsed=s.ju===1; jarOpen=false;
  powerupsUsed=Math.max(0,s.pw|0); dropsAtLevel=Math.max(0,s.dal|0);
  heldOwner=typeof s.ho==='string'?s.ho.slice(0,40):'';
  jarNotes=(s.jn&&typeof s.jn==='object')?s.jn:{};
  if(!jar.length&&!jarUsed)dealJar();
  maxTier=Math.max(maxTier,Math.min(MAXT,s.mt|0)); runTime=Math.max(0,+s.rt||0);
  // The board is back, but the player is not "playing" until they act: the
  // run reopens (and gameplayStart fires) on their next drop.
  resumedRun=true;
  return true;
}

// ---------- pause ----------
// Pausing is a real gameplay boundary: the session stops on the way in and
// starts again on the way out, so menu time is never counted as play.
function pauseGame(){
  if(paused||gameOver||boardOpen||jarOpen)return;
  paused=true;
  hint=null;
  popMode=false;           // an armed powerup would be confusing after a pause
  dragging=false; armed=false;
  endPlay();
  saveRun();               // a paused tab is the likeliest one to be closed
  track('ui','pause','start');
  beep(300,0.08,0.05,'sine');
}
function resumeGame(){
  if(!paused)return;
  paused=false;
  track('ui','pause','complete');
  // only re-open a gameplay session if a run was actually underway
  if(runStarted&&!gameOver) beginPlay();
  beep(420,0.08,0.05,'sine');
}
// Backgrounding the tab pauses rather than silently running on. It does NOT
// auto-resume: coming back to a live board mid-drop loses runs. Only a run
// that is actually underway auto-pauses — inside an iframe, focus moves off
// the game for all sorts of reasons at load, and a player must never arrive
// at a pause screen they didn't ask for.
function autoPause(){ if(runStarted&&!gameOver) pauseGame(); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden){autoPause();saveRun();} });
addEventListener('blur',autoPause);
// pagehide is the last event a mobile browser reliably delivers before it
// kills a backgrounded tab, so it gets the final snapshot.
addEventListener('pagehide',()=>saveRun());

// ---------- input ----------
function ptr(e){
  const rect=canvas.getBoundingClientRect();
  const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
  const cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
  return{x:cx/rect.width*W, y:cy/rect.height*H};
}
function clampAim(x){
  const r=rainbowNext()?TIERS[1].r:TIERS[currentTier].r;
  return Math.max(LEFT_X+r+2,Math.min(RIGHT_X-r-2,x));
}
// Hitboxes are the whole control plus a margin, never just the glyph on it.
function inRect(p,r,pad){
  const m=pad===undefined?6:pad;
  return p.x>=r.x-m&&p.x<=r.x+r.w+m&&p.y>=r.y-m&&p.y<=r.y+r.h+m;
}
function inPauseBtn(p){
  return inRect(p,{x:PAUSE.cx-PAUSE.r,y:PAUSE.cy-PAUSE.r,w:PAUSE.r*2,h:PAUSE.r*2},8);
}
// Which control, if any, is under this point right now. One function used by
// BOTH pointerdown and pointerup so a control can require press AND release on
// itself, the way a real button does. Without that, an aim gesture that starts
// in the field and happens to end over a button fires it — which is how a
// player aiming downward triggered an ad break by releasing on the reward
// button, and how dragging off a button dropped a blob.
function jarSlotRect(i){
  // The three on offer, spread across the pit at its vertical middle.
  const cx=(LEFT_X+RIGHT_X)/2, gap=(RIGHT_X-LEFT_X)/3;
  return {cx:cx+(i-1)*gap,cy:(DANGER_Y+FLOOR_Y)/2+16,r:Math.max(30,TIERS[jar[i].tier].r)};
}
function hitControl(p){
  // The board is modal: while it is up it is the only control on the screen,
  // and its title band flips between its two pages.
  if(boardOpen){
    const tab=boardTabAt(p);
    if(tab>=0)return 'board-tab'+tab;
    const tile=eyeTileAt(p);
    if(tile>=0)return 'eyes-'+tile;
    return 'board-close';
  }
  // So is the broken jar: take one, or tap elsewhere to keep yours.
  if(jarOpen){
    for(let i=0;i<jar.length;i++){
      const s=jarSlotRect(i);
      if(Math.hypot(p.x-s.cx,p.y-s.cy)<=s.r+14)return 'jar-take'+i;
    }
    return 'jar-close';
  }
  if(gameOver){
    if(commentPending)return null;
    // A charged power-up is still spendable on a dead board; a flat one is not
    // offered at all, so nothing here can produce a locked-button buzz.
    for(let i=0;i<BTN_SLOTS.length&&MUT!=='noline';i++){
      const s=BTN_SLOTS[i];
      if(POWERUPS[i]&&POWERUPS[i].charge>=POWERUPS[i].need&&
         p.x>=s.x-4&&p.x<=s.x+s.w+4&&p.y>=s.y-4&&p.y<=s.y+s.h+8)return 'rescue'+i;
    }
    if(!scorePosted&&HUB&&HUB.continueAvailable&&inGoButton(p,GO_CONT_Y))return 'post-score';
    if(inGoButton(p,GO_AGAIN_Y))return 'go-again';
    return null;
  }
  if(paused){
    if(inGoButton(p,GO_CONT_Y))return 'resume';
    if(inGoButton(p,GO_AGAIN_Y))return 'restart';
    return null;
  }
  if(inPauseBtn(p))return 'book';
  if(jarTell){
    const t=jarTellRect();
    if(inRect(p,t,6))return 'jar-tell';
  }
  if(!jarUsed&&jar.length){
    const j=jarRect();
    if(Math.abs(p.x-j.cx)<=j.r+8&&Math.abs(p.y-j.cy)<=j.r*1.5+8)return 'jar';
  }
  if(inRect(p,{x:TROPHY.cx-TROPHY.r,y:TROPHY.cy-TROPHY.r,
               w:TROPHY.r*2,h:TROPHY.r*2},8))return 'board';
  if(inRect(p,{x:RESTART.cx-RESTART.r,y:RESTART.cy-RESTART.r,
               w:RESTART.r*2,h:RESTART.r*2},8))return 'restart-now';
  for(let i=0;i<BTN_SLOTS.length;i++){
    const s=BTN_SLOTS[i];
    if(p.x>=s.x-4&&p.x<=s.x+s.w+4&&p.y>=s.y-4&&p.y<=s.y+s.h+8)return 'pu'+i;
  }
  return null;
}
// Which control the CURRENT gesture pressed down on: null means it started on
// the play field and can only ever produce a drop.
let pressTarget=null;

let lastPointerId=null;
canvas.addEventListener('pointerdown',e=>{
  lastPointerId=e.pointerId;
  unlockAudio();
  // Capture keeps pointermove/up coming to the canvas even when the finger
  // travels outside it, which aiming very often does.
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  const p=ptr(e);
  pressTarget=hitControl(p);
  // Pressing a control (or a menu) must not start an aim gesture, and must not
  // yank the aim across the board on the way to releasing it.
  if(pressTarget||paused||gameOver)return;
  dragging=true; armed=false;
  anchorY=p.y; dragX=p.x; dragY=p.y;
  aimX=clampAim(p.x);
});
canvas.addEventListener('pointermove',e=>{
  const p=ptr(e);
  dragX=p.x; dragY=p.y;
  // Arming LATCHES. The previous version re-anchored on every move event while
  // unarmed, so a slow drag never accumulated enough distance to cross the
  // threshold and only fast flicks ever armed it.
  if(!armed&&p.y-anchorY>=SLING_DEAD) armed=true;
  if(!armed){
    // Still repositioning: horizontal drag keeps its original meaning, and the
    // baseline follows the finger upward so an up-then-down drag measures from
    // the highest point rather than from a stale anchor.
    if(p.y<anchorY) anchorY=p.y;
    aimX=clampAim(p.x);
  }
});
canvas.addEventListener('pointercancel',()=>{dragging=false;armed=false;pressTarget=null;});
// No non-passive touchmove handler, deliberately: preventing a touchmove takes
// a WebKit page off its fast path (it was the prime suspect in the 30fps-until-
// tap investigation), and touch-action:none on body, #wrap and the canvas
// already blocks scrolling on iOS 13+. If scrolling ever comes back during a
// drag, this is where the preventDefault belongs.
document.addEventListener('gesturestart',e=>e.preventDefault());

// ---------- keyboard (desktop) ----------
// Two jobs. First, the page must NEVER scroll or jump: space, the arrows and
// page/home/end all scroll a document by default, and a player pressing space
// to drop and watching the view lurch is the kind of thing that ends a
// session. preventDefault runs for those keys unconditionally, even mid-ad.
// Second, the same verbs as touch, because a desktop player who cannot aim
// and drop from the keyboard is playing a worse game than a phone player.
const SCROLL_KEYS=new Set([' ','Spacebar','ArrowLeft','ArrowRight','ArrowUp',
  'ArrowDown','PageUp','PageDown','Home','End','Enter']);
let keyAimDir=0, keyFine=false;
addEventListener('keydown',e=>{
  if(SCROLL_KEYS.has(e.key)) e.preventDefault();
  keyFine=e.shiftKey;
  if(e.repeat) return;      // a held key is steered by the frame loop instead
  const k=e.key;
  if(k==='Escape'||k==='p'||k==='P'){ paused?resumeGame():pauseGame(); return; }
  if(paused){
    if(k===' '||k==='Spacebar'||k==='Enter') resumeGame();
    return;
  }
  if(gameOver){
    // Enter/space takes the plain restart; the ad continue stays click-only so
    // it can never be triggered by a stray keypress.
    if(k===' '||k==='Spacebar'||k==='Enter'){endPlay();restart();}
    return;
  }
  if(k==='ArrowLeft'||k==='ArrowRight'){
    keyAimDir=k==='ArrowLeft'?-1:1;
    unlockAudio();
    aimX=clampAim(aimX+keyAimDir*6);   // one nudge on tap, then it glides
    return;
  }
  if(k===' '||k==='Spacebar'||k==='Enter'||k==='ArrowDown'){
    unlockAudio();
    if(popMode){ popMode=false; beep(240,0.07,0.06,'sine'); return; }
    performDrop(null);
    return;
  }
  // number keys fire the powerups, matching their on-screen order
  const n=parseInt(k,10);
  if(n>=1&&n<=POWERUPS.length){ unlockAudio(); usePowerup(POWERUPS[n-1],n-1); }
},{passive:false});
addEventListener('keyup',e=>{
  if(SCROLL_KEYS.has(e.key)) e.preventDefault();
  keyFine=e.shiftKey;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight') keyAimDir=0;
},{passive:false});
// Losing focus with a key held would otherwise leave the aim gliding forever.
addEventListener('blur',()=>{keyAimDir=0;});
canvas.addEventListener('pointerup',e=>{
  try{canvas.releasePointerCapture(e.pointerId);}catch(_){}
  const pull=slingPull();
  dragging=false; armed=false;
  const target=pressTarget; pressTarget=null;
  const p=ptr(e);

  // A control fires only if this gesture both PRESSED and RELEASED on it.
  if(target){
    if(hitControl(p)!==target)return;      // slid off: cancelled, like a button
    if(target==='post-score'){postScoreCard(e);return;}
    if(target==='go-again'||target==='restart'){paused=false;endPlay();restart();return;}
    if(target==='resume'){resumeGame();return;}
    if(target==='book'){openBook();return;}
    if(target==='board'){openBoard();return;}
    if(target==='jar'){openJar();return;}
    if(target==='jar-close'){closeJar();return;}
    if(target==='jar-tell'){tellJar(e);return;}
    if(target.startsWith('jar-take')){takeFromJar(+target.slice(8));return;}
    if(target==='restart-now'){endPlay();restart();return;}
    if(target==='board-close'){closeBoard();return;}
    if(target.startsWith('board-tab')){boardPage=+target.slice(9);beep(520,0.06,0.05,'triangle');return;}
    if(target.startsWith('eyes-')){pickEyes(+target.slice(5));return;}
    if(target.startsWith('rescue')){rescueWithPowerup(+target.slice(6));return;}
    if(target.startsWith('pu')){const i=+target.slice(2);usePowerup(POWERUPS[i],i);return;}
    return;
  }
  // Pressed the field (or a menu backdrop): this can only ever be a drop.
  if(gameOver||paused)return;

  // Pop mode
  if(popMode){
    let target=null,bestD=1e9;
    for(const b of blobs){
      const c=centroid(b);
      const d=Math.hypot(c.x-p.x,c.y-p.y);
      if(d<b.R*1.1&&d<bestD){bestD=d;target=b;}
    }
    if(target){
      const tc=centroid(target);
      burst(tc.x,tc.y,TIERS[target.tier].col,22);
      addRing(tc.x,tc.y,TIERS[target.tier].col,target.R*0.4,target.R*2.2);
      addShake(4);
      removeBlob(target);
      beep(520,0.12,0.1,'triangle');
      puById('pop').charge=0; powerupsUsed++;   // spent only on a real hit
      track('powerup','pop','complete');
    }else{
      beep(240,0.07,0.06,'sine');  // missed: cancel, keep the charge
    }
    popMode=false;return;
  }

  if(!pull) aimX=clampAim(p.x);
  performDrop(pull);
});

// The drop itself, shared by pointer and keyboard so the two can never drift
// apart. `pull` is an aim vector, or null for a plain vertical drop.
function performDrop(pull){
  // No dropping while the stack is already over the line. Without this you can
  // always outrun the danger timer by spawning faster than it accumulates,
  // which turns a full board into no threat at all.
  if(gameOver||paused||popMode)return;
  if(!canDrop||(overLine&&MUT!=='noline')){
    if(overLine)beep(150,0.09,0.05,'square');
    return;
  }
  if(MUT==='noline'&&dropsThisRun>=NOLINE_DROPS)return;   // the run is over bar the settling
  if(rainbowNext()){
    const b=makeBlob(aimX,HOLD_Y,1);
    b.rainbow=true; b.grace=MERGE_GRACE_SHOT;
    if(rainbowArmed){
      rainbowArmed=false;
      puById('rainbow').charge=0;   // spent on the drop, not on arming
      powerupsUsed++;
      track('powerup','rainbow','complete');
    }
  }else{
    const dropped=makeBlob(aimX,HOLD_Y,currentTier);
    dropped.grace=MERGE_GRACE_SHOT;
    dropped.owner=heldOwner; heldOwner='';
    const prevTier=currentTier;
    currentTier=nextTier; nextTier=rndTier();
    jarAvoid(prevTier);
  }
  const nb=blobs[blobs.length-1];
  dropsThisRun++;
  comboCount=0;   // this drop starts its own chain
  checkGoals();
  if(pull){
    // Aimed shot. Power curve is squared so light taps stay genuinely light
    // and the top of the range takes real commitment.
    const sp=SLING_MIN_V+(SLING_MAX_V-SLING_MIN_V)*pull.power*pull.power;
    setVel(nb,pull.nx*sp,pull.ny*sp);
    beep(200+pull.power*260,0.09,0.08,'sawtooth');
    if(pull.power>0.7) addShake(2.5);
  }else{
    // Plain drop, launched downward so it lands with impact instead of drifting
    setVel(nb,0,SLING_MIN_V);
    beep(300,0.07,0.07,'sine');
  }
  nb.pop=0.6;
  aimX=clampAim(aimX);
  canDrop=false; dropT=0;
  // The first drop is what starts a run, and what opens the gameplay session:
  // loading the post is not playing.
  if(!runStarted){
    runStarted=true;
    if(resumedRun){
      // a restored board is the SAME run continuing, so it must not be
      // counted as another one in the funnel
      resumedRun=false;
      track('run','resumed','start');
    }else{
      runNumber++;
      track('run',runBucket(runNumber),'start');
    }
    beginPlay();
  }
  if(pull&&!aimedEver){
    aimedEver=true;
    if(aimPromptShown)track('tutorial','aim-prompt','interact');
    track('verb','aim-found','complete');
  }
}

// ================================================================
// RENDERING
// ================================================================
// The visual hull as a Path2D, built ONCE per blob per frame and then reused
// for the fill, the clip, the shading lip and the outline. Rebuilding it for
// each of those (the old blobHullPath did) meant six passes of ~30
// quadratic curves per blob per frame — thousands of path ops a frame, which
// is what a weak mobile GPU actually chokes on.
const _hx=[],_hy=[];
function blobHull(b){
  const c=centroid(b),pts=b.pts,n=b.N;
  for(let i=0;i<n;i++){
    const p=pts[i];
    const dx=p.x-c.x,dy=p.y-c.y;
    const d=Math.sqrt(dx*dx+dy*dy)||1;
    const k=p.r*0.72/d;
    _hx[i]=p.x+dx*k; _hy[i]=p.y+dy*k;
  }
  const P=new Path2D();
  P.moveTo((_hx[0]+_hx[n-1])/2,(_hy[0]+_hy[n-1])/2);
  for(let i=0;i<n;i++){
    const j=(i+1)%n;
    P.quadraticCurveTo(_hx[i],_hy[i],(_hx[i]+_hx[j])/2,(_hy[i]+_hy[j])/2);
  }
  P.closePath();
  return P;
}

// `mul` scales the pattern's opacity, so a faded host (a locked ticket dot)
// keeps its pattern faded instead of having it punch through at full strength.
function drawPattern(t,R,mul){
  ctx.fillStyle=t.dark; ctx.globalAlpha=0.42*(mul===undefined?1:mul);
  if(t.pat==='dots'){
    const step=R*0.55;
    for(let x=-R;x<=R;x+=step) for(let y=-R;y<=R;y+=step){
      ctx.beginPath();ctx.arc(x+step/2,y+step/2,R*0.11,0,Math.PI*2);ctx.fill();
    }
  }else if(t.pat==='stripes'){
    ctx.save();ctx.rotate(0.5);
    const step=R*0.5;
    for(let x=-R*1.6;x<=R*1.6;x+=step)ctx.fillRect(x,-R*1.6,step*0.45,R*3.2);
    ctx.restore();
  }else if(t.pat==='rings'){
    ctx.strokeStyle=t.dark;ctx.lineWidth=R*0.09;
    for(let rr=R*0.28;rr<R;rr+=R*0.32){ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();}
  }else if(t.pat==='star'){
    // The final tier is the one blob a player may never see, so it gets a
    // mark rather than a texture: one big five-point star, with three small
    // ones tucked around it. (The old scatter of tiny dashes read as noise.)
    const star=(cx,cy,rad,rot,stroke)=>{
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const a=-Math.PI/2+rot+i*Math.PI/5;
        const rr2=(i%2?rad*0.42:rad);
        const x=cx+Math.cos(a)*rr2, y=cy+Math.sin(a)*rr2;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
      if(stroke){ctx.lineWidth=rad*0.16;ctx.lineJoin='round';ctx.stroke();}
      else ctx.fill();
    };
    // The big one is outlined, not filled, so the face still reads on top of
    // it; the small ones are solid so they don't get lost.
    ctx.strokeStyle=t.dark;
    star(0,-R*0.03,R*0.66,0,true);
    star(R*0.62,R*0.52,R*0.17,0.4);
    star(-R*0.64,R*0.44,R*0.14,-0.3);
    star(-R*0.52,-R*0.56,R*0.12,0.2);
  }
  ctx.globalAlpha=1;
}

// ---------- eye sets ----------
// A set changes the open eye only: the lid over it and the pupil in it. The
// blink and the >< squeeze are the same for every set, so a face still reads
// as the same face whatever it wears. `lid` is how much of the eye the lid
// covers from the top; `tilt` slopes its edge, +1 low at the inner corner
// (angry), -1 high there (worried). `pupil` names a shape below; `iris` a
// colour behind the pupil.
//
// 'regular' is everyone's. The rest are earned one per gold day, drawn at
// random by the server from the registry's list, which a build probe holds
// to this one.
const EYES=[
  {id:'regular',name:'普通'},
  {id:'angry',name:'生气',lid:0.45,tilt:1},
  {id:'worried',name:'担忧',lid:0.45,tilt:-1},
  {id:'sleepy',name:'困倦',lid:0.55,tilt:0},
  {id:'snake',name:'蛇眼',pupil:'slit',iris:'#e6c94d'},
  {id:'goat',name:'山羊',pupil:'bar',iris:'#d8a862'},
  {id:'frog',name:'青蛙',pupil:'slot',iris:'#9fd24f'},
  {id:'woah',name:'哇哦',pupil:'big'},
  {id:'scared',name:'惊恐',pupil:'tiny'},
  {id:'kawaii',name:'可爱',pupil:'shine'},
  {id:'real',name:'写实',pupil:'iris'},
  {id:'star',name:'星星',pupil:'star'},
  {id:'heart',name:'爱心',pupil:'heart'},
  {id:'spiral',name:'螺旋',pupil:'spiral'},
  // The side-eye: a flat half-lid on one eye, the other's cocked up at the
  // outer corner, and both pupils slid off to one side.
  {id:'judgy',name:'审视',lid:0.45,tilt:-1,oneBrow:true,gaze:0.6},
];
const EYES_BY_ID={};
for(const e of EYES)EYES_BY_ID[e.id]=e;
let eyesLocal='';   // the pick with no hub to remember it
function eyeOwned(id){ return id==='regular'||!!(HUB&&HUB.unlocked.includes(id)); }
function eyesWorn(){
  const id=HUB?HUB.selected:eyesLocal;
  return (id&&eyeOwned(id)&&EYES_BY_ID[id])||EYES[0];
}
function starPath(cx,cy,rad,rot){
  ctx.beginPath();
  for(let i=0;i<10;i++){
    const a=-Math.PI/2+rot+i*Math.PI/5, rr=i%2?rad*0.45:rad;
    const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.closePath();
}
function heartPath(cx,cy,s){
  ctx.beginPath();
  ctx.moveTo(cx,cy+s*0.95);
  ctx.bezierCurveTo(cx-s*1.3,cy-s*0.1,cx-s*0.75,cy-s*1.05,cx,cy-s*0.4);
  ctx.bezierCurveTo(cx+s*0.75,cy-s*1.05,cx+s*1.3,cy-s*0.1,cx,cy+s*0.95);
  ctx.closePath();
}
// One open eye at (0,0), radius `er`, on the `sx` side of the face, looking
// along `la`. The lid is a clip rather than a patch of paint, so the body's
// pattern shows through above it the way it does everywhere else.
function drawEye(set,er,sx,la,look,R){
  const px=Math.cos(la)*look+(set.gaze||0)*er*0.5, py=Math.sin(la)*look, pr=er*0.5;
  const ix=-sx;   // toward the middle of the face
  const tilt=set.oneBrow&&sx<0?0:(set.tilt||0);
  const lidY=x=>-er+(set.lid||0)*2*er+tilt*(x*ix/er)*er*0.55;
  ctx.save();
  if(set.lid){
    ctx.beginPath();
    ctx.moveTo(-er*1.6,lidY(-er*1.6));ctx.lineTo(er*1.6,lidY(er*1.6));
    ctx.lineTo(er*1.6,er*2);ctx.lineTo(-er*1.6,er*2);ctx.closePath();
    ctx.clip();
  }
  ctx.fillStyle=CREAM;ctx.beginPath();ctx.arc(0,0,er,0,Math.PI*2);ctx.fill();
  if(set.iris){
    ctx.fillStyle=set.iris;ctx.beginPath();ctx.arc(px*0.6,py*0.6,er*0.74,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=INK;
  switch(set.pupil){
    case 'slit':
      ctx.beginPath();ctx.ellipse(px,py,pr*0.32,pr*1.35,0,0,Math.PI*2);ctx.fill();break;
    case 'bar':
      ctx.beginPath();ctx.roundRect(px-pr*1.05,py-pr*0.42,pr*2.1,pr*0.84,pr*0.2);ctx.fill();break;
    case 'slot':
      ctx.beginPath();ctx.ellipse(px,py,pr*1.35,pr*0.34,0,0,Math.PI*2);ctx.fill();break;
    case 'big':
      ctx.beginPath();ctx.arc(px*0.5,py*0.5,er*0.82,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=CREAM;ctx.beginPath();ctx.arc(px*0.5-er*0.3,py*0.5-er*0.3,er*0.18,0,Math.PI*2);ctx.fill();break;
    case 'tiny':
      ctx.beginPath();ctx.arc(px,py,pr*0.4,0,Math.PI*2);ctx.fill();break;
    case 'shine':
      // the manga eye: a big dark iris, a lighter band low in it, two lights
      ctx.beginPath();ctx.arc(px*0.5,py*0.5,er*0.84,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a4a8a';ctx.beginPath();ctx.arc(px*0.5,py*0.5+er*0.25,er*0.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=CREAM;
      ctx.beginPath();ctx.arc(px*0.5-er*0.32,py*0.5-er*0.36,er*0.28,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(px*0.5+er*0.3,py*0.5+er*0.3,er*0.12,0,Math.PI*2);ctx.fill();break;
    case 'iris':
      // the real one: a ringed blue iris with a pupil and a glint
      ctx.fillStyle='#4a90d9';ctx.beginPath();ctx.arc(px,py,pr*1.3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#215eae';ctx.lineWidth=Math.max(1,er*0.08);ctx.stroke();
      ctx.fillStyle=INK;ctx.beginPath();ctx.arc(px,py,pr*0.62,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=CREAM;ctx.beginPath();ctx.arc(px-pr*0.5,py-pr*0.5,pr*0.3,0,Math.PI*2);ctx.fill();break;
    case 'star':
      starPath(px,py,pr*1.25,0);ctx.fill();break;
    case 'heart':
      ctx.fillStyle='#e0473c';heartPath(px,py,pr*1.05);ctx.fill();
      ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1,er*0.07);ctx.lineJoin='round';ctx.stroke();break;
    case 'spiral':{
      ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.5,er*0.16);ctx.lineCap='round';
      ctx.beginPath();
      const turns=2.6, steps=40;
      for(let i=0;i<=steps;i++){
        const t=i/steps, a=t*turns*Math.PI*2, rr=t*pr*1.25;
        const x=px+Math.cos(a)*rr, y=py+Math.sin(a)*rr;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke();break;
    }
    default:
      ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(set.lid){
    // the lid's edge, inked, only where it crosses the eye
    ctx.save();
    ctx.beginPath();ctx.arc(0,0,er*1.04,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,R*0.06);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-er*1.3,lidY(-er*1.3));ctx.lineTo(er*1.3,lidY(er*1.3));ctx.stroke();
    ctx.restore();
  }
}

// The pair of eyes, at (0,0). `spread` is how far apart they sit as a
// fraction of R; the face uses the standard 0.32, the picker pulls them in
// so a tile can be all eyes.
function drawEyes(R,f,la,set,spread){
  set=set||eyesWorn();
  const eyeY=0,eyeX=R*(spread||0.32),eyeR=Math.max(3,R*0.13),look=eyeR*0.35;
  const blink=f.blinkT>0&&f.blinkT<0.12,squeeze=f.mood>0.35;
  for(const sx of[-1,1]){
    // Slightly different eye sizes, per the design system: it stops the face
    // reading as machine-symmetrical.
    const er=eyeR*(sx<0?1:0.88);
    ctx.save();ctx.translate(sx*eyeX,eyeY);
    if(squeeze){
      ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,R*0.06);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-eyeR*0.8,-eyeR*0.5);ctx.lineTo(eyeR*0.6,0);ctx.lineTo(-eyeR*0.8,eyeR*0.5);ctx.stroke();
    }else if(blink){
      ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,R*0.06);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-eyeR*0.8,0);ctx.lineTo(eyeR*0.8,0);ctx.stroke();
    }else{
      // No ink ring on the eye: CREAM is near-white and every tier colour is
      // saturated, so the shape reads on its own and the outline only added
      // weight. The >< and blink states are strokes in their own right and
      // keep theirs.
      drawEye(set,er,sx,la,look,R);
    }
    ctx.restore();
  }
}

function drawFace(R,f,la,set){
  ctx.save();ctx.translate(0,-R*0.12);drawEyes(R,f,la,set);ctx.restore();
  const squeeze=f.mood>0.35;
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,R*0.05);ctx.lineCap='round';
  ctx.beginPath();
  // One closed arc, filled AND stroked. It used to stroke an arc at R*0.16 and
  // fill a separate, smaller disc at R*0.22/R*0.11, so the blob colour showed
  // through the crescent between them and the open mouth read as hollow with a
  // fang at each corner.
  if(squeeze){ctx.arc(0,R*0.18,R*0.16,0.15*Math.PI,0.85*Math.PI);ctx.closePath();ctx.fillStyle=INK;ctx.fill();ctx.stroke();}
  else{ctx.arc(0,R*0.12,R*0.18,0.2*Math.PI,0.8*Math.PI);ctx.stroke();}
  if(squeeze){
    ctx.fillStyle='rgba(217,84,72,0.3)';
    for(const sx of[-1,1]){ctx.beginPath();ctx.arc(sx*R*0.55,R*0.08,R*0.14,0,Math.PI*2);ctx.fill();}
  }
}

// The blob's current rotation, measured as the circular mean of how far every
// surface point has drifted from its rest angle. Using a single point (which is
// what the pattern used to do) is noisy: one point squashed into a gap swings
// the whole reading. Averaging over the ring is stable under deformation, so
// the face can be locked to it at full strength without jittering.
function blobRotation(b){
  const c=centroid(b),pts=b.pts,N=b.N;
  let sx=0,sy=0;
  for(let i=0;i<N;i++){
    const rest=(i/N)*Math.PI*2;
    const a=Math.atan2(pts[i].y-c.y,pts[i].x-c.x)-rest;
    sx+=Math.cos(a); sy+=Math.sin(a);
  }
  return Math.atan2(sy,sx);
}

function rainbowCol(offset){return`hsl(${(time*90+offset)%360},85%,70%)`;}

function drawBlob(b,look){
  const t=TIERS[b.tier],R=b.R,f=b.face;
  const c=centroid(b);
  const bodyCol=b.rainbow?rainbowCol(0):t.col;

  // spawn pop: scale up from small with a slight overshoot
  let popScale=1;
  if(b.pop>0){
    const k=1-b.pop;
    popScale=0.55+0.45*k+Math.sin(k*Math.PI)*0.14;
  }
  const popping=popScale!==1;
  if(popping){
    ctx.save();
    ctx.translate(c.x,c.y); ctx.scale(popScale,popScale); ctx.translate(-c.x,-c.y);
  }

  // One hull path for the whole blob, and ONE clip covering both the pattern
  // and the shading lip. Clipping is a masking operation and is the single
  // most expensive thing a tile-based mobile GPU is asked to do here, so the
  // blob gets exactly one.
  const hull=blobHull(b);
  ctx.fillStyle=bodyCol; ctx.fill(hull);

  const rot=blobRotation(b);
  const wantPattern=!b.rainbow&&gLevel<2;
  const wantLip=gLevel<1;
  if(wantPattern||wantLip){
    ctx.save();
    ctx.clip(hull);
    if(wantPattern){
      ctx.save();
      ctx.translate(c.x,c.y);
      ctx.rotate(rot);
      blitPattern(b.tier,R);
      ctx.restore();
    }
    if(wantLip){
      // inset -5px -7px 0 rgba(ink,0.12): a bottom-right shading lip, no blur.
      // The lip is the body MINUS the body shifted up-left, so it survives
      // only along the bottom-right edge. Both outlines have to live in ONE
      // path for the even-odd rule to fill their difference — filling a lone
      // shifted copy inverts it, lighting the bottom-right instead.
      // The spec's fixed 5/7px was written for CSS-sized blobs; held to the
      // letter it vanishes on a tier-9 blob seven times that radius, so the
      // offset scales with R and bottoms out at exactly 5/7 for tier 0.
      const lx=Math.max(5,R*0.09), ly=Math.max(7,R*0.12);
      const lip=new Path2D();
      lip.addPath(hull);
      lip.addPath(hull,new DOMMatrix([1,0,0,1,-lx,-ly]));
      ctx.globalAlpha=0.12;
      ctx.fillStyle=INK;
      ctx.fill(lip,'evenodd');
    }
    ctx.restore();
  }

  // Outline
  ctx.strokeStyle=INK;
  ctx.lineWidth=Math.max(4,Math.min(4.5,R*0.09));
  ctx.lineJoin='round';
  ctx.stroke(hull);

  // Face rotates with the body. The look angle is expressed in the blob's
  // local frame (world angle minus the body rotation) so the pupils keep
  // tracking the cursor in world space even while the head is tilted.
  ctx.save();
  ctx.translate(c.x,c.y);
  ctx.rotate(rot);
  drawFace(R,f,(look===undefined?Math.atan2(HOLD_Y-c.y,aimX-c.x):look)-rot);
  ctx.restore();

  if(popping) ctx.restore();
}

// One tier dot of the merge-order ticket, with the current-tier halo.
// (0,0) must be the dot centre when called.
// Every tier renders at FULL colour. Fading the non-spawnable ones to 0.28
// read as "locked / unavailable", which is wrong: they are the prizes, and a
// legend you cannot see is not a legend. Which tiers can actually drop is
// carried by the span marker below the row instead.
function drawTierDot(i,r){
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fillStyle=TIERS[i].col;ctx.fill();
  // Same per-tier pattern as the blob itself: the ticket is a legend, so a
  // dot has to be recognisable as the thing it stands for, not just its hue.
  ctx.save();
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();
  drawPattern(TIERS[i],r);
  ctx.restore();
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
  ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
  if(i===currentTier){
    // halo ring: card-bg gap, then tier colour
    ctx.beginPath();ctx.arc(0,0,r+3,0,Math.PI*2);
    ctx.strokeStyle=CARD;ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r+5.5,0,Math.PI*2);
    ctx.strokeStyle=TIERS[i].col;ctx.lineWidth=2.5;ctx.stroke();
  }
}

// The "these are the ones that drop" marker: a thin ink rule running along the
// spawnable tiers with a tick turned in at each end, so it reads as a span
// rather than a stray line. Drawn beside the dot run — under it in the
// horizontal ticket, left of it in the vertical one.
function drawSpawnSpan(a,b,off,vertical){
  ctx.save();
  ctx.globalAlpha=0.5;
  ctx.strokeStyle=INK;
  ctx.lineWidth=2;
  ctx.lineCap='round';
  const tick=3.5;
  ctx.beginPath();
  if(vertical){
    ctx.moveTo(off,a);ctx.lineTo(off,b);
    ctx.moveTo(off,a);ctx.lineTo(off+tick,a);
    ctx.moveTo(off,b);ctx.lineTo(off+tick,b);
  }else{
    ctx.moveTo(a,off);ctx.lineTo(b,off);
    ctx.moveTo(a,off);ctx.lineTo(a,off-tick);
    ctx.moveTo(b,off);ctx.lineTo(b,off-tick);
  }
  ctx.stroke();
  ctx.restore();
}

function drawTierRow(){
  // Merge-order ticket: cream card, ink border, soft tilt, hard shadow.
  // Horizontal under the pit in portrait; a vertical column in the side
  // margin in landscape (placement comes from layout via TICKET).
  const dots=TIERS.length;
  const gap=6;
  let total=0;
  const sizes=[];
  for(let i=0;i<dots;i++){
    const d=13+(33-13)*(i/(dots-1));
    sizes.push(d); total+=d+gap;
  }
  total-=gap;

  if(TICKET.vertical){
    const s=TICKET.dotScale;
    const cardW=Math.min(TICKET.maxW,Math.round(33*s)+32);
    const labelH=30, cardH=labelH+total*s+14;
    ctx.save();
    ctx.translate(TICKET.cx,TICKET.cy+cardH/2);
    ctx.rotate(-0.6*Math.PI/180);
    ctx.translate(-cardW/2,-cardH/2);
    const path=rr(0,0,cardW,cardH,16);
    inkShadow(path,4,4,INK_SOFT_SHADOW);
    path();ctx.fillStyle=CARD;ctx.fill();
    path();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();
    microLabel('合成',cardW/2,13,8,'rgba(47,32,19,0.55)',1.2);
    microLabel('顺序',cardW/2,24,8,'rgba(47,32,19,0.55)',1.2);
    let y=labelH+2, spanA=0, spanB=0;
    for(let i=0;i<dots;i++){
      const d=sizes[i]*s, r=d/2;
      if(i===0) spanA=y;
      if(i===SPAWN_TIERS-1) spanB=y+d;
      ctx.save();ctx.translate(cardW/2,y+r);drawTierDot(i,r);ctx.restore();
      y+=d+gap*s;
    }
    drawSpawnSpan(spanA,spanB,7,true);
    ctx.restore();
    return;
  }

  const padX=16, cardW=Math.min(TICKET.maxW,total+padX*2), cardH=58;
  ctx.save();
  ctx.translate(TICKET.cx,TICKET.cy);
  ctx.rotate(-0.6*Math.PI/180);
  ctx.translate(-cardW/2,-cardH/2);

  const path=rr(0,0,cardW,cardH,16);
  inkShadow(path,4,4,INK_SOFT_SHADOW);
  path();ctx.fillStyle=CARD;ctx.fill();
  path();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();

  microLabel('合成顺序',cardW/2,14,8,'rgba(47,32,19,0.55)',1.2);

  const scale=Math.min(1,(cardW-padX*2)/total);
  let x=cardW/2-(total*scale)/2, spanA=0, spanB=0;
  const cy=31;
  for(let i=0;i<dots;i++){
    const d=sizes[i]*scale, r=d/2;
    if(i===0) spanA=x;
    if(i===SPAWN_TIERS-1) spanB=x+d;
    ctx.save();ctx.translate(x+r,cy);drawTierDot(i,r);ctx.restore();
    x+=d+gap*scale;
  }
  drawSpawnSpan(spanA,spanB,cardH-8,false);
  ctx.restore();
}


// ---------- background texture ----------
// Built once into an offscreen tile, then repeated. Cheaper than drawing
// hundreds of dots every frame.
let dotPattern=null;
// One tile of the diagonal grain.
//
// The stripes run along x+y=c. Two of them per tile, at c=s/2 and c=3s/2, is
// exactly what tiles seamlessly: shifting a tile by s maps one onto the other,
// so neighbouring tiles continue the same lines instead of stepping.
// The page grain and the field grain are not the same weight. Behind the play
// area the stripes compete with the blobs and the aim line for attention, so
// they sit close to invisible; out on the paper margin there is nothing to
// compete with and they can carry the texture.
const GRAIN_PAGE='rgba(47,32,19,0.032)';
const GRAIN_FIELD='rgba(47,32,19,0.016)';
function stripeTile(s,ink){
  const t=document.createElement('canvas');
  t.width=s*dpr; t.height=s*dpr;
  const g=t.getContext('2d');
  g.scale(dpr,dpr);
  g.strokeStyle=ink;
  g.lineWidth=2.6;
  for(const c of [s*0.5,s*1.5]){
    g.beginPath(); g.moveTo(c,0); g.lineTo(0,c); g.stroke();
  }
  return t;
}

function buildDotPattern(){
  const t=stripeTile(22,GRAIN_PAGE);   // 22px tile, per the design system
  dotPattern=ctx.createPattern(t,'repeat');
  if(dotPattern.setTransform&&window.DOMMatrix){
    dotPattern.setTransform(new DOMMatrix([1/dpr,0,0,1/dpr,0,0]));
  }
}

// ---------- wooden frame ----------
const PLANK=17;

// --- design system primitives -----------------------------------------
// Hard offset shadow: draw the same shape in ink, offset, with NO blur.
function inkShadow(drawPath,dx,dy,col){
  ctx.save();
  ctx.translate(dx,dy);
  drawPath();
  ctx.fillStyle=col||INK_SHADOW;
  ctx.fill();
  ctx.restore();
}
// Rounded rect as a reusable path thunk
function rr(x,y,w,h,r){return()=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};}
// Sticker: hard shadow, fill, ink border. `tilt` in degrees.
function sticker(x,y,w,h,r,fill,tilt,border,shadow){
  ctx.save();
  ctx.translate(x+w/2,y+h/2);
  ctx.rotate((tilt||0)*Math.PI/180);
  ctx.translate(-w/2,-h/2);
  const path=rr(0,0,w,h,r);
  inkShadow(path,shadow||5,shadow||5);
  path();ctx.fillStyle=fill;ctx.fill();
  path();ctx.strokeStyle=INK;ctx.lineWidth=border||3.5;ctx.stroke();
  ctx.restore();
}
// Ink pill with paper text (the "BEST n" / "NEXT" / "READY!" treatment)
function inkPill(cx,cy,text,size,tilt){
  ctx.save();
  ctx.font=`800 ${size}px ${UIFONT}`;
  const w=ctx.measureText(text).width+16, h=size+9;
  ctx.translate(cx,cy);
  ctx.rotate((tilt||0)*Math.PI/180);
  ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,999);
  ctx.fillStyle=INK;ctx.fill();
  ctx.fillStyle=PAPER;ctx.textAlign='center';
  ctx.fillText(text,0,h/2-6);
  ctx.restore();
}
// Letter-spaced uppercase micro-label
// CJK glyphs already carry their own side bearing, so tracking is skipped
// between them: a short Chinese label just comes apart otherwise.
const CJK=/[⺀-鿿豈-﫿＀-￯]/;
function microLabel(text,cx,y,size,col,spacing){
  ctx.save();
  ctx.font=`800 ${size}px ${UIFONT}`;
  const sp=spacing===undefined?size*0.11:spacing;
  const gap=c=>CJK.test(c)?0:sp;
  const chars=[...text.toUpperCase()];
  let total=0;
  for(const c of chars) total+=ctx.measureText(c).width+gap(c);
  total-=gap(chars[chars.length-1]||'');
  let x=cx-total/2;
  ctx.fillStyle=col||INK;
  ctx.textAlign='left';
  for(const c of chars){ctx.fillText(c,x,y);x+=ctx.measureText(c).width+gap(c);}
  ctx.restore();
}
const GO_BTN_W=250;   // GO_CONT_Y / GO_AGAIN_Y live in layout()

// Same chunky token styling as the powerup buttons, so the game over screen
// doesn't look like it came from a different game.
function goButton(y,label,col,glow,icon){
  // PS-scaled: the game over screen is must-read UI, so it grows with the
  // side panels on wide (small-CSS-scale) viewports. `icon` prefixes the
  // label with a drawn glyph — 'comment', 'play' or 'restart' — so a button
  // that posts on the player's behalf never looks like one that doesn't.
  const w=GO_BTN_W*PS, h=BTN_H*PS, tilt=glow?-1:1;
  ctx.save();
  ctx.translate(W/2,y+h/2);
  ctx.rotate(tilt*Math.PI/180);
  ctx.translate(-w/2,-h/2);
  const path=rr(0,0,w,h,16*PS);
  inkShadow(path,0,5,INK);
  path();ctx.fillStyle=col;ctx.fill();
  path();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();
  ctx.fillStyle=INK;
  ctx.font=`800 ${Math.round(17*PS)}px ${UIFONT}`;
  const txt=label.toUpperCase();
  if(icon){
    const cs=h*0.20, tw=ctx.measureText(txt).width, run=cs*2+10*PS+tw;
    const x0=w/2-run/2;
    ctx.save();ctx.translate(x0+cs,h/2-(icon==='ad'?cs*0.2:0));drawBtnIcon(icon,cs);ctx.restore();
    ctx.fillStyle=INK;ctx.textAlign='left';
    ctx.fillText(txt,x0+cs*2+10*PS,h/2+6*PS);
  }else{
    ctx.textAlign='center';
    ctx.fillText(txt,w/2,h/2+6*PS);
  }
  ctx.restore();
}
function inGoButton(p,y){
  const w=GO_BTN_W*PS, x=(W-w)/2;
  return p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+BTN_H*PS;
}
function woodPlank(x,y,w,h,vertical){
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,5);
  // repeating-linear-gradient(90deg, #c08d4a 0 13px, #b2803e 13px 15px)
  ctx.save();ctx.clip();
  ctx.fillStyle='#c08d4a';ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#b2803e';
  for(let sx=x;sx<x+w+15;sx+=15) ctx.fillRect(sx+13,y,2,h);
  ctx.restore();

  // grain + plank seams, clipped to the board
  ctx.save();
  ctx.clip();
  ctx.strokeStyle='rgba(47,32,19,0.18)';
  ctx.lineWidth=1;
  if(vertical){
    for(let gy=y+8;gy<y+h;gy+=7){
      ctx.beginPath();
      ctx.moveTo(x+2,gy+Math.sin(gy*0.35)*1.2);
      ctx.lineTo(x+w-2,gy+Math.sin(gy*0.5)*1.2);
      ctx.stroke();
    }
    ctx.strokeStyle='rgba(105,68,30,0.65)';
    ctx.lineWidth=2.2;
    for(let sy=y+96;sy<y+h-12;sy+=96){
      ctx.beginPath();ctx.moveTo(x,sy);ctx.lineTo(x+w,sy);ctx.stroke();
    }
  }else{
    for(let gx=x+8;gx<x+w;gx+=7){
      ctx.beginPath();
      ctx.moveTo(gx+Math.sin(gx*0.35)*1.2,y+2);
      ctx.lineTo(gx+Math.sin(gx*0.5)*1.2,y+h-2);
      ctx.stroke();
    }
    ctx.strokeStyle='rgba(105,68,30,0.65)';
    ctx.lineWidth=2.2;
    for(let sx=x+104;sx<x+w-12;sx+=104){
      ctx.beginPath();ctx.moveTo(sx,y);ctx.lineTo(sx,y+h);ctx.stroke();
    }
  }
  ctx.restore();

  // heavy outline
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,5);
  ctx.strokeStyle=INK;
  ctx.lineWidth=3;
  ctx.stroke();
  ctx.restore();
}

let fieldPattern=null;
function buildFieldPattern(){
  const t=stripeTile(26,GRAIN_FIELD);
  fieldPattern=ctx.createPattern(t,'repeat');
  fieldPattern.setTransform(new DOMMatrix([1/dpr,0,0,1/dpr,0,0]));
}

function drawFrame(){
  const top=DANGER_Y-52;
  // Field surface: square top rim, round bottom (8px 8px 26px 26px)
  ctx.beginPath();
  ctx.roundRect(LEFT_X,top,RIGHT_X-LEFT_X,FLOOR_Y-top,[8,8,26,26]);
  ctx.fillStyle=FIELD;ctx.fill();
  if(gLevel<2){
    if(!fieldPattern) buildFieldPattern();
    ctx.save();ctx.clip();ctx.fillStyle=fieldPattern;
    ctx.fillRect(LEFT_X,top,RIGHT_X-LEFT_X,FLOOR_Y-top);
    ctx.restore();
  }
  woodPlank(LEFT_X-PLANK,top,PLANK,FLOOR_Y-top+PLANK,true);
  woodPlank(RIGHT_X,top,PLANK,FLOOR_Y-top+PLANK,true);
  woodPlank(LEFT_X-PLANK,FLOOR_Y,RIGHT_X-LEFT_X+PLANK*2,PLANK,false);
}

// Powerup icons, drawn as ink linework centred on (0,0); s is the half-extent.
// Same hand: round caps, ink strokes, cream fills where a shape needs a body.
function drawPowerupIcon(id,s){
  ctx.save();
  ctx.strokeStyle=INK;ctx.fillStyle=INK;
  ctx.lineCap='round';ctx.lineJoin='round';
  if(id==='shake'){
    // three wiggly lines, phase-shifted so they read as a jolt
    ctx.lineWidth=Math.max(2,s*0.22);
    for(let r=-1;r<=1;r++){
      ctx.beginPath();
      for(let i=0;i<=12;i++){
        const x=-s+2*s*(i/12);
        const y=r*s*0.6+Math.sin((i/12)*Math.PI*2.5+r*1.3)*s*0.22;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
  }else if(id==='pop'){
    // comic starburst
    ctx.lineWidth=Math.max(2,s*0.18);
    ctx.beginPath();
    for(let i=0;i<16;i++){
      const a=(i/16)*Math.PI*2-Math.PI/2;
      const r=(i%2===0)?s*1.05:s*0.48;
      const x=Math.cos(a)*r,y=Math.sin(a)*r;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle=CREAM;ctx.fill();
    ctx.stroke();
  }else if(id==='sweep'){
    // Broom built on ONE axis: the handle runs along u and the head is a
    // trapezoid symmetric about the same u, so the handle enters the head
    // dead centre instead of clipping a corner.
    const ux=-0.6,uy=0.8, vx=0.8,vy=0.6;   // unit axis (down-left) and normal
    const P=(a,b)=>[s*(ux*a+vx*b), s*(uy*a+vy*b)];
    const seg=(A,B)=>{ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();};
    ctx.lineWidth=Math.max(2,s*0.2);
    seg(P(-1.05,0),P(0.12,0));             // handle
    const c1=P(0.1,-0.3),c2=P(0.1,0.3),c3=P(1.0,0.54),c4=P(1.0,-0.54);
    ctx.beginPath();
    ctx.moveTo(c1[0],c1[1]);ctx.lineTo(c2[0],c2[1]);
    ctx.lineTo(c3[0],c3[1]);ctx.lineTo(c4[0],c4[1]);
    ctx.closePath();
    ctx.fillStyle=CREAM;ctx.fill();
    ctx.lineWidth=Math.max(1.5,s*0.15);ctx.stroke();
    ctx.lineWidth=Math.max(1,s*0.1);
    for(const off of[-0.16,0.16]) seg(P(0.3,off),P(0.95,off*1.8));   // bristles
  }else if(id==='rainbow'){
    // arc band in three blob colours, ink-outlined like everything else
    const cols=['#e8443a','#f2c230','#3d87e0'];
    const y0=s*0.55, w=s*0.24;
    ctx.lineWidth=Math.max(1.5,s*0.1);
    ctx.beginPath();ctx.arc(0,y0,s*1.02+w*0.5,Math.PI,0);ctx.stroke();
    for(let i=0;i<3;i++){
      ctx.strokeStyle=cols[i];
      ctx.lineWidth=w;
      ctx.beginPath();ctx.arc(0,y0,s*1.02-w*(i+0.5)+w*0.5,Math.PI,0);ctx.stroke();
    }
    ctx.strokeStyle=INK;
    ctx.lineWidth=Math.max(1.5,s*0.1);
    ctx.beginPath();ctx.arc(0,y0,s*1.02-w*2.5,Math.PI,0);ctx.stroke();
    // close the band ends
    ctx.lineWidth=Math.max(1.5,s*0.1);
    for(const sx of[-1,1]){
      ctx.beginPath();
      ctx.moveTo(sx*(s*1.02+w*0.5),y0);ctx.lineTo(sx*(s*1.02-w*2.5),y0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Clapperboard: the marker for anything that costs the player an ad view.
// Drawn rather than set as an emoji — the design system bans emoji, a font
// glyph would render differently on every platform, and Poki blocks the web
// font we would otherwise need. `s` is the half-width.
function drawPlayIcon(s){
  ctx.save();
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(-s*0.52,-s*0.82);ctx.lineTo(s*0.78,0);ctx.lineTo(-s*0.52,s*0.82);
  ctx.closePath();
  ctx.fillStyle=CREAM;ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.6,s*0.22);ctx.stroke();
  ctx.restore();
}
function drawRestartIcon(s){
  ctx.save();
  // Mirrored so the loop reads counter-clockwise, the direction a "start over"
  // arrow conventionally turns.
  ctx.scale(-1,1);
  const r=s*0.66;
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,s*0.3);ctx.lineCap='round';
  // open loop, with the gap where the arrowhead goes
  ctx.beginPath();ctx.arc(0,0,r,Math.PI*0.42,Math.PI*1.72);ctx.stroke();
  // Arrowhead at the leading end, pointing along the arc's TANGENT in the
  // direction the arc was swept. The local apex is -y, and rotating by the
  // angle alone would aim it radially outward; the tangent is a further
  // half-turn round.
  const a=Math.PI*1.72;
  ctx.translate(Math.cos(a)*r,Math.sin(a)*r);
  ctx.rotate(a+Math.PI);
  ctx.beginPath();
  ctx.moveTo(-s*0.38,s*0.18);ctx.lineTo(s*0.38,s*0.18);ctx.lineTo(0,-s*0.46);
  ctx.closePath();
  ctx.fillStyle=INK;ctx.fill();
  ctx.restore();
}
// Speech bubble, drawn rather than typed: the UI has no emoji and no font
// glyphs, because system emoji differ per platform and the display faces are
// the only fonts shipped.
function drawCommentIcon(s){
  ctx.save();
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.roundRect(-s,-s*0.85,s*2,s*1.4,s*0.42);
  ctx.moveTo(-s*0.15,s*0.5);
  ctx.lineTo(-s*0.05,s*1.0);
  ctx.lineTo(s*0.45,s*0.5);
  ctx.closePath();
  ctx.fillStyle=CARD;ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,s*0.22);ctx.stroke();
  ctx.fillStyle=INK;
  for(let i=-1;i<=1;i++){
    ctx.beginPath();ctx.arc(i*s*0.45,-s*0.14,s*0.13,0,7);ctx.fill();
  }
  ctx.restore();
}
function drawBtnIcon(kind,s){
  if(kind==='comment')drawCommentIcon(s);
  else if(kind==='play')drawPlayIcon(s);
  else if(kind==='restart')drawRestartIcon(s);
}

// An expanding halo on every ready powerup, until the player uses their first
// one. Drawn live rather than baked into the cached UI layer — a few strokes a
// frame, and motion is what actually pulls the eye to a button someone has
// been ignoring for a whole run.
function drawReadyPulse(){
  if(powerupUsedEver||gameOver||paused||boardOpen||jarOpen)return;
  const t=(wallTime*1.3)%1;
  const grow=t*11;
  ctx.save();
  ctx.globalAlpha=(1-t)*0.6;
  ctx.strokeStyle=TEAL;
  ctx.lineWidth=3;
  for(let i=0;i<POWERUPS.length;i++){
    if(POWERUPS[i].charge<POWERUPS[i].need)continue;
    const s=BTN_SLOTS[i];
    ctx.beginPath();
    ctx.roundRect(s.x-grow,s.y-grow,s.w+grow*2,s.h+grow*2,16+grow);
    ctx.stroke();
  }
  ctx.restore();
}

// Trophy, drawn the same way as the pause glyph: an ink silhouette on a card
// sticker. Nothing in this UI is an emoji or a font glyph — system emoji differ
// per platform and the only fonts shipped are the two display faces.
function drawTrophyIcon(s){
  ctx.fillStyle=INK;
  // bowl
  ctx.beginPath();
  ctx.moveTo(-s*0.52,-s*0.66);
  ctx.lineTo(s*0.52,-s*0.66);
  ctx.lineTo(s*0.40,-s*0.12);
  ctx.quadraticCurveTo(s*0.34,s*0.16,0,s*0.16);
  ctx.quadraticCurveTo(-s*0.34,s*0.16,-s*0.40,-s*0.12);
  ctx.closePath();
  ctx.fill();
  // handles
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,s*0.15);ctx.lineCap='round';
  for(const dir of [-1,1]){
    ctx.beginPath();
    ctx.arc(dir*s*0.56,-s*0.40,s*0.24,-Math.PI/2,Math.PI/2,dir<0);
    ctx.stroke();
  }
  // stem and base
  ctx.beginPath();ctx.roundRect(-s*0.10,s*0.12,s*0.20,s*0.30,s*0.05);ctx.fill();
  ctx.beginPath();ctx.roundRect(-s*0.34,s*0.40,s*0.68,s*0.20,s*0.07);ctx.fill();
}

// Where the live score would place, and the gap to the next place above.
//
// Players on exactly your score are skipped: they have not beaten you, so
// passing them is not what ranking up costs. The target is the nearest score
// strictly greater than yours, and beating it takes one more point than
// matching it.
function liveRank(mine){
  const s=HUB&&HUB.scores;
  if(!s||!s.length)return null;
  let above=0;
  while(above<s.length&&s[above]>mine)above++;
  if(!above)return {rank:1,need:0};
  return {rank:above+1,need:s[above-1]-mine+1};
}

function drawPlaysPill(){
  const n=HUB&&HUB.plays;
  if(!n)return;
  const txt=n.toLocaleString()+' 次游玩', size=Math.round(10*PS);
  // Bottom right corner. In portrait the power-up row is bottom anchored, so
  // the pill centres in the strip below it rather than sitting on its edge. In
  // landscape it sits under the jar, at the bottom of the right panel.
  if(MODE==='landscape'){
    if(JAR.tight){
      ctx.font=`800 ${size}px ${UIFONT}`;
      const half=(ctx.measureText(txt).width+16)/2;
      inkPill(JAR.cx-JAR.r-Math.round(8*PS)-half,JAR.cy,txt,size,2);
    }else inkPill(JAR.cx,H-Math.round(18*PS),txt,size,2);
    return;
  }
  let bb=0;
  for(const b of BTN_SLOTS) bb=Math.max(bb,b.y+b.h);
  const cy=bb>H-90?(bb+H)/2:H-Math.round(18*PS);
  inkPill(W-Math.round(58*PS),cy,txt,size,2);
}

// The post's three goals with a dot each: teal filled when hit, an ink ring
// when not. Drawn, not typed, since the shipped fonts have no tick glyph.
function drawGoalList(cx,y,title){
  if(!HUB||!HUB.goals.length)return;
  if(title)microLabel('今日目标',cx,y,Math.round(9*PS),INK_SOFT);
  ctx.font=`800 ${Math.round(12*PS)}px ${UIFONT}`;
  for(let i=0;i<HUB.goals.length;i++){
    const hit=!!(HUB.goalBits&(1<<i));
    const ly=y+(title?16:0)*PS+i*Math.round(20*PS);
    const txt=HUB.goalLabel(i);
    const tw=ctx.measureText(txt).width;
    const x0=cx-tw/2;
    ctx.beginPath();ctx.arc(x0-Math.round(10*PS),ly-Math.round(4*PS),Math.round(4.5*PS),0,Math.PI*2);
    if(hit){ctx.fillStyle=TEAL;ctx.fill();}
    ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=hit?INK:INK_SOFT;ctx.textAlign='left';
    ctx.fillText(txt,x0,ly);
  }
}

function drawTwistLabel(){
  if(MUT==='none'||!HUB)return;
  microLabel(HUB.mutatorLabel.toUpperCase(),RESTART.cx,
             RESTART.cy+RESTART.r+Math.round(11*PS),Math.round(8*PS),INK_SOFT);
}

function drawRankReadout(){
  const r=liveRank(score);
  if(!r)return;
  const y=TROPHY.cy+TROPHY.r+Math.round(11*PS);
  microLabel('#'+r.rank,TROPHY.cx,y,Math.round(10*PS),INK);
  if(r.need>0)
    microLabel('再 '+r.need+' 分到第 '+(r.rank-1)+' 名',TROPHY.cx,y+Math.round(11*PS),
               Math.round(8*PS),INK_SOFT);
  else
    microLabel('领先中',TROPHY.cx,y+Math.round(11*PS),Math.round(8*PS),TEAL);
}

function drawRestartBtn(){
  const s=RESTART.r;
  sticker(RESTART.cx-s,RESTART.cy-s,s*2,s*2,10,CARD,-2,3,4);
  ctx.save();
  ctx.translate(RESTART.cx,RESTART.cy);
  ctx.rotate(-2*Math.PI/180);
  // The three glyphs share one visual box, about 1.2 sticker radii: the loop
  // is drawn at 0.66 of its scale plus a heavy stroke, the trophy is wide and
  // the notebook narrow, so each gets its own factor.
  drawRestartIcon(s*0.78);
  ctx.restore();
}

function drawBoardBtn(){
  const s=TROPHY.r;
  sticker(TROPHY.cx-s,TROPHY.cy-s,s*2,s*2,10,CARD,2,3,4);
  ctx.save();
  ctx.translate(TROPHY.cx,TROPHY.cy);
  ctx.rotate(2*Math.PI/180);
  drawTrophyIcon(s*0.88);
  ctx.restore();
}

// The board is a menu: the simulation freezes behind it, exactly as it does for
// pause, so nothing lands or merges while the player is reading.
let boardOpen=false;
let boardPage=0;   // board: 0 this post, 1 this week. book: 0 diary, 1 eyes
let boardKind='board';   // which one is up: the trophy's boards or the notebook
let boardTabBoxes=[], eyeTiles=[];
function boardTabAt(p){
  for(let i=0;i<boardTabBoxes.length;i++)if(inRect(p,boardTabBoxes[i],6))return i;
  return -1;
}
function eyeTileAt(p){
  if(boardKind!=='book'||boardPage!==1)return -1;
  for(let i=0;i<eyeTiles.length;i++)if(inRect(p,eyeTiles[i],2))return i;
  return -1;
}
function pickEyes(i){
  const set=EYES[i];
  if(!set||!eyeOwned(set.id))return;
  const id=set.id==='regular'?'':set.id;
  if(HUB)HUB.select(id); else eyesLocal=id;
  beep(640,0.08,0.06,'triangle');
  track('ui','eyes-'+set.id,'complete');
}
function openBoard(){
  if(boardOpen||gameOver||paused)return;
  boardOpen=true; boardKind='board'; boardPage=0;
  track('ui','board','start');
  // Re-read rather than trusting the copy from boot: other people have been
  // playing this post since, and a long session leaves that stale.
  if(HUB)try{HUB.refreshBoard();}catch(e){}
}
function closeBoard(){ if(boardOpen){boardOpen=false;track('ui',boardKind,'complete');} }
// The notebook: the player's own pages. Same modal, different tabs.
function openBook(){
  if(boardOpen||gameOver||paused)return;
  boardOpen=true; boardKind='book'; boardPage=0;
  track('ui','book','start');
  if(HUB)try{HUB.refreshBoard();}catch(e){}   // the diary reads the calendar
}

// Snoovatars are the one remote asset in a game that otherwise makes no external
// request at all. crossOrigin keeps the canvas untainted, and anything that
// fails — no avatar, blocked host, offline — falls back to a coloured initial,
// so the board never waits on the network to be readable.
const avatarCache=Object.create(null);
function avatarFor(url){
  if(!url)return null;
  const hit=avatarCache[url];
  if(hit!==undefined)return hit;
  avatarCache[url]=null;
  try{
    const img=new Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{avatarCache[url]=img;};
    img.onerror=()=>{avatarCache[url]=null;};
    img.src=url;
  }catch(e){}
  return null;
}

function drawAvatar(cx,cy,r,row){
  const img=avatarFor(row.snoovatar);
  ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.closePath();
  ctx.fillStyle=img?CARD:TIERS[(row.name.charCodeAt(0)+row.name.length)%TIERS.length].col;
  ctx.fill();
  ctx.save();ctx.clip();
  if(img){
    // Snoovatars are tall; cover the circle rather than squash the character.
    const sc=Math.max(r*2/img.width,r*2/img.height);
    ctx.drawImage(img,cx-img.width*sc/2,cy-img.height*sc/2+r*0.12,
                  img.width*sc,img.height*sc);
  }else{
    ctx.fillStyle=PAPER;
    ctx.textAlign='center';
    ctx.font=`800 ${Math.round(r*1.1)}px ${UIFONT}`;
    ctx.fillText((row.name[0]||'?').toUpperCase(),cx,cy+r*0.38);
  }
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*0.16);ctx.stroke();
  ctx.restore();
}

function drawBoardRow(x,y,w,h,row,mine){
  if(mine){
    ctx.beginPath();ctx.roundRect(x,y,w,h,8);
    ctx.fillStyle='rgba(53,196,187,0.22)';ctx.fill();
    ctx.strokeStyle=TEAL;ctx.lineWidth=2;ctx.stroke();
  }
  const cy=y+h/2, fs=Math.round(h*0.42);
  ctx.fillStyle=INK;
  ctx.textAlign='right';
  ctx.font=`800 ${fs}px ${UIFONT}`;
  ctx.fillText(row.rank,x+h*0.78,cy+fs*0.36);

  drawAvatar(x+h*1.35,cy,h*0.38,row);

  ctx.textAlign='left';
  ctx.font=`700 ${fs}px ${UIFONT}`;
  let name=row.name;
  const maxW=w-h*1.85-h*5.4;
  while(name.length>3&&ctx.measureText(name).width>maxW)name=name.slice(0,-1);
  if(name!==row.name)name=name.slice(0,-1)+'\u2026';
  ctx.fillText(name,x+h*1.85,cy+fs*0.36);

  // Right to left, each column measured off the one outside it, so nothing
  // collides when a five figure score meets a three digit try count.
  ctx.textAlign='right';
  const gap=h*0.28;
  let rx=x+w-h*0.3;

  const tries=row.tries||1;
  const triesTxt=tries+' 次';
  ctx.fillStyle=INK_SOFT;
  ctx.font=`800 ${Math.round(h*0.30)}px ${UIFONT}`;
  ctx.fillText(triesTxt,rx,cy+fs*0.36);
  rx-=ctx.measureText(triesTxt).width+gap;

  ctx.fillStyle=INK;
  ctx.font=`800 ${fs}px ${UIFONT}`;
  ctx.fillText(row.score,rx,cy+fs*0.36);
  rx-=ctx.measureText(String(row.score)).width+gap;

  ctx.fillStyle=INK_SOFT;
  ctx.font=`800 ${Math.round(h*0.30)}px ${UIFONT}`;
  ctx.fillText('x'+(row.combo||0),rx,cy+fs*0.36);
  rx-=ctx.measureText('x'+(row.combo||0)).width;
}

let boardTitleBox={x:0,y:0,w:0,h:0};
function boardTitleRect(){return boardTitleBox;}
function drawPageTabs(x,y,cw){
  // The tabs in the title band; the active one is an ink pill.
  const labels=boardKind==='book'?['日记','眼睛']:['本帖子','本周'];
  const size=Math.round(9*PS);
  ctx.font=`800 ${size}px ${UIFONT}`;
  const gap=Math.round(14*PS);
  const ws=labels.map(l=>ctx.measureText(l).width+size*1.8);
  let tx=x+cw/2-(ws.reduce((a,b)=>a+b,0)+gap*(labels.length-1))/2;
  boardTabBoxes=[];
  for(let i=0;i<labels.length;i++){
    const cx=tx+ws[i]/2;
    if(i===boardPage)inkPill(cx,y,labels[i],size,i-1);
    else microLabel(labels[i],cx,y+size*0.38,size,INK_SOFT);
    boardTabBoxes.push({x:tx,y:y-Math.round(16*PS),w:ws[i],h:Math.round(32*PS)});
    tx+=ws[i]+gap;
  }
  boardTitleBox={x:x,y:y-Math.round(16*PS),w:cw,h:Math.round(32*PS)};
}
// The diary: today's twist and goals, and the streak calendar.
function drawDiaryPage(){
  const cal=(HUB&&HUB.calendar)||[];
  const head=Math.round(56*PS), pad=Math.round(14*PS);
  const tile=Math.round(22*PS), tgap=Math.round(4*PS);
  const twistH=(HUB&&MUT!=='none')?Math.round(20*PS):0;
  const goalsH=(HUB&&HUB.goals.length)?3*Math.round(20*PS)+Math.round(26*PS):0;
  const calH=cal.length?Math.round(30*PS)+4*(tile+tgap):0;
  const emptyH=(!goalsH&&!calH)?Math.round(30*PS):0;
  const cw=Math.min(W-32,Math.round(400*PS));
  const ch=head+twistH+goalsH+calH+emptyH+pad;
  const x=Math.round(W/2-cw/2), y=Math.round(H/2-ch/2);
  ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
  sticker(x,y,cw,ch,16,CARD,-0.6,4,5);
  drawPageTabs(x,y+Math.round(28*PS),cw);
  let cy=y+head;
  if(twistH){
    microLabel('今日玩法：'+HUB.mutatorLabel.toUpperCase(),W/2,cy,Math.round(9*PS),INK);
    cy+=twistH;
  }
  if(goalsH){
    drawGoalList(W/2,cy+Math.round(6*PS),true);
    cy+=goalsH;
  }
  if(emptyH){
    ctx.textAlign='center';ctx.fillStyle=INK_SOFT;ctx.font=`700 ${Math.round(12*PS)}px ${UIFONT}`;
    ctx.fillText('还没有记录。玩一局就能开启日记。',W/2,cy+Math.round(16*PS));
  }
  // the calendar: four weeks of tiles, gold for a day with all three goals
  if(cal.length){
    const streak=(HUB&&HUB.streak)||0;
    microLabel((streak?streak+' 天连续':'还没有连续')+'  \u00b7  金色 = 三项全达成',
               W/2,cy,Math.round(9*PS),INK_SOFT);
    cy+=Math.round(10*PS);
    const gw=7*tile+6*tgap, gx=W/2-gw/2;
    for(let i=0;i<cal.length;i++){
      const d=cal[i], col=i%7, rowi=Math.floor(i/7);
      const tx=gx+col*(tile+tgap), ty=cy+rowi*(tile+tgap);
      ctx.beginPath();ctx.roundRect(tx,ty,tile,tile,Math.round(5*PS));
      ctx.fillStyle=d.bits===7?'#edc84b':d.bits?TEAL:PAPER;ctx.fill();
      ctx.strokeStyle=i===cal.length-1?INK:INK_SOFT_SHADOW;ctx.lineWidth=i===cal.length-1?2.5:1.5;ctx.stroke();
      // the twist, as one letter, so a gold tile says what it was gold at
      if(d.mut&&d.mut!=='none'){
        ctx.fillStyle=d.bits?CARD:INK_SOFT;ctx.textAlign='center';
        ctx.font=`800 ${Math.round(tile*0.5)}px ${UIFONT}`;
        ctx.fillText(d.mut[0].toUpperCase(),tx+tile/2,ty+tile*0.68);
      }
    }
  }
  microLabel('点击任意处关闭',W/2,y+ch+Math.round(20*PS),Math.round(9*PS),INK_SOFT);
}
function drawWeekPage(){
  const rows=(HUB&&HUB.weekly)||[], me=HUB&&HUB.weeklyMe;
  const inTop=!!me&&rows.some(r=>r.name===me.name);
  const rh=Math.round(24*PS), head=Math.round(56*PS), pad=Math.round(14*PS);
  const listH=Math.max(rh,rows.length*rh)+((me&&!inTop)?rh+Math.round(12*PS):0);
  const cw=Math.min(W-32,Math.round(400*PS));
  const ch=head+listH+Math.round(30*PS)+pad*2;
  const x=Math.round(W/2-cw/2), y=Math.round(H/2-ch/2);
  ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
  sticker(x,y,cw,ch,16,CARD,-0.6,4,5);
  drawPageTabs(x,y+Math.round(28*PS),cw);
  let cy=y+head;
  // the week: the sum of each day's best
  microLabel('本周，每天成绩相加',W/2,cy,Math.round(9*PS),INK_SOFT);
  cy+=Math.round(10*PS);
  const rx=x+pad, rw=cw-pad*2;
  const row=(r,mine)=>{
    if(mine){ctx.beginPath();ctx.roundRect(rx,cy,rw,rh,8);ctx.fillStyle='rgba(53,196,187,0.22)';ctx.fill();}
    const fs=Math.round(rh*0.5);
    ctx.fillStyle=INK;ctx.font=`800 ${fs}px ${UIFONT}`;
    ctx.textAlign='right';ctx.fillText(r.rank,rx+rh*0.9,cy+fs*1.05);
    ctx.textAlign='left';ctx.font=`700 ${fs}px ${UIFONT}`;
    ctx.fillText(shortName(r.name,18),rx+rh*1.3,cy+fs*1.05);
    ctx.textAlign='right';ctx.font=`800 ${fs}px ${UIFONT}`;
    ctx.fillText(r.score.toLocaleString(),rx+rw-rh*0.3,cy+fs*1.05);
    cy+=rh;
  };
  if(!rows.length){
    ctx.textAlign='center';ctx.fillStyle=INK_SOFT;ctx.font=`700 ${Math.round(12*PS)}px ${UIFONT}`;
    ctx.fillText('本周还没有成绩。',W/2,cy+rh*0.7);cy+=rh;
  }
  for(const r of rows)row(r,!!me&&r.name===me.name);
  if(me&&!inTop){cy+=Math.round(12*PS);row(me,true);}
  microLabel('点击任意处关闭',W/2,y+ch+Math.round(20*PS),Math.round(9*PS),INK_SOFT);
}
// The picker. Every set as a pair of eyes, large, on a tile of the held
// colour; locked ones faded with a question mark, the worn one ringed.
// Fifteen tiles, five to a row. Just the eyes: a whole blob at tile size
// made every set look the same.
const EYE_STILL={blink:9,blinkT:0,mood:0};
function drawEyesPage(){
  const cols=5, rows=Math.ceil(EYES.length/cols);
  const tile=Math.round(64*PS), tgap=Math.round(6*PS);
  const head=Math.round(56*PS), pad=Math.round(14*PS);
  const cw=Math.min(W-32,Math.round(400*PS));
  const ch=head+Math.round(18*PS)+rows*(tile+tgap)+Math.round(26*PS)+pad;
  const x=Math.round(W/2-cw/2), y=Math.round(H/2-ch/2);
  ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
  sticker(x,y,cw,ch,16,CARD,-0.6,4,5);
  drawPageTabs(x,y+Math.round(28*PS),cw);
  microLabel('一天内达成三项目标即可解锁一套',W/2,y+head,Math.round(9*PS),INK_SOFT);
  const worn=eyesWorn();
  const gw=cols*tile+(cols-1)*tgap, gx=W/2-gw/2, gy=y+head+Math.round(12*PS);
  const col=TIERS[currentTier].col;
  let owned=0;
  eyeTiles=[];
  for(let i=0;i<EYES.length;i++){
    const set=EYES[i], have=eyeOwned(set.id);
    if(have)owned++;
    const tx=gx+(i%cols)*(tile+tgap), ty=gy+Math.floor(i/cols)*(tile+tgap);
    eyeTiles.push({x:tx,y:ty,w:tile,h:tile});
    ctx.save();
    ctx.beginPath();ctx.roundRect(tx,ty,tile,tile,Math.round(8*PS));
    ctx.fillStyle=col;ctx.globalAlpha=have?1:0.3;ctx.fill();
    ctx.globalAlpha=1;
    ctx.strokeStyle=set===worn?TEAL:INK;ctx.lineWidth=set===worn?3.5:2;ctx.stroke();
    // the eyes fill the frame: pulled together, sized so the pair spans most
    // of the tile's width
    ctx.translate(tx+tile/2,ty+tile*0.44);
    if(!have)ctx.globalAlpha=0.3;
    ctx.beginPath();ctx.roundRect(-tile/2,-tile*0.44,tile,tile,Math.round(8*PS));ctx.clip();
    drawEyes(tile*1.3,EYE_STILL,Math.PI/2,set,0.22);
    ctx.restore();
    if(!have){
      ctx.fillStyle=INK;ctx.textAlign='center';
      ctx.font=`${Math.round(tile*0.4)}px ${DISPLAY}`;
      ctx.fillText('?',tx+tile/2,ty+tile*0.58);
    }
    microLabel(set.name,tx+tile/2,ty+tile-Math.round(6*PS),Math.round(7*PS),have?INK:INK_SOFT);
  }
  microLabel(owned+' / '+EYES.length+'  \u00b7  点一套即可佩戴  \u00b7  点外面关闭',
             W/2,y+ch-Math.round(10*PS),Math.round(8*PS),INK_SOFT);
}
function drawBoard(){
  if(boardKind==='book'){
    if(boardPage===1)drawEyesPage(); else drawDiaryPage();
    return;
  }
  if(boardPage===1){drawWeekPage();return;}
  const rows=(HUB&&HUB.leaderboard)||[];
  const me=HUB&&HUB.me;
  const inTop=!!me&&rows.some(r=>r.name===me.name);
  const rh=Math.round(30*PS), head=Math.round(52*PS), pad=Math.round(14*PS);
  const selfH=(me&&!inTop)?rh+Math.round(16*PS):0;
  const bodyH=Math.max(rh,rows.length*rh);
  const cw=Math.min(W-32,Math.round(400*PS)), ch=head+bodyH+selfH+pad*2;
  const x=Math.round(W/2-cw/2), y=Math.round(H/2-ch/2);

  ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
  sticker(x,y,cw,ch,16,CARD,-0.6,4,5);

  drawPageTabs(x,y+Math.round(28*PS),cw);

  const rx=x+pad, rw=cw-pad*2;
  let ry=y+head;
  if(!rows.length){
    ctx.textAlign='center';ctx.fillStyle=INK_SOFT;
    ctx.font=`700 ${Math.round(12*PS)}px ${UIFONT}`;
    ctx.fillText('这个帖子还没有成绩。来做第一个吧。',W/2,ry+rh*0.62);
  }
  for(const row of rows){
    drawBoardRow(rx,ry,rw,rh,row,!!me&&row.name===me.name);
    ry+=rh;
  }
  if(me&&!inTop){
    // A dotted rule, not a gap: it has to read as "and further down", or the
    // player's own row looks like an eleventh place.
    ctx.save();
    ctx.setLineDash([4,5]);ctx.strokeStyle=INK_SOFT;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(rx,ry+8*PS);ctx.lineTo(rx+rw,ry+8*PS);ctx.stroke();
    ctx.restore();
    drawBoardRow(rx,ry+Math.round(16*PS),rw,rh,me,true);
  }
  microLabel('点击任意处关闭',W/2,y+ch+Math.round(20*PS),
             Math.round(9*PS),INK_SOFT);
}

function shortName(n,max){
  if(!n)return 'Blob Drop';
  return n.length>max?n.slice(0,max-1)+'..':n;
}
// ---------- the jar's blobs: soft bodies in a box of their own ----------
// Fewer substeps and passes than the pit: nothing here scores, and three
// blobs in a box do not need the pit's headroom. Every per-substep constant
// is rescaled the way setSubsteps() does it, so the feel is the pit's.
const JAR_SUBSTEPS=4, JAR_ITERS=2;
const JAR_SDT=DT/JAR_SUBSTEPS, JAR_G=GRAVITY*JAR_SDT*JAR_SDT;
const JAR_DAMP=Math.pow(DAMPING,SUBSTEPS/JAR_SUBSTEPS), JAR_STEP=SUBSTEPS/JAR_SUBSTEPS;
let jarSim=null, jarOpenSims=null, jarYoursSim=null, jarAcc=0;
function jarKey(){ return jar.map(s=>s.tier).join(','); }
// A box `w` by `h` with the given blobs dropped in from staggered heights, so
// they land and settle rather than starting inside one another.
function makeJarSim(tiers,w,h){
  const sim={key:jarKey(),blobs:[],w,h,hopT:0.3+Math.random()*0.5};
  const xs=tiers.length===1?[0.5]:[0.5,0.22,0.78];
  for(let i=0;i<tiers.length;i++){
    const R=TIERS[tiers[i]].r;
    const b=buildBlob(Math.min(w-R,Math.max(R,w*xs[i])),Math.max(R,h-R-i*(R*2.2)),tiers[i]);
    b.grace=1e9;   // never a merge candidate, whatever it ends up touching
    sim.blobs.push(b);
  }
  return sim;
}
// The closed jar's box scales with what is in it, so three small blobs read
// as large as three big ones and the sizes still tell against each other.
function ensureJarSim(){
  if(jarSim&&jarSim.key===jarKey())return jarSim;
  const tiers=jar.map(s=>s.tier);
  let dia=0,rmax=0;
  for(const t of tiers){dia+=TIERS[t].r*2;rmax=Math.max(rmax,TIERS[t].r);}
  const w=Math.max(dia*0.62,rmax*2+12);
  jarSim=makeJarSim(tiers,w,w*1.15);
  return jarSim;
}
function ensureJarOpenSims(){
  if(jarOpenSims&&jarOpenSims.length===jar.length&&jarOpenSims[0].key===jarKey())return jarOpenSims;
  jarOpenSims=jar.map(s=>{const R=TIERS[s.tier].r;return makeJarSim([s.tier],R*3,R*3.2);});
  return jarOpenSims;
}
// The blob in hand, on its own floor above the three.
function ensureJarYoursSim(){
  if(jarYoursSim&&jarYoursSim.tier===currentTier)return jarYoursSim;
  const R=TIERS[currentTier].r;
  jarYoursSim=makeJarSim([currentTier],R*3,R*3.2);
  jarYoursSim.tier=currentTier;
  return jarYoursSim;
}
function jarSimWalls(sim,b){
  for(const p of b.pts){
    const r=p.r;
    let hit=false;
    if(p.x<r)      { p.x=r;       hit=true; }
    if(p.x>sim.w-r){ p.x=sim.w-r; hit=true; }
    if(p.y>sim.h-r){ p.y=sim.h-r; hit=true; }
    if(p.y<r)      { p.y=r;       hit=true; }
    if(hit){
      p.px+=(p.x-p.px)*FLOOR_FRIC;
      p.py+=(p.y-p.py)*FLOOR_FRIC;
    }
  }
}
// Point-pair separation for three blobs at most: the pit's flattened grid
// would be more code than the work it saves here.
function jarSimSeparate(sim){
  const bs=sim.blobs;
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
    const A=bs[i],B=bs[j],ca=centroid(A),cb=centroid(B);
    const reach=A.R+B.R+A.ptR+B.ptR;
    if((ca.x-cb.x)*(ca.x-cb.x)+(ca.y-cb.y)*(ca.y-cb.y)>reach*reach)continue;
    for(const p of A.pts)for(const q of B.pts){
      const dx=q.x-p.x,dy=q.y-p.y,rr=p.r+q.r,d2=dx*dx+dy*dy;
      if(d2>=rr*rr||d2<1e-6)continue;
      const d=Math.sqrt(d2),k=(rr-d)/d*0.5;
      p.x-=dx*k;p.y-=dy*k;q.x+=dx*k;q.y+=dy*k;
    }
  }
}
function jarSimPenetration(sim){
  const bs=sim.blobs;
  for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
    const A=bs[i],B=bs[j];
    for(const p of A.pts)if(pointInBlob(p.x,p.y,B))projectOut(p,B);
    for(const p of B.pts)if(pointInBlob(p.x,p.y,A))projectOut(p,A);
  }
}
function jarSimStep(sim){
  const bs=sim.blobs;
  for(let sub=0;sub<JAR_SUBSTEPS;sub++){
    for(const b of bs){
      const maxStep=Math.max(b.ptR*MAX_STEP_FRAC,MAX_STEP_MIN)*JAR_STEP;
      const maxStep2=maxStep*maxStep;
      for(const p of b.pts){
        let vx=(p.x-p.px)*JAR_DAMP, vy=(p.y-p.py)*JAR_DAMP;
        const m2=vx*vx+vy*vy;
        if(m2>maxStep2){const s=maxStep/Math.sqrt(m2);vx*=s;vy*=s;}
        p.px=p.x; p.py=p.y;
        p.x+=vx; p.y+=vy+JAR_G;
      }
    }
    for(let it=0;it<JAR_ITERS;it++){
      for(const b of bs)solveDistances(b);
      jarSimSeparate(sim);
      for(const b of bs)jarSimWalls(sim,b);
    }
    for(const b of bs)solvePressure(b);
    for(const b of bs)jarSimWalls(sim,b);
    jarSimPenetration(sim);
  }
}
// A hop every second or so, with the same squeezed face a pit blob pulls on
// impact; the odd face with no hop, so a blob at rest still looks alive.
function jarSimTick(sim,dt){
  for(const b of sim.blobs)tickFace(b.face,dt);
  sim.hopT-=dt;
  if(sim.hopT>0)return;
  sim.hopT=0.5+Math.random()*1.3;
  const b=sim.blobs[Math.floor(Math.random()*sim.blobs.length)];
  b.face.mood=0.55+Math.random()*0.45;
  if(Math.random()<0.25)return;
  const vx=(Math.random()-0.5)*280, vy=-(180+Math.random()*280);
  for(const p of b.pts){p.px=p.x-vx*JAR_SDT;p.py=p.y-vy*JAR_SDT;}
}
// Runs on wall time, not the simulation clock: the broken jar freezes the pit
// and is exactly when its blobs have to move.
function tickJarSims(dt){
  const live=[];
  if(jarOpen)live.push(ensureJarYoursSim(),...ensureJarOpenSims());
  else if(!jarUsed&&jar.length&&!gameOver&&!paused)live.push(ensureJarSim());
  if(!live.length){jarAcc=0;return;}
  jarAcc=Math.min(jarAcc+dt,DT*3);
  while(jarAcc>=DT){for(const s of live)jarSimStep(s);jarAcc-=DT;}
  for(const s of live)jarSimTick(s,dt);
}
// Draw a sim so that its floor's midpoint lands on (cx,floorY) at scale k.
function drawJarSim(sim,cx,floorY,k){
  ctx.save();
  ctx.translate(cx-k*sim.w/2,floorY-k*sim.h);
  ctx.scale(k,k);
  for(let i=0;i<sim.blobs.length;i++)
    drawBlob(sim.blobs[i],-Math.PI/2+Math.sin(wallTime*1.3+i*2.1)*0.7);
  ctx.restore();
}

// Two arrows passing each other, paper on the badge's teal.
function drawSwapIcon(s){
  ctx.strokeStyle=CARD;ctx.fillStyle=CARD;
  ctx.lineWidth=Math.max(1.5,s*0.22);ctx.lineCap='round';ctx.lineJoin='round';
  for(const d of [-1,1]){
    const y=d*s*0.42;
    ctx.beginPath();ctx.moveTo(d*s*0.9,y);ctx.lineTo(-d*s*0.5,y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-d*s*0.95,y);ctx.lineTo(-d*s*0.45,y-s*0.36);ctx.lineTo(-d*s*0.45,y+s*0.36);ctx.closePath();ctx.fill();
  }
}
// The closed jar: a glass sticker with the three squashed inside, and the
// owners' names under it, so it reads as other people's blobs before it is
// ever tapped.
function drawJar(){
  if(jarUsed||!jar.length)return;
  const j=jarRect(), r=j.r;
  ctx.save();
  ctx.translate(j.cx,j.cy);
  ctx.rotate(-2*Math.PI/180);
  const w=r*2, h=r*2.7, y0=-h/2+r*0.42;
  // cork: wood-coloured, a touch wider than the neck, with two grain lines
  const cw=w*0.62, ch=r*0.5, cy0=y0-ch*0.72;
  ctx.beginPath();ctx.roundRect(-cw/2,cy0,cw,ch,r*0.1);
  ctx.fillStyle='#d8a862';ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*0.1);ctx.stroke();
  ctx.strokeStyle='rgba(47,32,19,0.35)';ctx.lineWidth=1.5;
  for(const gy of [0.4,0.65]){ctx.beginPath();ctx.moveTo(-cw*0.3,cy0+ch*gy);ctx.lineTo(cw*0.3,cy0+ch*gy);ctx.stroke();}
  // neck, then the body: a shoulder curve down to the full width
  const glass=()=>{
    ctx.beginPath();
    ctx.moveTo(-w*0.3,y0);ctx.lineTo(w*0.3,y0);
    ctx.lineTo(w*0.3,y0+r*0.22);
    ctx.quadraticCurveTo(w/2,y0+r*0.3,w/2,y0+r*0.8);
    ctx.lineTo(w/2,y0+h-r*0.42-r*0.42);
    ctx.quadraticCurveTo(w/2,y0+h-r*0.42,w/2-r*0.42,y0+h-r*0.42);
    ctx.lineTo(-w/2+r*0.42,y0+h-r*0.42);
    ctx.quadraticCurveTo(-w/2,y0+h-r*0.42,-w/2,y0+h-r*0.42-r*0.42);
    ctx.lineTo(-w/2,y0+r*0.8);
    ctx.quadraticCurveTo(-w/2,y0+r*0.3,-w*0.3,y0+r*0.22);
    ctx.closePath();
  };
  inkShadow(glass,0,3,INK_SOFT_SHADOW);
  glass();ctx.fillStyle='rgba(255,246,226,0.85)';ctx.fill();
  // the three, alive: their box scaled into the body and clipped to the
  // glass, so a hop into the neck stays behind it
  const sim=ensureJarSim();
  const bb=y0+h-r*0.42;   // body bottom
  ctx.save();glass();ctx.clip();
  drawJarSim(sim,0,bb-r*0.08,(r*1.8)/sim.w);
  ctx.restore();
  glass();ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2.5,r*0.12);ctx.stroke();
  // the swap badge, overlapping the jar's corner and breathing a little: the
  // jar is a control, and nothing else about a jar says so
  const bs=r*0.44, pulse=1+0.06*Math.sin(wallTime*3);
  ctx.save();ctx.translate(r*0.9,r*0.95);ctx.scale(pulse,pulse);
  ctx.beginPath();ctx.arc(0,0,bs,0,Math.PI*2);ctx.fillStyle=TEAL;ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=Math.max(2,r*0.09);ctx.stroke();
  drawSwapIcon(bs*0.62);
  ctx.restore();
  ctx.restore();
  microLabel(MODE==='landscape'?'社区罐子':'罐子',
             j.cx,j.cy+r*1.45+Math.round(9*PS),Math.round(8*PS),INK_SOFT);
}
// Broken open: the three large, with names, take one or tap away.
function drawJarOpen(){
  ctx.fillStyle='rgba(246,234,208,0.88)';ctx.fillRect(0,0,W,H);
  const mid=(DANGER_Y+FLOOR_Y)/2, cx=(LEFT_X+RIGHT_X)/2;
  // Yours first, above the three: what goes into the jar if you take one.
  const yR=TIERS[currentTier].r, yr=Math.max(30,yR), yFloor=mid-72;
  drawJarSim(ensureJarYoursSim(),cx,yFloor,yr/yR);
  inkPill(cx,yFloor+Math.round(13*PS),'你的',Math.round(9*PS),-2);
  const yTop=yFloor-yr*2;
  ctx.textAlign='center';ctx.fillStyle=INK;
  ctx.font=`${Math.round(30*PS)}px ${DISPLAY}`;
  ctx.fillText('拿一个',cx,yTop-Math.round(40*PS));
  microLabel('你手上的球会放进罐子，留给下一位玩家',cx,yTop-Math.round(14*PS),
             Math.round(9*PS),INK_SOFT);
  const sims=ensureJarOpenSims();
  let low=0;
  for(let i=0;i<jar.length;i++){
    const s=jarSlotRect(i), R=TIERS[jar[i].tier].r;
    // at rest the blob is centred on its slot; hops go up from there
    drawJarSim(sims[i],s.cx,s.cy+s.r,s.r/R);
    inkPill(s.cx,s.cy+s.r+Math.round(20*PS),'等级 '+(jar[i].tier+1),Math.round(9*PS),i-1);
    ctx.fillStyle=INK;ctx.textAlign='center';
    ctx.font=`700 ${Math.round(12*PS)}px ${UIFONT}`;
    ctx.fillText(shortName(jar[i].name,14),s.cx,s.cy+s.r+Math.round(44*PS));
    low=Math.max(low,s.cy+s.r);
  }
  microLabel('点其他地方就保留你自己的',cx,low+Math.round(66*PS),
             Math.round(9*PS),INK_SOFT);
}
function jarTellRect(){
  const w=Math.round(210*PS), h=Math.round(34*PS);
  return {x:(LEFT_X+RIGHT_X)/2-w/2,y:DANGER_Y+Math.round(14*PS),w,h};
}
// The one-tap offer, inside the field where it will be seen, gone in seconds.
function drawJarTell(){
  if(!jarTell)return;
  const t=jarTellRect(), a=Math.min(1,jarTell.t/0.6);
  ctx.save();ctx.globalAlpha=a;
  sticker(t.x,t.y,t.w,t.h,12,TEAL,-1,3,4);
  ctx.fillStyle=CARD;ctx.textAlign='center';
  ctx.font=`800 ${Math.round(11*PS)}px ${UIFONT}`;
  ctx.fillText('在评论里告诉 '+shortName(jarTell.owner,12).toUpperCase(),
               t.x+t.w/2,t.y+t.h*0.64);
  ctx.restore();
}
// What became of a blob you gave away. Shown once, at the start of a run.
function drawUnlock(){
  if(unlockT<=0)return;
  const a=Math.min(1,unlockT/0.6);
  ctx.save();ctx.globalAlpha=a;
  const w=Math.min(RIGHT_X-LEFT_X-20,Math.round(300*PS)), h=Math.round(58*PS);
  const x=(LEFT_X+RIGHT_X)/2-w/2, y=DANGER_Y+Math.round(118*PS);
  sticker(x,y,w,h,14,TEAL,-1,3,5);
  microLabel('金色日',x+w/2,y+Math.round(18*PS),Math.round(9*PS),CARD);
  ctx.fillStyle=CARD;ctx.textAlign='center';
  ctx.font=`800 ${Math.round(13*PS)}px ${UIFONT}`;
  ctx.fillText(unlockMsg,x+w/2,y+Math.round(36*PS));
  microLabel('打开笔记本来佩戴',x+w/2,y+Math.round(50*PS),Math.round(8*PS),CARD);
  ctx.restore();
}
function drawNote(){
  if(noteMsgT<=0)return;
  const a=Math.min(1,noteMsgT/0.6);
  ctx.save();ctx.globalAlpha=a;
  const w=Math.min(RIGHT_X-LEFT_X-20,Math.round(340*PS)), h=Math.round(48*PS);
  const x=(LEFT_X+RIGHT_X)/2-w/2, y=DANGER_Y+Math.round(60*PS);
  sticker(x,y,w,h,14,CARD,1,3,5);
  ctx.fillStyle=INK;ctx.textAlign='center';
  ctx.font=`700 ${Math.round(12*PS)}px ${UIFONT}`;
  ctx.fillText(noteMsg,x+w/2,y+h*0.62);
  ctx.restore();
}

// A spiral notebook, ink on the card sticker like the other two glyphs: the
// cover, three rings up the spine, and lines on the page.
function drawBookIcon(s){
  ctx.fillStyle=INK;
  ctx.beginPath();ctx.roundRect(-s*0.34,-s*0.46,s*0.72,s*0.92,s*0.1);ctx.fill();
  for(const y of [-0.27,0,0.27]){
    ctx.beginPath();ctx.roundRect(-s*0.48,y*s-s*0.065,s*0.28,s*0.13,s*0.065);ctx.fill();
  }
  ctx.fillStyle=CARD;
  for(const y of [-0.27,0,0.27]){
    ctx.beginPath();ctx.roundRect(-s*0.42,y*s-s*0.035,s*0.16,s*0.07,s*0.035);ctx.fill();
  }
  for(const y of [-0.18,0.0,0.18]){
    ctx.beginPath();ctx.roundRect(-s*0.06,y*s-s*0.035,s*0.32,s*0.07,s*0.035);ctx.fill();
  }
}
function drawBookBtn(){
  const s=PAUSE.r;
  sticker(PAUSE.cx-s,PAUSE.cy-s,s*2,s*2,10,CARD,-2,3,4);
  ctx.save();
  ctx.translate(PAUSE.cx,PAUSE.cy);
  ctx.rotate(-2*Math.PI/180);
  drawBookIcon(s*1.2);
  ctx.restore();
}

// ================================================================
// PRE-RENDERED LAYERS
// The Poki audience is GPU fill- and draw-call-bound, not CPU-bound: a
// Mali-G52 chokes on a thousand path operations per frame long before it
// runs out of arithmetic. Everything that does not change every frame is
// rendered once into an offscreen canvas and blitted, which is one draw call
// instead of hundreds. Each layer carries a key describing everything it
// depends on, so it rebuilds exactly when it must and never per frame.
// ================================================================
// A layer covers only the logical rect it needs. Blitting a full-canvas
// transparent layer would blend a million pixels a frame for the sake of a
// few hundred — on a fill-rate-bound GPU the area of a blit matters as much
// as the number of them.
// Reuses the previous layer's canvas whenever it can. Allocating a fresh
// canvas per rebuild meant a new multi-megabyte texture on every merge (the
// button charges are part of the UI layer's key), which is both GC churn and,
// on a low-memory phone, a real allocation-failure risk.
function makeLayer(rect,draw,prev){
  const w=Math.max(1,Math.ceil(rect.w*RENDER_S));
  const h=Math.max(1,Math.ceil(rect.h*RENDER_S));
  const c=(prev&&prev.canvas)||document.createElement('canvas');
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  const g=c.getContext('2d');
  if(!g)return prev||null;          // allocation failed: keep what we had
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0,0,w,h);
  const real=ctx;
  ctx=g;
  ctx.setTransform(RENDER_S,0,0,RENDER_S,-rect.x*RENDER_S,-rect.y*RENDER_S);
  try{draw();}finally{ctx=real;}
  return{canvas:c,x:rect.x,y:rect.y};
}
// Blit in device space, optionally offset (the frame shakes with the world).
function blitLayer(L,ox,oy){
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(L.canvas,Math.round((L.x+(ox||0))*RENDER_S),
                         Math.round((L.y+(oy||0))*RENDER_S));
  ctx.restore();
}

// Paper + grain, and the wood frame. Split in two because the frame shakes
// with the world and the paper does not, and because the frame only needs to
// cover the board.
let bgPaper=null,bgFrame=null,bgKey='';
function buildBackground(){
  const key=[W,H,RENDER_S,gLevel,LEFT_X,FLOOR_Y,DANGER_Y].join(':');
  if(bgKey===key)return;
  bgKey=key;
  bgPaper=makeLayer({x:0,y:0,w:W,h:H},()=>{
    ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
    if(gLevel<2){
      if(!dotPattern) buildDotPattern();
      ctx.fillStyle=dotPattern; ctx.fillRect(0,0,W,H);
    }
  },bgPaper);
  bgFrame=makeLayer({x:LEFT_X-PLANK-4,y:DANGER_Y-56,
                     w:(RIGHT_X-LEFT_X)+PLANK*2+8,h:(FLOOR_Y+PLANK)-(DANGER_Y-56)+6},
                    drawFrame,bgFrame);
}

// Per-tier pattern art, drawn once into a tile and then blitted inside each
// blob's clip. Replaces up to a dozen little arcs/rects per blob per frame.
const patTiles=new Map();
const MAX_TILE_PX=320;
function patternTile(tier){
  const t=TIERS[tier],R=t.r;
  const ext=R*1.7;                       // stripes reach ~1.6R
  // Capped in pixels, not just in scale: an uncapped tier-9 tile is 668px
  // square (1.8MB), and ten of those is memory a low-end phone does not have
  // to spare. These patterns are soft, so upscaling a smaller tile costs
  // nothing visually.
  const S=Math.min(RENDER_S,gLevel>0?1:1.5,MAX_TILE_PX/(ext*2));
  const key=tier+':'+Math.round(S*100);
  let tile=patTiles.get(key);
  if(tile)return tile;
  const px=Math.max(1,Math.ceil(ext*2*S));
  const c=document.createElement('canvas');
  c.width=px;c.height=px;
  const g=c.getContext('2d');
  if(!g)return{canvas:null,ext,R};       // allocation failed: draw nothing
  const real=ctx;
  ctx=g;
  ctx.setTransform(S,0,0,S,ext*S,ext*S);
  try{drawPattern(t,R);}finally{ctx=real;}
  tile={canvas:c,ext,R};
  patTiles.set(key,tile);
  return tile;
}
// Blit a tier's pattern at an arbitrary radius, centred on the current origin.
function blitPattern(tier,radius){
  const tile=patternTile(tier);
  if(!tile.canvas)return;
  const k=radius/tile.R, e=tile.ext*k;
  ctx.drawImage(tile.canvas,-e,-e,e*2,e*2);
}

// The bottom furniture: merge-order ticket, power-up buttons, charge bar.
// These change only when a charge, the current tier or a mode changes, which
// is a handful of times a run rather than sixty times a second.
let uiLayer=null,uiKey='';
function drawBottomUI(){ drawTierRow(); drawButtons(); }
function blitBottomUI(){
  const key=[W,H,RENDER_S,PS,gLevel,currentTier,popMode?1:0,rainbowNext()?1:0,
             POWERUPS.map(p=>p.charge).join(',')].join(':');
  if(uiKey!==key){
    uiKey=key;
    uiLayer=makeLayer(UI_RECT,drawBottomUI,uiLayer);
  }
  if(uiLayer) blitLayer(uiLayer);
}

function drawButtons(){
  // Pale tint pairs for the charging state: pale top, saturated fill bottom.
  const TINT={
    shake:  ['#ddf5f3','#7ad7d1'],
    pop:    ['#fbe3e9','#f5a9bb'],
    sweep:  ['#fae8cd','#f4c07e'],
    rainbow:['#ece2fa','#cbaef2'],
  };
  for(let i=0;i<POWERUPS.length;i++){
    const pu=POWERUPS[i];
    const slot=BTN_SLOTS[i];
    const ready=pu.charge>=pu.need;
    const active=(pu.id==='pop'&&popMode)||(pu.id==='rainbow'&&rainbowArmed);
    const tilt=(i%2?1:-1)*0.9;              // alternating hand-placed tilt
    const press=active?4:0;                 // pressed = translateY(4)
    const bw=slot.w, bh=slot.h;
    const fs=bh/60;                         // text tracks the slot size
    const tint=TINT[pu.id]||['#f0e6d2','#cbb08a'];

    ctx.save();
    ctx.translate(slot.x+bw/2,slot.y+bh/2+press);
    ctx.rotate(tilt*Math.PI/180);
    ctx.translate(-bw/2,-bh/2);

    // 0 5px 0 ink shadow, collapsing to 0 1px 0 when pressed
    const path=rr(0,0,bw,bh,16);
    inkShadow(path,0,active?1:5,INK);

    path();
    if(ready){
      ctx.fillStyle=TEAL;
    }else{
      // charge fills from the bottom, proportional
      ctx.fillStyle=tint[0];
    }
    ctx.fill();
    if(!ready){
      ctx.save();path();ctx.clip();
      const f=pu.charge/pu.need;
      ctx.fillStyle=tint[1];
      ctx.fillRect(0,bh*(1-f),bw,bh*f);
      ctx.restore();
    }
    path();ctx.strokeStyle=INK;ctx.lineWidth=3.5;ctx.stroke();

    ctx.textAlign='center';
    // icon in the top half, label beneath it (CANCEL state stays text-only)
    if(!active){
      ctx.save();ctx.translate(bw/2,bh*0.30);drawPowerupIcon(pu.id,bh*0.22);ctx.restore();
    }
    ctx.fillStyle=INK;
    ctx.font=`800 ${Math.round(15*fs)}px ${UIFONT}`;
    ctx.fillText(active?'取消':pu.label.toUpperCase(),bw/2,active?bh/2+5*fs:bh*0.70);

    if(ready&&!active){
      // READY! ink micro-pill
      ctx.save();ctx.translate(bw/2,bh-8*fs);
      ctx.font=`800 ${Math.round(8*fs)}px ${UIFONT}`;
      const w=ctx.measureText('就绪！').width+12*fs;
      ctx.beginPath();ctx.roundRect(-w/2,-6*fs,w,12*fs,999);
      ctx.fillStyle=INK;ctx.fill();
      ctx.fillStyle=PAPER;ctx.fillText('就绪！',0,3*fs);
      ctx.restore();
    }else if(!ready){
      ctx.globalAlpha=0.75;
      ctx.font=`700 ${Math.round(11*fs)}px ${UIFONT}`;
      ctx.fillStyle=INK;
      ctx.fillText(pu.charge+'/'+pu.need,bw/2,bh-6*fs);
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
}

// ================================================================
// MAIN LOOP
// ================================================================
let last=performance.now(), fpsSmooth=60, wallTime=0;
// Adaptive quality controller. Watches smoothed fps and steps the substep
// count down through 8 / 6 / 4 when the device can't hold the frame, then back
// up when it recovers. The cooldown stops it oscillating between levels on a
// device sitting right on the boundary, and the hysteresis gap (drops below 52,
// recovers above 58) means a single slow frame never changes anything.
// Substeps AND distance iterations both come down, because substeps alone
// bottom out at 4 and a Mali-G71-class phone needs more headroom than that.
// Iterations are cut last: they are what stops blobs interpenetrating.
const QUALITY=[[8,4],[6,4],[6,3],[4,3],[4,2]];
let qLevel=0, qCooldown=0, workMs=0;
// Quality is driven by measured WORK, not by fps. fps is the wrong signal:
// a display running at 30Hz (low power mode, or a variable-refresh panel
// idling) reports 30fps while the game is using 4ms of a 33ms budget. The old
// version read that as "too slow" and degraded physics on a device that was
// completely idle. Load is work divided by the actual frame interval, so a
// capped refresh rate is correctly seen as more headroom, not less.
function updateQuality(dt){
  qCooldown-=dt;
  if(qCooldown>0)return;
  const budget=Math.max(dt*1000,8);
  const load=workMs/budget;
  // Degrade on a high CPU share OR on a frame rate that is simply too low to
  // live with while we are doing real work. The `workMs>8` guard keeps the
  // original protection intact: a 30Hz-capped display (iOS low power) reports
  // 30fps while using 4ms of a 33ms budget, and must never be read as slow.
  const struggling=(fpsSmooth<40&&workMs>8);
  if((load>0.70||struggling)&&qLevel<QUALITY.length-1){
    qLevel++; setQuality(qLevel); qCooldown=1.5;
    track('perf','quality-'+qLevel,'start');
  }else if(load<0.40&&fpsSmooth>55&&qLevel>0){
    qLevel--; setQuality(qLevel); qCooldown=4.0;
  }
}

// --- GPU ladder --------------------------------------------------------
// The controller above only sees CPU work; a GPU-bound device (the actual
// bottleneck for most of the Poki audience: fill rate and draw calls, not
// cores) shows low workMs while frames still miss. gLevel strips fill work
// first (blob shading lip, then patterns and grain), and after that the
// canvas resolution steps down, one-way, via dpr. The trigger threshold is
// 24fps, NOT ~40: displays capped at 30Hz (iOS low power mode) report ~30fps
// while completely idle and must never trigger degradation.
let gLevel=0, gCooldown=0, lowFpsFor=0;
function updateGpuLadder(dt){
  gCooldown-=dt;
  if(fpsSmooth<24&&time>3) lowFpsFor+=dt; else lowFpsFor=0;
  if(gCooldown>0||lowFpsFor<4)return;
  lowFpsFor=0;
  if(gLevel<2){
    gLevel++; gCooldown=5;
    track('perf','draw-'+gLevel,'start');
  }else if(dpr>1){
    dpr=dpr>1.5?1.5:1;
    dotPattern=null; fieldPattern=null;   // rebuilt at the new density
    fit(true);
    gCooldown=8;
    track('perf','dpr-'+dpr,'start');
  }
}

// physicsStep advances a FIXED DT of 1/60. Calling it once per frame silently
// ties game speed to display refresh rate: at 30Hz everything ran at half
// speed, which is why it felt like syrup rather than merely looking choppy.
// The accumulator decouples them — at 30Hz it runs two steps per frame — with a
// cap so a genuinely slow device drops time instead of entering a death spiral
// where each frame has more catching up to do than the last.
let acc=0;
const MAX_CATCHUP=3;

// The loop must survive anything. `requestAnimationFrame` used to be the last
// statement of the frame body, so a single thrown exception anywhere — a
// failed canvas allocation on a memory-pressured phone, say — stopped the
// game dead with the last painted frame left on screen forever. That is
// exactly what a playtester saw mid-cascade. The reschedule now happens no
// matter what, and a frame that fails is simply skipped.
let frameErrors=0;
function frame(now){
  try{
    frameBody(now);
  }catch(err){
    frameErrors++;
    if(frameErrors===1){
      track('error','frame','fail');
      try{console.error('frame error',err);}catch(e){}
    }
    // A frame that died halfway through may have left a clip or transform on
    // the context; reset so the next frame starts from a known state.
    try{
      ctx=canvas.getContext('2d');
      ctx.setTransform(1,0,0,1,0,0);
    }catch(e){}
  }
  requestAnimationFrame(frame);
}

function frameBody(now){
  const t0=performance.now();
  beepsThisFrame=0;
  const dt=Math.min((now-last)/1000,0.05);
  last=now;
  // wallTime always advances (menu animations); `time` is the SIMULATION
  // clock and must not, or a pause would age merge grace periods and blob
  // birthdays while nothing moved.
  wallTime+=dt;
  if(jarTell){jarTell.t-=dt;if(jarTell.t<=0)jarTell=null;}
  if(noteMsgT>0)noteMsgT=Math.max(0,noteMsgT-dt);
  if(HUB&&HUB.newUnlock){
    const set=EYES_BY_ID[HUB.newUnlock];
    HUB.newUnlock=null;
    if(set){
      unlockMsg='已解锁「'+set.name+'」眼睛';unlockT=8;
      beep(880,0.12,0.08,'triangle');
      track('ui','unlock','complete');
    }
  }
  if(unlockT>0)unlockT=Math.max(0,unlockT-dt);
  tickJarSims(dt);
  const frozen=paused||boardOpen||jarOpen;
  fpsSmooth=fpsSmooth*0.95+(1/Math.max(dt,0.001))*0.05;

  if(frozen){
    acc=0;
  }else{
  time+=dt;
  if(runStarted&&!gameOver)runTime+=dt;
  updateQuality(dt);
  updateGpuLadder(dt);

  if(!gameOver){
    acc+=dt;
    let steps=0;
    while(acc>=DT&&steps<MAX_CATCHUP){ physicsStep(); acc-=DT; steps++; }
    if(acc>DT*MAX_CATCHUP) acc=0;   // too far behind: drop the debt
    processMerges();
  }else{
    acc=0;
  }
  for(const b of blobs){ tickFace(b.face,dt); if(b.pop>0) b.pop=Math.max(0,b.pop-dt*3.2); }
  tickFace(previewFace,dt);

  // shake decay
  shakeMag*=Math.pow(0.0016,dt);
  if(shakeMag<0.15) shakeMag=0;
  shakeX=(Math.random()-0.5)*2*shakeMag;
  shakeY=(Math.random()-0.5)*2*shakeMag;

  for(const r of rings) r.t+=dt*2.6;
  rings=rings.filter(r=>r.t<1);

  if(keyAimDir&&!gameOver) aimX=clampAim(aimX+keyAimDir*(keyFine?90:340)*dt);
  overLine=blobOverLine();
  if(!canDrop){dropT+=dt;if(dropT>0.32)canDrop=true;}
  comboTimer=Math.max(0,comboTimer-dt);
  // Thirty drops: once the last one is down, the run ends when the pile has
  // settled and nothing is still merging, so the last merges count.
  if(MUT==='noline'&&!gameOver&&dropsThisRun>=NOLINE_DROPS){
    finishT+=dt;
    if(finishT>2.5&&!mergeQueue.length)finishNow=true;
  }
  checkDanger(dt);
  updateHints(dt);
  saveT+=dt;
  if(saveT>=SAVE_EVERY){saveT=0;saveRun();}

  for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.life-=dt*1.6;}
  particles=particles.filter(p=>p.life>0);
  for(const p of popups) p.t+=dt;
  popups=popups.filter(p=>p.t<1);
  }

  // ---------- draw ----------
  // Paper and frame are pre-rendered; two blits replace a full-canvas pattern
  // fill plus several hundred wood-grain strokes. The frame layer is blitted
  // at the shake offset so it still moves with the world, the paper is not.
  buildBackground();
  blitLayer(bgPaper);
  blitLayer(bgFrame,shakeX,shakeY);
  ctx.setTransform(RENDER_S,0,0,RENDER_S,shakeX*RENDER_S,shakeY*RENDER_S);

  // Danger line
  const danger=dangerTimer>0;
  ctx.strokeStyle=danger?`rgba(224,80,70,${0.5+Math.sin(time*10)*0.4})`:'rgba(90,70,54,0.2)';
  ctx.setLineDash([10,8]);ctx.lineWidth=2;
  if(MUT!=='noline'){
    ctx.beginPath();ctx.moveTo(LEFT_X,DANGER_Y);ctx.lineTo(RIGHT_X,DANGER_Y);ctx.stroke();
  }
  ctx.setLineDash([]);

  // Aim guide and held blob preview
  if(!gameOver&&canDrop&&!popMode){
    const pull=overLine?null:slingPull();
    if(overLine)ctx.globalAlpha=0.4;
    const t=rainbowNext()?TIERS[1]:TIERS[currentTier];
    const col=rainbowNext()?rainbowCol(0):t.col;

    if(pull){
      // Short predicted arc: an indicator of direction and power, not a full
      // solution to the shot. Showing the whole path to the floor gives away
      // the placement and removes the reason to develop a feel for it.
      const sp=SLING_MIN_V+(SLING_MAX_V-SLING_MIN_V)*pull.power*pull.power;
      const ARC_LEN=70+pull.power*70;   // longer arc reads as more power
      let sx=aimX,sy=HOLD_Y,vx=pull.nx*sp,vy=pull.ny*sp;
      const h=1/50;
      let run=0,started=false;
      ctx.strokeStyle=`rgba(90,70,54,${0.18+pull.power*0.3})`;
      ctx.lineWidth=3; ctx.setLineDash([2,9]); ctx.lineCap='round';
      ctx.beginPath();
      for(let i=0;i<60;i++){
        const ox=sx,oy=sy;
        vy+=GRAVITY*GRAV_MUL*h; sx+=vx*h; sy+=vy*h;
        if(sy>FLOOR_Y-t.r)break;
        // Only start drawing outside the blob, so the guide never pierces it
        if(Math.hypot(sx-aimX,sy-HOLD_Y)<t.r+4)continue;
        if(!started){ctx.moveTo(sx,sy);started=true;continue;}
        run+=Math.hypot(sx-ox,sy-oy);
        if(run>ARC_LEN)break;
        ctx.lineTo(sx,sy);
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineCap='butt';

      // Aim line, starting at the blob's edge rather than its centre
      const lineFrom=t.r+2;
      const lineTo=Math.max(lineFrom+6,t.r+10+pull.power*54);
      ctx.strokeStyle=`rgba(122,82,40,${0.3+pull.power*0.45})`;
      ctx.lineWidth=3+pull.power*4; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(aimX+pull.nx*lineFrom,HOLD_Y+pull.ny*lineFrom);
      ctx.lineTo(aimX+pull.nx*lineTo,  HOLD_Y+pull.ny*lineTo);
      ctx.stroke(); ctx.lineCap='butt';
    }else{
      ctx.save();
      ctx.strokeStyle='rgba(47,32,19,0.3)';ctx.lineWidth=2.5;
      ctx.setLineDash([1,7]);ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(aimX,HOLD_Y+30);ctx.lineTo(aimX,FLOOR_Y);ctx.stroke();
      ctx.restore();
    }

    // The held blob squashes back against the pull, so the tension is felt
    // on the blob itself and not only in the band.
    // Held blob keeps its shape while aiming: the line and arc carry the
    // direction and power on their own.
    ctx.save();ctx.translate(aimX,HOLD_Y+(pull?0:Math.sin(time*2.5)*3));
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,t.r,0,Math.PI*2);ctx.fill();
    if(!rainbowNext()){ctx.save();ctx.beginPath();ctx.arc(0,0,t.r,0,Math.PI*2);ctx.clip();blitPattern(currentTier,t.r);ctx.restore();}
    ctx.strokeStyle=INK;
    ctx.lineWidth=Math.max(3.5,t.r*0.1);
    ctx.beginPath();ctx.arc(0,0,t.r,0,Math.PI*2);ctx.stroke();
    drawFace(t.r,previewFace,pull?Math.atan2(pull.ny,pull.nx):Math.PI/2);
    ctx.restore();
    ctx.globalAlpha=1;
    if(overLine){
      ctx.fillStyle=DANGER_RED;ctx.font=`${17}px ${UIFONT}`;ctx.textAlign='center';
      ctx.fillText('太高了！',aimX,HOLD_Y+t.r+26);
    }
  }
  if(popMode){
    ctx.fillStyle=INK;ctx.font=`${22}px ${DISPLAY}`;ctx.textAlign='center';
    ctx.fillText('点一只球把它戳破',W/2,DANGER_Y-14);
  }

  for(const b of blobs) drawBlob(b);

  // expanding merge rings
  for(const r of rings){
    const rad=r.r0+(r.r1-r.r0)*(1-Math.pow(1-r.t,2));
    ctx.globalAlpha=(1-r.t)*0.55;
    ctx.strokeStyle=r.col;
    ctx.lineWidth=Math.max(2,7*(1-r.t));
    ctx.beginPath();ctx.arc(r.x,r.y,rad,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=1;

  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  for(const p of popups){
    const s=1+Math.sin(Math.min(p.t*6,Math.PI))*0.3;
    ctx.save();
    ctx.globalAlpha=1-p.t*p.t;
    ctx.translate(p.x,p.y-p.t*58);
    ctx.scale(s,s);
    ctx.fillStyle=INK;
    ctx.font=`${26}px ${DISPLAY}`;ctx.textAlign='center';
    ctx.fillText(p.txt,0,0);
    ctx.restore();
  }
  ctx.globalAlpha=1;

  // HUD (unshaken)
  ctx.setTransform(RENDER_S,0,0,RENDER_S,0,0);

  // Score sticker: orange, ink border, tilted -3deg, hard ink shadow.
  // Anchors come from layout: top-left of the column in portrait, centred in
  // the side panel in landscape. PS scales the panel HUD up on wide screens
  // so labels survive the smaller cover scale of a desktop embed.
  const scoreTxt=String(score);
  // The card is sized to the score but capped: past six figures the digits
  // step down rather than the sticker growing into whatever sits beside it.
  let fs=40*PS;
  ctx.font=`${Math.round(fs)}px ${DISPLAY}`;
  let tw=ctx.measureText(scoreTxt).width;
  const cap=132*PS;
  if(tw>cap){
    fs=Math.max(24*PS,fs*cap/tw);
    ctx.font=`${Math.round(fs)}px ${DISPLAY}`;
    tw=ctx.measureText(scoreTxt).width;
  }
  const sw=Math.max(96*PS,tw+44*PS), sh=60*PS;
  const sx0=MODE==='landscape'?SCORE_X-sw/2:SCORE_X;
  sticker(sx0,SCORE_Y,sw,sh,16,SCORE_ORANGE,-3,4,5);
  ctx.save();
  ctx.translate(sx0+sw/2,SCORE_Y+sh/2);
  ctx.rotate(-3*Math.PI/180);
  ctx.font=`${Math.round(fs)}px ${DISPLAY}`;
  ctx.textAlign='center';
  ctx.fillStyle=INK;                       // 2px ink text-shadow
  ctx.fillText(scoreTxt,2,fs*0.4);
  ctx.fillStyle=CREAM;
  ctx.fillText(scoreTxt,0,fs*0.35);
  ctx.restore();

  // Combo takes the line beneath while live, otherwise the BEST pill
  if(comboTimer>0&&comboCount>1){
    const pulse=1+Math.sin(time*12)*0.07;
    ctx.save();
    ctx.translate(sx0+62*PS,PILL_Y);ctx.scale(pulse,pulse);
    ctx.rotate(2*Math.PI/180);
    ctx.beginPath();ctx.roundRect(-62*PS,-13*PS,124*PS,26*PS,999);
    ctx.fillStyle=DANGER_RED;ctx.fill();
    ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle=CREAM;ctx.textAlign='center';
    ctx.font=`800 ${Math.round(13*PS)}px ${UIFONT}`;
    ctx.fillText('连击 x'+comboCount,0,5*PS);
    ctx.restore();
  }else{
    inkPill(sx0+sw/2,PILL_Y,'最高 '+best,Math.round(11*PS),-3);
  }

  // NEXT slot: ink pill label above a dashed circle holding the next blob
  const nx=NEXT_X;
  inkPill(nx,NEXT_Y,'下一个',Math.round(9*PS),2);
  if(MUT==='noline'&&!gameOver)
    microLabel(Math.max(0,NOLINE_DROPS-dropsThisRun)+' 次剩余',nx,NEXT_Y+Math.round(78*PS),Math.round(9*PS),INK);
  ctx.save();
  ctx.beginPath();ctx.arc(nx,NEXT_Y+48*PS,26*PS,0,Math.PI*2);
  ctx.setLineDash([5,5]);
  ctx.strokeStyle='rgba(47,32,19,0.4)';ctx.lineWidth=3;ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.save();
  ctx.translate(nx,NEXT_Y+48*PS);
  const nt=TIERS[nextTier];
  const nr=18*PS;
  ctx.beginPath();ctx.arc(0,0,nr,0,Math.PI*2);
  ctx.fillStyle=nt.col;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(0,0,nr,0,Math.PI*2);ctx.clip();blitPattern(nextTier,nr);ctx.restore();
  ctx.beginPath();ctx.arc(0,0,nr,0,Math.PI*2);
  ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();
  ctx.restore();

  blitBottomUI();
  if(!gameOver&&!paused){ drawJar(); drawJarTell(); drawNote(); }
  drawReadyPulse();
  if(!gameOver&&!paused&&!boardOpen){
    drawRestartBtn(); drawBookBtn(); drawBoardBtn(); drawRankReadout(); drawTwistLabel();
    drawPlaysPill();
  }
  drawHint();

  if(paused){
    ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    ctx.fillStyle=INK;
    ctx.font=`${Math.round(28*PS)}px ${DISPLAY}`;
    ctx.fillStyle=INK;ctx.fillText('Blob Drop',W/2+2,H/2-148*PS);
    ctx.fillStyle=SCORE_ORANGE;ctx.fillText('Blob Drop',W/2,H/2-150*PS);
    ctx.fillStyle=INK;
    ctx.font=`${Math.round(44*PS)}px ${DISPLAY}`;
    ctx.fillText('已暂停',W/2,H/2-84*PS);
    ctx.font=`${Math.round(28*PS)}px ${DISPLAY}`;
    ctx.fillText(score+' 分',W/2,H/2-36*PS);
    goButton(GO_CONT_Y,'继续',GREEN,true,'play');
    goButton(GO_AGAIN_Y,'重新开始',SCORE_ORANGE,false,'restart');
  }

  if(boardOpen) drawBoard();
  if(jarOpen) drawJarOpen();

  if(gameOver){
    ctx.fillStyle='rgba(246,234,208,0.93)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle=INK;ctx.textAlign='center';
    ctx.font=`${Math.round(28*PS)}px ${DISPLAY}`;
    ctx.fillStyle=INK;ctx.fillText('Blob Drop',W/2+2,H/2-148*PS);
    ctx.fillStyle=SCORE_ORANGE;ctx.fillText('Blob Drop',W/2,H/2-150*PS);
    ctx.fillStyle=INK;ctx.font=`${Math.round(44*PS)}px ${DISPLAY}`;ctx.fillText(MUT==='noline'?'三十球落完！':'球堆满啦！',W/2,H/2-92*PS);
    ctx.font=`${Math.round(32*PS)}px ${DISPLAY}`;ctx.fillText(score+' 分',W/2,H/2-42*PS);
    inkPill(W/2,H/2-18*PS,'最高 '+best,Math.round(11*PS),-2);

    if(commentPending){
      microLabel('发布中'+'.'.repeat(1+Math.floor(wallTime*2.5)%3),
                 W/2,GO_CONT_Y+34*PS,Math.round(11*PS),INK_SOFT);
    }else if(!scorePosted&&HUB&&HUB.continueAvailable){
      // Secondary to Play again, and says what it does: it posts a comment as
      // the player, which is not something to spring on anyone.
      goButton(GO_CONT_Y,'发布成绩',COMMENT_PURPLE,false,'comment');
      microLabel('把这一局分享到评论区',
                 W/2,GO_CONT_Y+(BTN_H+16)*PS,Math.round(9*PS),INK_SOFT);
    }else if(commentMsg){
      microLabel(commentMsg.toUpperCase(),W/2,GO_CONT_Y+34*PS,Math.round(10*PS),INK_SOFT);
    }
    goButton(GO_AGAIN_Y,'再玩一次',GREEN,true,'restart');
    drawGoalList(W/2,GO_AGAIN_Y+(BTN_H+26)*PS,true);

    // Drawn over the wash, at the slots the player already knows, so the offer
    // reads as "your buttons still work" rather than as a new menu.
    if(readyPowerups()&&MUT!=='noline'){
      drawButtons();
      let bx=1e9,br=-1e9,by=1e9;
      for(const s of BTN_SLOTS){bx=Math.min(bx,s.x);br=Math.max(br,s.x+s.w);by=Math.min(by,s.y);}
      microLabel('或者用一个已充满的道具继续',
                 (bx+br)/2,by-Math.round(12*PS),Math.round(9*PS),INK_SOFT);
    }
  }

  drawUnlock();
  workMs=workMs*0.9+(performance.now()-t0)*0.1;
}

// Fonts used only inside ctx.font frequently never trigger a download — the
// browser sees no DOM node using them. Ask for them explicitly. Rendering
// continues on the fallback until they land, then picks them up automatically
// because we redraw every frame.
if(document.fonts&&document.fonts.load){
  document.fonts.load("32px 'Titan One'").catch(()=>{});
  document.fonts.load("800 16px 'Baloo 2'").catch(()=>{});
  document.fonts.load("700 16px 'Baloo 2'").catch(()=>{});
}

currentTier=rndTier(); nextTier=rndTier();
// Boot fit runs AFTER all game state exists, because layout() shifts the
// world when the pit moves and needs the arrays declared.
fit(true);
syncViewMode();
addEventListener('resize',()=>{fit();syncViewMode();});
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{fit();syncViewMode();});
// Resize storms and lying iframes eventually settle; a slow timer heals any
// transient mis-measurement (fit is a no-op when nothing actually changed).
setInterval(()=>{fit();syncViewMode();},1000);
requestAnimationFrame(frame);

// Boot is deliberately NOT gated on the network. The game is interactive from
// the first frame and stays playable if init never lands — that property is why
// storage was wrapped in the first place, and it survives the move to Redis.
//
// What init brings is the day's seed and whatever was saved, so the little that
// depends on those is applied here, once, when it arrives:
//
//   - `best`, which was read from an empty cache a moment ago
//   - the saved run, restored only if the player has not already started one
//   - the seeded drop sequence, rewound and redealt so this run gets the day's
//     cards from the top — again only if nothing has been dropped yet
let openingDealt=false;
// The post's twist lands with init. Gravity is one term; giant scales the
// sizes the whole game reads from TIERS. If the fallback timer already dealt
// an opening board at the old sizes, deal it again: nothing was dropped.
function applyMutator(){
  if(!HUB)return;
  MUT=HUB.mutator||'none';
  if(MUT==='lowgrav'){GRAV_MUL=0.55;setSubsteps(subSteps);}
  if(MUT==='giant')for(const t of TIERS)t.r=Math.round(t.r*1.25);
  if((MUT==='giant'||MUT==='even')&&!runStarted&&!gameOver&&blobs.length){
    blobs=[];openingDealt=false;dealOpeningOnce();
  }
}
function dealOpeningOnce(){
  if(openingDealt||runStarted||gameOver||blobs.length)return;
  openingDealt=true;
  if(HUB)HUB.reseed();
  // A saved run wins; otherwise the post's opening board.
  if(!loadRun())openingBoard();
}
platformInit().then(()=>{
  platformLoaded();
  applyMutator();
  if(HUB&&HUB.notes&&HUB.notes.length){
    const n=HUB.notes[0];
    noteMsg='你的球在 '+shortName(n.name,14)+' 的局里升到了 '+n.level+' 级';
    noteMsgT=7;
  }
  best=Math.max(best,+storeGet(KEY_BEST)||0);
  dealOpeningOnce();
});
setTimeout(dealOpeningOnce,1500);
