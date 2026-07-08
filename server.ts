import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limits for base64 images/voice files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Gemini Client
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Global state / Database in memory with persistent backups
const DB_FILE = path.join(__dirname, "database.json");

let complaints: any[] = [];
let citizens: any[] = [];

// Initialize Database with rich hackathon-winning preloaded data
const BangaloreCoords = { lat: 12.9716, lng: 77.5946 };

const initialCitizens = [
  {
    id: "user_1",
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    address: "102, Shanti Kunj, Sector 4",
    ward: "Ward 45 - HSR Layout",
    district: "Bengaluru Urban",
    state: "Karnataka",
    language: "Kannada",
    points: 450,
    badges: ["Top Contributor", "Civic Hero", "Pothole Patrol"],
    trustScore: 94,
    role: "Citizen"
  },
  {
    id: "user_2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 99887 76655",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    address: "504, Prestige Greens, Sector 7",
    ward: "Ward 12 - Koramangala",
    district: "Bengaluru Urban",
    state: "Karnataka",
    language: "English",
    points: 720,
    badges: ["Community Guardian", "Monthly Leader", "Eagle Eye"],
    trustScore: 98,
    role: "Citizen"
  },
  {
    id: "officer_1",
    name: "Officer Ramesh Gowda",
    email: "ramesh.gowda@municipal.gov.in",
    phone: "+91 90000 11111",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    address: "Municipal Corporation HQ",
    ward: "All Wards",
    district: "Bengaluru Urban",
    state: "Karnataka",
    language: "Kannada",
    points: 1200,
    badges: ["Speedy Resolver", "Citizen Favorite"],
    trustScore: 100,
    role: "Officer"
  },
  {
    id: "admin_1",
    name: "Admin Suresh Kumar",
    email: "suresh.kumar@gov.in",
    phone: "+91 91111 22222",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    address: "Urban Development Secretariat",
    ward: "All Wards",
    district: "Bengaluru",
    state: "Karnataka",
    language: "English",
    points: 0,
    badges: ["Platform Master"],
    trustScore: 100,
    role: "Admin"
  },
  {
    id: "mp_1",
    name: "MP Tejasvi Hegde (Member of Parliament)",
    email: "tejasvi.hegde@sansad.nic.in",
    phone: "+91 98888 88888",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    address: "Parliament Constituency Office, Bengaluru South",
    ward: "Bengaluru South Constituency",
    district: "Bengaluru Urban",
    state: "Karnataka",
    language: "English",
    points: 0,
    badges: ["Constituency Champion"],
    trustScore: 100,
    role: "MP"
  }
];

