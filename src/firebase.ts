import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query,
  orderBy,
  getDocs,
  limit,
  setDoc
} from "firebase/firestore";

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

// Firebase Configurations from VITE Env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are provided
const isRealFirebase = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let db: any = null;
let app: any = null;
let storage: any = null;

if (isRealFirebase) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    storage.maxUploadRetryTime = 3000; // limit retries to 3 seconds to avoid infinite hangs on CORS blocks
    storage.maxOperationRetryTime = 3000;
    console.log("🔥 Firebase initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase, falling back to mock:", error);
  }
}

export async function uploadImage(file: File, path: string): Promise<string> {
  if (isRealFirebase && storage) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.warn("Firebase Storage upload failed (e.g. due to CORS or connection error). Falling back to base64 encoding for local persistence:", error);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  } else {
    // Return base64 for local storage persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export async function seedFirestoreIfEmpty() {
  if (!isRealFirebase || !db) return;
  try {
    const reportsRef = collection(db, "reports");
    
    // Connection timeout limit (4 seconds) to prevent infinite stall
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firestore connection timed out")), 4000)
    );

    const snapshot = await Promise.race([
      getDocs(query(reportsRef, limit(1))),
      timeoutPromise
    ]) as any;

    if (!snapshot.empty) {
      console.log("🌱 Firestore is already seeded with data.");
      return;
    }

    console.log("🌱 Seeding Firestore with initial Digital Twin data...");
    
    // Seed user
    await setDoc(doc(db, "users", "current_user"), {
      uid: "current_user",
      display_name: "Civic Hero",
      level: 3,
      xp: 450,
      karma_points: 120,
      completed_quests: []
    });

    await setDoc(doc(db, "users", "user_suresh"), {
      uid: "user_suresh",
      display_name: "Suresh Kumar",
      level: 4,
      xp: 680,
      karma_points: 190,
      completed_quests: []
    });

    await setDoc(doc(db, "users", "user_ananya"), {
      uid: "user_ananya",
      display_name: "Ananya Rao",
      level: 2,
      xp: 310,
      karma_points: 85,
      completed_quests: []
    });

    await setDoc(doc(db, "users", "user_vikram"), {
      uid: "user_vikram",
      display_name: "Vikram Malhotra",
      level: 5,
      xp: 950,
      karma_points: 310,
      completed_quests: []
    });

    // Seed reports
    await setDoc(doc(db, "reports", "report_1"), {
      coordinates: { latitude: 17.712, longitude: 83.321 }, // Sector 4
      location_name: "Sector 4 Road, near Central Market",
      category: "road_hazard",
      sub_category: "Large Alligator Cracks",
      severity: 4,
      report_count: 3,
      status: "open",
      image_url: "https://images.unsplash.com/photo-1599740831146-80e6f755c92c?auto=format&fit=crop&w=600&q=80",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      engineering_data: {
        category: "road_hazard",
        sub_category: "Large Alligator Cracks",
        severity_score: 4,
        severity_justification: "Deep structural road cracking forming a major pothole right in the active two-wheeler lane, posing high risk of accidents.",
        estimated_dimensions: "1.4m x 0.8m x 0.12m",
        required_materials: [
          { item: "Cold Mix Asphalt", quantity: "3 bags (25kg each)" },
          { item: "Tack Coat Emulsion", quantity: "5 Litres" }
        ],
        estimated_cost_inr: 6800,
        estimated_labor_hours: 3,
        hazard_mitigation_step: "Erect warning cones and barricades immediately."
      },
      advocacy_kit: {
        official_letter_markdown: "### Grievance Redressal Notice\n\n**To:**\nThe Ward Officer, Ward 22\nGreater Municipal Corporation\nMunicipal District, India\n\n**Subject:** Urgent Repair Request: Severe Road Hazard at Sector 4 Road\n\nDear Sir/Madam,\n\nWe are writing to draw your attention to a critical structural road hazard identified at coordinates (17.712, 83.321) on Sector 4 Road. \n\nAn engineering audit estimates dimensions of 1.4m x 0.8m with alligator cracking that has degraded into a deep depression. This is a high-traffic sector. The estimated material cost is ₹6,800.\n\nWe request immediate patching under the Municipalities Act. Failing this, community escalation will be initiated.\n\nSincerely,\nConcerned Citizens of Municipal District",
        petition_title: "Fix the Sector 4 Road Pothole Before Accidents Happen",
        petition_body_markdown: "Every weekend, thousands of families ride along Sector 4 Road. Near the market junction, there is a massive cracked road hazard that forces motorists to swerve suddenly. Let's gather 100 signatures to compel the Municipal Corporation to patch this hazard immediately!",
        rti_notice_markdown: "### FORM 'A'\n*See Rule 3(1)*\n**APPLICATION FOR INFORMATION UNDER THE RTI ACT, 2005**\n\nTo,\nPublic Information Officer (PIO)\nMunicipal Engineering Department\n\n1. **Full name of applicant:** Citizens Network\n2. **Particulars of Information Required:**\n   - Details of road maintenance budgets allocated for Ward 22 for the current financial year.\n   - Copy of contracts/contractor logs relating to repair work on Sector 4 Road.\n   - Specific reasons/delay analysis for the unrepaired road hazard at coordinates (17.712, 83.321).\n\n**Place:** Local Ward\n**Date:** " + new Date().toLocaleDateString(),
        social_media_campaigns: {
          twitter_x_post: "⚠️ Critical road hazard detected near Sector 4 Road (17.712, 83.321). Swerving required. Fix it immediately! Details: Est. Repair cost ₹6,800. #CivicLens #RoadSafety",
          whatsapp_alert: "🚨 Sector 4 Road Alert: Large pothole reported near coordinates (17.712, 83.321). Please drive carefully, especially at night. Sign the petition here: [Link]"
        }
      }
    });


    await setDoc(doc(db, "reports", "report_2"), {
      coordinates: { latitude: 17.781, longitude: 83.378 }, // Academic Sector
      location_name: "College Road, Academic Sector",
      category: "electrical_grid",
      sub_category: "Flickering Streetlight",
      severity: 3,
      report_count: 1,
      status: "open",
      image_url: "https://images.unsplash.com/photo-1509023467864-1ecbb3403333?auto=format&fit=crop&w=600&q=80",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      engineering_data: {
        category: "electrical_grid",
        sub_category: "Flickering Streetlight",
        severity_score: 3,
        severity_justification: "Streetlight column is flickering rapidly and stays dark for long intervals. Visual inspection shows loose wiring at the pole base.",
        estimated_dimensions: "10m tall pole",
        required_materials: [
          { item: "LED Lamp Module (90W)", quantity: "1 unit" },
          { item: "Armour Joint Kit", quantity: "1 unit" }
        ],
        estimated_cost_inr: 4500,
        estimated_labor_hours: 2,
        hazard_mitigation_step: "Isolate circuit panel before splicing cables."
      }
    });

    await setDoc(doc(db, "reports", "report_3"), {
      coordinates: { latitude: 17.721, longitude: 83.315 }, // Central Sector
      location_name: "Central Junction Road",
      category: "water_grid",
      sub_category: "Water Pipe Leakage",
      severity: 2,
      report_count: 2,
      status: "open",
      image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      engineering_data: {
        category: "water_grid",
        sub_category: "Water Pipe Leakage",
        severity_score: 2,
        severity_justification: "Underground GI water pipeline has developed a hairline crack. Drinking water is pooling and flooding the pedestrian walkway.",
        estimated_dimensions: "2-inch GI pipeline, 0.5m depth",
        required_materials: [
          { item: "GI Coupling Collar 2\"", quantity: "1 unit" },
          { item: "Teflon Tape & Sealant", quantity: "2 rolls" }
        ],
        estimated_cost_inr: 2200,
        estimated_labor_hours: 1.5,
        hazard_mitigation_step: "Shut off valve at Sector C main supply line."
      }
    });

    // Seed quests
    await setDoc(doc(db, "quests", "quest_1"), {
      title: "Verify Academic Sector Light",
      type: "verify",
      target_report_id: "report_2",
      xp_reward: 50,
      karma_reward: 10,
      status: "active",
      joined_users: []
    });

    await setDoc(doc(db, "quests", "quest_2"), {
      title: "Junction Leak Check",
      type: "verify",
      target_report_id: "report_3",
      xp_reward: 50,
      karma_reward: 10,
      status: "active",
      joined_users: []
    });

    await setDoc(doc(db, "quests", "quest_3"), {
      title: "Sector 4 Debris Patrol",
      type: "coop",
      target_report_id: "report_1",
      xp_reward: 80,
      karma_reward: 20,
      status: "active",
      joined_users: ["user_suresh", "user_ananya"]
    });


    await setDoc(doc(db, "quests", "quest_4"), {
      title: "Pothole Filling Inspection",
      type: "verify",
      target_report_id: "report_1",
      xp_reward: 40,
      karma_reward: 10,
      status: "active",
      joined_users: []
    });

    await setDoc(doc(db, "quests", "quest_5"), {
      title: "Electrical Grid Check",
      type: "coop",
      target_report_id: "report_2",
      xp_reward: 100,
      karma_reward: 25,
      status: "active",
      joined_users: ["user_vikram"]
    });

    await setDoc(doc(db, "quests", "quest_6"), {
      title: "Waste Sorting Verification",
      type: "verify",
      target_report_id: "report_3",
      xp_reward: 60,
      karma_reward: 15,
      status: "active",
      joined_users: []
    });

    // Seed neighborhoods
    await setDoc(doc(db, "neighborhoods", "sector_beach"), {
      sector_id: "sector_beach",
      sector_name: "Coastal Sector (Zone 22)",
      health_score: 90,
      bounds: [
        [83.310, 17.705],
        [83.330, 17.705],
        [83.330, 17.725],
        [83.310, 17.725]
      ]
    });

    await setDoc(doc(db, "neighborhoods", "sector_siripuram"), {
      sector_id: "sector_siripuram",
      sector_name: "Transit Sector (Zone 15)",
      health_score: 95,
      bounds: [
        [83.305, 17.715],
        [83.325, 17.715],
        [83.325, 17.730],
        [83.305, 17.730]
      ]
    });

    await setDoc(doc(db, "neighborhoods", "sector_rushikonda"), {
      sector_id: "sector_rushikonda",
      sector_name: "Academic Sector (Zone 5)",
      health_score: 92,
      bounds: [
        [83.365, 17.770],
        [83.385, 17.770],
        [83.385, 17.790],
        [83.365, 17.790]
      ]
    });

    // Seed notifications
    await setDoc(doc(db, "notifications", "alert_1"), {
      report_id: "report_1",
      sector_id: "sector_beach",
      title: "🚨 CRITICAL: Weather Damage Warning",
      message: "Sector 4 Road has a 88% risk of expanding into a severe road crater within 2 days due to forecasted heavy rainfall. Proactive asphalt filling is advised.",
      created_at: new Date().toISOString(),
      type: "critical_forecast",
      status: "unread"
    });


    console.log("🌱 Firestore seeding complete!");
  } catch (error: any) {
    if (error.code === "permission-denied" || error.message?.includes("permissions")) {
      console.log("ℹ️ Firestore write permissions locked. Running in secure local sandbox mode.");
    } else {
      console.log("ℹ️ Firestore connection unavailable. Running in secure local sandbox mode.");
    }
  }
}

