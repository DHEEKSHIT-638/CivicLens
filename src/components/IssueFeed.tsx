import { useState } from "react";

interface Report {
  id: string;
  coordinates: { latitude: number; longitude: number };
  location_name: string;
  category: string;
  sub_category?: string;
  severity: number;
  report_count: number;
  status: string;
  created_at: string;
  image_url?: string;
  engineering_data?: {
    severity_justification?: string;
    estimated_cost_inr?: number;
    estimated_labor_hours?: number;
    estimated_dimensions?: string;
    required_materials?: any[];
    hazard_mitigation_step?: string;
  };
  resolution_verification?: {
    verification_status: string;
    justification: string;
  };
}

interface IssueFeedProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  quests?: any[];
  onGoToQuest?: (reportId: string) => void;
}

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

export function IssueFeed({ reports, selectedReportId, onSelectReport, quests, onGoToQuest }: IssueFeedProps) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "road_hazard":
        return <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">construction</span>;
      case "water_grid":
        return <span className="material-symbols-outlined text-[18px] text-secondary">water_drop</span>;
      case "electrical_grid":
        return <span className="material-symbols-outlined text-[18px] text-accent-amber">bolt</span>;
      case "waste_management":
        return <span className="material-symbols-outlined text-[18px] text-outline">delete</span>;
      default:
        return <span className="material-symbols-outlined text-[18px] text-outline">help_outline</span>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace("_", " ");
  };

  // Filter reports list
  const filteredReports = reports.filter((report) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      report.location_name.toLowerCase().includes(searchLower) ||
      (report.sub_category || "").toLowerCase().includes(searchLower) ||
      report.category.toLowerCase().includes(searchLower);

    const matchesCategory = filterCategory === "all" || report.category === filterCategory;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort reports so that the newest reports appear at the top of the feed list
  const sortedReports = [...filteredReports].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full flex flex-col gap-3 flex-1 min-h-[300px] overflow-hidden text-left font-body-md text-on-surface">
      {/* Title Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-outline text-[20px]">filter_list</span>
          <h2 className="text-title-lg font-title-lg text-on-surface uppercase tracking-wider font-bold">
            Incident Feed
          </h2>
        </div>
        <span className="bg-surface-container text-on-surface text-label-md font-label-md px-2 py-0.5 rounded-full font-bold">
          {reports.length} Active
        </span>
      </div>

      {/* Search & Filters HUD */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3 flex-shrink-0 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute top-2.5 left-3 text-[18px] text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report details, locations..."
            className="w-full bg-transparent border border-outline rounded-lg py-2 pl-9 pr-4 text-body-sm text-on-surface placeholder-outline focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 text-label-md font-label-md">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 bg-transparent border border-outline rounded-lg py-1.5 px-2 text-on-surface-variant focus:border-secondary focus:outline-none focus:ring-0 text-xs"
          >
            <option value="all">All Sectors</option>
            <option value="road_hazard">Road Damage</option>
            <option value="water_grid">Water Grid</option>
            <option value="electrical_grid">Power Grid</option>
            <option value="waste_management">Waste & Sanitation</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 bg-transparent border border-outline rounded-lg py-1.5 px-2 text-on-surface-variant focus:border-secondary focus:outline-none focus:ring-0 text-xs"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
        {sortedReports.length === 0 ? (
          <div className="text-center p-8 text-outline text-body-sm bg-surface-container-lowest border border-outline-variant rounded-xl">
            No active reports match filter criteria.
          </div>
        ) : (
          sortedReports.map((report) => {
            const isSelected = report.id === selectedReportId;
            const isResolved = report.status === "resolved";
            const cost = report.engineering_data?.estimated_cost_inr;

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className={`bg-surface-container-lowest border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2.5 relative overflow-hidden flex-shrink-0 cursor-pointer ${
                  isSelected 
                    ? "border-secondary bg-surface-container-low translate-x-1" 
                    : "border-outline-variant hover:border-outline"
                } ${isResolved ? "opacity-75" : ""}`}
              >
                {/* Visual indicator bar on the left */}
                <div 
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    isResolved 
                      ? "bg-secondary" 
                      : report.severity >= 4 
                      ? "bg-error" 
                      : report.severity === 3 
                      ? "bg-tertiary-fixed-dim" 
                      : "bg-secondary"
                  }`} 
                />

                {/* Header: Category and Severity Badges */}
                <div className="flex items-center justify-between pl-1">
                  <div className="flex items-center gap-1.5 text-label-md font-label-md font-bold text-on-surface uppercase">
                    {getCategoryIcon(report.category)}
                    <span className="truncate max-w-[120px]">{getCategoryLabel(report.category)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {report.report_count > 1 && (
                      <span className="text-[10px] font-mono bg-surface-container border border-outline-variant px-1.5 py-0.5 rounded text-outline font-bold">
                        x{report.report_count} Reports
                      </span>
                    )}

                    {isResolved ? (
                      <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-label-md font-label-md font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> RESOLVED
                      </span>
                    ) : (
                      <span 
                        className={`text-label-md font-label-md font-medium flex items-center gap-1 ${
                          report.severity >= 4 
                            ? "text-error" 
                            : report.severity === 3 
                            ? "text-tertiary-fixed-dim" 
                            : "text-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">priority_high</span> SEVERITY {report.severity}/5
                      </span>
                    )}

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReport(report.id);
                        }}
                        className="text-outline hover:text-on-surface ml-1.5 p-0.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                        title="Deselect report"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategory, Title, Location AND Thumbnail */}
                <div className="pl-1 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-body-md font-body-md font-semibold text-on-surface">
                      {report.sub_category || "Uncategorized Infrastructure Issue"}
                    </h4>
                    <p className={`text-body-sm font-body-sm text-on-surface-variant mt-1 ${isSelected ? "" : "line-clamp-2"}`}>
                      {report.location_name}
                    </p>
                  </div>
                  {!isSelected && report.image_url && (
                    <div className="w-12 h-12 rounded overflow-hidden border border-outline-variant flex-shrink-0 bg-surface-container flex items-center justify-center">
                      {isVideoUrl(report.image_url) ? (
                        <span className="material-symbols-outlined text-outline">movie</span>
                      ) : (
                        <img 
                          src={report.image_url} 
                          alt={report.sub_category || "Hazard thumbnail"} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Details on Active Selected Card */}
                {isSelected && (
                  <>
                    {report.image_url && (
                      <div className="relative h-40 mt-1 rounded border border-outline-variant bg-surface-container flex items-center justify-center">
                        {isVideoUrl(report.image_url) ? (
                          <video
                            src={getMediaSource(report.image_url)}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={report.image_url}
                            alt={report.sub_category || "Hazard attachment"}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}

                    {report.engineering_data && (
                      <div className="mt-1 bg-surface-container border border-outline-variant/50 p-3 rounded-lg flex flex-col gap-2 font-mono-data text-mono-data">
                        <span className="text-secondary font-heading font-semibold text-label-md uppercase tracking-wider">
                          AI Civil Engineering Assessment:
                        </span>
                        <p className="text-on-surface-variant font-sans leading-relaxed text-body-sm">
                          {report.engineering_data.severity_justification}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-0.5 border-t border-outline-variant/30 pt-2 text-outline">
                          <div>
                            <span className="text-outline">Dimensions:</span>{" "}
                            <span className="text-on-surface font-semibold">{report.engineering_data.estimated_dimensions || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-outline">Est. Labor:</span>{" "}
                            <span className="text-on-surface font-semibold">{report.engineering_data.estimated_labor_hours || 0} hrs</span>
                          </div>
                        </div>
                        {report.engineering_data.required_materials && report.engineering_data.required_materials.length > 0 && (
                          <div className="mt-1 border-t border-outline-variant/30 pt-2">
                            <span className="text-label-md font-label-md text-outline uppercase tracking-wider block mb-1">Required Materials:</span>
                            <ul className="list-disc list-inside text-on-surface-variant space-y-0.5 text-xs">
                              {report.engineering_data.required_materials.map((mat: any, idx: number) => (
                                <li key={idx}>
                                  {mat.item} ({mat.quantity})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {report.engineering_data.hazard_mitigation_step && (
                          <div className="mt-1 bg-error-container border border-error/20 p-2 rounded text-error text-xs">
                            <span className="font-semibold uppercase text-[10px] block mb-0.5">Mitigation Action:</span>
                            {report.engineering_data.hazard_mitigation_step}
                          </div>
                        )}
                      </div>
                    )}

                    {(() => {
                      const relatedQuest = quests?.find(q => q.target_report_id === report.id && q.status === "active");
                      if (report.status !== "resolved" && relatedQuest && onGoToQuest) {
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onGoToQuest(report.id);
                            }}
                            className="w-full mt-2 py-2 bg-secondary text-on-secondary font-label-lg font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">explore</span>
                            View Active Quest in Sentinel Hub
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}

                {/* Footer specs: Cost tag, created time */}
                <div className="flex items-center justify-between text-mono-data font-mono-data pl-1 border-t border-outline-variant/20 pt-2 text-outline">
                  <span>
                    {new Date(report.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short"
                    })}
                  </span>
                  
                  {cost && (
                    <span className="font-semibold text-on-surface text-body-sm font-bold">
                      Est. ₹{cost.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {/* If resolved, show double check validation text summary */}
                {isResolved && report.resolution_verification && (
                  <div className="bg-secondary/5 border border-secondary/10 rounded p-2 text-xs text-secondary font-mono-data mt-1 flex items-start gap-1">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="line-clamp-1">{report.resolution_verification.justification}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