const initialComplaints = [
  {
    id: "complaint_1",
    title: "Overflowing Garbage and Open Waste Dumping site",
    description: "Huge pile of garbage has been accumulating at the corner of Sector 4 Main Road near Central Park. The bin has overflowed and stray dogs are scattering waste everywhere, creating a highly unsanitary smell and breeding mosquitoes.",
    originalDescription: "Sectr 4 main road park ke paas bohot kachra jama ho gaya hai, badbu aa rahi hai aur bimaraye failne ka darr hai. Please isse saaf karwaye.",
    category: "Garbage & Sanitation",
    department: "Solid Waste Management Department",
    urgency: "High",
    severity: 8,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800",
    voiceUrl: "",
    voiceTranscript: "",
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: "14th Cross Rd, Sector 4, HSR Layout, Bengaluru, Karnataka 560102",
      ward: "Ward 45 - HSR Layout",
      district: "Bengaluru Urban"
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "In Progress",
    citizenId: "user_1",
    citizenName: "Arjun Mehta",
    supportCount: 12,
    duplicateIds: ["dup_101", "dup_102"],
    comments: [
      {
        id: "comm_1",
        authorId: "user_2",
        authorName: "Priya Sharma",
        authorRole: "Citizen",
        text: "Yes, I live nearby and the smell is unbearable. Thank you for raising this!",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "comm_2",
        authorId: "officer_1",
        authorName: "Officer Ramesh Gowda",
        authorRole: "Officer",
        text: "Inspected the site. We have dispatched a secondary garbage compactor truck to clear this and are installing warning signs to stop illegal dumping here.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    votes: { "user_2": "up", "citizen_abc": "up" },
    timeline: [
      {
        status: "Submitted",
        label: "Complaint Filed",
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        comment: "Complaint registered with AI confidence score of 95%."
      },
      {
        status: "Verified",
        label: "Grievance Verified & Dupes Merged",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        comment: "Merged 2 duplicate tickets. Verified by 12 local citizens.",
        actor: "JanConnect AI Engine"
      },
      {
        status: "In Progress",
        label: "Work Allocated to SWM",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        comment: "Assigned to Solid Waste Management. Estimated budget: ₹12,500 approved.",
        actor: "Officer Ramesh Gowda"
      }
    ],
    aiAnalysis: {
      summary: "Overflowing municipal garbage bin and illegal dumping corner causing mosquito breeding and severe foul smell.",
      correctedGrammar: "Huge garbage pile has accumulated at Sector 4 Main Road near Central Park. It has overflowed, emitting a terrible smell and breeding disease.",
      englishTranslation: "A lot of trash has accumulated near Sector 4 main road park, it is smelling bad and there is a fear of spreading diseases. Please clean this up.",
      localTranslation: "सेक्टर 4 मुख्य सड़क पार्क के पास भारी कचरा जमा हो गया है, जिससे बदबू आ रही है और बीमारियां फैलने का खतरा है। कृपया इसे साफ करवाएं।",
      officialLetter: "To,\nThe Chief Health Inspector,\nSolid Waste Management Department,\nBengaluru Municipal Corporation.\n\nSubject: Urgent Grievance Redressal - Overflowing Waste Dumping site in Sector 4\n\nDear Sir/Madam,\n\nI am writing to draw your attention to a critical sanitation issue at the corner of Sector 4 Main Road near Central Park. The community garbage bin has completely overflowed, resulting in a large illegal dumping site. Stray animals are spreading the waste, breeding mosquitoes and presenting severe epidemiological risks.\n\nImmediate clearance of waste and setting up strict surveillance is highly recommended.\n\nYours faithfully,\nOn behalf of JanConnect Citizens",
      predictedCategory: "Garbage & Sanitation",
      predictedDepartment: "Solid Waste Management Department",
      predictedUrgency: "High",
      estimatedSeverity: 8,
      suggestedSolution: "Deploy high-volume waste compactors, clean the peripheral street area, and establish a 'No Littering' zone with penalties.",
      isDuplicate: false,
      duplicateConfidence: 0,
      isFake: false,
      keywords: ["garbage", "trash", "sanitation", "mosquitoes", "dumping", "smell"],
      confidenceScore: 96,
      estimatedBudget: 12500,
      requiredManpower: 4,
      completionDays: 3,
      visionLabels: ["waste", "trash pile", "litter", "sanitation hazard"]
    },
    officialReply: {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      officerName: "Officer Ramesh Gowda",
      officerRole: "Chief Sanitation Inspector",
      message: "Secondary clearance vehicle deployed. Cleaning is in progress and we are scheduling daily morning pickups at this spot.",
      budgetApproved: 12500
    }
  },
  {
    id: "complaint_2",
    title: "Deep Dangerous Potholes on Main Junction",
    description: "There are three huge potholes right at the Koramangala 80ft Road intersection. They are deep and fill with water when it rains, making them invisible and causing multiple two-wheeler accidents already.",
    originalDescription: "Road collapsed and huge potholes near signal, very risky at night.",
    category: "Roads & Potholes",
    department: "Public Works Department (PWD)",
    urgency: "Critical",
    severity: 9,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800",
    voiceUrl: "",
    voiceTranscript: "",
    location: {
      lat: 12.9705,
      lng: 77.5959,
      address: "80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034",
      ward: "Ward 12 - Koramangala",
      district: "Bengaluru Urban"
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expectedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Submitted",
    citizenId: "user_2",
    citizenName: "Priya Sharma",
    supportCount: 28,
    duplicateIds: [],
    comments: [],
    votes: {},
    timeline: [
      {
        status: "Submitted",
        label: "Complaint Filed & Auto-Prioritized",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        comment: "AI evaluated CRITICAL urgency due to high traffic impact and accident history."
      }
    ],
    aiAnalysis: {
      summary: "Deep structural potholes on a major intersection causing accident hazards especially under rainy conditions.",
      correctedGrammar: "The road has collapsed with deep potholes near the signal, which is extremely dangerous during night-time navigation.",
      englishTranslation: "Road collapsed and huge potholes near signal, very risky at night.",
      localTranslation: "सिग्नल के पास सड़क धंस गई है और बड़े गड्ढे हो गए हैं, रात में बहुत खतरनाक है।",
      officialLetter: "To,\nThe Executive Engineer,\nPublic Works Department (PWD),\nBengaluru Civic Division.\n\nSubject: Critical Road Repair - Dangerous Potholes at Koramangala 80ft Road Intersection\n\nDear Sir/Madam,\n\nI wish to bring to your attention a severe hazard at the Koramangala 80ft Road intersection. Three massive potholes have formed which fill with water during rain, causing multiple critical slips and accidents for commuters, especially two-wheeler riders.\n\nPlease initiate rapid asphalt patching immediately.\n\nYours faithfully,\nJanConnect Safety Board",
      predictedCategory: "Roads & Potholes",
      predictedDepartment: "Public Works Department (PWD)",
      predictedUrgency: "Critical",
      estimatedSeverity: 9,
      suggestedSolution: "Excavate the damaged road section, backfill with dry stone aggregate, apply standard sub-base compaction, and finish with rapid cold asphalt mix.",
      isDuplicate: false,
      duplicateConfidence: 0,
      isFake: false,
      keywords: ["pothole", "accident", "road", "intersection", "asphalt"],
      confidenceScore: 98,
      estimatedBudget: 45000,
      requiredManpower: 6,
      completionDays: 1,
      visionLabels: ["pothole", "cracked asphalt", "road damage", "puddle"]
    },
    officialReply: null
  }
];

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      complaints = data.complaints || [];
      citizens = data.citizens || [];
    } else {
      complaints = [...initialComplaints];
      citizens = [...initialCitizens];
      saveDB();
    }
  } catch (e) {
    console.error("Failed to load local DB, using in-memory fallback", e);
    complaints = [...initialComplaints];
    citizens = [...initialCitizens];
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ complaints, citizens }, null, 2));
  } catch (e) {
    console.error("Failed to write to local DB", e);
  }
}

