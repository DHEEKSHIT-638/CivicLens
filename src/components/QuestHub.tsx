import React, { useState, useRef } from "react";
import { verifyResolutionAndSave } from "../services/gemini";
import { updateQuest, updateUser } from "../firebase";

interface Quest {
  id: string;
  title: string;
  type: string;
  target_report_id: string;
  xp_reward: number;
  karma_reward: number;
  status: string;
  joined_users: string[];
}

interface UserProfile {
  uid: string;
  display_name: string;
  level: number;
  xp: number;
  karma_points: number;
  completed_quests: string[];
}

interface QuestHubProps {
  quests: Quest[];
  user: UserProfile | null;
  reports: any[];
  showToast: (message: string, type: "success" | "error") => void;
  allUsers: any[];
  activeQuestFilter?: string | null;
  onClearQuestFilter?: () => void;
}

export function QuestHub({ 
  quests, 
  user, 
  reports, 
  showToast, 
  allUsers,
  activeQuestFilter = null,
  onClearQuestFilter
}: QuestHubProps) {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState<any | null>(null);
  const [questTypeFilter, setQuestTypeFilter] = useState<"all" | "verify" | "coop">("all");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderBadgeIcon = (key: string, unlocked: boolean) => {
    const iconClass = unlocked ? "material-symbols-outlined text-[24px] text-secondary" : "material-symbols-outlined text-[24px] text-outline";
    switch (key) {
      case "scout":
        return <span className={iconClass}>explore</span>;
      case "guardian":
        return <span className={iconClass} style={unlocked ? { fontVariationSettings: "'FILL' 1" } : {}}>verified</span>;
      case "champion":
        return <span className={iconClass}>emoji_events</span>;
      case "advocate":
        return <span className={iconClass}>gavel</span>;
      default:
        return <span className={iconClass}>shield</span>;
    }
  };

  if (!user) return null;

  // Level thresholds (e.g. Level 3 is 400-600 XP)
  const getLevelThreshold = (level: number) => level * 200;
  const currentThreshold = getLevelThreshold(user.level);
  const prevThreshold = getLevelThreshold(user.level - 1);
  const levelProgress = ((user.xp - prevThreshold) / (currentThreshold - prevThreshold)) * 100;

  // Handles joining cleanup co-op quests
  const handleJoinQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    const joined = [...(quest.joined_users || [])];
    if (joined.includes(user.uid)) return; // Already joined
    
    joined.push(user.uid);
    await updateQuest(questId, { joined_users: joined });
    showToast("Successfully joined the co-op cleanup quest!", "success");
  };

  // Handles leaving co-op quests
  const handleLeaveQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    
    const joined = [...(quest.joined_users || [])].filter(uid => uid !== user.uid);
    await updateQuest(questId, { joined_users: joined });
    showToast("Left co-op quest successfully.", "success");
  };

  // Handles triggering verification upload
  const triggerVerifyUpload = (questId: string) => {
    setActiveQuestId(questId);
    fileInputRef.current?.click();
  };

  // Process resolution image comparison upload
  const handleVerifyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeQuestId) return;
    const file = e.target.files[0];
    
    const quest = quests.find(q => q.id === activeQuestId);
    if (!quest) return;
    
    const report = reports.find(r => r.id === quest.target_report_id);
    if (!report) return;

    setIsVerifying(true);
    try {
      const beforeImageUrl = report.image_url || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=300&q=80"; // fallback
      
      const verification = await verifyResolutionAndSave(report.id, beforeImageUrl, file, null);
      
      if (verification.verification_status === "confirmed_fixed") {
        // Complete the quest
        await updateQuest(quest.id, { status: "completed" });

        // Auto-complete any other active quests for this report
        const otherActiveQuests = quests.filter(q => q.target_report_id === report.id && q.id !== quest.id && q.status === "active");
        for (const oq of otherActiveQuests) {
          await updateQuest(oq.id, { status: "completed" });
        }
        
        // Grant user XP & Karma
        const newXp = user.xp + quest.xp_reward;
        const newKarma = user.karma_points + quest.karma_reward;
        const completed = [...(user.completed_quests || []), quest.id];
        
        let nextLevel = user.level;
        if (newXp >= getLevelThreshold(user.level)) {
          nextLevel += 1;
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 4000);
        }

        await updateUser({
          xp: newXp,
          karma_points: newKarma,
          level: nextLevel,
          completed_quests: completed
        });
        showToast(`Quest completed! Unlocked +${quest.xp_reward} XP & +${quest.karma_reward} Karma!`, "success");
      } else {
        showToast(`Verification failed: ${verification.justification}`, "error");
      }
    } catch (error) {
      console.error("Resolution verification failed:", error);
    } finally {
      setIsVerifying(false);
      setActiveQuestId(null);
    }
  };

  // Available badges configuration with nationalized scope
  const badges = [
    { name: "Sentinel Scout", desc: "Report 1st infrastructure hazard", key: "scout", unlocked: user.completed_quests.length >= 0 },
    { name: "Eco Guardian", desc: "Verify 1 waste cleanup quest", key: "guardian", unlocked: user.completed_quests.length > 0 },
    { name: "Sector Champion", desc: "Reach 500+ XP in National Infrastructure", key: "champion", unlocked: user.xp >= 500 },
    { name: "Legal Advocate", desc: "Generate a formal petition request", key: "advocate", unlocked: user.level >= 3 }
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full h-auto lg:min-h-0 text-left lg:overflow-y-auto lg:overflow-hidden font-body-md text-on-surface pb-20 lg:pb-0">
      {/* Hidden File Input for Verification upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleVerifyFileChange}
        className="hidden"
      />

      {/* Left Column: User Stats Card */}
      <div className="w-full lg:col-span-3 flex flex-col gap-4 lg:min-h-0 flex-shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-sm">
          {/* Profile metadata */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <div>
              <h4 className="font-semibold text-on-surface text-body-md font-heading">{user.display_name === "Civic Hero Vizag" ? "Civic Hero" : user.display_name}</h4>
              <span className="text-label-md font-label-md bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded inline-block mt-0.5 font-bold">
                Level {user.level} Sentinel
              </span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex flex-col gap-1.5 text-label-md mt-2">
            <div className="flex items-center justify-between text-on-surface-variant font-mono">
              <span>XP Progress</span>
              <span>{user.xp} / {currentThreshold} XP</span>
            </div>
            <div className="w-full h-2 bg-surface-container border border-outline-variant/60 rounded-full overflow-hidden p-[1px]">
              <div 
                style={{ width: `${levelProgress}%` }}
                className="h-full bg-secondary rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Karma points metric */}
          <div className="flex items-center justify-between bg-surface-container border border-outline-variant/50 p-3 rounded-lg text-body-sm font-bold mt-1">
            <span className="text-on-surface-variant">Karma Points</span>
            <span className="text-secondary font-bold flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[16px]">emoji_events</span>
              {user.karma_points} KP
            </span>
          </div>
        </div>
      </div>

      {/* Middle Column: Quests list HUD (scrollable) */}
      <div className="lg:col-span-6 flex flex-col gap-3 lg:min-h-0 lg:overflow-hidden h-auto overflow-visible">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-3.5 lg:h-full h-auto lg:min-h-0 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-2 flex-shrink-0 border-b border-outline-variant/30 pb-3">
            <h4 className="font-semibold text-on-surface text-title-lg font-heading flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-secondary">explore</span>
              Active Quests
            </h4>
            
            {/* Quest Type Filters */}
            <div className="flex gap-1 bg-surface-container border border-outline-variant p-1 rounded-xl text-label-md font-bold w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => setQuestTypeFilter("all")}
                className={`flex-1 sm:flex-none sm:px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer font-bold ${
                  questTypeFilter === "all"
                    ? "bg-secondary text-on-secondary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setQuestTypeFilter("verify")}
                className={`flex-1 sm:flex-none sm:px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer font-bold ${
                  questTypeFilter === "verify"
                    ? "bg-secondary text-on-secondary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Verify
              </button>
              <button
                onClick={() => setQuestTypeFilter("coop")}
                className={`flex-1 sm:flex-none sm:px-3 py-1.5 rounded-lg transition-all text-center cursor-pointer font-bold ${
                  questTypeFilter === "coop"
                    ? "bg-secondary text-on-secondary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Co-op
              </button>
            </div>
          </div>

          {activeQuestFilter && (
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-2.5 flex items-center justify-between text-xs text-secondary font-mono flex-shrink-0">
              <span>Showing quest related to selected hazard</span>
              <button
                onClick={onClearQuestFilter}
                className="px-2 py-0.5 bg-secondary text-on-secondary rounded font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer text-[10px]"
              >
                Show All
              </button>
            </div>
          )}

          <div className="lg:flex-1 lg:overflow-y-auto overflow-visible pr-1 flex flex-col gap-3 scrollbar-thin">
            {(() => {
              const filteredActiveQuests = quests
                .filter(q => q.status === "active")
                .filter(q => {
                  if (activeQuestFilter) return q.id === activeQuestFilter;
                  if (questTypeFilter === "all") return true;
                  return q.type === questTypeFilter;
                });

              if (filteredActiveQuests.length === 0) {
                return (
                  <div className="text-center py-12 text-outline text-body-sm font-mono">
                    {activeQuestFilter 
                      ? "Quest not found or already completed." 
                      : `No active ${questTypeFilter === "all" ? "" : questTypeFilter} quests in this sector.`}
                  </div>
                );
              }

              return filteredActiveQuests.map((quest) => {
                  const isVerify = quest.type === "verify";
                  const userJoined = quest.joined_users?.includes(user.uid);

                  return (
                    <div
                      key={quest.id}
                      className="bg-surface-container-low border border-outline-variant/60 p-4 rounded-lg flex flex-col gap-3 transition-all hover:border-outline hover:bg-surface-container shadow-sm flex-shrink-0"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-outline font-semibold uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">{isVerify ? "person" : "group"}</span>
                              {quest.type} quest
                            </span>
                            {userJoined && (
                              <span className="text-[9px] font-mono bg-secondary/10 border border-secondary/20 text-secondary px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                Joined Co-op
                              </span>
                            )}
                          </div>
                          <h5 className="font-semibold text-on-surface text-body-md font-heading mt-0.5 leading-snug">
                            {quest.title}
                          </h5>
                          {(() => {
                            const targetReport = reports?.find(r => r.id === quest.target_report_id);
                            return targetReport ? (
                              <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-1.5 font-mono">
                                <span className="material-symbols-outlined text-[14px] text-secondary">location_on</span>
                                <span>{targetReport.location_name}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        
                        {/* Rewards Tags */}
                        <div className="text-right flex-shrink-0 text-[10px] font-mono text-on-surface font-bold">
                          <div className="text-secondary font-medium">+{quest.xp_reward} XP</div>
                          <div className="text-secondary font-medium">+{quest.karma_reward} KP</div>
                        </div>
                      </div>

                      {/* Quest actions */}
                      {isVerify ? (
                        <button
                          onClick={() => triggerVerifyUpload(quest.id)}
                          disabled={isVerifying && activeQuestId === quest.id}
                          className="w-full text-center py-2 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isVerifying && activeQuestId === quest.id ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">upload_file</span>
                              Upload Photo Fix
                            </>
                          )}
                        </button>
                      ) : (
                        /* Co-op Quest check-in actions */
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (userJoined) {
                                  handleLeaveQuest(quest.id);
                                } else {
                                  handleJoinQuest(quest.id);
                                }
                              }}
                              className={`flex-1 text-center py-2 px-3 rounded text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                                userJoined
                                  ? "border border-error text-error hover:bg-error/10 bg-transparent"
                                  : "bg-secondary text-on-secondary hover:opacity-90"
                              }`}
                            >
                              {userJoined ? "Leave Co-op" : "Join Cleanup Raid"}
                            </button>
                            <span className="text-[10px] font-mono text-outline flex-shrink-0">
                              {quest.joined_users?.length || 0} RSVPs
                            </span>
                          </div>

                          {quest.joined_users && quest.joined_users.length > 0 && (
                            <div className="flex flex-col gap-1 border-t border-outline-variant/30 pt-2">
                              <span className="text-[9px] font-mono text-outline uppercase tracking-wider">Joined Sentinels:</span>
                              <div className="flex flex-wrap gap-1">
                                {quest.joined_users.map((uid) => {
                                  const isSelf = uid === user.uid;
                                  const foundUser = allUsers?.find(u => u.uid === uid || u.id === uid);
                                  const name = isSelf ? "You" : (foundUser ? (foundUser.display_name === "Civic Hero Vizag" ? "Civic Hero" : foundUser.display_name) : "Citizen Sentinel");
                                  const level = foundUser ? foundUser.level : 1;
                                  return (
                                    <span 
                                      key={uid}
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                                        isSelf 
                                          ? "bg-secondary/10 border border-secondary/20 text-secondary" 
                                          : "bg-surface-container border border-outline-variant text-on-surface-variant"
                                      }`}
                                    >
                                      <span className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
                                      {name} (Lvl {level})
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      </div>

      {/* Right Column: Badges Shelf HUD */}
      <div className="w-full lg:col-span-3 flex flex-col gap-4 lg:min-h-0 flex-shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-3.5 shadow-sm">
          <h5 className="font-semibold text-on-surface text-title-lg font-heading flex items-center gap-1.5 uppercase tracking-wider border-b border-outline-variant/30 pb-3">
            <span className="material-symbols-outlined text-secondary">workspace_premium</span>
            Earned Badges
          </h5>
          <div className="grid grid-cols-4 gap-2">
            {badges.map((badge, idx) => (
              <div 
                key={idx}
                onMouseEnter={() => setHoveredBadge(badge)}
                onMouseLeave={() => setHoveredBadge(null)}
                className={`aspect-square rounded-lg bg-surface-container border flex items-center justify-center transition-all duration-300 relative group cursor-help ${
                  badge.unlocked 
                    ? "border-secondary/30 text-secondary opacity-100 shadow-sm" 
                    : "border-outline-variant/40 text-outline opacity-30"
                }`}
              >
                {renderBadgeIcon(badge.key, badge.unlocked)}
              </div>
            ))}
          </div>
          
          {/* Achievements Description Shelf */}
          <div className="min-h-[50px] bg-surface-container border border-outline-variant/50 rounded-lg p-2.5 flex items-center justify-center text-[10px] text-on-surface-variant font-mono text-center select-none leading-relaxed">
            {hoveredBadge ? (
              <div>
                <span className="font-semibold text-secondary font-heading text-xs mr-1 block mb-0.5">{hoveredBadge.name}</span>
                <span>{hoveredBadge.desc}</span>
              </div>
            ) : (
              <span className="text-outline">Hover badges to inspect achievements</span>
            )}
          </div>
        </div>
      </div>

      {/* Level-Up Modal Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-secondary p-8 rounded-xl max-w-sm text-center flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
            <span className="material-symbols-outlined text-secondary text-5xl animate-bounce">celebration</span>
            <h2 className="text-3xl font-extrabold font-heading text-on-surface">LEVEL UP!</h2>
            <p className="text-body-md text-on-surface-variant font-heading">
              Congratulations! You reached **Level {user.level} Sentinel**.
            </p>
            <p className="text-xs text-outline mt-1 font-mono">
              +100 XP Bonus, Unlocked new regional verification quests.
            </p>
            <button 
              onClick={() => setShowLevelUp(false)}
              className="w-full bg-secondary text-on-secondary rounded-lg py-2.5 text-label-md font-label-md font-bold hover:opacity-90 transition-opacity mt-2"
            >
              Continue Journey
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
