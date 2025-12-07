# Web Push Notification Test

```bash
npx web-push generate-vapid-keys
```

Add to `.env`:

```
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

## Testing

1. Open http://localhost:3000/test-push.html
2. Click "Subscribe to Push" (allow notifications when prompted)
3. Click "Send Test Notification"
4. Close tab
5. You should receive a browser notification even with the tab closed!
