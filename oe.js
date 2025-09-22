// oe.js - p5.js sketch for truth scene
let bgImg, shadowOverlay, fragments = [], secrets = [], illusions = [], mouseTrail = [], clickRipples = [], isShattered = false, shadowIntensity = 1, zoomLevel = 1;
let isMousePressed = false, lastMouseX = 0, lastMouseY = 0;
let effectTimer = 0, currentEffect = 1;

function preload() {
    bgImg = loadImage('background.png');
}

function setup() {
    createCanvas(1920, 1080);
    createShadowOverlay();
    generateFragments();
    for (let i = 0; i < 20; i++) secrets.push(new Secret());
}

function createShadowOverlay() {
    shadowOverlay = createGraphics(width, height);
    updateShadowOverlay();
}

function updateShadowOverlay() {
    shadowOverlay.clear();
    shadowOverlay.blendMode(MULTIPLY);
    for (let y = 0; y < height; y += 18) {
        for (let x = 0; x < width; x += 18) {
            let alpha = noise(x * 0.01, y * 0.01, frameCount * 0.003) * 120 * shadowIntensity;
            shadowOverlay.fill(30,0,30,alpha);
            shadowOverlay.noStroke();
            shadowOverlay.rect(x, y, 18, 18);
        }
    }
}

function generateFragments() {
    fragments = [];
    for (let i = 0; i < 30; i++) fragments.push(new Fragment());
}

function draw() {
    push();
    scale(zoomLevel);
    drawBackground();
    updateSystems();
    drawFragments();
    drawSecrets();
    drawIllusions();
    drawMouseEffects();
    pop();
    blendMode(MULTIPLY);
    image(shadowOverlay, 0, 0, width, height);
    blendMode(BLEND);
    drawUI();
    effectTimer += 1/60;
    if (effectTimer > 0.5) { currentEffect = currentEffect === 1 ? 2 : 1; effectTimer = 0; updateShadowOverlay(); }
    updateStats();
}

function drawBackground() {
    if (bgImg) {
        // Brighter, clearer tint for visibility
        tint(180, 80, 180, 220); // Soft purple-pink, more visible
        image(bgImg, 0, 0, width, height);
        noTint();
    } else {
        background(40, 10, 40);
    }
}

function updateSystems() {
    if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
        mouseTrail.push({x: mouseX, y: mouseY, life: 20});
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
        mouseTrail[i].life--;
        if (mouseTrail[i].life <= 0) mouseTrail.splice(i, 1);
    }
    for (let i = fragments.length - 1; i >= 0; i--) {
        fragments[i].update();
        if (fragments[i].isDead()) fragments.splice(i, 1);
    }
    for (let i = secrets.length - 1; i >= 0; i--) {
        secrets[i].update();
        if (secrets[i].isDead()) secrets.splice(i, 1);
    }
    for (let i = illusions.length - 1; i >= 0; i--) {
        illusions[i].update();
        if (illusions[i].isDead()) illusions.splice(i, 1);
    }
}

function drawFragments() { fragments.forEach(f => f.draw()); }
function drawSecrets() { secrets.forEach(s => s.draw()); }
function drawIllusions() { illusions.forEach(i => i.draw()); }
function drawMouseEffects() {
    stroke(255,0,80,100); strokeWeight(2); noFill();
    if (mouseTrail.length > 1) {
        beginShape();
        for (let i = 0; i < mouseTrail.length; i++) {
            let p = mouseTrail[i], a = map(p.life, 0, 20, 0, 100);
            stroke(255,0,80,a); vertex(p.x, p.y);
        }
        endShape();
    }
    stroke(255,0,80,150); strokeWeight(3); noFill();
    for (let i = clickRipples.length - 1; i >= 0; i--) {
        let r = clickRipples[i]; ellipse(r.x, r.y, r.size);
        r.size += 4; r.alpha -= 3;
        if (r.alpha <= 0) clickRipples.splice(i, 1);
    }
}
function drawUI() {
    let v = createGraphics(width, height), maxR = dist(0, 0, width, height) * 1.1;
    for (let r = 0; r < maxR; r += 12) {
        let a = map(r, 0, maxR, 0, 120);
        v.stroke(255,0,80,a); v.strokeWeight(24); v.noFill(); v.ellipse(width/2, height/2, r);
    }
    blendMode(MULTIPLY); image(v, 0, 0); blendMode(BLEND);
}
function updateStats() {
    document.getElementById('particleCount').textContent = fragments.length + secrets.length + illusions.length;
    document.getElementById('atmosphere').textContent = ['Normal','Deep','Exposed'][0];
    document.getElementById('weather').textContent = isShattered ? 'Broken' : 'Stable';
}
function mousePressed() {
    clickRipples.push({x: mouseX, y: mouseY, size: 0, alpha: 100});
    for (let i = 0; i < 3; i++) illusions.push(new Illusion(mouseX, mouseY));
    isMousePressed = true;
}
function mouseReleased() { isMousePressed = false; }
function mouseDragged() { for (let i = 0; i < 2; i++) fragments.push(new Fragment(mouseX, mouseY)); }
function keyPressed() {
    switch (key.toLowerCase()) {
        case ' ':
            isShattered = !isShattered;
            break;
        case 'r':
            generateFragments();
            secrets = [];
            illusions = [];
            for (let i = 0; i < 20; i++) secrets.push(new Secret());
            break;
        case 'f':
            shadowIntensity = shadowIntensity === 1 ? 2 : shadowIntensity === 2 ? 0.5 : 1;
            break;
        case 'v':
            secrets.push(new Secret(mouseX, mouseY));
            break;
    }
}
function windowResized() { resizeCanvas(1920, 1080); createShadowOverlay(); }
// Particle Classes
class Fragment {
    constructor(x, y) {
        this.x = x || random(width);
        this.y = y || random(height);
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.life = 255;
        this.size = random(3, 8);
        this.color = color(255,0,80);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 3;
        this.size *= 0.99;
    }
    draw() {
        push();
        drawingContext.shadowColor = this.color.toString();
        drawingContext.shadowBlur = 10;
        fill(red(this.color),0,80,this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }
    isDead() { return this.life <= 0; }
}
class Secret {
    constructor(x, y) {
        this.x = x || random(width);
        this.y = y || random(height);
        this.life = 180;
        this.size = random(5, 12);
    }
    update() {
        this.x += random(-1,1);
        this.y += random(-1,1);
        this.life -= 1;
    }
    draw() {
        push();
        drawingContext.shadowColor = 'rgba(255,0,80,0.8)';
        drawingContext.shadowBlur = 20;
        fill(255,0,80,this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }
    isDead() { return this.life <= 0; }
}
class Illusion {
    constructor(x, y) {
        this.x = x || random(width);
        this.y = y || random(height);
        this.life = 120;
        this.size = random(8, 18);
    }
    update() {
        this.x += random(-2,2);
        this.y += random(-2,2);
        this.life -= 2;
    }
    draw() {
        push();
        drawingContext.shadowColor = 'rgba(255,0,80,0.5)';
        drawingContext.shadowBlur = 10;
        fill(255,0,80,this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }
    isDead() { return this.life <= 0; }
}
