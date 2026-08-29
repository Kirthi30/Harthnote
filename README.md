# Hearthnote — Warm Personal Journal

> *"A warm place to keep your thoughts."*

Hearthnote is a distraction-free, notebook-style personal journaling and reflection web application. Built with **React 19**, **Tailwind CSS**, **Cloud Firestore**, and the **Gemini 3.6 Flash API**, it prioritizes human reflection first and gentle AI synthesis second.

---

## 🔒 Security & Threat Model Overview

Hearthnote incorporates defense-in-depth across the **5 Core Threat Zones**:

| Threat Zone | Risk Scenario | Implemented Mitigation |
|---|---|---|
| **1. Input Surfaces** | Malicious injection in journal text, oversized payloads crashing server, XSS in journal entries. | Strict express JSON size limits (10MB), client and server-side text sanitization, parameterized writes, and React safe text rendering. |
| **2. Planning & Reasoning** | Prompt injection attempting to alter AI persona into giving medical advice, crisis diagnosis, or breaking privacy guidelines. | Immutable system instructions strictly enforcing warm non-clinical tone, strict schema validation via JSON responseSchema, and distress detection rules. |
| **3. Tool Execution & Server APIs** | SSRF or unauthenticated API access to Gemini proxy endpoints; excessive requests exhausting quota. | Server-side Gemini API proxy, resilient fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`), rate-limiting error handling, zero exposure of `GEMINI_API_KEY` to client. |
| **4. Memory & State** | Cross-user data leakage in Firestore, unauthorized reads of other users' journals, unauthenticated tampering. | Cloud Firestore security rules with strict user isolation (`request.auth.uid == userId`), `firebase-blueprint.json` schema validation, immutable `userId` and `createdAt` fields, client-side PIN convenience lock with plain-language disclosure. |
| **5. Inter-System Communication** | Leakage of API tokens in error payloads or client bundles. | Zero hardcoded keys; all secrets retrieved exclusively via `process.env.GEMINI_API_KEY`; sanitized error responses returned to frontend without leaking stack traces or internal environment variables. |

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite | Distraction-free, responsive notebook UI |
| **Styling & Design** | Tailwind CSS + Warm Paper Theme | Fraunces display serif, Lora body, ivory `#FAF6EE` background, terracotta `#C97C4C` accents |
| **User Identity** | Firebase Authentication | Google Sign-In with popup OAuth, zero local password storage |
| **Database** | Google Cloud Firestore | Per-user isolated document storage for entries, mood logs, and reflections |
| **Backend Server** | Node.js + Express | API proxy for Gemini, static asset server, and Vite dev middleware |
| **AI Synthesis** | Google GenAI SDK (`@google/genai`) | Server-side 1-2 sentence "gentle thoughts" and weekly reflection mirrors |

---

## 🚀 Deployment & Google Cloud Run Setup

### 1. Prerequisites & API Activation

Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated:

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

### 2. Secret Manager Configuration

Store your Gemini API Key securely in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### 3. Deploy Firestore Security Rules

Ensure your `firestore.rules` enforce strict per-user document isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation: each user can only read and write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

### 4. Build & Deploy to Cloud Run

Deploy Hearthnote as a unified containerized service:

```bash
# Build and deploy container directly to Cloud Run
gcloud run deploy hearthnote-app \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

### 5. Mandatory Campaign Labeling

Apply the mandatory verification label to register the Cloud Run service:

```bash
gcloud run services update hearthnote-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Testing Guide

| # | Feature / User Journey | Verification Steps | Expected Result |
|---|---|---|---|
| **1** | **Landing Page & Authentication** | 1. Open app.<br>2. Click **"Sign in with Google"** or **"Explore Demo Notebook"**. | User lands immediately in private dashboard with personalized greeting and streak summary. |
| **2** | **Daily Mood Check-In** | 1. On Home screen, tap any of the 5 gentle moods (e.g. *Calm 🌿*).<br>2. Observe the 7-day dot trail. | Mood is persisted immediately to Firestore `/users/{uid}/moodLogs` and dot trail highlights today. |
| **3** | **Template Selection & Writing** | 1. Click **"Gratitude & Small Joys"**.<br>2. Answer guiding questions or write freely in the lined paper surface.<br>3. Select entry mood.<br>4. Click **"Close & Save Entry"**. | Entry is saved to Firestore. A gentle settling transition displays the confirmation with a 1-2 sentence gentle thought from Gemini. |
| **4** | **Notebook History & Filtering** | 1. Navigate to **History** tab.<br>2. Toggle between **List** and **Calendar** views.<br>3. Filter by template (e.g. Gratitude) or search by keyword.<br>4. Click an entry card. | Read-only notebook view opens showing entry details, guiding questions, and gentle thoughts. User can Edit or Delete entry. |
| **5** | **Insights, Inquiries & Reflection History** | 1. Navigate to **Insights** tab.<br>2. Review 7-day mood flow.<br>3. Click **"Refresh Mirror"** to generate AI emotional synthesis.<br>4. Type answers in the **"Gentle Inquiries to Ponder"** input fields.<br>5. Click **"Save Thoughts to History"**.<br>6. Switch to the **"Reflection History"** tab to view saved weekly mirrors and past recorded inquiry thoughts. | User thoughts are stored with the weekly mirror in Firestore. History tab displays chronological archive of past reflections and user inquiry responses. |
| **6** | **Settings & Memory Configuration** | 1. Navigate to **Settings**.<br>2. Change AI Memory Level (None / Light / Deep).<br>3. Set daily reminder time.<br>4. Set a 4-digit PIN lock. | Settings and security preferences are saved immediately to `/users/{uid}` with confirmation toast. |
| **7** | **PIN Screen Lock** | 1. In navigation, click **"Lock Notebook"**.<br>2. Attempt incorrect PIN, then correct PIN. | App prompts for 4 digits with animated dot feedback and unlocks smoothly upon matching code. |

---

## 📜 License & Disclaimers

Hearthnote is a non-diagnostic, contemplative companion designed for mindful reflection. It is not intended as a substitute for medical or clinical care. If you or someone you know is in crisis, please connect with the Suicide & Crisis Lifeline by calling or texting **988**.
