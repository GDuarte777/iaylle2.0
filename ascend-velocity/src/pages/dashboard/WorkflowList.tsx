import { useEffect, useState } from 'react';
import { DashboardLayout, useAccessControl } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Calendar, FileCode, Search, MoreVertical, Play, Pause, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTutorial } from '@/hooks/useTutorial';
import { getWorkflowLimitText, isWorkflowLimitReached } from '@/lib/workflowLimits';
import { deleteWorkflow, ensureDefaultWorkflow } from '@/lib/workflows';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Workflow {
    id: string;
    title: string;
    description: string;
    updated_at: string;
    is_active: boolean;
}

function WorkflowListInner() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { startWorkflowsTutorial } = useTutorial();
    const access = useAccessControl();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user) {
            fetchWorkflows();
        }
    }, [user]);

    const fetchWorkflows = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const canMutate = access ? access.isPageToolsEnabled() : true;
            if (canMutate) {
                const { error: ensureError } = await ensureDefaultWorkflow(supabase);
                if (ensureError) {
                    console.error(ensureError);
                }
            }

            const { data, error } = await supabase
                .from('workflows')
                .select('id, title, description, updated_at, is_active')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setWorkflows(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar mapas mentais');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            if (!user) {
                toast.error('Você precisa estar logado');
                return;
            }

            if (access && !access.canUseTool("workflow-delete")) {
                access.notifyToolBlocked();
                return;
            }

            const { error } = await deleteWorkflow(supabase as any, { workflowId: id, userId: user.id });

            if (error) throw error;
            toast.success('Mapa mental removido com sucesso');
            fetchWorkflows();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao remover mapa mental');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            if (!user) {
                toast.error('Você precisa estar logado');
                return;
            }

            if (access && !access.canUseTool("workflow-toggle-status")) {
                access.notifyToolBlocked();
                return;
            }
            const { error } = await supabase
                .from('workflows')
                .update({ is_active: !currentStatus })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            toast.success(`Mapa mental ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
            setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !currentStatus } : w));
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar status');
        }
    };

    const filteredWorkflows = workflows.filter(flow => 
        flow.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const limitReached = isWorkflowLimitReached(workflows.length);

    return (
            <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="workflow-header">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Meus Mapas Mentais</h2>
                        <p className="text-muted-foreground mt-1">
                            Gerencie seus mapas mentais de automação e formulários interativos.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            onClick={startWorkflowsTutorial}
                            variant="outline"
                            className="flex gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-foreground px-6 w-full md:w-auto"
                        >
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            Como usar
                        </Button>
                        <Button
                            onClick={() => navigate('/dashboard/workflow')}
                            className="gap-2 w-full md:w-auto shadow-lg hover:shadow-primary/20 transition-all"
                            id="workflow-new-btn"
                            disabled={limitReached}
                        >
                            <Plus className="w-4 h-4" />
                            Novo Mapa Mental
                        </Button>
                    </div>
                </div>

                {limitReached && (
                    <div className="rounded-xl border bg-muted/10 px-4 py-3 text-sm" role="status">
                        <div className="font-medium">Limite atingido</div>
                        <div className="text-muted-foreground">
                            Você atingiu o limite de 4 mapas mentais. Exclua um mapa existente para liberar espaço.
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm" id="workflow-search">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar mapas mentais..." 
                            className="pl-9 bg-background/50 border-transparent hover:border-input focus:border-primary transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto text-sm text-muted-foreground ml-auto">
                        <FileCode className="w-4 h-4" />
                        <span>{filteredWorkflows.length} mapas mentais encontrados</span>
                        <Badge variant={limitReached ? 'destructive' : 'secondary'} className="ml-2">
                            {getWorkflowLimitText(workflows.length)}
                        </Badge>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" id="workflow-list-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="overflow-hidden border-0 shadow-md bg-card/50">
                                <Skeleton className="h-2 w-full bg-primary/10 rounded-none" />
                                <CardHeader className="space-y-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                                <CardFooter className="border-t bg-muted/20 p-4">
                                    <Skeleton className="h-9 w-full rounded-md" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <FileCode className="w-8 h-8 text-primary" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="text-xl font-semibold">Nenhum mapa mental encontrado</h3>
                            <p className="text-muted-foreground">
                                {searchQuery 
                                    ? "Tente ajustar seus termos de busca para encontrar o que procura."
                                    : "Comece criando seu primeiro mapa mental interativo para automatizar seus processos."
                                }
                            </p>
                        </div>
                        {!searchQuery && (
                            <Button onClick={() => navigate('/dashboard/workflow')} className="mt-4" id="workflow-new-btn-empty">
                                Criar Primeiro Mapa Mental
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in" id="workflow-list-grid">
                        {filteredWorkflows.map((flow) => (
                            <Card key={flow.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 ring-1 ring-border/50 bg-card flex flex-col relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${flow.is_active ? 'bg-gradient-to-r from-primary to-purple-500' : 'bg-muted'}`} />
                                
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1.5">
                                            <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                                                {flow.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={flow.is_active ? "default" : "secondary"} className="text-[10px] h-5 px-2">
                                                    {flow.is_active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigate(`/dashboard/workflow/${flow.id}`)}>
                                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(flow.id, flow.is_active)}>
                                                    {flow.is_active ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                                    {flow.is_active ? 'Pausar' : 'Ativar'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Excluir mapa mental?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta ação é irreversível e removerá permanentemente o mapa mental "{flow.title}" e todos os seus dados.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(flow.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Excluir Definitivamente
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px] text-sm mt-2">
                                        {flow.description || 'Sem descrição definida para este mapa mental.'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="py-2 flex-1">
                                    <div className="flex items-center text-xs text-muted-foreground gap-2 bg-muted/30 p-2 rounded-lg w-fit">
                                        <Calendar className="w-3 h-3" />
                                        <span>Atualizado {formatDistanceToNow(new Date(flow.updated_at), { addSuffix: true, locale: ptBR })}</span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 pb-4 px-6 border-t bg-muted/5 mt-auto gap-3">
                                    <Button 
                                        onClick={() => navigate(`/dashboard/workflow/${flow.id}`)} 
                                        className="w-full shadow-none group-hover:shadow-md transition-all"
                                        variant="default"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar Mapa Mental
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
    );
}

export default function WorkflowList() {
    return (
        <DashboardLayout>
            <WorkflowListInner />
        </DashboardLayout>
    );
}
