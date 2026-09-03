export class SVGraphAnalytics {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = options.width || 600;
    this.height = options.height || 200;
    this.padding = options.padding || 30;
    this.points = options.data || []; // Array of {x, y} ou valores brutos
    this.color = options.color || '#00ffcc';

    this.initSVG();
  }

  initSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.style.overflow = 'visible';

    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('fill', 'none');
    this.path.setAttribute('stroke', this.color);
    this.path.setAttribute('stroke-width', '3');
    this.path.setAttribute('stroke-linecap', 'round');
    this.path.setAttribute('stroke-linejoin', 'round');

    this.svg.appendChild(this.path);
    this.container.innerHTML = '';
    this.container.appendChild(this.svg);
  }

  updateData(newData) {
    this.points = newData;
    this.draw();
  }

  draw() {
    if (this.points.length === 0) return;

    const maxVal = Math.max(...this.points);
    const minVal = Math.min(...this.points);
    
    // Normalizar os pontos
    const dx = (this.width - 2 * this.padding) / Math.max(1, (this.points.length - 1));
    const rangeY = maxVal - minVal || 1;
    const dy = (this.height - 2 * this.padding) / rangeY;

    let pathData = '';

    this.points.forEach((val, i) => {
      const x = this.padding + i * dx;
      const y = this.height - this.padding - (val - minVal) * dy;
      
      if (i === 0) {
        pathData += `M ${x},${y} `;
      } else {
        pathData += `L ${x},${y} `;
      }
    });

    this.path.setAttribute('d', pathData);

    // Animação GSAP no stroke
    const totalLength = this.path.getTotalLength();
    window.gsap.set(this.path, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
    window.gsap.to(this.path, { strokeDashoffset: 0, duration: 1.5, ease: 'power3.out' });
  }
}