loadDB();

// Haversine Distance Formula in Meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Calculate Citizen Trust Score dynamically
function calculateTrustScore(userId: string) {
  const citizen = citizens.find((c) => c.id === userId);
  if (!citizen) return 50;

  // Derived from citizen actions
  const userComplaints = complaints.filter((c) => c.citizenId === userId);
  const verifiedCount = userComplaints.filter((c) => c.status !== "Submitted").length;
  const fakeCount = userComplaints.filter((c) => c.aiAnalysis?.isFake).length;

  let score = 70 + (verifiedCount * 5) - (fakeCount * 30) + Math.floor(citizen.points / 100);
  score = Math.max(10, Math.min(100, score));

  citizen.trustScore = score;
  saveDB();
  return score;
}

// Dynamic Work Priority Engine (Module 8)
function getPriorityScore(complaint: any) {
  let score = 0;

  // Severity Weight (40%)
  score += (complaint.severity || 5) * 4;

  // Community Votes / Citizen affected count (30%)
  const support = complaint.supportCount || 1;
  score += Math.min(support * 2, 30);

  // Proximity to sensitive locations like school/hospital or disaster alerts (20%)
  if (
    complaint.description.toLowerCase().includes("school") ||
    complaint.description.toLowerCase().includes("hospital") ||
    complaint.description.toLowerCase().includes("clinic") ||
    complaint.description.toLowerCase().includes("accident")
  ) {
    score += 15;
  }

  // Emergency urgency multiplier
  if (complaint.urgency === "Critical") {
    score += 20;
  } else if (complaint.urgency === "High") {
    score += 10;
  }

  return score;
}

// -------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------

// CITIZEN & ROLES API
app.get("/api/citizens", (req, res) => {
  res.json(citizens);
});

app.get("/api/citizens/:id", (req, res) => {
  const citizen = citizens.find((c) => c.id === req.params.id);
  if (!citizen) {
    return res.status(404).json({ error: "Citizen not found" });
  }
  res.json(citizen);
});