// ----------------------------------------------------
// LOCAL STORAGE MOCK SYSTEM (For seamless offline demo)
// ----------------------------------------------------
class MockDatabase {
  private listeners: { [key: string]: ((data: any[]) => void)[] } = {};
  private data: { [collection: string]: any[] } = {};

  constructor() {
    this.loadFromStorage();
    const hasOldData = 
      !this.data.reports || 
      this.data.reports.length === 0 || 
      this.data.reports.some((r: any) => !r.image_url || r.image_url.includes("data:image/png;base64,iVBORw0K") || r.image_url === "1x1" || r.image_url === "");
    if (hasOldData || !this.data.quests || this.data.quests.length < 6) {
      this.bootstrapMockData();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("civiclens_db");
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("civiclens_db", JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save local storage:", e);
    }
  }

  private bootstrapMockData() {
    // 1. Initial Civic Reports (Default Coordinates)
    this.data.reports = [
      {
        id: "report_1",
        coordinates: { latitude: 17.712, longitude: 83.321 }, // Sector 4
        location_name: "Sector 4 Road, near Central Market",
        category: "road_hazard",
        sub_category: "Large Alligator Cracks",
        severity: 4,
        report_count: 3,
        status: "open",
        image_url: "https://images.unsplash.com/photo-1599740831146-80e6f755c92c?auto=format&fit=crop&w=600&q=80",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        engineering_data: {
          category: "road_hazard",
          sub_category: "Large Alligator Cracks",
          severity_score: 4,
          severity_justification: "Deep structural road cracking forming a major pothole right in the active two-wheeler lane, posing high risk of accidents.",
          estimated_dimensions: "1.4m x 0.8m x 0.12m",
          required_materials: [
            { item: "Cold Mix Asphalt", quantity: "3 bags (25kg each)" },
            { item: "Tack Coat Emulsion", quantity: "5 Litres" }
          ],
          estimated_cost_inr: 6800,
          estimated_labor_hours: 3,
          hazard_mitigation_step: "Erect warning cones and barricades immediately."
        },
        advocacy_kit: {
          official_letter_markdown: "### Grievance Redressal Notice\n\n**To:**\nThe Ward Officer, Ward 22\nGreater Municipal Corporation\nMunicipal District, India\n\n**Subject:** Urgent Repair Request: Severe Road Hazard at Sector 4 Road\n\nDear Sir/Madam,\n\nWe are writing to draw your attention to a critical structural road hazard identified at coordinates (17.712, 83.321) on Sector 4 Road. \n\nAn engineering audit estimates dimensions of 1.4m x 0.8m with alligator cracking that has degraded into a deep depression. This is a high-traffic sector. The estimated material cost is ₹6,800.\n\nWe request immediate patching under the Municipalities Act. Failing this, community escalation will be initiated.\n\nSincerely,\nConcerned Citizens of Municipal District",
          petition_title: "Fix the Sector 4 Road Pothole Before Accidents Happen",
          petition_body_markdown: "Every weekend, thousands of families ride along Sector 4 Road. Near the market junction, there is a massive cracked road hazard that forces motorists to swerve suddenly. Let's gather 100 signatures to compel the Municipal Corporation to patch this hazard immediately!",
          rti_notice_markdown: "### FORM 'A'\n*See Rule 3(1)*\n**APPLICATION FOR INFORMATION UNDER THE RTI ACT, 2005**\n\nTo,\nPublic Information Officer (PIO)\nMunicipal Engineering Department\n\n1. **Full name of applicant:** Citizens Network\n2. **Particulars of Information Required:**\n   - Details of road maintenance budgets allocated for Ward 22 for the current financial year.\n   - Copy of contracts/contractor logs relating to repair work on Sector 4 Road.\n   - Specific reasons/delay analysis for the unrepaired road hazard at coordinates (17.712, 83.321).\n\n**Place:** Local Ward\n**Date:** " + new Date().toLocaleDateString(),
          social_media_campaigns: {
            twitter_x_post: "⚠️ Critical road hazard detected near Sector 4 Road (17.712, 83.321). Swerving required. Fix it immediately! Details: Est. Repair cost ₹6,800. #CivicLens #RoadSafety",
            whatsapp_alert: "🚨 Sector 4 Road Alert: Large pothole reported near coordinates (17.712, 83.321). Please drive carefully, especially at night. Sign the petition here: [Link]"
          }
        }
      },

      {
        id: "report_2",
        coordinates: { latitude: 17.781, longitude: 83.378 }, // Academic Sector
        location_name: "College Road, Academic Sector",
        category: "electrical_grid",
        sub_category: "Flickering Streetlight",
        severity: 3,
        report_count: 1,
        status: "open",
        image_url: "https://images.unsplash.com/photo-1509023467864-1ecbb3403333?auto=format&fit=crop&w=600&q=80",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        engineering_data: {
          category: "electrical_grid",
          sub_category: "Flickering Streetlight",
          severity_score: 3,
          severity_justification: "Streetlight column is flickering rapidly and stays dark for long intervals. Visual inspection shows loose wiring at the pole base.",
          estimated_dimensions: "10m tall pole",
          required_materials: [
            { item: "LED Lamp Module (90W)", quantity: "1 unit" },
            { item: "Armour Joint Kit", quantity: "1 unit" }
          ],
          estimated_cost_inr: 4500,
          estimated_labor_hours: 2,
          hazard_mitigation_step: "Isolate circuit panel before splicing cables."
        }
      },
      {
        id: "report_3",
        coordinates: { latitude: 17.721, longitude: 83.315 }, // Central Sector
        location_name: "Central Junction Road",
        category: "water_grid",
        sub_category: "Water Pipe Leakage",
        severity: 2,
        report_count: 2,
        status: "open",
        image_url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
        engineering_data: {
          category: "water_grid",
          sub_category: "Water Pipe Leakage",
          severity_score: 2,
          severity_justification: "Underground GI water pipeline has developed a hairline crack. Drinking water is pooling and flooding the pedestrian walkway.",
          estimated_dimensions: "2-inch GI pipeline, 0.5m depth",
          required_materials: [
            { item: "GI Coupling Collar 2\"", quantity: "1 unit" },
            { item: "Teflon Tape & Sealant", quantity: "2 rolls" }
          ],
          estimated_cost_inr: 2200,
          estimated_labor_hours: 1.5,
          hazard_mitigation_step: "Shut off valve at Sector C main supply line."
        }
      }
    ];

    // 2. Initial Quests
    this.data.quests = [
      {
        id: "quest_1",
        title: "Verify Academic Sector Light",
        type: "verify",
        target_report_id: "report_2",
        xp_reward: 50,
        karma_reward: 10,
        status: "active",
        joined_users: []
      },
      {
        id: "quest_2",
        title: "Junction Leak Check",
        type: "verify",
        target_report_id: "report_3",
        xp_reward: 50,
        karma_reward: 10,
        status: "active",
        joined_users: []
      },
      {
        id: "quest_3",
        title: "Sector 4 Debris Patrol",
        type: "coop",
        target_report_id: "report_1",
        xp_reward: 80,
        karma_reward: 20,
        status: "active",
        joined_users: ["user_suresh", "user_ananya"]
      },
      {
        id: "quest_4",
        title: "Pothole Filling Inspection",
        type: "verify",
        target_report_id: "report_1",
        xp_reward: 40,
        karma_reward: 10,
        status: "active",
        joined_users: []
      },
      {
        id: "quest_5",
        title: "Electrical Grid Check",
        type: "coop",
        target_report_id: "report_2",
        xp_reward: 100,
        karma_reward: 25,
        status: "active",
        joined_users: ["user_vikram"]
      },
      {
        id: "quest_6",
        title: "Waste Sorting Verification",
        type: "verify",
        target_report_id: "report_3",
        xp_reward: 60,
        karma_reward: 15,
        status: "active",
        joined_users: []
      }
    ];

    // 3. Initial Users
    this.data.users = [
      {
        uid: "current_user",
        display_name: "Civic Hero",
        level: 3,
        xp: 450,
        karma_points: 120,
        completed_quests: []
      },
      {
        uid: "user_suresh",
        display_name: "Suresh Kumar",
        level: 4,
        xp: 680,
        karma_points: 190,
        completed_quests: []
      },
      {
        uid: "user_ananya",
        display_name: "Ananya Rao",
        level: 2,
        xp: 310,
        karma_points: 85,
        completed_quests: []
      },
      {
        uid: "user_vikram",
        display_name: "Vikram Malhotra",
        level: 5,
        xp: 950,
        karma_points: 310,
        completed_quests: []
      }
    ];

    // 4. Initial Neighborhoods (Sectors)
    this.data.neighborhoods = [
      {
        sector_id: "sector_beach",
        sector_name: "Coastal Sector (Zone 22)",
        health_score: 90,
        bounds: [
          [83.310, 17.705],
          [83.330, 17.705],
          [83.330, 17.725],
          [83.310, 17.725]
        ]
      },
      {
        sector_id: "sector_siripuram",
        sector_name: "Transit Sector (Zone 15)",
        health_score: 95,
        bounds: [
          [83.305, 17.715],
          [83.325, 17.715],
          [83.325, 17.730],
          [83.305, 17.730]
        ]
      },
      {
        sector_id: "sector_rushikonda",
        sector_name: "Academic Sector (Zone 5)",
        health_score: 92,
        bounds: [
          [83.365, 17.770],
          [83.385, 17.770],
          [83.385, 17.790],
          [83.365, 17.790]
        ]
      }
    ];

    // 5. Initial Notifications (Predictive warnings)
    this.data.notifications = [
      {
        id: "alert_1",
        report_id: "report_1",
        sector_id: "sector_beach",
        title: "🚨 CRITICAL: Weather Damage Warning",
        message: "Sector 4 Road has a 88% risk of expanding into a severe road crater within 2 days due to forecasted heavy rainfall. Proactive asphalt filling is advised.",
        created_at: new Date().toISOString(),
        type: "critical_forecast",
        status: "unread"
      }
    ];

    this.saveToStorage();
  }


  public get(collectionName: string): any[] {
    this.loadFromStorage();
    return this.data[collectionName] || [];
  }

  public add(collectionName: string, docData: any): string {
    this.loadFromStorage();
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const id = collectionName + "_" + Math.random().toString(36).substr(2, 9);
    const newDoc = { id, ...docData, created_at: new Date().toISOString() };
    this.data[collectionName].push(newDoc);
    this.saveToStorage();
    this.triggerListeners(collectionName);
    return id;
  }

  public update(collectionName: string, id: string, docData: any) {
    this.loadFromStorage();
    const list = this.data[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...docData };
      this.saveToStorage();
      this.triggerListeners(collectionName);
    }
  }

