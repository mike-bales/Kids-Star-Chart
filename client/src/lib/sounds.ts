import { Howl } from 'howler';

// Multiple sounds per event — one plays at random each time
// Add more files to each array to expand the pool
const starSounds = [
  new Howl({ src: ['/sounds/star-1.wav', '/sounds/star-1.mp3'], volume: 0.7 }),
  new Howl({ src: ['/sounds/star-2.wav', '/sounds/star-2.mp3'], volume: 0.7 }),
  new Howl({ src: ['/sounds/star-3.wav', '/sounds/star-3.mp3'], volume: 0.7 }),
];

const celebrationSounds = [
  new Howl({ src: ['/sounds/celebration-1.wav', '/sounds/celebration-1.mp3'], volume: 0.8 }),
  new Howl({ src: ['/sounds/celebration-2.wav', '/sounds/celebration-2.mp3'], volume: 0.8 }),
  new Howl({ src: ['/sounds/celebration-3.wav', '/sounds/celebration-3.mp3'], volume: 0.8 }),
];

const clickSounds = [
  new Howl({ src: ['/sounds/click-1.wav', '/sounds/click-1.mp3'], volume: 0.5 }),
  new Howl({ src: ['/sounds/click-2.wav', '/sounds/click-2.mp3'], volume: 0.5 }),
  new Howl({ src: ['/sounds/click-3.wav', '/sounds/click-3.mp3'], volume: 0.5 }),
];

// Also keep the old filenames as fallbacks so existing sounds still work
const fallbackStar = new Howl({ src: ['/sounds/star-earned.wav', '/sounds/star-earned.mp3'], volume: 0.7 });
const fallbackCelebration = new Howl({ src: ['/sounds/celebration.wav', '/sounds/celebration.mp3'], volume: 0.8 });
const fallbackClick = new Howl({ src: ['/sounds/click.wav', '/sounds/click.mp3'], volume: 0.5 });

function playRandom(sounds: Howl[], fallback: Howl) {
  // Try a random sound from the pool
  const index = Math.floor(Math.random() * sounds.length);
  const sound = sounds[index];

  // Howler sets state to 'loaded' once the file is ready
  if (sound.state() === 'loaded') {
    sound.play();
  } else {
    // If the numbered file doesn't exist, use the fallback
    fallback.play();
  }
}

export function playStarEarned() {
  playRandom(starSounds, fallbackStar);
}

export function playCelebration() {
  playRandom(celebrationSounds, fallbackCelebration);
}

export function playClick() {
  playRandom(clickSounds, fallbackClick);
}