app.post("/api/citizens", (req, res) => {
  const { id, name, email, phone, avatar, address, ward, district, state, language, role } = req.body;
  const existing = citizens.find((c) => c.id === id || c.email === email);
  if (existing) {
    return res.json(existing);
  }

  const newCitizen = {
    id: id || `user_${Date.now()}`,
    name: name || "Anonymous Citizen",
    email: email || "",
    phone: phone || "",
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    address: address || "",
    ward: ward || "Ward 1",
    district: district || "",
    state: state || "",
    language: language || "English",
    points: 50, // Initial bonus points
    badges: ["First Milestone"],
    trustScore: 70,
    role: role || "Citizen"
  };

  citizens.push(newCitizen);
  saveDB();
  res.json(newCitizen);
});

// COMPLAINTS API
app.get("/api/complaints", (req, res) => {
  // Sort complaints dynamically by Priority Score (Desc)
  const sorted = [...complaints].sort((a, b) => {
    return getPriorityScore(b) - getPriorityScore(a);
  });
  res.json(sorted);
});

app.get("/api/complaints/:id", (req, res) => {
  const complaint = complaints.find((c) => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });
  res.json(complaint);
});

// COMPLAINT SUBMISSION & MULTIMODAL AI ANALYSIS (Module 3, 4, 5)
app.post("/api/analyze-complaint", async (req, res) => {
  const { description, image, voiceTranscript, category, lat, lng, address, ward } = req.body;

  const resolvedText = voiceTranscript ? `${description}. (Voice transcript: ${voiceTranscript})` : description;

  const gemini = getGeminiClient();

  if (!gemini) {
    // -------------------------------------------------
    // SIMULATED AI FALLBACK ENGINE (If Gemini Key missing)
    // -------------------------------------------------
    const cleanText = resolvedText || "No text provided";
    const textLower = cleanText.toLowerCase();

    let predCat = category || "Garbage & Sanitation";
    let predDept = "Solid Waste Management Department";
    let predUrg = "Medium";
    let estSev = 6;
    let estBudget = 15000;
    let reqManpower = 3;
    let compDays = 4;
    let isFake = false;
    let explanation = "";
    let labels: string[] = ["civic-issue"];

    if (textLower.includes("pothole") || textLower.includes("road") || textLower.includes("pavement")) {
      predCat = "Roads & Potholes";
      predDept = "Public Works Department (PWD)";
      predUrg = "High";
      estSev = 8;
      estBudget = 35000;
      reqManpower = 5;
      compDays = 2;
      labels = ["pothole", "asphalt", "cracked-road"];
    } else if (textLower.includes("light") || textLower.includes("dark") || textLower.includes("bulb")) {
      predCat = "Street Lights";
      predDept = "Street Lighting Division";
      predUrg = "Medium";
      estSev = 5;
      estBudget = 5000;
      reqManpower = 2;
      compDays = 3;
      labels = ["street-light", "darkness", "electricity"];
    } else if (textLower.includes("water") || textLower.includes("leak") || textLower.includes("pipe") || textLower.includes("drain")) {
      predCat = "Water Supply & Drainage";
      predDept = "Water Supply & Sewerage Board";
      predUrg = "High";
      estSev = 7;
      estBudget = 20000;
      reqManpower = 4;
      compDays = 2;
      labels = ["water-leakage", "drainage", "pipe-burst"];
    } else if (textLower.includes("flood") || textLower.includes("disaster") || textLower.includes("shock") || textLower.includes("fire")) {
      predCat = "Public Safety";
      predDept = "Public Health & Safety Board";
      predUrg = "Critical";
      estSev = 10;
      estBudget = 80000;
      reqManpower = 10;
      compDays = 1;
      labels = ["flooding", "hazard", "electrical-danger"];
    }

    if (image) {
      labels.push("vision-inspected");
    }

    if (cleanText.length < 10) {
      isFake = true;
      explanation = "Complaint description is too short or spam-like to be actionable.";
    }

    const mockAnalysis = {
      summary: `AI identified issue regarding ${predCat.toLowerCase()}: "${cleanText.substring(0, 50)}..."`,
      correctedGrammar: cleanText,
      englishTranslation: cleanText,
      localTranslation: `[स्थानीय अनुवाद] - ${cleanText}`,
      officialLetter: `To,\nThe Executive Director,\n${predDept},\nBengaluru Municipal Authority.\n\nSubject: Official Grievance - Resolution for ${predCat}\n\nDear Sir/Madam,\n\nI am writing to draw your attention to a grievance reported near ${address || "the constituency"}. The issue is described as: "${cleanText}".\n\nImmediate work authorization and resolution of this public hazard is highly recommended.\n\nYours faithfully,\nJanConnect AI Platform`,
      predictedCategory: predCat,
      predictedDepartment: predDept,
      predictedUrgency: predUrg,
      estimatedSeverity: estSev,
      suggestedSolution: `Dispatched service team to inspect structural stability, block standard operations, and execute ${predCat.toLowerCase()} patching procedures.`,
      isDuplicate: false,
      duplicateConfidence: 0.1,
      isFake: isFake,
      fakeExplanation: explanation,
      keywords: ["civic", predCat.toLowerCase().split(" ")[0]],
      confidenceScore: 85,
      estimatedBudget: estBudget,
      requiredManpower: reqManpower,
      completionDays: compDays,
      visionLabels: labels
    };

    return res.json({ analysis: mockAnalysis });
  }

  try {
    // -------------------------------------------------
    // REAL MULTIMODAL GEMINI ANALYZER (Module 3 & 4)
    // -------------------------------------------------
    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        correctedGrammar: { type: Type.STRING },
        englishTranslation: { type: Type.STRING },
        localTranslation: { type: Type.STRING },
        officialLetter: { type: Type.STRING },
        predictedCategory: { type: Type.STRING },
        predictedDepartment: { type: Type.STRING },
        predictedUrgency: { type: Type.STRING },
        estimatedSeverity: { type: Type.INTEGER },
        suggestedSolution: { type: Type.STRING },
        isDuplicate: { type: Type.BOOLEAN },
        duplicateConfidence: { type: Type.NUMBER },
        isFake: { type: Type.BOOLEAN },
        fakeExplanation: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidenceScore: { type: Type.INTEGER },
        estimatedBudget: { type: Type.INTEGER },
        requiredManpower: { type: Type.INTEGER },
        completionDays: { type: Type.INTEGER },
        visionLabels: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        "summary", "correctedGrammar", "englishTranslation", "localTranslation",
        "officialLetter", "predictedCategory", "predictedDepartment", "predictedUrgency",
        "estimatedSeverity", "suggestedSolution", "isDuplicate", "duplicateConfidence",
        "isFake", "keywords", "confidenceScore", "estimatedBudget", "requiredManpower",
        "completionDays", "visionLabels"
      ]
    };

    const promptText = `
      You are a high-fidelity municipal inspector AI for a Smart City program. Analyze this complaint description and provide structured JSON metadata.
      If a photo is uploaded, inspect it carefully. Support civic safety: Garbage & Sanitation, Roads & Potholes, Water Supply & Drainage, Street Lights, Trees & Gardening, Traffic & Parking, Public Safety, Electricity & Power, or Others.
      
      Determine if it is fake or unrelated (e.g. food photos, selfies, screenshots, memes). If fake, set isFake: true and provide an explanation.
      Estimate a realistic municipal budget in Indian Rupees (INR) for fixing it, the manpower needed, and estimated days.
      Write an official administrative letter (officialLetter) ready to present to municipal officers.
      
      User complaint description: "${resolvedText}"
    `;

    const contents: any[] = [];
    if (image) {
      // Split base64 header if exists
      const base64Data = image.split(",")[1] || image;
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }
    contents.push({ text: promptText });

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json({ analysis: parsed });

  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: "Failed to analyze complaint using Gemini", message: error.message });
  }
});

