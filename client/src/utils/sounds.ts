// Create audio object for notification sound
const notificationAudio = new Audio('/nootification.mp3');

// Preload audio file
notificationAudio.load();

// Function to play notification sound
export const playNotificationSound = () => {
  try {
    // Reset audio to beginning
    notificationAudio.currentTime = 0;
    // Play the sound
    notificationAudio.play().catch(e => {
      console.warn('Failed to play notification sound:', e);
    });
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
};

// Fallback function using public directory
export const playNotificationSoundFallback = () => {
  try {
    const audio = new Audio('/nootification.mp3');
    audio.play().catch(e => {});
  } catch (error) {
    // Silent error handling
  }
}; 