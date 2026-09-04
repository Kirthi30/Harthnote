# Hearthnote — Warm Personal Journal

> *"A warm place to keep your thoughts."*

Hearthnote is a distraction-free, notebook-style personal journaling, mood-tracking, and contemplative reflection web application. Built with **React 19**, **Tailwind CSS**, **Google Cloud Firestore**, **Node.js / Express**, and the **Gemini 3.6 Flash API**, it prioritizes human reflection first and gentle, supportive AI synthesis second.

---

## 🔒 Security & Threat Model Overview

Hearthnote incorporates defense-in-depth across the **5 Core Threat Zones**:

| Threat Zone | Risk Scenario | Implemented Mitigation |
|---|---|---|
| **1. Input Surfaces** | Malicious injection in journal text, oversized payloads crashing server, XSS in journal entries or voice dictation transcripts. | Strict Express JSON payload limits (10MB), client and server-side text sanitization, parameterized writes, null-safe payload ingestion, and React-safe DOM property rendering (no `dangerouslySetInnerHTML`). |
| **2. Planning & Reasoning** | Prompt injection attempting to alter AI persona into giving clinical diagnoses, crisis advice, or violating user privacy boundaries. | Immutable system instructions strictly enforcing warm non-clinical tone, strict schema validation via JSON `responseSchema`, non-diagnostic boundary disclaimers, and automated distress detection with 988 Crisis Lifeline guidance. |
| **3. Tool Execution & Server APIs** | SSRF or unauthenticated API access to Gemini proxy endpoints; excessive requests exhausting quota. | Server-side Gemini API proxy, resilient fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`), rate-limiting error handling, zero exposure of `GEMINI_API_KEY` to client browser. |
| **4. Memory & State** | Cross-user data leakage in Firestore, unauthorized reads/writes to other users' journals, unauthenticated tampering. | Cloud Firestore security rules with strict path-bound user isolation (`request.auth.uid == userId`), `firebase-blueprint.json` schema validation, immutable `userId` and `createdAt` fields, client-side PIN convenience lock with plain-language security disclosures. |
| **5. Inter-System Communication** | Leakage of API tokens in error payloads or client bundles. | Zero hardcoded keys; operational secrets retrieved exclusively via Google Cloud Secret Manager and `process.env.GEMINI_API_KEY`; sanitized error responses returned to frontend without leaking stack traces or internal environment variables. |

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite | Distraction-free, responsive notebook UI with fluid view transitions |
| **Styling & Design** | Tailwind CSS + Warm Paper Theme | Fraunces display serif, Lora body, ivory `#FAF6EE` canvas, terracotta `#C97C4C` accents, bespoke illustrated mood icons |
| **User Identity** | Firebase Authentication | Google Sign-In with popup OAuth, guest exploration mode, zero local password storage |
| **Database** | Google Cloud Firestore | Per-user isolated document storage for entries, mood logs, weekly reflections, and saved dialogue sessions |
| **Backend Server** | Node.js + Express | Authenticated API proxy for Gemini, static asset server, and Vite development middleware |
| **AI Synthesis** | Google GenAI SDK (`@google/genai`) | Server-side 1-2 sentence "gentle thoughts", multi-turn weekly inquiry companion, speech polishing, and emotional mirrors |
| **Voice Dictation** | Web Speech API | Multi-language voice dictation across 18 localized languages with gentle text polish |

---

## ✨ Key Features & Capabilities

- **10 Custom Illustrated Mood Archetypes**:
  - *Radiant* (Golden sun), *Calm* (Botanical branch), *Hopeful* (Sparkle stars), *Reflective* (Autumn leaves), *Tender* (Blooming heart flower), *Anxious* (Lightning bolt), *Sad* (Sculpted teardrop), *Angry* (Campfire flame), *Overwhelmed / Tringara* (Tornado whirlwind), and *Weary* (Rain cloud).
- **Distraction-Free Journaling**:
  - Guided templates (*Gratitude & Small Joys*, *Evening Unwind*, *Morning Clarity*, *Overcoming Resistance*, *Free Writing*).
  - Floating word counters, customizable prompt drawers, rich text formatting, and voice dictation.
- **Gentle Post-Entry Reflections**:
  - Optional, non-intrusive 1–2 sentence contemplative reflections generated post-save without cluttering the writing flow.
- **Weekly Emotional Mirror & Insights**:
  - 8-Week Historical Carousel for reviewing past weeks.
  - Synthesis of mood trajectory, core themes, and personalized inquiry questions.
