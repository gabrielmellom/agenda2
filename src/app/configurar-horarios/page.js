'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firebaseApp } from '../../../firebaseConfig';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const WeekDays = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo'
};

export default function ScheduleConfig() {
  const [duracaoDaSessao, setDuracaoDaSessao] = useState('60');
  const [duracaoIntervalo, setDuracaoIntervalo] = useState('10');
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState({
    segunda: [{ inicio: '', fim: '', numeroSessao: 0 }],
    terca: [{ inicio: '', fim: '', numeroSessao: 0 }],
    quarta: [{ inicio: '', fim: '', numeroSessao: 0 }],
    quinta: [{ inicio: '', fim: '', numeroSessao: 0 }],
    sexta: [{ inicio: '', fim: '', numeroSessao: 0 }],
    sabado: [{ inicio: '', fim: '', numeroSessao: 0 }],
    domingo: [{ inicio: '', fim: '', numeroSessao: 0 }]
  });

  // Função para converter tempo em minutos
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Função para calcular número de sessões possíveis
  const calculateSessions = (start, end) => {
    if (!start || !end || !duracaoDaSessao || !duracaoIntervalo) return 0;

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    if (startMinutes >= endMinutes) return 0;

    const totalMinutes = endMinutes - startMinutes;
    const sessionDurationNum = parseInt(duracaoDaSessao);
    const breakDurationNum = parseInt(duracaoIntervalo);
    
    // Tempo total necessário para uma sessão completa (sessão + intervalo)
    const slotDuration = sessionDurationNum + breakDurationNum;
    
    // Número de sessões possíveis neste período
    return Math.floor(totalMinutes / slotDuration);
  };

  // Função para preparar dados para o Firebase
  const prepareDataForFirebase = (currentSchedules) => {
    const horariosServicos = {};
    Object.entries(currentSchedules).forEach(([day, turns]) => {
      const validTurns = turns.filter(turn => turn.inicio && turn.fim);
      if (validTurns.length > 0) {
        horariosServicos[day] = validTurns;
      }
    });
    return horariosServicos;
  };

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

        // Se o documento não existe, cria com valores iniciais
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            duracaoDaSessao: parseInt(duracaoDaSessao),
            duracaoIntervalo: parseInt(duracaoIntervalo),
            horariosServicos: {}
          });
          return;
        }
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.duracaoDaSessao) {
            setDuracaoDaSessao(data.duracaoDaSessao.toString());
          }
          if (data.duracaoIntervalo) {
            setDuracaoIntervalo(data.duracaoIntervalo.toString());
          }
          if (data.horariosServicos) {
            setSchedules(currentSchedules => ({
              ...currentSchedules,
              ...data.horariosServicos
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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

  // Handler para mudanças nos horários
  const handleScheduleChange = (day, index, field, value) => {
    setSchedules(prev => {
      const newSchedules = { ...prev };
      const turn = { ...newSchedules[day][index] };
      turn[field] = value;
      
      // Recalcula o número de sessões quando mudar início ou fim
      if (field === 'inicio' || field === 'fim') {
        turn.numeroSessao = calculateSessions(turn.inicio, turn.fim);
      }
      
      newSchedules[day][index] = turn;
      return newSchedules;
    });
  };

  // Adicionar novo turno
  const addTurn = (day) => {
    setSchedules(prev => ({
      ...prev,
      [day]: [...prev[day], { inicio: '', fim: '', numeroSessao: 0 }]
    }));
  };

  // Remover turno e salvar imediatamente no Firebase
  const removeTurn = async (day, index) => {
    // Primeiro, atualize o estado local
    const newSchedules = {
      ...schedules
    };
    newSchedules[day] = newSchedules[day].filter((_, i) => i !== index);
    setSchedules(newSchedules);
    
    // Depois, salve no Firebase
    if (auth.currentUser) {
      try {
        setLoading(true);
        const docRef = doc(db, 'usuario', auth.currentUser.uid);
        
        // Preparar dados para o Firebase
        const horariosServicos = prepareDataForFirebase(newSchedules);
        
        await updateDoc(docRef, {
          horariosServicos
        });
        
        // Feedback visual opcional
        console.log('Horário removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover horário:', error);
        alert('Erro ao remover o horário.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Usuário não está logado!');
    }
  };

  // Salvar dados no Firebase
  const saveToDatabase = async () => {
    if (!auth.currentUser) {
      alert('Usuário não está logado!');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'usuario', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      // Preparar dados para o Firebase
      const horariosServicos = prepareDataForFirebase(schedules);

      const dadosParaSalvar = {
        duracaoDaSessao: parseInt(duracaoDaSessao),
        duracaoIntervalo: parseInt(duracaoIntervalo),
        horariosServicos
      };

      if (!docSnap.exists()) {
        // Se o documento não existe, cria com setDoc
        await setDoc(docRef, dadosParaSalvar);
      } else {
        // Se existe, atualiza com updateDoc
        await updateDoc(docRef, dadosParaSalvar);
      }

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Carregando configurações...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Configuração de Horários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Duração da Sessão (minutos)
            </label>
            <Input
              type="number"
              min="1"
              value={duracaoDaSessao}
              onChange={(e) => setDuracaoDaSessao(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">
              Duração do Intervalo (minutos)
            </label>
            <Input
              type="number"
              min="1"
              value={duracaoIntervalo}
              onChange={(e) => setDuracaoIntervalo(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {Object.entries(WeekDays).map(([day, label]) => (
            <AccordionItem key={day} value={day}>
              <AccordionTrigger className="text-lg font-medium">
                {label}-feira
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  {schedules[day]?.map((turn, index) => (
                    <div key={index} className="space-y-4 bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Turno {index + 1}</h4>
                        {schedules[day].length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTurn(day, index)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Horário Inicial</label>
                          <Input
                            type="time"
                            value={turn.inicio}
                            onChange={(e) => handleScheduleChange(day, index, 'inicio', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Horário Final</label>
                          <Input
                            type="time"
                            value={turn.fim}
                            onChange={(e) => handleScheduleChange(day, index, 'fim', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {turn.inicio && turn.fim && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Número de sessões possíveis: {turn.numeroSessao}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTurn(day)}
                    className="w-full"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Turno
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button 
          onClick={saveToDatabase}
          className="w-full mt-4"
          size="lg"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}