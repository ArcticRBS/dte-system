/**
 * Electoral Heatmap Component
 * 
 * Mapa de calor interativo para visualização de dados eleitorais
 * usando Google Maps Visualization Library (HeatmapLayer)
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Layers, MapPin, Users, Vote, BarChart3, ZoomIn, ZoomOut, Locate } from "lucide-react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Coordenadas de Porto Velho - RO
const PORTO_VELHO_CENTER = { lat: -8.7619, lng: -63.9039 };

// Dados dos bairros de Porto Velho com coordenadas reais
export const bairrosPortoVelho = [
  { id: 1, nome: "Centro", lat: -8.7619, lng: -63.9039, eleitores: 25678, nulos: 1234, brancos: 876, pt: 8234, pl: 7654, mdb: 5432 },
  { id: 2, nome: "Nova Porto Velho", lat: -8.7420, lng: -63.8840, eleitores: 18234, nulos: 987, brancos: 654, pt: 6234, pl: 5654, mdb: 4432 },
  { id: 3, nome: "Embratel", lat: -8.7321, lng: -63.8741, eleitores: 15678, nulos: 876, brancos: 543, pt: 5234, pl: 4654, mdb: 3432 },
  { id: 4, nome: "Caiari", lat: -8.7522, lng: -63.9142, eleitores: 12345, nulos: 765, brancos: 432, pt: 4234, pl: 3654, mdb: 2432 },
  { id: 5, nome: "São Cristóvão", lat: -8.7723, lng: -63.9243, eleitores: 11234, nulos: 654, brancos: 321, pt: 3834, pl: 3254, mdb: 2132 },
  { id: 6, nome: "Arigolândia", lat: -8.7524, lng: -63.8944, eleitores: 9876, nulos: 543, brancos: 210, pt: 3234, pl: 2854, mdb: 1932 },
  { id: 7, nome: "Pedrinhas", lat: -8.7825, lng: -63.9345, eleitores: 8765, nulos: 432, brancos: 198, pt: 2834, pl: 2454, mdb: 1732 },
  { id: 8, nome: "Tancredo Neves", lat: -8.7926, lng: -63.9446, eleitores: 7654, nulos: 321, brancos: 187, pt: 2434, pl: 2054, mdb: 1532 },
  { id: 9, nome: "Liberdade", lat: -8.7718, lng: -63.9138, eleitores: 6543, nulos: 298, brancos: 165, pt: 2134, pl: 1854, mdb: 1332 },
  { id: 10, nome: "Três Marias", lat: -8.7817, lng: -63.9237, eleitores: 5432, nulos: 276, brancos: 143, pt: 1834, pl: 1554, mdb: 1132 },
  { id: 11, nome: "Flodoaldo Pontes Pinto", lat: -8.7216, lng: -63.8636, eleitores: 14567, nulos: 823, brancos: 512, pt: 4934, pl: 4354, mdb: 3232 },
  { id: 12, nome: "Lagoa", lat: -8.7117, lng: -63.8537, eleitores: 13456, nulos: 756, brancos: 478, pt: 4534, pl: 3954, mdb: 2932 },
  { id: 13, nome: "Ronaldo Aragão", lat: -8.7018, lng: -63.8438, eleitores: 12345, nulos: 689, brancos: 445, pt: 4134, pl: 3554, mdb: 2632 },
  { id: 14, nome: "Marcos Freire", lat: -8.7319, lng: -63.8839, eleitores: 11234, nulos: 623, brancos: 412, pt: 3734, pl: 3154, mdb: 2332 },
  { id: 15, nome: "JK", lat: -8.7420, lng: -63.8940, eleitores: 10123, nulos: 556, brancos: 378, pt: 3334, pl: 2754, mdb: 2032 },
  { id: 16, nome: "Nacional", lat: -8.7521, lng: -63.9041, eleitores: 9012, nulos: 489, brancos: 345, pt: 2934, pl: 2354, mdb: 1732 },
  { id: 17, nome: "Escola de Polícia", lat: -8.7622, lng: -63.9142, eleitores: 7901, nulos: 423, brancos: 312, pt: 2534, pl: 1954, mdb: 1432 },
  { id: 18, nome: "Costa e Silva", lat: -8.7723, lng: -63.9243, eleitores: 6790, nulos: 356, brancos: 278, pt: 2134, pl: 1554, mdb: 1132 },
  { id: 19, nome: "Olaria", lat: -8.7824, lng: -63.9344, eleitores: 5679, nulos: 289, brancos: 245, pt: 1734, pl: 1154, mdb: 832 },
  { id: 20, nome: "Mocambo", lat: -8.7925, lng: -63.9445, eleitores: 4568, nulos: 223, brancos: 212, pt: 1334, pl: 754, mdb: 532 },
];

type HeatmapDataType = "eleitores" | "nulos" | "partidos";

interface ElectoralHeatmapProps {
  className?: string;
  initialDataType?: HeatmapDataType;
  onBairroSelect?: (bairro: typeof bairrosPortoVelho[0] | null) => void;
}

function loadMapScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    
    const existingScript = document.querySelector('script[src*="maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry,visualization`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

export function ElectoralHeatmap({
  className,
  initialDataType = "eleitores",
  onBairroSelect,
}: ElectoralHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState<HeatmapDataType>(initialDataType);
  const [selectedBairro, setSelectedBairro] = useState<typeof bairrosPortoVelho[0] | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const getHeatmapData = useCallback((type: HeatmapDataType) => {
    return bairrosPortoVelho.map((bairro) => {
      let weight: number;
      switch (type) {
        case "eleitores":
          weight = bairro.eleitores / 1000;
          break;
        case "nulos":
          weight = (bairro.nulos + bairro.brancos) / 100;
          break;
        case "partidos":
          weight = Math.max(bairro.pt, bairro.pl, bairro.mdb) / 500;
          break;
        default:
          weight = bairro.eleitores / 1000;
      }
      return {
        location: new google.maps.LatLng(bairro.lat, bairro.lng),
        weight,
      };
    });
  }, []);

  const getHeatmapGradient = useCallback((type: HeatmapDataType) => {
    switch (type) {
      case "eleitores":
        return [
          "rgba(0, 0, 255, 0)",
          "rgba(0, 100, 255, 0.4)",
          "rgba(0, 150, 255, 0.6)",
          "rgba(0, 200, 255, 0.8)",
          "rgba(0, 255, 255, 1)",
        ];
      case "nulos":
        return [
          "rgba(255, 0, 0, 0)",
          "rgba(255, 100, 0, 0.4)",
          "rgba(255, 150, 0, 0.6)",
          "rgba(255, 200, 0, 0.8)",
          "rgba(255, 255, 0, 1)",
        ];
      case "partidos":
        return [
          "rgba(0, 255, 0, 0)",
          "rgba(50, 255, 50, 0.4)",
          "rgba(100, 255, 100, 0.6)",
          "rgba(150, 255, 150, 0.8)",
          "rgba(200, 255, 200, 1)",
        ];
      default:
        return undefined;
    }
  }, []);

  const updateHeatmap = useCallback(() => {
    if (!heatmapRef.current || !window.google) return;
    
    const data = getHeatmapData(dataType);
    heatmapRef.current.setData(data);
    heatmapRef.current.set("gradient", getHeatmapGradient(dataType));
  }, [dataType, getHeatmapData, getHeatmapGradient]);

  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.map = null);
    markersRef.current = [];

    if (!showMarkers) return;

    bairrosPortoVelho.forEach((bairro) => {
      const markerContent = document.createElement("div");
      markerContent.className = "flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform";
      markerContent.innerHTML = `<span>${Math.round(bairro.eleitores / 1000)}K</span>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: bairro.lat, lng: bairro.lng },
        title: bairro.nome,
        content: markerContent,
      });

      marker.addListener("click", () => {
        setSelectedBairro(bairro);
        onBairroSelect?.(bairro);

        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        const content = `
          <div style="padding: 12px; min-width: 200px; font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1a1a1a;">${bairro.nome}</h3>
            <div style="display: grid; gap: 4px; font-size: 13px; color: #4a4a4a;">
              <div style="display: flex; justify-content: space-between;">
                <span>Eleitores:</span>
                <strong style="color: #2563eb;">${bairro.eleitores.toLocaleString("pt-BR")}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Votos Nulos:</span>
                <strong style="color: #dc2626;">${bairro.nulos.toLocaleString("pt-BR")}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Votos Brancos:</span>
                <strong style="color: #6b7280;">${bairro.brancos.toLocaleString("pt-BR")}</strong>
              </div>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e5e5;">
              <div style="display: flex; justify-content: space-between;">
                <span>PT:</span>
                <strong style="color: #e11d48;">${bairro.pt.toLocaleString("pt-BR")}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>PL:</span>
                <strong style="color: #1d4ed8;">${bairro.pl.toLocaleString("pt-BR")}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>MDB:</span>
                <strong style="color: #16a34a;">${bairro.mdb.toLocaleString("pt-BR")}</strong>
              </div>
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [showMarkers, onBairroSelect]);

  const initMap = usePersistFn(async () => {
    try {
      setIsLoading(true);
      await loadMapScript();
      
      if (!mapContainer.current || !window.google) {
        console.error("Map container or Google Maps not available");
        return;
      }

      mapRef.current = new google.maps.Map(mapContainer.current, {
        zoom: 12,
        center: PORTO_VELHO_CENTER,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: false,
        streetViewControl: false,
        mapId: "DTE_ELECTORAL_MAP",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Create heatmap layer
      const heatmapData = getHeatmapData(dataType);
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: showHeatmap ? mapRef.current : null,
        radius: 50,
        opacity: 0.7,
        gradient: getHeatmapGradient(dataType),
      });

      // Create markers
      createMarkers();

      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    updateHeatmap();
  }, [dataType, updateHeatmap]);

  useEffect(() => {
    createMarkers();
  }, [showMarkers, createMarkers]);

  useEffect(() => {
    if (heatmapRef.current && mapRef.current) {
      heatmapRef.current.setMap(showHeatmap ? mapRef.current : null);
    }
  }, [showHeatmap]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 12) - 1);
    }
  };

  const handleCenter = () => {
    if (mapRef.current) {
      mapRef.current.setCenter(PORTO_VELHO_CENTER);
      mapRef.current.setZoom(12);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <Select value={dataType} onValueChange={(v) => setDataType(v as HeatmapDataType)}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eleitores">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>Densidade de Eleitores</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nulos">
                      <div className="flex items-center gap-2">
                        <Vote className="w-4 h-4 text-red-500" />
                        <span>Votos Nulos/Brancos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="partidos">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-500" />
                        <span>Votação por Partido</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showHeatmap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="flex-1"
                >
                  Calor
                </Button>
                <Button
                  variant={showMarkers ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMarkers(!showMarkers)}
                  className="flex-1"
                >
                  Marcadores
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={handleZoomIn} className="shadow-lg">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut} className="shadow-lg">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleCenter} className="shadow-lg">
          <Locate className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
            <div className="flex items-center gap-2">
              <span className="text-xs">Baixo</span>
              <div
                className="w-24 h-3 rounded"
                style={{
                  background:
                    dataType === "eleitores"
                      ? "linear-gradient(to right, rgba(0,100,255,0.4), rgba(0,255,255,1))"
                      : dataType === "nulos"
                      ? "linear-gradient(to right, rgba(255,100,0,0.4), rgba(255,255,0,1))"
                      : "linear-gradient(to right, rgba(50,255,50,0.4), rgba(200,255,200,1))",
                }}
              />
              <span className="text-xs">Alto</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Bairro Info */}
      {selectedBairro && (
        <div className="absolute bottom-4 right-4 z-10 max-w-xs">
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {selectedBairro.nome}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setSelectedBairro(null);
                    onBairroSelect?.(null);
                    infoWindowRef.current?.close();
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-blue-500/10">
                  <p className="text-muted-foreground">Eleitores</p>
                  <p className="font-bold text-blue-600">{selectedBairro.eleitores.toLocaleString("pt-BR")}</p>
                </div>
                <div className="p-2 rounded bg-red-500/10">
                  <p className="text-muted-foreground">Nulos</p>
                  <p className="font-bold text-red-600">{selectedBairro.nulos.toLocaleString("pt-BR")}</p>
                </div>
                <div className="p-2 rounded bg-slate-500/10">
                  <p className="text-muted-foreground">Brancos</p>
                  <p className="font-bold text-slate-600">{selectedBairro.brancos.toLocaleString("pt-BR")}</p>
                </div>
                <div className="p-2 rounded bg-amber-500/10">
                  <p className="text-muted-foreground">% Nulos/Brancos</p>
                  <p className="font-bold text-amber-600">
                    {(((selectedBairro.nulos + selectedBairro.brancos) / selectedBairro.eleitores) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full min-h-[500px] rounded-xl" />
    </div>
  );
}

export default ElectoralHeatmap;
