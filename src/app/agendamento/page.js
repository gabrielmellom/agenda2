"use client";// pages/agendamento.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Agendamento() {
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState({
    nome: '',
    cpf: '',
    telefone: ''
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [paymentGenerated, setPaymentGenerated] = useState(false);
  const [pixCode, setPixCode] = useState('');

  // Simular horários disponíveis com base na data selecionada
  useEffect(() => {
    if (selectedDate) {
      // Aqui você deve buscar os horários disponíveis do seu banco de dados
      // Estou simulando com dados estáticos baseados no que vi na sua imagem
      const times = [
        { id: 0, startTime: '09:00:00', endTime: '11:00:00' },
        { id: 1, startTime: '12:00:00', endTime: '14:00:00' }
      ];
      setAvailableTimes(times);
    }
  }, [selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData({
      ...clientData,
      [name]: value
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmitData = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleConfirmDate = () => {
    setStep(3);
  };
  const handleConfirmPayment = () => {
    // Depois de gerar o pagamento, avançamos para o Passo 4
    setStep(4);
  };

  const generatePayment = () => {
    // Aqui você implementaria a lógica para gerar o código PIX
    setPixCode('00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Sua Empresa6008Sao Paulo62070503***6304D32A');
    setPaymentGenerated(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Agendamento de Consulta</title>
        <meta name="description" content="Agendamento de consulta" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Agendamento de Consulta</h1>
          
          {/* Progresso */}
          <div className="flex justify-between mb-8">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="text-sm mt-1">Seus Dados</span>
            </div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="text-sm mt-1">Data e Hora</span>
            </div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
              <span className="text-sm mt-1">Pagamento</span>
            </div>
          </div>

          {/* Etapa 1: Dados do Cliente */}
          {step === 1 && (
            <form onSubmit={handleSubmitData}>
              <div className="mb-4">
                <label htmlFor="nome" className="block text-gray-700 font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={clientData.nome}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="cpf" className="block text-gray-700 font-medium mb-2">CPF</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={clientData.cpf}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="telefone" className="block text-gray-700 font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={clientData.telefone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </form>
          )}

          {/* Etapa 2: Seleção de Data e Hora */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Selecione uma Data</h2>
              
              {/* Aqui você integraria um componente de calendário */}
              <div className="mb-6 p-4 border border-gray-300 rounded-md">
                <p className="text-center text-gray-500 mb-2">Componente de calendário será integrado aqui</p>
                
                {/* Simulação de seleção de data para fins de demonstração */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[1, 2, 3].map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(new Date(2025, 1, 20 + day))}
                      className={`p-2 text-center border ${
                        selectedDate && selectedDate.getDate() === 20 + day
                          ? 'bg-blue-100 border-blue-500'
                          : 'border-gray-300 hover:bg-gray-100'
                      } rounded-md`}
                    >
                      {`21/02/2025`}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Horários Disponíveis</h2>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {availableTimes.map((time) => (
                      <button
                        key={time.id}
                        onClick={() => handleTimeSelect(time)}
                        className={`p-3 text-center border ${
                          selectedTime && selectedTime.id === time.id
                            ? 'bg-blue-100 border-blue-500'
                            : 'border-gray-300 hover:bg-gray-100'
                        } rounded-md`}
                      >
                        {`${time.startTime} - ${time.endTime}`}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmDate}
                  disabled={!selectedDate || !selectedTime}
                  className={`px-4 py-2 rounded-md ${
                    !selectedDate || !selectedTime
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: Pagamento */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Confirme e Realize o Pagamento</h2>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium mb-2">Resumo do Agendamento</h3>
                <p><span className="font-medium">Nome:</span> {clientData.nome}</p>
                <p><span className="font-medium">Data:</span> {formatDate(selectedDate)}</p>
                <p><span className="font-medium">Horário:</span> {selectedTime.startTime} - {selectedTime.endTime}</p>
              </div>

              {!paymentGenerated ? (
                <button
                  onClick={generatePayment}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Gerar Pagamento via PIX
                </button>
              ) : (
                <div className="border border-gray-300 rounded-md p-4 text-center">
                  <h3 className="font-medium mb-3">Pague com PIX</h3>
                  <div className="bg-white p-4 mx-auto w-48 h-48 mb-4 flex items-center justify-center">
                    <p className="text-gray-500">QR Code do PIX</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Ou copie o código:</p>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={pixCode}
                      readOnly
                      className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(pixCode)}
                      className="absolute right-2 top-2 text-blue-600"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Após o pagamento, você receberá a confirmação do agendamento por e-mail e SMS.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}