  public listen(collectionName: string, callback: (data: any[]) => void): () => void {
    if (!this.listeners[collectionName]) {
      this.listeners[collectionName] = [];
    }
    this.listeners[collectionName].push(callback);
    // Initial call
    callback(this.get(collectionName));
    
    // Return unsubscribe function
    return () => {
      this.listeners[collectionName] = this.listeners[collectionName].filter(cb => cb !== callback);
    };
  }

  private triggerListeners(collectionName: string) {
    const list = this.get(collectionName);
    const cbList = this.listeners[collectionName] || [];
    cbList.forEach(callback => callback(list));
  }
}

const mockDb = new MockDatabase();

// ----------------------------------------------------
// DATABASE API INTERFACE (Decouples Firebase / Mock)
// ----------------------------------------------------

export { isRealFirebase };

function sanitizeReportImages(reports: any[]): any[] {
  const mapping: { [key: string]: string } = {
    // Large Alligator Cracks
    "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80": "/alligator_cracks.png",
    "https://images.unsplash.com/photo-1599740831146-80e6f755c92c?auto=format&fit=crop&w=600&q=80": "/alligator_cracks.png",
    
    // Flickering Streetlight
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80": "/street_light.png",
    "https://images.unsplash.com/photo-1509023467864-1ecbb3403333?auto=format&fit=crop&w=600&q=80": "/street_light.png",
    
    // Water Pipe Leakage
    "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80": "/water_leak.png",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80": "/water_leak.png"
  };

  return reports.map(report => {
    if (report && report.image_url && mapping[report.image_url]) {
      return {
        ...report,
        image_url: mapping[report.image_url]
      };
    }
    return report;
  });
}

