// pages/api/create-setup-intent.js

import { stripe } from '../../lib/stripe';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, name } = req.body;

        try {
            // Create a customer
            const customer = await stripe.customers.create({
                email: email,
                name: name,
            });

            // Create a SetupIntent for the customer
            const setupIntent = await stripe.setupIntents.create({
                payment_method_types: ['sepa_debit'],
                customer: customer.id,
                description: 'Caution de 600€ pour le stock avancé',
            });

            res.status(200).json({ client_secret: setupIntent.client_secret, customer_id: customer.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}