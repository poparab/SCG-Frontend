/**
 * Maps known API error strings to i18n translation keys.
 * Used to ensure all server-side error messages are properly translated
 * in the UI instead of showing raw English strings.
 */
const API_ERROR_MAP: Record<string, string> = {
  // Auth / Registration
  'An agency with this email already exists.': 'errors.api.duplicateEmail',
  'An agency with this commercial registration number already exists.': 'errors.api.duplicateCommercialReg',
  'Invalid credentials.': 'errors.api.invalidCredentials',
  'Account pending approval.': 'errors.api.accountPending',

  // Agency Management
  'Agency not found.': 'errors.api.agencyNotFound',
  'Only agencies with Pending Review status can be approved.': 'errors.api.agencyNotPending',
  'Only agencies with Pending Review status can be rejected.': 'errors.api.agencyNotPendingReject',

  // Wallet
  'Credit amount must be greater than zero.': 'errors.api.invalidCreditAmount',
  'Wallet not found for the specified agency.': 'errors.api.walletNotFound',
  'Agency wallet not found.': 'errors.api.walletNotFound',

  // Batch
  'Batch name is required.': 'errors.api.batchNameRequired',
  'Nationality code is required.': 'errors.api.nationalityCodeRequired',
  'Batch not found.': 'errors.api.batchNotFound',
  'Travelers can only be added to batches in Draft status.': 'errors.api.batchNotDraft',
  'Travelers can only be removed from batches in Draft status.': 'errors.api.batchNotDraft',
  'Travelers can only be updated in batches with Draft status.': 'errors.api.batchNotDraft',
  'Traveler not found in this batch.': 'errors.api.travelerNotFound',
  'Only batches in Draft status can be submitted.': 'errors.api.batchNotDraftSubmit',
  'Batch must have at least one traveler.': 'errors.api.batchNoTravelers',
  'No active pricing found for this nationality and inquiry type.': 'errors.api.noPricingFound',
  'Insufficient wallet balance.': 'errors.api.insufficientBalance',

  // Nationality / Pricing
  'Nationality with this code already exists.': 'errors.api.duplicateNationality',
  'Nationality not found.': 'errors.api.nationalityNotFound',

  // Inquiry
  'Inquiry not found.': 'errors.api.inquiryNotFound',
};

/**
 * Maps an API error message to the corresponding i18n key.
 * If the error is not found in the map, returns the provided fallback key.
 */
export function mapApiError(apiError: string | undefined | null, fallbackKey: string): string {
  if (!apiError) return fallbackKey;
  return API_ERROR_MAP[apiError] ?? fallbackKey;
}
