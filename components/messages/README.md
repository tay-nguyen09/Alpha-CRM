# Meta Messages Components

React components để tích hợp messages functionality vào app khác.

## Components

### MessagesContainer
Main container component chứa toàn bộ messages UI.

```tsx
import { MessagesContainer } from '@/components/messages/MessagesContainer';

<MessagesContainer 
  apiBaseUrl="http://localhost:3000"  // Optional, default ""
  className="your-class"               // Optional
  style={{ height: '100vh' }}          // Optional
/>
```

### ConversationList
Sidebar hiển thị danh sách conversations.

### MessageThread
Area hiển thị tin nhắn của conversation đang chọn.

## Types

```typescript
interface ChatMessage {
    from: 'customer' | 'agent';
    text: string;
    at: string;
}

interface Conversation {
    conversationId: string;
    pageId: string;
    psid: string;
    customerName: string;
    updatedAt: string;
    messages: ChatMessage[];
}
```

## Integration Example

```tsx
// In your other app
import { MessagesContainer } from './components/messages/MessagesContainer';

export default function MyApp() {
  return (
    <div>
      <h1>My App</h1>
      <MessagesContainer apiBaseUrl="https://your-api.com" />
    </div>
  );
}
```

## Features

- ✅ Auto-polling every 15s
- ✅ Infinite scroll
- ✅ Multi-page support
- ✅ Unread highlights
- ✅ Avatar display
- ✅ Business Suite links
