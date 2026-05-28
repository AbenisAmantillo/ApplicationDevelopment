import axios from 'axios';
import { apiClient } from './client';
import {
  extractCollection,
  resolveId,
  resolvePaymentId,
  resourceIri,
} from '../utils/hydra';
import type { Payment, PaymentMethod, Transaction, User } from '../types';

const PAYMENT_ACCEPT = 'application/ld+json, application/json';

export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await apiClient.get('/api/payments', {
    headers: { Accept: PAYMENT_ACCEPT },
  });
  return extractCollection<unknown>(data)
    .map(item => normalizePayment(item))
    .filter((p): p is Payment => p != null);
}

export async function fetchPayment(id: number): Promise<Payment> {
  const { data } = await apiClient.get<unknown>(`/api/payments/${id}`, {
    headers: { Accept: PAYMENT_ACCEPT },
  });
  const payment = normalizePayment(data);
  if (!payment) {
    throw new Error('Payment not found.');
  }
  return payment;
}

export async function createPayment(body: Record<string, unknown>): Promise<Payment> {
  const { data } = await apiClient.post<unknown>('/api/payments', body);
  const payment = normalizePayment(data);
  if (!payment) {
    throw new Error('Server did not return the created payment.');
  }
  return payment;
}

export function hasResolvablePaymentId(
  payment: Pick<Payment, 'id' | '@id'> | null | undefined,
): boolean {
  return resolvePaymentId(payment) != null;
}

/** Resolve API path for a payment (prefers Hydra @id, then numeric id). */
export function paymentItemPath(payment: Pick<Payment, 'id' | '@id'>): string {
  const id = resolvePaymentId(payment);
  if (id != null) {
    return `/api/payments/${id}`;
  }
  if (payment['@id']) {
    const iri = payment['@id'];
    if (iri.startsWith('http')) {
      return new URL(iri).pathname;
    }
    return iri.startsWith('/') ? iri : `/${iri}`;
  }
  throw new Error('Payment is missing id.');
}

export function normalizePayment(raw: unknown): Payment | null {
  if (raw == null) return null;

  if (typeof raw === 'string') {
    const id = resolvePaymentId(raw);
    if (id == null) return null;
    return {
      id,
      '@id': raw.startsWith('/') ? raw : `/${raw}`,
      transaction: '',
      customer: '',
      amount: 0,
      paymentMethod: 'debit_card',
      status: 'Pending',
      date: new Date().toISOString(),
    };
  }

  if (typeof raw !== 'object') return null;

  const obj = raw as Payment & Record<string, unknown>;
  const id = resolvePaymentId(obj);
  const atId =
    typeof obj['@id'] === 'string'
      ? obj['@id']
      : id != null
        ? `/api/payments/${id}`
        : undefined;

  const transaction = (obj.transaction ??
    obj.transaction_id ??
    obj.transactionIri) as Payment['transaction'];
  const customer = (obj.customer ??
    obj.customer_id ??
    obj.customerIri) as Payment['customer'];

  if (
    id == null &&
    !atId &&
    transaction == null &&
    customer == null &&
    obj.amount == null
  ) {
    return null;
  }

  return {
    ...obj,
    ...(id != null ? { id } : {}),
    '@id': atId,
    transaction: transaction ?? '',
    customer: customer ?? '',
    amount: Number(obj.amount ?? 0),
    paymentMethod: (obj.paymentMethod ??
      obj.payment_method ??
      'debit_card') as PaymentMethod,
    status: String(obj.status ?? 'Pending'),
    date: String(obj.date ?? new Date().toISOString()),
  };
}

function relationIri(
  value: string | { id?: number; '@id'?: string },
  type: 'transactions' | 'users',
): string {
  if (typeof value === 'string') {
    if (value.startsWith('/api/')) return value;
    const id = resolveId(value);
    if (id != null) return resourceIri(type, id);
    return value;
  }
  if (value['@id']) return value['@id'];
  if (value.id != null) return resourceIri(type, value.id);
  throw new Error(`Payment is missing a valid ${type} reference.`);
}

function resolveTransactionRef(
  payment: Payment,
  transactionContext?: Transaction,
): string {
  const fromPayment = payment.transaction;
  if (typeof fromPayment === 'string' && fromPayment.includes('/transactions/')) {
    return fromPayment.startsWith('/api/')
      ? fromPayment
      : relationIri(fromPayment, 'transactions');
  }
  if (fromPayment && typeof fromPayment === 'object') {
    return relationIri(fromPayment, 'transactions');
  }
  if (transactionContext) {
    return (
      transactionContext['@id'] ??
      resourceIri('transactions', transactionContext.id)
    );
  }
  throw new Error('Payment is missing transaction reference.');
}

