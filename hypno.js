class HypnoEffect {
    constructor(options = {}) {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.time = 0;
        
        // Configuration
        this.config = {
            intensity: options.intensity || 1.0,
            speed: options.speed || 0.02,
            waveAmplitude: options.waveAmplitude || 50,
            spiralSpeed: options.spiralSpeed || 0.03,
            distortionStrength: options.distortionStrength || 30,
            ...options
        };
        
        // Colors
        this.colors = {
            pink: '#ff1493',
            black: '#000000',
            blue: '#4169e1',
            darkPink: '#c71585',
            darkBlue: '#191970'
        };
        
        this.init();
    }
    
    init() {
        // Create fullscreen canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Style the canvas
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '9999';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.mixBlendMode = 'multiply';
        
        // Set canvas size
        this.resize();
        
        // Add to document
        document.body.appendChild(this.canvas);
        
        // Setup event listeners
        window.addEventListener('resize', () => this.resize());
        
        // Start animation
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createRadialGradient(centerX, centerY, radius, colors, stops) {
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        for (let i = 0; i < colors.length; i++) {
            gradient.addColorStop(stops[i], colors[i]);
        }
        return gradient;
    }
    
    drawWavyDistortion() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create multiple wave layers
        for (let layer = 0; layer < 3; layer++) {
            this.ctx.save();
            
            // Set blend mode for layering effect
            this.ctx.globalCompositeOperation = layer === 0 ? 'normal' : 'screen';
            this.ctx.globalAlpha = 0.6 - layer * 0.15;
            
            const waveOffset = this.time * this.config.speed + layer * Math.PI / 3;
            const amplitude = this.config.waveAmplitude * (1 - layer * 0.2);
            
            // Draw wavy lines radiating from center
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
                this.ctx.beginPath();
                
                const color = layer === 0 ? this.colors.pink : 
                             layer === 1 ? this.colors.blue : this.colors.darkPink;
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 3 + layer;
                
                let prevX = centerX;
                let prevY = centerY;
                
                for (let radius = 20; radius < Math.max(width, height); radius += 10) {
                    const waveX = Math.cos(angle + waveOffset + radius * 0.01) * amplitude * Math.sin(radius * 0.02 + waveOffset);
                    const waveY = Math.sin(angle + waveOffset + radius * 0.01) * amplitude * Math.cos(radius * 0.02 + waveOffset);
                    
                    const x = centerX + Math.cos(angle) * radius + waveX;
                    const y = centerY + Math.sin(angle) * radius + waveY;
                    
                    if (radius === 20) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.quadraticCurveTo(prevX, prevY, x, y);
                    }
                    
                    prevX = x;
                    prevY = y;
                }
                
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    drawSpiralPattern() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.sqrt(width * width + height * height) / 2;
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        
        // Draw multiple spirals
        for (let spiral = 0; spiral < 2; spiral++) {
            const spiralOffset = spiral * Math.PI;
            const direction = spiral === 0 ? 1 : -1;
            
            for (let i = 0; i < 8; i++) {
                this.ctx.beginPath();
                
                const hue = (i / 8) * 360;
                const color = i % 3 === 0 ? this.colors.pink : 
                             i % 3 === 1 ? this.colors.blue : this.colors.black;
                             
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.4;
                
                let prevX, prevY;
                
                for (let radius = 10; radius < maxRadius; radius += 2) {
                    const angle = (radius * 0.1 + this.time * this.config.spiralSpeed * direction + spiralOffset) + (i * Math.PI / 4);
                    const wave = Math.sin(radius * 0.05 + this.time * this.config.speed * 2) * this.config.distortionStrength;
                    
                    const x = centerX + Math.cos(angle) * (radius + wave);
                    const y = centerY + Math.sin(angle) * (radius + wave);
                    
                    if (radius === 10) {
                        this.ctx.moveTo(x, y);
                        prevX = x;
                        prevY = y;
                    } else {
                        this.ctx.quadraticCurveTo(prevX, prevY, x, y);
                        prevX = x;
                        prevY = y;
                    }
                }
                
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawPulsingCircles() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        
        for (let i = 0; i < 5; i++) {
            const pulse = Math.sin(this.time * this.config.speed * 3 + i * Math.PI / 2) * 0.5 + 0.5;
            const radius = (50 + i * 80) * (1 + pulse * 0.3);
            
            const colors = [this.colors.pink, this.colors.blue, this.colors.black, this.colors.darkPink, this.colors.darkBlue];
            const gradient = this.createRadialGradient(centerX, centerY, radius, 
                [colors[i], 'transparent'], [0, 1]);
            
            this.ctx.globalAlpha = 0.1 + pulse * 0.1;
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    applyScreenDistortion() {
        const { width, height } = this.canvas;
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Create distortion effect
        for (let x = 0; x < width; x += 4) {
            for (let y = 0; y < height; y += 4) {
                const centerX = width / 2;
                const centerY = height / 2;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                const wave = Math.sin(distance * 0.02 + this.time * this.config.speed * 4) * this.config.distortionStrength * 0.5;
                const sourceX = Math.round(x + wave);
                const sourceY = Math.round(y + Math.cos(distance * 0.03 + this.time * this.config.speed * 3) * wave);
                
                if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
                    const targetIndex = (y * width + x) * 4;
                    const sourceIndex = (sourceY * width + sourceX) * 4;
                    
                    if (targetIndex < data.length && sourceIndex < data.length) {
                        data[targetIndex] = data[sourceIndex];     // R
                        data[targetIndex + 1] = data[sourceIndex + 1]; // G
                        data[targetIndex + 2] = data[sourceIndex + 2]; // B
                        data[targetIndex + 3] = data[sourceIndex + 3]; // A
                    }
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    animate() {
        this.time += 1;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw effects in layers
        this.drawPulsingCircles();
        this.drawSpiralPattern();
        this.drawWavyDistortion();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // Control methods
    start() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        window.removeEventListener('resize', this.resize);
    }
    
    setIntensity(intensity) {
        this.config.intensity = Math.max(0, Math.min(2, intensity));
        this.config.waveAmplitude = 50 * this.config.intensity;
        this.config.distortionStrength = 30 * this.config.intensity;
    }
    
    setSpeed(speed) {
        this.config.speed = Math.max(0.001, Math.min(0.1, speed));
        this.config.spiralSpeed = this.config.speed * 1.5;
    }
}

// Usage example and initialization
let hypnoEffect;

function startHypnoEffect(options = {}) {
    if (hypnoEffect) {
        hypnoEffect.destroy();
    }
    hypnoEffect = new HypnoEffect(options);
    return hypnoEffect;
}

function stopHypnoEffect() {
    if (hypnoEffect) {
        hypnoEffect.destroy();
        hypnoEffect = null;
    }
}

// Auto-start when script loads (remove this if you want manual control)
document.addEventListener('DOMContentLoaded', () => {
    startHypnoEffect({
        intensity: 1.0,
        speed: 0.02,
        waveAmplitude: 50,
        spiralSpeed: 0.03,
        distortionStrength: 30
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HypnoEffect, startHypnoEffect, stopHypnoEffect };
}