// 1. Subscribe to Reports
export function subscribeToReports(callback: (reports: any[]) => void): () => void {
  const wrappedCallback = (r: any[]) => callback(sanitizeReportImages(r));
  if (isRealFirebase) {
    const q = query(collection(db, "reports"), orderBy("created_at", "desc"));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      wrappedCallback(reports);
    }, (error) => {
      if (error.code === "permission-denied") {
        console.log("ℹ️ Firestore Reports: using secure offline local sandbox.");
      } else {
        console.log("ℹ️ Firestore Reports connection failed, using offline sandbox.");
      }
      mockDb.listen("reports", wrappedCallback);
    });
  } else {
    return mockDb.listen("reports", wrappedCallback);
  }
}

// 2. Add a new Report
export async function addReport(reportData: any): Promise<string> {
  if (isRealFirebase) {
    try {
      const docRef = await addDoc(collection(db, "reports"), {
        ...reportData,
        created_at: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.log("ℹ️ Failed to add doc to Firestore, saving locally:", e);
      return mockDb.add("reports", reportData);
    }
  } else {
    return mockDb.add("reports", reportData);
  }
}

// 3. Update an existing Report (e.g. status, report_count)
export async function updateReport(id: string, updateData: any): Promise<void> {
  if (isRealFirebase) {
    try {
      const docRef = doc(db, "reports", id);
      await updateDoc(docRef, updateData);
    } catch (e) {
      console.log("ℹ️ Failed to update doc in Firestore, updating locally:", e);
      mockDb.update("reports", id, updateData);
    }
  } else {
    mockDb.update("reports", id, updateData);
  }
}

// 4. Subscribe to Quests
export function subscribeToQuests(callback: (quests: any[]) => void): () => void {
  if (isRealFirebase) {
    return onSnapshot(collection(db, "quests"), (snapshot) => {
      const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(quests);
    }, (error) => {
      if (error.code === "permission-denied") {
        console.log("ℹ️ Firestore Quests: using secure offline local sandbox.");
      } else {
        console.log("ℹ️ Firestore Quests connection failed, using offline sandbox.");
      }
      mockDb.listen("quests", callback);
    });
  } else {
    return mockDb.listen("quests", callback);
  }
}

// 5. Update Quest (e.g., checkin, complete status)
export async function updateQuest(id: string, updateData: any): Promise<void> {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db, "quests", id), updateData);
    } catch (e) {
      console.log("ℹ️ Firestore Quest update failed, updating locally:", e);
      mockDb.update("quests", id, updateData);
    }
  } else {
    mockDb.update("quests", id, updateData);
  }
}

