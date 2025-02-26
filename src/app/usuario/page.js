'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, UserPlus, Save, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { firebaseApp } from '../../../firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function GerenciarColaboradores() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ show: false, success: false, message: '' });

  // Carregar dados do Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'usuario', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.colaboradores) {
            setColaboradores(data.colaboradores);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setFeedback({
          show: true,
          success: false,
          message: 'Erro ao carregar os colaboradores.'
        });
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Função para salvar ou atualizar um colaborador
  const salvarColaborador = async (e) => {
    e.preventDefault();
    
    if (!nome || !telefone || !cargo || !email || !senha) {
      setFeedback({
        show: true,
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFeedback({
        show: true,
        success: false,
        message: 'Por favor, insira um email válido.'
      });
      return;
    }
    
    if (!auth.currentUser) {
      setFeedback({
        show: true,
        success: false,
        message: 'Usuário não está logado!'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const novoColaborador = {
        nome,
        telefone,
        cargo,
        email,
        senha, // Nota: em produção, considere não armazenar senhas em texto simples
        dataCriacao: new Date().toISOString()
      };
      
      let novosColaboradores = [];
      
      if (editandoIndex !== null) {
        // Editando um colaborador existente
        novosColaboradores = [...colaboradores];
        novosColaboradores[editandoIndex] = {
          ...novosColaboradores[editandoIndex],
          nome,
          telefone,
          cargo,
          email,
          senha
        };
      } else {
        // Adicionando um novo colaborador
        novosColaboradores = [...colaboradores, novoColaborador];
      }
      
      // Atualizar no Firestore
      const docRef = doc(db, 'usuario', auth.currentUser.uid);
      await updateDoc(docRef, {
        colaboradores: novosColaboradores
      });
      
      // Atualizar estado local
      setColaboradores(novosColaboradores);
      
      // Feedback de sucesso
      setFeedback({
        show: true,
        success: true,
        message: editandoIndex !== null 
          ? `Colaborador ${nome} atualizado com sucesso!` 
          : `Colaborador ${nome} adicionado com sucesso!`
      });
      
      // Limpar campos e estado de edição
      limparFormulario();
      
      // Esconder feedback após 3 segundos
      setTimeout(() => {
        setFeedback({ show: false, success: false, message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      setFeedback({
        show: true,
        success: false,
        message: 'Erro ao salvar o colaborador. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para iniciar a edição de um colaborador
  const editarColaborador = (index) => {
    const colaborador = colaboradores[index];
    setNome(colaborador.nome);
    setTelefone(colaborador.telefone);
    setCargo(colaborador.cargo);
    setEmail(colaborador.email || '');
    setSenha(colaborador.senha || '');
    setEditandoIndex(index);
  };

  // Função para excluir um colaborador
  const excluirColaborador = async (index) => {
    if (!window.confirm('Tem certeza que deseja excluir este colaborador?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Remover do array
      const novosColaboradores = colaboradores.filter((_, i) => i !== index);
      
      // Atualizar no Firestore
      const docRef = doc(db, 'usuario', auth.currentUser.uid);
      await updateDoc(docRef, {
        colaboradores: novosColaboradores
      });
      
      // Atualizar estado local
      setColaboradores(novosColaboradores);
      
      // Feedback de sucesso
      setFeedback({
        show: true,
        success: true,
        message: 'Colaborador excluído com sucesso!'
      });
      
      // Se estiver editando o mesmo que foi excluído, cancele a edição
      if (editandoIndex === index) {
        limparFormulario();
      }
      
      // Esconder feedback após 3 segundos
      setTimeout(() => {
        setFeedback({ show: false, success: false, message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      setFeedback({
        show: true,
        success: false,
        message: 'Erro ao excluir o colaborador. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar o formulário e o estado de edição
  const limparFormulario = () => {
    setNome('');
    setTelefone('');
    setCargo('');
    setEmail('');
    setSenha('');
    setEditandoIndex(null);
  };

  // Função para alternar visibilidade da senha
  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  if (loading && colaboradores.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Carregando colaboradores...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex items-center">
          <UserPlus className="h-5 w-5 mr-2 text-slate-600" />
          <CardTitle>{editandoIndex !== null ? 'Editar Colaborador' : 'Adicionar Colaborador'}</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {feedback.show && (
          <Alert className={feedback.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {feedback.message}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={salvarColaborador} className="space-y-4 bg-slate-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome" className="text-sm font-medium block mb-2">
                Nome do Colaborador *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gabriel Mello"
              />
            </div>
            
            <div>
              <Label htmlFor="telefone" className="text-sm font-medium block mb-2">
                Telefone *
              </Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium block mb-2">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="cargo" className="text-sm font-medium block mb-2">
                Cargo *
              </Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Desenvolvedor"
              />
            </div>
            
            <div>
              <Label htmlFor="senha" className="text-sm font-medium block mb-2">
                Senha *
              </Label>
              <div className="flex">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha"
                  className="rounded-r-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleMostrarSenha}
                  className="rounded-l-none border-l-0"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : (editandoIndex !== null ? 'Atualizar' : 'Salvar')}
            </Button>
            
            {editandoIndex !== null && (
              <Button 
                type="button"
                variant="outline"
                onClick={limparFormulario}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </form>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Lista de Colaboradores</h3>
          
          {colaboradores.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Nenhum colaborador adicionado ainda.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaboradores.map((colaborador, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{colaborador.nome}</TableCell>
                      <TableCell>{colaborador.email}</TableCell>
                      <TableCell>{colaborador.telefone}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editarColaborador(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluirColaborador(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}