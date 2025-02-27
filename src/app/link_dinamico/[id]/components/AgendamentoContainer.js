"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';
import { useParams, useRouter } from 'next/navigation';
import { 
  ServiceSelection, 
  CalendarSelection, 
  ClientDataForm 
} from './AgendamentoSteps';
import PaymentComponent from './AgendamentoPagamento';

export default function AgendamentoContainer() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // Estados principais
  const [currentStep, setCurrentStep] = useState(1); // 1: Serviços, 2: Calendário, 3: Dados do Cliente, 4: Pagamento
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dados carregados do Firestore
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [duracaoIntervalo, setDuracaoIntervalo] = useState(0);
  const [existingAppointments, setExistingAppointments] = useState([]);
  
  // Estados de seleção
  const [selectedService, setSelectedService] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  
  // Dados do cliente
  const [clienteData, setClienteData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Estados de pagamento
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, failed
  const [agendamentoId, setAgendamentoId] = useState(null); // ID para referência do pagamento
  const [tempAppointmentData, setTempAppointmentData] = useState(null); // Armazenamento temporário do agendamento

  // Constantes
  const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const nomesDosMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Function to check if a new appointment overlaps with existing ones
  const checkAppointmentOverlap = (existingAppointments, newDate, newStartTime, newEndTime) => {
    // Make sure we have all the required parameters and they are valid
    if (!existingAppointments || !Array.isArray(existingAppointments) || !newDate || !newStartTime || !newEndTime) {
      console.log("Invalid parameters for overlap check:", { existingAppointments, newDate, newStartTime, newEndTime });
      return false;
    }
    
    try {
      // Convert new appointment times to minutes for comparison
      const [newStartHour, newStartMin] = newStartTime.split(':').map(Number);
      const [newEndHour, newEndMin] = newEndTime.split(':').map(Number);
      const newStartMinutes = newStartHour * 60 + newStartMin;
      const newEndMinutes = newEndHour * 60 + newEndMin;
      
      // Format the new date string to match the format in Firebase
      const dataFormatada = `${newDate.getDate()} de ${nomesDosMeses[newDate.getMonth()]} de ${newDate.getFullYear()}`;
      
      // Check each existing appointment for overlap
      return existingAppointments.some(appointment => {
        // Skip if the appointment is invalid or missing required fields
        if (!appointment || !appointment.data || !appointment.horarioInicio || !appointment.horarioFim) {
          return false;
        }
        
        // Skip canceled appointments
        if (appointment.status === "cancelado") return false;
        
        // Extract date from the appointment (assuming format is "DD de Month de YYYY às HH:MM UTC-3")
        const appointmentDateParts = appointment.data.split(' às ')[0].trim();
        
        // If not the same date, no overlap
        if (appointmentDateParts !== dataFormatada) return false;
        
        // Convert existing appointment times to minutes
        const [startHour, startMin] = appointment.horarioInicio.split(':').map(Number);
        const [endHour, endMin] = appointment.horarioFim.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        // Check for overlap: new appointment starts before existing ends AND new appointment ends after existing starts
        const hasOverlap = (newStartMinutes < endMinutes && newEndMinutes > startMinutes);
        
        if (hasOverlap) {
          console.log(`Conflict detected! New slot ${newStartTime}-${newEndTime} overlaps with existing ${appointment.horarioInicio}-${appointment.horarioFim} on ${dataFormatada}`);
        }
        
        return hasOverlap;
      });
    } catch (error) {
      console.error("Error checking appointment overlap:", error);
      return false; // In case of error, don't block the slot
    }
  };

  // Carrega os dados do profissional
  useEffect(() => {
    if (!id) {
      setError("ID não fornecido na URL");
      setLoading(false);
      return;
    }

    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const storedAppointmentId = localStorage.getItem('currentAppointment');
    const storedAppointmentData = localStorage.getItem('appointmentData');
    
    // If we have status and appointment data in localStorage, we're returning from payment
    if (status && storedAppointmentId && storedAppointmentData) {
      try {
        const appointmentData = JSON.parse(storedAppointmentData);
        setAgendamentoId(storedAppointmentId);
        setTempAppointmentData(appointmentData);
        setCurrentStep(4); // Go to payment step
        
        if (status === 'approved' || status === 'success') {
          setPaymentStatus('success');
        } else if (status === 'rejected' || status === 'failure') {
          setPaymentStatus('failed');
        }
      } catch (e) {
        console.error("Error parsing stored appointment data", e);
      }
    }

    async function carregarDados() {
      try {
        setLoading(true);

        const docRef = doc(db, "usuario", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Profissional não encontrado");
          setLoading(false);
          return;
        }

        const userData = docSnap.data();
        console.log("Dados do usuário:", userData);

        // Only consider confirmed appointments or pending confirmations for conflict checking
        const existingAppointments = (userData.agendamentos || []).filter(
          appt => appt.status === "confirmado" || appt.status === "pending_confirmation"
        );
        setExistingAppointments(existingAppointments);

        if (userData.duracaoIntervalo !== undefined) {
          setDuracaoIntervalo(parseInt(userData.duracaoIntervalo, 10) || 0);
        }

        const servicosData = userData.servicos;
        const servicosArray = [];

        if (servicosData && typeof servicosData === 'object') {
          Object.keys(servicosData).forEach(key => {
            const servico = servicosData[key];
            if (servico && typeof servico === 'object') {
              servicosArray.push({
                id: servico.id || key,
                nome: servico.nome || "Serviço sem nome",
                descricao: servico.descricao || "",
                preco: servico.preco || "0.00",
                duracao: servico.duracao || userData.duracaoBaseSessao || "60"
              });
            }
          });
        }

        setServicos(servicosArray);

        const horariosData = userData.horariosServicos;
        const horariosObj = {};

        if (horariosData && typeof horariosData === 'object') {
          Object.keys(horariosData).forEach(diaSemana => {
            const diaHorarios = horariosData[diaSemana];
            if (diaHorarios && typeof diaHorarios === 'object') {
              if (!horariosObj[diaSemana]) {
                horariosObj[diaSemana] = [];
              }

              Object.keys(diaHorarios).forEach(slotKey => {
                const slot = diaHorarios[slotKey];
                if (slot && typeof slot === 'object') {
                  horariosObj[diaSemana].push({
                    id: slotKey,
                    inicio: slot.inicio || "08:00",
                    fim: slot.fim || "18:00",
                    numeroSessao: slot.numeroSessao || 1
                  });
                }
              });
            }
          });
        }

        setHorarios(horariosObj);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [id]);

  // Manipuladores de eventos para a navegação entre etapas
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleBackToServices = () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
  };

  const handleBackToCalendar = () => {
    setCurrentStep(2);
  };

  const handleBackToClientData = () => {
    setCurrentStep(3);
  };

  const handleContinueToClientData = () => {
    if (selectedService && selectedDate && selectedTime) {
      setCurrentStep(3);
    }
  };

  // Funções para manipulação do calendário
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();

    const daysArray = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = new Date(year, month, -firstDayOfWeek + i + 1);
      daysArray.push({
        date: day,
        inMonth: false,
        hasSlots: false
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      const diaSemana = diasSemana[day.getDay()];

      const hasSlots = horarios[diaSemana] && horarios[diaSemana].length > 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = day < today;

      daysArray.push({
        date: day,
        inMonth: true,
        hasSlots: hasSlots && !isPast,
        isPast: isPast
      });
    }

    const remainingDays = 7 - (daysArray.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const day = new Date(year, month + 1, i);
        daysArray.push({
          date: day,
          inMonth: false,
          hasSlots: false
        });
      }
    }

    return daysArray;
  };

  const goToPreviousMonth = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (previousMonth.getMonth() < today.getMonth() && previousMonth.getFullYear() <= today.getFullYear()) {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      setCurrentMonth(previousMonth);
    }
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    if (!day.inMonth || !day.hasSlots) return;

    // Keep a reference to the date for immediate use
    const selectedDay = day.date;
    setSelectedDate(selectedDay);
    setSelectedTime(null);
    
    // Use the day reference directly rather than depending on state update
    const diaSemana = diasSemana[selectedDay.getDay()];
    generateTimeSlots(diaSemana, selectedDay);
  };

  const handleTimeSelect = (slot) => {
    if (slot.conflicted) {
      alert("Este horário já está agendado.");
      return;
    }
    setSelectedTime(slot);
  };

  const generateTimeSlots = (diaSemana, dateToUse = null) => {
    // Use the provided date or fall back to the state value
    const dateForChecking = dateToUse || selectedDate;
    
    if (!selectedService || !horarios[diaSemana] || !dateForChecking) {
      setTimeSlots([]);
      return;
    }

    const slots = [];
    const daySchedules = horarios[diaSemana];

    // Debug log to check parameters
    console.log("Generating time slots for:", {
      date: dateForChecking,
      diaSemana,
      hasAppointments: existingAppointments && existingAppointments.length > 0
    });

    daySchedules.forEach(schedule => {
      const [startHour, startMin] = schedule.inicio.split(':').map(Number);
      const [endHour, endMin] = schedule.fim.split(':').map(Number);

      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;

      const serviceDuration = parseInt(selectedService.duracao, 10);
      const sessionInterval = duracaoIntervalo;
      const totalSlotTime = serviceDuration + sessionInterval;

      let currentTime = startTotalMinutes;

      while (currentTime + serviceDuration <= endTotalMinutes) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTimeHour = Math.floor((currentTime + serviceDuration) / 60);
        const endTimeMinute = (currentTime + serviceDuration) % 60;
        const endTimeString = `${endTimeHour.toString().padStart(2, '0')}:${endTimeMinute.toString().padStart(2, '0')}`;

        // Use the provided date for conflict checking
        const hasConflict = checkAppointmentOverlap(
          existingAppointments, 
          dateForChecking, 
          timeString, 
          endTimeString
        );

        const slotId = `${timeString}-${endTimeString}`;
        
        slots.push({
          id: slotId,
          inicio: timeString,
          fim: endTimeString,
          inicioMinutos: currentTime,
          fimMinutos: currentTime + serviceDuration,
          conflicted: hasConflict
        });

        currentTime += totalSlotTime;
      }
    });

    console.log(`Generated ${slots.length} time slots, including ${slots.filter(s => s.conflicted).length} conflicted slots`);
    setTimeSlots(slots);
  };

  // Validação de formulário
  const validateForm = () => {
    const errors = {};
    
    if (!clienteData.nome.trim()) errors.nome = "Nome é obrigatório";
    
    // Validação básica de CPF (apenas verifica se tem 11 números)
    const cpfClean = clienteData.cpf.replace(/\D/g, '');
    if (!cpfClean || cpfClean.length !== 11) errors.cpf = "CPF inválido";
    
    // Validação básica de telefone
    const phoneClean = clienteData.telefone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 10) errors.telefone = "Telefone inválido";
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clienteData.email.trim() || !emailRegex.test(clienteData.email)) {
      errors.email = "Email inválido";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers para input dos dados do cliente
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClienteData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro específico quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Formatação de dados
  const formatCPF = (value) => {
    const cpfClean = value.replace(/\D/g, '');
    
    if (cpfClean.length <= 3) return cpfClean;
    if (cpfClean.length <= 6) return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3)}`;
    if (cpfClean.length <= 9) return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6)}`;
    return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6, 9)}-${cpfClean.slice(9, 11)}`;
  };

  const formatPhone = (value) => {
    const phoneClean = value.replace(/\D/g, '');
    
    if (phoneClean.length <= 2) return phoneClean;
    if (phoneClean.length <= 6) return `(${phoneClean.slice(0, 2)}) ${phoneClean.slice(2)}`;
    if (phoneClean.length <= 10) return `(${phoneClean.slice(0, 2)}) ${phoneClean.slice(2, 6)}-${phoneClean.slice(6)}`;
    return `(${phoneClean.slice(0, 2)}) ${phoneClean.slice(2, 7)}-${phoneClean.slice(7, 11)}`;
  };

  const handleCPFChange = (e) => {
    const formattedValue = formatCPF(e.target.value);
    setClienteData(prev => ({
      ...prev,
      cpf: formattedValue
    }));
    
    if (formErrors.cpf) {
      setFormErrors(prev => ({
        ...prev,
        cpf: ''
      }));
    }
  };

  const handlePhoneChange = (e) => {
    const formattedValue = formatPhone(e.target.value);
    setClienteData(prev => ({
      ...prev,
      telefone: formattedValue
    }));
    
    if (formErrors.telefone) {
      setFormErrors(prev => ({
        ...prev,
        telefone: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleContinueToPayment();
  };

  const formatDate = (date) => {
    if (!date) return '';

    const dia = date.getDate();
    const mes = nomesDosMeses[date.getMonth()];
    const ano = date.getFullYear();
    const diaSemanaTexto = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];

    return `${diaSemanaTexto}, ${dia} de ${mes} de ${ano}`;
  };

  // Processamento de pagamento e finalização
  const handleContinueToPayment = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Verificar novamente se o horário já foi agendado (para evitar race conditions)
        const hasConflict = checkAppointmentOverlap(
          existingAppointments,
          selectedDate,
          selectedTime.inicio,
          selectedTime.fim
        );

        if (hasConflict) {
          alert("Este horário já foi agendado por outro cliente. Por favor, escolha outro horário.");
          setCurrentStep(2);
          setLoading(false);
          return;
        }
        
        // Formatar a data selecionada para o formato que você deseja armazenar
        const dataFormatada = `${selectedDate.getDate()} de ${nomesDosMeses[selectedDate.getMonth()]} de ${selectedDate.getFullYear()} às ${selectedTime.inicio} UTC-3`;
        
        // Obter a data atual para dataCriacao e ultimaAtualizacao
        const agora = new Date();
        const dataCriacaoFormatada = `${agora.getDate()} de ${nomesDosMeses[agora.getMonth()]} de ${agora.getFullYear()} às ${agora.getHours()}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')} UTC-3`;
        
        // Criar o objeto de agendamento (apenas temporariamente, não salvar no Firebase ainda)
        const novoAgendamento = {
          cliente: {
            cpf: clienteData.cpf,
            email: clienteData.email,
            nome: clienteData.nome,
            telefone: clienteData.telefone
          },
          data: dataFormatada,
          dataCriacao: dataCriacaoFormatada,
          horarioFim: selectedTime.fim,
          horarioInicio: selectedTime.inicio,
          profissionalId: id, // ID do profissional da URL
          servicoDuracao: selectedService.duracao,
          servicoId: selectedService.id,
          servicoNome: selectedService.nome,
          servicoPreco: selectedService.preco,
          status: "aguardando_pagamento", // Status inicial
          ultimaAtualizacao: dataCriacaoFormatada,
          agendamentoId: `AGEND-${Date.now()}` // ID único para o agendamento
        };
        
        // Guardar referência do ID para uso no componente de pagamento
        setAgendamentoId(novoAgendamento.agendamentoId);
        setTempAppointmentData(novoAgendamento);
        
        // Armazenar dados do agendamento no localStorage para recuperar após redirecionamento do pagamento
        localStorage.setItem('currentAppointment', novoAgendamento.agendamentoId);
        localStorage.setItem('appointmentData', JSON.stringify(novoAgendamento));
        
        // Reservar temporariamente o horário para evitar conflitos
        // Criamos um documento temporário que será atualizado para 'confirmado' após o pagamento
        // ou será removido se o pagamento falhar
        const userDocRef = doc(db, "usuario", id);
        
        // Atualizar o documento do usuário adicionando reserva temporária
        await updateDoc(userDocRef, {
          reservasTemporarias: arrayUnion({
            ...novoAgendamento,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // expira em 30 minutos
          })
        });
        
        // Avançar para o passo de pagamento
        setCurrentStep(4);
        
      } catch (error) {
        console.error("Erro ao reservar horário temporariamente:", error);
        alert("Erro ao processar a reserva. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      
      // Get the appointment data - either from tempAppointmentData or from localStorage
      const appointmentToConfirm = tempAppointmentData || 
        JSON.parse(localStorage.getItem('appointmentData'));
      
      if (!appointmentToConfirm) {
        throw new Error("Dados do agendamento não encontrados");
      }
      
      // Update the appointment status to "confirmado"
      const updatedAppointment = {
        ...appointmentToConfirm,
        status: "confirmado",
        ultimaAtualizacao: new Date().toISOString()
      };
      
      // Reference to the user document in Firestore
      const userDocRef = doc(db, "usuario", id);
      
      // Fetch current data
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        throw new Error("Dados do profissional não encontrados");
      }
      
      // Get current appointments
      const userData = docSnap.data();
      const currentAppointments = userData.agendamentos || [];
      
      // Add the new confirmed appointment
      await updateDoc(userDocRef, {
        agendamentos: arrayUnion(updatedAppointment),
        // Remove from temporary reservations if exists
        reservasTemporarias: (userData.reservasTemporarias || []).filter(
          res => res.agendamentoId !== updatedAppointment.agendamentoId
        )
      });
      
      // Update local state
      setPaymentStatus('success');
      setExistingAppointments([...existingAppointments, updatedAppointment]);
      
      // Clean up localStorage
      localStorage.removeItem('currentAppointment');
      localStorage.removeItem('appointmentData');
      
      // Show success message
      alert("Pagamento confirmado! Seu agendamento foi concluído com sucesso.");
      
      // Optional: redirect to a confirmation page
      // router.push(`/agendamento/confirmacao/${updatedAppointment.agendamentoId}`);
      
    } catch (error) {
      console.error("Erro ao confirmar agendamento após pagamento:", error);
      alert("Seu pagamento foi processado, mas houve um erro ao finalizar seu agendamento. Entre em contato com o suporte.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = async (error) => {
    console.error("Erro no pagamento:", error);
    setPaymentStatus('failed');
    
    try {
      // Remove temporary reservation
      if (agendamentoId) {
        const userDocRef = doc(db, "usuario", id);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const reservas = userData.reservasTemporarias || [];
          
          // Filter out the failed reservation
          const updatedReservas = reservas.filter(
            res => res.agendamentoId !== agendamentoId
          );
          
          await updateDoc(userDocRef, {
            reservasTemporarias: updatedReservas
          });
        }
      }
    } catch (e) {
      console.error("Erro ao remover reserva temporária:", e);
    }
    
    alert("Ocorreu um erro durante o processamento do pagamento. Por favor, tente novamente.");
  };

  // Loading state
  if (loading && currentStep === 1) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-purple-600 border-r-transparent border-b-purple-600 border-l-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-3xl mx-auto my-8 shadow-sm">
        <p className="font-medium text-lg mb-2">Erro:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg my-4">
      {/* Título da página */}
      <h1 className="text-2xl font-bold text-purple-800 mb-6 text-center">Agendamento Online</h1>
      
      {/* Indicador de progresso dos passos */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="w-full absolute top-1/2 h-1 bg-gray-200 -z-10"></div>
          
          {/* Passos atualizados para incluir Pagamento */}
          <div className={`flex flex-col items-center relative`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
            <span className="text-xs font-medium mt-2">Serviço</span>
          </div>
          
          <div className={`flex flex-col items-center relative`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
            <span className="text-xs font-medium mt-2">Data e Hora</span>
          </div>
          
          <div className={`flex flex-col items-center relative`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
            <span className="text-xs font-medium mt-2">Seus Dados</span>
          </div>
          
          <div className={`flex flex-col items-center relative`}>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 4 ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>4</div>
            <span className="text-xs font-medium mt-2">Pagamento</span>
          </div>
        </div>
      </div>
  
      {/* Conteúdo dos passos */}
      <div className="bg-white rounded-lg">
        {currentStep === 1 && (
          <ServiceSelection 
            servicos={servicos} 
            onServiceSelect={handleServiceSelect} 
          />
        )}
  
        {currentStep === 2 && selectedService && (
          <CalendarSelection
            selectedService={selectedService}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            timeSlots={timeSlots}
            duracaoIntervalo={duracaoIntervalo}
            nomesDosMeses={nomesDosMeses}
            formatDate={formatDate}
            generateCalendarDays={generateCalendarDays}
            goToPreviousMonth={goToPreviousMonth}
            goToNextMonth={goToNextMonth}
            handleBackToServices={handleBackToServices}
            handleDateSelect={handleDateSelect}
            handleTimeSelect={handleTimeSelect}
            handleContinueToClientData={handleContinueToClientData}
          />
        )}
  
        {currentStep === 3 && selectedService && selectedDate && selectedTime && (
          <ClientDataForm
            clienteData={clienteData}
            formErrors={formErrors}
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            loading={loading}
            formatDate={formatDate}
            handleBackToCalendar={handleBackToCalendar}
            handleInputChange={handleInputChange}
            handleCPFChange={handleCPFChange}
            handlePhoneChange={handlePhoneChange}
            handleSubmit={handleSubmit}
          />
        )}
  
        {currentStep === 4 && (tempAppointmentData || (selectedService && agendamentoId)) && (
          <PaymentComponent
            id={id}
            agendamentoId={agendamentoId}
            selectedService={selectedService || (tempAppointmentData ? {
              nome: tempAppointmentData.servicoNome,
              preco: tempAppointmentData.servicoPreco,
              duracao: tempAppointmentData.servicoDuracao
            } : null)}
            selectedDate={selectedDate || (tempAppointmentData ? new Date(tempAppointmentData.data.split(' às ')[0]) : null)}
            selectedTime={selectedTime || (tempAppointmentData ? {
              inicio: tempAppointmentData.horarioInicio,
              fim: tempAppointmentData.horarioFim
            } : null)}
            clienteData={clienteData.nome ? clienteData : (tempAppointmentData ? tempAppointmentData.cliente : null)}
            loading={loading}
            formatDate={formatDate}
            handleBackToClientData={handleBackToClientData}
            handlePaymentSuccess={handlePaymentSuccess}
            handlePaymentError={handlePaymentError}
            paymentStatus={paymentStatus}
          />
        )}
      </div>
      
      {/* Rodapé com informações adicionais */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Em caso de dúvidas, entre em contato pelo telefone de atendimento</p>
        <p className="mt-2">© {new Date().getFullYear()} - Sistema de Agendamento Online</p>
      </div>
    </div>
  );}