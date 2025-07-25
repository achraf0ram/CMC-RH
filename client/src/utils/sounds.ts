// Import sound files
import notificationSound from '../assets/sounds/notification.mp3';

// Create audio object
const notificationAudio = new Audio(notificationSound);

// Preload audio file
notificationAudio.load();

// Fallback function using public directory
export const playNotificationSoundFallback = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
}; 