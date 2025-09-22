// be.js - p5.js sketch for aftermath scene
let buildings = [], vines = [], cracks = [], particles = [], raindrops = [], birds = [], lightOrbs = [], dustMotes = [], mouseTrail = [];
let noiseOffset = 0, effectTimer = 0, currentEffect = 1, mouseInfluence = 0, clickRipples = [], isRaining = false, fogDensity = 1, zoomLevel = 1;
let isMousePressed = false, lastMouseX = 0, lastMouseY = 0;
let effect1, effect2, windDirection = 0;
let effectImg1, effectImg2, effectImgTimer = 0, showEffect1 = true;

function preload() {
    effectImg1 = loadImage('effect1.png');
    effectImg2 = loadImage('effect2.png');
}

function setup() {
    createCanvas(1920, 1080);
    createPlaceholderEffects();
    generateCity();
    for (let i = 0; i < 30; i++) dustMotes.push(new DustMote());
}

function generateCity() {
    buildings = []; vines = []; cracks = [];
    for (let x = 50; x < width - 50; x += random(80, 150)) {
        let h = random(200, height * 0.8), w = random(60, 140), t = random(['residential','office','industrial']);
        buildings.push({x, y: height-h, w, h, type: t, windows: generateWindows(x, height-h, w, h, t), litWindows: new Set(), damage: random(0.1,0.8), sway: random(-0.5,0.5)});
    }
    for (let i = 0; i < 25; i++) {
        let b = random(buildings), vine = new Vine(b.x+random(b.w), b.y+b.h);
        vines.push(vine);
    }
    for (let i = 0; i < 20; i++) cracks.push(new Crack());
}

function generateWindows(x, y, w, h, t) {
    let arr = [], ww = t==='office'?6:10, wh = t==='office'?8:14, sp = t==='office'?12:18;
    for (let yy = y+40; yy < y+h-20; yy += sp) for (let xx = x+15; xx < x+w-15; xx += sp)
        if (random() > 0.2) arr.push({x:xx, y:yy, w:ww, h:wh, broken:random()>0.7, flickering:random()>0.9});
    return arr;
}

function createPlaceholderEffects() {
    effect1 = createGraphics(width, height);
    effect2 = createGraphics(width, height);
    updateEffects();
}

function updateEffects() {
    effect1.clear(); effect1.blendMode(SCREEN);
    for (let i = 0; i < 80; i++) {
        let x = (noise(i*0.1, frameCount*0.001)*width*2)%width, y = (noise(i*0.1+100, frameCount*0.001)*height*2)%height;
        let alpha = noise(i*0.05, frameCount*0.005)*80+20;
        effect1.fill(255,30,30,alpha); effect1.noStroke(); effect1.circle(x,y,random(1,6));
    }
    effect2.clear(); effect2.blendMode(MULTIPLY);
    for (let y = 0; y < height; y += 25) for (let x = 0; x < width; x += 25) {
        let alpha = noise(x*0.008, y*0.008, frameCount*0.002)*120*fogDensity;
        effect2.fill(80,0,0,alpha); effect2.noStroke(); effect2.rect(x,y,25,25);
    }
}

function draw() {
    push();
    scale(zoomLevel);
    drawBackground(); updateSystems(); drawBuildings(); drawVines(); drawCracks(); drawParticles(); drawWeather(); drawBirds(); drawMouseEffects();
    pop();
    effectImgTimer += deltaTime/1000;
    if (effectImgTimer > 0.5) { showEffect1 = !showEffect1; effectImgTimer = 0; }
    blendMode(MULTIPLY);
    if (showEffect1 && effectImg1) image(effectImg1,0,0,width,height); else if (effectImg2) image(effectImg2,0,0,width,height);
    blendMode(BLEND);
    drawUI(); noiseOffset += 0.01; windDirection += 0.02; updateStats();
}

function drawBackground() {
    for (let y = 0; y < height; y++) {
        let inter = map(y,0,height,0,1), r = lerp(30,10,inter), g = lerp(0,0,inter), b = lerp(0,0,inter);
        stroke(r,g,b); line(0,y,width,y);
    }
    updateEffects(); effectTimer += 1/60;
    if (effectTimer > 0.5) { currentEffect = currentEffect===1?2:1; effectTimer = 0; }
    blendMode(MULTIPLY);
    if (currentEffect===1) { tint(255,60); image(effect1,0,0); } else { tint(255,120); image(effect2,0,0); }
    blendMode(BLEND); noTint();
}

