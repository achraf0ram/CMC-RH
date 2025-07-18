<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $toUserId;

    public function __construct(ChatMessage $message, $toUserId)
    {
        $this->message = $message;
        $this->toUserId = $toUserId;
    }

    public function broadcastOn()
    {
        // قناة خاصة لكل مستخدم
        return new PrivateChannel('chat.' . $this->toUserId);
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'from_user_id' => $this->message->from_user_id,
            'to_user_id' => $this->message->to_user_id,
            'message' => $this->message->message,
            'is_urgent' => $this->message->is_urgent,
            'is_read' => $this->message->is_read,
            'created_at' => $this->message->created_at,
        ];
    }
}