// 5.1. Add a new Quest (Spawning Co-op Quests dynamically)
export async function addQuest(questData: any): Promise<string> {
  if (isRealFirebase) {
    try {
      const docRef = await addDoc(collection(db, "quests"), {
        ...questData,
        created_at: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.log("ℹ️ Failed to add quest to Firestore, saving locally:", e);
      return mockDb.add("quests", questData);
    }
  } else {
    return mockDb.add("quests", questData);
  }
}

// 6. Subscribe to Notifications (Predictive Alerts)
export function subscribeToNotifications(callback: (notifications: any[]) => void): () => void {
  if (isRealFirebase) {
    const q = query(collection(db, "notifications"), orderBy("created_at", "desc"));
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notifications);
    }, (error) => {
      if (error.code === "permission-denied") {
        console.log("ℹ️ Firestore Notifications: using secure offline local sandbox.");
      } else {
        console.log("ℹ️ Firestore Notifications connection failed, using offline sandbox.");
      }
      mockDb.listen("notifications", callback);
    });
  } else {
    return mockDb.listen("notifications", callback);
  }
}

// 7. Add Notification (Model C triggers)
export async function addNotification(notificationData: any): Promise<string> {
  if (isRealFirebase) {
    try {
      const docRef = await addDoc(collection(db, "notifications"), {
        ...notificationData,
        created_at: new Date().toISOString()
      });
      return docRef.id;
    } catch (e) {
      console.log("ℹ️ Failed to add notification, saving locally:", e);
      return mockDb.add("notifications", notificationData);
    }
  } else {
    return mockDb.add("notifications", notificationData);
  }
}