function updateSystems() {
    if (mouseX !== lastMouseX || mouseY !== lastMouseY) { mouseTrail.push({x:mouseX, y:mouseY, life:20}); lastMouseX=mouseX; lastMouseY=mouseY; }
    for (let i = mouseTrail.length-1; i >= 0; i--) { mouseTrail[i].life--; if (mouseTrail[i].life <= 0) mouseTrail.splice(i,1); }
    for (let i = particles.length-1; i >= 0; i--) { particles[i].update(); if (particles[i].isDead()) particles.splice(i,1); }
    dustMotes.forEach(m=>m.update());
    for (let i = lightOrbs.length-1; i >= 0; i--) { lightOrbs[i].update(); if (lightOrbs[i].isDead()) lightOrbs.splice(i,1); }
}

function drawBuildings() {
    for (let b of buildings) {
        push(); let sway = sin(frameCount*0.01+b.sway)*0.5; translate(sway,0);
        fill(60,0,0); stroke(120,0,0); strokeWeight(1); rect(b.x,b.y,b.w,b.h);
        if (b.damage > 0.5) { fill(80,0,0,150); for (let i = 0; i < b.damage*8; i++) ellipse(b.x+random(b.w),b.y+random(b.h),random(15,35),random(25,50)); }
        for (let i = 0; i < b.windows.length; i++) {
            let w = b.windows[i], k = `${b.x}-${i}`;
            if (b.litWindows.has(k)) { fill(255,30,30,200); drawingContext.shadowColor='rgba(255,30,30,0.5)'; drawingContext.shadowBlur=15; }
            else if (w.broken) fill(40,0,0); else fill(60,0,0);
            rect(w.x,w.y,w.w,w.h); drawingContext.shadowBlur=0;
        }
        pop();
    }
}

