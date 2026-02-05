# 📘 ALPHANET ADMIN - QUY TRÌNH HOẠT ĐỘNG ỨNG DỤNG

> **Tài liệu chi tiết về kiến trúc, quy trình và luồng dữ liệu của hệ thống**
> 
> **Phiên bản**: 2.0 | **Ngày cập nhật**: 26/01/2026 | **Framework**: Next.js 16.1.1

---

## 📑 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc ứng dụng](#2-kiến-trúc-ứng-dụng)
3. [Quy trình xác thực](#3-quy-trình-xác-thực-authentication-flow)
4. [Tích hợp Facebook Messenger](#4-tích-hợp-facebook-messenger)
5. [Quản lý tin nhắn realtime](#5-quản-lý-tin-nhắn-realtime)
6. [Redux State Management](#6-redux-state-management)
7. [API Routes chi tiết](#7-api-routes-chi-tiết)
8. [Firebase Firestore Structure](#8-firebase-firestore-structure)
9. [Quy trình gửi tin nhắn](#9-quy-trình-gửi-tin-nhắn)
10. [Multi-tenant và phân quyền](#10-multi-tenant-và-phân-quyền)
11. [Testing Guidelines](#11-testing-guidelines)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả
**Alphanet Admin** là hệ thống quản lý tin nhắn Facebook Messenger cho nhiều tài khoản (multi-tenant) được xây dựng trên nền tảng Next.js, tích hợp với:
- **Clerk**: Authentication & User Management
- **Firebase Firestore**: Database & Real-time sync
- **Facebook Graph API**: Messenger integration
- **Redux Toolkit**: State management với real-time listeners

### 1.2 Đặc điểm chính
- ✅ Multi-database support (mỗi team có database riêng)
- ✅ Real-time message sync qua Firestore listeners
- ✅ OAuth integration với Facebook Pages
- ✅ Webhook handler cho Facebook events
- ✅ Encrypted token storage (AES-256-GCM)
- ✅ Role-based access control (Admin/Leader/Sale/Manage)
- ✅ 24-hour messaging window tracking

### 1.3 Tech Stack
```json
{
  "Frontend": "React 19.2.0 + Next.js 16.1.1",
  "State Management": "Redux Toolkit 2.11.1",
  "Database": "Firebase Firestore (multi-database)",
  "Authentication": "Clerk 6.36.0",
  "UI": "Tailwind CSS 4.1.17 + Radix UI",
  "API": "Next.js API Routes + Facebook Graph API v24.0",
  "Encryption": "Node crypto (AES-256-GCM)"
}
```

---

## 2. KIẾN TRÚC ỨNG DỤNG

### 2.1 Sơ đồ kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  React Pages    │  │  Redux Store │  │  Firebase SDK    │   │
│  │  (Next.js App)  │←→│  (RTK)       │←→│  (Realtime)      │   │
│  └─────────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                    NEXT.JS SERVER (Edge/Node)                    │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Middleware    │  │  API Routes     │  │  Server Actions │  │
│  │  (Clerk Auth)  │→ │  /api/*         │  │                 │  │
│  └────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────┬───────────────────┬────────────────────────┬─┘
                   │                   │                        │
        ┌──────────▼─────────┐ ┌──────▼────────┐  ┌───────────▼────────┐
        │  Firebase Admin    │ │  Clerk API    │  │  Facebook Graph    │
        │  (Firestore)       │ │  (User Mgmt)  │  │  API (Messenger)   │
        └────────────────────┘ └───────────────┘  └────────────────────┘
                   ▲                                         │
                   │                                         │
                   └─────────────────────────────────────────┘
                            Webhooks (POST /api/webhooks/meta)
```

### 2.2 Cấu trúc thư mục quan trọng

```
alphanet-admin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                   # Main app (requires auth)
│   │   ├── layout.tsx            # Layout với sidebar
│   │   ├── page.tsx              # Dashboard (metrics, charts)
│   │   └── (other-page)/
│   │       ├── (sale)/           # Sale role pages
│   │       │   ├── daily-tasks/
│   │       │   └── (tables)/
│   │       └── (leader)/         # Leader/Admin pages
│   │           ├── ads/
│   │           ├── employees/
│   │           ├── facebook-integration/
│   │           ├── analytic-posts/
│   │           └── short-videos/
│   └── api/                      # API endpoints
│       ├── auth/status/          # Check auth status
│       ├── bootstrap/            # Initialize Firestore
│       ├── contacts/             # Contact management
│       ├── conversation/[id]/    # Single conversation
│       ├── conversations/        # List conversations
│       ├── facebook/             # (Legacy)
│       ├── inbox/send/           # Send messages
│       ├── messages/             # Fetch messages from Graph API
│       ├── meta/                 # Meta OAuth
│       │   ├── oauth/callback/   # OAuth callback
│       │   └── disconnect/       # Disconnect page
│       ├── pages/                # List Facebook pages
│       ├── users/                # User management
│       ├── webhook-health/       # Webhook status check
│       └── webhooks/meta/        # Facebook webhook handler
│
├── components/
│   ├── auth/
│   │   ├── IsAuth.tsx            # Server component - force login
│   │   ├── SignInForm.tsx
│   │   └── SignUpForm.tsx
│   ├── firebase/
│   │   └── FirebaseInit.tsx      # Init Firestore với databaseId
│   ├── messages/                 # (Tìm trong source nếu có)
│   └── common/
│       └── StoreProvider.tsx     # Redux Provider
│
├── context/
│   ├── SidebarContext.tsx
│   └── ThemeContext.tsx
│
├── hooks/
│   ├── useCurrentUser.ts         # Get Clerk user + role
│   ├── useRealtimeMessages.ts    # Firestore listener
│   └── useAdmin.ts
│
├── lib/
│   ├── firebaseConfig.ts         # Client Firebase config
│   ├── firebaseAdmin.ts          # Server Firebase Admin SDK
│   ├── encrypt.ts                # AES-256-GCM encryption
│   ├── tokenCache.ts             # Get access tokens from Firestore
│   ├── meta/
│   │   ├── auth.ts
│   │   ├── constants.ts
│   │   ├── encrypt.ts
│   │   ├── messageUtils.ts
│   │   └── tokenCache.ts
│   └── redux/
│       ├── store.ts              # Redux store config
│       └── features/
│           ├── firebase/
│           │   ├── firebaseSlice.ts
│           │   ├── firebaseAPI.ts
│           │   └── listeners.ts  # Auto-refetch listeners
│           ├── messages/
│           │   └── messagesSlice.ts
│           ├── contacts/
│           ├── campaigns/
│           └── clerk/
│
├── utils/
│   └── shared/
│       └── firebase.ts           # initFirestore(databaseId)
│
├── types/
│   ├── clerk.ts
│   ├── firebase.ts
│   ├── form.ts
│   └── meta.ts
│
├── middleware.ts                 # Clerk middleware (auth check)
├── firestore.rules               # Firestore security rules
└── package.json
```

---

## 3. QUY TRÌNH XÁC THỰC (AUTHENTICATION FLOW)

### 3.1 Sơ đồ luồng đăng nhập

```
┌─────────┐    1. Visit /       ┌──────────────┐
│ Browser │───────────────────→ │  Middleware  │
└─────────┘                      │ (Clerk Auth) │
     ▲                           └──────┬───────┘
     │                                  │ 2. Check auth
     │                           ┌──────▼────────┐
     │          ┌────────────────│ isAuthenticated?│
     │          │ NO             └──────┬────────┘
     │          │                       │ YES
     │   ┌──────▼───────┐        ┌─────▼──────┐
     │   │ Redirect to  │        │  Continue  │
     │   │ /login       │        │  to route  │
     │   └──────────────┘        └────────────┘
     │
     │   3. User enters credentials
     │   ┌────────────────┐
     └───│ Clerk redirects│
         │ back to app    │
         └────────────────┘
```

### 3.2 Chi tiết quy trình

#### **Bước 1: Middleware Check**
File: `middleware.ts`
```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
```
- **Chạy trên**: Mọi request (trừ static files)
- **Chức năng**: Inject Clerk auth vào request context

#### **Bước 2: IsAuth Component**
File: `components/auth/IsAuth.tsx`
```typescript
const IsAuth = async ({ children }) => {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }
  return children
}
```
- **Loại**: Server Component
- **Chạy trên**: Root layout (wrap toàn bộ app)
- **Hành động**: Nếu chưa auth → Redirect đến `/login`

#### **Bước 3: Initialize User Context**
File: `components/firebase/FirebaseInit.tsx`
```typescript
const FirebaseInit = ({ children }) => {
    const { isLoaded, user } = useUser()
    const dispatch = useAppDispatch()

    React.useLayoutEffect(() => {
        // Init Firestore với database của team
        initFirestore(user?.publicMetadata.db as string);
        
        // Set Redux state
        dispatch(setDatabaseName(user?.publicMetadata.db as string || "(default)"))
        dispatch(setTeamId(user?.publicMetadata.team_id as string || "2f"))
    }, [user, isLoaded])

    if (!isLoaded) return <>...loading</>
    return children
}
```

**Dữ liệu trong `user.publicMetadata`:**
```typescript
{
    role: "admin" | "sale" | "manage" | "leader",
    team_id: string,        // VD: "2f", "3a"
    db: string              // VD: "team-2f", "team-3a"
}
```

### 3.3 Phân quyền (Role-Based Access)

**Hook sử dụng**: `useCurrentUser()`
```typescript
const { isLeader, isAdmin, role, publicMetaData } = useCurrentUser()
```

**Roles:**
- **admin**: Full access (mọi chức năng)
- **leader**: Quản lý team (xem báo cáo, ads, employees)
- **manage**: Quản lý vừa (xem một số báo cáo)
- **sale**: Nhân viên sale (daily tasks, inbox)

**Ví dụ conditional rendering:**
```tsx
{isLeader && <ChartPieSeparatorNone />}
{role === "sale" && <Link href="/daily-tasks">Tasks</Link>}
```

---

## 4. TÍCH HỢP FACEBOOK MESSENGER

### 4.1 Sơ đồ OAuth Flow

```
┌──────────┐  1. Click "Connect FB"    ┌───────────────┐
│  Admin   │───────────────────────────→│  Next.js App  │
│   User   │                             └───────┬───────┘
└──────────┘                                     │
      ▲                                          │ 2. Redirect to FB
      │                                          ▼
      │                             ┌────────────────────────┐
      │                             │  Facebook OAuth Dialog │
      │                             │  - Grant page access   │
      │                             │  - messages_read       │
      │                             │  - messages_write      │
      │                             └───────┬────────────────┘
      │                                     │ 3. User approves
      │                                     ▼
      │  5. Redirect back          ┌───────────────────────┐
      └────────────────────────────│  /api/meta/oauth/     │
                                   │  callback?code=XXX    │
                                   └───────┬───────────────┘
                                           │ 4. Exchange code for token
                                           ▼
                                   ┌───────────────────────┐
                                   │  Store in Firestore   │
                                   │  (encrypted)          │
                                   └───────────────────────┘
```

### 4.2 Chi tiết từng bước

#### **Bước 1-3: User authorization**
URL redirect đến Facebook:
```
https://www.facebook.com/v19.0/dialog/oauth?
  client_id={META_APP_ID}&
  redirect_uri={META_REDIRECT_URI}&
  scope=pages_show_list,pages_messaging,pages_read_engagement&
  response_type=code
```

#### **Bước 4: Callback handler**
File: `app/api/meta/oauth/callback/route.ts`

```typescript
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    const code = url.searchParams.get('code');
    
    // 1. Exchange code for access token
    const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?
         client_id=${appId}&
         client_secret=${secret}&
         redirect_uri=${redirect}&
         code=${code}`
    );
    const { access_token } = await tokenRes.json();
    
    // 2. Encrypt token
    const enc = encrypt(access_token);
    
    // 3. Get user info
    const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture&
         access_token=${access_token}`
    );
    const { name, picture } = await meRes.json();
    
    // 4. Store in Firestore
    await db
        .collection('clerk_users')
        .doc(userId)
        .collection('platforms')
        .doc('facebook')
        .collection('oauth_tokens')
        .doc('main')
        .set({
            provider: 'facebook',
            encrypted: enc.cipher,
            iv: enc.iv,
            authTag: enc.authTag,
            userName: name,
            userPicture: picture.data.url,
            tokenType: 'Bearer',
            expiresIn: expires_in,
            updatedAt: new Date().toISOString()
        });
    
    // 5. Get pages
    const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?
         access_token=${access_token}`
    );
    const { data: pages } = await pagesRes.json();
    
    // 6. Store each page with encrypted access token
    for (const page of pages) {
        const pageEnc = encrypt(page.access_token);
        await db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .doc(page.id)
            .set({
                pageId: page.id,
                name: page.name,
                accessTokenEncrypted: pageEnc.cipher,
                accessTokenIv: pageEnc.iv,
                accessTokenAuthTag: pageEnc.authTag,
                category: page.category,
                tasks: page.tasks,
                connectedAt: new Date().toISOString()
            });
    }
    
    return NextResponse.redirect('/facebook-integration?success=true');
}
```

#### **Encryption Details**
File: `lib/encrypt.ts`
```typescript
// Sử dụng AES-256-GCM
export function encrypt(text: string) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
        cipher: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

export function decrypt(iv: string, cipher: string, authTag: string) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(cipher, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
```

### 4.3 Webhook Setup

#### **Webhook Configuration trên Facebook**
1. Vào https://developers.facebook.com/apps/{APP_ID}/webhooks
2. Subscribe to: **Pages** → **messages**
3. Callback URL: `https://yourdomain.com/api/webhooks/meta`
4. Verify Token: Giá trị `META_WEBHOOK_VERIFY_TOKEN` trong `.env`

#### **Webhook Handler**
File: `app/api/webhooks/meta/route.ts`

**GET - Verification:**
```typescript
export async function GET(req: NextRequest) {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
```

**POST - Receive Events:**
```typescript
export async function POST(req: NextRequest) {
    const body = await req.text();
    
    // 1. Verify signature
    const signature = req.headers.get('x-hub-signature-256');
    const expectedSignature = 'sha256=' + 
        createHmac('sha256', APP_SECRET).update(body).digest('hex');
    
    if (signature !== expectedSignature) {
        console.warn('Signature mismatch');
    }
    
    // 2. Respond immediately (Facebook requires < 20s)
    const response = new NextResponse('EVENT_RECEIVED', { status: 200 });
    
    // 3. Process asynchronously
    processWebhookEvent(JSON.parse(body)).catch(console.error);
    
    return response;
}
```

**Event Processing:**
```typescript
async function processWebhookEvent(event: any) {
    if (event.object !== 'page') return;
    
    for (const entry of event.entry || []) {
        const pageId = entry.id;
        
        for (const messaging of entry.messaging || []) {
            const senderId = messaging.sender?.id;
            const messageData = messaging.message;
            const messageId = messageData?.mid;
            
            // Idempotency check
            const eventId = `${entry.id}_${entry.time}_${messageId}`;
            const existingEvent = await db
                .collection('webhook_events')
                .doc(eventId)
                .get();
            
            if (existingEvent.exists) {
                console.log('Event already processed');
                continue;
            }
            
            // Save to webhook_events (audit log)
            await db.collection('webhook_events').doc(eventId).set({
                pageId,
                senderId,
                messageId,
                timestamp: messaging.timestamp,
                processedAt: new Date().toISOString(),
                rawEvent: messaging
            });
            
            // Save message to conversations
            const conversationId = `${pageId}_${senderId}`;
            await db
                .collection('conversations')
                .doc(conversationId)
                .set({
                    conversationId,
                    pageId,
                    psid: senderId,
                    updatedAt: new Date(messaging.timestamp).toISOString(),
                    lastMessage: messageData?.text || '[attachment]',
                    unreadCount: 1 // Increment if needed
                }, { merge: true });
            
            // Save message
            await db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(messageId)
                .set({
                    id: messageId,
                    from: 'customer',
                    text: messageData?.text || '',
                    at: new Date(messaging.timestamp).toISOString(),
                    attachments: messageData?.attachments || []
                });
            
            console.log(`Saved message ${messageId} to ${conversationId}`);
        }
    }
}
```

---

## 5. QUẢN LÝ TIN NHẮN REALTIME

### 5.1 Sơ đồ Data Flow

```
┌───────────────────┐
│  Facebook User    │
│  sends message    │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│  Facebook Webhook                            │
│  POST /api/webhooks/meta                     │
│  - Verify signature                          │
│  - Save to webhook_events (audit)           │
│  - Save to conversations/{convId}/messages   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼ (Firestore Write)
┌──────────────────────────────────────────────┐
│  Firestore: conversations/{convId}/messages  │
│  {                                           │
│    id: "msg_123",                            │
│    from: "customer",                         │
│    text: "Hello",                            │
│    at: "2026-01-26T10:00:00Z",               │
│    attachments: []                           │
│  }                                           │
└─────────────────┬────────────────────────────┘
                  │
                  │ (Realtime Listener)
                  ▼
┌──────────────────────────────────────────────┐
│  useRealtimeMessages.ts                      │
│  onSnapshot(conversationsRef, (snapshot) => {│
│    // Update Redux store                     │
│  })                                          │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│  Redux messagesSlice                         │
│  - conversationsById                         │
│  - conversationOrder                         │
│  - activeConversationId                      │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│  React Components Re-render                  │
│  - ConversationList shows new message        │
│  - MessageThread updates                     │
│  - Unread count increments                   │
└──────────────────────────────────────────────┘
```

### 5.2 Realtime Listener Implementation

File: `hooks/useRealtimeMessages.ts` (giả định)
```typescript
export function useRealtimeMessages(userId: string, pageId?: string) {
    const dispatch = useAppDispatch();
    const db = getFirestoreInstance();
    
    useEffect(() => {
        // Query conversations
        let query = collection(db, 'conversations');
        if (pageId && pageId !== 'all') {
            query = query.where('pageId', '==', pageId);
        }
        
        // Setup listener
        const unsubscribe = onSnapshot(
            query,
            (snapshot) => {
                const conversations = [];
                snapshot.forEach((doc) => {
                    conversations.push({
                        conversationId: doc.id,
                        ...doc.data()
                    });
                });
                
                // Update Redux
                dispatch(setConversations(conversations));
            },
            (error) => {
                console.error('Firestore listener error:', error);
            }
        );
        
        return () => unsubscribe();
    }, [userId, pageId, dispatch]);
}
```

### 5.3 Messages Redux Slice

File: `lib/redux/features/messages/messagesSlice.ts`

**State Structure:**
```typescript
interface MessagesSliceState {
    selectedPageId: string;              // "all" hoặc pageId cụ thể
    activeConversationId: string | null; // Conversation đang mở
    conversationsById: Record<string, Conversation>;
    conversationOrder: string[];         // Sorted by updatedAt
    pages: PageMeta[];                   // List pages user có access
    cursor: string | null;               // Pagination cursor
    hasMore: boolean;
    isPolling: boolean;
    readConversationIds: Record<string, boolean>;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    error: string | null;
    bootstrapDone: boolean;
}

interface Conversation {
    conversationId: string;    // "{pageId}_{psid}"
    pageId: string;
    pageName: string;
    psid: string;              // Page-scoped ID
    userName: string;
    userPicture: string;
    updatedAt: string;
    lastMessage: string;
    unreadCount: number;
    messages: ChatMessage[];
    phones: string[];          // Auto-detected từ messages
}

interface ChatMessage {
    id: string;
    from: 'customer' | 'page';
    text: string;
    at: string;                // ISO timestamp
    attachments: {
        type: 'image' | 'video' | 'audio' | 'file';
        url: string;
    }[];
}
```

**Key Reducers:**
```typescript
// Fetch conversations từ Firestore
fetchConversations: create.asyncThunk(async ({ pageId, cursor, limit }) => {
    const db = getFirestoreInstance();
    let query = collection(db, 'conversations');
    
    if (pageId !== 'all') {
        query = query.where('pageId', '==', pageId);
    }
    
    query = query.orderBy('updatedAt', 'desc').limit(limit);
    
    if (cursor) {
        const lastDoc = await getDoc(doc(db, 'conversations', cursor));
        query = query.startAfter(lastDoc);
    }
    
    const snapshot = await getDocs(query);
    const conversations = snapshot.docs.map(d => ({
        conversationId: d.id,
        ...d.data()
    }));
    
    return {
        conversations,
        nextCursor: snapshot.docs[snapshot.docs.length - 1]?.id || null,
        append: !!cursor
    };
});

// Fetch messages của một conversation
fetchMessages: create.asyncThunk(async ({ conversationId }) => {
    const db = getFirestoreInstance();
    const messagesRef = collection(
        db,
        'conversations',
        conversationId,
        'messages'
    );
    
    const snapshot = await getDocs(
        query(messagesRef, orderBy('at', 'asc'))
    );
    
    const messages = snapshot.docs.map(d => d.data());
    return { conversationId, messages };
});

// Set active conversation
setActiveConversation: create.reducer((state, action) => {
    state.activeConversationId = action.payload;
    
    // Mark as read
    if (action.payload) {
        state.readConversationIds[action.payload] = true;
        
        // Reset unread count
        if (state.conversationsById[action.payload]) {
            state.conversationsById[action.payload].unreadCount = 0;
        }
    }
});
```

---

## 6. REDUX STATE MANAGEMENT

### 6.1 Store Configuration

File: `lib/redux/store.ts`
```typescript
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { firebaseSlice } from "./features/firebase/firebaseSlice";
import { messagesSlice } from "./features/messages/messagesSlice";
import { contactsSlice } from "./features/contacts/contactsSlice";
import { campaignsSlice } from "./features/campaigns/campaignsSlice";
import { clerkSlice } from "./features/clerk/clerkSlice";

// Import listeners
import { 
    firebaseListener, 
    analyticPostsListener, 
    shortVideosPostsListener 
} from "./features/firebase/listeners";
import { campaignsListener, adsReportListener } from "./features/campaigns/listeners";

const rootReducer = combineSlices(
    firebaseSlice,
    clerkSlice,
    messagesSlice,
    contactsSlice,
    campaignsSlice
);

export const makeStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().prepend([
                firebaseListener.middleware,
                campaignsListener.middleware,
                adsReportListener.middleware,
                analyticPostsListener.middleware,
                shortVideosPostsListener.middleware
            ]),
    });
};
```

### 6.2 Listener Middleware Pattern

File: `lib/redux/features/firebase/listeners.ts`
```typescript
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"

// Auto-refetch users khi có CRUD
export const firebaseListener = createListenerMiddleware()

firebaseListener.startListening({
    matcher: isAnyOf(
        addUsersAsync.fulfilled,
        updateUsersAsync.fulfilled,
        deleteUserPermanentlyAsync.fulfilled
    ),
    effect: async (action, api) => {
        // Tự động fetch lại danh sách users
        api.dispatch(getUsersAsync())
    }
})

// Tương tự cho analytic posts
export const analyticPostsListener = createListenerMiddleware()

analyticPostsListener.startListening({
    matcher: isAnyOf(
        addAnalyticPostAsync.fulfilled,
        updateAnalyticPostAsync.fulfilled,
        deleteAnalyticPostAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getAllAnalyticPostsAsync())
    }
})
```

**Lợi ích:**
- ✅ Tự động sync state sau mọi mutation
- ✅ Không cần gọi refetch thủ công
- ✅ Đảm bảo consistency

### 6.3 Firebase Slice (Users/Posts Management)

File: `lib/redux/features/firebase/firebaseSlice.ts`

**State:**
```typescript
interface FirebaseSliceState {
    users: Array<TypeUser>
    deletedUsers: Array<TypeUser>
    isLoading: boolean
    userCount: number
    analyticPosts: Array<TypeAnalyticPostDoc>
    shortVideoPosts: Array<TypeShortVideosPostDoc>
    actions: Array<TypeActionDoc>  // Audit log
    databaseName: string            // Current database
    teamId: string
}
```

**Key Async Thunks:**
```typescript
// Fetch users từ Firestore collection 'users'
getUsersAsync: create.asyncThunk(async () => {
    const db = getFirestoreInstance();
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
});

// Update user và log action
updateUsersAsync: create.asyncThunk(
    async ({ docId, data, action }) => {
        const db = getFirestoreInstance();
        const userRef = doc(db, 'users', docId);
        
        // Update user document
        await updateDoc(userRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        
        // Log action to auditLogs
        await addDoc(collection(db, 'auditLogs'), {
            type: action.type,          // 'update_user'
            userId: action.userId,      // Clerk user ID
            targetDocId: docId,
            changes: data,
            timestamp: new Date().toISOString()
        });
    }
);

// Add new user
addUsersAsync: create.asyncThunk(
    async ({ data, action }) => {
        const db = getFirestoreInstance();
        const docRef = await addDoc(collection(db, 'users'), {
            ...data,
            createdAt: new Date().toISOString(),
            isDelete: false
        });
        
        // Log action
        await addDoc(collection(db, 'auditLogs'), {
            type: 'add_user',
            userId: action.userId,
            targetDocId: docRef.id,
            timestamp: new Date().toISOString()
        });
        
        return docRef.id;
    }
);

// Soft delete
updateUsersAsync({ docId, data: { isDelete: true }, action });

// Hard delete (permanent)
deleteUserPermanentlyAsync: create.asyncThunk(
    async (docId: string) => {
        const db = getFirestoreInstance();
        await deleteDoc(doc(db, 'users', docId));
    }
);
```

---

## 7. API ROUTES CHI TIẾT

### 7.1 Danh sách API

| Endpoint | Method | Auth | Mô tả |
|----------|--------|------|-------|
| `/api/auth/status` | GET | ✅ | Check auth status |
| `/api/bootstrap` | POST | ✅ | Initialize Firestore collections |
| `/api/contacts/rescan` | POST | ✅ | Re-scan contacts từ conversations |
| `/api/conversation/[id]/messages` | GET | ✅ | Fetch messages của conversation |
| `/api/conversations/[id]` | GET | ✅ | Get conversation detail |
| `/api/conversations/[id]/mark-read` | POST | ✅ | Mark conversation as read |
| `/api/messages` | GET | ✅ | Fetch messages từ Graph API |
| `/api/inbox/send` | POST | ✅ | Send message qua Graph API |
| `/api/meta/oauth/callback` | GET | ✅ | OAuth callback |
| `/api/meta/disconnect` | POST | ✅ | Disconnect Facebook |
| `/api/meta/pages/[id]/disconnect` | POST | ✅ | Disconnect specific page |
| `/api/pages` | GET | ✅ | List Facebook pages |
| `/api/users` | GET | ✅ | List Clerk users |
| `/api/webhook-health` | GET | ❌ | Webhook health check |
| `/api/webhooks/meta` | GET/POST | ❌ | Facebook webhook |

### 7.2 API Chi tiết

#### **7.2.1 GET /api/messages**
**Mục đích**: Fetch messages từ Facebook Graph API (không phải Firestore)

**Query Parameters:**
- `pageId` (optional): Filter by page
- `cursor` (optional): Pagination cursor
- `limit` (default: 5, max: 25)

**Response:**
```json
{
  "conversations": [
    {
      "conversationId": "123_456",
      "pageId": "123",
      "pageName": "My Page",
      "psid": "456",
      "userName": "John Doe",
      "userPicture": "https://...",
      "updatedAt": "2026-01-26T10:00:00Z",
      "lastMessage": "Hello",
      "unreadCount": 1,
      "messages": [
        {
          "id": "msg_1",
          "from": "customer",
          "text": "Hello",
          "at": "2026-01-26T10:00:00Z",
          "attachments": []
        }
      ],
      "phones": ["+1234567890"]
    }
  ],
  "pages": [
    { "pageId": "123", "name": "My Page" }
  ],
  "nextCursor": "cursor_xyz",
  "hasMore": true
}
```

**Source Code:**
```typescript
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const db = getFirestore();
    const url = new URL(req.url);
    const pageIdParam = url.searchParams.get('pageId');
    const cursor = url.searchParams.get('cursor');
    const limit = Math.min(Number(url.searchParams.get('limit') || '5'), 25);
    
    // 1. Get pages từ Firestore
    let pageIds: string[] = [];
    if (pageIdParam) {
        pageIds = [pageIdParam];
    } else {
        const pagesSnap = await db
            .collection('clerk_users')
            .doc(userId)
            .collection('platforms')
            .doc('facebook')
            .collection('pages')
            .get();
        pageIds = pagesSnap.docs.map(d => d.id);
    }
    
    // 2. Fetch conversations từ Graph API
    const conversations = [];
    for (const pageId of pageIds) {
        const token = await getPageAccessToken(userId, pageId);
        
        const graphUrl = `https://graph.facebook.com/v24.0/${pageId}/conversations?
            fields=id,participants,messages{id,message,created_time,from}&
            limit=${limit}&
            ${cursor ? `after=${cursor}` : ''}`;
        
        const res = await fetch(graphUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Transform data
        for (const conv of data.data || []) {
            const psid = conv.participants?.data?.find(p => p.id !== pageId)?.id;
            const messages = conv.messages?.data?.map(m => ({
                id: m.id,
                from: m.from?.id === pageId ? 'page' : 'customer',
                text: m.message || '',
                at: m.created_time,
                attachments: []
            })) || [];
            
            // Detect phones
            const phones = detectPhones(messages.map(m => m.text).join(' '));
            
            conversations.push({
                conversationId: `${pageId}_${psid}`,
                pageId,
                psid,
                messages,
                phones,
                updatedAt: messages[0]?.at || new Date().toISOString(),
                lastMessage: messages[0]?.text || ''
            });
        }
    }
    
    return NextResponse.json({
        conversations,
        pages: pageIds.map(id => ({ pageId: id, name: '...' })),
        nextCursor: data.paging?.cursors?.after || null,
        hasMore: !!data.paging?.next
    });
}
```

#### **7.2.2 POST /api/inbox/send**
**Mục đích**: Gửi tin nhắn qua Facebook Graph API

**Request Body:**
```json
{
  "pageId": "123",
  "psid": "456",
  "message": "Hello from admin",
  "attachmentUrl": "https://example.com/file.pdf",  // optional
  "adminName": "Admin User",                        // optional
  "tag": "CONFIRMED_EVENT_UPDATE"                   // required if outside 24h
}
```

**24-Hour Window Logic:**
```typescript
// Kiểm tra tin nhắn cuối cùng từ customer
const lastCustomerSnap = await db
    .collection('conversations')
    .doc(`${pageId}_${psid}`)
    .collection('messages')
    .where('from', '==', 'customer')
    .orderBy('at', 'desc')
    .limit(1)
    .get();

const lastAt = new Date(lastCustomerSnap.docs[0]?.data()?.at).getTime();
const within24h = Date.now() - lastAt <= 24 * 60 * 60 * 1000;
```

**Messaging Types:**
- **RESPONSE**: Trong 24h từ tin nhắn cuối của customer
- **MESSAGE_TAG**: Ngoài 24h, cần tag hợp lệ:
  - `CONFIRMED_EVENT_UPDATE`: Sự kiện đã xác nhận
  - `POST_PURCHASE_UPDATE`: Cập nhật sau mua hàng
  - `ACCOUNT_UPDATE`: Cập nhật tài khoản

**Graph API Call:**
```typescript
const messageData = {
    recipient: { id: psid },
    messaging_type: within24h ? 'RESPONSE' : 'MESSAGE_TAG',
    ...(within24h ? {} : { tag: requestedTag }),
    message: attachmentUrl ? {
        attachment: {
            type: 'file',
            payload: { url: attachmentUrl, is_reusable: false }
        }
    } : {
        text: message
    }
};

const graphUrl = `https://graph.facebook.com/v24.0/${pageId}/messages`;
const res = await fetch(graphUrl, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
});

const result = await res.json();

if (!res.ok) {
    // Facebook error handling
    if (result.error?.code === 10) {
        return NextResponse.json({
            error: '#10 Outside 24-hour window',
            code: 10
        }, { status: 403 });
    }
    throw new Error(result.error?.message);
}

// Save to Firestore
await db
    .collection('conversations')
    .doc(`${pageId}_${psid}`)
    .collection('messages')
    .add({
        id: result.message_id,
        from: 'page',
        text: message || '[attachment]',
        at: new Date().toISOString(),
        attachments: attachmentUrl ? [{ type: 'file', url: attachmentUrl }] : [],
        sentBy: userId,
        adminName
    });
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_xyz",
  "within24h": true
}
```

#### **7.2.3 POST /api/webhooks/meta**
Chi tiết đã được mô tả ở phần 4.3

---

## 8. FIREBASE FIRESTORE STRUCTURE

### 8.1 Multi-Database Setup

**Concept**: Mỗi team có một Firestore database riêng.

**Database naming:**
- Default database: `(default)`
- Team databases: `team-2f`, `team-3a`, `team-5b`, etc.

**How it works:**
```typescript
// User metadata trong Clerk
{
    role: "leader",
    team_id: "2f",
    db: "team-2f"  // ← Database ID
}

// Initialize khi login
initFirestore(user.publicMetadata.db);  // Kết nối đến "team-2f"
```

### 8.2 Collections Schema

#### **Collection: `clerk_users/{userId}`**
Metadata của từng user (lưu theo Clerk userId).

**Structure:**
```
clerk_users/
  └── {clerkUserId}/              # VD: "user_2abcxyz"
      ├── (fields)
      │   ├── clerkId: string
      │   ├── email: string
      │   ├── userName: string
      │   └── createdAt: timestamp
      │
      └── platforms/
          └── facebook/
              ├── oauth_tokens/
              │   └── main/
              │       ├── provider: "facebook"
              │       ├── encrypted: string
              │       ├── iv: string
              │       ├── authTag: string
              │       ├── userName: string
              │       ├── userPicture: string
              │       ├── tokenType: "Bearer"
              │       ├── expiresIn: number
              │       └── updatedAt: timestamp
              │
              └── pages/
                  └── {pageId}/      # VD: "123456789"
                      ├── pageId: string
                      ├── name: string
                      ├── accessTokenEncrypted: string
                      ├── accessTokenIv: string
                      ├── accessTokenAuthTag: string
                      ├── category: string
                      ├── tasks: string[]
                      └── connectedAt: timestamp
```

**Truy vấn:**
```typescript
// Get all pages của user
const pagesSnap = await db
    .collection('clerk_users')
    .doc(userId)
    .collection('platforms')
    .doc('facebook')
    .collection('pages')
    .get();

const pages = pagesSnap.docs.map(d => ({
    pageId: d.id,
    ...d.data()
}));
```

#### **Collection: `conversations/{conversationId}`**
Lưu thông tin conversation (1 conversation = 1 PSID chat với 1 Page).

**conversationId format:** `{pageId}_{psid}`

**Structure:**
```typescript
{
    conversationId: "123_456",
    pageId: "123",
    pageName: "My Page",
    psid: "456",                  // Page-Scoped ID
    userName: "John Doe",
    userPicture: "https://...",
    updatedAt: "2026-01-26T10:00:00Z",
    lastMessage: "Hello",
    unreadCount: 1,
    phones: ["+1234567890"],      // Auto-detected
    tags: ["lead", "interested"],
    createdAt: "2026-01-25T08:00:00Z"
}
```

**Subcollection: `messages/{messageId}`**
```typescript
{
    id: "msg_123",
    from: "customer" | "page",
    text: "Hello there",
    at: "2026-01-26T10:00:00Z",
    attachments: [
        {
            type: "image",
            url: "https://..."
        }
    ],
    sentBy: "user_2abcxyz",       // Clerk user ID (nếu từ page)
    adminName: "Admin User"
}
```

**Query examples:**
```typescript
// Get all conversations của một page
const convsSnap = await db
    .collection('conversations')
    .where('pageId', '==', '123')
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get();

// Get messages của một conversation
const msgsSnap = await db
    .collection('conversations')
    .doc('123_456')
    .collection('messages')
    .orderBy('at', 'asc')
    .get();

// Get last customer message (for 24h check)
const lastCustomerSnap = await db
    .collection('conversations')
    .doc('123_456')
    .collection('messages')
    .where('from', '==', 'customer')
    .orderBy('at', 'desc')
    .limit(1)
    .get();
```

#### **Collection: `webhook_events/{eventId}`**
Audit log cho mọi webhook event (idempotency + debugging).

**eventId format:** `{pageId}_{timestamp}_{messageId}`

```typescript
{
    eventId: "123_1706270400_msg_xyz",
    pageId: "123",
    senderId: "456",
    messageId: "msg_xyz",
    timestamp: 1706270400000,
    processedAt: "2026-01-26T10:00:00Z",
    rawEvent: { /* full webhook payload */ }
}
```

#### **Collection: `contacts/{contactId}`**
Danh bạ khách hàng (extracted từ conversations).

```typescript
{
    contactId: "contact_123",
    name: "John Doe",
    phones: ["+1234567890"],
    psid: "456",
    conversationIds: ["123_456"],
    tags: ["lead"],
    notes: "Interested in product X",
    createdAt: "2026-01-25T08:00:00Z",
    updatedAt: "2026-01-26T10:00:00Z"
}
```

#### **Collection: `users`**
Internal users (nhân viên, không phải Clerk users).

```typescript
{
    docId: "user_internal_1",
    name: "Nguyen Van A",
    email: "nva@example.com",
    role: "sale",
    team_id: "2f",
    target_monthly: 1000000,      // Target doanh số
    performance: {
        current_month: 500000,
        last_month: 800000
    },
    isDelete: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-26T10:00:00Z"
}
```

#### **Collection: `analytic_posts`**
Phân tích bài viết (cho leader/admin).

```typescript
{
    docId: "post_1",
    postId: "fb_post_123",
    pageId: "123",
    content: "Check out our new product!",
    metrics: {
        likes: 150,
        comments: 30,
        shares: 10,
        reach: 5000
    },
    createdAt: "2026-01-20T00:00:00Z"
}
```

#### **Collection: `short_videos`**
Quản lý video ngắn.

```typescript
{
    docId: "video_1",
    videoId: "fb_video_456",
    pageId: "123",
    title: "Product Demo",
    thumbnailUrl: "https://...",
    videoUrl: "https://...",
    metrics: {
        views: 1000,
        likes: 50
    },
    createdAt: "2026-01-20T00:00:00Z"
}
```

#### **Collection: `auditLogs`**
Logs mọi action trong hệ thống.

```typescript
{
    type: "update_user" | "add_user" | "delete_user" | "send_message",
    userId: "user_2abcxyz",       // Clerk user ID
    targetDocId: "user_internal_1",
    changes: { /* object of changes */ },
    timestamp: "2026-01-26T10:00:00Z"
}
```

### 8.3 Firestore Security Rules

File: `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    // Clerk users data
    match /clerk_users/{userId} {
      allow read, write: if isAuthenticated();
    }

    // OAuth tokens
    match /oauth_tokens/{id} {
      allow read, write: if isAuthenticated();
    }

    // Pages
    match /pages/{id} {
      allow read, write: if isAuthenticated();
    }

    // Contacts
    match /contacts/{id} {
      allow read, write: if isAuthenticated();
    }

    // Webhook events - server only
    match /webhook_events/{id} {
      allow read, write: if false;  // Chỉ server write
    }

    // Conversations - realtime read
    match /conversations/{convId} {
      allow read: if true;          // Public read (có thể tighten)
      allow write: if false;        // Chỉ server write
      
      match /messages/{msgId} {
        allow read: if true;
        allow write: if false;
      }
    }

    // Audit logs - read only
    match /auditLogs/{id} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    // Internal users
    match /users/{id} {
      allow read, write: if isAuthenticated();
    }

    // Posts & Videos
    match /analytic_posts/{id} {
      allow read, write: if isAuthenticated();
    }

    match /short_videos/{id} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

**Lưu ý bảo mật:**
- ⚠️ Conversations có `allow read: if true` → Cần tighten với auth check
- ✅ Webhooks chỉ server write (`allow write: if false`)
- ✅ AuditLogs read-only cho client

---

## 9. QUY TRÌNH GỬI TIN NHẮN

### 9.1 Flowchart

```
┌──────────────┐
│  User clicks │
│ "Send" button│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  1. Validate inputs                     │
│     - pageId required                   │
│     - psid required                     │
│     - message OR attachmentUrl required │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  2. Check 24-hour window                │
│     Query last customer message         │
│     at: conversation/{convId}/messages  │
│     where from == 'customer'            │
└──────┬──────────────────────────────────┘
       │
       ├─────────── within24h = true
       │            (< 24h)
       │
       └─────────── within24h = false
                    (> 24h)
                    │
                    ▼
           ┌────────────────────┐
           │ Require message    │
           │ tag:               │
           │ - CONFIRMED_EVENT  │
           │ - POST_PURCHASE    │
           │ - ACCOUNT_UPDATE   │
           └────────┬───────────┘
                    │
                    │ Tag missing?
                    ├─ YES → Return error 403
                    │
                    └─ NO → Continue
       │
       ▼
┌─────────────────────────────────────────┐
│  3. Get access token                    │
│     getPageAccessToken(userId, pageId)  │
│     - Decrypt from Firestore            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  4. Build message payload               │
│     {                                   │
│       recipient: { id: psid },          │
│       messaging_type: RESPONSE/TAG,     │
│       message: { text/attachment },     │
│       tag: (if needed)                  │
│     }                                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  5. Call Facebook Graph API             │
│     POST /{pageId}/messages             │
│     Authorization: Bearer {token}       │
└──────┬──────────────────────────────────┘
       │
       ├─── Success (200)
       │    │
       │    ▼
       │    ┌────────────────────────────┐
       │    │ 6. Save to Firestore       │
       │    │    conversations/{convId}/ │
       │    │    messages/{messageId}    │
       │    └────────┬───────────────────┘
       │             │
       │             ▼
       │    ┌────────────────────────────┐
       │    │ 7. Return success          │
       │    │    { messageId, ... }      │
       │    └────────────────────────────┘
       │
       └─── Error
            │
            ▼
       ┌────────────────────────────┐
       │ Handle Facebook errors:    │
       │ - Code 10: Outside 24h     │
       │ - Code 190: Token expired  │
       │ - Code 200: Permission     │
       └────────────────────────────┘
```

### 9.2 Code Example (Component)

```tsx
// components/messages/SendMessageForm.tsx
import { useState } from 'react';

export function SendMessageForm({ pageId, psid, conversationId }) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim()) {
            setError('Message cannot be empty');
            return;
        }

        setIsSending(true);
        setError('');

        try {
            const res = await fetch('/api/inbox/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId,
                    psid,
                    message,
                    adminName: 'Current Admin'  // Từ useCurrentUser()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 10) {
                    // Outside 24-hour window
                    setError(
                        'Cannot send message: Outside 24-hour window. ' +
                        'Please use a message tag or wait for customer reply.'
                    );
                } else {
                    setError(data.error || 'Failed to send message');
                }
                return;
            }

            // Success
            setMessage('');
            // Tin nhắn sẽ tự động xuất hiện qua Firestore listener
        } catch (err) {
            setError('Network error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="send-message-form">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isSending}
            />
            {error && <div className="error">{error}</div>}
            <button onClick={handleSend} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send'}
            </button>
        </div>
    );
}
```

---

## 10. MULTI-TENANT VÀ PHÂN QUYỀN

### 10.1 Multi-Tenant Architecture

**Concept**: Mỗi team/organization hoạt động độc lập với database riêng.

**Setup:**
1. **Clerk publicMetadata:**
   ```json
   {
       "role": "leader",
       "team_id": "2f",
       "db": "team-2f"
   }
   ```

2. **Firebase Database ID:**
   - Team 2f → `team-2f` database
   - Team 3a → `team-3a` database
   - Default → `(default)` database

3. **Initialize on login:**
   ```typescript
   // components/firebase/FirebaseInit.tsx
   React.useLayoutEffect(() => {
       const dbId = user?.publicMetadata.db as string;
       initFirestore(dbId);  // Switch database
   }, [user]);
   ```

### 10.2 Role-Based Access Control (RBAC)

#### **Roles:**
1. **admin**
   - Full access (mọi chức năng)
   - Xem được tất cả pages
   - Quản lý employees, ads, posts

2. **leader**
   - Quản lý team
   - Xem báo cáo, charts
   - Quản lý ads, posts
   - Xem employees

3. **manage**
   - Xem báo cáo hạn chế
   - Không sửa employees

4. **sale**
   - Chỉ xem daily tasks
   - Inbox (send/receive messages)
   - Không xem báo cáo tổng

#### **Implementation:**

**Frontend Guard:**
```tsx
// app/(main)/(other-page)/(leader)/layout.tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { redirect } from 'next/navigation';

export default function LeaderLayout({ children }) {
    const { isLeader } = useCurrentUser();
    
    if (!isLeader) {
        redirect('/');  // Redirect về home
    }
    
    return children;
}
```

**Backend Guard (API):**
```typescript
// app/api/employees/route.ts
export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Get user role từ Clerk
    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata.role;
    
    if (role !== 'admin' && role !== 'leader') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Continue...
}
```

**Conditional Rendering:**
```tsx
// app/(main)/page.tsx
const Home = () => {
    const { isLeader, role } = useCurrentUser();
    
    return (
        <div className="grid grid-cols-12 gap-4">
            <div className={`col-span-12 ${isLeader && "xl:col-span-7"}`}>
                <EcommerceMetrics />
                <ChartLine />
            </div>
            
            {/* Chỉ leader/admin mới thấy chart này */}
            {isLeader && (
                <div className="col-span-12 xl:col-span-5">
                    <ChartPieSeparatorNone />
                </div>
            )}
            
            {/* Sale role: show different content */}
            {role === 'sale' && (
                <div className="col-span-12">
                    <DailyTasksWidget />
                </div>
            )}
        </div>
    );
};
```

### 10.3 Data Isolation

**Firestore Rules (per database):**
```
match /databases/{database}/documents {
    // Mỗi database tự động isolated
    // User team 2f chỉ access được team-2f database
    // User team 3a chỉ access được team-3a database
    
    match /conversations/{convId} {
        // Có thể add thêm team_id check nếu cần
        allow read: if request.auth != null &&
            resource.data.team_id == request.auth.token.team_id;
    }
}
```

---

## 11. TESTING GUIDELINES

### 11.1 Test Environment Setup

#### **Step 1: Create .env.local**
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase Client
NEXT_PUBLIC_APIKEY=AIzaSy...
NEXT_PUBLIC_AUTHDOMAIN=project.firebaseapp.com
NEXT_PUBLIC_PROJECTID=project-id
NEXT_PUBLIC_STORAGEBUCKET=project.appspot.com
NEXT_PUBLIC_MESSAGINGSENDERID=123456789
NEXT_PUBLIC_APPID=1:123:web:abc

# Firebase Admin (Service Account JSON)
FIREBASE_PROJECT_ID=project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Meta (Facebook)
META_APP_ID=123456789
META_APP_SECRET=abc123...
META_REDIRECT_URI=http://localhost:3000/api/meta/oauth/callback
META_WEBHOOK_VERIFY_TOKEN=my_verify_token_123
META_GRAPH_VERSION=v24.0

# Encryption (Generate với: openssl rand -hex 32)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Optional: Page Access Tokens (fallback)
META_PAGE_ACCESS_TOKEN=EAAG...
```

#### **Step 2: Install Dependencies**
```bash
npm install
```

#### **Step 3: Run Development Server**
```bash
npm run dev
```

### 11.2 Manual Testing Checklist

#### **✅ Authentication Flow**
- [ ] Visit http://localhost:3000
- [ ] Should redirect to `/login`
- [ ] Login với Clerk account
- [ ] Should redirect back to dashboard
- [ ] Check console: `initFirestore()` called
- [ ] Verify Redux state: `databaseName` và `teamId` set

#### **✅ Facebook OAuth**
- [ ] Navigate to `/facebook-integration` (leader/admin only)
- [ ] Click "Connect Facebook"
- [ ] Should redirect to Facebook OAuth dialog
- [ ] Approve permissions
- [ ] Should redirect to `/api/meta/oauth/callback`
- [ ] Check Firestore: `clerk_users/{userId}/platforms/facebook/pages/{pageId}` created
- [ ] Verify: `accessTokenEncrypted`, `accessTokenIv`, `accessTokenAuthTag` fields exist

#### **✅ Webhook Setup (Ngrok Required)**
1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy HTTPS URL:** `https://abc123.ngrok.io`

4. **Update Facebook Webhook:**
   - Vào https://developers.facebook.com/apps/{APP_ID}/webhooks
   - Callback URL: `https://abc123.ngrok.io/api/webhooks/meta`
   - Verify Token: `my_verify_token_123` (từ `.env`)
   - Subscribe to: `messages`

5. **Test webhook:**
   - Gửi tin nhắn đến Facebook Page
   - Check terminal: Should see `[Webhook] RECEIVED POST REQUEST`
   - Check Firestore: `webhook_events/{eventId}` created
   - Check Firestore: `conversations/{convId}/messages/{msgId}` created

#### **✅ Realtime Messages**
- [ ] Open `/inbox` or messages page
- [ ] Open browser console
- [ ] Send message từ Facebook Messenger
- [ ] Should see new message appear without refresh
- [ ] Check Redux DevTools: `messagesSlice` updated

#### **✅ Send Message**
- [ ] Select a conversation
- [ ] Type a message
- [ ] Click "Send"
- [ ] Should see success toast
- [ ] Message should appear in thread
- [ ] Check Facebook Messenger: Message received

#### **✅ 24-Hour Window Test**
1. **Within 24 hours:**
   - [ ] Send message to page
   - [ ] Wait < 1 minute
   - [ ] Admin reply từ app
   - [ ] Should succeed (RESPONSE messaging type)

2. **Outside 24 hours:**
   - [ ] Wait > 24 hours (or fake timestamp)
   - [ ] Admin try to send message without tag
   - [ ] Should return error code 10
   - [ ] Retry with `tag: "CONFIRMED_EVENT_UPDATE"`
   - [ ] Should succeed (MESSAGE_TAG type)

#### **✅ Multi-Tenant Test**
1. **Create 2 users:**
   - User A: `team_id: "2f"`, `db: "team-2f"`
   - User B: `team_id: "3a"`, `db: "team-3a"`

2. **Login as User A:**
   - [ ] Check Redux: `databaseName === "team-2f"`
   - [ ] Create conversation `conv_A`

3. **Login as User B:**
   - [ ] Check Redux: `databaseName === "team-3a"`
   - [ ] Should NOT see `conv_A`
   - [ ] Create conversation `conv_B`

4. **Verify Firestore:**
   - Database `team-2f` has `conv_A`
   - Database `team-3a` has `conv_B`

#### **✅ Role-Based Access**
- [ ] Login as `role: "sale"`
- [ ] Try to access `/employees` → Should redirect to `/`
- [ ] Try to access `/ads` → Should redirect to `/`
- [ ] Access `/daily-tasks` → Should work

- [ ] Login as `role: "leader"`
- [ ] Access `/employees` → Should work
- [ ] Access `/ads` → Should work

### 11.3 Automated Testing (Optional)

#### **Unit Tests (Jest + React Testing Library)**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Example: Test useCurrentUser hook**
```typescript
// __tests__/hooks/useCurrentUser.test.ts
import { renderHook } from '@testing-library/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

jest.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        user: {
            id: 'user_123',
            username: 'testuser',
            publicMetadata: {
                role: 'leader',
                team_id: '2f',
                db: 'team-2f'
            }
        }
    })
}));

test('should return correct role and team info', () => {
    const { result } = renderHook(() => useCurrentUser());
    
    expect(result.current.role).toBe('leader');
    expect(result.current.isLeader).toBe(true);
    expect(result.current.publicMetaData.team_id).toBe('2f');
});
```

#### **API Tests (Postman/Insomnia)**
Import collection với các requests:
- `GET /api/auth/status`
- `GET /api/messages?pageId=123`
- `POST /api/inbox/send`
- `GET /api/pages`

---

## 12. TROUBLESHOOTING

### 12.1 Common Issues

#### **Issue 1: "Unauthorized" khi gọi API**
**Triệu chứng:**
```json
{ "error": "Unauthorized" }
```

**Nguyên nhân:**
- Clerk session expired
- Cookie bị xóa

**Giải pháp:**
1. Logout và login lại
2. Check `auth()` trong API route:
   ```typescript
   const { userId } = await auth();
   console.log('userId:', userId);  // Should not be null
   ```

#### **Issue 2: Firebase initialization error**
**Triệu chứng:**
```
Error: Firestore not initialized
```

**Nguyên nhân:**
- `FirebaseInit` component chưa chạy
- User metadata thiếu `db` field

**Giải pháp:**
1. Check layout hierarchy:
   ```tsx
   <ClerkProvider>
     <IsAuth>
       <FirebaseInit>  {/* Must be here */}
         {children}
       </FirebaseInit>
     </IsAuth>
   </ClerkProvider>
   ```

2. Check user metadata:
   ```typescript
   const { user } = useUser();
   console.log('DB:', user?.publicMetadata.db);  // Should not be undefined
   ```

3. Set metadata trong Clerk Dashboard:
   - Vào Users → Select user → Metadata
   - Add `db: "team-2f"` vào Public metadata

#### **Issue 3: Webhook không nhận được events**
**Triệu chứng:**
- Gửi message từ Messenger
- App không thấy message mới

**Debugging:**
1. **Check webhook subscription:**
   - Vào https://developers.facebook.com/apps/{APP_ID}/webhooks
   - Verify `messages` field is subscribed

2. **Check ngrok:**
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   ngrok http 3000
   
   # Check ngrok dashboard
   open http://localhost:4040
   ```
   - Xem requests đến `/api/webhooks/meta`

3. **Check signature:**
   - Console log trong `POST /api/webhooks/meta`:
   ```typescript
   console.log('Signature:', signature);
   console.log('Expected:', expectedSignature);
   ```

4. **Manual test webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/meta \
     -H "Content-Type: application/json" \
     -d '{"object":"page","entry":[{"id":"123","messaging":[{"sender":{"id":"456"},"message":{"text":"test"}}]}]}'
   ```

#### **Issue 4: "Outside 24-hour window" error**
**Triệu chứng:**
```json
{
  "error": "#10 Outside 24-hour window",
  "code": 10
}
```

**Giải pháp:**
1. **Option 1: Wait for customer reply**
   - Yêu cầu customer gửi message mới
   - Sẽ mở lại 24h window

2. **Option 2: Use message tag**
   ```typescript
   await fetch('/api/inbox/send', {
       method: 'POST',
       body: JSON.stringify({
           pageId: '123',
           psid: '456',
           message: 'Your order has been shipped',
           tag: 'POST_PURCHASE_UPDATE'  // ← Add this
       })
   });
   ```

3. **Option 3: Request Advanced Access**
   - Vào Facebook App Dashboard
   - Request `pages_messaging` advanced access
   - Cần business verification

#### **Issue 5: Access token expired**
**Triệu chứng:**
```json
{
  "error": {
    "code": 190,
    "message": "Error validating access token"
  }
}
```

**Giải pháp:**
1. Re-connect Facebook page:
   - Vào `/facebook-integration`
   - Click "Disconnect" (nếu có)
   - Click "Connect Facebook" lại

2. Get new long-lived token:
   - Facebook Page tokens thường không expire
   - Nhưng có thể invalidate nếu:
     - Đổi password Facebook
     - Revoke app permissions
     - Page ownership changed

3. Check token expiration:
   ```bash
   curl "https://graph.facebook.com/v24.0/debug_token?input_token={ACCESS_TOKEN}&access_token={APP_TOKEN}"
   ```

#### **Issue 6: Messages không sync realtime**
**Triệu chứng:**
- Gửi message từ Messenger
- Webhook received
- Firestore updated
- Nhưng UI không update

**Debugging:**
1. **Check Firestore listener:**
   ```typescript
   // Add console.log trong useRealtimeMessages
   useEffect(() => {
       const unsubscribe = onSnapshot(query, (snapshot) => {
           console.log('Firestore update:', snapshot.docs.length, 'docs');
           snapshot.docChanges().forEach(change => {
               console.log('Change type:', change.type, change.doc.id);
           });
       });
       return unsubscribe;
   }, []);
   ```

2. **Check Firestore rules:**
   - Verify `allow read: if true` cho conversations
   - Test query trong Firestore console

3. **Check Redux state:**
   - Install Redux DevTools
   - Monitor `messagesSlice` actions

### 12.2 Debugging Tools

#### **1. Redux DevTools**
```bash
# Install extension
# Chrome: https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd
```

**Usage:**
- Open DevTools → Redux tab
- Monitor actions: `fetchConversations/fulfilled`, `upsertConversation`, etc.
- Inspect state: `messagesSlice.conversationsById`

#### **2. Firebase Emulator Suite (Optional)**
```bash
npm install -g firebase-tools
firebase login
firebase init emulators
```

**Start emulators:**
```bash
firebase emulators:start
```

**Update code:**
```typescript
// utils/shared/firebase.ts
if (process.env.NODE_ENV === 'development') {
    const db = getFirestore(app);
    connectFirestoreEmulator(db, 'localhost', 8080);
}
```

#### **3. Clerk Dashboard**
- Vào https://dashboard.clerk.com
- Check Users → Sessions
- Verify publicMetadata

#### **4. Facebook Graph API Explorer**
- Vào https://developers.facebook.com/tools/explorer
- Test queries:
  ```
  GET /{pageId}/conversations?fields=id,participants,messages
  ```

### 12.3 Performance Optimization

#### **1. Pagination**
Hiện tại: Fetch all conversations → ❌ Slow với nhiều conversations

**Improvement:**
```typescript
// Implement cursor-based pagination
const [cursor, setCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
    const query = collection(db, 'conversations')
        .orderBy('updatedAt', 'desc')
        .limit(20);
    
    if (cursor) {
        query = query.startAfter(cursor);
    }
    
    const snapshot = await getDocs(query);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    setCursor(lastDoc);
    setHasMore(snapshot.docs.length === 20);
};
```

#### **2. Memoization**
```typescript
// Memoize selectors
import { createSelector } from '@reduxjs/toolkit';

export const selectActiveConversation = createSelector(
    [(state) => state.messages.conversationsById, (state) => state.messages.activeConversationId],
    (conversationsById, activeId) => activeId ? conversationsById[activeId] : null
);
```

#### **3. Lazy Loading**
```typescript
// Lazy load components
const ChartPieSeparatorNone = lazy(() => import('@/components/chart/ChartPieSeparatorNone'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
    {isLeader && <ChartPieSeparatorNone />}
</Suspense>
```

---

## 13. DEPLOYMENT

### 13.1 Environment Variables (Production)

**Vercel/Production `.env`:**
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Firebase (Production)
NEXT_PUBLIC_APIKEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY="..." # Escape newlines

# Meta (Production App)
META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://yourdomain.com/api/meta/oauth/callback
META_WEBHOOK_VERIFY_TOKEN=...

# Encryption (CRITICAL: Use production key)
ENCRYPTION_KEY=... # Generate new key for production
```

### 13.2 Build & Deploy

#### **Build locally:**
```bash
npm run build
npm run start  # Test production build
```

#### **Deploy to Vercel:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### **Update Facebook Webhook URL:**
- Callback URL: `https://yourdomain.com/api/webhooks/meta`
- Re-verify webhook

### 13.3 Post-Deployment Checklist

- [ ] Test login flow
- [ ] Test Facebook OAuth
- [ ] Test webhook (send test message)
- [ ] Test send message
- [ ] Check Firestore data isolation
- [ ] Monitor error logs (Vercel/Firebase)
- [ ] Setup alerts (webhook failures, auth errors)

---

## 14. KẾT LUẬN

### 14.1 Key Features

✅ **Multi-tenant messaging platform** với database isolation
✅ **Real-time sync** qua Firestore listeners
✅ **Secure token storage** với AES-256-GCM encryption
✅ **Facebook Messenger integration** với webhook + Graph API
✅ **Role-based access control** (4 roles: admin/leader/manage/sale)
✅ **24-hour messaging window** tracking & enforcement
✅ **Redux Toolkit** state management với auto-refetch listeners

### 14.2 Architecture Highlights

- **Next.js 16 App Router**: Server components + API routes
- **Clerk**: Xác thực + phân quyền
- **Firebase Firestore**: Multi-database cho multi-tenancy
- **Facebook Graph API**: Messenger integration
- **Redux Toolkit**: Centralized state + real-time listeners

### 14.3 Future Improvements

1. **Caching Layer**: Redis cache cho access tokens
2. **Queue System**: Bull/BullMQ cho webhook processing
3. **Analytics**: Track message response time, conversion rate
4. **AI Integration**: Auto-reply, sentiment analysis
5. **Mobile App**: React Native cho iOS/Android
6. **Advanced Search**: Elasticsearch cho full-text search messages

---

## 📞 LIÊN HỆ & HỖ TRỢ

- **Developer**: Alpha Net Team
- **Documentation Version**: 2.0
- **Last Updated**: 26/01/2026

**Lưu ý**: Đây là tài liệu nội bộ. Không chia sẻ thông tin nhạy cảm (API keys, tokens) ra ngoài team.

---

**END OF DOCUMENT**