function resolveCustomerRef(
  payment: Payment,
  transactionContext?: Transaction,
): string {
  const fromPayment = payment.customer;
  if (typeof fromPayment === 'string' && fromPayment.includes('/users/')) {
    return fromPayment.startsWith('/api/')
      ? fromPayment
      : relationIri(fromPayment, 'users');
  }
  if (fromPayment && typeof fromPayment === 'object') {
    return relationIri(fromPayment, 'users');
  }
  const txCustomer = transactionContext?.customer;
  if (typeof txCustomer === 'string') {
    return txCustomer.startsWith('/api/')
      ? txCustomer
      : relationIri(txCustomer, 'users');
  }
  if (txCustomer && typeof txCustomer === 'object') {
    return relationIri(txCustomer, 'users');
  }
  throw new Error('Payment is missing customer reference.');
}

function paymentPutBody(
  payment: Payment,
  patch: Partial<Pick<Payment, 'status' | 'paymentMethod' | 'date' | 'amount'>>,
): Record<string, unknown> {
  return {
    id: resolvePaymentId(payment) ?? payment.id,
    transaction: relationIri(payment.transaction as Transaction | string, 'transactions'),
    customer: relationIri(payment.customer as User | string, 'users'),
    amount: patch.amount ?? payment.amount,
    paymentMethod: patch.paymentMethod ?? payment.paymentMethod,
    status: patch.status ?? payment.status,
    date: patch.date ?? payment.date,
  };
}

export async function updatePayment(
  payment: Payment,
  patch: Partial<Pick<Payment, 'status' | 'paymentMethod' | 'date' | 'amount'>>,
): Promise<Payment> {
  const { data } = await apiClient.put<unknown>(
    paymentItemPath(payment),
    paymentPutBody(payment, patch),
  );
  const updated = normalizePayment(data);
  if (!updated) {
    throw new Error('Server did not return the updated payment.');
  }
  return updated;
}

/** Submit client-selected payment details while leaving staff to confirm completion. */
export async function submitInstallmentPayment(
  payment: Payment,
  paymentMethod: PaymentMethod,
  submittedAt: string = new Date().toISOString(),
): Promise<Payment> {
  const normalized = normalizePayment(payment);
  if (!normalized) {
    throw new Error('Invalid payment data.');
  }

  if (!hasResolvablePaymentId(normalized)) {
    throw new Error('This installment cannot be submitted because it is missing a payment id.');
  }

  try {
    const { data } = await apiClient.post<unknown>(
      `${paymentItemPath(normalized)}/submit`,
      { paymentMethod, date: submittedAt },
    );
    return (
      normalizePayment(data) ?? {
        ...normalized,
        paymentMethod,
        status: 'Pending',
      }
    );
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 404 || status === 405) {
        throw new Error(
          'The backend does not have the client payment submission route yet. Add POST /api/payments/{id}/submit so staff can see and confirm submitted payments.',
        );
      }
      if (status === 403) {
        throw new Error(
          'The backend blocked this payment submission. Allow the payment owner to call POST /api/payments/{id}/submit while keeping completion staff-only.',
        );
      }
    }
    throw e;
  }
}

async function completeViaApiRoute(
  payment: Payment,
  paymentMethod: PaymentMethod,
  paidAt: string,
): Promise<Payment | null> {
  if (!hasResolvablePaymentId(payment)) {
    return null;
  }

  try {
    const { data } = await apiClient.post<unknown>(
      `${paymentItemPath(payment)}/complete`,
      { paymentMethod, date: paidAt },
    );
    const result = normalizePayment(data);
    if (!result) {
      throw new Error('Server did not return the completed payment.');
    }
    return result;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 404 || status === 405) {
        return null;
      }
    }
    throw e;
  }
}

/** Records a completed installment when the pending row has no API id. */
async function completeByCreatingPayment(
  pending: Payment,
  paymentMethod: PaymentMethod,
  paidAt: string,
  transactionContext?: Transaction,
): Promise<Payment> {
  const completed = await createPayment({
    transaction: resolveTransactionRef(pending, transactionContext),
    customer: resolveCustomerRef(pending, transactionContext),
    amount: pending.amount,
    paymentMethod,
    status: 'Completed',
    date: paidAt,
  });

  if (hasResolvablePaymentId(pending)) {
    try {
      await apiClient.delete(paymentItemPath(pending));
    } catch {
      // Pending row may remain if DELETE is disabled.
    }
  }

  return completed;
}

/** Marks the next scheduled installment as paid and persists it via the API. */
export async function completeInstallment(
  payment: Payment,
  paymentMethod: PaymentMethod,
  paidAt: string = new Date().toISOString(),
  transactionContext?: Transaction,
): Promise<Payment> {
  const normalized = normalizePayment(payment);
  if (!normalized) {
    throw new Error('Invalid payment data.');
  }

  const patch = {
    status: 'Completed' as const,
    paymentMethod,
    date: paidAt,
  };

  if (!hasResolvablePaymentId(normalized)) {
    return completeByCreatingPayment(
      normalized,
      paymentMethod,
      paidAt,
      transactionContext,
    );
  }

  const viaRoute = await completeViaApiRoute(normalized, paymentMethod, paidAt);
  if (viaRoute) {
    return viaRoute;
  }

  try {
    return await updatePayment(normalized, patch);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return completeByCreatingPayment(
        normalized,
        paymentMethod,
        paidAt,
        transactionContext,
      );
    }
    throw e;
  }
}
