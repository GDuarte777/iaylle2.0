import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  reconnectEdge, 
  Connection, 
  Edge,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DashboardLayout, useAccessControl } from '@/components/DashboardLayout';
import CustomNode, { CustomNodeType, NodeFieldType, NodeField } from '@/components/workflow/CustomNode';
import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2, X, Layout, Type, AlignLeft, Hash, CheckSquare, List, Palette, ChevronDown, Check, Map, Minimize2, Maximize2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTutorial } from '@/hooks/useTutorial';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { isRlsPolicyError, WORKFLOW_LIMIT } from '@/lib/workflowLimits';
import { serializeWorkflowNodes } from '@/lib/workflows';

const nodeTypes = {
  custom: CustomNode,
};

// Dados iniciais
const defaultNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      title: 'Início do Mapa Mental',
      color: '#2563eb',
      fields: [
        { id: 'f1', type: 'text' as NodeFieldType, label: 'Nome do Projeto', value: 'Meu Mapa Mental' },
        { id: 'f2', type: 'select' as NodeFieldType, label: 'Ambiente', value: 'prod', options: [{ label: 'Produção', value: 'prod' }, { label: 'Homologação', value: 'staging' }] }
      ],
    },
  },
];

const defaultEdges: Edge[] = [];

// Helper to get icon for field type
const getFieldIcon = (type: NodeFieldType) => {
    switch(type) {
        case 'text': return <Type className="w-4 h-4" />;
        case 'textarea': return <AlignLeft className="w-4 h-4" />;
        case 'number': return <Hash className="w-4 h-4" />;
        case 'select': return <ChevronDown className="w-4 h-4" />;
        case 'multiselect': return <List className="w-4 h-4" />;
        case 'checkbox': return <CheckSquare className="w-4 h-4" />;
        case 'color': return <Palette className="w-4 h-4" />;
        default: return <Type className="w-4 h-4" />;
    }
}

const getFieldLabel = (type: NodeFieldType) => {
    switch(type) {
        case 'text': return 'Texto Curto';
        case 'textarea': return 'Texto Longo';
        case 'number': return 'Número';
        case 'select': return 'Dropdown';
        case 'multiselect': return 'Múltipla Escolha';
        case 'checkbox': return 'Caixa de Seleção';
        case 'color': return 'Cor';
        default: return type;
    }
}

