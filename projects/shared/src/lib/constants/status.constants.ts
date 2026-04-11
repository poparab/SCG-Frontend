export enum BatchStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  PaymentPending = 'PaymentPending',
  UnderProcessing = 'UnderProcessing',
  Completed = 'Completed',
  Failed = 'Failed'
}

export enum InquiryStatus {
  Submitted = 'Submitted',
  PaymentPending = 'PaymentPending',
  UnderProcessing = 'UnderProcessing',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Failed = 'Failed'
}

export enum AgencyStatus {
  PendingReview = 'PendingReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Suspended = 'Suspended'
}

export interface StatusConfig {
  cssClass: string;
  icon: string;
  i18nKey: string;
}

export const BATCH_STATUS_CONFIG: Record<string, StatusConfig> = {
  [BatchStatus.Draft]: { cssClass: 'badge-secondary', icon: 'fa-file-pen', i18nKey: 'status.batch.draft' },
  [BatchStatus.Submitted]: { cssClass: 'badge-info', icon: 'fa-paper-plane', i18nKey: 'status.batch.submitted' },
  [BatchStatus.PaymentPending]: { cssClass: 'badge-warning', icon: 'fa-clock', i18nKey: 'status.batch.paymentPending' },
  [BatchStatus.UnderProcessing]: { cssClass: 'badge-primary', icon: 'fa-spinner', i18nKey: 'status.batch.underProcessing' },
  [BatchStatus.Completed]: { cssClass: 'badge-success', icon: 'fa-check-circle', i18nKey: 'status.batch.completed' },
  [BatchStatus.Failed]: { cssClass: 'badge-danger', icon: 'fa-times-circle', i18nKey: 'status.batch.failed' }
};

export const INQUIRY_STATUS_CONFIG: Record<string, StatusConfig> = {
  [InquiryStatus.Submitted]: { cssClass: 'badge-info', icon: 'fa-paper-plane', i18nKey: 'status.inquiry.submitted' },
  [InquiryStatus.PaymentPending]: { cssClass: 'badge-warning', icon: 'fa-clock', i18nKey: 'status.inquiry.paymentPending' },
  [InquiryStatus.UnderProcessing]: { cssClass: 'badge-primary', icon: 'fa-spinner', i18nKey: 'status.inquiry.underProcessing' },
  [InquiryStatus.Approved]: { cssClass: 'badge-success', icon: 'fa-check-circle', i18nKey: 'status.inquiry.approved' },
  [InquiryStatus.Rejected]: { cssClass: 'badge-danger', icon: 'fa-times-circle', i18nKey: 'status.inquiry.rejected' },
  [InquiryStatus.Failed]: { cssClass: 'badge-danger', icon: 'fa-exclamation-triangle', i18nKey: 'status.inquiry.failed' }
};

export const AGENCY_STATUS_CONFIG: Record<string, StatusConfig> = {
  [AgencyStatus.PendingReview]: { cssClass: 'badge-warning', icon: 'fa-clock', i18nKey: 'status.agency.pendingReview' },
  [AgencyStatus.Approved]: { cssClass: 'badge-success', icon: 'fa-check-circle', i18nKey: 'status.agency.approved' },
  [AgencyStatus.Rejected]: { cssClass: 'badge-danger', icon: 'fa-times-circle', i18nKey: 'status.agency.rejected' },
  [AgencyStatus.Suspended]: { cssClass: 'badge-secondary', icon: 'fa-ban', i18nKey: 'status.agency.suspended' }
};
