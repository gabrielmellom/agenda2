// File: /app/api/sidebar/route.js
import { NextResponse } from 'next/server';
import { db } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';

/**
 * Handles webhook notifications from Mercado Pago
 * This endpoint should be configured in your Mercado Pago dashboard
 * URL: https://agenda2-black.vercel.app/sidebar
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Log the received notification for debugging
    console.log('Webhook received:', body);
    
    // Get the Mercado Pago signature from headers
    const mpSignature = request.headers.get('x-signature') || '';
    const secretKey = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'fc03642ad2ff4be34edf589f7c214f258eef16ca64af11048ca6f6648df5ae23';
    
    // Verify the signature (optional but recommended for production)
    if (secretKey && mpSignature) {
      const generatedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(rawBody)
        .digest('hex');
      
      if (generatedSignature !== mpSignature) {
        console.error('Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Process the notification based on type
    if (body.type === 'payment') {
      await handlePaymentNotification(body);
    } else if (body.type === 'test') {
      console.log('Test notification received, validating webhook setup');
    } else {
      console.log(`Unhandled notification type: ${body.type}`);
    }
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle payment notifications from Mercado Pago
 */
async function handlePaymentNotification(notification) {
  try {
    // Extract payment data
    const { data } = notification;
    
    // Skip if no data or payment ID
    if (!data || !data.id) {
      console.error('Invalid payment notification data');
      return;
    }
    
    // Fetch payment details from Mercado Pago API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
      }
    });
    
    if (!mpResponse.ok) {
      console.error(`Failed to fetch payment details: ${mpResponse.status}`);
      return;
    }
    
    const payment = await mpResponse.json();
    console.log('Payment details:', payment);
    
    // Extract external reference (should contain profissionalId|agendamentoId)
    const externalRef = payment.external_reference;
    if (!externalRef || !externalRef.includes('|')) {
      console.error('Invalid external reference:', externalRef);
      return;
    }
    
    const [profissionalId, agendamentoId] = externalRef.split('|');
    
    // Update appointment in Firestore based on payment status
    if (payment.status === 'approved') {
      await updateAppointmentStatus(profissionalId, agendamentoId, 'confirmado');
    } else if (['rejected', 'cancelled', 'refunded'].includes(payment.status)) {
      await updateAppointmentStatus(profissionalId, agendamentoId, 'cancelado');
    }
  } catch (error) {
    console.error('Error handling payment notification:', error);
    throw error;
  }
}

/**
 * Update appointment status in Firestore
 */
async function updateAppointmentStatus(profissionalId, agendamentoId, newStatus) {
  try {
    // Get professional document
    const profDocRef = doc(db, 'usuario', profissionalId);
    const profDoc = await getDoc(profDocRef);
    
    if (!profDoc.exists()) {
      throw new Error(`Professional with ID ${profissionalId} not found`);
    }
    
    const userData = profDoc.data();
    
    // Try to find appointment in the confirmed appointments list
    let foundInAgendamentos = false;
    if (userData.agendamentos && Array.isArray(userData.agendamentos)) {
      const updatedAgendamentos = userData.agendamentos.map(appt => {
        if (appt.agendamentoId === agendamentoId) {
          foundInAgendamentos = true;
          return {
            ...appt,
            status: newStatus,
            ultimaAtualizacao: new Date().toISOString()
          };
        }
        return appt;
      });
      
      if (foundInAgendamentos) {
        await updateDoc(profDocRef, { agendamentos: updatedAgendamentos });
        console.log(`Updated appointment status to ${newStatus}`);
        return;
      }
    }
    
    // If not in confirmed list, check in temporary reservations
    if (userData.reservasTemporarias && Array.isArray(userData.reservasTemporarias)) {
      const tempAppointment = userData.reservasTemporarias.find(
        appt => appt.agendamentoId === agendamentoId
      );
      
      if (tempAppointment) {
        // Remove from temporary reservations
        const updatedReservas = userData.reservasTemporarias.filter(
          appt => appt.agendamentoId !== agendamentoId
        );
        
        if (newStatus === 'confirmado') {
          // Add to confirmed appointments with updated status
          const confirmedAppointment = {
            ...tempAppointment,
            status: 'confirmado',
            ultimaAtualizacao: new Date().toISOString()
          };
          
          await updateDoc(profDocRef, {
            reservasTemporarias: updatedReservas,
            agendamentos: [...(userData.agendamentos || []), confirmedAppointment]
          });
          
          console.log('Appointment confirmed and moved from temporary to confirmed list');
        } else {
          // Just remove from temporary reservations for failed payments
          await updateDoc(profDocRef, {
            reservasTemporarias: updatedReservas
          });
          
          console.log('Appointment removed from temporary reservations due to payment failure');
        }
      } else {
        console.log(`Appointment ${agendamentoId} not found in temporary reservations`);
      }
    } else {
      console.log('No temporary reservations found for this professional');
    }
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
}

// Handle GET requests (for testing the webhook)
export async function GET(request) {
  return NextResponse.json({
    status: 'success',
    message: 'Mercado Pago webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}