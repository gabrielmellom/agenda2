"use client";

import React, { useState, useEffect } from 'react';
import MercadoPagoCheckout from './MercadoPagoCheckout';

export default function PaymentComponent({
  id,
  agendamentoId,
  selectedService,
  selectedDate,
  selectedTime,
  clienteData,
  loading,
  formatDate,
  handleBackToClientData,
  handlePaymentSuccess,
  handlePaymentError
}) {
  const [paymentState, setPaymentState] = useState('initial'); // initial, processing, success, error
  const [paymentError, setPaymentError] = useState(null);
  
  // Check if returning from payment
  useEffect(() => {
    // Get URL params to check payment status
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const storedAppointmentId = localStorage.getItem('currentAppointment');
    
    // If we're returning from a payment and have status info and the appointment matches
    if (status && storedAppointmentId === agendamentoId) {
      if (status === 'approved' || status === 'success') {
        setPaymentState('success');
        // Call success handler with slight delay to allow component to render
        setTimeout(() => {
          if (handlePaymentSuccess) handlePaymentSuccess();
        }, 1000);
      } else if (status === 'rejected' || status === 'failure') {
        setPaymentState('error');
        setPaymentError('Seu pagamento não foi aprovado. Por favor, tente novamente com outro método de pagamento.');
        if (handlePaymentError) handlePaymentError(new Error('Payment rejected'));
      } else if (status === 'pending') {
        setPaymentState('processing');
        // Setup polling to check status
        const checkInterval = setInterval(async () => {
          try {
            const response = await fetch(`/api/mercadoPago/status?appointmentId=${agendamentoId}`);
            const data = await response.json();
            
            if (data.status === 'approved' || data.status === 'completed') {
              clearInterval(checkInterval);
              setPaymentState('success');
              if (handlePaymentSuccess) handlePaymentSuccess();
            } else if (data.status === 'rejected' || data.status === 'cancelled') {
              clearInterval(checkInterval);
              setPaymentState('error');
              setPaymentError('Seu pagamento não foi aprovado ou foi cancelado.');
              if (handlePaymentError) handlePaymentError(new Error('Payment rejected or cancelled'));
            }
          } catch (err) {
            console.error('Erro ao verificar status:', err);
          }
        }, 5000);
        
        // Cleanup interval when component unmounts
        return () => {
          clearInterval(checkInterval);
        };
      }
      
      // Clear the stored appointment ID
      localStorage.removeItem('currentAppointment');
    }
  }, [agendamentoId, handlePaymentSuccess, handlePaymentError]);
  
  // Local success handler
  const onLocalSuccess = () => {
    setPaymentState('success');
    if (handlePaymentSuccess) handlePaymentSuccess();
  };
  
  // Local error handler
  const onLocalError = (error) => {
    setPaymentState('error');
    setPaymentError(error.message || 'Ocorreu um erro ao processar seu pagamento');
    if (handlePaymentError) handlePaymentError(error);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={handleBackToClientData}
          className="text-purple-600 flex items-center mb-4 hover:text-purple-800 transition-colors"
          disabled={loading || paymentState === 'processing' || paymentState === 'success'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar para dados pessoais
        </button>

        <h2 className="text-xl font-bold mb-4 text-purple-700">Pagamento</h2>

        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium text-purple-800">{selectedService.nome}</span>
            </div>
            <span className="text-sm text-gray-500">Ref: {agendamentoId}</span>
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
          <div className="flex items-center mb-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700">{clienteData.nome}</span>
          </div>
          <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
            <span className="text-sm text-gray-700">Valor total:</span>
            <span className="font-bold text-lg text-purple-800">
              R$ {parseFloat(selectedService.preco).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Estado de pagamento em processamento */}
      {paymentState === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent mb-4"></div>
          <h3 className="text-lg font-semibold mb-2 text-blue-800">Processando seu pagamento</h3>
          <p className="text-blue-700">
            Estamos verificando o status do seu pagamento. Por favor, aguarde um momento...
          </p>
        </div>
      )}

      {/* Estado de pagamento com sucesso */}
      {paymentState === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2 text-green-800">Pagamento realizado com sucesso!</h3>
          <p className="text-green-700 mb-4">
            Seu agendamento foi confirmado. Em breve você receberá um e-mail com os detalhes.
          </p>
        </div>
      )}

      {/* Estado de erro no pagamento */}
      {paymentState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2 text-red-800">Erro no pagamento</h3>
            <p className="text-red-700 mb-4">{paymentError || "Ocorreu um erro ao processar seu pagamento"}</p>
            <button
              onClick={() => setPaymentState('initial')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Componente do Mercado Pago */}
      {paymentState === 'initial' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Finalizar Pagamento
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <MercadoPagoCheckout 
              servicoNome={selectedService.nome}
              servicoPreco={selectedService.preco}
              clienteEmail={clienteData.email}
              clienteNome={clienteData.nome}
              agendamentoId={agendamentoId}
              profissionalId={id}
              onSuccess={onLocalSuccess}
              onError={onLocalError}
            />
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="flex items-start mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Seu agendamento só será confirmado após a conclusão do pagamento. O sistema processará automaticamente seu pedido após a confirmação.
          </span>
        </p>
        <p className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            Seus dados estão protegidos. O pagamento é processado em ambiente seguro pelo Mercado Pago.
          </span>
        </p>
      </div>
    </div>
  );
}