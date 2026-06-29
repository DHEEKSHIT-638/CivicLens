import { useState, useEffect } from "react";
import { 
  AlertTriangle, Key, Terminal, RefreshCw
} from "lucide-react";


// Components
import { DigitalTwinMap } from "./components/DigitalTwinMap";
import { IssueFeed } from "./components/IssueFeed";
import { QuestHub } from "./components/QuestHub";
import { NotificationsHUD } from "./components/NotificationsHUD";
import { MediaUploader } from "./components/MediaUploader";

// Services & Firebase
import { 
  subscribeToReports, 
  subscribeToQuests, 
  subscribeToNotifications, 
  subscribeToUser, 
  addReport, 
  updateReport, 
  seedFirestoreIfEmpty,
  uploadImage,
  subscribeToAllUsers,
  addQuest,
  updateQuest
} from "./firebase";

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  return url.startsWith("data:video/") || url.includes(".mp4") || url.includes(".mov") || url.includes(".webm") || url.includes(".ogg") || url === "video";
};

const getMediaSource = (url?: string) => {
  if (!url) return "";
  if (url === "video") {
    return "https://assets.mixkit.co/videos/preview/mixkit-street-traffic-with-cars-and-lights-at-night-34444-large.mp4";
  }
  return url;
};

// Inline Advocacy Panel Workspace Component
function AdvocacyPanelInline({ advocacyKit, subCategory, showToast, onDeploy, isResolved }: { advocacyKit: any; subCategory: string; showToast: any; onDeploy: () => void; isResolved: boolean }) {
  const [activeTab, setActiveTab] = useState<"letter" | "petition" | "rti" | "social">("letter");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveText = () => {
    switch (activeTab) {
      case "letter":
        return advocacyKit.official_letter_markdown;
      case "petition":
        return `## ${advocacyKit.petition_title}\n\n${advocacyKit.petition_body_markdown}`;
      case "rti":
        return advocacyKit.rti_notice_markdown;
      case "social":
        return `**X/Twitter Post:**\n${advocacyKit.social_media_campaigns.twitter_x_post}\n\n**WhatsApp Share Alert:**\n${advocacyKit.social_media_campaigns.whatsapp_alert}`;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 overflow-hidden text-left shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">gavel</span>
          <h3 className="text-body-md font-bold font-heading text-on-surface uppercase tracking-wide">
            Civic Advocacy Workspace
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/10 text-secondary font-mono font-bold">
          {subCategory}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 text-label-md font-label-md flex-shrink-0">
        {(["letter", "petition", "rti", "social"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-2.5 text-center transition-all cursor-pointer font-medium border-b-2 capitalize ${
              activeTab === tab
                ? "border-secondary text-secondary font-bold"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            {tab === "social" ? "Socials" : tab === "rti" ? "RTI Notice" : tab}
          </button>
        ))}
      </div>

      {/* Document scroll area */}
      <div className="flex-1 overflow-y-auto bg-surface-container border border-outline-variant rounded-lg p-4 font-mono-data text-xs text-on-surface-variant leading-relaxed scrollbar-thin select-text">
        <div className="whitespace-pre-wrap font-sans text-xs">
          {getActiveText().split("\n").map((line: string, idx: number) => {
            if (line.startsWith("###")) {
              return <h4 key={idx} className="text-body-sm font-semibold font-heading text-on-surface mt-3 mb-1 first:mt-0">{line.replace("###", "")}</h4>;
            }
            if (line.startsWith("**")) {
              return <p key={idx} className="font-semibold text-on-surface mt-2">{line.replace(/\*\*/g, "")}</p>;
            }
            if (line.startsWith("-")) {
              return <li key={idx} className="ml-3 list-disc mt-0.5">{line.replace("-", "")}</li>;
            }
            return <p key={idx} className="mt-1">{line}</p>;
          })}
        </div>
      </div>

      {/* Help Tip */}
      <p className="text-[10px] text-outline font-mono text-left pl-1">
        ℹ️ Use "Copy to Clipboard" to manually send this document via email or official portals. Click "Deploy Campaign" to auto-file and alert ward sentinels.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 mt-1">
        <button
          onClick={() => handleCopy(getActiveText())}
          className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-1.5 cursor-pointer shadow-sm"
        >
          {copied ? (
            <>
              <span className="material-symbols-outlined text-[16px]">check</span>
              Copied!
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy to Clipboard
            </>
          )}
        </button>
        <button
          disabled={isResolved}
          onClick={onDeploy}
          className={`px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 font-heading font-semibold ${
            isResolved ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-surface-variant/20"
          }`}
        >
          Deploy Campaign
        </button>
      </div>
    </div>
  );
}
import { 
  inspectDamage, 
  checkVisualDuplicate, 
  generateAdvocacyKit, 
  predictDecayAndNotify
} from "./services/gemini";
import { fetchWeatherForecast } from "./services/weather";

// --- MUNICIPAL OFFICER (ADMIN) CONTROL PAGE ---
interface AdminControlPageProps {
  reports: any[];
  quests: any[];
  showToast: (msg: string, type: "success" | "error") => void;
  onBack: () => void;
}

function AdminControlPage({ reports, quests, showToast, onBack }: AdminControlPageProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return null;
    }
    return reports.length > 0 ? reports[0].id : null;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Stats calculations
  const pendingReports = reports.filter(r => r.status === "open").length;
  const resolvedReports = reports.filter(r => r.status === "resolved").length;
  const approvedBudget = reports
    .filter(r => r.budget_approved)
    .reduce((sum, r) => sum + (r.engineering_data?.estimated_cost_inr || 0), 0);

  const handleApproveBudget = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    if (report.status === "resolved") {
      showToast("This grievance has already been fully resolved.", "error");
      return;
    }
    if (report.budget_approved) {
      showToast("Budget has already been approved and allocated to contractor queue.", "error");
      return;
    }

    try {
      await updateReport(reportId, { 
        budget_approved: true,
        budget_status: "approved"
      });
      showToast("Grievance budget approved! Allocated to active contractor queue.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to approve budget.", "error");
    }
  };

  const handleSpawnQuest = async (report: any) => {
    try {
      const activeQuestExists = quests.some(q => q.target_report_id === report.id);
      if (activeQuestExists) {
        showToast("A quest is already active for this hazard.", "error");
        return;
      }

      const questTitle = `Co-op Cleanup: Resolve ${report.sub_category || "Hazard"} near ${report.location_name.split("(")[0]}`;
      await addQuest({
        title: questTitle,
        type: "coop",
        target_report_id: report.id,
        xp_reward: report.severity * 30 + 50,
        karma_reward: report.severity * 5 + 10,
        status: "active",
        joined_users: []
      });

      showToast("Dynamic Co-op Quest spawned and published to Citizen Sentinel Hub!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to spawn quest.", "error");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "road_hazard": return <span className="material-symbols-outlined text-[16px] text-error">construction</span>;
      case "water_grid": return <span className="material-symbols-outlined text-[16px] text-secondary">water_drop</span>;
      case "electrical_grid": return <span className="material-symbols-outlined text-[16px] text-accent-amber">bolt</span>;
      case "waste_management": return <span className="material-symbols-outlined text-[16px] text-outline">delete</span>;
      default: return <span className="material-symbols-outlined text-[16px] text-outline">help_outline</span>;
    }
  };

  const correspondingQuest = selectedReport 
    ? quests.find(q => q.target_report_id === selectedReport.id)
    : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-0 overflow-hidden text-left font-body-md text-on-surface pb-16 md:pb-0">
      {/* Sidebar: Grid of reports */}
      <div className={`w-full md:w-96 flex flex-col gap-4 flex-shrink-0 h-full min-h-0 ${selectedReportId ? "hidden md:flex" : "flex"}`}>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
            <h4 className="font-bold text-on-surface text-body-md font-heading flex items-center gap-1.5 flex-shrink-0">
              <span className="material-symbols-outlined text-secondary">admin_panel_settings</span>
              Municipal Control Center
            </h4>
            <button 
              onClick={onBack}
              className="text-[10px] text-outline hover:text-on-surface border border-outline-variant px-2 py-1 rounded bg-transparent cursor-pointer font-bold"
            >
              Exit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center mt-2">
            <div className="bg-surface-container p-2 rounded border border-outline-variant/30">
              <div className="text-[14px] font-bold text-secondary font-mono">{pendingReports}</div>
              <div className="text-[8px] font-mono text-outline uppercase font-bold">Pending</div>
            </div>
            <div className="bg-surface-container p-2 rounded border border-outline-variant/30">
              <div className="text-[14px] font-bold text-secondary font-mono">{resolvedReports}</div>
              <div className="text-[8px] font-mono text-outline uppercase font-bold">Resolved</div>
            </div>
          </div>
          <div className="bg-surface-container/60 p-2.5 rounded border border-outline-variant/30 text-center mt-1">
            <div className="text-xs font-mono text-outline">Total Allocated Budget</div>
            <div className="text-base font-bold text-on-surface font-mono mt-0.5">₹{approvedBudget.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Hazard Selection Feed */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
          {reports.map((r) => {
            const isSelected = r.id === selectedReportId;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={`border rounded-lg p-3.5 cursor-pointer transition-all bg-surface-container-lowest ${
                  isSelected 
                    ? "border-secondary bg-surface-container-low" 
                    : "border-outline-variant hover:border-outline"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-on-surface-variant flex items-center gap-1.5 font-bold uppercase">
                    {getCategoryIcon(r.category)}
                    {r.category.replace("_", " ")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    r.status === "resolved" 
                      ? "bg-secondary/10 text-secondary" 
                      : r.budget_approved 
                      ? "bg-secondary/10 text-secondary" 
                      : "bg-error-container text-error"
                  }`}>
                    {r.status === "resolved" ? "Resolved" : r.budget_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <h5 className="font-semibold text-on-surface text-body-sm font-heading truncate mt-1.5">{r.sub_category}</h5>
                <p className="text-[10px] text-outline mt-0.5 truncate">{r.location_name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel: Report Detailed Audit & Action Plan */}
      <div className={`flex-1 min-h-0 h-full flex flex-col ${selectedReportId ? "flex" : "hidden md:flex"}`}>
        {selectedReportId && (
          <div className="md:hidden flex items-center mb-3 text-left">
            <button
              onClick={() => setSelectedReportId(null)}
              className="flex items-center gap-1.5 text-secondary font-heading font-semibold text-xs py-1.5 px-3 rounded-lg bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to Hazards List
            </button>
          </div>
        )}
        {selectedReport ? (
          <div className="h-full flex flex-col gap-4 bg-surface-container-lowest p-5 border border-outline-variant rounded-xl overflow-y-auto shadow-sm scrollbar-thin">
            <div className="flex items-start justify-between border-b border-outline-variant/30 pb-3 flex-shrink-0">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[10px] font-mono text-outline uppercase tracking-wide">Infrastructure Grievance Audit</span>
                <h3 className="text-body-lg font-bold font-heading text-on-surface mt-0.5">
                  {selectedReport.sub_category || "Audit File"}
                </h3>
                <p className="text-xs text-outline font-mono mt-0.5">{selectedReport.location_name}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded border font-mono font-bold capitalize ${
                selectedReport.status === "resolved" 
                  ? "bg-secondary/10 text-secondary border-secondary/20" 
                  : "bg-error-container text-error border-error/20"
              }`}>
                {selectedReport.status}
              </span>
            </div>

            {/* Content columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Image & Description */}
              <div className="flex flex-col gap-3">
                {selectedReport.image_url && (
                  <div className="relative h-48 rounded-lg overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center">
                    <img src={selectedReport.image_url} alt="Attached audit log" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="bg-surface-container/40 border border-outline-variant/50 p-3.5 rounded text-xs leading-relaxed text-on-surface-variant text-left">
                  <span className="font-heading font-semibold text-outline block mb-1">Incident Report:</span>
                  {selectedReport.engineering_data?.translated_english_description || selectedReport.engineering_data?.severity_justification || selectedReport.location_name}
                </div>
              </div>

              {/* Civil Engineering Data Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="bg-surface-container border border-outline-variant/50 p-4 rounded-lg flex flex-col gap-3 font-mono-data text-xs text-left text-on-surface-variant">
                  <span className="text-secondary font-heading font-bold text-label-md uppercase tracking-wider block border-b border-outline-variant/30 pb-1.5">
                    AI Engineering Assessment:
                  </span>
                  
                  <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="text-outline">Severity Metric:</span>
                    <span className="font-bold text-error">{Math.min(5, Math.max(1, selectedReport.severity))}/5</span>
                  </div>

                  <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="text-outline">Deterioration Risks:</span>
                    <span className="text-on-surface truncate max-w-[200px]" title={selectedReport.engineering_data?.severity_justification}>
                      {selectedReport.engineering_data?.severity_justification}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="text-outline">Estimated Dimensions:</span>
                    <span className="text-on-surface font-semibold">{selectedReport.engineering_data?.estimated_dimensions || "N/A"}</span>
                  </div>

                  <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="text-outline">Est. Labor Hours:</span>
                    <span className="text-on-surface">{selectedReport.engineering_data?.estimated_labor_hours || 0} hrs</span>
                  </div>

                  <div className="flex justify-between pt-1.5 font-heading text-sm">
                    <span className="text-outline font-bold">Estimated Cost (INR):</span>
                    <span className="text-on-surface font-extrabold font-mono-data">
                      ₹{selectedReport.engineering_data?.estimated_cost_inr?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Materials Checklist (Full Width Row) */}
            {selectedReport.engineering_data?.required_materials && (
              <div className="bg-surface-container/40 border border-outline-variant/40 p-4 rounded-xl text-left mt-1">
                <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-3 font-bold">Required Materials Checklist:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono-data text-xs text-on-surface-variant">
                  {selectedReport.engineering_data.required_materials.map((m: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 shadow-sm text-left">
                      <span className="font-sans font-semibold text-on-surface text-[12px] leading-snug" title={m.item}>{m.item}</span>
                      <span className="text-secondary font-bold text-[11px] font-mono mt-1">Qty: {m.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Board Control Actions */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono text-outline">Budget Authorization State:</span>
                <span className={`text-xs font-semibold mt-0.5 ${selectedReport.status === "resolved" ? "text-secondary" : selectedReport.budget_approved ? "text-secondary" : "text-on-surface-variant"}`}>
                  {selectedReport.status === "resolved"
                    ? "✓ Defect fully resolved and verified."
                    : selectedReport.budget_approved 
                    ? "✓ Budget approved and queued for contractor work." 
                    : "⏳ Budget pending municipal approval."}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => handleApproveBudget(selectedReport.id)}
                  className={`flex-1 md:flex-none bg-secondary text-on-secondary py-2.5 px-5 text-xs font-heading font-bold rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${
                    (selectedReport.budget_approved || selectedReport.status === "resolved") 
                      ? "opacity-50 cursor-not-allowed shadow-none" 
                      : "cursor-pointer"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Approve Budget (₹{selectedReport.engineering_data?.estimated_cost_inr?.toLocaleString("en-IN") || "0"})
                </button>

                {/* Co-op Quest Spawner Action */}
                {selectedReport.status === "resolved" ? (
                  <div className="text-[11px] font-mono bg-secondary/10 border border-secondary/20 text-secondary px-3 py-2.5 rounded flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Quest Completed / Resolved
                  </div>
                ) : correspondingQuest ? (
                  <div className="text-[11px] font-mono bg-secondary/10 border border-secondary/20 text-secondary px-3 py-2.5 rounded flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    Quest Spawned ({correspondingQuest.joined_users?.length || 0} RSVPs)
                  </div>
                ) : (
                  <button
                    disabled={selectedReport.status === "resolved"}
                    onClick={() => handleSpawnQuest(selectedReport)}
                    className="flex-1 md:flex-none px-4 py-2.5 text-xs text-secondary border border-secondary/30 hover:border-secondary hover:bg-secondary/10 rounded cursor-pointer font-heading font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                    Spawn Co-op Quest
                  </button>
                )}
              </div>
            </div>

            {/* Display active list of citizen RSVPs for this co-op quest */}
            {correspondingQuest && correspondingQuest.joined_users && correspondingQuest.joined_users.length > 0 && (
              <div className="mt-2 bg-surface-container border border-outline-variant/30 p-3 rounded text-left">
                <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-1.5 font-bold">
                  Assigned Citizen Sentinels ({correspondingQuest.joined_users.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {correspondingQuest.joined_users.map((uid: string) => (
                    <span 
                      key={uid}
                      className="text-[10px] px-2.5 py-1 rounded-full font-mono bg-secondary/5 border border-secondary/20 text-secondary flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Sentinel ID: {uid.substring(0, 10)}...
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl mb-3">admin_panel_settings</span>
            <h4 className="text-body-md font-semibold font-heading text-on-surface">Grievance Audit Desk</h4>
            <p className="text-body-sm text-outline max-w-xs mt-1">Select a filed report from the list on the left to audit infrastructure telemetry, approve budgets, and deploy co-op cleanup quests.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CONTRACTOR WORKSPACE PAGE ---
interface ContractorBoardPageProps {
  reports: any[];
  quests: any[];
  showToast: (msg: string, type: "success" | "error") => void;
  onBack: () => void;
}

function ContractorBoardPage({ reports, quests, showToast, onBack }: ContractorBoardPageProps) {
  // Approved reports (budget approved)
  const approvedReports = reports.filter(r => r.budget_approved);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return null;
    }
    return approvedReports.length > 0 ? approvedReports[0].id : null;
  });

  const selectedReport = approvedReports.find(r => r.id === selectedReportId);

  // Mock Materials Log Inventory
  const [materialsInventory, setMaterialsInventory] = useState({
    "Bituminous Cold Mix Asphalt bags": 35,
    "Roadbed base aggregates / gravel": 60,
    "Liquid asphalt primer adhesive": 45,
    "Municipal heavy trash collection bags": 85,
    "Sanitary bleaching powder / Bleach disinfectant": 20,
    "Caution safety barrier tape rolls": 15
  });

  const [crewDispatchStatus, setCrewDispatchStatus] = useState<Record<string, "idle" | "dispatched">>({});

  const handleDispatchCrew = (reportId: string) => {
    const report = approvedReports.find(r => r.id === reportId);
    if (!report) return;
    if (report.status === "resolved") {
      showToast("Cannot dispatch crew: this repair order is already resolved.", "error");
      return;
    }
    if (crewDispatchStatus[reportId] === "dispatched") {
      showToast("Maintenance crew is already dispatched to this location.", "error");
      return;
    }

    setCrewDispatchStatus(prev => ({ ...prev, [reportId]: "dispatched" }));
    showToast("Maintenance crew dispatched to reported coordinates!", "success");
  };

  const handleResolveRepair = async (reportId: string) => {
    const report = approvedReports.find(r => r.id === reportId);
    if (!report) return;
    if (report.status === "resolved") {
      showToast("This hazard repair has already been marked as resolved.", "error");
      return;
    }

    try {
      // Deduct materials from stock
      if (selectedReport?.engineering_data?.required_materials) {
        setMaterialsInventory(prev => {
          const updated = { ...prev } as any;
          selectedReport.engineering_data.required_materials.forEach((m: any) => {
            const reqQty = parseInt(m.quantity) || 0;
            // Find key that contains item name
            const matchingKey = Object.keys(updated).find(k => k.toLowerCase().includes(m.item.toLowerCase()) || m.item.toLowerCase().includes(k.toLowerCase()));
            if (matchingKey) {
              updated[matchingKey] = Math.max(0, updated[matchingKey] - reqQty);
            }
          });
          return updated;
        });
      }

      await updateReport(reportId, { 
        status: "resolved",
        contractor_resolved: true,
        resolved_at: new Date().toISOString()
      });

      // Auto-complete all active quests associated with this resolved report
      const relatedQuests = quests.filter(q => q.target_report_id === reportId && q.status === "active");
      for (const quest of relatedQuests) {
        await updateQuest(quest.id, { status: "completed" });
      }
      showToast("Repair order logged as RESOLVED! Mapped green on digital twin.", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to resolve repair order.", "error");
    }
  };

  // Check if inventory has enough materials
  const checkMaterialAvailability = (item: string, qty: string) => {
    const reqQty = parseInt(qty) || 0;
    const key = Object.keys(materialsInventory).find(
      k => k.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(k.toLowerCase())
    );
    if (!key) return { available: false, stock: 0 };
    const stock = (materialsInventory as any)[key];
    return { available: stock >= reqQty, stock };
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-0 overflow-hidden text-left font-body-md text-on-surface pb-16 md:pb-0">
      {/* Left Sidebar: Contractor queue */}
      <div className={`w-full md:w-96 flex flex-col gap-4 flex-shrink-0 h-full min-h-0 ${selectedReportId ? "hidden md:flex" : "flex"}`}>
        {/* Inventory Stock HUD */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2.5 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
            <h4 className="font-bold text-on-surface text-body-md font-heading flex items-center gap-1.5 flex-shrink-0">
              <span className="material-symbols-outlined text-secondary">engineering</span>
              Contractor Workspace
            </h4>
            <button 
              onClick={onBack}
              className="text-[10px] text-outline hover:text-on-surface border border-outline-variant px-2 py-1 rounded bg-transparent cursor-pointer font-bold"
            >
              Exit
            </button>
          </div>
          <span className="text-[9px] font-mono text-outline uppercase tracking-wider block font-bold mt-1">Material Stocks (Depot Yard):</span>
          <div className="flex flex-col gap-1.5 font-mono-data text-xs max-h-36 overflow-y-auto pr-1">
            {Object.entries(materialsInventory).map(([name, stock]) => (
              <div key={name} className="flex justify-between bg-surface-container px-2 py-1.5 rounded border border-outline-variant/30 text-on-surface-variant">
                <span className="truncate max-w-[190px]">{name}</span>
                <span className={`font-bold ${stock < 10 ? "text-error" : "text-secondary"}`}>{stock} Units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Orders Feed */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
          <span className="text-[10px] font-mono text-outline uppercase tracking-wide block px-1 font-bold">Approved Work Orders ({approvedReports.length}):</span>
          {approvedReports.length === 0 ? (
            <div className="text-center py-8 text-outline text-body-sm bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
              No approved repair budgets waiting.
            </div>
          ) : (
            approvedReports.map((r) => {
              const isSelected = r.id === selectedReportId;
              const isRepresolved = r.status === "resolved";
              const isDispatched = crewDispatchStatus[r.id] === "dispatched";
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`border rounded-lg p-3.5 cursor-pointer transition-all bg-surface-container-lowest ${
                    isSelected 
                      ? "border-secondary bg-surface-container-low" 
                      : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-on-surface-variant font-bold uppercase">{r.category.replace("_", " ")}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                      isRepresolved 
                        ? "bg-secondary/10 text-secondary" 
                        : isDispatched 
                        ? "bg-accent-amber/20 text-accent-amber animate-pulse" 
                        : "bg-secondary/15 text-secondary"
                    }`}>
                      {isRepresolved ? "Resolved" : isDispatched ? "Dispatched" : "Approved"}
                    </span>
                  </div>
                  <h5 className="font-semibold text-on-surface text-body-sm font-heading truncate mt-1.5">{r.sub_category}</h5>
                  <p className="text-[9px] text-outline mt-0.5 truncate">{r.location_name}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel: Approved Repair Dispatch details */}
      <div className={`flex-1 min-h-0 h-full flex flex-col ${selectedReportId ? "flex" : "hidden md:flex"}`}>
        {selectedReportId && (
          <div className="md:hidden flex items-center mb-3 text-left">
            <button
              onClick={() => setSelectedReportId(null)}
              className="flex items-center gap-1.5 text-secondary font-heading font-semibold text-xs py-1.5 px-3 rounded-lg bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to Work Orders List
            </button>
          </div>
        )}
        {selectedReport ? (
          <div className="h-full flex flex-col gap-4 bg-surface-container-lowest p-5 border border-outline-variant rounded-xl overflow-y-auto shadow-sm scrollbar-thin">
            <div className="flex items-start justify-between border-b border-outline-variant/30 pb-3 flex-shrink-0">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[10px] font-mono text-outline uppercase tracking-wide">Work Dispatch File</span>
                <h3 className="text-body-lg font-bold font-heading text-on-surface mt-0.5">
                  {selectedReport.sub_category || "Contractor Job"}
                </h3>
                <p className="text-xs text-outline font-mono mt-0.5">{selectedReport.location_name}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded border font-mono font-bold capitalize ${
                selectedReport.status === "resolved" 
                  ? "bg-secondary/10 text-secondary border-secondary/20" 
                  : crewDispatchStatus[selectedReport.id] === "dispatched"
                  ? "bg-accent-amber/15 text-accent-amber border-accent-amber/20 animate-pulse"
                  : "bg-secondary/10 text-secondary border-secondary/20"
              }`}>
                {selectedReport.status === "resolved" 
                  ? "Resolved" 
                  : crewDispatchStatus[selectedReport.id] === "dispatched"
                  ? "Crew Dispatched"
                  : "Assigned Order"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Image & Crew Log */}
              <div className="flex flex-col gap-3">
                {selectedReport.image_url && (
                  <div className="relative h-48 rounded-lg overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center">
                    <img src={selectedReport.image_url} alt="Reference photo" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="bg-surface-container border border-outline-variant/50 p-4 rounded-lg text-left font-mono-data text-xs text-on-surface-variant">
                  <span className="text-secondary font-heading font-semibold text-[10px] uppercase tracking-wider block border-b border-outline-variant/30 pb-1.5 mb-2">
                    Crew Dispatch Telemetry:
                  </span>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-outline">Assigned Sector:</span>{" "}
                      <span className="text-on-surface font-semibold">Infrastructure Zone 22</span>
                    </div>
                    <div>
                      <span className="text-outline">Dimensions Scope:</span>{" "}
                      <span className="text-on-surface font-semibold">{selectedReport.engineering_data?.estimated_dimensions || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-outline">Estimated Labor:</span>{" "}
                      <span className="text-on-surface font-semibold">{selectedReport.engineering_data?.estimated_labor_hours || 0} Hours</span>
                    </div>
                    <div>
                      <span className="text-outline">Mitigation Protocol:</span>{" "}
                      <span className="text-error font-semibold">{selectedReport.engineering_data?.hazard_mitigation_step || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Inventory check and materials ledger */}
              <div className="flex flex-col gap-3 text-left">
                <div className="bg-surface-container border border-outline-variant/50 p-4 rounded-lg">
                  <span className="text-[10px] font-mono text-outline uppercase tracking-wider block mb-3 font-bold">
                    Material Allocation Checklist:
                  </span>

                  <div className="flex flex-col gap-2.5 font-mono-data text-xs">
                    {selectedReport.engineering_data?.required_materials?.map((m: any, idx: number) => {
                      const check = checkMaterialAvailability(m.item, m.quantity);
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col gap-2 p-3 rounded-lg border text-left ${
                            check.available 
                              ? "bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant" 
                              : "bg-error-container border-error/20 text-error"
                          }`}
                        >
                          {/* Top Row: Item name & depot stock */}
                          <div className="flex items-start justify-between border-b border-outline-variant/30 pb-1.5 gap-2">
                            <span className="font-sans font-semibold text-on-surface text-[12px] leading-snug">{m.item}</span>
                            <span className="text-[10px] font-mono text-outline flex-shrink-0 mt-0.5">Depot: {check.stock} units</span>
                          </div>
                          {/* Bottom Row: Quantity needed & stock availability */}
                          <div className="flex items-center justify-between text-xs mt-0.5">
                            <span className="text-on-surface-variant font-mono">Need: <strong className="text-on-surface font-extrabold font-mono">{m.quantity}</strong></span>
                            <span className={`text-[10px] font-bold ${check.available ? "text-secondary" : "text-error animate-pulse"}`}>
                              {check.available ? "✓ STOCK AVAILABLE" : "⚠ INSUFFICIENT STOCK"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Contractor dispatch controls */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between flex-shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono text-outline">Operation Status:</span>
                <span className="text-xs font-semibold text-on-surface-variant mt-0.5">
                  {selectedReport.status === "resolved" 
                    ? "✓ repair completed and verified on digital twin." 
                    : crewDispatchStatus[selectedReport.id] === "dispatched"
                    ? "🚜 Crew active at location coordinates."
                    : "⏳ Crew dispatch pending."}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => handleDispatchCrew(selectedReport.id)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 text-xs text-secondary border border-secondary/30 hover:border-secondary hover:bg-secondary/10 rounded font-heading font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    (selectedReport.status === "resolved" || crewDispatchStatus[selectedReport.id] === "dispatched") 
                      ? "opacity-50 cursor-not-allowed border-outline-variant bg-transparent text-outline" 
                      : "cursor-pointer"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">navigation</span>
                  Dispatch Repair Crew
                </button>

                <button
                  onClick={() => handleResolveRepair(selectedReport.id)}
                  className={`flex-1 sm:flex-none bg-secondary text-on-secondary py-2.5 px-5 text-xs font-heading font-bold rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${
                    selectedReport.status === "resolved" 
                      ? "opacity-50 cursor-not-allowed" 
                      : "cursor-pointer"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Mark Repair as Resolved
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl mb-3">engineering</span>
            <h4 className="text-body-md font-semibold font-heading text-on-surface">Contractor Work Queue</h4>
            <p className="text-body-sm text-outline max-w-xs mt-1">Select an approved work order from the list on the left to allocate yard materials, dispatch repair crews, and sign off on completed repairs.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Environment Key Validation
  const requiredKeys = {
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
    VITE_OPENWEATHERMAP_API_KEY: import.meta.env.VITE_OPENWEATHERMAP_API_KEY,
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
  };

  const missingKeys = Object.entries(requiredKeys)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const hasAllKeys = missingKeys.length === 0;

  // Database States
  const [reports, setReports] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // UI Selection States
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draftCoords, setDraftCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activePage, setActivePage] = useState<"twin" | "report" | "sentinel" | "advocacy" | "admin_control" | "contractor_board">("twin");
  const [mobileTwinView, setMobileTwinView] = useState<"map" | "list">("map");
  const [userRole, setUserRole] = useState<"citizen" | "admin" | "contractor">("citizen");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [deployingReport, setDeployingReport] = useState<any | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active Quest highlighting filter from map
  const [activeQuestFilter, setActiveQuestFilter] = useState<string | null>(null);

  const handleGoToQuest = (reportId: string) => {
    const quest = quests.find(q => q.target_report_id === reportId && q.status === "active");
    if (quest) {
      setActiveQuestFilter(quest.id);
    }
    setActivePage("sentinel");
  };

  // Selection handler
  const handleSelectReport = (id: string) => {
    if (selectedReportId === id) {
      setSelectedReportId(null);
    } else {
      setSelectedReportId(id);
    }
  };

  // App processing states
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isSimulatingForecast, setIsSimulatingForecast] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");

  // In-App Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);


  // 1. Hook up database real-time listeners
  useEffect(() => {
    if (!hasAllKeys) return;
    
    let active = true;
    let unsubReports: any;
    let unsubQuests: any;
    let unsubNotifications: any;
    let unsubUser: any;
    let unsubAllUsers: any;

    const init = async () => {
      await seedFirestoreIfEmpty();
      if (!active) return;

      unsubReports = subscribeToReports(setReports);
      unsubQuests = subscribeToQuests(setQuests);
      unsubNotifications = subscribeToNotifications(setNotifications);
      unsubUser = subscribeToUser(setUser);
      unsubAllUsers = subscribeToAllUsers(setAllUsers);
    };

    init();

    return () => {
      active = false;
      if (unsubReports) unsubReports();
      if (unsubQuests) unsubQuests();
      if (unsubNotifications) unsubNotifications();
      if (unsubUser) unsubUser();
      if (unsubAllUsers) unsubAllUsers();
    };
  }, [hasAllKeys]);

  // Track newly created report until it syncs into the main reports list
  const [newlyCreatedReport, setNewlyCreatedReport] = useState<any | null>(null);

  // Derived State: Single source of truth for the active selected report
  const selectedReport = selectedReportId
    ? reports.find(r => r.id === selectedReportId) || (newlyCreatedReport?.id === selectedReportId ? newlyCreatedReport : null)
    : null;

  // 2. Handle Report Filing Pipeline
  const handleUploadStart = () => {
    setIsProcessingUpload(true);
    setUploadStatusMsg("Capturing GPS coordinates and tags...");
  };

  const handleUploadSuccess = async ({ file, description, latitude, longitude }: any) => {
    try {
      // Step A: Geofencing Check - Check if there is an active report within 20 meters (~0.00018 lat/lon offset)
      setUploadStatusMsg("Checking neighborhood geofence for duplicates...");
      const geofenceLimit = 0.0002;
      const nearbyReport = reports.find(r => {
        if (r.status === "resolved") return false;
        const dLat = Math.abs(r.coordinates.latitude - latitude);
        const dLon = Math.abs(r.coordinates.longitude - longitude);
        return dLat < geofenceLimit && dLon < geofenceLimit;
      });

      if (nearbyReport) {
        setUploadStatusMsg("Nearby report found. Analyzing photos with Gemini Vision...");
        const imageUrl = nearbyReport.image_url || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=300&q=80"; // fallback
        
        // Call Gemini Visual Duplicate Checker
        const dupCheck = await checkVisualDuplicate(file, imageUrl);
        
        if (dupCheck.is_duplicate) {
          // It's a duplicate! Increment report count instead of creating a new pin
          setUploadStatusMsg("Duplicate confirmed. Merging reports to raise priority...");
          await updateReport(nearbyReport.id, {
            report_count: (nearbyReport.report_count || 1) + 1
          });
          showToast(`Merged Duplicate: We have merged your report to raise its urgency!`, "success");
          setSelectedReportId(nearbyReport.id);
          setIsProcessingUpload(false);
          return;
        }
      }

      // Step B: Unique report - Call Gemini Model A (Inspect & Costing)
      setUploadStatusMsg("Gemini 2.5 Flash auditing infrastructure damage & materials...");
      const engineeringReport = await inspectDamage(file, description, latitude, longitude);

      // Step C: Call Gemini Model B (Advocacy Writer)
      setUploadStatusMsg("Gemini 2.5 Pro compiling legal RTI filings and advocacy letters...");
      const advocacyKit = await generateAdvocacyKit(engineeringReport, "Greater Municipal Corporation");

      // Step D: Write new report to Firebase Firestore
      setUploadStatusMsg("Saving verified report to digital twin...");
      
      // Upload report media to persistent storage
      setUploadStatusMsg("Uploading media to persistent storage...");
      const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
      const storagePath = `reports/report_${Date.now()}.${fileExtension}`;
      const imageUrl = await uploadImage(file, storagePath);

      const newReportData = {
        coordinates: { latitude, longitude },
        location_name: `Location near (Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)})`,
        category: engineeringReport.category,
        sub_category: engineeringReport.sub_category,
        severity: Math.min(5, Math.max(1, engineeringReport.severity_score || 3)),
        report_count: 1,
        status: "open",
        image_url: imageUrl,
        engineering_data: {
          ...engineeringReport,
          severity_score: Math.min(5, Math.max(1, engineeringReport.severity_score || 3))
        },
        advocacy_kit: advocacyKit
      };

      const newReportId = await addReport(newReportData);

      setNewlyCreatedReport({ id: newReportId, ...newReportData });
      setSelectedReportId(newReportId);
      setDraftCoords(null); // Clear map selection pin
      setActivePage("twin");
      setMobileTwinView("map");
      showToast("Success: Verified hazard filed and mapped to digital twin!", "success");
    } catch (e) {
      console.error(e);
      showToast("Error filing report: API check failed.", "error");
    } finally {
      setIsProcessingUpload(false);
      setUploadStatusMsg("");
    }
  };

  const handleUploadError = (error: string) => {
    setIsProcessingUpload(false);
    showToast(error, "error");
  };

  // 3. Handle Weather Predictive Simulation (Model C)
  const handleTriggerWeatherSimulation = async () => {
    setIsSimulatingForecast(true);
    try {
      // Fetch 5-Day Weather Forecast (centered at default sandbox coordinates)
      const lat = 17.712;
      const lon = 83.321;
      const forecast = await fetchWeatherForecast(lat, lon);
      
      if (!forecast) {
        showToast("Failed to fetch weather forecast trends.", "error");
        setIsSimulatingForecast(false);
        return;
      }

      // Filter to currently unresolved reports
      const activeReports = reports.filter(r => r.status === "open").map(r => ({
        id: r.id,
        location_name: r.location_name,
        category: r.category,
        severity: r.severity
      }));

      if (activeReports.length === 0) {
        showToast("Please add some open hazards first!", "error");
        setIsSimulatingForecast(false);
        return;
      }

      // Send telemetry to Gemini Model C
      const decayResults = await predictDecayAndNotify(activeReports, forecast, "sector_beach");
      
      showToast(`Simulation completed! Gemini predicted ${decayResults.predicted_hazards.length} potential infrastructure risks.`, "success");
    } catch (error) {
      console.error("Predictive decay failed:", error);
    } finally {
      setIsSimulatingForecast(false);
    }
  };



  if (!hasAllKeys) {
    return (
      <div className="min-h-screen bg-bg-void text-slate-100 flex flex-col relative overflow-hidden font-body items-center justify-center p-6">
        <div className="organic-blob -top-20 -left-20 bg-accent-sage/10 animate-float-slow" />
        <div className="organic-blob bottom-10 right-10 bg-accent-forest/10 animate-float-slower" />

        <div className="glass-panel border-accent-amber/20 max-w-xl w-full p-8 rounded-2xl flex flex-col gap-6 relative z-10 shadow-soft-natural">
          <div className="flex items-center gap-3.5 border-b border-border-soft/30 pb-4">
            <div className="w-11 h-11 rounded-xl bg-accent-amber/15 flex items-center justify-center text-accent-amber border border-accent-amber/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-100 tracking-wide">CivicLens Config Guard</h2>
              <p className="text-xs text-slate-400 font-mono">Real-world deployment validation failed</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              CivicLens is currently set to run in full production mode (live integrations only). To activate the Mapbox 3D digital twin, Firebase cloud sync, Gemini civil engineering agents, and OpenWeatherMap telemetry, you must configure your project variables.
            </p>

            <div className="bg-bg-void/40 border border-border-soft/60 rounded-xl p-4 flex flex-col gap-2.5 my-1">
              <span className="text-xs font-semibold text-slate-200">Required Environment Keys Status:</span>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                {Object.entries(requiredKeys).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-bg-void/30 px-3 py-2 rounded-lg border border-border-soft/20">
                    <span className="text-slate-300 flex items-center gap-1.5 font-mono">
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      {key}
                    </span>
                    {value ? (
                      <span className="text-accent-forest font-bold">✓ CONFIGURED</span>
                    ) : (
                      <span className="text-accent-clay font-bold animate-pulse">✗ MISSING</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent-sage/[0.02] border border-accent-sage/20 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-accent-sage" />
                Quick Setup Instructions:
              </span>
              <ol className="text-xs text-slate-400 list-decimal list-inside space-y-1 leading-relaxed">
                <li>Create a <code className="bg-bg-void px-1.5 py-0.5 rounded text-accent-sage">.env</code> file in the project root directory.</li>
                <li>Copy variables from <code className="bg-bg-void px-1.5 py-0.5 rounded text-accent-sage">.env.example</code> into your <code className="bg-bg-void px-1.5 py-0.5 rounded text-accent-sage">.env</code> file.</li>
                <li>Fill in your credentials (Firebase configurations & Google AI Studio key).</li>
                <li>Save the file and click refresh below</li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="btn-civic-primary py-3 font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4.5 h-4.5 animate-spin-hover" />
            Refresh Connection Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-background text-on-surface flex relative overflow-hidden font-body-md">
      {/* Side Navigation Bar (Desktop Only) */}
      <aside className={`hidden md:flex flex-col bg-primary-container text-on-primary border-r border-outline-variant h-full flex-shrink-0 z-30 select-none transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-[76px]" : "w-[280px]"}`}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b border-outline-variant/30 flex items-center justify-between gap-3 ${isSidebarCollapsed ? "flex-col p-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
              <img src="/logo.jpg" alt="CivicLens Logo" className="w-full h-full object-cover" />
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left">
                <h1 className="text-title-lg font-title-lg text-white font-bold leading-tight">CivicLens</h1>
                <p className="text-label-md font-label-md text-on-primary-container">Digital Twin Platform</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-on-primary-container hover:text-white p-1 rounded hover:bg-white/5 cursor-pointer flex items-center justify-center flex-shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className={`flex-1 p-4 space-y-2 text-left ${isSidebarCollapsed ? "p-2.5" : ""}`}>
          {(() => {
            const navItems = [
              { id: "twin", label: "Digital Twin", icon: "map" },
              { id: "report", label: "Report Hazard", icon: "add_a_photo" },
              { id: "sentinel", label: "Sentinel Hub", icon: "explore" },
              { id: "advocacy", label: "Advocacy Desk", icon: "gavel" }
            ];
            if (userRole === "admin") {
              navItems.push({ id: "admin_control", label: "Admin Center", icon: "admin_panel_settings" });
            } else if (userRole === "contractor") {
              navItems.push({ id: "contractor_board", label: "Contractor Hub", icon: "engineering" });
            }

            return navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id as any);
                    if (item.id !== "advocacy") {
                      setSelectedReportId(null);
                    }
                  }}
                  className={`w-full flex items-center rounded-lg text-body-md font-medium transition-all duration-200 cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                  } ${
                    active 
                      ? "bg-secondary text-white font-bold" 
                      : "text-on-primary-container hover:text-white hover:bg-white/5"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            });
          })()}
        </nav>

        {/* Profile Card / Role Switcher */}
        <div className={`p-6 border-t border-outline-variant/30 mt-auto flex flex-col gap-3 ${isSidebarCollapsed ? "p-3 items-center" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left min-w-0">
                <p className="text-body-sm font-semibold text-white truncate max-w-[150px]">{user?.display_name === "Civic Hero Vizag" ? "Civic Hero" : (user?.display_name || "Citizen Sentinel")}</p>
                <p className="text-label-md text-on-primary-container">Level {user?.level || 1} Sentinel</p>
              </div>
            )}
          </div>

          {/* Desktop Role Switcher Dropdown */}
          {isSidebarCollapsed ? (
            <button
              onClick={() => {
                const nextRole = userRole === "citizen" ? "admin" : userRole === "admin" ? "contractor" : "citizen";
                setUserRole(nextRole);
                showToast(`Switched profile to ${nextRole === "citizen" ? "Citizen Sentinel" : nextRole === "admin" ? "Municipal Officer" : "Infrastructure Contractor"}`, "success");
                if (nextRole === "admin") {
                  setActivePage("admin_control");
                } else if (nextRole === "contractor") {
                  setActivePage("contractor_board");
                } else {
                  setActivePage("twin");
                }
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/5 border border-outline-variant/30 rounded-lg text-white hover:bg-white/10 transition-all cursor-pointer flex-shrink-0"
              title={`Switch Role (Current: ${userRole})`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {userRole === "citizen" ? "explore" : userRole === "admin" ? "admin_panel_settings" : "engineering"}
              </span>
            </button>
          ) : (
            <div className="relative text-left w-full">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="w-full flex items-center justify-between bg-white/5 border border-outline-variant/30 px-3 py-2 rounded text-white hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
              >
                <span className="capitalize">{userRole === "citizen" ? "Citizen Sentinel" : userRole === "admin" ? "Municipal Admin" : "Infrastructure Contractor"}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              
              {showRoleMenu && (
                <div className="absolute bottom-12 left-0 right-0 rounded bg-primary-container border border-outline-variant/50 shadow-2xl p-1 z-50">
                  {(["citizen", "admin", "contractor"] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setUserRole(role);
                        setShowRoleMenu(false);
                        showToast(`Switched profile to ${role === "citizen" ? "Citizen Sentinel" : role === "admin" ? "Municipal Officer" : "Infrastructure Contractor"}`, "success");
                        if (role === "admin") {
                          setActivePage("admin_control");
                        } else if (role === "contractor") {
                          setActivePage("contractor_board");
                        } else {
                          setActivePage("twin");
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-xs transition-all cursor-pointer flex items-center gap-2 text-on-primary-container hover:text-white hover:bg-white/5 ${
                        userRole === role ? "bg-secondary text-white font-bold" : ""
                      }`}
                    >
                      <span className="capitalize">{role === "citizen" ? "Citizen" : role === "admin" ? "Admin" : "Contractor"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main viewport area (Right Column) */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative pb-16 md:pb-0">
        {/* Top App Bar/Header */}
        <header className="bg-surface-container-low border-b border-outline-variant px-4 py-2.5 md:px-6 md:py-4 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Header Title */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-white">shield</span>
              </div>
              <div className="text-left">
                <h1 className="text-body-md font-bold text-on-surface leading-none">CivicLens</h1>
                <p className="text-[9px] text-outline font-mono mt-0.5">Digital Twin Network</p>
              </div>
            </div>
            {/* Desktop Active Page Title */}
            <h2 className="hidden md:block text-headline-md font-headline-md text-on-surface">
              {activePage === "twin" && "Digital Twin Workspace"}
              {activePage === "report" && "Report Hazard"}
              {activePage === "sentinel" && "Sentinel Quests Hub"}
              {activePage === "advocacy" && "Advocacy Desk"}
              {activePage === "admin_control" && "Municipal Administration Control"}
              {activePage === "contractor_board" && "Contractor Operations Board"}
            </h2>
          </div>

          {/* Mobile Profile Role Switcher Button */}
          <div className="md:hidden relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1 bg-surface-container border border-outline-variant px-2 py-1 rounded text-on-surface-variant font-bold text-xs cursor-pointer"
            >
              <span className="capitalize truncate max-w-[100px]">{userRole}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded bg-surface-container border border-outline shadow-2xl p-1 z-50">
                {(["citizen", "admin", "contractor"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role);
                      setShowRoleMenu(false);
                      showToast(`Switched profile to ${role === "citizen" ? "Citizen Sentinel" : role === "admin" ? "Municipal Officer" : "Infrastructure Contractor"}`, "success");
                      if (role === "admin") {
                        setActivePage("admin_control");
                      } else if (role === "contractor") {
                        setActivePage("contractor_board");
                      } else {
                        setActivePage("twin");
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs hover:bg-surface-variant cursor-pointer capitalize text-on-surface-variant"
                  >
                    {role === "citizen" ? "Citizen" : role === "admin" ? "Admin" : "Contractor"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 overflow-hidden z-10 min-h-0 relative">
          {/* Top Ticker Notification Banner */}
          <NotificationsHUD 
            notifications={notifications}
            onTriggerSimulation={handleTriggerWeatherSimulation}
            isSimulatingForecast={isSimulatingForecast}
          />

          {/* Active Page Viewport */}
          <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden relative">
            {activePage === "twin" && (
              <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                {/* Center Map Canvas Column */}
                <div className="flex-1 flex flex-col gap-4 min-h-0 h-full relative">
                  {/* Mobile View Toggle */}
                  <div className="lg:hidden flex bg-surface-container-low border border-outline-variant p-1 rounded-lg flex-shrink-0">
                    <button
                      onClick={() => setMobileTwinView("map")}
                      className={`flex-1 text-center py-1.5 text-[11px] font-heading font-medium rounded transition-all duration-300 cursor-pointer ${
                        mobileTwinView === "map"
                          ? "bg-secondary text-on-secondary font-bold"
                          : "text-on-surface-variant"
                      }`}
                    >
                      Digital Twin Map
                    </button>
                    <button
                      onClick={() => setMobileTwinView("list")}
                      className={`flex-1 text-center py-1.5 text-[11px] font-heading font-medium rounded transition-all duration-300 cursor-pointer ${
                        mobileTwinView === "list"
                          ? "bg-secondary text-on-secondary font-bold"
                          : "text-on-surface-variant"
                      }`}
                    >
                      Browse Hazards ({reports.length})
                    </button>
                  </div>

                  {/* Map Display */}
                  <div className={`flex-1 min-h-0 h-full relative ${mobileTwinView === "map" ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
                    <DigitalTwinMap 
                      reports={reports}
                      selectedReportId={selectedReportId}
                      onSelectReport={handleSelectReport}
                      draftCoords={draftCoords}
                      onMapClick={(lat, lon) => {
                        if (selectedReportId) {
                          setSelectedReportId(null);
                        } else {
                          setDraftCoords({ latitude: lat, longitude: lon });
                          setSelectedReportId(null);
                        }
                      }}
                    />

                    {/* Selected Report Floating Map Card */}
                    {(() => {
                      if (!selectedReport) return null;

                      const lat = selectedReport.coordinates.latitude;
                      const isDefaultSandboxCoords = lat > 17.6 && lat < 17.9;
                      let wardName = "";
                      let wardHealth = 92;

                      if (isDefaultSandboxCoords) {
                        if (lat > 17.75) {
                          wardName = "Academic Sector (Zone 5)";
                          wardHealth = 92;
                        } else if (lat > 17.715) {
                          wardName = "Transit Sector (Zone 15)";
                          wardHealth = 95;
                        } else {
                          wardName = "Coastal Sector (Zone 22)";
                          wardHealth = 90;
                        }
                      } else {
                        wardName = selectedReport.location_name ? selectedReport.location_name.split(',')[0].replace("Location near ", "") : `Sector (Lat: ${lat.toFixed(3)})`;
                        wardHealth = 94;
                      }

                      return (
                        <div className="absolute bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-80 z-20 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3 animate-fade-in shadow-lg text-left text-on-surface">
                          <div className="flex items-start justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
                            <div className="text-left min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-mono text-outline uppercase tracking-wider font-bold">
                                  {selectedReport.category.replace("_", " ")}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/15 border border-secondary/30 px-1.5 py-0.5 rounded text-[9px] font-bold text-secondary font-mono flex-shrink-0">
                                  <span className="material-symbols-outlined text-[10px]">favorite</span>
                                  {wardHealth}% Health
                                </span>
                              </div>
                              <h4 className="font-semibold text-on-surface text-body-md font-heading leading-snug truncate mt-0.5" title={selectedReport.sub_category}>
                                {selectedReport.sub_category || "Infrastructure Hazard"}
                              </h4>
                              <p className="text-[9px] text-on-surface-variant font-sans mt-0.5 truncate" title={`Ward: ${wardName} | ${selectedReport.location_name}`}>
                                <span className="font-semibold text-secondary">Ward: {wardName}</span> • {selectedReport.location_name}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedReportId(null)}
                              className="p-1 rounded-full hover:bg-surface-variant text-outline hover:text-on-surface cursor-pointer flex items-center justify-center flex-shrink-0"
                              title="Close details"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>

                          {/* Attached Image */}
                          {selectedReport.image_url && (
                            <div className="relative h-28 rounded overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center">
                              {isVideoUrl(selectedReport.image_url) ? (
                                <video
                                  src={getMediaSource(selectedReport.image_url)}
                                  controls
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={selectedReport.image_url}
                                  alt="Attached evidence"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}

                          {/* Brief engineering/mitigation info */}
                          {selectedReport.engineering_data && (
                            <div className="text-xs text-on-surface-variant text-left leading-relaxed bg-surface-container border border-outline-variant/50 p-2.5 rounded">
                              <p className="line-clamp-2">{selectedReport.engineering_data.severity_justification}</p>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/30 text-outline font-mono-data text-[9px] font-bold">
                                <span>Est: ₹{selectedReport.engineering_data.estimated_cost_inr?.toLocaleString("en-IN")}</span>
                                <span className="text-secondary">Severity {Math.min(5, Math.max(1, selectedReport.severity))}/5</span>
                              </div>
                            </div>
                          )}

                          {/* Advocacy desk button */}
                          {selectedReport.advocacy_kit && selectedReport.status !== "resolved" && (
                            <button
                              onClick={() => setActivePage("advocacy")}
                              className="w-full py-2 bg-secondary text-on-secondary font-heading font-semibold text-xs rounded hover:opacity-90 transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">gavel</span>
                              Open Advocacy Desk
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Draft Location Pin Floating Map Card */}
                    {!selectedReportId && draftCoords && (
                      <div className="absolute bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-80 z-20 bg-surface-container-lowest border border-secondary rounded-lg p-4 flex flex-col gap-3 animate-fade-in shadow-lg text-left text-on-surface">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-left">
                            <span className="text-[10px] font-mono text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">location_on</span> Draft Coordinates Set
                            </span>
                            <h4 className="font-semibold text-on-surface text-body-md font-heading leading-snug mt-1">
                              New Report Location
                            </h4>
                            <p className="text-[10px] text-outline font-mono mt-1 bg-surface-container p-1.5 rounded border border-outline-variant/30">
                              Lat: {draftCoords.latitude.toFixed(6)}, Lon: {draftCoords.longitude.toFixed(6)}
                            </p>
                          </div>
                          <button
                            onClick={() => setDraftCoords(null)}
                            className="p-1 rounded-full hover:bg-surface-variant text-outline hover:text-on-surface cursor-pointer flex items-center justify-center"
                            title="Remove Pin"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-on-surface-variant leading-normal">
                          Would you like to file a new infrastructure hazard report at this map location?
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDraftCoords(null)}
                            className="flex-1 px-3 py-2 rounded border border-error text-error hover:bg-error/10 transition-all text-center font-bold text-[10px] cursor-pointer"
                          >
                            Remove Pin
                          </button>
                          <button
                            onClick={() => setActivePage("report")}
                            className="flex-1 bg-secondary text-on-secondary py-2 px-3 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">add_a_photo</span>
                            File Report
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile List Feed View */}
                  <div className={`flex-1 min-h-0 h-full lg:hidden ${mobileTwinView === "list" ? "flex flex-col" : "hidden"}`}>
                    <IssueFeed 
                      reports={reports}
                      selectedReportId={selectedReportId}
                      onSelectReport={handleSelectReport}
                      quests={quests}
                      onGoToQuest={handleGoToQuest}
                    />
                  </div>
                </div>

                {/* Desktop Side Feed Panel */}
                <div className="hidden lg:flex flex-col gap-4 w-96 min-h-0 h-full flex-shrink-0">
                  <IssueFeed 
                    reports={reports}
                    selectedReportId={selectedReportId}
                    onSelectReport={handleSelectReport}
                    quests={quests}
                    onGoToQuest={handleGoToQuest}
                  />
                </div>
              </div>
            )}

            {activePage === "report" && (
              <div className="flex-1 flex items-start md:items-center justify-center overflow-y-auto min-h-0 max-w-xl mx-auto w-full scrollbar-thin p-1">
                <MediaUploader 
                  onUploadStart={handleUploadStart}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  selectedCoords={draftCoords}
                  onCoordsChange={setDraftCoords}
                  onViewOnMap={() => {
                    setActivePage("twin");
                    setMobileTwinView("map");
                  }}
                />
              </div>
            )}

            {activePage === "sentinel" && (
              <div className="flex-1 flex flex-col items-stretch justify-start overflow-y-auto md:overflow-hidden min-h-0 max-w-6xl mx-auto w-full p-1 pb-16 md:pb-0">
                <QuestHub 
                  quests={quests}
                  user={user}
                  reports={reports}
                  showToast={showToast}
                  allUsers={allUsers}
                  activeQuestFilter={activeQuestFilter}
                  onClearQuestFilter={() => setActiveQuestFilter(null)}
                />
              </div>
            )}

            {activePage === "advocacy" && (
              <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden pb-16 md:pb-0">
                {/* Left Column: Select Hazard */}
                <div className={`w-full md:w-80 flex flex-col gap-3 flex-shrink-0 h-full min-h-0 ${selectedReportId ? "hidden md:flex" : "flex"}`}>
                  <div className="bg-surface-container border border-outline-variant rounded-xl p-3.5 flex-shrink-0 text-left">
                    <h4 className="font-semibold text-on-surface text-body-sm font-heading">Advocacy Center</h4>
                    <p className="text-[10px] text-outline font-mono mt-0.5 font-mono-data">Select a reported hazard to inspect legal docs</p>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
                    {reports.filter(r => r.advocacy_kit && r.status === "open").length === 0 ? (
                      <div className="text-center py-8 text-outline text-body-sm font-mono-data">
                        No open hazards with advocacy kits.
                      </div>
                    ) : (
                      reports
                        .filter(r => r.advocacy_kit && r.status === "open")
                        .map(r => (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReportId(r.id)}
                            className={`border rounded-lg p-3 cursor-pointer text-left transition-all bg-surface-container-lowest ${
                              r.id === selectedReportId 
                                ? "border-secondary bg-surface-container-low" 
                               : "border-outline-variant hover:border-outline"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-mono text-outline uppercase tracking-wider font-bold">{r.category.replace("_", " ")}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full capitalize ${r.status === "open" ? "bg-error-container text-error font-semibold" : "bg-secondary/10 text-secondary font-semibold"}`}>
                                {r.status}
                              </span>
                            </div>
                            <h5 className="font-semibold text-on-surface text-body-sm font-heading truncate mt-1">{r.sub_category || "Hazard Report"}</h5>
                            <p className="text-[10px] text-on-surface-variant font-mono mt-0.5 truncate">{r.location_name}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Right Column: Inline Workspace */}
                <div className={`flex-1 min-h-0 h-full relative flex flex-col ${selectedReportId ? "flex" : "hidden md:flex"}`}>
                  {selectedReportId && (
                    <div className="md:hidden flex items-center mb-3 text-left">
                      <button
                        onClick={() => setSelectedReportId(null)}
                        className="flex items-center gap-1.5 text-secondary font-heading font-semibold text-xs py-1.5 px-3 rounded-lg bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        Back to Hazard List
                      </button>
                    </div>
                  )}

                  {selectedReport && selectedReport.advocacy_kit ? (
                    <AdvocacyPanelInline 
                      advocacyKit={selectedReport.advocacy_kit}
                      subCategory={selectedReport.sub_category || "Infrastructure Hazard"}
                      showToast={showToast}
                      onDeploy={() => setDeployingReport(selectedReport)}
                      isResolved={selectedReport.status === "resolved"}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
                      <span className="material-symbols-outlined text-outline text-5xl mb-3">gavel</span>
                      <h4 className="text-body-md font-semibold font-heading text-on-surface">Advocacy Desk Workspace</h4>
                      <p className="text-body-sm text-outline max-w-xs mt-1">Select a hazard from the list on the left to view the AI-generated petition templates, RTI filing forms, and official grievance letters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePage === "admin_control" && (
              <AdminControlPage
                reports={reports}
                quests={quests}
                showToast={showToast}
                onBack={() => setActivePage("twin")}
              />
            )}

            {activePage === "contractor_board" && (
              <ContractorBoardPage
                reports={reports}
                quests={quests}
                showToast={showToast}
                onBack={() => setActivePage("twin")}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Floating Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-45 bg-surface-container/95 backdrop-blur-md border border-outline-variant px-2 py-1 rounded-xl flex items-center justify-around shadow-lg">
        {(() => {
          const currentRoleIcon = userRole === "citizen" ? "explore" : userRole === "admin" ? "admin_panel_settings" : "engineering";
          const currentRoleLabel = userRole === "citizen" ? "Citizen" : userRole === "admin" ? "Admin" : "Contractor";

          const mobileNavItems = [
            { id: "twin", label: "Twin", icon: "map" },
            { id: "report", label: "Report", icon: "add_a_photo" },
            { id: "sentinel", label: "Sentinel", icon: "explore" },
            { id: "advocacy", label: "Advocacy", icon: "gavel" },
            { 
              id: "role_cycle", 
              label: currentRoleLabel, 
              icon: currentRoleIcon,
              isRoleSwitcher: true
            }
          ];

          return mobileNavItems.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isRoleSwitcher) {
                    const nextRole = userRole === "citizen" ? "admin" : userRole === "admin" ? "contractor" : "citizen";
                    setUserRole(nextRole);
                    showToast(`Switched profile to ${nextRole === "citizen" ? "Citizen Sentinel" : nextRole === "admin" ? "Municipal Officer" : "Infrastructure Contractor"}`, "success");
                    if (nextRole === "admin") {
                      setActivePage("admin_control");
                    } else if (nextRole === "contractor") {
                      setActivePage("contractor_board");
                    } else {
                      setActivePage("twin");
                    }
                  } else {
                    setActivePage(item.id as any);
                    if (item.id !== "advocacy") {
                      setSelectedReportId(null);
                    }
                  }
                }}
                className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded transition-all cursor-pointer min-w-[44px] min-h-[44px] justify-center ${
                  active 
                    ? "text-secondary font-bold" 
                    : item.isRoleSwitcher
                      ? "text-secondary bg-secondary/10 border border-secondary/20 shadow-sm"
                      : "text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-[9px] font-heading font-medium leading-none mt-0.5">{item.label}</span>
              </button>
            );
          });
        })()}
      </div>

      {/* Processing Loader Overlay */}
      {isProcessingUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6 select-none animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl max-w-sm text-center flex flex-col items-center gap-4 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary animate-pulse" />
            <span className="material-symbols-outlined animate-spin text-secondary text-5xl">sync</span>
            <h4 className="text-lg font-semibold font-heading text-on-surface">Civic Vision Processing</h4>
            <p className="text-xs text-outline font-mono leading-relaxed">{uploadStatusMsg}</p>
          </div>
        </div>
      )}

      {/* Deploy Campaign Informational Modal */}
      {deployingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 select-none text-left animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col gap-4 relative shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
            
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-secondary font-bold">
                <span className="material-symbols-outlined text-secondary animate-bounce">campaign</span>
                <h4 className="text-body-md font-bold font-heading text-on-surface uppercase tracking-wide">
                  Deploying Civic Advocacy Campaign
                </h4>
              </div>
              <button 
                onClick={() => setDeployingReport(null)}
                className="p-1 rounded-full hover:bg-surface-variant text-outline hover:text-on-surface cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin min-h-0 select-text">
              <p className="text-xs text-on-surface-variant leading-relaxed font-sans font-medium">
                Deploying a campaign triggers a series of coordinated community actions to lock in municipal accountability and accelerate resolution times for <span className="font-bold text-on-surface">"{deployingReport.sub_category || "Infrastructure Hazard"}"</span>:
              </p>

              <div className="flex flex-col gap-3 font-mono-data text-mono-data text-on-surface-variant">
                <div className="flex items-start gap-2.5 bg-surface-container border border-outline-variant/30 p-2.5 rounded-lg">
                  <div className="w-6 h-6 rounded bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0 font-bold">1</div>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Municipal Grievance Filing</span>
                    Registers the official civil report and photos on the National Municipal Authority Portal, initiating the statutory 7-day municipal review clock.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container border border-outline-variant/30 p-2.5 rounded-lg">
                  <div className="w-6 h-6 rounded bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0 font-bold">2</div>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Community Signature Petition</span>
                    Launches a digital petition ledger for this specific ward hazard. Local residents sign the petition, generating real-time notification alerts directly to the Ward Commissioner's dashboard.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container border border-outline-variant/30 p-2.5 rounded-lg">
                  <div className="w-6 h-6 rounded bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0 font-bold">3</div>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Section 6(1) RTI Notice Request</span>
                    Submits a Right to Information request to the Public Information Officer (PIO). This legally requires officers to disclose assigned contractor details and inspection logs under penalties for non-disclosure.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-surface-container border border-outline-variant/30 p-2.5 rounded-lg">
                  <div className="w-6 h-6 rounded bg-secondary/15 flex items-center justify-center text-secondary flex-shrink-0 font-bold">4</div>
                  <div>
                    <span className="font-bold text-on-surface block mb-0.5">Social Media Broadcasts</span>
                    Generates ready-to-share campaigns for X/Twitter and WhatsApp community groups to raise public visibility, keeping pressure on contractors.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono-data text-outline bg-surface-container border border-outline-variant/30 p-3 rounded-lg leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
                  <span>Simulation: This will mock-submit filings in this sandbox environment.</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-outline-variant/30 pt-3">
              <button 
                onClick={() => {
                  setDeployingReport(null);
                  showToast("Advocacy campaign deployed! Municipal Grievances, RTI Requests, and social portals initialized.", "success");
                }}
                className="w-full bg-secondary text-on-secondary rounded-lg py-2.5 text-label-md font-label-md font-bold hover:opacity-90 transition-opacity"
              >
                Authorize & Deploy Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Component */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl animate-slide-up-fade text-[11px]">
          {toast.type === "success" ? (
            <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
          )}
          <span className="font-heading font-medium whitespace-nowrap">
            {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