// 8. Subscribe to Neighborhood Sectors (Digital Twin Health Scores)
export function subscribeToNeighborhoods(callback: (neighborhoods: any[]) => void): () => void {
  if (isRealFirebase) {
    return onSnapshot(collection(db, "neighborhoods"), (snapshot) => {
      const sectors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(sectors);
    }, (error) => {
      if (error.code === "permission-denied") {
        console.log("ℹ️ Firestore Neighborhoods: using secure offline local sandbox.");
      } else {
        console.log("ℹ️ Firestore Neighborhoods connection failed, using offline sandbox.");
      }
      mockDb.listen("neighborhoods", callback);
    });
  } else {
    return mockDb.listen("neighborhoods", callback);
  }
}

// 9. Update Sector Health Score
export async function updateNeighborhood(id: string, updateData: any): Promise<void> {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db, "neighborhoods", id), updateData);
    } catch (e) {
      console.log("ℹ️ Firestore Neighborhood update failed, updating locally:", e);
      mockDb.update("neighborhoods", id, updateData);
    }
  } else {
    mockDb.update("neighborhoods", id, updateData);
  }
}

// 10. Subscribe to Current User (For XP / Badges)
export function subscribeToUser(callback: (user: any) => void): () => void {
  if (isRealFirebase) {
    return onSnapshot(doc(db, "users", "current_user"), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => {
      if (error.code === "permission-denied") {
        console.log("ℹ️ Firestore User: using secure offline local sandbox.");
      } else {
        console.log("ℹ️ Firestore User connection failed, using offline sandbox.");
      }
      mockDb.listen("users", (users) => {
        callback(users.find(u => u.uid === "current_user"));
      });
    });
  } else {
    return mockDb.listen("users", (users) => {
      callback(users.find(u => u.uid === "current_user"));
    });
  }
}

// 11. Update User Data (Adding XP or claiming badges)
export async function updateUser(updateData: any): Promise<void> {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db, "users", "current_user"), updateData);
    } catch (e) {
      console.log("ℹ️ Firestore User update failed, updating locally:", e);
      mockDb.update("users", "current_user", updateData);
    }
  } else {
    const list = mockDb.get("users");
    const index = list.findIndex(u => u.uid === "current_user" || u.id === "current_user");
    if (index !== -1) {
      mockDb.update("users", list[index].id, updateData);
    }
  }
}

// 12. Subscribe to All Users (To resolve RSVP participant names)
export function subscribeToAllUsers(callback: (users: any[]) => void): () => void {
  if (isRealFirebase) {
    return onSnapshot(collection(db, "users"), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, id: doc.id, ...doc.data() }));
      callback(users);
    }, () => {
      console.log("ℹ️ Firestore Users: using secure offline local sandbox.");
      mockDb.listen("users", callback);
    });
  } else {
    return mockDb.listen("users", callback);
  }
}
