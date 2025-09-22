// he.js - p5.js sketch extracted from he.html

let buildings = [];
let vines = [];
let cracks = [];
let particles = [];
let raindrops = [];
let birds = [];
let lightOrbs = [];
let dustMotes = [];
let mouseTrail = [];

let noiseOffset = 0;
let effectTimer = 0;
let currentEffect = 1;
let mouseInfluence = 0;
let clickRipples = [];
let isRaining = false;
fogDensity = 1;
let zoomLevel = 1;
let cameraX = 0, cameraY = 0;
atmosphereMode = 0; // 0: normal, 1: storm, 2: mystical
let isMousePressed = false;
let lastMouseX = 0, lastMouseY = 0;

let effect1, effect2;
let windDirection = 0;
let effectImg1, effectImg2;
let effectImgTimer = 0;
let showEffect1 = true;

function preload() {
    effectImg1 = loadImage('effect1.png');
    effectImg2 = loadImage('effect2.png');
}

function setup() {
    createCanvas(1920, 1080);
    createPlaceholderEffects();
    generateCity();
    for (let i = 0; i < 30; i++) {
        dustMotes.push(new DustMote());
    }
}

function generateCity() {
    buildings = [];
    vines = [];
    cracks = [];
    for (let x = 50; x < width - 50; x += random(80, 150)) {
        let buildingHeight = random(200, height * 0.8);
        let buildingWidth = random(60, 140);
        let buildingType = random(['residential', 'office', 'industrial']);
        buildings.push({
            x: x,
            y: height - buildingHeight,
            w: buildingWidth,
            h: buildingHeight,
            type: buildingType,
            windows: generateWindows(x, height - buildingHeight, buildingWidth, buildingHeight, buildingType),
            litWindows: new Set(),
            damage: random(0.1, 0.8),
            sway: random(-0.5, 0.5)
        });
    }
    generateVines();
    generateCracks();
}

function generateWindows(buildingX, buildingY, buildingW, buildingH, type) {
    let windows = [];
    let windowW = type === 'office' ? 6 : 10;
    let windowH = type === 'office' ? 8 : 14;
    let spacing = type === 'office' ? 12 : 18;
    for (let y = buildingY + 40; y < buildingY + buildingH - 20; y += spacing) {
        for (let x = buildingX + 15; x < buildingX + buildingW - 15; x += spacing) {
            if (random() > 0.2) {
                windows.push({
                    x: x,
                    y: y,
                    w: windowW,
                    h: windowH,
                    broken: random() > 0.7,
                    flickering: random() > 0.9
                });
            }
        }
    }
    return windows;
}

function generateVines() {
    for (let i = 0; i < 25; i++) {
        let building = random(buildings);
        let vineX = building.x + random(building.w);
        let vineY = building.y + building.h;
        let vine = new Vine(vineX, vineY);
        vines.push(vine);
    }
}

function generateCracks() {
    for (let i = 0; i < 20; i++) {
        let crack = new Crack();
        cracks.push(crack);
    }
}

function createPlaceholderEffects() {
    effect1 = createGraphics(width, height);
    effect2 = createGraphics(width, height);
    updateEffects();
}

function updateEffects() {
    effect1.clear();
    effect1.blendMode(SCREEN);
    for (let i = 0; i < 80; i++) {
        let x = (noise(i * 0.1, frameCount * 0.001) * width * 2) % width;
        let y = (noise(i * 0.1 + 100, frameCount * 0.001) * height * 2) % height;
        let alpha = noise(i * 0.05, frameCount * 0.005) * 80 + 20;
        effect1.fill(255, 240, 200, alpha);
        effect1.noStroke();
        effect1.circle(x, y, random(1, 6));
    }
    effect2.clear();
    effect2.blendMode(MULTIPLY);
    for (let y = 0; y < height; y += 25) {
        for (let x = 0; x < width; x += 25) {
            let alpha = noise(x * 0.008, y * 0.008, frameCount * 0.002) * 120 * fogDensity;
            let r = 180 + atmosphereMode * 20;
            let g = 170 + atmosphereMode * 15;
            let b = 150 + atmosphereMode * 25;
            effect2.fill(r, g, b, alpha);
            effect2.noStroke();
            effect2.rect(x, y, 25, 25);
        }
    }
}