// COMPLAINT SAVING & DUPLICATE DEDUPLICATION (Module 6)
app.post("/api/complaints", (req, res) => {
  const { title, description, originalDescription, category, department, urgency, severity, imageUrl, voiceUrl, voiceTranscript, location, citizenId, citizenName, aiAnalysis } = req.body;

  // STEP 1: DUPLICATE DETECTION (MODULE 6)
  let matchedDuplicate: any = null;

  if (location && location.lat && location.lng) {
    for (const comp of complaints) {
      // Check proximity distance < 150 meters & identical category
      const dist = getDistanceInMeters(location.lat, location.lng, comp.location.lat, comp.location.lng);
      const categoryMatch = comp.category.toLowerCase() === category.toLowerCase();

      if (dist < 150 && categoryMatch) {
        matchedDuplicate = comp;
        break;
      }
    }
  }

  if (matchedDuplicate) {
    // If duplicate detected, merge complaints!
    matchedDuplicate.supportCount += 1;
    matchedDuplicate.duplicateIds.push(`user_sub_${Date.now()}`);
    
    // Add citizen to the supporters of this existing complaint
    matchedDuplicate.votes[citizenId] = "up";
    
    // Add a timeline event
    matchedDuplicate.timeline.push({
      status: matchedDuplicate.status,
      label: "Duplicate Complaint Merged",
      date: new Date().toISOString(),
      comment: `Citizen ${citizenName} reported this identical issue. Support count boosted to ${matchedDuplicate.supportCount}.`,
      actor: "JanConnect AI Engine"
    });

    // Credit Points to user for duplicate validation (Module 13)
    const citizen = citizens.find((c) => c.id === citizenId);
    if (citizen) {
      citizen.points += 15;
      if (!citizen.badges.includes("Deduplication Scout")) {
        citizen.badges.push("Deduplication Scout");
      }
      calculateTrustScore(citizenId);
    }

    saveDB();
    return res.json({
      status: "merged",
      mergedWith: matchedDuplicate.id,
      message: "An identical issue was already reported nearby! Your complaint was merged to increase government urgency priority.",
      complaint: matchedDuplicate
    });
  }

  // STEP 2: CREATE NEW COMPLAINT
  const complaintId = `complaint_${Date.now()}`;
  const daysToAdd = aiAnalysis?.completionDays || 4;

  const newComplaint = {
    id: complaintId,
    title: title || aiAnalysis?.summary || "Municipal Grievance",
    description: description || aiAnalysis?.correctedGrammar || "No description",
    originalDescription: originalDescription || description,
    category: category || aiAnalysis?.predictedCategory || "Garbage & Sanitation",
    department: department || aiAnalysis?.predictedDepartment || "Municipal Corp",
    urgency: urgency || aiAnalysis?.predictedUrgency || "Medium",
    severity: severity || aiAnalysis?.estimatedSeverity || 5,
    imageUrl: imageUrl || "",
    voiceUrl: voiceUrl || "",
    voiceTranscript: voiceTranscript || "",
    location: location || { lat: BangaloreCoords.lat, lng: BangaloreCoords.lng, address: "Unknown", ward: "Ward 1" },
    createdAt: new Date().toISOString(),
    expectedCompletion: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString(),
    status: "Submitted",
    citizenId: citizenId || "anonymous",
    citizenName: citizenName || "Citizen",
    supportCount: 1,
    duplicateIds: [],
    comments: [],
    votes: {},
    timeline: [
      {
        status: "Submitted",
        label: "Complaint Filed Successfully",
        date: new Date().toISOString(),
        comment: aiAnalysis?.isFake 
          ? "FLAGGED: AI flagged this complaint as potentially fake or spam."
          : `Grievance registered. AI Confidence Score: ${aiAnalysis?.confidenceScore || 85}%.`,
        actor: "JanConnect AI Engine"
      }
    ],
    aiAnalysis: aiAnalysis || {},
    officialReply: null
  };

  complaints.push(newComplaint);

  // Gamification (Module 13)
  const citizen = citizens.find((c) => c.id === citizenId);
  if (citizen) {
    citizen.points += 50; // Base filing points
    if (citizen.points > 150 && !citizen.badges.includes("Citizen Inspector")) {
      citizen.badges.push("Citizen Inspector");
    }
    if (citizen.points > 300 && !citizen.badges.includes("Civic Hero")) {
      citizen.badges.push("Civic Hero");
    }
    calculateTrustScore(citizenId);
  }

  saveDB();
  res.json({
    status: "created",
    complaint: newComplaint
  });
});

