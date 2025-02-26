"use client"
import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebaseConfig';

// Configurar localização para português
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const diasDaSemana = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

export default function MinhaAgenda() {
  const [data, setData] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date()); // Data/mês exibido no calendário
  const [horariosServicos, setHorariosServicos] = useState({});
  const [agendamentosNaData, setAgendamentosNaData] = useState([]);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duracaoSessao, setDuracaoSessao] = useState(60); // em minutos
  const [duracaoIntervalo, setDuracaoIntervalo] = useState(10); // em minutos
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' ou 'list' para mobile
  const [isMobile, setIsMobile] = useState(false);
  const [agendamentosPorDia, setAgendamentosPorDia] = useState({});

  // Detectar se é dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkMobile);
    
    // Limpar listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para obter o nome do mês
  const obterNomeMes = (mesIndex) => {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return meses[mesIndex];
  };
  
  // Função auxiliar para obter o número do mês a partir do nome
  const obterNumeroMes = (nomeMes) => {
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho", 
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    
    // Normaliza o nome do mês removendo acentos e convertendo para minúsculas
    const normalizado = nomeMes.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Tentar encontrar correspondência exata
    let index = meses.findIndex(m => 
      m.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizado
    );
    
    // Se não encontrou, tenta uma correspondência parcial
    if (index === -1) {
      index = meses.findIndex(m => 
        m.normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizado) ||
        normalizado.includes(m.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      );
    }
    
    return index;
  };

  // Formata o horário para exibição
  const formatarHorario = (horario) => {
    if (!horario) return '';
    return horario.replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => `${h}h${m !== '00' ? m : ''}`);
  };

  // Formatar data para exibição no formato brasileiro
  const formatarDataParaExibicao = (data) => {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR');
  };

  // Buscar todos os agendamentos
  const buscarTodosAgendamentos = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("Usuário não autenticado");
        return [];
      }
      
      // Buscar o documento do usuário
      const userDocRef = doc(db, 'usuario', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        console.error("Documento do usuário não encontrado");
        return [];
      }
      
      const userData = userDocSnap.data();
      
      // Verificar se há a subcoleção 'agendamentos' no documento
      if (!userData.agendamentos) {
        console.log("Campo 'agendamentos' não encontrado no documento do usuário");
        return [];
      }
      
      // Converter objeto de agendamentos em array
      const agendamentos = userData.agendamentos;
      
      console.log("Total de agendamentos encontrados:", agendamentos.length);
      
      return agendamentos;
    } catch (error) {
      console.error("Erro ao buscar todos agendamentos:", error);
      return [];
    }
  };

  // Buscar agendamentos para a data selecionada
  const buscarAgendamentos = async (dataSelec) => {
    if (!todosAgendamentos || !todosAgendamentos.length) return [];
    
    // Formatar a data selecionada para comparação
    const diaSelecionado = dataSelec.getDate();
    const mesSelecionado = dataSelec.getMonth();
    const anoSelecionado = dataSelec.getFullYear();
    
    console.log(`🔍 Buscando agendamentos para: ${diaSelecionado}/${mesSelecionado + 1}/${anoSelecionado}`);
    
    // Filtrar agendamentos que correspondem à data selecionada
    const agendamentosFiltrados = todosAgendamentos.filter(agendamento => {
      if (!agendamento.data) return false;
      
      // Extrair componentes da data do agendamento
      const dataRegex = /(\d+)\s+de\s+([^\d]+)\s+de\s+(\d+)/i;
      const match = agendamento.data.match(dataRegex);
      if (!match) return false;
      
      const dia = parseInt(match[1]);
      const mesNome = match[2].trim();
      const ano = parseInt(match[3]);
      const mes = obterNumeroMes(mesNome);
      
      if (mes === -1) return false;
      
      // Verificar se a data corresponde
      const dataCorresponde = dia === diaSelecionado && mes === mesSelecionado && ano === anoSelecionado;
      
      if (dataCorresponde) {
        console.log(`✅ Agendamento encontrado: ${agendamento.servicoNome || 'Agendamento'} - ${agendamento.horarioInicio}`);
      }
      
      return dataCorresponde;
    });
    
    console.log(`🔍 Total de agendamentos encontrados: ${agendamentosFiltrados.length}`);
    return agendamentosFiltrados;
  };

  // Preparar o objeto para mapear dias com agendamentos
  const mapearDiasComAgendamentos = (eventos) => {
    const mapa = {};
    
    if (!eventos || !eventos.length) return mapa;
    
    eventos.forEach(evento => {
      if (!evento.start) return;
      
      const dataKey = `${evento.start.getFullYear()}-${evento.start.getMonth()}-${evento.start.getDate()}`;
      
      if (!mapa[dataKey]) {
        mapa[dataKey] = [];
      }
      
      mapa[dataKey].push(evento);
    });
    
    return mapa;
  };

  // Converter agendamentos para eventos do calendário
  const converterParaEventos = (agendamentos) => {
    if (!agendamentos || !agendamentos.length) return [];
    
    console.log("Convertendo agendamentos para eventos...");
    console.log("Total de agendamentos a converter:", agendamentos.length);
    
    const eventosConvertidos = agendamentos.map(agendamento => {
      // Extrair data e horário usando regex mais flexível
      let dataRegex = /(\d+)\s+de\s+([^\d]+)\s+de\s+(\d+)/i;
      const dataMatch = agendamento.data?.match(dataRegex);
      
      if (!dataMatch) {
        console.log("Formato de data inválido:", agendamento.data);
        return null;
      }
      
      const dia = parseInt(dataMatch[1]);
      const mesNome = dataMatch[2].trim();
      const ano = parseInt(dataMatch[3]);
      const mes = obterNumeroMes(mesNome);
      
      if (mes === -1) {
        console.log("Nome de mês não reconhecido:", mesNome);
        return null;
      }
      
      // Horário de início
      const horarioInicio = agendamento.horarioInicio || "00:00";
      const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
      
      if (isNaN(horaInicio) || isNaN(minInicio)) {
        console.log("Formato de horário inválido:", horarioInicio);
        return null;
      }
      
      // Calcular data e hora completa
      try {
        const inicio = new Date(ano, mes, dia, horaInicio, minInicio);
        
        // Calcular fim baseado na duração ou horário fim
        let fim;
        if (agendamento.horarioFim) {
          const [horaFim, minFim] = agendamento.horarioFim.split(':').map(Number);
          fim = new Date(ano, mes, dia, horaFim, minFim);
        } else {
          // Adicionar duração em minutos
          const duracao = agendamento.servicoDuracao || duracaoSessao;
          fim = new Date(inicio.getTime() + duracao * 60000);
        }
        
        return {
          id: agendamento.id,
          // Aqui vamos deixar o título vazio para não mostrar nome de serviço nos dias
          title: '', // Removido o nome do serviço conforme solicitado
          start: inicio,
          end: fim,
          resource: agendamento
        };
      } catch (error) {
        console.error(`Erro ao criar evento para data ${dia}/${mes+1}/${ano}:`, error);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`✅ Eventos convertidos com sucesso: ${eventosConvertidos.length}/${agendamentos.length}`);
    
    // Atualizar o mapa de dias com agendamentos
    setAgendamentosPorDia(mapearDiasComAgendamentos(eventosConvertidos));
    
    return eventosConvertidos;
  };

  // Carregar dados iniciais
  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        
        // Obter o usuário autenticado
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.error("Usuário não autenticado");
          setLoading(false);
          return;
        }
        
        // Buscar o documento do usuário com o UID do usuário autenticado
        const docRef = doc(db, 'usuario', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setHorariosServicos(userData.horariosServicos || {});
          
          // Atualizar a duração da sessão e intervalo se existirem no banco
          if (userData.duracaoDaSessao) {
            setDuracaoSessao(userData.duracaoDaSessao);
          }
          
          if (userData.duracaoIntervalo) {
            setDuracaoIntervalo(userData.duracaoIntervalo);
          }
          
          // Buscar todos os agendamentos
          const agendamentos = await buscarTodosAgendamentos();
          setTodosAgendamentos(agendamentos);
          
          // Converter para eventos
          if (agendamentos.length > 0) {
            console.log("Agendamentos encontrados, convertendo para eventos...");
            const eventosConvertidos = converterParaEventos(agendamentos);
            console.log("Total de eventos criados:", eventosConvertidos.length);
            setEventos(eventosConvertidos);
          }
          
          // Filtrar agendamentos para a data atual
          const agendamentosHoje = await buscarAgendamentos(data);
          setAgendamentosNaData(agendamentosHoje);
        } else {
          console.log("Documento do usuário não encontrado");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  // Atualiza os agendamentos quando a data muda
  useEffect(() => {
    const atualizarAgendamentos = async () => {
      setLoading(true);
      
      try {
        // Buscar agendamentos para esta data
        const agendamentos = await buscarAgendamentos(data);
        setAgendamentosNaData(agendamentos);
        console.log("Agendamentos encontrados para a data:", agendamentos.length);
      } catch (error) {
        console.error("Erro ao atualizar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (todosAgendamentos.length > 0) {
      atualizarAgendamentos();
    }
  }, [data, todosAgendamentos]);
  
  // Atualiza os eventos quando o mês muda
  useEffect(() => {
    console.log("Data do calendário mudou para:", currentDate.toLocaleDateString());
    // Força re-renderização dos eventos
    setEventos([...eventos]); 
  }, [currentDate]);

  const onSelectDate = (novaData) => {
    console.log("Data selecionada:", novaData);
    setData(novaData);
    
    // Em dispositivos móveis, mudar para visualização de lista após selecionar uma data
    if (isMobile) {
      setViewMode('list');
    }
  };

  // Personalizar como os eventos são exibidos (bolinhas lado a lado sem texto)
  const eventStyleGetter = (event, start, end, isSelected) => {
    const status = event.resource?.status || 'pendente';
    const style = {
      backgroundColor: status === 'confirmado' ? '#52c41a' : 
                      status === 'cancelado' ? '#f5222d' : '#faad14',
      borderRadius: '50%',
      width: '8px',
      height: '8px',
      display: 'inline-block',
      margin: '0 1px',
      position: 'static'  // Importante para prevenir posicionamento absoluto
    };
    
    return {
      style,
      className: 'event-dot'
    };
  };
  
  // Personalizar o estilo dos dias no calendário
  const dayPropGetter = (date) => {
    // Verificar se é a data selecionada - comparação mais explícita
    const isSelected = 
      date.getDate() === data.getDate() &&
      date.getMonth() === data.getMonth() &&
      date.getFullYear() === data.getFullYear();
    
    // Verificar se tem agendamentos neste dia
    const dataKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hasAppointment = agendamentosPorDia[dataKey] && agendamentosPorDia[dataKey].length > 0;
    
    // Adicionar classes e estilo inline
    return {
      className: `${isSelected ? 'selected-day' : ''} ${hasAppointment ? 'has-appointment' : ''}`.trim(),
      style: isSelected ? { 
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        borderRadius: '5px'
      } : {}
    };
  };

  // Alternar entre visualizações em mobile
  const toggleViewMode = () => {
    setViewMode(viewMode === 'calendar' ? 'list' : 'calendar');
  };

  // Lista de todos os eventos ordenados por data para visualização mobile
  const eventosOrdenados = eventos.slice().sort((a, b) => a.start - b.start);

  // Agrupar eventos por data para visualização em lista
  const eventosAgrupados = eventosOrdenados.reduce((groups, event) => {
    const date = event.start.toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Minha Agenda</h1>
      
      {/* Botões de alternância para mobile */}
      {isMobile && (
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 text-center rounded-md text-sm ${viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
          >
            Calendário
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 text-center rounded-md text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
          >
            Agendamentos
          </button>
        </div>
      )}
      
      {/* Layout para desktop */}
      {!isMobile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Calendário de Agendamentos</h2>
            <div className="h-[500px]">
              <Calendar
                localizer={localizer}
                events={eventos}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                dayPropGetter={dayPropGetter}
                onSelectEvent={(event) => {
                  console.log("Evento selecionado:", event);
                  onSelectDate(event.start);
                }}
                date={currentDate}
                onNavigate={(newDate) => {
                  console.log("Navegação para:", newDate);
                  setCurrentDate(newDate);
                }}
                onSelectSlot={({ start }) => {
                  console.log("Slot selecionado:", start);
                  onSelectDate(new Date(start));
                }}
                selectable
                views={['month', 'week', 'day']}
                defaultView="month"
                messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia"
                }}
                components={{
                  month: {
                    dateHeader: ({ date }) => {
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      if (!isCurrentMonth) return null;
                      return <span>{date.getDate()}</span>;
                    }
                  }
                }}
                fixedWeeks={false}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">
              Agendamentos para {formatarDataParaExibicao(data)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({diasDaSemana[data.getDay()]})
              </span>
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : agendamentosNaData.length > 0 ? (
              <div className="space-y-3">
                {agendamentosNaData.map((agendamento, idx) => (
                  <div 
                    key={idx} 
                    className="border border-gray-200 rounded-md p-4 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-800 text-lg">
                        {formatarHorario(agendamento.horarioInicio)} 
                        {agendamento.horarioFim ? ` - ${formatarHorario(agendamento.horarioFim)}` : ''}
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agendamento.status === 'confirmado' ? 'bg-green-100 text-green-800' : 
                        agendamento.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agendamento.status || 'Pendente'}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-1">
                      <span className="font-medium">Serviço:</span> {agendamento.servicoNome}
                    </p>
                    
                    {agendamento.servicoDuracao && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">Duração:</span> {agendamento.servicoDuracao} min
                      </p>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700">Cliente:</p>
                      {agendamento.cliente ? (
                        <>
                          <p className="text-sm">{agendamento.cliente.nome}</p>
                          {agendamento.cliente.telefone && (
                            <p className="text-sm">{agendamento.cliente.telefone}</p>
                          )}
                          {agendamento.cliente.email && (
                            <p className="text-sm text-gray-500">{agendamento.cliente.email}</p>
                          )}
                        </>
                      ) : (
                        <>
                          {agendamento.nome && <p className="text-sm">{agendamento.nome}</p>}
                          {agendamento.telefone && <p className="text-sm">{agendamento.telefone}</p>}
                          {agendamento.email && <p className="text-sm text-gray-500">{agendamento.email}</p>}
                          {agendamento.cpf && <p className="text-sm">CPF: {agendamento.cpf}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">
                Não há agendamentos para este dia.
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Layout para mobile */}
      {isMobile && viewMode === 'calendar' && (
        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <div className="h-[400px]">
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              onSelectEvent={(event) => {
                console.log("Evento selecionado:", event);
                onSelectDate(event.start);
              }}
              date={currentDate}
              onNavigate={(newDate) => {
                console.log("Navegação para:", newDate);
                setCurrentDate(newDate);
              }}
              onSelectSlot={({ start }) => {
                console.log("Slot selecionado:", start);
                onSelectDate(new Date(start));
              }}
              selectable
              toolbar={true}
              views={['month']}
              defaultView="month"
              messages={{
                next: ">",
                previous: "<",
                today: "Hoje",
                month: "Mês"
              }}
              components={{
                toolbar: (props) => (
                  <div className="rbc-toolbar">
                    <span className="rbc-btn-group">
                      <button type="button" onClick={() => props.onNavigate('TODAY')}>Hoje</button>
                      <button type="button" onClick={() => props.onNavigate('PREV')}>{"<"}</button>
                      <button type="button" onClick={() => props.onNavigate('NEXT')}>{">"}</button>
                    </span>
                    <span className="rbc-toolbar-label">{props.label}</span>
                  </div>
                ),
                month: {
                  dateHeader: ({ date }) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    if (!isCurrentMonth) return null;
                    return <span>{date.getDate()}</span>;
                  }
                }
              }}
              fixedWeeks={false}
            />
          </div>
        </div>
      )}
      
      {isMobile && viewMode === 'list' && (
        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-3">
            Agendamentos para {formatarDataParaExibicao(data)}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({diasDaSemana[data.getDay()]})
            </span>
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : agendamentosNaData.length > 0 ? (
            <div className="space-y-3">
              {agendamentosNaData.map((agendamento, idx) => (
                <div 
                  key={idx} 
                  className="border border-gray-200 rounded-md p-3 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-gray-800 text-base">
                      {formatarHorario(agendamento.horarioInicio)} 
                      {agendamento.horarioFim ? ` - ${formatarHorario(agendamento.horarioFim)}` : ''}
                    </p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agendamento.status === 'confirmado' ? 'bg-green-100 text-green-800' : 
                      agendamento.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {agendamento.status || 'Pendente'}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-1">
                    <span className="font-medium">Serviço:</span> {agendamento.servicoNome}
                  </p>
                  
                  {agendamento.servicoDuracao && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Duração:</span> {agendamento.servicoDuracao} min
                    </p>
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700">Cliente:</p>
                    {agendamento.cliente ? (
                      <>
                        <p className="text-sm">{agendamento.cliente.nome}</p>
                        {agendamento.cliente.telefone && (
                          <p className="text-sm">{agendamento.cliente.telefone}</p>
                        )}
                        {agendamento.cliente.email && (
                          <p className="text-sm text-gray-500">{agendamento.cliente.email}</p>
                        )}
                      </>
                    ) : (
                      <>
                        {agendamento.nome && <p className="text-sm">{agendamento.nome}</p>}
                        {agendamento.telefone && <p className="text-sm">{agendamento.telefone}</p>}
                        {agendamento.email && <p className="text-sm text-gray-500">{agendamento.email}</p>}
                        {agendamento.cpf && <p className="text-sm">CPF: {agendamento.cpf}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              Não há agendamentos para este dia.
            </p>
          )}
        </div>
      )}

      {/* Seção para próximos agendamentos na visualização mobile */}
      {isMobile && viewMode === 'list' && (
        <div className="bg-white p-3 rounded-lg shadow">
          <h3 className="text-md font-semibold mb-3 border-b pb-2">Próximos Agendamentos</h3>
          {Object.keys(eventosAgrupados).length > 0 ? (
            Object.keys(eventosAgrupados).map(date => (
              <div key={date} className="mb-3">
                <h4 className="text-sm font-medium bg-gray-50 p-2 rounded-md">{date}</h4>
                <div className="pl-2">
                  {eventosAgrupados[date].map((event, idx) => (
                    <div 
                      key={idx} 
                      className="py-2 border-b border-gray-100 flex justify-between items-center"
                      onClick={() => onSelectDate(event.start)}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {event.start.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-xs text-gray-600">{event.resource?.servicoNome}</p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.resource?.status === 'confirmado' ? 'bg-green-100 text-green-800' : 
                          event.resource?.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.resource?.status || 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">
              Não há agendamentos futuros.
            </p>
          )}
        </div>
      )}

      {/* Estilos globais */}
      <style jsx global>{`
  /* Remova o fundo cinza dos dias de outros meses */
  .rbc-off-range {
    visibility: hidden;
    background-color: transparent !important;
  }
  
  /* Remova o fundo cinza de qualquer célula */
  .rbc-day-bg {
    background-color: white !important;
  }
  
  /* Ajustes para os eventos personalizados */
  .custom-event-wrapper {
    display: inline-block;
    background: none;
    border: none;
  }
  
  /* Centralizar os eventos */
  .rbc-row-segment {
    display: flex !important;
    justify-content: center !important;
    padding-right: 0 !important;
    padding-left: 0 !important;
  }
  .selected-day {
  background-color: rgba(66, 153, 225, 0.2) !important;
  border-radius: 5px !important;
  font-weight: bold !important;
}

/* Certifique-se de que o dia selecionado tenha precedência sobre outros estilos */
.rbc-day-bg.selected-day {
  background-color: rgba(66, 153, 225, 0.2) !important;
  z-index: 1;
}

/* Sobrescrever o estilo de hoje se for o dia selecionado */
.rbc-day-bg.rbc-today.selected-day {
  background-color: rgba(66, 153, 225, 0.3) !important;
}
  /* Limpar os estilos padrão dos eventos */
  .rbc-event {
    background: none;
    border: none;
    box-shadow: none;
    margin: 0;
    padding: 0;
  }
`}</style>


    </div>
  );
}