function draw() {
    push();
    // REMOVE camera movement by mouse
    // translate(-cameraX * zoomLevel, -cameraY * zoomLevel);
    scale(zoomLevel);
    drawBackground();
    updateSystems();
    drawBuildings();
    drawVines();
    drawCracks();
    drawParticles();
    drawWeather();
    drawBirds();
    drawMouseEffects();
    pop();
    // Show animated effect images in multiply blend mode
    effectImgTimer += deltaTime / 1000;
    if (effectImgTimer > 0.5) {
        showEffect1 = !showEffect1;
        effectImgTimer = 0;
    }
    blendMode(MULTIPLY);
    if (showEffect1 && effectImg1) {
        image(effectImg1, 0, 0, width, height);
    } else if (effectImg2) {
        image(effectImg2, 0, 0, width, height);
    }
    blendMode(BLEND);
    drawUI();
    noiseOffset += 0.01;
    windDirection += 0.02;
    updateStats();
}

function drawBackground() {
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let baseR = 139, baseG = 125, baseB = 107;
        let darkR = 92, darkG = 84, darkB = 73;
        if (atmosphereMode === 1) {
            baseR -= 30; baseG -= 20; baseB -= 10;
            darkR -= 20; darkG -= 15; darkB -= 5;
        } else if (atmosphereMode === 2) {
            baseR += 20; baseG -= 10; baseB += 30;
            darkR += 15; darkG -= 5; darkB += 20;
        }
        let r = lerp(baseR, darkR, inter);
        let g = lerp(baseG, darkG, inter);
        let b = lerp(baseB, darkB, inter);
        stroke(r, g, b);
        line(0, y, width, y);
    }
    updateEffects();
    effectTimer += 1/60;
    if (effectTimer > 0.5) {
        currentEffect = currentEffect === 1 ? 2 : 1;
        effectTimer = 0;
    }
    blendMode(MULTIPLY);
    if (currentEffect === 1) {
        tint(255, 120 + mouseInfluence * 135);
        image(effect1, 0, 0);
    } else {
        tint(255, 160 + mouseInfluence * 95);
        image(effect2, 0, 0);
    }
    blendMode(BLEND);
    noTint();
}

function updateSystems() {
    // mouseInfluence = lerp(mouseInfluence, map(mouseX, 0, width, 0, 1), 0.05); // REMOVE mouse atmosphere shift
    if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
        mouseTrail.push({x: mouseX, y: mouseY, life: 20});
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
        mouseTrail[i].life--;
        if (mouseTrail[i].life <= 0) {
            mouseTrail.splice(i, 1);
        }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    dustMotes.forEach(mote => mote.update());
    for (let i = lightOrbs.length - 1; i >= 0; i--) {
        lightOrbs[i].update();
        if (lightOrbs[i].isDead()) {
            lightOrbs.splice(i, 1);
        }
    }
}

function drawBuildings() {
    for (let building of buildings) {
        push();
        let sway = sin(frameCount * 0.01 + building.sway) * 0.5;
        translate(sway, 0);
        fill(70 - building.damage * 20, 60 - building.damage * 15, 50 - building.damage * 10);
        stroke(50 - building.damage * 10, 40 - building.damage * 8, 30 - building.damage * 5);
        strokeWeight(1);
        rect(building.x, building.y, building.w, building.h);
        if (building.damage > 0.5) {
            fill(60, 50, 40, 150);
            for (let i = 0; i < building.damage * 8; i++) {
                let stainX = building.x + random(building.w);
                let stainY = building.y + random(building.h);
                ellipse(stainX, stainY, random(15, 35), random(25, 50));
            }
        }
        for (let i = 0; i < building.windows.length; i++) {
            let window = building.windows[i];
            let windowKey = `${building.x}-${i}`;
            if (building.litWindows.has(windowKey)) {
                let flicker = window.flickering ? random(0.7, 1) : 1;
                fill(255, 220, 120, 200 * flicker);
                drawingContext.shadowColor = 'rgba(255, 220, 120, 0.5)';
                drawingContext.shadowBlur = 15;
            } else if (window.broken) {
                fill(20, 15, 10);
            } else {
                fill(30, 25, 20);
            }
            rect(window.x, window.y, window.w, window.h);
            drawingContext.shadowBlur = 0;
        }
        pop();
    }
}

function drawVines() {
    vines.forEach(vine => vine.draw());
}

function drawCracks() {
    cracks.forEach(crack => crack.draw());
}

function drawParticles() {
    particles.forEach(particle => particle.draw());
    lightOrbs.forEach(orb => orb.draw());
    dustMotes.forEach(mote => mote.draw());
}

