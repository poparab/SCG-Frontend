/**
 * Maps known API error strings to i18n translation keys.
 */
const API_ERROR_MAP: Record<string, string> = {
  // Auth
  'Invalid credentials.': 'admin.errors.invalidCredentials',
  'Account pending approval.': 'admin.errors.accountPending',

  // Agency Management
  'Agency not found.': 'admin.errors.agencyNotFound',
  'Only agencies with Pending Review status can be approved.': 'admin.errors.agencyNotPending',
  'Only agencies with Pending Review status can be rejected.': 'admin.errors.agencyNotPendingReject',

  // Wallet
  'Credit amount must be greater than zero.': 'admin.errors.invalidCreditAmount',
  'Wallet not found for the specified agency.': 'admin.errors.walletNotFound',
  'Invalid payment method.': 'admin.errors.invalidPaymentMethod',
  'Evidence file must be PDF, JPG, or PNG.': 'admin.errors.invalidEvidenceType',
  'Evidence file must not exceed 5 MB.': 'admin.errors.evidenceTooLarge',

  // Nationality / Pricing
  'Nationality with this code already exists.': 'admin.errors.duplicateNationality',
  'Nationality not found.': 'admin.errors.nationalityNotFound',

  // Inquiry
  'Inquiry not found.': 'admin.errors.inquiryNotFound',
};

export function mapApiError(apiError: string | undefined | null, fallbackKey: string): string {
  if (!apiError) return fallbackKey;
  return API_ERROR_MAP[apiError] ?? fallbackKey;
}
