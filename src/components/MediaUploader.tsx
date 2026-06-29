import React, { useState, useRef } from "react";

interface MediaUploaderProps {
  onUploadStart: () => void;
  onUploadSuccess: (payload: {
    file: File;
    description: string;
    latitude: number;
    longitude: number;
  }) => void;
  onUploadError: (error: string) => void;
  selectedCoords?: { latitude: number; longitude: number } | null;
  onCoordsChange?: (coords: { latitude: number; longitude: number } | null) => void;
  onViewOnMap?: () => void;
}

export function MediaUploader({ 
  onUploadStart, 
  onUploadSuccess, 
  onUploadError,
  selectedCoords = null,
  onCoordsChange,
  onViewOnMap
}: MediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedCoords prop down to local coords state (e.g. when clicked on map)
  React.useEffect(() => {
    if (selectedCoords) {
      setCoords(selectedCoords);
      setGeoStatus("success");
    } else if (coords && !selectedCoords) {
      setCoords(null);
      setGeoStatus("idle");
    }
  }, [selectedCoords]);

  // Trigger browser GPS capture
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      onUploadError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoords(newCoords);
        setGeoStatus("success");
        if (onCoordsChange) onCoordsChange(newCoords);
      },
      (error) => {
        console.warn("Standard geolocation failed, retrying with high accuracy options...", error);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setCoords(newCoords);
            setGeoStatus("success");
            if (onCoordsChange) onCoordsChange(newCoords);
          },
          (fallbackError) => {
            console.log("ℹ️ Geolocation permission denied or unavailable.", fallbackError);
            setGeoStatus("error");
            if (fallbackError.code === 1) {
              alert("Location Permission Denied: Please enable browser location permissions for this application to report the hazard location.");
            } else if (fallbackError.code === 2) {
              alert("Location Services (GPS) Disabled: Please turn on location/GPS settings on your device, then try again.");
            } else {
              alert("Locating feature failed: Location services are unavailable or request timed out.");
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      onUploadError("Invalid file type. Please upload an image or video.");
      return;
    }

    setSelectedFile(file);
    
    // Automatically trigger GPS lookup on file select
    if (geoStatus === "idle") {
      captureLocation();
    }

    if (file.type.startsWith("video/")) {
      setIsProcessingVideo(true);
      // Simulate frame extraction UI delay
      setTimeout(() => {
        setIsProcessingVideo(false);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onUploadError("Please select a photo or video report.");
      return;
    }
    if (!coords) {
      onUploadError("Obtaining location coordinates is required.");
      return;
    }

    onUploadStart();
    onUploadSuccess({
      file: selectedFile,
      description,
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setDescription("");
    setIsProcessingVideo(false);
    setCoords(null);
    setGeoStatus("idle");
    if (onCoordsChange) onCoordsChange(null);
  };

  const handleClearPin = () => {
    setCoords(null);
    setGeoStatus("idle");
    if (onCoordsChange) onCoordsChange(null);
  };


  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)] p-6 flex flex-col gap-4 flex-1 overflow-y-auto scrollbar-thin text-on-surface text-left"
    >
      <h3 className="text-xl font-semibold font-heading text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-3">
        <span className="material-symbols-outlined text-secondary">add_a_photo</span>
        Report Infrastructure Hazard
      </h3>

      {/* Drag & Drop Area */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? "border-secondary bg-secondary/5" 
              : "border-outline hover:border-secondary hover:bg-surface-container-low"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-outline">upload_file</span>
          </div>
          <div>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Drag & drop photo or video, or <span className="text-secondary font-semibold">browse</span>
            </p>
            <p className="text-label-md font-label-md text-outline mt-1 font-mono">PNG, JPG, MP4, MOV (max 20MB)</p>
          </div>
          <div className="flex items-center gap-3 mt-2 w-full max-w-[280px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-xs font-semibold font-heading transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              Use Camera
            </button>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="relative rounded-xl border border-outline-variant bg-surface-container-low p-3 flex flex-col gap-3">
          <div className="relative h-44 rounded-lg overflow-hidden bg-background flex items-center justify-center border border-outline-variant/40">
            {selectedFile.type.startsWith("video/") ? (
              <div className="flex flex-col items-center justify-center gap-2 text-outline">
                {isProcessingVideo ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-secondary text-2xl">sync</span>
                    <p className="text-xs font-medium text-on-surface-variant">Extracting video keyframes...</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-secondary text-3xl">movie</span>
                    <p className="text-xs font-medium text-on-surface-variant">Video uploaded: {selectedFile.name}</p>
                    <p className="text-[10px] text-outline">3 Keyframes extracted for vision comparison</p>
                  </>
                )}
              </div>
            ) : (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            )}
            
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-inverse-surface/85 hover:bg-inverse-surface text-inverse-on-surface rounded-full p-1.5 transition-colors text-xs font-heading cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs px-1 text-outline">
            <span className="truncate max-w-[150px] font-mono">{selectedFile.name}</span>
            <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
        </div>
      )}

      {/* Geolocation Tagging HUD */}
      <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-on-surface">
            <span className="material-symbols-outlined text-secondary">location_on</span>
            <div className="text-left">
              <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Current Location</p>
              <p className="text-mono-data font-mono-data font-medium">
                {geoStatus === "fetching" ? (
                  <span className="animate-pulse">Locating GPS...</span>
                ) : coords ? (
                  `${coords.latitude.toFixed(4)}° N, ${coords.longitude.toFixed(4)}° E`
                ) : (
                  "Location Coordinates Pending"
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {geoStatus === "success" && coords ? (
              <>
                {onViewOnMap && (
                  <button
                    type="button"
                    onClick={onViewOnMap}
                    className="px-3 py-1.5 text-label-md font-label-md rounded border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 transition-colors flex items-center gap-1 cursor-pointer bg-white/50"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span> View Map
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="px-3 py-1.5 text-label-md font-label-md rounded border border-error text-error hover:bg-error/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span> Remove
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={geoStatus === "fetching"}
                onClick={captureLocation}
                className="px-3 py-1.5 text-label-md font-label-md rounded border border-secondary text-secondary hover:bg-secondary/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span> Locate Me
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description Inputs */}
      <div className="flex flex-col gap-1.5">
        <label className="block text-label-md font-label-md text-on-surface-variant">Describe the Issue</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter details (e.g. potholes, leakage, structural fault, debris accumulation). Regional languages accepted."
          className="block w-full rounded-lg border border-outline bg-transparent px-4 py-3 text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none sm:text-body-md min-h-[70px] resize-none"
        />
      </div>

      {/* Submit Action */}
      <button
        type="submit"
        disabled={!selectedFile || isProcessingVideo || geoStatus === "fetching"}
        className={`w-full bg-secondary text-on-secondary rounded-lg py-3 text-label-md font-label-md font-bold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2 ${
          (!selectedFile || isProcessingVideo || geoStatus === "fetching") 
            ? "opacity-50 cursor-not-allowed transform-none" 
            : "cursor-pointer"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">send</span>
        Submit Report
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
      />
    </form>
  );
}
