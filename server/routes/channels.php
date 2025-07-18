<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private chat channels - users can only listen to their own chat channel
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    \Log::info('Channel authorization attempt', [
        'user_id' => $user->id,
        'requested_user_id' => $userId,
        'authorized' => (int) $user->id === (int) $userId
    ]);
    return (int) $user->id === (int) $userId;
});

// Public notification channel - all authenticated users can listen
Broadcast::channel('notifications', function ($user) {
    return true;
});

// Public requests channel - all authenticated users can listen
Broadcast::channel('requests', function ($user) {
    return true;
}); 