- **Interactive Weekly Inquiry Companion**:
  - Socratic dialogue modal exploring weekly patterns with context-aware Gemini responses.
  - Multi-language voice dictation and one-click export of dialogue notes directly to journal entries.
- **Privacy & User Sovereignty**:
  - 3-Tier AI Memory Control (*None*, *Light*, *Deep*).
  - Full data backup export in Markdown (`.md`), JSON (`.json`), and CSV (`.csv`).
  - Account and data wipe with complete Firestore document purging.
  - 4-Digit PIN screen lock for shared devices.

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

## 🧪 Functional Stability & Test Walkthrough Guide

| # | Feature / User Journey | Verification Steps | Expected Result |
|---|---|---|---|
| **1** | **Landing Page & Authentication** | 1. Open app.<br>2. Click **"Sign in with Google"** or **"Explore Demo Notebook"**. | User lands immediately in private dashboard with personalized greeting, mood selector, and streak summary. |
| **2** | **Daily Mood Check-In & Streak** | 1. On Home screen, tap any illustrated mood logo (e.g. *Radiant ☀️* or *Calm 🌿*).<br>2. Observe the 7-day dot trail and streak counter. | Mood is persisted immediately to Firestore (`/users/{uid}/moodLogs`) and today's status updates with the custom vector mark. |
| **3** | **Template Selection & Journal Writing** | 1. Click **"Write Entry"** or choose a template like *Gratitude & Small Joys*.<br>2. Answer guided prompts or write freely.<br>3. Test voice dictation via microphone icon.<br>4. Select entry mood and click **"Save Entry"**. | Entry is saved to Firestore. A settling transition opens the post-save modal displaying a gentle 1-2 sentence reflection thought from Gemini. |
| **4** | **Notebook History & Filtering** | 1. Navigate to **History** tab.<br>2. Toggle between **List** and **Calendar** views.<br>3. Filter by mood (e.g. *Tender*) or template, or search by keyword.<br>4. Click any entry card. | Read-only notebook view opens showing entry content, prompt answers, mood badge, and gentle thought. User can Edit or Delete the entry. |
| **5** | **Weekly Insights & Emotional Mirror** | 1. Navigate to **Insights** tab.<br>2. Use the 8-Week Carousel to pick a week window.<br>3. Click **"Generate Weekly Reflection"**.<br>4. Review the mood trajectory, core themes, and gentle inquiry prompts. | AI synthesis is generated via the server-side Gemini fallback ladder and persisted to Firestore. |
| **6** | **Interactive Weekly Inquiry Dialogue** | 1. In Insights tab, click **"Begin Inquiry Dialogue"**.<br>2. Select a starting prompt or speak via voice dictation.<br>3. Exchange multi-turn reflective thoughts with the Socratic AI companion.<br>4. Click **"Save Conversation as Reflection Note"**. | Conversation is saved to Firestore (`/users/{uid}/reflectionChats/{chatId}`) and archived in the Saved Dialogues tab. |
| **7** | **AI Memory Depth & Verification** | 1. In **Settings**, change AI Memory Level between *None*, *Light*, and *Deep*.<br>2. Click **"Verify AI Memory Depth"**.<br>3. Confirm live API test verifies the configured memory constraint. | System enforces memory boundary; in *None* mode, AI synthesis is disabled and journal content remains private. |
| **8** | **Data Portability & Backup Export** | 1. In **Settings**, select *Markdown (.md)*, *JSON (.json)*, or *CSV (.csv)*.<br>2. Click **"Download Backup"**. | A formatted backup file containing all user entries, timestamps, and mood metadata downloads immediately. |
| **9** | **PIN Screen Lock & Privacy** | 1. In Settings, enable PIN Lock and enter a 4-digit code.<br>2. Click **"Lock Notebook"** in the top navigation.<br>3. Test incorrect PIN, then correct PIN. | App prompts for 4 digits with animated dot feedback and unlocks smoothly upon entering the correct PIN. |
| **10** | **Account Deletion & Data Wipe** | 1. In Settings, click **"Delete Account & All Data"**.<br>2. Type confirmation text `DELETE ALL MY DATA` and confirm. | All Firestore collections and subcollections for the user are purged, user signs out, and session resets to landing page. |

---

## 📜 License & Disclaimers

Hearthnote is a non-diagnostic, contemplative companion designed for mindful personal reflection. It is not intended as a substitute for medical or clinical care. If you or someone you know is in crisis, please connect with the Suicide & Crisis Lifeline by calling or texting **988**.
