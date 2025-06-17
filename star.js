document.addEventListener('DOMContentLoaded', () => {
    const createStar = () => {
      const star = document.createElement('div');
      star.classList.add('star');
      document.body.appendChild(star);
  
      const size = Math.random() * 10 + 5;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.position = 'absolute';
      star.style.background = 'rgba(255, 255, 255, 0.56)';
      star.style.borderRadius = '50%';
      star.style.boxShadow = '0 0 10px rgb(255, 255, 255)';
      star.style.top = `${Math.random() * window.innerHeight}px`;
      star.style.left = `${Math.random() * window.innerWidth}px`;
  
      anime({
        targets: star,
        translateY: [0, -window.innerHeight],
        opacity: [1, 0],
        duration: Math.random() * 8000 + 8000,
        easing: 'easeOutQuad',
        complete: () => star.remove(),
      });
    };
  
    setInterval(createStar, 100);
  });