function drawWeather() {
    if (isRaining) {
        for (let i = 0; i < 3; i++) {
            raindrops.push(new Raindrop());
        }
        for (let i = raindrops.length - 1; i >= 0; i--) {
            raindrops[i].update();
            raindrops[i].draw();
            if (raindrops[i].y > height) {
                raindrops.splice(i, 1);
            }
        }
    }
}

function drawBirds() {
    birds.forEach(bird => {
        bird.update();
        bird.draw();
    });
    birds = birds.filter(bird => bird.x < width + 50);
}

function drawMouseEffects() {
    stroke(255, 200, 100, 100);
    strokeWeight(2);
    noFill();
    if (mouseTrail.length > 1) {
        beginShape();
        for (let i = 0; i < mouseTrail.length; i++) {
            let point = mouseTrail[i];
            let alpha = map(point.life, 0, 20, 0, 100);
            stroke(255, 200, 100, alpha);
            vertex(point.x, point.y);
        }
        endShape();
    }
    stroke(255, 200, 100, 150);
    strokeWeight(3);
    noFill();
    for (let i = clickRipples.length - 1; i >= 0; i--) {
        let ripple = clickRipples[i];
        ellipse(ripple.x, ripple.y, ripple.size);
        ripple.size += 4;
        ripple.alpha -= 3;
        if (ripple.alpha <= 0) {
            clickRipples.splice(i, 1);
        }
    }
}

function drawUI() {
    let vignetteGraphics = createGraphics(width, height);
    // Make the dark circle effect much bigger, covering the whole screen
    let maxRadius = dist(0, 0, width, height) * 1.1;
    for (let r = 0; r < maxRadius; r += 12) {
        let alpha = map(r, 0, maxRadius, 0, 120 + atmosphereMode * 30);
        vignetteGraphics.stroke(20, 15, 10, alpha);
        vignetteGraphics.strokeWeight(24);
        vignetteGraphics.noFill();
        vignetteGraphics.ellipse(width/2, height/2, r);
    }
    blendMode(MULTIPLY);
    image(vignetteGraphics, 0, 0);
    blendMode(BLEND);
}

function updateStats() {
    document.getElementById('particleCount').textContent = particles.length + lightOrbs.length + dustMotes.length;
    let atmosText = ['Normal', 'Storm', 'Mystical'][atmosphereMode];
    document.getElementById('atmosphere').textContent = atmosText;
    let weatherText = isRaining ? 'Rain' : 'Clear';
    document.getElementById('weather').textContent = weatherText;
}

function mousePressed() {
    clickRipples.push({x: mouseX, y: mouseY, size: 0, alpha: 100});
    for (let building of buildings) {
        if (mouseX > building.x && mouseX < building.x + building.w &&
            mouseY > building.y && mouseY < building.y + building.h) {
            for (let i = 0; i < 3; i++) {
                let windowIndex = floor(random(building.windows.length));
                let windowKey = `${building.x}-${windowIndex}`;
                if (building.litWindows.has(windowKey)) {
                    building.litWindows.delete(windowKey);
                } else {
                    building.litWindows.add(windowKey);
                }
            }
        }
    }
    for (let i = 0; i < 3; i++) {
        lightOrbs.push(new LightOrb(mouseX, mouseY));
    }
    isMousePressed = true;
}

function mouseReleased() {
    isMousePressed = false;
}

function mouseDragged() {
    for (let i = 0; i < 2; i++) {
        particles.push(new GlowParticle(mouseX, mouseY));
    }
}

function keyPressed() {
    switch (key.toLowerCase()) {
        case ' ':
            isRaining = !isRaining;
            if (!isRaining) raindrops = [];
            break;
        case 'r':
            generateCity();
            particles = [];
            lightOrbs = [];
            break;
        case 'f':
            fogDensity = fogDensity === 1 ? 2 : fogDensity === 2 ? 0.5 : 1;
            break;
        case 'v':
            let vine = new Vine(mouseX, mouseY);
            vines.push(vine);
            break;
        // REMOVE bird flyby (case 'b')
        case 'a':
            atmosphereMode = (atmosphereMode + 1) % 3;
            break;
    }
}

function spawnBirdFlock() {
    let flockY = random(50, height * 0.4);
    for (let i = 0; i < random(5, 12); i++) {
        birds.push(new Bird(-50 - i * 20, flockY + random(-30, 30)));
    }
}

