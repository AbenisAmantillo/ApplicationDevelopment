import { createTransaction } from './transactions';
import { resourceIri } from '../utils/hydra';
import type {
  Furniture,
  PaymentMethod,
  PaymentPlanMonths,
  Property,
  User,
} from '../types';

export interface CheckoutLine {
  furniture: Furniture;
  quantity: number;
}

export interface CheckoutPayload {
  property: Property;
  lines: CheckoutLine[];
  downpayment: number;
  paymentPlan: PaymentPlanMonths;
  paymentMethod: PaymentMethod;
  user: User;
}

function grandTotal(property: Property, lines: CheckoutLine[]): number {
  const furnitureTotal = lines.reduce(
    (sum, l) => sum + l.furniture.price * l.quantity,
    0,
  );
  return property.price + furnitureTotal;
}

export async function submitCheckout(payload: CheckoutPayload): Promise<number> {
  const { property, lines, downpayment, paymentPlan, paymentMethod, user } =
    payload;

  if (user.id == null) {
    throw new Error('User id is required to create a transaction.');
  }

  const total = grandTotal(property, lines);
  const customerIri = resourceIri('users', user.id);
  const propertyIri = resourceIri('properties', property.id);
  const now = new Date().toISOString();

  const transactionBody: Record<string, unknown> = {
    customer: customerIri,
    property: propertyIri,
    purchaseType: 'rent',
    price: total,
    date: now,
    clientDownpaymentAmount: downpayment,
    clientPaymentPlanMonths: paymentPlan,
    clientPaymentMethod: paymentMethod,
  };

  const transaction = await createTransaction(transactionBody);

  return transaction.id;
}
