/**
 * Canvas-based Tank Visualizer for Browser
 * ES Module version of the TypeScript visualizer
 */

export class TankVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width ?? 600;
    this.height = options.height ?? 400;
    this.currentConfig = null;
    this.currentFillLevel = 0;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.border = '1px solid #ddd';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.backgroundColor = '#fafafa';
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    
    container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) throw new Error('Could not initialize canvas context');
    
    this.drawPlaceholder();
  }

  drawPlaceholder() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#999';
    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Configure tank to visualize', this.width / 2, this.height / 2);
  }

  updateTank(config, fillLevel) {
    this.currentConfig = config;
    this.currentFillLevel = fillLevel;
    this.render();
  }

  render() {
    if (!this.currentConfig) return;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    switch (this.currentConfig.type) {
      case 'cylindrical':
        this.drawCylindrical();
        break;
      case 'rectangular':
        this.drawRectangular();
        break;
      case 'spherical':
        this.drawSpherical();
        break;
      case 'conical':
        this.drawConical();
        break;
      case 'elliptical':
        this.drawElliptical();
        break;
      default:
        this.drawPlaceholder();
    }
    
    this.drawOverlay();
  }

  drawCylindrical() {
    const dims = this.currentConfig.dimensions;
    const isHorizontal = this.currentConfig.orientation === 'horizontal';
    const diameter = dims.diameter || dims.radius * 2 || 1;
    const tankHeight = dims.height || 1;
    const maxDim = isHorizontal ? tankHeight : diameter;
    const fillPercent = Math.min(100, Math.max(0, (this.currentFillLevel / (isHorizontal ? diameter : tankHeight)) * 100));
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const padding = 40;
    const availableWidth = this.width - padding * 2;
    const availableHeight = this.height - padding * 2;
    
    let w, h;
    if (isHorizontal) {
      const scale = Math.min(availableWidth / tankHeight, availableHeight / diameter);
      w = tankHeight * scale;
      h = diameter * scale;
    } else {
      const scale = Math.min(availableWidth / diameter, availableHeight / tankHeight);
      w = diameter * scale;
      h = tankHeight * scale;
    }
    
    const x = centerX - w / 2;
    const y = centerY - h / 2;
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, w, h);
    
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + h / 2, 8, h / 2, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.ellipse(x + w, y + h / 2, 8, h / 2, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    
    const liquidH = (h * fillPercent) / 100;
    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    this.ctx.fillRect(x, y + h - liquidH, w, liquidH);
    
    this.ctx.strokeStyle = '#2980b9';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y + h - liquidH);
    this.ctx.lineTo(x + w + 15, y + h - liquidH);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawRectangular() {
    const dims = this.currentConfig.dimensions;
    const length = dims.length || 1;
    const width = dims.width || 1;
    const height = dims.height || 1;
    const fillPercent = Math.min(100, Math.max(0, (this.currentFillLevel / height) * 100));
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const padding = 40;
    const scale = Math.min((this.width - padding * 2) / length, (this.height - padding * 2) / height);
    
    const w = length * scale;
    const h = height * scale;
    const x = centerX - w / 2;
    const y = centerY - h / 2;
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + 20, y - 15);
    this.ctx.lineTo(x + w + 20, y - 15);
    this.ctx.lineTo(x + w, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#bdc3c7';
    this.ctx.beginPath();
    this.ctx.moveTo(x + w, y);
    this.ctx.lineTo(x + w + 20, y - 15);
    this.ctx.lineTo(x + w + 20, y + h - 15);
    this.ctx.lineTo(x + w, y + h);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, w, h);
    
    const liquidH = (h * fillPercent) / 100;
    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    this.ctx.fillRect(x, y + h - liquidH, w, liquidH);
    
    if (fillPercent > 0) {
      this.ctx.fillStyle = 'rgba(41, 128, 185, 0.8)';
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + h - liquidH);
      this.ctx.lineTo(x + 20, y + h - liquidH - 15);
      this.ctx.lineTo(x + w + 20, y + h - liquidH - 15);
      this.ctx.lineTo(x + w, y + h - liquidH);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  drawSpherical() {
    const dims = this.currentConfig.dimensions;
    const diameter = dims.diameter || dims.radius * 2 || 1;
    const fillPercent = Math.min(100, Math.max(0, (this.currentFillLevel / diameter) * 100));
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 3;
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    this.ctx.clip();
    
    const liquidY = centerY + radius - (2 * radius * fillPercent) / 100;
    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    this.ctx.fillRect(centerX - radius, liquidY, radius * 2, radius * 2);
    
    this.ctx.restore();
    
    this.ctx.strokeStyle = '#2980b9';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - radius - 15, liquidY);
    this.ctx.lineTo(centerX + radius + 15, liquidY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawConical() {
    const dims = this.currentConfig.dimensions;
    const height = dims.height || 1;
    const topDiameter = dims.topDiameter || 0;
    const bottomDiameter = dims.bottomDiameter || 0;
    const fillPercent = Math.min(100, Math.max(0, (this.currentFillLevel / height) * 100));
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const padding = 60;
    const scale = Math.min((this.width - padding * 2) / Math.max(topDiameter, bottomDiameter), (this.height - padding * 2) / height);
    
    const h = height * scale;
    const topW = topDiameter * scale;
    const bottomW = bottomDiameter * scale;
    
    const x = centerX;
    const y = centerY - h / 2;
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x - bottomW / 2, y + h);
    this.ctx.lineTo(x + bottomW / 2, y + h);
    this.ctx.lineTo(x + topW / 2, y);
    this.ctx.lineTo(x - topW / 2, y);
    this.ctx.closePath();
    this.ctx.stroke();
    
    const liquidH = (h * fillPercent) / 100;
    const liquidTopW = bottomW + (topW - bottomW) * (liquidH / h);
    
    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    this.ctx.beginPath();
    this.ctx.moveTo(x - bottomW / 2, y + h);
    this.ctx.lineTo(x + bottomW / 2, y + h);
    this.ctx.lineTo(x + liquidTopW / 2, y + h - liquidH);
    this.ctx.lineTo(x - liquidTopW / 2, y + h - liquidH);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawElliptical() {
    const dims = this.currentConfig.dimensions;
    const major = dims.majorDiameter || 1;
    const minor = dims.minorDiameter || 1;
    const length = dims.length || 1;
    const fillPercent = Math.min(100, Math.max(0, (this.currentFillLevel / minor) * 100));
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const padding = 40;
    const scale = Math.min((this.width - padding * 2) / length, (this.height - padding * 2) / major);
    
    const w = length * scale;
    const h = major * scale;
    const x = centerX - w / 2;
    const y = centerY - h / 2;
    
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x, y, w, h);
    
    this.ctx.beginPath();
    this.ctx.ellipse(x, centerY, 10, h / 2, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.ellipse(x + w, centerY, 10, h / 2, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    
    const liquidH = (h * fillPercent) / 100;
    this.ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    this.ctx.fillRect(x, y + h - liquidH, w, liquidH);
  }

  drawOverlay() {
    if (!this.currentConfig) return;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(10, 10, 180, 70);
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(10, 10, 180, 70);
    
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '12px system-ui, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Type: ${this.currentConfig.type}`, 20, 30);
    this.ctx.fillText(`Fill: ${this.currentFillLevel.toFixed(2)}m`, 20, 50);
    this.ctx.fillText(`${Math.min(100, Math.max(0, (this.currentFillLevel / this.getMaxHeight()) * 100)).toFixed(1)}%`, 20, 70);
  }

  getMaxHeight() {
    if (!this.currentConfig) return 1;
    const dims = this.currentConfig.dimensions;
    switch (this.currentConfig.type) {
      case 'cylindrical':
        return this.currentConfig.orientation === 'horizontal' ? (dims.diameter || 1) : (dims.height || 1);
      case 'rectangular':
      case 'conical':
        return dims.height || 1;
      case 'spherical':
        return dims.diameter || 1;
      case 'elliptical':
        return dims.minorDiameter || 1;
      default:
        return 1;
    }
  }

  destroy() {
    this.canvas.remove();
  }
}
