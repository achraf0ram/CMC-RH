// Import sound files
import notificationSound from '../assets/sounds/notification.mp3';
import messageSound from '../assets/sounds/message.mp3';

// Create audio objects
const notificationAudio = new Audio(notificationSound);
const messageAudio = new Audio(messageSound);

// Preload audio files
notificationAudio.load();
messageAudio.load();

export const playNotificationSound = () => {
  try {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
};

export const playMessageSound = () => {
  try {
    // استخدم الصوت من public مباشرة
    const audio = new Audio('/message.mp3');
    audio.currentTime = 0;
    audio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
};

// Fallback function using public directory
export const playNotificationSoundFallback = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
};

export const playMessageSoundFallback = () => {
  try {
    const audio = new Audio('/message.mp3');
    audio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
}; 