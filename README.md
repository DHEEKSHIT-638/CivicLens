# CivicLens | AI Digital Twin & Civic Action Network

### 🏆 Category: Community Hero - Hyperlocal Problem Solver

CivicLens is an AI-powered municipal digital twin platform and hyperlocal community action network. It empowers citizens to identify, validate, and track community issues while enabling municipal administrators and field contractors to coordinate resolutions on a collaborative 3D spatial canvas.

---

## 💡 Problem Statement
Hyperlocal public infrastructure challenges—such as potholes, water grid leakages, and broken streetlights—often go unresolved due to fragmented reporting, lack of tracking transparency, and a lack of tools to drive civic accountability. Citizens lack official notice drafting abilities, city administrators struggle to allocate emergency budgets without predictive telemetry, and field contractors work disconnected from real-time community updates.

**CivicLens solves this by uniting citizens, municipal admins, and field contractors into a single automated digital twin network.**

---

## 🌟 Key Features
* 🗺️ **3D Municipal Digital Twin Map**: An interactive, vector-based Maplibre canvas displaying extruded 3D building heights, real-time status pins, and soft pulsing user location markers.
* 🧠 **AI-Powered Telemetry Analysis**: Uses the Gemini API to automatically categorize reports, justify severity levels, calculate estimated dimensions, and draft required bills of materials (BOM).
* 🔮 **AI Predictive Decay Telemetry**: Forecasts the probability of rapid hazard degradation based on historical dimensions and local weather trends.
* 🏛️ **Citizens' Advocacy Desk**: Auto-generates legally structured municipal grievance drafts, formal Right to Information (RTI) notices, public change.org petitions, and pre-formatted social media campaign alerts (Twitter/WhatsApp).
* 🎮 **Gamified Sentinel Quest Hub**: Citizens earn XP, rank up levels, and win Karma points by verifying community hazards.
* 💼 **Municipal Control Center**: A master-detail responsive operations panel for city administrators to audit reports, approve budgets, and coordinate dispatches.
* 🛠️ **Contractor Operations Depot**: Tracks depot material inventory (asphalt bags, collars, LED modules), manages crew dispatches, and logs repair resolutions.

---

## 🛠️ Tech Stack & Google Technologies
* **Frontend**: React (v19), TypeScript, Vite (v8)
* **Styling**: Tailwind CSS (v3) configuring a premium biophilic-glassmorphism dark theme
* **Mapping**: Maplibre GL (v5) supporting WebGL rendering
* **AI Processing**: Google AI Studio & Gemini API (`gemini-2.5-flash`)
* **Database & Auth**: Firebase Firestore
* **Deployment**: Google Cloud Platform (Firebase Hosting / GCP Cloud Run)

---

## ⚙️ Local Setup Instructions

### Prerequisites
* [Node.js v20+](https://nodejs.org/)
* npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/DHEEKSHIT-638/CivicLens.git
   cd CivicLens
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_google_ai_studio_api_key
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```

---

## 🚀 Google Cloud Platform (GCP) Deployment

### Option A: Firebase Hosting (Recommended, Free-Tier, Card-Free)
1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and build:
   ```bash
   firebase login
   npm run build
   ```
3. Initialize and deploy:
   ```bash
   firebase init hosting
   # Select 'Use an existing project' -> select your project
   # Set public directory to 'dist'
   # Configure as a single-page app -> Yes
   firebase deploy --only hosting
   ```

### Option B: Google Cloud Run (Containerized Deployment)
1. Open **Google Cloud Shell** and clone the repo:
   ```bash
   git clone https://github.com/DHEEKSHIT-638/CivicLens.git
   cd CivicLens
   ```
2. Set your environment variables in `.env` and deploy:
   ```bash
   gcloud config set project [YOUR_PROJECT_ID]
   gcloud run deploy civiclens --source . --region us-central1 --allow-unauthenticated --port 8080
   ```
