"use client";

import { useState } from 'react';

export default function AgendamentoPage({ params }) {
  // Estados para controlar as etapas e seleções
  const [etapa, setEtapa] = useState(1);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [dadosCliente, setDadosCliente] = useState({
    nome: '',
    telefone: '',
    email: ''
  });

  // Dados mockados (substituir por dados reais do backend)
  const datasDisponiveis = {
    '2024-02-15': ['09:00', '10:00', '14:00', '15:00'],
    '2024-02-20': ['09:00', '11:00', '14:00', '16:00']
  };

  const servicos = [
    { id: 1, nome: 'Corte de Cabelo', preco: 50 },
    { id: 2, nome: 'Coloração', preco: 100 },
    { id: 3, nome: 'Barba', preco: 30 }
  ];

  // Renderizar Etapa 1: Seleção de Data
  const renderizarEtapa1 = () => {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Escolha uma Data</h1>
        
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(datasDisponiveis).map((data) => (
            <button
              key={data}
              onClick={() => {
                setDataSelecionada(data);
                setEtapa(2);
              }}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              {new Date(data).toLocaleDateString()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar Etapa 2: Seleção de Horário e Serviço
  const renderizarEtapa2 = () => {
    const horariosDisponiveis = datasDisponiveis[dataSelecionada] || [];

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Escolha Horário e Serviço</h1>
        
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Horários Disponíveis</h2>
          <div className="grid grid-cols-3 gap-2">
            {horariosDisponiveis.map((horario) => (
              <button
                key={horario}
                onClick={() => setHorarioSelecionado(horario)}
                className={`p-2 rounded ${
                  horarioSelecionado === horario 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {horario}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Serviços</h2>
          <div className="space-y-2">
            {servicos.map((servico) => (
              <button
                key={servico.id}
                onClick={() => setServicoSelecionado(servico)}
                className={`w-full p-2 text-left rounded ${
                  servicoSelecionado?.id === servico.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {servico.nome} - R$ {servico.preco}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Observações adicionais"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full mt-4 p-2 border rounded"
        />

        <button
          onClick={() => setEtapa(3)}
          disabled={!horarioSelecionado || !servicoSelecionado}
          className="w-full mt-4 bg-green-500 text-white p-2 rounded disabled:bg-gray-300"
        >
          Próximo
        </button>
      </div>
    );
  };

  // Renderizar Etapa 3: Confirmação e Pagamento
  const renderizarEtapa3 = () => {
    const handlePagamento = (metodo) => {
      alert(`Pagamento via ${metodo} processado!`);
    };

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Finalizar Agendamento</h1>
        
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Resumo</h2>
          <p>Data: {new Date(dataSelecionada).toLocaleDateString()}</p>
          <p>Horário: {horarioSelecionado}</p>
          <p>Serviço: {servicoSelecionado.nome}</p>
          <p>Valor: R$ {servicoSelecionado.preco}</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Nome Completo"
            value={dadosCliente.nome}
            onChange={(e) => setDadosCliente({...dadosCliente, nome: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={dadosCliente.telefone}
            onChange={(e) => setDadosCliente({...dadosCliente, telefone: e.target.value})}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={dadosCliente.email}
            onChange={(e) => setDadosCliente({...dadosCliente, email: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePagamento('PIX')}
            className="bg-green-500 text-white p-2 rounded"
          >
            Pagar com PIX
          </button>
          <button
            onClick={() => handlePagamento('Cartão')}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Pagar com Cartão
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Log do código único do link */}
      {console.log('Código do link:', params?.slug)}
      
      {etapa === 1 && renderizarEtapa1()}
      {etapa === 2 && renderizarEtapa2()}
      {etapa === 3 && renderizarEtapa3()}
    </div>
  );
}