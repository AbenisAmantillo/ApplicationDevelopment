export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_STAFF' | string;

export interface User {
  id?: number;
  username: string;
  email: string;
  roles: UserRole[];
  verified?: boolean;
  isVerified?: boolean;
  status?: string;
  isEnabled?: boolean;
  profileImageFileName?: string | null;
}

export interface Property {
  '@id'?: string;
  id: number;
  title: string;
  status: string;
  price: number;
  address: string;
  imageFileName?: string | null;
}

export interface Furniture {
  '@id'?: string;
  id: number;
  name: string;
  price: number;
  status: string;
  stock: number | null;
  image?: string | null;
}

export interface TransactionFurniture {
  '@id'?: string;
  id?: number;
  transaction?: Transaction | string;
  furniture: Furniture | string;
  quantity: number;
}

export interface Transaction {
  '@id'?: string;
  id: number;
  customer: User | string;
  property: Property | string;
  purchaseType: string;
  price: number;
  date: string;
  clientDownpaymentAmount?: number | string | null;
  clientPaymentMethod?: PaymentMethod | string | null;
  clientPaymentPlanMonths?: number | string | null;
  payments?: Payment[];
  transactionFurniture?: TransactionFurniture[];
}

export interface Payment {
  '@id'?: string;
  id?: number;
  transaction: Transaction | string;
  customer: User | string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: 'Completed' | 'Pending' | string;
  date: string;
}

export type PaymentMethod =
  | 'debit_card'
  | 'mobile_transfer'
  | 'bank_transfer'
  | 'cash';

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: string;
  hint?: string;
}[] = [
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  {
    value: 'mobile_transfer',
    label: 'Mobile Transfer',
    icon: '📱',
    hint: 'GCash, PayMaya',
  },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵', hint: 'In person' },
];

export const PAYMENT_PLAN_MONTHS = [12, 24, 36] as const;

export type PaymentPlanMonths = (typeof PAYMENT_PLAN_MONTHS)[number];

export interface LoginResponse {
  token: string;
  user?: {
    username: string;
    email?: string;
    roles?: UserRole[];
    verified?: boolean;
    status?: string;
    isEnabled?: boolean;
    id?: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface Notification {
  '@id'?: string;
  id: number;
  title?: string | null;
  message?: string | null;
  createdAt?: string | null;
}
