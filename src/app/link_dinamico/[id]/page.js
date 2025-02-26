"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useParams } from 'next/navigation';

export default function AgendamentoCalendario() {
  const params = useParams();
  const id = params.id;

  const [currentStep, setCurrentStep] = useState(1); // 1: Serviços, 2: Calendário, 3: Dados do Cliente
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [duracaoIntervalo, setDuracaoIntervalo] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [clienteData, setClienteData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});

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

  useEffect(() => {
    if (!id) {
      setError("ID não fornecido na URL");
      setLoading(false);
      return;
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

        // Store existing appointments for later checking
        const existingAppointments = userData.agendamentos || [];
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

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

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
  };const handleBackToServices = () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
  };

  const handleBackToCalendar = () => {
    setCurrentStep(2);
  };

  const handleContinueToClientData = () => {
    if (selectedService && selectedDate && selectedTime) {
      setCurrentStep(3);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        
        // Criar o objeto de agendamento
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
          status: "confirmado",
          ultimaAtualizacao: dataCriacaoFormatada
        };
        
        // Referência ao documento do usuário no Firestore
        const userDocRef = doc(db, "usuario", id);
        
        // Atualizar o documento do usuário adicionando o agendamento à subcoleção/campo "agendamentos"
        await updateDoc(userDocRef, {
          agendamentos: arrayUnion(novoAgendamento)
        });
        
        // Adicionar o novo agendamento à lista local para evitar duplo agendamento na mesma sessão
        setExistingAppointments(prev => [...prev, novoAgendamento]);
        
        alert("Agendamento realizado com sucesso!");
        
        // Opcional: redirecionar ou limpar o formulário após o sucesso
        // Exemplo de redirecionamento: window.location.href = '/confirmacao';
        // Ou limpar o formulário:
        setCurrentStep(1);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setClienteData({
          nome: '',
          cpf: '',
          telefone: '',
          email: ''
        });
        
      } catch (error) {
        console.error("Erro ao salvar agendamento:", error);
        alert("Erro ao salvar o agendamento. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';

    const dia = date.getDate();
    const mes = nomesDosMeses[date.getMonth()];
    const ano = date.getFullYear();
    const diaSemanaTexto = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];

    return `${diaSemanaTexto}, ${dia} de ${mes} de ${ano}`;
  };

  // Formatar CPF enquanto digita
  const formatCPF = (value) => {
    const cpfClean = value.replace(/\D/g, '');
    
    if (cpfClean.length <= 3) return cpfClean;
    if (cpfClean.length <= 6) return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3)}`;
    if (cpfClean.length <= 9) return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6)}`;
    return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6, 9)}-${cpfClean.slice(9, 11)}`;
  };

  // Formatar telefone enquanto digita
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

  if (loading) {
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
          
          {/* Passos */}
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
        </div>
      </div>

      {/* Conteúdo dos passos */}
      <div className="bg-white rounded-lg">
        {currentStep === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-6 text-purple-700">Escolha o Serviço</h2>

            {servicos.length === 0 ? (
              <div className="bg-yellow-50 p-6 rounded-lg text-yellow-700 text-center border border-yellow-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-medium">Nenhum serviço disponível para este profissional.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicos.map(servico => (
                  <div
                    key={servico.id}
                    className="border border-purple-100 rounded-lg p-5 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors shadow-sm"
                    onClick={() => handleServiceSelect(servico)}
                  >
                    <h3 className="font-semibold text-lg text-purple-800 mb-1">{servico.nome}</h3>
                    {servico.descricao && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{servico.descricao}</p>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-100">
                      <span className="text-gray-600 flex items-center text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {servico.duracao} min
                      </span>
                      <span className="font-bold text-lg text-purple-800">
                        R$ {parseFloat(servico.preco).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && selectedService && (
          <div className="animate-fadeIn">
            <div className="mb-6">
              <button
                onClick={handleBackToServices}
                className="text-purple-600 flex items-center mb-4 hover:text-purple-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar para serviços
              </button>

              <h2 className="text-xl font-bold mb-3 text-purple-700">Escolha a Data e Horário</h2>
              <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 shadow-sm">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium text-purple-800">{selectedService.nome}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-700">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Duração: {selectedService.duracao} min
                  </span>
                  <span className="font-semibold">
                    R$ {parseFloat(selectedService.preco).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {duracaoIntervalo > 0 && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    + {duracaoIntervalo} min de intervalo entre sessões
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6 bg-white rounded-lg border border-purple-100 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-full hover:bg-purple-100 text-purple-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h3 className="text-lg font-semibold text-purple-800">
                  {nomesDosMeses[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-full hover:bg-purple-100 text-purple-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <div key={index} className="text-center text-sm font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => {
                  const isSelected = selectedDate &&
                    day.date.getDate() === selectedDate.getDate() &&
                    day.date.getMonth() === selectedDate.getMonth() &&
                    day.date.getFullYear() === selectedDate.getFullYear();

                  const isToday = new Date().toDateString() === day.date.toDateString();

                  return (
                    <div
                      key={index}
                      className={`
                        p-2 text-center rounded-md text-sm relative
                        ${!day.inMonth ? 'text-gray-300' : day.isPast ? 'text-gray-300' : day.hasSlots ? 'cursor-pointer' : 'text-gray-400'}
                        ${isSelected ? 'bg-purple-600 text-white font-medium' : isToday ? 'bg-purple-100 font-medium' : ''}
                        ${day.inMonth && day.hasSlots && !isSelected ? 'hover:bg-purple-50' : ''}
                      `}
                      onClick={() => day.hasSlots && handleDateSelect(day)}
                    >
                      {day.date.getDate()}
                      {day.inMonth && day.hasSlots && !isSelected && (
                        <div className="h-1 w-1 rounded-full bg-green-500 mx-auto mt-1"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-medium mb-4 text-purple-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horários para {formatDate(selectedDate)}:
                </h3>

                {timeSlots.length === 0 ? (
                  <div className="text-gray-500 text-center p-6 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Não há horários disponíveis para este serviço nesta data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        className={`py-3 px-2 rounded-lg text-center transition-colors relative
                          ${selectedTime === slot
                            ? 'bg-purple-600 text-white shadow-md border border-purple-700'
                            : slot.conflicted
                              ? 'bg-red-50 text-gray-400 border border-red-100 cursor-not-allowed'
                              : 'bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-400 text-gray-800'
                          }`}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={slot.conflicted}
                      >
                        <span className={`${selectedTime === slot ? 'font-medium' : ''}`}>
                          {slot.inicio} - {slot.fim}
                        </span>
                        {slot.conflicted && (
                          <div className="text-xs text-red-500 mt-1 font-medium">
                            Indisponível
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedTime && (
                  <div className="mt-8 flex justify-center">
                    <button
                      className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center"
                      onClick={handleContinueToClientData}
                    >
                      Continuar
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && selectedService && selectedDate && selectedTime && (
          <div className="animate-fadeIn">
            <div className="mb-6">
              <button
                onClick={handleBackToCalendar}
                className="text-purple-600 flex items-center mb-4 hover:text-purple-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Voltar para calendário
              </button>

              <h2 className="text-xl font-bold mb-4 text-purple-700">Seus Dados</h2>

              <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium text-purple-800">{selectedService.nome}</span>
                </div>
                <p className="text-sm my-2 flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(selectedDate)}
                </p>
                <p className="text-sm mb-2 flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedTime.inicio} - {selectedTime.fim} ({selectedService.duracao} min)
                </p>
                <p className="text-sm pt-2 border-t border-purple-200 flex justify-end font-bold text-purple-800">
                  Total: R$ {parseFloat(selectedService.preco).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo*
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={clienteData.nome}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.nome ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Seu nome completo"
                />
                {formErrors.nome && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {formErrors.nome}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF*
                </label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={clienteData.cpf}
                  onChange={handleCPFChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.cpf ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="000.000.000-00"
                  maxLength="14"
                />
                {formErrors.cpf && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {formErrors.cpf}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone*
                </label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={clienteData.telefone}
                  onChange={handlePhoneChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.telefone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                />
                {formErrors.telefone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {formErrors.telefone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={clienteData.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="seu@email.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {formErrors.email}
                  </p>
                )}
              </div>
              
              <p className="text-xs text-gray-500 italic">
                * Todos os campos são obrigatórios
              </p>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full p-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar Agendamento
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Rodapé com informações adicionais */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>Em caso de dúvidas, entre em contato pelo telefone de atendimento</p>
        <p className="mt-2">© {new Date().getFullYear()} - Sistema de Agendamento Online</p>
      </div>
    </div>
  );
}