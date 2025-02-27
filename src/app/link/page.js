"use client";

import React, { useState, useEffect } from 'react';
import { Share, Calendar, Clock, User, ChevronRight, MessageSquare, Check, Copy } from 'lucide-react';
import { addDays } from 'date-fns';

// Reusable Components - Keeping these as they are good
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8 h-64">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
      <p className="mt-4 text-gray-600">Carregando...</p>
    </div>
  </div>
);

const LoginPrompt = () => (
  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
    <p className="font-medium">Você precisa estar logado para acessar esta página.</p>
    <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
      Fazer Login
    </button>
  </div>
);

const AppointmentItem = ({ appointment }) => {
  const { date, time } = formatAppointmentDateTime(appointment);

  return (
    <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-3">
        {/* Client Info - Grouped together */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 rounded-full p-2 text-blue-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{appointment.cliente.nome}</h3>
            <p className="text-sm text-gray-500">{appointment.cliente.telefone} | {appointment.cliente.email}</p>
          </div>
        </div>

        {/* Status Badge - Moved to top right for quick visibility */}
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold">
          {appointment.status}
        </span>
      </div>

      {/* Appointment Details - Date, Time, Service, Price - In a grid for better layout */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center space-x-1 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{appointment.horarioInicio} - {appointment.horarioFim}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <MessageSquare className="w-4 h-4" />
          <span>{appointment.servicoNome}</span>
        </div>
        <div className="font-medium text-gray-800">
          R$ {appointment.servicoPreco}
        </div>
      </div>

      {/* Details Button - Kept at the bottom */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
        <button className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm">
          <span>Detalhes</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


const ShareModal = ({ showShareModal, setShowShareModal, fixedBookingLink, copyToClipboard, copied, shareViaWhatsApp }) => (
  showShareModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Compartilhar Link de Agendamento</h2>

        <div>
          <p className="text-sm text-gray-600 mb-4">
            Compartilhe este link com seus clientes para que eles possam agendar um horário diretamente.
          </p>

          <div className="flex mb-4">
            <input
              type="text"
              readOnly
              value={fixedBookingLink}
              className="flex-1 p-2 border rounded-l-md bg-gray-50 text-sm"
            />
            <button
              className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex items-center"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="mb-2">
            <button
              className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
              onClick={shareViaWhatsApp}
            >
              <span>Enviar via WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            onClick={() => setShowShareModal(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
);

// Helper Functions - Keeping these as they are functional
const isAfter = (date1, date2) => date1 > date2;
const isBefore = (date1, date2) => date1 < date2;

const nomesDosMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatAppointmentDateTime = (appointment) => {
  const dateParts = appointment.data.split(' às ');
  const datePart = dateParts[0];
  const timePart = dateParts[1].split(' ')[0];

  return {
    date: datePart,
    time: timePart
  };
};

const extractDateFromAppointment = (appointment) => {
  try {
    if (!appointment || !appointment.data) return null;

    const parts = appointment.data.split(' às ');
    const datePart = parts[0];
    const timePart = parts[1].split(' ')[0];

    const day = parseInt(datePart.split(' ')[0]);
    const month = nomesDosMeses.indexOf(datePart.split(' ')[2]);
    const year = parseInt(datePart.split(' ')[4]);

    const [hours, minutes] = timePart.split(':').map(Number);

    return new Date(year, month, day, hours, minutes);
  } catch (e) {
    console.error("Erro ao extrair data do agendamento:", e);
    return null;
  }
};

// Main Component
const DashboardAgendamentos = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState('proximos');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initFirebase = async () => {
        try {
          const { initializeApp, getApps } = await import('firebase/app');
          const { getAuth, onAuthStateChanged } = await import('firebase/auth');
          const { getFirestore } = await import('firebase/firestore');

          const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
          };

          let app;
          const apps = getApps();
          if (apps.length === 0) {
            app = initializeApp(firebaseConfig);
          } else {
            app = apps[0];
          }

          const auth = getAuth(app);
          const db = getFirestore(app);

          onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
              fetchAppointments(db, currentUser.uid);
            } else {
              setLoading(false);
            }
          });
        } catch (error) {
          console.error("Erro ao inicializar Firebase:", error);
          setLoading(false);
        }
      };

      initFirebase();
    }
  }, []);

  const fetchAppointments = async (db, userId) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');

      const userDocRef = doc(db, "usuario", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.agendamentos && Array.isArray(userData.agendamentos)) {
          const sortedAppointments = [...userData.agendamentos]
            .sort((a, b) => {
              const dateA = extractDateFromAppointment(a);
              const dateB = extractDateFromAppointment(b);
              return dateA - dateB;
            });

          setAppointments(sortedAppointments);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const domain = window.location.origin;
    const agendamentoLink = `${domain}/link_dinamico/${user.uid}`;

    navigator.clipboard.writeText(agendamentoLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Não foi possível copiar o link. Por favor, selecione e copie manualmente.');
      });
  };

  const shareViaWhatsApp = () => {
    const domain = window.location.origin;
    const agendamentoLink = `${domain}/link_dinamico/${user.uid}`;
    const message = encodeURIComponent(`Olá! Acesse o link abaixo para agendar seu horário: ${agendamentoLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = extractDateFromAppointment(appointment);
    if (!appointmentDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filtroAtivo === 'proximos') {
      return isAfter(appointmentDate, today) ||
             (appointmentDate.getDate() === today.getDate() &&
              appointmentDate.getMonth() === today.getMonth() &&
              appointmentDate.getFullYear() === today.getFullYear());
    } else if (filtroAtivo === 'hoje') {
      return appointmentDate.getDate() === today.getDate() &&
             appointmentDate.getMonth() === today.getMonth() &&
             appointmentDate.getFullYear() === today.getFullYear();
    } else if (filtroAtivo === 'semana') {
      const nextWeek = addDays(today, 7);
      return isAfter(appointmentDate, today) && isBefore(appointmentDate, nextWeek);
    } else {
      return true; // todos
    }
  });

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  const fixedBookingLink = `${window.location.origin}/link_dinamico/${user.uid}`;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Dashboard Header - Responsive layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Agendamentos</h1>
          <p className="text-gray-600">Gerencie seus próximos atendimentos</p>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Share className="w-5 h-5" />
          <span>Compartilhar Link</span>
        </button>
      </div>

      {/* Filter Buttons - Flex wrap for responsiveness */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltroAtivo('proximos')}
          className={`px-4 py-2 rounded-md ${filtroAtivo === 'proximos' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          Próximos
        </button>
        <button
          onClick={() => setFiltroAtivo('hoje')}
          className={`px-4 py-2 rounded-md ${filtroAtivo === 'hoje' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          Hoje
        </button>
        <button
          onClick={() => setFiltroAtivo('semana')}
          className={`px-4 py-2 rounded-md ${filtroAtivo === 'semana' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setFiltroAtivo('todos')}
          className={`px-4 py-2 rounded-md ${filtroAtivo === 'todos' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          Todos
        </button>
      </div>

      {/* Appointment List - Grid for responsiveness */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold">
              {filtroAtivo === 'proximos' && 'Próximos Agendamentos'}
              {filtroAtivo === 'hoje' && 'Agendamentos de Hoje'}
              {filtroAtivo === 'semana' && 'Agendamentos desta Semana'}
              {filtroAtivo === 'todos' && 'Todos os Agendamentos'}
              <span className="ml-2 text-sm text-gray-500">({filteredAppointments.length})</span>
            </h2>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>Nenhum agendamento encontrado para o filtro selecionado.</p>
            </div>
          ) : (
            <div className="p-4 divide-y divide-gray-100"> {/* Added padding to the list container */}
              {filteredAppointments.map((appointment, index) => (
                <AppointmentItem key={index} appointment={appointment} />
              ))}
            </div>
          )}
        </div>
      </div>


      <ShareModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        fixedBookingLink={fixedBookingLink}
        copyToClipboard={copyToClipboard}
        copied={copied}
        shareViaWhatsApp={shareViaWhatsApp}
      />
    </div>
  );
};

export default DashboardAgendamentos;