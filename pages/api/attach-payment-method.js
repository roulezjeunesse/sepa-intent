// pages/api/attach-payment-method.js

import { stripe } from '../../lib/stripe';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { customerId, paymentMethodId } = req.body;

        try {
            // Attacher la méthode de paiement au client
            const paymentMethod = await stripe.paymentMethods.attach(
                paymentMethodId,
                { customer: customerId }
            );

            // Mettre à jour les paramètres de facturation du client pour définir la méthode de paiement par défaut
            await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            res.status(200).json({ success: true, paymentMethod });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}