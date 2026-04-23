import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, paymentMethod, phone, billingPeriod } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe não configurado. Configure a chave STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
    });

    // Stripe trabalha com centavos (menor unidade da moeda)
    const amountInCents = Math.round(amount * 100);

    if (paymentMethod === 'mbway') {
      // MBWay via Stripe — cria PaymentIntent com método mb_way
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        payment_method_types: ['mb_way'],
        payment_method_data: {
          type: 'mb_way',
          mb_way: {
            phone: phone, // ex: "+351912345678"
          },
        },
        confirm: true,
        description: `NutriLife Plano ${billingPeriod === 'annual' ? 'Anual' : 'Mensal'}`,
        metadata: {
          billing_period: billingPeriod,
          payment_method_label: 'MB WAY',
        },
      });

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      });
    }

    if (paymentMethod === 'credit-card') {
      // Cartão de crédito — cria PaymentIntent simples, o frontend completa
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        description: `NutriLife Plano ${billingPeriod === 'annual' ? 'Anual' : 'Mensal'}`,
        metadata: {
          billing_period: billingPeriod,
        },
      });

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      });
    }

    if (paymentMethod === 'pix') {
      // PIX via Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        payment_method_types: ['pix'],
        payment_method_data: {
          type: 'pix',
        },
        confirm: true,
        description: `NutriLife Plano ${billingPeriod === 'annual' ? 'Anual' : 'Mensal'}`,
      });

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        pixQrCode: (paymentIntent.next_action as any)?.pix_display_qr_code?.image_url_png,
        pixCode: (paymentIntent.next_action as any)?.pix_display_qr_code?.data,
      });
    }

    return NextResponse.json({ error: 'Método de pagamento não suportado.' }, { status: 400 });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar pagamento.' },
      { status: 500 }
    );
  }
}
