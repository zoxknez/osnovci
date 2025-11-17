# 🔐 FAZA 3: Biometric Authentication (WebAuthn)

## 🎯 OBJECTIVE

Implementirati **biometric authentication** (Face ID, Fingerprint, Windows Hello) koristeći WebAuthn standard.

**Use Case**: Brza prijava bez lozinke nakon inicijalne registracije.

---

## 📊 PLAN

### **1. Install Dependencies** (5 min)
```bash
npm install @simplewebauthn/server @simplewebauthn/browser
npm install -D @types/node
```

### **2. Create Database Schema** (10 min)
```prisma
model BiometricCredential {
  id              String   @id @default(cuid())
  userId          String
  credentialID    String   @unique // Base64URL encoded
  credentialPublicKey Bytes
  counter         BigInt   @default(0)
  deviceType      String?  // "platform" or "cross-platform"
  deviceName      String?  // "iPhone 15", "MacBook Pro"
  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([credentialID])
  @@map("biometric_credentials")
}
```

### **3. API Endpoints** (2h)

#### **A. Challenge Endpoint**
`app/api/auth/biometric/challenge/route.ts`
- Generate challenge
- Store in session/Redis (temporary)
- Return options for client

#### **B. Register Endpoint**
`app/api/auth/biometric/register/route.ts`
- Verify registration response
- Save credential to database
- Associate with user

#### **C. Verify Endpoint**
`app/api/auth/biometric/verify/route.ts`
- Generate authentication challenge
- Verify assertion
- Create session

### **4. Helper Functions** (1h)
`lib/auth/biometric-server.ts`
- `generateRegistrationOptions()`
- `verifyRegistrationResponse()`
- `generateAuthenticationOptions()`
- `verifyAuthenticationResponse()`

### **5. Client Integration** (2h)
- `lib/auth/biometric-client.ts`
- React hook: `use-biometric-auth.ts`
- UI component: `BiometricSetup.tsx`

---

## 🚀 IMPLEMENTATION

Starting with dependencies...
