"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit, AlertCircle, Clock, Users, CheckCircle2 } from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseApp } from '../../../firebaseConfig';
import { useAuth } from '../../../src/app/contexts/AuthContext';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

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

import { Alert, AlertDescription } from "@/components/ui/alert";

// Componente do Formulário de Serviço
const ServiceForm = ({ isEditing, initialData, onSubmit, submitLabel, loading, colaboradores }) => {
    const [formData, setFormData] = useState({
        ...initialData,
        colaboradoresIds: initialData.colaboradoresIds || []
    });
    
    const [showColaboradoresSelector, setShowColaboradoresSelector] = useState(
        initialData.colaboradoresHabilitados || false
    );

    const handleColaboradorChange = (index) => {
        // Converte para string para garantir consistência na comparação
        const indexStr = index.toString();
        
        // Se o índice já está na lista, remove; senão, adiciona
        const novaLista = formData.colaboradoresIds.includes(indexStr)
            ? formData.colaboradoresIds.filter(id => id !== indexStr)
            : [...formData.colaboradoresIds, indexStr];
        
        setFormData({
            ...formData,
            colaboradoresIds: novaLista
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Se os colaboradores não estão habilitados, limpa a lista
        const dadosParaEnviar = {
            ...formData,
            colaboradoresHabilitados: showColaboradoresSelector,
            colaboradoresIds: showColaboradoresSelector ? formData.colaboradoresIds : []
        };
        onSubmit(dadosParaEnviar);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="nome" className="text-sm font-medium">Nome do Serviço</Label>
                    <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Massagem Relaxante"
                        className="w-full rounded-md border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="preco" className="text-sm font-medium">Preço (R$)</Label>
                    <Input
                        id="preco"
                        type="number"
                        value={formData.preco}
                        onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                        placeholder="0,00"
                        className="w-full rounded-md border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="duracao" className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-indigo-600" />
                            Duração da Sessão
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.temDuracao}
                                onCheckedChange={(checked) => setFormData({ ...formData, temDuracao: checked })}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                            <Label className="text-xs text-gray-600">Definir duração</Label>
                        </div>
                    </div>

                    {formData.temDuracao && (
                        <Select
                            value={formData.duracao}
                            onValueChange={(value) => setFormData({ ...formData, duracao: value })}
                        >
                            <SelectTrigger className="w-full border-indigo-200 focus:ring-indigo-500">
                                <SelectValue placeholder="Selecione a duração" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 minutos</SelectItem>
                                <SelectItem value="45">45 minutos</SelectItem>
                                <SelectItem value="60">1 hora</SelectItem>
                                <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                                <SelectItem value="120">2 horas</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-600" />
                            Colaboradores que realizam este serviço
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={showColaboradoresSelector}
                                onCheckedChange={setShowColaboradoresSelector}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                            <Label className="text-xs text-gray-600">Habilitar colaboradores</Label>
                        </div>
                    </div>

                    {showColaboradoresSelector && (
                        <div className="mt-2 space-y-2 bg-indigo-50 p-4 rounded-md border border-indigo-100">
                            {colaboradores && colaboradores.length > 0 ? (
                                colaboradores.map((colaborador, index) => {
                                    // Usando o índice como identificador
                                    const indexStr = index.toString();
                                    return (
                                        <div key={indexStr} className="flex items-center space-x-2 p-2 hover:bg-indigo-100 rounded-md transition-colors">
                                            <Checkbox
                                                id={`colaborador-${indexStr}`}
                                                checked={formData.colaboradoresIds.includes(indexStr)}
                                                onCheckedChange={() => handleColaboradorChange(index)}
                                                className="border-indigo-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                            />
                                            <Label
                                                htmlFor={`colaborador-${indexStr}`}
                                                className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                                {colaborador.nome} 
                                                <span className="text-xs text-indigo-600 ml-1">
                                                    {colaborador.cargo}
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-sm text-gray-500 italic p-4 text-center">
                                    Nenhum colaborador cadastrado. Adicione colaboradores primeiro.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="descricao" className="text-sm font-medium">Descrição</Label>
                    <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descreva os detalhes do serviço"
                        className="min-h-24 w-full rounded-md border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
                <Button type="submit" disabled={loading} 
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                    {loading ? "Processando..." : submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
};

// Componente Principal
const MeusServicos = () => {
    const { user } = useAuth();
    const db = getFirestore(firebaseApp);
    const [servicos, setServicos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoServico, setNovoServico] = useState({
        nome: '',
        descricao: '',
        preco: '',
        temDuracao: true,
        duracao: '60',
        colaboradoresHabilitados: false,
        colaboradoresIds: []
    });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const formatarPreco = (preco) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(preco);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const carregarServicos = async () => {
        if (!user) return;

        try {
            const userDocRef = doc(db, 'usuario', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setServicos(userData.servicos || []);
                setColaboradores(userData.colaboradores || []);
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            showNotification('Não foi possível carregar os serviços', 'error');
        }
    };

    useEffect(() => {
        if (user) {
            carregarServicos();
        }
    }, [user]);

    const adicionarServico = async (formData) => {
        if (!user) return;

        setLoading(true);
        try {
            const userDocRef = doc(db, 'usuario', user.uid);
            const novoServicoData = {
                ...formData,
                id: Date.now().toString(),
                duracao: formData.temDuracao ? formData.duracao : null
            };

            await updateDoc(userDocRef, {
                servicos: arrayUnion(novoServicoData)
            });

            setNovoServico({
                nome: '',
                descricao: '',
                preco: '',
                temDuracao: true,
                duracao: '60',
                colaboradoresHabilitados: false,
                colaboradoresIds: []
            });
            await carregarServicos();
            showNotification('Serviço adicionado com sucesso!');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao adicionar serviço:', error);
            showNotification('Não foi possível adicionar o serviço', 'error');
        }
        setLoading(false);
    };

    const atualizarServico = async (formData) => {
        if (!user) return;

        setLoading(true);
        try {
            const userDocRef = doc(db, 'usuario', user.uid);
            const servicoParaSalvar = {
                ...formData,
                duracao: formData.temDuracao ? formData.duracao : null
            };

            const servicosAtualizados = servicos.map(s =>
                s.id === servicoParaSalvar.id ? servicoParaSalvar : s
            );

            await updateDoc(userDocRef, {
                servicos: servicosAtualizados
            });

            await carregarServicos();
            showNotification('Serviço atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
            showNotification('Não foi possível atualizar o serviço', 'error');
        } finally {
            setLoading(false);
        }
    };

    const removerServico = async (servicoParaRemover) => {
        if (!user) return;

        try {
            const userDocRef = doc(db, 'usuario', user.uid);
            await updateDoc(userDocRef, {
                servicos: arrayRemove(servicoParaRemover)
            });
            await carregarServicos();
            showNotification('Serviço removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover serviço:', error);
            showNotification('Não foi possível remover o serviço', 'error');
        }
    };

    const formatarDuracao = (duracao) => {
        if (!duracao) return 'Sem duração definida';
        const minutos = parseInt(duracao);
        if (minutos >= 60) {
            const horas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return `${horas}h${minutosRestantes ? ` ${minutosRestantes}min` : ''}`;
        }
        return `${minutos} minutos`;
    };

    // Função para obter os nomes dos colaboradores a partir dos IDs (índices)
    const getColaboradoresNomes = (colaboradoresIds) => {
        if (!colaboradoresIds || colaboradoresIds.length === 0) return null;
        
        const nomes = colaboradoresIds
            .map(indexStr => {
                const index = parseInt(indexStr);
                return (colaboradores[index]) ? colaboradores[index].nome : null;
            })
            .filter(nome => nome !== null);
            
        if (nomes.length === 0) return null;
        
        if (nomes.length === 1) return nomes[0];
        if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
        
        // Para mais de 2 colaboradores, mostra o primeiro e o número total
        return `${nomes[0]} e mais ${nomes.length - 1}`;
    };

    return (
        <div className="max-w-4xl mx-auto w-full px-4 py-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <h1 className="text-2xl font-bold text-indigo-900">Meus Serviços</h1>
                    
                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) {
                            setNovoServico({
                                nome: '',
                                descricao: '',
                                preco: '',
                                temDuracao: true,
                                duracao: '60',
                                colaboradoresHabilitados: false,
                                colaboradoresIds: []
                            });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Serviço
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-semibold text-indigo-900">Novo Serviço</DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    Preencha os detalhes do novo serviço que você deseja oferecer.
                                </DialogDescription>
                            </DialogHeader>
                            <ServiceForm
                                isEditing={false}
                                initialData={novoServico}
                                onSubmit={adicionarServico}
                                submitLabel="Adicionar Serviço"
                                loading={loading}
                                colaboradores={colaboradores}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {notification && (
                    <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}
                           className={notification.type === 'error' 
                               ? 'bg-red-50 border-red-200 text-red-800' 
                               : 'bg-green-50 border-green-200 text-green-800'}>
                        <div className="flex items-center gap-2">
                            {notification.type === 'error' ? 
                                <AlertCircle className="h-5 w-5" /> : 
                                <CheckCircle2 className="h-5 w-5" />
                            }
                            <AlertDescription>{notification.message}</AlertDescription>
                        </div>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {servicos.map((servico) => (
                        <Card key={servico.id} className="w-full bg-white shadow-sm hover:shadow-md transition-shadow border-indigo-100">
                            <CardContent className="p-5">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-semibold text-indigo-900 truncate">
                                            {servico.nome}
                                        </h3>
                                        <div className="flex gap-2 flex-shrink-0 ml-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-lg">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-semibold text-indigo-900">Editar Serviço</DialogTitle>
                                                    </DialogHeader>
                                                    <ServiceForm
                                                        isEditing={true}
                                                        initialData={servico}
                                                        onSubmit={atualizarServico}
                                                        submitLabel="Salvar Alterações"
                                                        loading={loading}
                                                        colaboradores={colaboradores}
                                                    />
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8 bg-white text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="border-gray-300">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction 
                                                            onClick={() => removerServico(servico)}
                                                            className="bg-red-600 hover:bg-red-700 text-white">
                                                            Remover
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 flex-grow">
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {servico.descricao || "Sem descrição"}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-indigo-100">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                {formatarPreco(servico.preco)}
                                            </span>
                                            
                                            {servico.temDuracao && (
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatarDuracao(servico.duracao)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {servico.colaboradoresHabilitados && servico.colaboradoresIds && servico.colaboradoresIds.length > 0 && (
                                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                                                <Users className="h-3 w-3 text-indigo-600" />
                                                <span>
                                                    {getColaboradoresNomes(servico.colaboradoresIds)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {servicos.length === 0 && (
                    <Card className="w-full border-dashed border-2 border-indigo-200">
                        <CardContent className="p-8 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-indigo-900">Nenhum serviço cadastrado</h3>
                                <p className="mt-2 text-gray-600 max-w-md mx-auto">
                                    Comece adicionando seu primeiro serviço clicando no botão acima.
                                    Os serviços ficarão disponíveis para seus clientes agendarem.
                                </p>
                                <Button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Seu Primeiro Serviço
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MeusServicos;