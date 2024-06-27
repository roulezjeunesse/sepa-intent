"use client";

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, IbanElement } from '@stripe/react-stripe-js';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from './PaymentForm.module.css';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    if (emailParam && nameParam) {
      setEmail(emailParam);
      setName(nameParam);
      setLoading(false);
    } else {
      setLoading(false); // Even if parameters are missing, stop loading
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const ibanElement = elements.getElement(IbanElement);

    try {
      // Create a customer and SetupIntent
      const response = await fetch('/api/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }

      setClientSecret(data.client_secret);

      const result = await stripe.confirmSepaDebitSetup(data.client_secret, {
        payment_method: {
          sepa_debit: ibanElement,
          billing_details: {
            name: name,
            email: email,
          },
        },
      });

      if (result.error) {
        console.error(result.error.message);
        setErrorMessage(result.error.message);
      } else {
        console.log('SetupIntent confirmed:', result.setupIntent);

        // Attach and set default payment method
        const attachResponse = await fetch('/api/attach-payment-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: data.customer_id,
            paymentMethodId: result.setupIntent.payment_method,
          }),
        });

        const attachData = await attachResponse.json();
        if (attachData.success) {
          setSubmitted(true); // Set submitted state to true on successful submission
        } else {
          setErrorMessage(attachData.error);
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Échec de la création de l\'intention de configuration');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (submitted) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.formContainer}>
          <h2>Merci !</h2>
          <p>Votre IBAN a été soumis avec succès et une intention de configuration a été créée.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <Image
          src="/logo.svg"
          alt="RoulezJeunesse"
          className={styles.logo}
          width={100}
          height={50}
        />
        <div className={styles.userInfo}>
          <p><strong>Nom :</strong> {name}</p>
          <p><strong>Email :</strong> {email}</p>
        </div>
        <h2 className={styles.formTitle}>IBAN</h2>
        <div className={styles.infoText}>
          Autorisation de prélèvement SEPA relative à la caution du stock de pièces détachées, conformément à notre contrat. Il s&apos;agit uniquement d&apos;une autorisation de prélèvement. Aucune somme n&apos;est bloquée ou débitée de votre compte.
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formElement}>
            <IbanElement
              options={{ supportedCountries: ['SEPA'] }}
              className={styles.ibanElement}
            />
          </div>
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          <button type="submit" className={styles.submitButton} disabled={!stripe}>
            Soumettre
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;