function WorkflowFlow() {
    const { id: workflowId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const access = useAccessControl();

    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes as unknown as CustomNodeType[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
    const [flowTitle, setFlowTitle] = useState('Meu Novo Mapa Mental');
    const [saving, setSaving] = useState(false);
    const nodesRef = useRef<CustomNodeType[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    
    const edgeReconnectSuccessful = useRef(true);

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    }, [setEdges]);

    const onReconnectEnd = useCallback((_, edge?: Edge) => {
        if (!edge?.id) {
            edgeReconnectSuccessful.current = true;
            return;
        }

        if (!edgeReconnectSuccessful.current) {
            const exists = edgesRef.current.some((e) => e.id === edge.id);
            if (exists) {
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
                toast.info("Conexão removida");
            }
        }
        edgeReconnectSuccessful.current = true;
    }, [setEdges]);

    // Estado do Modal de Adição/Edição
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [newNodeTitle, setNewNodeTitle] = useState('Novo Node');
    const [newNodeColor, setNewNodeColor] = useState('#000000');
    const [newNodeFields, setNewNodeFields] = useState<NodeField[]>([]);

    // Estado do MiniMap
    const [isMinimapOpen, setIsMinimapOpen] = useState(true);

    // Handlers para atualizar dados dos nodes
    const updateNodeData = useCallback((nodeId: string, dataUpdate: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: { ...node.data, ...dataUpdate } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const updateNodeField = useCallback((nodeId: string, fieldId: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    const currentFields = node.data.fields || [];
                    const newFields = currentFields.map((f: any) => {
                        if (f.id === fieldId) return { ...f, value };
                        return f;
                    });
                    return { ...node, data: { ...node.data, fields: newFields } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const deleteNode = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        toast.success("Node removido");
    }, [setNodes]);

    useEffect(() => {
        nodesRef.current = nodes as unknown as CustomNodeType[];
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges as unknown as Edge[];
    }, [edges]);

    useEffect(() => {
        if (!selectedEdgeId) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;

            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (target as any)?.isContentEditable) return;

            setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
            setSelectedEdgeId(null);
            toast.info('Conexão removida');
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedEdgeId, setEdges]);

    const openEditModalById = useCallback((nodeId: string) => {
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) return;
        setEditingNodeId(node.id);
        setNewNodeTitle(node.data.title);
        setNewNodeColor(node.data.color || '#000000');
        setNewNodeFields(JSON.parse(JSON.stringify(node.data.fields || [])));
        setIsAddModalOpen(true);
    }, []);

    // Função para abrir modal de criação (resetado)
    const openCreateModal = () => {
        setEditingNodeId(null);
        setNewNodeTitle('Novo Node');
        setNewNodeColor('#000000');
        setNewNodeFields([]);
        setIsAddModalOpen(true);
    };

    // Handlers para desconectar handles via clique duplo ou sequencial
    const lastClickRef = useRef<{ handleId: string, nodeId: string, timestamp: number } | null>(null);

    const onHandleClick = useCallback((handleId: string, nodeId: string) => {
        const now = Date.now();
        const lastClick = lastClickRef.current;

        // Limite de 300ms para clique duplo
        if (lastClick && (now - lastClick.timestamp) < 300) {
            // Clique duplo ou sequencial rápido
            
            // Cenário 1: Clique duplo no mesmo handle do mesmo node
            if (lastClick.handleId === handleId && lastClick.nodeId === nodeId) {
                // Identifica conexões específicas deste handle neste node
                const edgesToRemove = edgesRef.current.filter(
                    (e) => (e.source === nodeId && e.sourceHandle === handleId) || 
                           (e.target === nodeId && e.targetHandle === handleId)
                );

                if (edgesToRemove.length > 0) {
                    // Feedback visual: Destacar em vermelho antes de remover
                    setEdges((eds) => eds.map(e => {
                        if (edgesToRemove.some(rem => rem.id === e.id)) {
                            return {
                                ...e,
                                style: { ...e.style, stroke: '#ef4444', strokeWidth: 3 },
                                animated: true
                            };
                        }
                        return e;
                    }));

                    // Delay para visualização
                    setTimeout(() => {
                        setEdges((eds) => {
                            const remaining = eds.filter(e => !edgesToRemove.some(rem => rem.id === e.id));
                            if (eds.length !== remaining.length) {
                                toast.info(`${edgesToRemove.length} conexão(ões) removida(s)`);
                            }
                            return remaining;
                        });
                    }, 400);
                }
            } 
            // Cenário 2: Clique sequencial em handles diferentes (remocão de link específico)
            else {
                const edgeToRemove = edgesRef.current.find(e => 
                    (e.source === lastClick.nodeId && e.sourceHandle === lastClick.handleId && e.target === nodeId && e.targetHandle === handleId) ||
                    (e.target === lastClick.nodeId && e.targetHandle === lastClick.handleId && e.source === nodeId && e.sourceHandle === handleId)
                );
                
                if (edgeToRemove) {
                    // Feedback visual
                    setEdges((eds) => eds.map(e => 
                        e.id === edgeToRemove.id 
                            ? { ...e, style: { ...e.style, stroke: '#ef4444', strokeWidth: 3 }, animated: true } 
                            : e
                    ));

                    setTimeout(() => {
                        setEdges((eds) => {
                            const remaining = eds.filter(e => e.id !== edgeToRemove.id);
                            if (eds.length !== remaining.length) {
                                toast.info("Conexão removida");
                            }
                            return remaining;
                        });
                    }, 400);
                }
            }
            lastClickRef.current = null;
        } else {
            lastClickRef.current = { handleId, nodeId, timestamp: now };
        }
    }, [setEdges]);

    // Hidratação dos handlers
    useEffect(() => {
        const needsHydration = nodes.some((node) => {
            const data: any = (node as any)?.data;
            return !(data?.onDelete && data?.onUpdate && data?.onTitleChange && data?.onEdit && data?.onHandleClick);
        });

        if (!needsHydration) return;

        setNodes((nds) => {
            let changed = false;

            const next = nds.map((node) => {
                const data: any = (node as any)?.data ?? {};
                if (data.onDelete && data.onUpdate && data.onTitleChange && data.onEdit && data.onHandleClick) return node;

                changed = true;
                return {
                    ...node,
                    data: {
                        ...data,
                        onDelete: () => deleteNode(node.id),
                        onEdit: () => openEditModalById(node.id),
                        onUpdate: (fieldId: string, value: any) => updateNodeField(node.id, fieldId, value),
                        onTitleChange: (newTitle: string) => updateNodeData(node.id, { title: newTitle }),
                        onHandleClick: (handleId: string, nodeId: string) => onHandleClick(handleId, nodeId),
                    },
                };
            });

            return changed ? (next as any) : nds;
        });
    }, [deleteNode, nodes, openEditModalById, setNodes, updateNodeData, updateNodeField, onHandleClick]);


    const onConnect = useCallback(
        (params: Connection) => {
            // Validação: Impedir múltiplas conexões entre os mesmos dois nodes
            const { source, target } = params;
            if (!source || !target) return;
            
            // Verifica se já existe conexão entre source e target (independente dos handles)
            const exists = edgesRef.current.some(
                (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
            );

            if (exists) {
                toast.error("Já existe uma conexão entre estes dois nodes.");
                return;
            }

            setEdges((eds) => addEdge({ 
                ...params, 
                type: 'smoothstep',
                animated: true,
                reconnectable: true,
                interactionWidth: 25,
                style: { stroke: '#8b5cf6', strokeWidth: 2 },
            }, eds));
            toast.success("Conexão criada!");
        },
        [setEdges],
    );

    useEffect(() => {
        if (!workflowId || !user) return;

        const run = async () => {
            const { data, error } = await supabase
                .from('workflows')
                .select('id, title, nodes, edges')
                .eq('id', workflowId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                toast.error('Erro ao carregar mapa mental');
                return;
            }

            setFlowTitle(data.title ?? 'Meu Mapa Mental');
            if (Array.isArray(data.nodes)) setNodes(data.nodes as any);
            if (Array.isArray(data.edges)) {
                const hydratedEdges = (data.edges as any[]).map((e) => ({
                    ...e,
                    type: e.type ?? 'smoothstep',
                    animated: e.animated ?? true,
                    reconnectable: e.reconnectable ?? true,
                    interactionWidth: e.interactionWidth ?? 25,
                    style: { stroke: '#8b5cf6', strokeWidth: 2, ...(e.style ?? {}) },
                }));
                setEdges(hydratedEdges as any);
            }
        };

        void run();
    }, [workflowId, user, setNodes, setEdges]);

    const handleSaveWorkflow = useCallback(async () => {
        if (!user) {
            toast.error('Você precisa estar logado para salvar');
            return;
        }

        if (access && !access.canUseTool("workflow-save-btn")) {
            access.notifyToolBlocked();
            return;
        }

        if (saving) return;
        setSaving(true);

        try {

        const serializableNodes = serializeWorkflowNodes(nodes as any[]);

        const payload = {
            user_id: user.id,
            title: flowTitle || 'Meu Novo Mapa Mental',
            nodes: serializableNodes,
            edges,
        };

        if (workflowId) {
            const { error } = await supabase
                .from('workflows')
                .update(payload)
                .eq('id', workflowId)
                .eq('user_id', user.id);

            if (error) {
                toast.error('Erro ao salvar mapa mental');
                return;
            }

            toast.success('Mapa mental salvo com sucesso!');
            return;
        }

        const { count, error: countError } = await supabase
            .from('workflows')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) {
            toast.error('Erro ao validar limite de mapas mentais');
            return;
        }

        if ((count ?? 0) >= WORKFLOW_LIMIT) {
            toast.error('Você atingiu o limite de 4 mapas mentais. Exclua um para criar outro.');
            return;
        }

        const { data, error } = await supabase
            .from('workflows')
            .insert(payload)
            .select('id')
            .single();

        if (error) {
            if (isRlsPolicyError(error)) {
                toast.error('Você atingiu o limite de 4 mapas mentais. Exclua um para criar outro.');
            } else {
                toast.error('Erro ao criar mapa mental');
            }
            return;
        }

        toast.success('Mapa mental criado com sucesso!');
        navigate(`/dashboard/workflow/${data.id}`);
        } catch (err) {
            console.error(err);
            toast.error('Erro inesperado ao salvar mapa mental');
        } finally {
            setSaving(false);
        }
    }, [access, edges, flowTitle, navigate, nodes, saving, user, workflowId]);

    const addNewFieldToNode = () => {
        const newField: NodeField = {
            id: crypto.randomUUID(),
            type: 'text',
            label: '',
            value: '',
            options: []
        };
        setNewNodeFields([...newNodeFields, newField]);
    };

    const updateFieldInNode = (id: string, updates: Partial<NodeField>) => {
        setNewNodeFields(newNodeFields.map(f => {
            if (f.id === id) {
                // Se mudar o tipo para select/multiselect e não tiver opções, inicializa
                if ((updates.type === 'select' || updates.type === 'multiselect') && (!f.options || f.options.length === 0)) {
                    return { ...f, ...updates, options: [{ label: 'Opção 1', value: 'opt1' }] };
                }
                return { ...f, ...updates };
            }
            return f;
        }));
    };

    const removeFieldFromNode = (id: string) => {
        setNewNodeFields(newNodeFields.filter(f => f.id !== id));
    };

    const addOptionToField = (fieldId: string) => {
        setNewNodeFields(newNodeFields.map(f => {
            if (f.id === fieldId) {
                const newOptId = `opt${(f.options?.length || 0) + 1}`;
                return { ...f, options: [...(f.options || []), { label: `Opção ${(f.options?.length || 0) + 1}`, value: newOptId }] };
            }
            return f;
        }));
    };

    const updateOptionInField = (fieldId: string, optIdx: number, val: string) => {
        setNewNodeFields(newNodeFields.map(f => {
            if (f.id === fieldId && f.options) {
                const newOpts = [...f.options];
                newOpts[optIdx] = { ...newOpts[optIdx], label: val, value: val }; // Simplificando value = label por enquanto
                return { ...f, options: newOpts };
            }
            return f;
        }));
    };
    
    const removeOptionFromField = (fieldId: string, optIdx: number) => {
         setNewNodeFields(newNodeFields.map(f => {
            if (f.id === fieldId && f.options) {
                const newOpts = f.options.filter((_, idx) => idx !== optIdx);
                return { ...f, options: newOpts };
            }
            return f;
        }));
    }

    const handleSaveNode = () => {
        if (editingNodeId) {
            // Atualizar node existente
            setNodes((nds) => 
                nds.map((node) => {
                    if (node.id === editingNodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                title: newNodeTitle,
                                color: newNodeColor,
                                fields: newNodeFields
                            }
                        };
                    }
                    return node;
                })
            );
            toast.success("Node atualizado com sucesso!");
        } else {
            // Criar novo node
            const id = crypto.randomUUID();
            const position = { 
                x: Math.random() * 300 + 100, 
                y: Math.random() * 300 + 100 
            };

            const newNode: CustomNodeType = {
                id,
                type: 'custom',
                position,
                data: {
                    title: newNodeTitle || 'Novo Node',
                    color: newNodeColor,
                    fields: newNodeFields,
                    // Handlers serão injetados pelo useEffect
                },
            };

            setNodes((nds) => nds.concat(newNode));
            toast.success("Node criado com sucesso!");
        }
        
        setIsAddModalOpen(false);
        setEditingNodeId(null);
    };

    return (
        <div className="h-[calc(100vh-6rem)] w-full bg-background relative rounded-xl overflow-hidden border border-border shadow-sm" id="workflow-editor-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                onReconnectStart={onReconnectStart}
                onReconnectEnd={onReconnectEnd}
                onEdgeClick={(event, edge) => {
                    event.stopPropagation();
                    setSelectedEdgeId(edge.id);
                    toast.info('Pressione Delete para remover a conexão');
                }}
                onPaneClick={() => setSelectedEdgeId(null)}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                minZoom={0.1}
                maxZoom={2}
                snapToGrid={true}
                snapGrid={[15, 15]}
                className="bg-slate-50 dark:bg-slate-950"
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    reconnectable: true,
                    interactionWidth: 25,
                    style: { stroke: '#8b5cf6', strokeWidth: 2 }
                }}
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls className="!bg-background !border-border [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-foreground hover:[&>button]:!bg-muted" />
                <MiniMap className='!bg-background !border-border' zoomable pannable />
                
                <Panel position="top-left" className="bg-background/80 backdrop-blur-md p-2 rounded-lg border border-border shadow-lg flex gap-2 items-center" id="workflow-editor-panel">
                    <Input
                        value={flowTitle}
                        onChange={(e) => setFlowTitle(e.target.value)}
                        className="w-[200px] h-9 bg-background"
                        placeholder="Nome do Mapa Mental"
                    />
                    <div className="h-6 w-px bg-border mx-1" />
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="gap-2 shadow-sm hover:shadow-md transition-all"
                                onClick={openCreateModal}
                                id="workflow-add-node-btn"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Node
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{editingNodeId ? 'Editar Node' : 'Criar Novo Node'}</DialogTitle>
                                <DialogDescription>
                                    Personalize o layout e campos do seu node.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
                                {/* Header do Node */}
                                <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: newNodeColor || '#000' }} />
                                    <div className="grid grid-cols-[1fr,auto] gap-4 items-start pl-2">
                                        <div className="space-y-2">
                                            <Label>Título do Node</Label>
                                            <Input 
                                                value={newNodeTitle} 
                                                onChange={(e) => setNewNodeTitle(e.target.value)} 
                                                placeholder="Título do Formulário"
                                                className="text-lg font-medium border-transparent hover:border-input focus:border-input px-0 h-auto py-1 rounded-none border-b transition-colors bg-transparent"
                                            />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Label className="text-xs text-muted-foreground">Cor</Label>
                                            <div className="relative">
                                                <input 
                                                    type="color" 
                                                    value={newNodeColor}
                                                    onChange={(e) => setNewNodeColor(e.target.value)}
                                                    className="w-8 h-8 rounded-full cursor-pointer overflow-hidden border-2 border-border p-0 absolute opacity-0"
                                                />
                                                <div 
                                                    className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                                                    style={{ backgroundColor: newNodeColor || '#000' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de Campos (Builder) */}
                                <div className="space-y-4">
                                    {newNodeFields.map((field, index) => (
                                        <Card key={field.id} className="p-4 space-y-4 relative group border-l-4 border-l-transparent hover:border-l-primary/50 transition-all">
                                            <div className="flex gap-4 items-start">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <Input 
                                                                value={field.label}
                                                                onChange={(e) => updateFieldInNode(field.id, { label: e.target.value })}
                                                                placeholder="Pergunta / Rótulo"
                                                                className="bg-muted/30 border-transparent focus:border-input transition-colors"
                                                            />
                                                        </div>
                                                        <Select 
                                                            value={field.type} 
                                                            onValueChange={(val) => updateFieldInNode(field.id, { type: val as NodeFieldType })}
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <div className="flex items-center gap-2">
                                                                    {getFieldIcon(field.type)}
                                                                    <span>{getFieldLabel(field.type)}</span>
                                                                </div>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text"><div className="flex items-center gap-2"><Type className="w-4 h-4"/> Texto Curto</div></SelectItem>
                                                                <SelectItem value="textarea"><div className="flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Texto Longo</div></SelectItem>
                                                                <SelectItem value="number"><div className="flex items-center gap-2"><Hash className="w-4 h-4"/> Número</div></SelectItem>
                                                                <SelectItem value="select"><div className="flex items-center gap-2"><ChevronDown className="w-4 h-4"/> Dropdown</div></SelectItem>
                                                                <SelectItem value="multiselect"><div className="flex items-center gap-2"><List className="w-4 h-4"/> Múltipla Escolha</div></SelectItem>
                                                                <SelectItem value="checkbox"><div className="flex items-center gap-2"><CheckSquare className="w-4 h-4"/> Checkbox</div></SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Opções para Select/Multiselect */}
                                                    {(field.type === 'select' || field.type === 'multiselect') && (
                                                        <div className="pl-4 space-y-2 border-l-2 border-muted ml-1">
                                                            {field.options?.map((opt, optIdx) => (
                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center">
                                                                        <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                                                                    </div>
                                                                    <Input 
                                                                        value={opt.label}
                                                                        onChange={(e) => updateOptionInField(field.id, optIdx, e.target.value)}
                                                                        className="h-8 text-sm flex-1 border-transparent hover:border-input focus:border-input"
                                                                        placeholder={`Opção ${optIdx + 1}`}
                                                                    />
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={() => removeOptionFromField(field.id, optIdx)}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="text-muted-foreground hover:text-primary text-xs h-8 ml-6"
                                                                onClick={() => addOptionToField(field.id)}
                                                            >
                                                                Adicionar opção
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Preview simples para outros tipos */}
                                                    {field.type === 'text' && <div className="text-xs text-muted-foreground ml-1 italic border-b border-dashed w-1/2 pb-1">Texto de resposta curta</div>}
                                                    {field.type === 'textarea' && <div className="text-xs text-muted-foreground ml-1 italic border-b border-dashed w-3/4 pb-4">Texto de resposta longa</div>}
                                                </div>
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeFieldFromNode(field.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}

                                    <Button 
                                        variant="outline" 
                                        className="w-full border-dashed py-6 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
                                        onClick={addNewFieldToNode}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adicionar Novo Campo
                                    </Button>
                                </div>
                            </div>

                            <DialogFooter className="mt-4 pt-4 border-t">
                                <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleSaveNode} className="min-w-[120px]">
                                    {editingNodeId ? 'Salvar Alterações' : 'Criar Node'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="icon" title="Salvar Mapa Mental" onClick={handleSaveWorkflow} id="workflow-save-btn" disabled={saving}>
                        <Save className="w-4 h-4" />
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function WorkflowEditor() {
    const { startWorkflowEditorTutorial } = useTutorial();
    
    return (
        <DashboardLayout>
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between px-2" id="workflow-editor-header">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Editor de Mapa Mental</h2>
                        <p className="text-muted-foreground">Crie e gerencie seus mapas mentais visuais interativos.</p>
                    </div>
                    <Button
                        onClick={startWorkflowEditorTutorial}
                        variant="outline"
                        className="flex gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-foreground px-6"
                    >
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Como usar
                    </Button>
                </div>
                
                <div className="flex-1 min-h-[600px]">
                    <ReactFlowProvider>
                        <WorkflowFlow />
                    </ReactFlowProvider>
                </div>
            </div>
        </DashboardLayout>
    );
}
