"use client";
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit, AlertCircle, Clock } from 'lucide-react';
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
const ServiceForm = ({ isEditing, initialData, onSubmit, submitLabel, loading }) => {
    const [formData, setFormData] = useState(initialData);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="nome">Nome do Serviço</Label>
                    <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Massagem Relaxante"
                        className="w-full"
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="preco">Preço (R$)</Label>
                    <Input
                        id="preco"
                        type="number"
                        value={formData.preco}
                        onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                        placeholder="0,00"
                        className="w-full"
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="duracao">Duração da Sessão</Label>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.temDuracao}
                                onCheckedChange={(checked) => setFormData({ ...formData, temDuracao: checked })}
                            />
                            <Label>Definir duração</Label>
                        </div>
                    </div>

                    {formData.temDuracao && (
                        <Select
                            value={formData.duracao}
                            onValueChange={(value) => setFormData({ ...formData, duracao: value })}
                        >
                            <SelectTrigger className="w-full">
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
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descreva os detalhes do serviço"
                        className="min-h-24 w-full"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoServico, setNovoServico] = useState({
        nome: '',
        descricao: '',
        preco: '',
        temDuracao: true,
        duracao: '60'
    });
    const [loading, setLoading] = useState(false);
    const [editingServico, setEditingServico] = useState(null);
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
                duracao: '60'
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
            setEditingServico(null);
            showNotification('Serviço atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
            showNotification('Não foi possível atualizar o serviço', 'error');
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

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="space-y-6">
                {notification && (
                    <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{notification.message}</AlertDescription>
                    </Alert>
                )}

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) {
                        setNovoServico({
                            nome: '',
                            descricao: '',
                            preco: '',
                            temDuracao: true,
                            duracao: '60'
                        });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>Novo Serviço</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes do novo serviço que você deseja oferecer.
                            </DialogDescription>
                        </DialogHeader>
                        <ServiceForm
                            isEditing={false}
                            initialData={novoServico}
                            onSubmit={adicionarServico}
                            submitLabel="Adicionar Serviço"
                            loading={loading}
                        />
                    </DialogContent>
                </Dialog>

                <div className="grid gap-4">
                    {servicos.map((servico) => (
                        <Card key={servico.id} className="w-full bg-white shadow-sm hover:shadow transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {servico.nome}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{servico.descricao}</p>
                                        <div className="mt-2 flex items-center gap-4">
                                            <p className="text-base font-medium text-green-600">
                                                {formatarPreco(servico.preco)}
                                            </p>
                                            {servico.temDuracao && (
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {formatarDuracao(servico.duracao)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>Editar Serviço</DialogTitle>
                                                </DialogHeader>
                                                <ServiceForm
                                                    isEditing={true}
                                                    initialData={servico}
                                                    onSubmit={atualizarServico}
                                                    submitLabel="Salvar Alterações"
                                                    loading={loading}
                                                />
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-8 w-8">
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
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => removerServico(servico)}>
                                                        Remover
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {servicos.length === 0 && (
                    <Card className="w-full">
                        <CardContent className="p-8 flex flex-col items-center gap-4">
                            <AlertCircle className="h-12 w-12 text-gray-400" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">Nenhum serviço cadastrado</h3>
                                <p className="mt-1 text-gray-500">
                                    Comece adicionando seu primeiro serviço clicando no botão acima.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MeusServicos;