"use client";

import { useState } from 'react';
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Check, 
  X, 
  MoreVertical 
} from 'lucide-react';

// Dados de exemplo de agendamentos
const EXAMPLE_BOOKINGS = [
  {
    id: 1,
    date: '2024-02-15',
    time: '09:00',
    client: {
      name: 'João Silva',
      phone: '(11) 98765-4321',
      email: 'joao.silva@email.com'
    },
    service: 'Corte de Cabelo',
    status: 'confirmed'
  },
  {
    id: 2,
    date: '2024-02-15',
    time: '14:00',
    client: {
      name: 'Maria Souza',
      phone: '(11) 91234-5678',
      email: 'maria.souza@email.com'
    },
    service: 'Coloração',
    status: 'pending'
  },
  {
    id: 3,
    date: '2024-02-20',
    time: '10:00',
    client: {
      name: 'Pedro Santos',
      phone: '(11) 99876-5432',
      email: 'pedro.santos@email.com'
    },
    service: 'Barba',
    status: 'confirmed'
  }
];

export default function AdminScheduling() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Utilitários de data
  const formatMonth = (date) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Gerar dias do mês
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  
  // Preenche os dias vazios antes do primeiro dia do mês
  const startingDayOfWeek = daysInMonth[0].getDay();
  const emptyDays = Array(startingDayOfWeek).fill(null);

  // Encontrar agendamentos para uma data específica
  const getBookingsForDate = (dateString) => {
    return EXAMPLE_BOOKINGS.filter(booking => booking.date === dateString);
  };

  // Renderizar detalhes dos agendamentos
  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className={`
          p-4 flex items-center 
          ${selectedBooking.status === 'confirmed' 
            ? 'bg-green-500' 
            : selectedBooking.status === 'pending'
            ? 'bg-yellow-500'
            : 'bg-red-500'
          } text-white
        `}>
          <Calendar className="mr-3 w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">{selectedBooking.service}</h2>
            <p className="text-sm">{formatDate(selectedBooking.date)} - {selectedBooking.time}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center">
            <User className="mr-3 w-5 h-5 text-gray-600" />
            <span className="font-medium">{selectedBooking.client.name}</span>
          </div>
          <div className="flex items-center">
            <Phone className="mr-3 w-5 h-5 text-gray-600" />
            <span>{selectedBooking.client.phone}</span>
          </div>
          <div className="flex items-center">
            <Mail className="mr-3 w-5 h-5 text-gray-600" />
            <span>{selectedBooking.client.email}</span>
          </div>

          <div className="flex space-x-2">
            {selectedBooking.status === 'pending' && (
              <>
                <button 
                  className="flex-1 bg-green-500 text-white p-2 rounded-lg flex items-center justify-center"
                  onClick={() => {
                    // Lógica para confirmar agendamento
                    alert('Agendamento confirmado!');
                  }}
                >
                  <Check className="mr-2 w-5 h-5" /> Confirmar
                </button>
                <button 
                  className="flex-1 bg-red-500 text-white p-2 rounded-lg flex items-center justify-center"
                  onClick={() => {
                    // Lógica para cancelar agendamento
                    alert('Agendamento cancelado!');
                  }}
                >
                  <X className="mr-2 w-5 h-5" /> Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar modal de agendamentos do dia
  const renderDayBookings = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayBookings = getBookingsForDate(dateString);

    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="bg-blue-600 text-white p-4 flex items-center">
          <Calendar className="mr-3 w-6 h-6" />
          <h2 className="text-xl font-bold">{formatDate(dateString)}</h2>
        </div>

        {dayBookings.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhum agendamento para este dia
          </div>
        ) : (
          <div className="divide-y">
            {dayBookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="w-full text-left p-4 hover:bg-gray-100 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{booking.client.name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.time} - {booking.service}
                  </p>
                </div>
                <div className="flex items-center">
                  {booking.status === 'confirmed' ? (
                    <span className="text-green-500">Confirmado</span>
                  ) : (
                    <span className="text-yellow-500">Pendente</span>
                  )}
                  <MoreVertical className="ml-2 w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabeçalho do Calendário */}
        <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Agenda de Clientes</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="hover:bg-blue-700 p-2 rounded-full transition-colors"
            >
              {'<'}
            </button>
            <span className="font-semibold">
              {formatMonth(currentMonth)}
            </span>
            <button 
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="hover:bg-blue-700 p-2 rounded-full transition-colors"
            >
              {'>'}
            </button>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 gap-2 p-4 bg-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
          ))}
          
          {/* Dias em branco antes do primeiro dia do mês */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className=""></div>
          ))}

          {/* Dias do mês */}
          {daysInMonth.map((day) => {
            const dateString = day.toISOString().split('T')[0];
            const dayBookings = getBookingsForDate(dateString);

            return (
              <button 
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  setSelectedBooking(null);
                }}
                className={`
                  p-2 rounded-lg text-center 
                  ${dayBookings.length > 0 ? 'bg-blue-50' : ''}
                  hover:bg-blue-200 transition-colors
                  relative
                `}
              >
                {day.getDate()}
                {/* Indicador de agendamentos */}
                {dayBookings.length > 0 && (
                  <span 
                    className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal de Detalhes do Dia */}
        {selectedDate && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedDate(null);
                setSelectedBooking(null);
              }
            }}
          >
            {!selectedBooking 
              ? renderDayBookings(selectedDate)
              : renderBookingDetails()}
          </div>
        )}
      </div>
    </div>
  );
}