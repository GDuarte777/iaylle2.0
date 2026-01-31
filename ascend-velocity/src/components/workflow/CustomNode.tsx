import { memo } from 'react';
import { Handle, Position, NodeProps, Node, useHandleConnections } from '@xyflow/react';
import { X, Check, XCircle, CheckCircle2, Pencil } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Definir tipos de inputs suportados
export type NodeFieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'color';

export interface NodeField {
  id: string;
  type: NodeFieldType;
  label: string;
  value?: any;
  options?: { label: string; value: string }[]; // Para select e multiselect
}

export interface CustomNodeData extends Record<string, unknown> {
  title: string;
  color?: string; // Cor do node (hex)
  fields: NodeField[];
  onDelete?: () => void;
  onEdit?: (event: React.MouseEvent) => void;
  onUpdate?: (fieldId: string, value: any) => void;
  onTitleChange?: (newTitle: string) => void;
  onHandleDisconnect?: (handleId: string, nodeId: string) => void;
  onHandleClick?: (handleId: string, nodeId: string) => void;
}

export type CustomNodeType = Node<CustomNodeData>;

const CustomHandle = ({ 
    type, 
    position, 
    id, 
    isConnectable, 
    className, 
    style, 
    blockedBy,
    onHandleClick
}: any) => {
    const connections = useHandleConnections({ type, id });
    const blockedConnections = useHandleConnections({ type: blockedBy?.type, id: blockedBy?.id });
    
    // Se o handle que bloqueia este (ex: target bloqueia source) estiver conectado,
    // este handle (source) deve ficar invisível/desativado.
    const isBlocked = blockedBy && blockedConnections.length > 0;

    if (isBlocked) {
        return null;
    }

    return (
        <Handle 
            type={type} 
            position={position} 
            id={id} 
            isConnectable={isConnectable} 
            className={`${className} cursor-pointer hover:scale-125 transition-transform`} 
            style={style}
            onClick={(e) => {
                e.stopPropagation();
                if (onHandleClick) {
                    onHandleClick(id);
                }
            }}
            title="Clique para interagir"
        />
    );
};

