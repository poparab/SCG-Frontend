import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InquiryService } from '../../../core/services/inquiry.service';
import { InquiryDetail } from '../../../core/models/inquiry.models';

type PhaseState = 'done' | 'active' | 'pending' | 'rejected';
type StepState = 'completed' | 'active' | 'pending' | 'rejected';

interface StatusPhase {
  icon: string;
  titleKey: string;
  state: PhaseState;
  statusKey: string;
  statusIcon: string;
}

interface TimelineStep {
  state: StepState;
  icon: string;
  titleKey: string;
  date?: string;
}

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './inquiry-detail.component.html',
  styleUrl: './inquiry-detail.component.scss'
})
export class InquiryDetailComponent implements OnInit {
  private readonly inquiryService = inject(InquiryService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  inquiry = signal<InquiryDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  fullName = computed(() => {
    const inq = this.inquiry();
    if (!inq) return '';
    const ar = [inq.traveler.firstNameAr, inq.traveler.lastNameAr].filter(Boolean).join(' ');
    if (ar) return ar;
    return `${inq.traveler.firstNameEn} ${inq.traveler.lastNameEn}`;
  });

  statusPhases = computed<StatusPhase[]>(() => {
    const inq = this.inquiry();
    if (!inq) return [];
    const s = inq.status;
    const reg = this.getPhaseState(s, 0);
    const pay = this.getPhaseState(s, 1);
    const proc = this.getPhaseState(s, 2);
    const dec = this.getPhaseState(s, 3);
    return [
      { icon: 'fa-solid fa-file-circle-check', titleKey: 'inquiry.detail.registrationPhase', state: reg, statusKey: this.getPhaseStatusKey(reg, 'inquiry.detail.phaseCompleted'), statusIcon: this.getPhaseIcon(reg) },
      { icon: 'fa-solid fa-credit-card', titleKey: 'inquiry.detail.paymentPhase', state: pay, statusKey: this.getPhaseStatusKey(pay, 'inquiry.detail.phasePaid'), statusIcon: this.getPhaseIcon(pay) },
      { icon: 'fa-solid fa-gears', titleKey: 'inquiry.detail.processingPhase', state: proc, statusKey: this.getPhaseStatusKey(proc, 'inquiry.detail.phaseProcessed'), statusIcon: this.getPhaseIcon(proc) },
      { icon: 'fa-solid fa-shield-halved', titleKey: 'inquiry.detail.decisionPhase', state: dec, statusKey: this.getDecisionStatusKey(s, dec), statusIcon: this.getPhaseIcon(dec) }
    ];
  });

  timelineSteps = computed<TimelineStep[]>(() => {
    const inq = this.inquiry();
    if (!inq) return [];
    const s = inq.status;
    const steps: TimelineStep[] = [
      { state: this.getStepState(s, 0), icon: 'fa-solid fa-check', titleKey: 'inquiry.detail.stepSubmitted', date: inq.createdAt },
      { state: this.getStepState(s, 1), icon: 'fa-solid fa-check', titleKey: 'inquiry.detail.stepPaid', date: inq.createdAt },
      { state: this.getStepState(s, 2), icon: this.getStepIcon(s, 2), titleKey: 'inquiry.detail.stepProcessing' }
    ];
    if (s === 'Rejected') {
      steps.push({ state: 'rejected', icon: 'fa-solid fa-xmark', titleKey: 'inquiry.detail.stepRejected', date: inq.processedAt });
    } else if (s === 'Approved') {
      steps.push({ state: 'completed', icon: 'fa-solid fa-check', titleKey: 'inquiry.detail.stepApproved', date: inq.processedAt });
    } else {
      steps.push({ state: 'pending', icon: 'fa-solid fa-hourglass-half', titleKey: 'inquiry.detail.stepAwaitingDecision' });
    }
    return steps;
  });

  lineProgress = computed(() => {
    const inq = this.inquiry();
    if (!inq) return '0%';
    switch (inq.status) {
      case 'Approved':
      case 'Rejected':
        return '100%';
      case 'UnderProcessing':
        return '66%';
      case 'Submitted':
      case 'PaymentPending':
        return '0%';
      default:
        return '33%';
    }
  });

  isRejected = computed(() => this.inquiry()?.status === 'Rejected');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('inquiry.notFound');
      this.loading.set(false);
      return;
    }
    this.inquiryService.getInquiry(id).subscribe({
      next: (data) => {
        this.inquiry.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('inquiry.errorLoading');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getStatusPillClass(status: string): string {
    switch (status) {
      case 'Approved': return 'sp-green';
      case 'UnderProcessing': return 'sp-orange';
      case 'Submitted': return 'sp-blue';
      case 'Rejected': return 'sp-red';
      case 'Failed': return 'sp-red';
      default: return 'sp-gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Approved': return 'fa-solid fa-circle-check';
      case 'UnderProcessing': return 'fa-solid fa-gear';
      case 'Submitted': return 'fa-solid fa-file-circle-check';
      case 'Rejected': return 'fa-solid fa-circle-xmark';
      default: return 'fa-solid fa-circle';
    }
  }

  getStatusKey(status: string): string {
    switch (status) {
      case 'Approved': return 'inquiry.statusApproved';
      case 'UnderProcessing': return 'inquiry.statusProcessing';
      case 'Submitted': return 'inquiry.statusSubmitted';
      case 'Rejected': return 'inquiry.statusRejected';
      case 'Failed': return 'inquiry.statusFailed';
      default: return 'inquiry.status';
    }
  }

  private getPhaseState(status: string, phaseIndex: number): PhaseState {
    const statusOrder: Record<string, number> = {
      'Submitted': 0, 'PaymentPending': 0,
      'UnderProcessing': 2,
      'Approved': 3, 'Rejected': 3, 'Failed': -1
    };
    const current = statusOrder[status] ?? -1;
    if (status === 'Rejected' && phaseIndex === 3) return 'rejected';
    if (phaseIndex < current) return 'done';
    if (phaseIndex === current) return status === 'Approved' || status === 'Rejected' ? 'done' : 'active';
    return 'pending';
  }

  private getStepState(status: string, stepIndex: number): StepState {
    const statusOrder: Record<string, number> = {
      'Submitted': 0, 'PaymentPending': 0,
      'UnderProcessing': 2,
      'Approved': 3, 'Rejected': 3, 'Failed': -1
    };
    const current = statusOrder[status] ?? -1;
    if (stepIndex < current) return 'completed';
    if (stepIndex === current) return status === 'Approved' ? 'completed' : 'active';
    return 'pending';
  }

  private getStepIcon(status: string, stepIndex: number): string {
    const state = this.getStepState(status, stepIndex);
    if (state === 'completed') return 'fa-solid fa-check';
    if (state === 'active') return 'fa-solid fa-spinner';
    return 'fa-solid fa-hourglass-half';
  }

  private getPhaseIcon(state: PhaseState): string {
    switch (state) {
      case 'done': return 'fa-solid fa-circle-check';
      case 'active': return 'fa-solid fa-spinner';
      case 'rejected': return 'fa-solid fa-circle-xmark';
      default: return 'fa-solid fa-clock';
    }
  }

  private getPhaseStatusKey(state: PhaseState, doneKey: string): string {
    switch (state) {
      case 'done': return doneKey;
      case 'active': return 'inquiry.detail.phaseActive';
      case 'pending': return 'inquiry.detail.phasePending';
      case 'rejected': return 'inquiry.detail.phaseRejected';
      default: return 'inquiry.detail.phasePending';
    }
  }

  private getDecisionStatusKey(status: string, state: PhaseState): string {
    if (state === 'done' && status === 'Approved') return 'inquiry.detail.phaseApproved';
    if (state === 'rejected') return 'inquiry.detail.phaseRejected';
    if (state === 'active') return 'inquiry.detail.phaseActive';
    return 'inquiry.detail.phasePending';
  }
}
