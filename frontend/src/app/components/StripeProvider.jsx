// src/app/components/StripeProvider.jsx
"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51SGlKZCXXCLIBBgorne3g5TQ2n87DdD21UQQXXhlfEJQddmywSLrCWcOk8mIa8DhuJEzxNTwd9S9AoYrEOPXn3Da002KMNTnBj");

export default function StripeProvider({ children }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
