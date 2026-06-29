import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Report {
  id: string;
  coordinates: { latitude: number; longitude: number };
  category: string;
  sub_category?: string;
  severity: number;
  status: string;
  location_name?: string;
}

interface Sector {
  id: string;
  name: string;
  health_score: number;
  coordinates: { latitude: number; longitude: number }; // Center coordinate
}

interface DigitalTwinMapProps {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  onMapClick: (lat: number, lon: number) => void;
  draftCoords?: { latitude: number; longitude: number } | null;
}

// Define tile styles outside the component to avoid unnecessary re-creation
const darkStyle = {
  version: 8,
  sources: {
    "cartodb-dark": {
      type: "raster",
      tiles: [
        "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO"
    }
  },
  layers: [
    {
      id: "cartodb-dark-layer",
      type: "raster",
      source: "cartodb-dark",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

const satelliteStyle = {
  version: 8,
  sources: {
    "satellite-tiles": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: "Source: Esri, Maxar, Earthstar Geographics"
    }
  },
  layers: [
    {
      id: "satellite-layer",
      type: "raster",
      source: "satellite-tiles",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

const osmStyle = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO"
    }
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

// Helper function for instant offline/coordinate geocoding
function getLocalLocationName(lat: number, lon: number): string {
  // If in India
  if (lat > 6.0 && lat < 37.0 && lon > 68.0 && lon < 97.0) {
    if (lat > 17.5 && lat < 17.9 && lon > 83.2 && lon < 83.5) {
      return "Visakhapatnam, Andhra Pradesh";
    }
    if (lat > 17.2 && lat < 17.6 && lon > 78.2 && lon < 78.6) {
      return "Hyderabad, Telangana";
    }
    if (lat > 28.4 && lat < 28.8 && lon > 76.9 && lon < 77.4) {
      return "New Delhi, Delhi NCR";
    }
    if (lat > 18.8 && lat < 19.3 && lon > 72.7 && lon < 73.1) {
      return "Mumbai, Maharashtra";
    }
    if (lat > 12.8 && lat < 13.1 && lon > 77.4 && lon < 77.8) {
      return "Bengaluru, Karnataka";
    }
    if (lat > 22.4 && lat < 22.7 && lon > 88.2 && lon < 88.5) {
      return "Kolkata, West Bengal";
    }
    if (lat > 12.9 && lat < 13.2 && lon > 80.1 && lon < 80.4) {
      return "Chennai, Tamil Nadu";
    }
    if (lat > 22.0) {
      return "North India Grid";
    } else {
      return "South India Grid";
    }
  }

  // USA / North America
  if (lat > 24.0 && lat < 49.0 && lon > -125.0 && lon < -66.0) {
    if (lat > 40.0 && lat < 41.5 && lon > -74.5 && lon < -73.5) {
      return "New York, USA";
    }
    if (lat > 33.5 && lat < 34.5 && lon > -118.6 && lon < -117.8) {
      return "Los Angeles, California";
    }
    return "United States Grid";
  }

  // Europe
  if (lat > 35.0 && lat < 70.0 && lon > -10.0 && lon < 40.0) {
    if (lat > 51.2 && lat < 51.7 && lon > -0.5 && lon < 0.3) {
      return "London, United Kingdom";
    }
    if (lat > 48.6 && lat < 49.0 && lon > 2.1 && lon < 2.5) {
      return "Paris, France";
    }
    return "European Union Grid";
  }

  // Japan / East Asia
  if (lat > 30.0 && lat < 45.0 && lon > 129.0 && lon < 146.0) {
    if (lat > 35.5 && lat < 36.0 && lon > 139.5 && lon < 140.2) {
      return "Tokyo, Japan";
    }
    return "Japan Network";
  }

  // Australia
  if (lat > -44.0 && lat < -10.0 && lon > 112.0 && lon < 154.0) {
    if (lat > -34.0 && lat < -33.5 && lon > 151.0 && lon < 151.5) {
      return "Sydney, Australia";
    }
    return "Australia Network";
  }

  return "Global Network Connection";
}

export function DigitalTwinMap({ 
  reports, 
  selectedReportId, 
  onSelectReport, 
  onMapClick,
  draftCoords = null
}: DigitalTwinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const showUserLocationMarker = (lat: number, lon: number, map: maplibregl.Map) => {
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    const el = document.createElement("div");
    el.className = "user-gps-marker z-30";
    el.innerHTML = `
      <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
        <div class="absolute inset-0 rounded-full bg-secondary opacity-30 animate-ping" style="animation-duration: 2s;"></div>
        <div class="absolute w-6 h-6 rounded-full bg-secondary opacity-40 border border-white animate-pulse"></div>
        <div class="w-4 h-4 rounded-full bg-secondary border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] z-10"></div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lon, lat])
      .addTo(map);

    userLocationMarkerRef.current = marker;
  };

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const isFirstStyleLoad = useRef(true);

  const [mapError, setMapError] = useState(false);
  const [heatmapView, setHeatmapView] = useState(false);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "osm">("osm");
  const [gpsAlert, setGpsAlert] = useState<{ show: boolean; title: string; message: string; type: "permission" | "disabled" } | null>(null);

  // Poll live GPS permission and services availability if alert is showing
  useEffect(() => {
    if (!gpsAlert) return;
    
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Geolocation succeeded! This means they enabled GPS/location permission!
          clearInterval(interval);
          const { latitude, longitude } = pos.coords;
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 13.5,
              pitch: 45,
              bearing: -17.6,
              essential: true,
              duration: 2500
            });
            showUserLocationMarker(latitude, longitude, mapRef.current);
          }
          setGpsAlert(null); // Dismiss alert popup immediately!
        },
        () => {
          // Still failed, wait for next poll interval
          console.log("Auto-polling location services status...");
        },
        { enableHighAccuracy: false, timeout: 2000 }
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [gpsAlert]);

  // Default Center coordinates for simulated vector map
  // Lat range: [17.700, 17.790], Lon range: [83.300, 83.390] (Used as high-density testbed)
  const [hoverCoords, setHoverCoords] = useState({ lat: 17.7120, lon: 83.3210 });
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>({ latitude: 20.5937, longitude: 78.9629 });
  const [resolvedLocationName, setResolvedLocationName] = useState<string>("");
  const [resolvedHealthScore, setResolvedHealthScore] = useState<number | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(4.5);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGpsAlert({
        show: true,
        title: "Geolocation Unsupported",
        message: "Geolocation features are not supported by your browser.",
        type: "permission"
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 13.5,
            pitch: 45,
            bearing: -17.6,
            essential: true,
            duration: 2500
          });
          showUserLocationMarker(latitude, longitude, mapRef.current);
        }
        setGpsAlert(null); // Dismiss alert popup if successful
      },
      (error) => {
        if (error.code === 1) {
          setGpsAlert({
            show: true,
            title: "Location Permission Blocked",
            message: "Location permissions are blocked for this site. Please enable browser location permissions for CivicLens to center the map on your position.",
            type: "permission"
          });
        } else if (error.code === 2) {
          setGpsAlert({
            show: true,
            title: "Location Services Disabled",
            message: "CivicLens cannot fetch your live location because your device's GPS/location settings are turned off. Please turn them on in your system settings.",
            type: "disabled"
          });
        } else {
          setGpsAlert({
            show: true,
            title: "Location Unavailable",
            message: "CivicLens was unable to resolve your coordinates. Please verify your device's GPS location/network settings are turned on.",
            type: "disabled"
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 1. Initialize MapLibre Map (runs once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: osmStyle as any,
        center: [78.9629, 20.5937], // India center coordinates
        zoom: 4.5, // See whole India map as default
        pitch: 0, // 2D layout initially
        bearing: 0,
        attributionControl: false // Disable default bottom-right overlay
      });

      // Center map dynamically on user's real location if geolocation is permitted
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 13.5,
              pitch: 45,
              bearing: -17.6,
              essential: true,
              duration: 2500
            });
            showUserLocationMarker(latitude, longitude, map);
          },
          (err) => {
            console.log("Map startup geolocate query:", err);
            if (err.code === 2) {
              setGpsAlert({
                show: true,
                title: "Location Services Disabled",
                message: "CivicLens cannot fetch your live location because your device's GPS/location settings are turned off. Please turn them on in your system settings.",
                type: "disabled"
              });
            } else if (err.code === 1) {
              setGpsAlert({
                show: true,
                title: "Location Permission Blocked",
                message: "Location permissions are blocked for this site. Please enable browser location permissions for CivicLens to center the map on your position.",
                type: "permission"
              });
            } else {
              setGpsAlert({
                show: true,
                title: "Location Unavailable",
                message: "CivicLens was unable to resolve your coordinates. Please verify your device's GPS location/network settings are turned on.",
                type: "disabled"
              });
            }
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }


      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Update mapCenter state dynamically as map centers or moves
      map.on("move", () => {
        const center = map.getCenter();
        const lat = center.lat;
        const lon = center.lng;
        const zoom = map.getZoom();

        setMapCenter({ latitude: lat, longitude: lon });
        setCurrentZoom(zoom);

        if (zoom <= 5) {
          setResolvedLocationName("National Network (India)");
          setResolvedHealthScore(94);
        } else {
          const instantName = getLocalLocationName(lat, lon);
          setResolvedLocationName(instantName);

          let hash = 0;
          for (let i = 0; i < instantName.length; i++) {
            hash = instantName.charCodeAt(i) + ((hash << 5) - hash);
          }
          setResolvedHealthScore(88 + (Math.abs(hash) % 10));
        }
      });

      // Listen for map movement stops to reverse geocode city/state/country name
      map.on("moveend", async () => {
        const center = map.getCenter();
        const lat = center.lat;
        const lon = center.lng;
        const zoom = map.getZoom();

        if (zoom <= 5) {
          setResolvedLocationName("National Network (India)");
          setResolvedHealthScore(94);
          return;
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "CivicLens/1.0"
            }
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.municipality || addr.county || "";
            const state = addr.state || addr.region || "";
            const country = addr.country || "";

            let displayName = "";
            if (city && state) {
              displayName = `${city}, ${state}`;
            } else if (city) {
              displayName = city;
            } else if (state && country) {
              displayName = `${state}, ${country}`;
            } else {
              displayName = country || "Global Network";
            }

            setResolvedLocationName(displayName);

            // Generate a stable health score (88-97) based on location name hash
            let hash = 0;
            const str = displayName;
            for (let i = 0; i < str.length; i++) {
              hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const score = 88 + (Math.abs(hash) % 10);
            setResolvedHealthScore(score);
          }
        } catch (err) {
          console.log("Reverse geocoding query error:", err);
        }
      });

      // Trigger initial center update
      const initialCenter = map.getCenter();
      const initLat = initialCenter.lat;
      const initLon = initialCenter.lng;
      const initZoom = map.getZoom();
      setMapCenter({ latitude: initLat, longitude: initLon });
      setCurrentZoom(initZoom);
      if (initZoom <= 5) {
        setResolvedLocationName("National Network (India)");
        setResolvedHealthScore(94);
      } else {
        const instantName = getLocalLocationName(initLat, initLon);
        setResolvedLocationName(instantName);
        let hash = 0;
        for (let i = 0; i < instantName.length; i++) {
          hash = instantName.charCodeAt(i) + ((hash << 5) - hash);
        }
        setResolvedHealthScore(88 + (Math.abs(hash) % 10));
      }

      // Listen for map clicks to create report
      map.on("click", (e) => {
        onMapClickRef.current(e.lngLat.lat, e.lngLat.lng);
      });

      mapRef.current = map;

      return () => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.remove();
          userLocationMarkerRef.current = null;
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("MapLibre failed to load:", err);
      setMapError(true);
    }
  }, []);

  // Trigger map resize on load/mount/updates to ensure it fills its flexbox container
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    map.resize();
    
    const timers = [
      setTimeout(() => map.resize(), 50),
      setTimeout(() => map.resize(), 200),
      setTimeout(() => map.resize(), 500)
    ];

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [reports, selectedReportId]);

  // 2. Handle map style swap on the fly
  useEffect(() => {
    if (isFirstStyleLoad.current) {
      isFirstStyleLoad.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    try {
      if (mapStyle === "satellite") {
        map.setStyle(satelliteStyle as any);
      } else if (mapStyle === "osm") {
        map.setStyle(osmStyle as any);
      } else {
        map.setStyle(darkStyle as any);
      }
    } catch (err) {
      console.error("Failed to update map style:", err);
    }
  }, [mapStyle]);

  // 3. Handle marker updates (updates existing markers on the map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      const el = document.createElement("div");
      el.className = `marker-pulse marker-${report.status === 'resolved' ? 'resolved' : report.category}`;
      
      if (report.id === selectedReportId) {
        el.classList.add("marker-active-selected");
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectReport(report.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.coordinates.longitude, report.coordinates.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add draft marker pin if active
    if (draftCoords) {
      const el = document.createElement("div");
      el.className = "marker-pulse marker-draft";
      el.style.backgroundColor = "#FF9F0A"; // Warm amber
      el.style.border = "2px dashed #FFFFFF";
      el.style.transform = "scale(1.3)";
      el.style.boxShadow = "0 0 10px rgba(255, 159, 10, 0.6)";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([draftCoords.longitude, draftCoords.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [reports, selectedReportId, draftCoords]);

  // 4. Smooth camera jump ("Fly To") on Selected Report focus
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedReportId) return;

    const report = reports.find(r => r.id === selectedReportId);
    if (report) {
      map.flyTo({
        center: [report.coordinates.longitude, report.coordinates.latitude],
        zoom: Math.max(map.getZoom(), 15.5),
        pitch: 45,
        essential: true,
        duration: 1200
      });
    }
  }, [selectedReportId, reports]);

  // 5. Smooth camera focus on draft coordinate pin additions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !draftCoords) return;

    map.flyTo({
      center: [draftCoords.longitude, draftCoords.latitude],
      zoom: Math.max(map.getZoom(), 15.5),
      essential: true,
      duration: 1200
    });
  }, [draftCoords]);

  // 6. Center SVG fallback map on selected report or draft coordinates changes
  useEffect(() => {
    if (!mapError) return;
    
    if (selectedReportId) {
      const report = reports.find(r => r.id === selectedReportId);
      if (report) {
        const scaleX = 8000;
        const scaleY = -8000;
        setMapPan({
          x: - (report.coordinates.longitude - 83.3210) * scaleX,
          y: - (report.coordinates.latitude - 17.7120) * scaleY
        });
      }
    } else if (draftCoords) {
      const scaleX = 8000;
      const scaleY = -8000;
      setMapPan({
        x: - (draftCoords.longitude - 83.3210) * scaleX,
        y: - (draftCoords.latitude - 17.7120) * scaleY
      });
    }
  }, [selectedReportId, draftCoords, reports, mapError]);

  // 7. Toggle WebGL Heatmap Layer on MapLibre instance dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "heatmap-source";
    const layerId = "heatmap-layer";

    const updateHeatmap = () => {
      if (!map.isStyleLoaded()) return;

      const geojson: any = {
        type: "FeatureCollection",
        features: reports
          .filter((r) => r.status === "open")
          .map((r) => ({
            type: "Feature",
            properties: {
              severity: r.severity
            },
            geometry: {
              type: "Point",
              coordinates: [r.coordinates.longitude, r.coordinates.latitude]
            }
          }))
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson
        });
      }

      if (heatmapView) {
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "heatmap",
            source: sourceId,
            maxzoom: 16,
            paint: {
              "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", "severity"],
                1, 0.5,
                5, 2.5
              ],
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 2,
                16, 6
              ],
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(0, 0, 0, 0)",
                0.2, "rgba(10, 132, 255, 0.4)",
                0.4, "rgba(167, 139, 250, 0.5)",
                0.6, "rgba(230, 126, 34, 0.6)",
                0.8, "rgba(255, 159, 10, 0.7)",
                1.0, "rgba(239, 68, 68, 0.8)"
              ],
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0, 15,
                16, 90
              ],
              "heatmap-opacity": 0.65
            }
          });
        } else {
          map.setLayoutProperty(layerId, "visibility", "visible");
        }
      } else {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateHeatmap();
    } else {
      map.once("style.load", updateHeatmap);
    }
  }, [reports, heatmapView, mapStyle]);


  // 2. Simulated Vector Map Logic (Drag, Pan, Coordinates Conversion)
  const mapWidth = 800;
  const mapHeight = 500;

  // Convert GPS Coordinates to Local SVG viewport pixel offsets
  const gpsToPixels = (lat: number, lon: number) => {
    // Default center: 17.7120, 83.3210
    const scaleX = 8000; // stretch values
    const scaleY = -8000;
    
    const x = (lon - 83.3210) * scaleX + (mapWidth / 2) + mapPan.x;
    const y = (lat - 17.7120) * scaleY + (mapHeight / 2) + mapPan.y;
    return { x, y };
  };


  // Convert Pixels back to GPS Coordinates (For clicking mapping points)
  const pixelsToGps = (x: number, y: number) => {
    const scaleX = 8000;
    const scaleY = -8000;

    const lon = (x - (mapWidth / 2) - mapPan.x) / scaleX + 83.3210;
    const lat = (y - (mapHeight / 2) - mapPan.y) / scaleY + 17.7120;
    return { lat, lon };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set Hover Coordinates
    const { lat, lon } = pixelsToGps(x, y);
    setHoverCoords({ lat, lon });

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setMapPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { lat, lon } = pixelsToGps(x, y);
    onMapClick(lat, lon);
  };

  // Mock sectors to draw boundary overlays
  const sectors: Sector[] = [
    { id: "sector_coastal", name: "Coastal Sector (Zone 22)", health_score: 90, coordinates: { latitude: 17.7120, longitude: 83.3210 } },
    { id: "sector_transit", name: "Transit Sector (Zone 15)", health_score: 95, coordinates: { latitude: 17.7210, longitude: 83.3150 } },
    { id: "sector_academic", name: "Academic Sector (Zone 5)", health_score: 92, coordinates: { latitude: 17.7810, longitude: 83.3780 } }
  ];

  // Find health score based on selected report, draft coordinates, or general city/national context
  let activeWardName = "National Network (India)";
  let activeHealthScore = 92;

  if (selectedReportId) {
    const report = reports.find(r => r.id === selectedReportId);
    if (report) {
      const lat = report.coordinates.latitude;
      const isDefaultSandboxCoords = lat > 17.6 && lat < 17.9;
      if (isDefaultSandboxCoords) {
        if (lat > 17.75) {
          activeWardName = "Academic Sector (Zone 5)";
          activeHealthScore = 92;
        } else if (lat > 17.715) {
          activeWardName = "Transit Sector (Zone 15)";
          activeHealthScore = 95;
        } else {
          activeWardName = "Coastal Sector (Zone 22)";
          activeHealthScore = 90;
        }
      } else {
        const shortName = report.location_name ? report.location_name.split(',')[0].replace("Location near ", "") : `Sector (Lat: ${lat.toFixed(3)})`;
        activeWardName = shortName;
        activeHealthScore = 94;
      }
    }
  } else if (draftCoords) {
    const lat = draftCoords.latitude;
    const isDefaultSandboxCoords = lat > 17.6 && lat < 17.9;
    if (isDefaultSandboxCoords) {
      if (lat > 17.75) {
        activeWardName = "Academic Sector (Zone 5)";
        activeHealthScore = 92;
      } else if (lat > 17.715) {
        activeWardName = "Transit Sector (Zone 15)";
        activeHealthScore = 95;
      } else {
        activeWardName = "Coastal Sector (Zone 22)";
        activeHealthScore = 90;
      }
    } else {
      activeWardName = `Draft Location Pin`;
      activeHealthScore = 96;
    }
  } else {
    if (currentZoom <= 5) {
      activeWardName = "National Network (India)";
      activeHealthScore = 94;
    } else if (resolvedLocationName) {
      activeWardName = resolvedLocationName;
      activeHealthScore = resolvedHealthScore || 92;
    } else if (mapCenter) {
      const { latitude: mapLat, longitude: mapLng } = mapCenter;

      // Check closeness to our known sectors
      let closestSector: Sector | null = null;
      let minSectorDist = Infinity;

      sectors.forEach(s => {
        const dist = Math.sqrt(
          Math.pow(mapLat - s.coordinates.latitude, 2) + 
          Math.pow(mapLng - s.coordinates.longitude, 2)
        );
        if (dist < minSectorDist) {
          minSectorDist = dist;
          closestSector = s;
        }
      });

      if (closestSector && minSectorDist < 0.05) {
        activeWardName = (closestSector as Sector).name;
        activeHealthScore = (closestSector as Sector).health_score;
      } else if (mapLat > 17.6 && mapLat < 17.9 && mapLng > 83.2 && mapLng < 83.5) {
        activeWardName = "Visakhapatnam District";
        activeHealthScore = 92;
      } else {
        activeWardName = "National Network (India)";
        activeHealthScore = 94;
      }
    }
  }

  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeHealthScore / 100) * circumference;

  return (
    <div className="flex-1 min-h-[300px] relative rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex flex-col">
      {!selectedReportId && (
        <div className="absolute top-[115px] right-4 z-10 bg-surface-container-lowest/90 border border-outline-variant p-2.5 rounded-lg flex items-center gap-2.5 select-none shadow-sm text-on-surface transition-all duration-300 group w-auto">
          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background track circle */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="stroke-outline-variant/30"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active arc circle */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="stroke-secondary transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Centered Score */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-on-surface leading-none">
                {activeHealthScore}
              </span>
              <span className="text-[6.5px] font-mono text-outline mt-0.5">%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-outline uppercase tracking-wider font-bold">Sector Health</span>
            <span className="text-body-sm font-bold text-on-surface whitespace-nowrap max-w-[170px] truncate">
              {activeWardName}
            </span>
          </div>

        </div>
      )}

      {/* Map Control Actions */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setHeatmapView(!heatmapView)}
          className={`p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-variant/30 cursor-pointer transition-all ${heatmapView ? "bg-secondary/15 border-secondary text-secondary font-bold" : "text-on-surface-variant"}`}
          title="Toggle Weather Heatmap"
        >
          <span className="material-symbols-outlined text-[20px] flex items-center justify-center">warning</span>
        </button>
        <button 
          onClick={() => setMapStyle(prev => prev === "dark" ? "osm" : prev === "osm" ? "satellite" : "dark")}
          className={`p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-variant/30 cursor-pointer transition-all flex items-center justify-center gap-1 text-on-surface-variant ${
            mapStyle !== "dark" ? "bg-secondary/15 border-secondary text-secondary font-bold" : ""
          }`}
          title="Switch Map Style"
        >
          <span className="material-symbols-outlined text-[20px]">layers</span>
          <span className="text-[7.5px] font-mono font-bold uppercase select-none">
            {mapStyle}
          </span>
        </button>
        <button 
          onClick={handleLocateUser}
          className="p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-variant/30 cursor-pointer transition-all flex items-center justify-center text-on-surface-variant"
          title="Locate Me"
        >
          <span className="material-symbols-outlined text-[20px]">my_location</span>
        </button>
      </div>


      {/* Rendering Container */}
      {!mapError ? (
        <div 
          ref={mapContainerRef} 
          className="flex-1 w-full min-h-0" 
          onMouseMove={(e) => {
            const map = mapRef.current;
            if (!map) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            try {
              const lngLat = map.unproject([x, y]);
              if (lngLat) {
                setHoverCoords({ lat: lngLat.lat, lon: lngLat.lng });
              }
            } catch (err) {
              // ignore unproject failure
            }
          }}
        />
      ) : (
        /* INTERACTIVE SVG VECTOR FALLBACK */
        <div 
          className="w-full h-full bg-surface-container select-none cursor-grab active:cursor-grabbing relative overflow-hidden flex-1"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg 
            width="100%" 
            height="100%" 
            onClick={handleSvgClick}
            className="absolute inset-0"
          >
            {/* Grid Lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Glowing Streets / Roads (Draw custom routes mapping coordinates) */}
            {/* Coastal Highway */}
            <path 
              d={`M ${gpsToPixels(17.700, 83.328).x} ${gpsToPixels(17.700, 83.328).y} 
                  Q ${gpsToPixels(17.730, 83.322).x} ${gpsToPixels(17.730, 83.322).y} 
                    ${gpsToPixels(17.785, 83.375).x} ${gpsToPixels(17.785, 83.375).y}`}
              fill="none" 
              stroke="rgba(10, 132, 255, 0.08)" 
              strokeWidth="10" 
              strokeLinecap="round"
            />
            <path 
              d={`M ${gpsToPixels(17.700, 83.328).x} ${gpsToPixels(17.700, 83.328).y} 
                  Q ${gpsToPixels(17.730, 83.322).x} ${gpsToPixels(17.730, 83.322).y} 
                    ${gpsToPixels(17.785, 83.375).x} ${gpsToPixels(17.785, 83.375).y}`}
              fill="none" 
              stroke="rgba(10, 132, 255, 0.25)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />

            {/* Cross Streets (Transit Junction connectors) */}
            <line 
              x1={gpsToPixels(17.721, 83.300).x} 
              y1={gpsToPixels(17.721, 83.300).y} 
              x2={gpsToPixels(17.721, 83.340).x} 
              y2={gpsToPixels(17.721, 83.340).y} 
              stroke="rgba(255, 159, 10, 0.15)" 
              strokeWidth="2" 
            />

            {/* Sector Boundaries & Labels */}
            {sectors.map((sector) => {
              const pixel = gpsToPixels(sector.coordinates.latitude, sector.coordinates.longitude);
              return (
                <g key={sector.id} className="opacity-60 hover:opacity-100 transition-opacity duration-300">
                  {/* Outer Sector Bounds (Dashed Ring) */}
                  <circle 
                    cx={pixel.x} 
                    cy={pixel.y} 
                    r="80" 
                    fill="none" 
                    stroke="rgba(255, 159, 10, 0.15)" 
                    strokeWidth="1" 
                    strokeDasharray="4 6" 
                  />
                  {/* Floating Sector Health HUD text */}
                  <rect 
                    x={pixel.x - 65} 
                    y={pixel.y - 100} 
                    width="130" 
                    height="24" 
                    rx="6" 
                    fill="rgba(255, 255, 255, 0.95)" 
                    stroke="rgba(0, 0, 0, 0.08)" 
                    strokeWidth="1" 
                  />
                  <text 
                    x={pixel.x} 
                    y={pixel.y - 84} 
                    textAnchor="middle" 
                    className="text-[10px] font-heading font-medium fill-slate-700 uppercase font-bold"
                  >
                    {sector.name.split(" ")[0]}: {sector.health_score}%
                  </text>
                </g>
              );
            })}

            {/* Weather Decay Heatmap Risk Overlay */}
            {heatmapView && (
              <g className="mix-blend-multiply opacity-40">
                {reports.map((report) => {
                  const pixel = gpsToPixels(report.coordinates.latitude, report.coordinates.longitude);
                  if (report.severity >= 4 && report.status !== "resolved") {
                    return (
                      <circle 
                        key={`heatmap-${report.id}`} 
                        cx={pixel.x} 
                        cy={pixel.y} 
                        r="55" 
                        fill="url(#heatmap-radial)" 
                      />
                    );
                  }
                  return null;
                })}
                <defs>
                  <radialGradient id="heatmap-radial">
                    <stop offset="0%" stopColor="#E67E22" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#E67E22" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#E67E22" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </g>
            )}

            {/* Report Pulsing Status Pins */}
            {reports.map((report) => {
              const pixel = gpsToPixels(report.coordinates.latitude, report.coordinates.longitude);
              const isSelected = report.id === selectedReportId;
              const isResolved = report.status === "resolved";
              
              // Color matching category
              let color = "#0A84FF"; // Data Blue
              if (isResolved) color = "#10B981"; // Forest
              else if (report.category === "road_hazard") color = "#E67E22"; // Terracotta
              else if (report.category === "electrical_grid") color = "#FF9F0A"; // Amber
              else if (report.category === "waste_management") color = "#A78BFA"; // Lavender
              else if (report.category === "public_structure") color = "#EC4899"; // Pink

              return (
                <g 
                  key={report.id} 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReport(report.id);
                  }}
                >
                  {/* Outer breathing ring */}
                  <circle 
                    cx={pixel.x} 
                    cy={pixel.y} 
                    r={isSelected ? "14" : "9"} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="1.5" 
                    className="animate-pulse"
                  />
                  {/* Center Solid Marker Pin */}
                  <circle 
                    cx={pixel.x} 
                    cy={pixel.y} 
                    r={isSelected ? "7" : "4.5"} 
                    fill={color} 
                    stroke="#FFFFFF" 
                    strokeWidth={isSelected ? "1.5" : "0.5"} 
                  />
                  {/* Concentric Pulsating Selection Rings */}
                  {isSelected && (
                    <>
                      <circle 
                        cx={pixel.x} 
                        cy={pixel.y} 
                        r="20" 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="1" 
                        opacity="0.6"
                        className="animate-ping"
                      />
                      <circle 
                        cx={pixel.x} 
                        cy={pixel.y} 
                        r="26" 
                        fill="none" 
                        stroke="#000000" 
                        strokeWidth="1" 
                        opacity="0.3"
                        strokeDasharray="2 2"
                      />
                    </>
                  )}
                </g>
              );
            })}

            {/* Draft Pin (SVG fallback) */}
            {draftCoords && (
              <g className="cursor-pointer">
                {/* Outer breathing ring */}
                <circle 
                  cx={gpsToPixels(draftCoords.latitude, draftCoords.longitude).x} 
                  cy={gpsToPixels(draftCoords.latitude, draftCoords.longitude).y} 
                  r="12" 
                  fill="none" 
                  stroke="#FF9F0A" 
                  strokeWidth="1.5" 
                  strokeDasharray="2 3"
                  className="animate-pulse"
                />
                {/* Center Solid Marker Pin */}
                <circle 
                  cx={gpsToPixels(draftCoords.latitude, draftCoords.longitude).x} 
                  cy={gpsToPixels(draftCoords.latitude, draftCoords.longitude).y} 
                  r="6" 
                  fill="#FF9F0A" 
                  stroke="#FFFFFF" 
                  strokeWidth="1" 
                />
              </g>
            )}
          </svg>
          
          {/* Simulated Map instructions overlay (Fallback) */}
          <div className="absolute top-16 left-4 z-10 bg-surface-container-lowest/90 border border-outline-variant px-3 py-1.5 rounded text-[10px] text-outline select-none pointer-events-none font-bold">
            🖱️ Left-Click: select pins | Drag: pan map | Click road: add hazard pin
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 bg-surface-container-lowest/95 px-3.5 py-2.5 rounded-lg border border-outline-variant text-[10px] text-on-surface-variant font-mono select-none pointer-events-none max-w-[280px] shadow-sm">
        <span className="text-secondary font-bold font-heading text-[11px]">Map Interaction Guide:</span>
        <div className="mt-1.5 flex flex-col gap-1 text-on-surface-variant font-medium">
          <div>🖱️ <span className="text-on-surface">Left-Click Pin:</span> View Advocacy Kit</div>
          <div>🖱️ <span className="text-on-surface">Right-Click + Drag:</span> Rotate & Pitch 3D</div>
          <div>🗺️ <span className="text-on-surface">Left-Click Map:</span> Set Report Coordinates</div>
        </div>
        <div className="h-[1px] bg-outline-variant/30 my-2" />
        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
          <span className="material-symbols-outlined text-[16px] text-secondary">navigation</span>
          <span className="font-semibold text-on-surface font-heading text-[10px]">National Digital Twin v3.1</span>
        </div>
        <div className="text-outline mt-1 font-mono text-[9px] tracking-tight">
          Lat: {hoverCoords.lat.toFixed(6)}, Lon: {hoverCoords.lon.toFixed(6)}
        </div>
      </div>
      
      {gpsAlert && (
        <div className="absolute inset-0 bg-[#070A11]/60 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-lg font-body-md animate-fade-in text-left">
            <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center mx-auto flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {gpsAlert.type === "disabled" ? "gps_off" : "location_disabled"}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-center">
              <h4 className="font-bold text-on-surface text-body-lg font-heading">
                {gpsAlert.title}
              </h4>
              <p className="text-xs text-outline leading-relaxed mt-1">
                {gpsAlert.message}
              </p>
              {gpsAlert.type === "disabled" && (
                <div className="mt-2.5 p-2 rounded bg-secondary/5 border border-secondary/15 text-[10px] text-secondary font-mono leading-relaxed flex items-center gap-1.5 justify-center">
                  <span className="material-symbols-outlined text-sm animate-pulse">sync</span>
                  Detecting GPS state in real time...
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  setGpsAlert(null);
                  handleLocateUser();
                }}
                className="w-full bg-secondary text-on-secondary py-2 rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer font-heading flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Try Geolocation Again
              </button>
              <button
                onClick={() => setGpsAlert(null)}
                className="w-full border border-outline-variant hover:bg-surface-container text-on-surface py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer font-heading flex items-center justify-center"
              >
                Use Default Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