const CustomNode = ({ id, data, isConnectable, selected }: NodeProps<CustomNodeType>) => {
  // Cor do node ou padrão
  const nodeColor = data.color || '';
  const hasCustomColor = !!nodeColor && nodeColor !== '#000000' && nodeColor !== '#ffffff';
  
  const handleClick = (handleId: string) => {
      data.onHandleClick?.(handleId, id);
  };

  return (
    <Card 
        className={`min-w-[280px] bg-card shadow-xl border-2 transition-all duration-200 ${selected ? 'ring-2 ring-primary/20' : ''}`}
        style={{ 
            borderColor: selected ? 'var(--primary)' : (hasCustomColor ? nodeColor : undefined),
        }}
    >
      {/* Handles Left */}
      <CustomHandle 
        type="target" 
        position={Position.Left} 
        id="l-target"
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-primary !border-4 !border-background hover:!bg-primary/80 transition-colors z-10" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, top: '50%' }}
        onHandleClick={handleClick}
      />
      <CustomHandle 
        type="source" 
        position={Position.Left} 
        id="l-source"
        isConnectable={isConnectable} 
        className="!w-3 !h-3 !bg-primary !border-2 !border-background hover:!bg-primary/80 transition-colors z-20 opacity-0 hover:opacity-100" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, top: '50%' }}
        blockedBy={{ type: 'target', id: 'l-target' }}
        onHandleClick={handleClick}
      />

      {/* Handles Top */}
      <CustomHandle 
        type="target" 
        position={Position.Top} 
        id="t-target"
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-primary !border-4 !border-background hover:!bg-primary/80 transition-colors z-10" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, left: '50%' }}
        onHandleClick={handleClick}
      />
      <CustomHandle 
        type="source" 
        position={Position.Top} 
        id="t-source"
        isConnectable={isConnectable} 
        className="!w-3 !h-3 !bg-primary !border-2 !border-background hover:!bg-primary/80 transition-colors z-20 opacity-0 hover:opacity-100" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, left: '50%' }}
        blockedBy={{ type: 'target', id: 't-target' }}
        onHandleClick={handleClick}
      />
      
      <CardHeader 
        className="p-3 pb-2 flex flex-row items-center justify-between space-y-0 border-b border-border/50 bg-muted/30"
        style={{ 
            backgroundColor: hasCustomColor ? `${nodeColor}15` : undefined, // 15 = ~8% opacity
            borderBottomColor: hasCustomColor ? `${nodeColor}30` : undefined
        }}
      >
        <Input 
            value={data.title} 
            onChange={(e) => data.onTitleChange?.(e.target.value)}
            className="h-8 font-semibold text-sm border-transparent hover:border-input focus:border-input px-2 bg-transparent w-[140px] nodrag"
            placeholder="Nome do Node"
            style={{ color: hasCustomColor ? nodeColor : undefined }}
        />
        <div className="flex items-center">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 nodrag"
                onClick={(e) => {
                    e.stopPropagation();
                    data.onEdit?.(e);
                }}
                title="Editar node"
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 nodrag"
                onClick={(e) => {
                    e.stopPropagation();
                    data.onDelete?.();
                }}
                title="Remover node"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {(data.fields)?.map((field) => (
            <div key={field.id} className="space-y-1.5 group">
                <Label className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {field.label}
                </Label>
                
                {field.type === 'text' && (
                    <Input 
                        value={field.value} 
                        onChange={(e) => data.onUpdate?.(field.id, e.target.value)}
                        className="h-9 text-sm bg-background/50"
                        placeholder="Digite algo..."
                    />
                )}

                {field.type === 'number' && (
                    <Input 
                        type="number"
                        value={field.value} 
                        onChange={(e) => data.onUpdate?.(field.id, e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-9 text-sm bg-background/50"
                        placeholder="0"
                    />
                )}
                
                {field.type === 'textarea' && (
                    <Textarea 
                        value={field.value} 
                        onChange={(e) => data.onUpdate?.(field.id, e.target.value)}
                        className="min-h-[80px] text-sm bg-background/50 resize-none"
                        placeholder="Digite seu texto aqui..."
                    />
                )}

                {field.type === 'select' && (
                    <Select value={field.value} onValueChange={(val) => data.onUpdate?.(field.id, val)}>
                        <SelectTrigger className="h-9 text-sm bg-background/50">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {field.type === 'multiselect' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-2 px-3 text-left font-normal text-sm bg-background/50">
                                {Array.isArray(field.value) && field.value.length > 0 
                                    ? <span className="truncate">{field.value.map((v: string) => field.options?.find(o => o.value === v)?.label || v).join(', ')}</span>
                                    : <span className="text-muted-foreground">Selecione opções...</span>
                                }
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="start">
                            <div className="p-1 max-h-[200px] overflow-y-auto">
                                {field.options?.map(opt => {
                                    const isSelected = Array.isArray(field.value) && field.value.includes(opt.value);
                                    return (
                                        <div 
                                            key={opt.value} 
                                            className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                                            onClick={() => {
                                                const current = Array.isArray(field.value) ? field.value : [];
                                                const newValue = isSelected 
                                                    ? current.filter((v: string) => v !== opt.value)
                                                    : [...current, opt.value];
                                                data.onUpdate?.(field.id, newValue);
                                            }}
                                        >
                                            <Checkbox checked={isSelected} />
                                            <span className="text-sm">{opt.label}</span>
                                        </div>
                                    );
                                })}
                                {(!field.options || field.options.length === 0) && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">Sem opções</div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {field.type === 'checkbox' && (
                    <div className="flex items-center space-x-2 p-2 rounded-md border border-input bg-background/50">
                        <Checkbox 
                            id={`check-${field.id}`} 
                            checked={field.value}
                            onCheckedChange={(checked) => data.onUpdate?.(field.id, checked)}
                        />
                        <label htmlFor={`check-${field.id}`} className="text-sm cursor-pointer select-none flex-1 flex items-center gap-2">
                            {field.value ? (
                                <span className="flex items-center text-green-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Ativado
                                </span>
                            ) : (
                                <span className="flex items-center text-red-500 font-medium">
                                    <XCircle className="w-4 h-4 mr-1.5" /> Desativado
                                </span>
                            )}
                        </label>
                    </div>
                )}
                
                {field.type === 'color' && (
                    <div className="flex items-center gap-2 p-1 rounded-md border border-input bg-background/50">
                        <input 
                            type="color" 
                            value={field.value} 
                            onChange={(e) => data.onUpdate?.(field.id, e.target.value)}
                            className="h-8 w-12 cursor-pointer rounded border-none bg-transparent p-0"
                        />
                        <span className="text-xs text-muted-foreground font-mono">{field.value}</span>
                    </div>
                )}
            </div>
        ))}
        {(!data.fields || data.fields.length === 0) && (
            <div className="text-center py-4 text-xs text-muted-foreground italic">
                Nenhum campo configurado
            </div>
        )}
      </CardContent>

      {/* Handles Bottom */}
      <CustomHandle 
        type="source" 
        position={Position.Bottom} 
        id="b-source"
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-primary !border-4 !border-background hover:!bg-primary/80 transition-colors z-10" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, left: '50%' }}
        blockedBy={{ type: 'target', id: 'b-target' }}
        onHandleClick={handleClick}
      />
      <CustomHandle 
        type="target" 
        position={Position.Bottom} 
        id="b-target"
        isConnectable={isConnectable} 
        className="!w-3 !h-3 !bg-primary !border-2 !border-background hover:!bg-primary/80 transition-colors z-20 opacity-0 hover:opacity-100" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, left: '50%' }}
        onHandleClick={handleClick}
      />

      {/* Handles Right */}
      <CustomHandle 
        type="source" 
        position={Position.Right} 
        id="r-source"
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-primary !border-4 !border-background hover:!bg-primary/80 transition-colors z-10" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, top: '50%' }}
        blockedBy={{ type: 'target', id: 'r-target' }}
        onHandleClick={handleClick}
      />
      <CustomHandle 
        type="target" 
        position={Position.Right} 
        id="r-target"
        isConnectable={isConnectable} 
        className="!w-3 !h-3 !bg-primary !border-2 !border-background hover:!bg-primary/80 transition-colors z-20 opacity-0 hover:opacity-100" 
        style={{ backgroundColor: hasCustomColor ? nodeColor : undefined, top: '50%' }}
        onHandleClick={handleClick}
      />
    </Card>
  );
};

export default memo(CustomNode);
