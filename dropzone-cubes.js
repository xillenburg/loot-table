// dropzone-cubes.js
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'cube-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const numCubes = 80;
  const cubes = [];
  const friction = 0.98;
  const maxSpeed = 2.0;

  const colors = ['rgba(121, 121, 121, 1)', 'rgba(88, 185, 88, 1)', 'rgba(197, 231, 133, 1)', 'rgba(105, 80, 60, 1)', 'rgba(255, 255, 255, 1)'];

  // Get the actual position of the upload-box element
  function getDropBoxPosition() {
    const uploadBox = document.querySelector('.upload-box');
    if (uploadBox) {
      const rect = uploadBox.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        border: 3
      };
    }
    // Fallback to centered position if element not found
    return {
      width: 300,
      height: 200,
      x: width / 2 - 150,
      y: height / 2 - 100,
      border: 3
    };
  }

  let dropBox = getDropBoxPosition();

  class Cube {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = 6 + Math.random() * 8;
      this.vx = (Math.random() - 0.5) * 0.1;
      this.vy = (Math.random() - 0.5) * 0.1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(mouse) {
      // Update drop box position in case of scrolling/resizing
      dropBox = getDropBoxPosition();

      // Apply friction to gradually slow down
      this.vx *= friction;
      this.vy *= friction;

      // Limit maximum speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      let distFromMouse = Infinity;
      
      // Mouse interaction
      if (mouse) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        distFromMouse = Math.sqrt(dx * dx + dy * dy);
        const minDist = 120;
        if (distFromMouse < minDist) {
          const angle = Math.atan2(dy, dx);
          const force = (minDist - distFromMouse) / minDist;
          this.vx += Math.cos(angle) * force * 0.9;
          this.vy += Math.sin(angle) * force * 0.9;
        }
      }

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Collision with screen boundaries
      if (this.x < 0) {
        this.x = 0;
        this.vx *= -0.8;
      } else if (this.x > width - this.size) {
        this.x = width - this.size;
        this.vx *= -0.8;
      }
      
      if (this.y < 0) {
        this.y = 0;
        this.vy *= -0.8;
      } else if (this.y > height - this.size) {
        this.y = height - this.size;
        this.vy *= -0.8;
      }

      // Collision with drop box boundaries
      this.collideWithDropBox();

      // Reset if moving too slowly and not near mouse
      const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (currentSpeed < 0.01 && distFromMouse > 180) {
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = (Math.random() - 0.5) * 0.05;
      }
    }

    collideWithDropBox() {
      const boxLeft = dropBox.x;
      const boxRight = dropBox.x + dropBox.width;
      const boxTop = dropBox.y;
      const boxBottom = dropBox.y + dropBox.height;

      const cubeLeft = this.x;
      const cubeRight = this.x + this.size;
      const cubeTop = this.y;
      const cubeBottom = this.y + this.size;

      // Check if cube is overlapping with drop box
      if (cubeRight > boxLeft && cubeLeft < boxRight && cubeBottom > boxTop && cubeTop < boxBottom) {
        
        // Determine collision side and bounce accordingly
        const overlapLeft = cubeRight - boxLeft;
        const overlapRight = boxRight - cubeLeft;
        const overlapTop = cubeBottom - boxTop;
        const overlapBottom = boxBottom - cubeTop;

        // Find the smallest overlap to determine collision side
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
          // Collision with left side of drop box
          this.x = boxLeft - this.size;
          this.vx *= -0.8;
        } else if (minOverlap === overlapRight) {
          // Collision with right side of drop box
          this.x = boxRight;
          this.vx *= -0.8;
        } else if (minOverlap === overlapTop) {
          // Collision with top side of drop box
          this.y = boxTop - this.size;
          this.vy *= -0.8;
        } else if (minOverlap === overlapBottom) {
          // Collision with bottom side of drop box
          this.y = boxBottom;
          this.vy *= -0.8;
        }
      }
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  for (let i = 0; i < numCubes; i++) {
    cubes.push(new Cube());
  }

  let mouse = null;
  canvas.addEventListener('mousemove', (e) => {
    mouse = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('mouseleave', () => { mouse = null; });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw drop box (optional visual)
    ctx.strokeStyle = 'rgba(85, 85, 85, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(dropBox.x, dropBox.y, dropBox.width, dropBox.height);
    ctx.setLineDash([]);
    
    // Draw cubes
    for (const cube of cubes) {
      cube.update(mouse);
      cube.draw(ctx);
    }
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    dropBox = getDropBoxPosition(); // Update drop box position on resize
  });

  // Also update on scroll in case the page scrolls
  window.addEventListener('scroll', () => {
    dropBox = getDropBoxPosition();
  });
})();