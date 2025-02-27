import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request) {
  console.log('===== MERCADO PAGO ROUTE STARTED =====');
  
  try {
    // Log environment variables
    console.log('Environment Variables:');
    console.log('MERCADO_PAGO_ACCESS_TOKEN present:', !!process.env.MERCADO_PAGO_ACCESS_TOKEN);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

    // Create Mercado Pago client
    console.log('Attempting to create Mercado Pago client');
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    // Parse request body
    console.log('Parsing request body');
    const body = await request.json();
    console.log('Received Body:', JSON.stringify(body, null, 2));

    // Destructure request body
    const { 
      servicoNome, 
      servicoPreco, 
      clienteEmail, 
      clienteNome, 
      agendamentoId,
      profissionalId,
      notificationUrl 
    } = body;

    // Validate required fields
    console.log('Validating Required Fields:');
    const missingFields = [];
    if (!servicoNome) missingFields.push('servicoNome');
    if (!servicoPreco) missingFields.push('servicoPreco');
    if (!clienteEmail) missingFields.push('clienteEmail');
    if (!clienteNome) missingFields.push('clienteNome');
    if (!agendamentoId) missingFields.push('agendamentoId');

    if (missingFields.length > 0) {
      console.error('❌ Missing Fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios faltando', 
          missingFields 
        }, 
        { status: 400 }
      );
    }

    // Prepare preference
    console.log('Preparing Payment Preference');
    const preferenceData = {
      body: {
        items: [
          {
            id: agendamentoId,
            title: servicoNome,
            unit_price: Number(servicoPreco),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: clienteEmail,
          name: clienteNome
        },
        external_reference: `${profissionalId}|${agendamentoId}`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/agendamento/${profissionalId}?status=approved`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/agendamento/${profissionalId}?status=rejected`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/agendamento/${profissionalId}?status=pending`
        },
        auto_return: 'approved',
        notification_url: notificationUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadoPago/webhook`
      }
    };

    console.log('Preference Object:', JSON.stringify(preferenceData, null, 2));

    try {
      console.log('Attempting to create Mercado Pago preference');
      const preference = new Preference(client);
      const result = await preference.create(preferenceData);
      
      console.log('✅ Preference Created Successfully');
      console.log('Preference ID:', result.id);
      console.log('Init Point:', result.init_point);

      return NextResponse.json({
        preferenceId: result.id,
        initPoint: result.init_point
      });
    } catch (mpError) {
      console.error('❌ Mercado Pago Preference Creation Error:');
      console.error('Error Name:', mpError.name);
      console.error('Error Message:', mpError.message);
      console.error('Full Error Object:', JSON.stringify(mpError, null, 2));

      return NextResponse.json(
        { 
          error: 'Erro ao criar preferência de pagamento', 
          details: mpError.message,
          fullError: mpError
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected Global Error:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error.message,
        fullError: error
      }, 
      { status: 500 }
    );
  } finally {
    console.log('===== MERCADO PAGO ROUTE COMPLETED =====');
  }
}