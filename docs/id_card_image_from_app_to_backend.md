# ID Card Image Flow: Mobile App to Backend & Storage

> **Context:** Architecture reference for NEHU Issue Report & Feedback System.  
> Details how the student ID card image is captured, compressed, transmitted, and stored between the React Native Expo client and the Go/FastAPI backend.

---

## 1. Client-Side Lifecycle (Mobile App)

The app does **not** permanently store the raw ID card image on the device. Storing large Base64 blobs or binary images in `AsyncStorage` or `SecureStore` causes app sluggishness or crashes due to storage quota limits (`SecureStore` has an ~2–4 KB limit per key; `AsyncStorage` has serialization overhead).

### Lifecycle Pipeline

```
[Camera / Photo Library Pick]
       ↓ (Temporary OS cache URI: file:///.../cache/ImagePicker/...)
[expo-image-manipulator]
       ↓ (Resized to max width 1200px, JPEG quality 0.7, compressed to ≤ 350 KB)
[Component State (React useState)]
       ↓ (Held in ephemeral memory only during registration form fill)
[POST /auth/register Payload]
       ↓ (Transmitted over HTTPS to Go backend)
[Disposed / Garbage Collected]
```

### Step-by-Step Flow

1. **Capture / Pick:** The user selects or snaps their NEHU ID card using `expo-image-picker`.
2. **Compress & Optimize:** The image is processed using `expo-image-manipulator`:
   - Downscaled to max width `1200px` (preserving aspect ratio).
   - Compressed to JPEG with quality factor `0.70`.
   - Resulting file size is kept under `350 KB`.
   - Output format: Base64 data URI string.
3. **In-Memory Buffer:** The Base64 string is held in component state (`useState<string | null>`) inside `app/(auth)/register.tsx`.
4. **API Submission:** When the user taps **Register**, the string is placed directly into the `RegisterRequest` payload:
   ```json
   {
     "name": "Nikunj Maheshwari",
     "email": "nikunj@students.nehu.ac.in",
     "password": "mysecurepassword",
     "role": "student",
     "idCardImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
     "fcmToken": null
   }
   ```
5. **Component Teardown:** Once registration succeeds:
   - The registration view unmounts and the in-memory Base64 string is garbage collected.
   - The OS automatically purges temporary cache files from `cache/ImagePicker/`.
   - No sensitive ID card image remains locally on the user's phone.

---

## 2. Server-Side Handling (Go Backend)

When Harsh's Go backend receives the `POST /auth/register` payload:

1. **Payload Extraction:** Backend extracts `idCardImageBase64`.
2. **Validation:** Validates size (max 5 MB payload limit) and MIME type header (`image/jpeg` or `image/png`).
3. **Binary Decoding:** Decodes the Base64 string into standard binary byte buffer.
4. **File Storage:**
   - **Production:** Uploads the binary stream to S3-compatible object storage (e.g. MinIO on NEHU premises, AWS S3, or Cloudflare R2).
   - **Development:** Saves to local server disk storage (e.g. `./uploads/id_cards/{user_id}.jpg` served as static files).
5. **Database Record:** Stores the publicly accessible or pre-signed URL in PostgreSQL (`users.avatar_url` or `users.id_card_url`).
6. **Response:** Returns the created `User` object containing `avatarUrl`:
   ```json
   {
     "tokens": {
       "accessToken": "jwt...",
       "refreshToken": "jwt...",
       "expiresIn": 3600
     },
     "user": {
       "id": "c7a8b6e2-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
       "name": "Nikunj Maheshwari",
       "email": "nikunj@students.nehu.ac.in",
       "role": "student",
       "avatarUrl": "https://storage.nehu.ac.in/id-cards/c7a8b6e2.jpg",
       "createdAt": "2026-09-21T03:00:00Z"
     }
   }
   ```

---

## 3. How the App Accesses the ID Card Later

When displaying user verification or profile in `app/(app)/profile.tsx`:

- The app loads the remote image URL returned in `user.avatarUrl`.
- Handled cleanly via React Native / Expo Image caching:
  ```tsx
  <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
  ```

---

## 4. Key Security & Architecture Benefits

1. **Zero Device Bloat:** Avoids bloating app storage with large uncompressed camera images.
2. **Tamper Proof:** The ID card is stored server-side after registration; users cannot alter their local storage to forge verification.
3. **Decoupled Architecture:** Client is simple and lightweight; backend controls storage tiers, retention policies, and access permissions.
4. **Single Source of Truth:** Synchronized with the contracts defined in:
   - [`src/types/api.types.ts`](../src/types/api.types.ts)
   - [`docs/API_CONTRACT.md`](./API_CONTRACT.md)
