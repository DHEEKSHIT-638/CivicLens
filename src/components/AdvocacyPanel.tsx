import { useState } from "react";

interface AdvocacyKit {
  official_letter_markdown: string;
  petition_title: string;
  petition_body_markdown: string;
  rti_notice_markdown: string;
  social_media_campaigns: {
    twitter_x_post: string;
    whatsapp_alert: string;
  };
}

interface AdvocacyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  advocacyKit: AdvocacyKit | null;
  subCategory: string;
}

export function AdvocacyPanel({ isOpen, onClose, advocacyKit, subCategory }: AdvocacyPanelProps) {
  const [activeTab, setActiveTab] = useState<"letter" | "petition" | "rti" | "social">("letter");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !advocacyKit) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
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
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-out drawer */}
      <div className="relative w-full max-w-xl bg-surface-container-lowest border-l border-outline-variant p-6 shadow-soft-natural h-full flex flex-col gap-5 z-10 transition-transform duration-500 animate-slide-in text-on-surface text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            <h3 className="text-title-lg font-title-lg text-on-surface font-heading font-semibold">
              Advocacy & RTI Kit
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-variant rounded-lg text-outline hover:text-on-surface cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Selected Hazard info banner */}
        <div className="bg-surface-container border border-outline-variant p-3 rounded-lg text-xs text-on-surface-variant">
          Generated Action Kit for: <strong className="text-on-surface font-semibold">{subCategory}</strong>
        </div>

        {/* TABS Toggles */}
        <div className="flex border-b border-outline-variant/30 text-label-md font-label-md">
          <button
            onClick={() => setActiveTab("letter")}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "letter" ? "border-b-2 border-secondary text-secondary font-bold" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            Grievance
          </button>
          
          <button
            onClick={() => setActiveTab("petition")}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "petition" ? "border-b-2 border-secondary text-secondary font-bold" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            Petition
          </button>

          <button
            onClick={() => setActiveTab("rti")}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "rti" ? "border-b-2 border-secondary text-secondary font-bold" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            RTI Notice
          </button>

          <button
            onClick={() => setActiveTab("social")}
            className={`flex-1 pb-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "social" ? "border-b-2 border-secondary text-secondary font-bold" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Socials
          </button>
        </div>

        {/* Document Content Box */}
        <div className="flex-1 overflow-y-auto bg-surface-container border border-outline-variant rounded-lg p-4 font-mono-data text-body-sm text-on-surface-variant leading-relaxed scrollbar-thin select-text">
          <div className="whitespace-pre-wrap font-sans text-xs">
            {getActiveText().split("\n").map((line, idx) => {
              if (line.startsWith("###")) {
                return <h4 key={idx} className="text-body-md font-semibold font-heading text-on-surface mt-4 mb-2 first:mt-0">{line.replace("###", "")}</h4>;
              }
              if (line.startsWith("**")) {
                return <p key={idx} className="font-semibold text-on-surface mt-2">{line.replace(/\*\*/g, "")}</p>;
              }
              if (line.startsWith("-")) {
                return <li key={idx} className="ml-4 list-disc mt-1">{line.replace("-", "")}</li>;
              }
              return <p key={idx} className="mt-1.5">{line}</p>;
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 mt-auto">
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
            onClick={() => alert("Advocacy campaign generated! Petition page launched on community server (Simulated).")}
            className="px-5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface-variant hover:text-on-surface cursor-pointer hover:bg-surface-variant/20 flex items-center gap-1.5 font-heading font-semibold"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">publish</span>
            Deploy Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