// UPVOTE / COMMUNITY VALIDATION (Module 7)
app.post("/api/complaints/:id/vote", (req, res) => {
  const { citizenId, citizenName, isConfirm } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  if (complaint.votes[citizenId]) {
    return res.status(400).json({ error: "You have already validated/voted on this complaint" });
  }

  complaint.votes[citizenId] = isConfirm ? "up" : "down";

  if (isConfirm) {
    complaint.supportCount += 1;
    // Add comment about validation
    complaint.comments.push({
      id: `comm_${Date.now()}`,
      authorId: citizenId,
      authorName: citizenName,
      authorRole: "Citizen",
      text: `✅ Verified and upvoted this complaint. This is a real public issue!`,
      createdAt: new Date().toISOString()
    });

    complaint.timeline.push({
      status: complaint.status,
      label: `Community Confirmed (${complaint.supportCount} Votes)`,
      date: new Date().toISOString(),
      comment: `Verified by citizen ${citizenName}. Priority dynamically elevated.`,
      actor: "Community Watch"
    });

    // Credit Points to validator
    const citizen = citizens.find((c) => c.id === citizenId);
    if (citizen) {
      citizen.points += 20;
      if (!citizen.badges.includes("Validator")) {
        citizen.badges.push("Validator");
      }
      calculateTrustScore(citizenId);
    }
  } else {
    // Rejected by citizen
    complaint.comments.push({
      id: `comm_${Date.now()}`,
      authorId: citizenId,
      authorName: citizenName,
      authorRole: "Citizen",
      text: `❌ Flaged as Resolved or False complaint.`,
      createdAt: new Date().toISOString()
    });
  }

  saveDB();
  res.json(complaint);
});

