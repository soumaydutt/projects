import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]*$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code');

const currencySchema = z
  .number()
  .min(0, 'Amount must be positive')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Account schemas
export const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['Residential', 'Business', 'Enterprise', 'Government'], {
    required_error: 'Please select an account type',
  }),
  email: emailSchema,
  phone: phoneSchema,
  address1: z.string().min(5, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: zipCodeSchema,
  country: z.string().default('USA'),
  creditLimit: currencySchema.optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;

// Payment schemas
export const paymentSchema = z.object({
  accountId: z.string().uuid('Please select an account'),
  amount: currencySchema.positive('Amount must be greater than zero'),
  method: z.enum(['Cash', 'Check', 'CreditCard', 'BankTransfer', 'ACH'], {
    required_error: 'Please select a payment method',
  }),
  paymentDate: z.date().optional(),
  reference: z.string().optional(),
  checkNumber: z.string().optional(),
  cardLastFour: z
    .string()
    .regex(/^\d{4}$/, 'Enter last 4 digits')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  autoAllocate: z.boolean().default(true),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Price Plan schemas
export const pricePlanSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, or hyphens'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  serviceType: z.enum(['Internet', 'Television', 'Phone', 'Bundle', 'AddOn'], {
    required_error: 'Please select a service type',
  }),
  monthlyRate: currencySchema,
  setupFee: currencySchema.default(0),
  isActive: z.boolean().default(true),
  effectiveFrom: z.date().optional(),
  effectiveTo: z.date().optional(),
});

export type PricePlanFormData = z.infer<typeof pricePlanSchema>;

// Collection Note schemas
export const collectionNoteSchema = z.object({
  content: z
    .string()
    .min(10, 'Note must be at least 10 characters')
    .max(2000, 'Note cannot exceed 2000 characters'),
  contactType: z.enum(['Phone', 'Email', 'Letter', 'InPerson', 'System'], {
    required_error: 'Please select a contact type',
  }),
});

export type CollectionNoteFormData = z.infer<typeof collectionNoteSchema>;

// Promise to Pay schemas
export const promiseToPaySchema = z.object({
  date: z.date().min(new Date(), 'Date must be in the future'),
  amount: currencySchema.positive('Amount must be greater than zero'),
});

export type PromiseToPayFormData = z.infer<typeof promiseToPaySchema>;

// Account Note schemas
export const accountNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note cannot be empty')
    .max(2000, 'Note cannot exceed 2000 characters'),
});

export type AccountNoteFormData = z.infer<typeof accountNoteSchema>;

// Search/Filter schemas
export const searchParamsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Subscriber schemas
export const subscriberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema,
  isPrimary: z.boolean().default(false),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;

// Service schemas
export const serviceSchema = z.object({
  pricePlanId: z.string().uuid('Please select a price plan'),
  subscriberId: z.string().uuid('Please select a subscriber'),
  name: z.string().min(1, 'Service name is required'),
  activationDate: z.date().optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