function drawVines() { vines.forEach(v=>v.draw()); }
function drawCracks() { cracks.forEach(c=>c.draw()); }
function drawParticles() { particles.forEach(p=>p.draw()); lightOrbs.forEach(o=>o.draw()); dustMotes.forEach(m=>m.draw()); }
function drawWeather() { if (isRaining) { for (let i = 0; i < 3; i++) raindrops.push(new Raindrop()); for (let i = raindrops.length-1; i >= 0; i--) { raindrops[i].update(); raindrops[i].draw(); if (raindrops[i].y > height) raindrops.splice(i,1); } } }
function drawBirds() { birds.forEach(b=>{b.update();b.draw();}); birds = birds.filter(b=>b.x<width+50); }
function drawMouseEffects() { stroke(255,30,30,100); strokeWeight(2); noFill(); if (mouseTrail.length>1) { beginShape(); for (let i=0;i<mouseTrail.length;i++) { let p=mouseTrail[i],a=map(p.life,0,20,0,100); stroke(255,30,30,a); vertex(p.x,p.y); } endShape(); } stroke(255,30,30,150); strokeWeight(3); noFill(); for (let i=clickRipples.length-1;i>=0;i--) { let r=clickRipples[i]; ellipse(r.x,r.y,r.size); r.size+=4; r.alpha-=3; if (r.alpha<=0) clickRipples.splice(i,1); } }
function drawUI() { let v=createGraphics(width,height),maxR=dist(0,0,width,height)*1.1; for(let r=0;r<maxR;r+=12){let a=map(r,0,maxR,0,120);v.stroke(255,30,30,a);v.strokeWeight(24);v.noFill();v.ellipse(width/2,height/2,r);} blendMode(MULTIPLY); image(v,0,0); blendMode(BLEND); }
function updateStats() { document.getElementById('particleCount').textContent = particles.length+lightOrbs.length+dustMotes.length; document.getElementById('atmosphere').textContent = ['Normal','Storm','Mystical'][0]; document.getElementById('weather').textContent = isRaining?'Rain':'Clear'; }
function mousePressed() { clickRipples.push({x:mouseX,y:mouseY,size:0,alpha:100}); for(let b of buildings){if(mouseX>b.x&&mouseX<b.x+b.w&&mouseY>b.y&&mouseY<b.y+b.h){for(let i=0;i<3;i++){let wi=floor(random(b.windows.length)),k=`${b.x}-${wi}`;if(b.litWindows.has(k))b.litWindows.delete(k);else b.litWindows.add(k);}}} for(let i=0;i<3;i++)lightOrbs.push(new LightOrb(mouseX,mouseY)); isMousePressed=true; }
function mouseReleased() { isMousePressed=false; }
function mouseDragged() { for(let i=0;i<2;i++)particles.push(new GlowParticle(mouseX,mouseY)); }
function keyPressed() { switch(key.toLowerCase()){case' ':isRaining=!isRaining;if(!isRaining)raindrops=[];break;case'r':generateCity();particles=[];lightOrbs=[];break;case'f':fogDensity=fogDensity===1?2:fogDensity===2?0.5:1;break;case'v':vines.push(new Vine(mouseX,mouseY));break;} }
function windowResized() { resizeCanvas(1920,1080); createPlaceholderEffects(); }
// Particle Classes
class DustMote{constructor(){this.x=random(width);this.y=random(height);this.size=random(1,3);this.speed=random(0.2,0.8);this.offset=random(1000);}update(){this.x+=noise(this.offset)*2-1;this.y+=this.speed;this.offset+=0.01;if(this.y>height){this.y=-10;this.x=random(width);}}draw(){fill(255,30,30,60);noStroke();ellipse(this.x,this.y,this.size);}}
class GlowParticle{constructor(x,y){this.x=x+random(-10,10);this.y=y+random(-10,10);this.vx=random(-2,2);this.vy=random(-3,-1);this.life=255;this.size=random(3,8);this.color=color(255,30,30);}update(){this.x+=this.vx;this.y+=this.vy;this.vy+=0.1;this.life-=3;this.size*=0.99;}draw(){push();drawingContext.shadowColor=this.color.toString();drawingContext.shadowBlur=10;fill(red(this.color),30,30,this.life);noStroke();ellipse(this.x,this.y,this.size);drawingContext.shadowBlur=0;pop();}isDead(){return this.life<=0;}}
class LightOrb{constructor(x,y){this.x=x;this.y=y;this.targetX=x+random(-100,100);this.targetY=y+random(-50,-150);this.life=180;this.size=random(5,12);}update(){this.x=lerp(this.x,this.targetX,0.02);this.y=lerp(this.y,this.targetY,0.02);this.life-=1;}draw(){push();drawingContext.shadowColor='rgba(255,30,30,0.8)';drawingContext.shadowBlur=20;fill(255,30,30,this.life);noStroke();ellipse(this.x,this.y,this.size);drawingContext.shadowBlur=0;pop();}isDead(){return this.life<=0;}}
class Vine{constructor(x,y){this.points=[];for(let i=0;i<random(80,150);i++){x+=random(-4,4);y-=random(1,4);if(y<0)break;this.points.push({x:x,y:y,size:random(1,3),hasLeaf:random()>0.8});}}draw(){stroke(255,30,30,200);strokeWeight(2);noFill();beginShape();for(let p of this.points){let w=noise(p.x*0.01,p.y*0.01,noiseOffset)*2;vertex(p.x+w,p.y);}endShape();fill(255,30,30,180);noStroke();for(let p of this.points){if(p.hasLeaf){let w=noise(p.x*0.01,p.y*0.01,noiseOffset)*2;ellipse(p.x+w,p.y,p.size*3,p.size*4);}}}}
class Crack{constructor(){this.points=[];let x=random(width),y=random(height*0.4,height);for(let i=0;i<random(40,100);i++){x+=random(-3,3);y+=random(-2,4);this.points.push({x:x,y:y});}}draw(){stroke(255,30,30,120);strokeWeight(1);noFill();beginShape();for(let p of this.points)vertex(p.x,p.y);endShape();}}
class Raindrop{constructor(){this.x=random(width);this.y=-10;this.speed=random(8,15);this.length=random(10,25);}update(){this.x+=sin(windDirection)*2;this.y+=this.speed;}draw(){stroke(255,30,30,120);strokeWeight(1);line(this.x,this.y,this.x,this.y+this.length);}}
class Bird{constructor(x,y){this.x=x;this.y=y;this.speed=random(2,4);this.wingPhase=random(TWO_PI);this.size=random(3,6);}update(){this.x+=this.speed;this.y+=sin(this.x*0.01+this.wingPhase)*0.5;this.wingPhase+=0.3;}draw(){push();translate(this.x,this.y);stroke(255,30,30);strokeWeight(2);let wf=sin(this.wingPhase);line(-this.size,wf*2,this.size,-wf*2);line(-this.size,-wf*2,this.size,wf*2);pop();}}
