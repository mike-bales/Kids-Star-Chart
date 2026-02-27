import confetti from 'canvas-confetti';

export function fireStarConfetti() {
  // Fire from both sides
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function fireStarBurst() {
  // Single burst for earning a star
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500'],
    shapes: ['star'],
    scalar: 1.2,
  });
}