// OFFICIAL UPDATE / OFFICER DASHBOARD (Module 9, 10)
app.post("/api/complaints/:id/status", (req, res) => {
  const { status, officerName, message, budgetApproved } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  complaint.status = status;
  
  if (status === "Resolved") {
    complaint.timeline.push({
      status,
      label: "Grievance Fully Resolved",
      date: new Date().toISOString(),
      comment: message || "The issue has been completed by the local civic field team.",
      actor: officerName
    });

    complaint.officialReply = {
      date: new Date().toISOString(),
      officerName,
      officerRole: "Municipal Division Officer",
      message: message || "Work order finished successfully.",
      budgetApproved: budgetApproved || complaint.aiAnalysis?.estimatedBudget || 10000
    };

    // Reward original complaint filer for successful civic completion
    const citizen = citizens.find((c) => c.id === complaint.citizenId);
    if (citizen) {
      citizen.points += 100; // Large civic success bonus!
      if (!citizen.badges.includes("Grievance Champion")) {
        citizen.badges.push("Grievance Champion");
      }
      calculateTrustScore(complaint.citizenId);
    }
  } else {
    complaint.timeline.push({
      status,
      label: `Status Updated to ${status}`,
      date: new Date().toISOString(),
      comment: message,
      actor: officerName
    });
  }

  saveDB();
  res.json(complaint);
});

