"use client";

import { useEffect, useState } from 'react';

const MercadoPagoCheckout = ({ 
  servicoNome, 
  servicoPreco, 
  clienteEmail, 
  clienteNome, 
  agendamentoId, 
  profissionalId,
  onSuccess,
  onError
}) => {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, completed, failed
  
  // Create preference ID on component mount
  useEffect(() => {
    console.log('Enviando dados para criar preferência:', {
      servicoNome, 
      servicoPreco, 
      clienteEmail, 
      clienteNome, 
      agendamentoId,
      profissionalId
    });

    fetch('/api/mercadoPago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        servicoNome, 
        servicoPreco, 
        clienteEmail, 
        clienteNome, 
        agendamentoId,
        profissionalId,
        notificationUrl: `${window.location.origin}/api/mercadoPago/webhook` // Add webhook URL
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro na resposta: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Resposta da API de preferência:', data);
        if (data.preferenceId) {
          setPreferenceId(data.preferenceId);
          
          // Start polling for payment status
          if (data.initPoint) {
            window.mercadoPagoInitPoint = data.initPoint;
          }
        } else {
          throw new Error('preferenceId não encontrado na resposta');
        }
      })
      .catch((error) => {
        console.error('Erro ao criar a preferência:', error);
        setError(error.message || 'Erro ao processar o pagamento');
        if (onError) onError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [servicoNome, servicoPreco, clienteEmail, clienteNome, agendamentoId, profissionalId, onError]);

  // Check payment status periodically
  useEffect(() => {
    let interval;
    
    // Only start polling if we have a preference ID
    if (preferenceId && paymentStatus === 'pending') {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds
    }
    
    // Function to check payment status
    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/mercadoPago/status?preferenceId=${preferenceId}`);
        const data = await response.json();
        
        if (data.status === 'approved' || data.status === 'completed') {
          setPaymentStatus('completed');
          clearInterval(interval);
          if (onSuccess) onSuccess();
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          setPaymentStatus('failed');
          clearInterval(interval);
          setError('Pagamento não aprovado ou cancelado');
          if (onError) onError(new Error('Pagamento não aprovado'));
        }
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [preferenceId, paymentStatus, onSuccess, onError]);

  // Handle external callback from Mercado Pago
  useEffect(() => {
    // Listen for postMessage from parent if in iframe
    function handlePaymentMessage(event) {
      // Make sure the message is from a trusted source
      if (event.origin !== window.location.origin) return;
      
      if (event.data.mercadoPagoStatus === 'success') {
        setPaymentStatus('completed');
        if (onSuccess) onSuccess();
      } else if (event.data.mercadoPagoStatus === 'failure') {
        setPaymentStatus('failed');
        setError('Falha no pagamento');
        if (onError) onError(new Error('Falha no pagamento'));
      }
    }
    
    window.addEventListener('message', handlePaymentMessage);
    
    // Register a global callback that Mercado Pago can call
    window.mercadoPagoCallback = (status) => {
      if (status === 'success') {
        setPaymentStatus('completed');
        if (onSuccess) onSuccess();
      } else {
        setPaymentStatus('failed');
        setError('Falha no pagamento');
        if (onError) onError(new Error('Falha no pagamento'));
      }
    };
    
    return () => {
      window.removeEventListener('message', handlePaymentMessage);
      delete window.mercadoPagoCallback;
    };
  }, [onSuccess, onError]);

  // Handle opening the Mercado Pago checkout
  const openMercadoPagoCheckout = () => {
    if (preferenceId) {
      // Store current appointment details in localStorage for verification after return
      localStorage.setItem('currentAppointment', agendamentoId);
      
      // Open in same window (user will return via redirect)
      const checkoutURL = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
      window.location.href = checkoutURL;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent"></div>
        <p className="mt-4 text-gray-600">Preparando seu pagamento...</p>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
        <div className="flex items-center justify-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="font-medium">Pagamento realizado com sucesso!</p>
        </div>
        <p>Seu agendamento foi confirmado. Aguardando redirecionamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Erro ao processar o pagamento:</p>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {preferenceId ? (
        <div>
          <p className="mb-4 text-gray-700">
            Clique no botão abaixo para prosseguir com o pagamento através do Mercado Pago
          </p>
          
          <button
            onClick={openMercadoPagoCheckout}
            className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Pagar com Mercado Pago
          </button>
          
          <div className="mt-4 flex items-center justify-center">
            <img 
              src="/mercadopago-logo.png" 
              alt="Mercado Pago" 
              className="h-6 mr-2"
              onError={(e) => {e.target.style.display = 'none'}}
            />
            <span className="text-sm text-gray-600">Pagamento processado por Mercado Pago</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          <p>Não foi possível gerar o link de pagamento. Por favor, tente novamente.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default MercadoPagoCheckout;