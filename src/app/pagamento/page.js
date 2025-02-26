'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { firebaseApp } from '../../../firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CreditCard, Wallet, Receipt, AlertCircle } from 'lucide-react';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function PagamentoPage() {
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [userData, setUserData] = useState(null);
  const [metodoPagamento, setMetodoPagamento] = useState('cartao');
  const [formaPagamento, setFormaPagamento] = useState('integral');
  const [parcelas, setParcelas] = useState(1);
  
  // Dados do cartão
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Dados do PIX
  const [chavePix, setChavePix] = useState('');
  const [qrCodePix, setQrCodePix] = useState('');
  
  // Valores
  const [valorPagamento, setValorPagamento] = useState(0);
  const [valorParcela, setValorParcela] = useState(0);
  
  // Status e mensagens
  const [statusPagamento, setStatusPagamento] = useState(null);
  const [mensagemStatus, setMensagemStatus] = useState('');

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'usuario', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          // Definir o valor padrão de pagamento com base nos dados do usuário
          // Exemplo: valor da sessão * número de sessões
          if (data.financial && data.financial.valorSessao) {
            const valorBase = data.financial.valorSessao || 100;
            setValorPagamento(valorBase);
            setValorParcela(valorBase);
          } else {
            setValorPagamento(100); // Valor padrão se não houver dados financeiros
            setValorParcela(100);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Calcular valor da parcela quando o número de parcelas mudar
  useEffect(() => {
    if (parcelas > 0) {
      setValorParcela((valorPagamento / parcelas).toFixed(2));
    }
  }, [parcelas, valorPagamento]);

  // Formatar número do cartão
  const formatarNumeroCartao = (numero) => {
    const numerosApenas = numero.replace(/\D/g, '');
    let numeroFormatado = '';
    
    for (let i = 0; i < numerosApenas.length; i++) {
      if (i > 0 && i % 4 === 0) {
        numeroFormatado += ' ';
      }
      numeroFormatado += numerosApenas[i];
    }
    
    return numeroFormatado.slice(0, 19); // Limita a 16 dígitos + 3 espaços
  };

  // Formatar data de vencimento
  const formatarVencimento = (data) => {
    const numerosApenas = data.replace(/\D/g, '');
    let dataFormatada = '';
    
    if (numerosApenas.length > 0) {
      dataFormatada = numerosApenas.slice(0, 2);
      
      if (numerosApenas.length > 2) {
        dataFormatada += '/' + numerosApenas.slice(2, 4);
      }
    }
    
    return dataFormatada;
  };

  // Gerar QR Code PIX (simulação)
  const gerarQrCodePix = () => {
    if (!valorPagamento) return;
    
    // Simulação - na implementação real você integraria com um gateway de pagamento
    setChavePix('12345678-1234-1234-1234-123456789012');
    setQrCodePix('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABZUlEQVR4nO3XMQrDMBQFQV25yP0PnCaloNCHxJoZCIs3LK+1LgB6ru0BAPsIACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACAnAICcAAByAgDICQAgJwCAnAAAcgIAyAkAICcAgJwAAHICAMgJACB3bw8A2OV5j+0NAPZ4f28PANjlub/bGwD2+AD8Bxi/UHktxQAAAABJRU5ErkJggg==');
  };

  // Processar pagamento
  const processarPagamento = async () => {
    if (!auth.currentUser) {
      alert('Usuário não está logado!');
      return;
    }

    setProcessando(true);
    setStatusPagamento(null);
    setMensagemStatus('');

    try {
      // Validações básicas
      if (metodoPagamento === 'cartao') {
        if (numeroCartao.replace(/\s/g, '').length !== 16) {
          throw new Error('Número de cartão inválido');
        }
        if (!nomeCartao) {
          throw new Error('Nome no cartão é obrigatório');
        }
        if (vencimento.length !== 5) {
          throw new Error('Data de vencimento inválida');
        }
        if (cvv.length < 3) {
          throw new Error('CVV inválido');
        }
      }

      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Em uma implementação real, aqui você integraria com um gateway de pagamento
      // Como Stripe, PayPal, MercadoPago, PagSeguro, etc.

      // Registrar o pagamento no Firebase
      const pagamentoRef = await addDoc(collection(db, 'pagamentos'), {
        userId: auth.currentUser.uid,
        metodoPagamento,
        formaPagamento,
        parcelas: parseInt(parcelas),
        valor: parseFloat(valorPagamento),
        valorParcela: parseFloat(valorParcela),
        status: 'aprovado',
        dataHora: serverTimestamp(),
        // Adicionar outros dados relevantes
      });

      // Atualizar o status financeiro do usuário
      const userRef = doc(db, 'usuario', auth.currentUser.uid);
      await updateDoc(userRef, {
        'financial.ultimoPagamento': serverTimestamp(),
        'financial.statusPagamento': 'em_dia',
        // Adicionar outros campos financeiros conforme necessário
      });

      // Mostrar sucesso
      setStatusPagamento('sucesso');
      setMensagemStatus('Pagamento processado com sucesso!');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setStatusPagamento('erro');
      setMensagemStatus(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Carregando informações de pagamento...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
        <CardDescription>Escolha a forma de pagamento e complete a transação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações de pagamento */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Valor a pagar</h3>
              <p className="text-sm text-gray-500">Sessões e serviços</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">R$ {valorPagamento.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger id="formaPagamento">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integral">Pagamento Integral</SelectItem>
                <SelectItem value="parcelado">Pagamento Parcelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formaPagamento === 'parcelado' && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="parcelas">Número de Parcelas</Label>
              <Select value={parcelas.toString()} onValueChange={(value) => setParcelas(parseInt(value))}>
                <SelectTrigger id="parcelas">
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x de R$ {(valorPagamento / num).toFixed(2)}
                      {num > 1 && num <= 6 ? ' sem juros' : num > 6 ? ' com juros' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Métodos de pagamento */}
        <Tabs defaultValue="cartao" value={metodoPagamento} onValueChange={setMetodoPagamento}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cartao" className="flex items-center justify-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Cartão de Crédito
            </TabsTrigger>
            <TabsTrigger value="pix" className="flex items-center justify-center" onClick={gerarQrCodePix}>
              <Wallet className="h-4 w-4 mr-2" />
              PIX
            </TabsTrigger>
          </TabsList>
          
          {/* Cartão de Crédito */}
          <TabsContent value="cartao" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroCartao">Número do Cartão</Label>
              <Input
                id="numeroCartao"
                placeholder="0000 0000 0000 0000"
                value={numeroCartao}
                onChange={(e) => setNumeroCartao(formatarNumeroCartao(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nomeCartao">Nome no Cartão</Label>
              <Input
                id="nomeCartao"
                placeholder="Nome como aparece no cartão"
                value={nomeCartao}
                onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vencimento">Vencimento (MM/AA)</Label>
                <Input
                  id="vencimento"
                  placeholder="MM/AA"
                  value={vencimento}
                  onChange={(e) => setVencimento(formatarVencimento(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="salvarCartao" />
              <label
                htmlFor="salvarCartao"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Salvar cartão para pagamentos futuros
              </label>
            </div>
          </TabsContent>
          
          {/* PIX */}
          <TabsContent value="pix" className="space-y-4">
            <div className="bg-white p-4 rounded-lg border flex flex-col items-center justify-center">
              <p className="text-sm text-center mb-4">
                Escaneie o QR Code abaixo ou use a chave PIX para realizar o pagamento
              </p>
              
              {qrCodePix ? (
                <>
                  <div className="bg-white p-2 rounded-lg border mb-4">
                    <img 
                      src={qrCodePix} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  
                  <div className="w-full">
                    <Label htmlFor="chavePix" className="text-xs text-gray-500">
                      Chave PIX
                    </Label>
                    <div className="flex">
                      <Input
                        id="chavePix"
                        value={chavePix}
                        readOnly
                        className="text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(chavePix);
                          alert('Chave PIX copiada!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <Button 
                  onClick={gerarQrCodePix}
                  variant="outline"
                  className="w-full"
                >
                  Gerar QR Code PIX
                </Button>
              )}
            </div>
            
            <Alert>
              <Receipt className="h-4 w-4" />
              <AlertDescription>
                Após realizar o pagamento via PIX, o sistema confirmará automaticamente
                em até 1 minuto. Não feche esta página até a confirmação.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        {/* Botão de pagamento */}
        <Button 
          onClick={processarPagamento}
          className="w-full mt-4"
          size="lg"
          disabled={processando || (metodoPagamento === 'pix' && !qrCodePix)}
        >
          {processando ? 'Processando...' : `Pagar R$ ${valorPagamento.toFixed(2)}`}
        </Button>
        
        {/* Status do pagamento */}
        {statusPagamento && (
          <Alert variant={statusPagamento === 'sucesso' ? 'default' : 'destructive'}>
            {statusPagamento === 'sucesso' ? (
              <Receipt className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {mensagemStatus}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}