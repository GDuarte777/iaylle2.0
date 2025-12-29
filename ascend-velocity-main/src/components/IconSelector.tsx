import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Smile } from "lucide-react";

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESET_ICONS = [
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "👑", "💎", 
  "🚀", "🔥", "⚡", "🌟", "⭐", "🎯", "🎨", "🎮", 
  "🎲", "🎰", "🧩", "🎳", "🎤", "🎧", "🎬", "🎭", 
  "🎁", "🎈", "🎉", "🎊", "💰", "💸", "💵", "💳", 
  "🛡️", "⚔️", "💣", "🧨", "🔨", "🔧", "⚙️", "⚖️", 
  "💡", "🔦", "🧬", "🔬", "🔭", "📡", "🌍", "🌈"
];

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onChange(result);
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-3xl transition-all hover:scale-105 active:scale-95">
          {value.startsWith("data:") || value.startsWith("http") ? (
            <img src={value} alt="Icon" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            value || "🏆"
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background/95 backdrop-blur-xl border-white/10">
        <Tabs defaultValue="icons" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none bg-muted/50">
            <TabsTrigger value="icons" className="data-[state=active]:bg-background/80">
              <Smile className="w-4 h-4 mr-2" />
              Ícones
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-background/80">
              <ImageIcon className="w-4 h-4 mr-2" />
              Imagem
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="icons" className="p-4">
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    onChange(icon);
                    setIsOpen(false);
                  }}
                  className={`aspect-square flex items-center justify-center text-xl rounded-lg hover:bg-primary/20 transition-colors ${value === icon ? "bg-primary/20 ring-1 ring-primary" : ""}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://..." 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button 
                  size="sm"
                  onClick={() => {
                    if (imageUrl) {
                      onChange(imageUrl);
                      setIsOpen(false);
                    }
                  }}
                >
                  Ok
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou faça upload</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