// Particle Classes
class DustMote {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(1, 3);
        this.speed = random(0.2, 0.8);
        this.offset = random(1000);
    }
    update() {
        this.x += noise(this.offset) * 2 - 1 + sin(windDirection) * 0.5;
        this.y += this.speed;
        this.offset += 0.01;
        if (this.y > height) {
            this.y = -10;
            this.x = random(width);
        }
    }
    draw() {
        fill(200, 180, 140, 60);
        noStroke();
        ellipse(this.x, this.y, this.size);
    }
}

class GlowParticle {
    constructor(x, y) {
        this.x = x + random(-10, 10);
        this.y = y + random(-10, 10);
        this.vx = random(-2, 2);
        this.vy = random(-3, -1);
        this.life = 255;
        this.size = random(3, 8);
        this.color = color(random(200, 255), random(150, 220), random(50, 150));
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= 3;
        this.size *= 0.99;
    }
    draw() {
        push();
        drawingContext.shadowColor = this.color.toString();
        drawingContext.shadowBlur = 10;
        fill(red(this.color), green(this.color), blue(this.color), this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }
    isDead() {
        return this.life <= 0;
    }
}

class LightOrb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x + random(-100, 100);
        this.targetY = y + random(-50, -150);
        this.life = 180;
        this.size = random(5, 12);
    }
    update() {
        this.x = lerp(this.x, this.targetX, 0.02);
        this.y = lerp(this.y, this.targetY, 0.02);
        this.life -= 1;
    }
    draw() {
        push();
        drawingContext.shadowColor = 'rgba(255, 220, 100, 0.8)';
        drawingContext.shadowBlur = 20;
        fill(255, 220, 100, this.life);
        noStroke();
        ellipse(this.x, this.y, this.size);
        drawingContext.shadowBlur = 0;
        pop();
    }
    isDead() {
        return this.life <= 0;
    }
}

class Vine {
    constructor(startX, startY) {
        this.points = [];
        let x = startX;
        let y = startY;
        for (let i = 0; i < random(80, 150); i++) {
            x += random(-4, 4);
            y -= random(1, 4);
            if (y < 0) break;
            this.points.push({
                x: x,
                y: y,
                size: random(1, 3),
                hasLeaf: random() > 0.8
            });
        }
    }
    draw() {
        stroke(40, 60, 30, 200);
        strokeWeight(2);
        noFill();
        beginShape();
        for (let point of this.points) {
            let wobble = noise(point.x * 0.01, point.y * 0.01, noiseOffset) * 2;
            vertex(point.x + wobble, point.y);
        }
        endShape();
        fill(45, 70, 35, 180);
        noStroke();
        for (let point of this.points) {
            if (point.hasLeaf) {
                let wobble = noise(point.x * 0.01, point.y * 0.01, noiseOffset) * 2;
                ellipse(point.x + wobble, point.y, point.size * 3, point.size * 4);
            }
        }
    }
}

class Crack {
    constructor() {
        this.points = [];
        let x = random(width);
        let y = random(height * 0.4, height);
        for (let i = 0; i < random(40, 100); i++) {
            x += random(-3, 3);
            y += random(-2, 4);
            this.points.push({x: x, y: y});
        }
    }
    draw() {
        stroke(40, 35, 30, 120);
        strokeWeight(1);
        noFill();
        beginShape();
        for (let point of this.points) {
            vertex(point.x, point.y);
        }
        endShape();
    }
}

class Raindrop {
    constructor() {
        this.x = random(width);
        this.y = -10;
        this.speed = random(8, 15);
        this.length = random(10, 25);
    }
    update() {
        this.x += sin(windDirection) * 2;
        this.y += this.speed;
    }
    draw() {
        stroke(150, 180, 200, 120);
        strokeWeight(1);
        line(this.x, this.y, this.x, this.y + this.length);
    }
}

class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = random(2, 4);
        this.wingPhase = random(TWO_PI);
        this.size = random(3, 6);
    }
    update() {
        this.x += this.speed;
        this.y += sin(this.x * 0.01 + this.wingPhase) * 0.5;
        this.wingPhase += 0.3;
    }
    draw() {
        push();
        translate(this.x, this.y);
        stroke(80, 70, 60);
        strokeWeight(2);
        let wingFlap = sin(this.wingPhase);
        line(-this.size, wingFlap * 2, this.size, -wingFlap * 2);
        line(-this.size, -wingFlap * 2, this.size, wingFlap * 2);
        pop();
    }
}

function windowResized() {
    resizeCanvas(1920, 1080);
    createPlaceholderEffects();
}
