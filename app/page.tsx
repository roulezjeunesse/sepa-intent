"use client";

import React, { Suspense } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';

// Check if the environment variable is defined
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
    console.error('Stripe public key is not defined. Make sure NEXT_PUBLIC_STRIPE_PUBLIC_KEY is set in your environment variables.');
}

// Load Stripe outside of a component’s render to avoid recreating the Stripe object on every render.
// Only call loadStripe if stripePublicKey is defined to avoid passing undefined.
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const Home = () => {
    if (!stripePromise) {
        return <div>Stripe is not initialized. Check your environment variables.</div>;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Elements stripe={stripePromise}>
                <PaymentForm />
            </Elements>
        </Suspense>
    );
};

export default Home;