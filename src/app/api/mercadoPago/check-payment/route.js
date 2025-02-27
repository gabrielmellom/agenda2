import { NextResponse } from 'next/server'; 
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../../../firebaseConfig';  

export async function GET(request) {
  try {
    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const agendamentoId = searchParams.get('agendamentoId');
    const profissionalId = searchParams.get('profissionalId');
    
    if (!agendamentoId) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!profissionalId) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar o documento do profissional no Firestore
    const userDocRef = doc(db, "usuario", profissionalId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    const agendamentos = userData.agendamentos || [];
    
    // Encontrar o agendamento correspondente
    const agendamento = agendamentos.find(
      agendamento => agendamento.agendamentoId === agendamentoId
    );
    
    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se já temos info de pagamento no agendamento
    if (agendamento.pagamentoInfo && agendamento.pagamentoInfo.id) {
      // Se já temos info de pagamento, retornar o status atual
      const paymentInfo = agendamento.pagamentoInfo;
      
      return NextResponse.json({
        agendamentoId: agendamentoId,
        status: agendamento.status,
        paymentId: paymentInfo.id,
        paymentStatus: paymentInfo.status
      });
    }
    
    // Se não temos info de pagamento, retornar o status do agendamento
    return NextResponse.json({
      agendamentoId: agendamentoId,
      status: agendamento.status,
      message: 'Nenhuma informação de pagamento encontrada para este agendamento'
    });
    
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: 'Falha ao processar verificação', details: error.message },
      { status: 500 }
    );
  }
}