// ADD COMMENT (Module 7)
app.post("/api/complaints/:id/comment", (req, res) => {
  const { authorId, authorName, authorRole, text } = req.body;
  const complaint = complaints.find((c) => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  const newComment = {
    id: `comm_${Date.now()}`,
    authorId,
    authorName,
    authorRole,
    text,
    createdAt: new Date().toISOString()
  };

  complaint.comments.push(newComment);
  saveDB();
  res.json(complaint);
});

// CHATBOT ASSISTANT (Module 11)
app.post("/api/chatbot", async (req, res) => {
  const { message, chatHistory } = req.body;
  const gemini = getGeminiClient();

  if (!gemini) {
    // Smart simulated replies for offline/simulated platforms
    let reply = "Hello! I am JanConnect AI, your smart citizen assistant. ";
    const lower = message.toLowerCase();

    if (lower.includes("how") || lower.includes("file") || lower.includes("complaint")) {
      reply += "To file a complaint, click the 'Report Issue' button at the top, choose a category, capture or upload an image, allow GPS auto-detection, and submit! Our AI will analyze and route it instantly.";
    } else if (lower.includes("status") || lower.includes("track")) {
      reply += "You can track your submitted grievances in your 'Citizen Dashboard'. We support real-time status timelines (Submitted -> Verified -> In Progress -> Resolved).";
    } else if (lower.includes("points") || lower.includes("badges") || lower.includes("gamification")) {
      reply += "You earn 50 points for filing, 15 points for duplicate merges, and 20 points for validating nearby complaints. Reach top ranks on the local Monthly Leaderboard to become a Civic Hero!";
    } else if (lower.includes("emergency") || lower.includes("flood") || lower.includes("fire")) {
      reply += "🚨 For emergencies, use our Quick Dial Emergency mode (Module 12) on the sidebar for instant 1-click notification to Disaster Teams, Fire Station, or Electric Safety Boards.";
    } else {
      reply += "I am trained to support city safety regulations, municipal department directories, citizen rights, and local ward queries. How else can I assist Bengaluru Citizens today?";
    }
    return res.json({ text: reply });
  }

  try {
    const historyParts = (chatHistory || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // System instruction for JanConnect Chatbot
    const systemInstruction = `
      You are the JanConnect AI chatbot assistant. You are integrated into a Smart Citizen Grievance Redressal platform.
      Your goal is to assist citizens with:
      1. How to file complaints (upload image, voice recording, geo-location pin).
      2. Status queries and timeline milestones (Submitted, Verified, In Progress, Resolved).
      3. Community points, badges, leaderboard gamification, and citizen trust scores.
      4. Emergency modes for disasters (flood, road accident, electric shock, fire).
      5. Government safety schemes, citizens rights, and FAQs.
      
      Always speak warmly, professionally, and clearly. Keep answers action-oriented and highly helpful.
    `;

    const chat = gemini.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    // Send history if any
    for (const hist of historyParts) {
      // Just populate chat history if supported. To keep it simple, let's just make a structured generateContent request with the history or let sendMessage handle it.
    }

    const response = await chat.sendMessage({ message: message });
    res.json({ text: response.text });

  } catch (error: any) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to generate AI chatbot response", message: error.message });
  }
});

// AI MONTHLY ANALYTICS & WARD PERFORMANCE REPORT (Module 16)
app.get("/api/reports/monthly", async (req, res) => {
  const gemini = getGeminiClient();

  // Aggregate basic metrics
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === "Resolved").length;
  const active = total - resolved;
  const totalBudget = complaints.reduce((sum, c) => sum + (c.aiAnalysis?.estimatedBudget || 0), 0);
  const categoriesCount = complaints.reduce((acc: any, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  if (!gemini) {
    const mockReport = `
# JanConnect AI Smart-City Civic Report
**Generated on: July 2026**

## 1. Core Municipal Metrics
- **Total Grievances Logged:** ${total}
- **Successfully Resolved:** ${resolved} (${total > 0 ? Math.round((resolved/total)*100) : 0}%)
- **Active Ongoing Tasks:** ${active}
- **Estimated Capital Budget:** ₹${totalBudget.toLocaleString()}

## 2. Issue Distribution by Category
${Object.entries(categoriesCount).map(([cat, count]) => `- **${cat}:** ${count} reports`).join("\n")}

## 3. Top Trending Problem of the Month
- **Solid Waste Accumulation & Roads:** AI priority scoring highlights an accumulation of road damage complaints near transit corridors, calling for proactive asphalt restoration before monsoon peaks.

## 4. Municipal Department Efficiency
- **PWD (Roads):** High average severity (8.5), requires 48h resolution speedups.
- **SWM (Garbage):** Strong resolution count, but duplicate volumes are high in Ward 45.

## 5. Budget Suggestions for next Quarter
- Propose allocating ₹2,50,000 for emergency pothole fillings on Koramangala and HSR Layout corridors.
- Propose deploying 2 more SWM waste compactor containers in ward hotspots.
    `;
    return res.json({ report: mockReport });
  }

  try {
    const analysisSummary = complaints.map(c => ({
      title: c.title,
      category: c.category,
      urgency: c.urgency,
      severity: c.severity,
      status: c.status,
      budget: c.aiAnalysis?.estimatedBudget || 0,
      ward: c.location.ward
    }));

    const prompt = `
      As the Lead Urban Planning and Budget optimization AI, analyze this municipal grievance data and generate a professional, highly analytical Monthly Civic Report.
      Provide the output in Markdown format. Address these sections:
      1. Executive Dashboard (summarize total logged, resolved, active, budget).
      2. Hotspot Ward Analysis (identify top problematic wards).
      3. Budget Optimization (give AI budget forecasts, safety allocations, and manpower planning).
      4. Department Leaderboard (performance, speed, and responsiveness).
      
      Grievances data: ${JSON.stringify(analysisSummary, null, 2)}
    `;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.3 }
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("AI report generation error:", error);
    res.status(500).json({ error: "Failed to generate AI analytics report", message: error.message });
  }
});

// VITE MIDDLEWARE SETUP
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JanConnect backend running on http://localhost:${PORT}`);
  });
}

startServer();
