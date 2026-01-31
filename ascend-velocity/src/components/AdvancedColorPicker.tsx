import { useState, useEffect, useId } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Palette } from "lucide-react";

const normalizeHexColor = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return null;
  return withHash.toUpperCase();
};

export interface CustomStyle {
  type: "solid" | "gradient" | null;
  background: string;
  textColor: string;
  gradientSettings?: {
    type: "linear" | "radial";
    direction: string;
    colors: string[];
  };
}

interface AdvancedColorPickerProps {
  value?: CustomStyle | null;
  onChange: (value: CustomStyle | null) => void;
  defaultTextColor?: string;
}

const GRADIENT_PRESETS = [
  { name: "Sunset", colors: ["#FF512F", "#DD2476"] },
  { name: "Ocean", colors: ["#2193b0", "#6dd5ed"] },
  { name: "Purple Love", colors: ["#cc2b5e", "#753a88"] },
  { name: "Morning", colors: ["#FF5F6D", "#FFC371"] },
  { name: "Neon Life", colors: ["#B06AB3", "#4568DC"] },
];

export function AdvancedColorPicker({ value, onChange, defaultTextColor = "#ffffff" }: AdvancedColorPickerProps) {
  const uid = useId();
  const textColorHexId = `${uid}-text-color-hex`;
  const solidColorHexId = `${uid}-solid-color-hex`;

  const [isEnabled, setIsEnabled] = useState(Boolean(value));
  const [mode, setMode] = useState<"solid" | "gradient">((value?.type as "solid" | "gradient") || "solid");
  
  // Solid State
  const [solidColor, setSolidColor] = useState(() => {
    if (value?.type === "solid") return normalizeHexColor(value.background) ?? "#000000";
    return "#000000";
  });
  const [solidColorDraft, setSolidColorDraft] = useState(solidColor);
  const [solidColorError, setSolidColorError] = useState<string | null>(null);
  
  // Gradient State
  const [gradientType, setGradientType] = useState<"linear" | "radial">(value?.gradientSettings?.type || "linear");
  const [gradientDirection, setGradientDirection] = useState(value?.gradientSettings?.direction || "to right");
  const [gradientColors, setGradientColors] = useState<string[]>(() => {
    const raw = value?.gradientSettings?.colors;
    if (raw?.length) {
      const normalized = raw.map((c) => normalizeHexColor(c)).filter(Boolean) as string[];
      if (normalized.length >= 2) return normalized;
    }
    return ["#FF512F", "#DD2476"];
  });
  const [gradientColorDrafts, setGradientColorDrafts] = useState<string[]>(gradientColors);
  const [gradientErrors, setGradientErrors] = useState<(string | null)[]>(() => gradientColors.map(() => null));
  
  // Common State
  const [textColor, setTextColor] = useState(() => normalizeHexColor(value?.textColor || defaultTextColor) ?? defaultTextColor.toUpperCase());
  const [textColorDraft, setTextColorDraft] = useState(textColor);
  const [textColorError, setTextColorError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      const normalizedText = normalizeHexColor(defaultTextColor) ?? defaultTextColor.toUpperCase();
      setIsEnabled(false);
      setMode("solid");
      setSolidColor("#000000");
      setSolidColorDraft("#000000");
      setSolidColorError(null);
      setGradientType("linear");
      setGradientDirection("to right");
      setGradientColors(["#FF512F", "#DD2476"]);
      setGradientColorDrafts(["#FF512F", "#DD2476"]);
      setGradientErrors([null, null]);
      setTextColor(normalizedText);
      setTextColorDraft(normalizedText);
      setTextColorError(null);
      return;
    }

    setIsEnabled(true);
    const nextMode = (value.type as "solid" | "gradient") || "solid";
    setMode(nextMode);

    const nextSolid = value.type === "solid" ? (normalizeHexColor(value.background) ?? "#000000") : "#000000";
    setSolidColor(nextSolid);
    setSolidColorDraft(nextSolid);
    setSolidColorError(null);

    const nextGradientType = value.gradientSettings?.type || "linear";
    const nextGradientDirection = value.gradientSettings?.direction || "to right";
    const nextGradientColors = (() => {
      const raw = value.gradientSettings?.colors;
      if (raw?.length) {
        const normalized = raw.map((c) => normalizeHexColor(c)).filter(Boolean) as string[];
        if (normalized.length >= 2) return normalized.slice(0, 5);
      }
      return ["#FF512F", "#DD2476"];
    })();
    setGradientType(nextGradientType);
    setGradientDirection(nextGradientDirection);
    setGradientColors(nextGradientColors);
    setGradientColorDrafts(nextGradientColors);
    setGradientErrors(nextGradientColors.map(() => null));

    const nextText = normalizeHexColor(value.textColor || defaultTextColor) ?? (value.textColor || defaultTextColor).toUpperCase();
    setTextColor(nextText);
    setTextColorDraft(nextText);
    setTextColorError(null);
  }, [value, defaultTextColor]);

  const buildCustomStyle = (next: {
    enabled: boolean;
    mode: "solid" | "gradient";
    solidColor: string;
    textColor: string;
    gradientType: "linear" | "radial";
    gradientDirection: string;
    gradientColors: string[];
  }): CustomStyle | null => {
    if (!next.enabled) return null;

    if (next.mode === "solid") {
      return {
        type: "solid",
        background: next.solidColor,
        textColor: next.textColor,
      };
    }

    const safeStops = next.gradientColors.length >= 2 ? next.gradientColors.slice(0, 5) : ["#FF512F", "#DD2476"];
    const bgString = next.gradientType === "linear"
      ? `linear-gradient(${next.gradientDirection}, ${safeStops.join(", ")})`
      : `radial-gradient(circle, ${safeStops.join(", ")})`;

    return {
      type: "gradient",
      background: bgString,
      textColor: next.textColor,
      gradientSettings: {
        type: next.gradientType,
        direction: next.gradientDirection,
        colors: safeStops,
      },
    };
  };

  const emit = (partial?: Partial<Parameters<typeof buildCustomStyle>[0]>) => {
    const next = {
      enabled: isEnabled,
      mode,
      solidColor,
      textColor,
      gradientType,
      gradientDirection,
      gradientColors,
      ...partial,
    };
    onChange(buildCustomStyle(next));
  };

  const handleReset = () => {
    setIsEnabled(false);
    setMode("solid");
    setSolidColor("#000000");
    setSolidColorDraft("#000000");
    setSolidColorError(null);
    setGradientColors(["#FF512F", "#DD2476"]);
    setGradientColorDrafts(["#FF512F", "#DD2476"]);
    setGradientErrors([null, null]);
    const normalizedText = normalizeHexColor(defaultTextColor) ?? defaultTextColor.toUpperCase();
    setTextColor(normalizedText);
    setTextColorDraft(normalizedText);
    setTextColorError(null);

    onChange(null);
  };

  const updateGradientColor = (index: number, color: string) => {
    setIsEnabled(true);
    const newDrafts = [...gradientColorDrafts];
    newDrafts[index] = color;
    setGradientColorDrafts(newDrafts);

    const normalized = normalizeHexColor(color);
    const nextErrors = [...gradientErrors];
    nextErrors[index] = normalized ? null : "Use #RRGGBB";
    setGradientErrors(nextErrors);

    if (!normalized) return;

    const newColors = [...gradientColors];
    newColors[index] = normalized;
    setGradientColors(newColors);
    emit({ enabled: true, gradientColors: newColors });
  };

  const addGradientStop = () => {
    setIsEnabled(true);
    if (gradientColors.length < 5) {
      const nextColors = [...gradientColors, "#FFFFFF"];
      setGradientColors(nextColors);
      setGradientColorDrafts([...gradientColorDrafts, "#FFFFFF"]);
      setGradientErrors([...gradientErrors, null]);
      emit({ enabled: true, gradientColors: nextColors });
    }
  };

  const removeGradientStop = (index: number) => {
    setIsEnabled(true);
    if (gradientColors.length > 2) {
      const nextColors = gradientColors.filter((_, i) => i !== index);
      setGradientColors(nextColors);
      setGradientColorDrafts(gradientColorDrafts.filter((_, i) => i !== index));
      setGradientErrors(gradientErrors.filter((_, i) => i !== index));
      emit({ enabled: true, gradientColors: nextColors });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-card">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-neon-blue" />
          Personalização do Card
        </Label>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 text-xs text-muted-foreground hover:text-red-400">
          <RotateCcw className="w-3 h-3 mr-1" />
          Restaurar Padrão
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Preview Box */}
        <div 
          className="w-full h-16 rounded-lg flex items-center justify-center border transition-all duration-300 shadow-md"
          style={{ 
            background: mode === "solid" ? solidColor : (
              gradientType === "linear" 
                ? `linear-gradient(${gradientDirection}, ${gradientColors.join(", ")})`
                : `radial-gradient(circle, ${gradientColors.join(", ")})`
            ),
          }}
        >
          <span className="font-medium text-sm" style={{ color: textColor }}>
            Pré-visualização do Texto
          </span>
        </div>

        {/* Text Color Selection */}
        <div className="flex items-center gap-3">
          <Label htmlFor={textColorHexId} className="text-xs w-24">Cor do Texto</Label>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setIsEnabled(true);
                const next = normalizeHexColor(e.target.value) ?? e.target.value.toUpperCase();
                setTextColor(next);
                setTextColorDraft(next);
                setTextColorError(null);
                emit({ enabled: true, textColor: next });
              }}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
              aria-label="Selecionar cor do texto"
            />
            <Input 
              id={textColorHexId}
              value={textColorDraft} 
              onChange={(e) => {
                const raw = e.target.value;
                setTextColorDraft(raw);
                const normalized = normalizeHexColor(raw);
                if (normalized) {
                  setIsEnabled(true);
                  setTextColor(normalized);
                  setTextColorError(null);
                  emit({ enabled: true, textColor: normalized });
                  return;
                }
                setTextColorError("Cor inválida. Use #RRGGBB");
              }} 
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        {textColorError && (
          <div className="text-[10px] text-red-400 -mt-2">{textColorError}</div>
        )}

        <Tabs value={mode} onValueChange={(v) => {
          const nextMode = v as "solid" | "gradient";
          setIsEnabled(true);
          setMode(nextMode);
          emit({ enabled: true, mode: nextMode });
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solid">Cor Sólida</TabsTrigger>
            <TabsTrigger value="gradient">Gradiente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="solid" className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <Label htmlFor={solidColorHexId} className="text-xs w-24">Cor de Fundo</Label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => {
                    setIsEnabled(true);
                    const next = normalizeHexColor(e.target.value) ?? e.target.value.toUpperCase();
                    setSolidColor(next);
                    setSolidColorDraft(next);
                    setSolidColorError(null);
                    emit({ enabled: true, solidColor: next, mode: "solid" });
                  }}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  aria-label="Selecionar cor de fundo"
                />
                <Input 
                  id={solidColorHexId}
                  value={solidColorDraft} 
                  onChange={(e) => {
                    const raw = e.target.value;
                    setSolidColorDraft(raw);
                    const normalized = normalizeHexColor(raw);
                    if (normalized) {
                      setIsEnabled(true);
                      setSolidColor(normalized);
                      setSolidColorError(null);
                      emit({ enabled: true, solidColor: normalized, mode: "solid" });
                      return;
                    }
                    setSolidColorError("Cor inválida. Use #RRGGBB");
                  }} 
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {solidColorError && (
              <div className="text-[10px] text-red-400 -mt-2">{solidColorError}</div>
            )}
            
            {/* Quick Colors */}
            <div className="flex flex-wrap gap-2 mt-2">
              {["#000000", "#FFFFFF", "#F43F5E", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setIsEnabled(true);
                    setSolidColor(color);
                    setSolidColorDraft(color);
                    setSolidColorError(null);
                    emit({ enabled: true, solidColor: color, mode: "solid" });
                  }}
                  className="w-6 h-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  aria-label={`Selecionar cor de fundo ${color}`}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="gradient" className="space-y-4 mt-3">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Presets</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {GRADIENT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsEnabled(true);
                      const nextColors = preset.colors.map((c) => normalizeHexColor(c) ?? c.toUpperCase());
                      setGradientColors(nextColors);
                      setGradientColorDrafts(nextColors);
                      setGradientErrors(nextColors.map(() => null));
                      emit({ enabled: true, mode: "gradient", gradientColors: nextColors });
                    }}
                    className="w-12 h-8 rounded-md shrink-0 border hover:border-neon-blue transition-all"
                    style={{ background: `linear-gradient(to right, ${preset.colors.join(", ")})` }}
                    title={preset.name}
                    aria-label={`Preset ${preset.name}`}
                  />
                ))}
              </div>
            </div>

            {/* Direction & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={gradientType} onValueChange={(v) => {
                  setIsEnabled(true);
                  setGradientType(v as any);
                  emit({ enabled: true, gradientType: v as any, mode: "gradient" });
                }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {gradientType === "linear" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Direção</Label>
                  <Select value={gradientDirection} onValueChange={(v) => {
                    setIsEnabled(true);
                    setGradientDirection(v);
                    emit({ enabled: true, gradientDirection: v, mode: "gradient" });
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to right">→ Direita</SelectItem>
                      <SelectItem value="to left">← Esquerda</SelectItem>
                      <SelectItem value="to bottom">↓ Baixo</SelectItem>
                      <SelectItem value="to top">↑ Cima</SelectItem>
                      <SelectItem value="to bottom right">↘ Diagonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Color Stops */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pontos de Parada</Label>
                {gradientColors.length < 5 && (
                  <Button variant="ghost" size="sm" onClick={addGradientStop} className="h-5 text-[10px] px-2">
                    + Adicionar
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                {gradientColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-[10px] text-muted-foreground w-4">{index + 1}</div>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateGradientColor(index, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                      aria-label={`Selecionar cor do gradiente ponto ${index + 1}`}
                    />
                    <Input 
                      value={gradientColorDrafts[index] ?? color} 
                      onChange={(e) => updateGradientColor(index, e.target.value)} 
                      className="h-8 text-xs font-mono flex-1"
                      aria-label={`Hex do gradiente ponto ${index + 1}`}
                    />
                    {gradientColors.length > 2 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeGradientStop(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        aria-label={`Remover ponto ${index + 1}`}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}

                {gradientErrors.some(Boolean) && (
                  <div className="text-[10px] text-red-400">Pontos inválidos: use #RRGGBB</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
