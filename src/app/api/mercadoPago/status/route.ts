import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const revalidate = 60; // Revalidate every 60 seconds


export async function GET(request: Request) {
  console.log('===== MERCADO PAGO STATUS ROUTE STARTED =====');
  
  try {
    // Log environment variables
    console.log('Environment Variables:');
    console.log('MERCADO_PAGO_ACCESS_TOKEN present:', !!process.env.MERCADO_PAGO_ACCESS_TOKEN);

    // Create Mercado Pago client
    console.log('Attempting to create Mercado Pago client');
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
    });

    // Get preference ID from query parameters
    const { searchParams } = new URL(request.url);
    const preferenceId = searchParams.get('preferenceId');

    console.log('Preference ID:', preferenceId);

    if (!preferenceId) {
      console.error('❌ Missing Preference ID');
      return NextResponse.json(
        { error: 'Preference ID é obrigatório' }, 
        { status: 400 }
      );
    }

    try {
      console.log('Attempting to fetch Mercado Pago preference status');
      const preference = new Preference(client);
      const result = await preference.get({ preferenceId });
      
      console.log('✅ Preference Fetched Successfully');
      console.log('Full Preference Result:', JSON.stringify(result, null, 2));

      // Determine status based on available information
      let paymentStatus = 'pending';

      // Attempt to extract status from different possible locations
      if (result && typeof result === 'object') {
        if ('status' in result) {
          paymentStatus = (result as any).status;
        }
      }

      console.log('Extracted Payment Status:', paymentStatus);

      return NextResponse.json({
        status: paymentStatus
      });
    } catch (mpError: any) {
      console.error('❌ Mercado Pago Preference Status Error:');
      console.error('Error Name:', mpError.name);
      console.error('Error Message:', mpError.message);
      console.error('Full Error Object:', JSON.stringify(mpError, null, 2));

      return NextResponse.json(
        { 
          error: 'Erro ao verificar status do pagamento', 
          details: mpError.message,
          fullError: mpError
        }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
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
    console.log('===== MERCADO PAGO STATUS ROUTE COMPLETED =====');
  }
}