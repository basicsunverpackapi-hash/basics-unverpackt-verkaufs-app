import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const apiKey = Deno.env.get('SUMUP_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'SumUp API key not configured' }, { status: 500 });
    }

    // SumUp Checkout erstellen
    const checkoutResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: `sale_${Date.now()}`,
        amount: parseFloat(amount).toFixed(2),
        currency: 'EUR',
        description: description || 'Verkauf',
        merchant_code: 'YOUR_MERCHANT_CODE' // Optional: Falls Sie einen Merchant Code haben
      })
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error('SumUp Checkout Error:', error);
      return Response.json({ 
        error: 'Checkout creation failed', 
        details: error 
      }, { status: checkoutResponse.status });
    }

    const checkoutData = await checkoutResponse.json();

    return Response.json({
      success: true,
      checkout_id: checkoutData.id,
      status: checkoutData.status
    });

  } catch (error) {
    console.error('SumUp Integration Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});