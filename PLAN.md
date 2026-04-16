# Markdown Notes App - Detailed Implementation Plan

## 1. Project Overview
Build a personal/internal web-based markdown notes application with optional per-note encryption.

### Core Requirements
- Next.js full-stack (frontend + backend)
- MongoDB database
- Register / Login (no email verification)
- CRUD markdown notes
- Per-note encryption toggle (encrypted or normal)
- Encrypt/decrypt in browser only
- One master key per user
- Master key encrypted using key derived from password
- Store encrypted session key in localStorage
- Multi-device usage

---

## 2. Recommended Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Markdown Editor: @uiw/react-md-editor

### Backend
- Next.js Route Handlers
- JWT auth (HttpOnly cookie)
- Middleware auth guard

### Database
- MongoDB
- Mongoose

### Security / Crypto
- Web Crypto API
- AES-GCM
- PBKDF2 (or Argon2 later)
- bcrypt for server password hash

---

## 3. Architecture

Client Browser:
- Register/Login UI
- Note Editor UI
- Crypto operations
- Session unlock state

Next.js Server:
- Auth APIs
- Notes APIs
- MongoDB access
- Cookie session validation

Database:
- users
- notes

---

## 4. Data Models

## User Model
```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  kdfSalt: string,
  encryptedMasterKey: string,
  masterKeyIv: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Note Model
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  content: string,
  isEncrypted: boolean,
  iv?: string,
  tags?: string[],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. Security Design

## Password Usage
Password is used for:
1. Server authentication (bcrypt hash)
2. Derive browser unlock key via PBKDF2

## Master Key
- Generated randomly on register
- One per user
- Used for encrypted notes only

## Stored on Server
- passwordHash
- kdfSalt
- encryptedMasterKey
- masterKeyIv

## Never Stored Plaintext
- Raw password
- Plain master key
- Plain content of encrypted notes

---

## 6. Register Flow

1. User enters email/password
2. Browser generates random masterKey
3. Browser derives passwordKey using PBKDF2(password + salt)
4. Browser encrypts masterKey => encryptedMasterKey
5. Submit register request:
- email
- password
- encryptedMasterKey
- salt
- iv
6. Server hashes password with bcrypt
7. Save user
8. Auto login

---

## 7. Login Flow

1. User enters email/password
2. Server validates passwordHash
3. Server returns:
- encryptedMasterKey
- kdfSalt
- masterKeyIv
4. Browser derives passwordKey
5. Browser decrypts masterKey
6. Browser stores wrapped session key in localStorage
7. Set auth cookie

---

## 8. Session Storage Strategy

localStorage example:
```json
{
  "sessionKey": "encrypted-session-data",
  "lastLogin": "timestamp"
}
```

Do not store raw password.
Prefer auto-expire after inactivity.

---

## 9. Notes CRUD Rules

## Create Note
Fields:
- title
- content
- isEncrypted

If isEncrypted = false:
- Save plaintext

If isEncrypted = true:
- Encrypt title/content with masterKey
- Save ciphertext + iv

## Read Notes
If encrypted:
- Decrypt in browser
Else:
- Render directly

## Update Note
Same logic as create.

## Delete Note
Soft or hard delete.

---

## 10. Toggle Encryption

## Plain -> Encrypted
1. Load plaintext note
2. Encrypt content
3. Save encrypted version
4. Set isEncrypted=true

## Encrypted -> Plain
1. Decrypt note
2. Save plaintext
3. Remove iv
4. Set isEncrypted=false

---

## 11. API Routes

## Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Notes
- GET /api/notes
- POST /api/notes
- GET /api/notes/:id
- PUT /api/notes/:id
- DELETE /api/notes/:id

---

## 12. Suggested Folder Structure

```text
src/
  app/
    login/
    register/
    notes/
    api/
      auth/
      notes/
  components/
    editor/
    notes/
    auth/
  lib/
    db.ts
    auth.ts
    crypto.ts
    validators.ts
  models/
    User.ts
    Note.ts
  middleware.ts
```

---

## 13. UI Pages

## Public
- /login
- /register

## Private
- /notes
- /notes/new
- /notes/[id]

## Features
- Note list
- Search box
- Tag filter
- Markdown preview
- Encrypt toggle
- Delete confirm
- Dark mode

---

## 14. Search Strategy

Plain notes:
- Server-side search in MongoDB

Encrypted notes:
- Client-side search after decrypt

Optional future:
- Search index cache in browser

---

## 15. Validation Rules

Register:
- valid email
- password min 8 chars

Note:
- title max length
- content max size
- tags normalized

Use Zod on client + server.

---

## 16. Security Checklist

- HttpOnly auth cookie
- SameSite cookie
- Rate limit login
- CSP headers
- Sanitize markdown preview
- Validate ObjectId ownership
- CSRF protection if needed
- Input validation
- Hide stack traces

---

## 17. Deployment Options

## Recommended
- Vercel (Next.js)
- MongoDB Atlas

## Alternative
- VPS + Docker + PM2 + Nginx

---

## 18. Development Phases

## Phase 1 - MVP
- Auth
- Notes CRUD
- Markdown editor
- Optional encryption
- Responsive UI

## Phase 2
- Tags
- Search
- Auto-save
- Dark mode polish

## Phase 3
- PWA offline
- Export markdown files
- Import notes
- Backup/restore

---

## 19. Testing Checklist

- Register works
- Login works
- Wrong password rejected
- Encrypted note readable after refresh
- Plain note unaffected
- Toggle encryption works
- Unauthorized access blocked
- Multi-device login works
- Mobile UI usable

---

## 20. Nice-to-Have Enhancements

- Note history
- Trash bin
- Pin notes
- Folder tree
- Keyboard shortcuts
- Sync status
- Password change flow
- Biometric unlock (WebAuthn)

---

## 21. Final Build Priority

Build in this order:
- [x] 1. DB connection
- [x] 2. User model
- [x] 3. Auth APIs
- [x] 4. Login/Register UI
- [x] 5. Crypto helpers
- [x] 6. Notes APIs
- [x] 7. Notes UI (Split-Pane Sidebar + Main Editor)
- [x] 8. Encryption toggle
- [x] 9. Search
- [x] 10. Auto-save (5s debounce)
- [x] 11. Tags Management
- [x] 12. Persistent Editor Settings (localStorage)
- [x] 13. UI Customization (Space Mono Font, Seamless Dark Mode)
- [ ] 14. Deploy (Vercel / VPS)

