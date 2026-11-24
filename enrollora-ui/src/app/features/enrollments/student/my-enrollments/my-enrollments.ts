import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CancellationRequestResponse,
  CancellationStatus,
  CreateCancellationRequest,
  EnrollmentResponse,
} from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationRequestResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  cancellationError = signal('');

  showCancellationForm = signal(false);
  selectedEnrollment = signal<EnrollmentResponse | null>(null);
  cancellationReason = signal('');
  isSubmittingCancellation = signal(false);

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.getErrorMessage(error, 'Unable to load your enrollments.'),
          );
          this.isLoading.set(false);
        },
      });
  }

  loadCancellationRequests(): void {
    this.enrollmentService.getMyCancellationRequests().subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items);
      },
      error: () => {
        this.cancellationError.set(
          'Unable to load cancellation request details.',
        );
      },
    });
  }

  openCancellationForm(enrollment: EnrollmentResponse): void {
    this.selectedEnrollment.set(enrollment);
    this.cancellationReason.set('');
    this.cancellationError.set('');
    this.showCancellationForm.set(true);
  }

  closeCancellationForm(): void {
    if (this.isSubmittingCancellation()) {
      return;
    }

    this.showCancellationForm.set(false);
    this.selectedEnrollment.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  submitCancellationRequest(): void {
    const enrollment = this.selectedEnrollment();
    const reason = this.cancellationReason().trim();

    if (!enrollment || !reason) {
      this.cancellationError.set('Please enter a cancellation reason.');
      return;
    }

    if (reason.length > 1000) {
      this.cancellationError.set(
        'Cancellation reason cannot exceed 1000 characters.',
      );
      return;
    }

    this.isSubmittingCancellation.set(true);
    this.cancellationError.set('');
    this.successMessage.set('');

    const request: CreateCancellationRequest = { reason };

    this.enrollmentService
      .createCancellationRequest(enrollment.enrollmentId, request)
      .subscribe({
        next: () => {
          this.isSubmittingCancellation.set(false);
          this.showCancellationForm.set(false);
          this.selectedEnrollment.set(null);
          this.cancellationReason.set('');

          this.successMessage.set(
            'Your cancellation request has been submitted successfully.',
          );

          this.loadCancellationRequests();
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmittingCancellation.set(false);
          this.cancellationError.set(
            this.getErrorMessage(
              error,
              'Unable to submit your cancellation request.',
            ),
          );
        },
      });
  }

  getCancellationRequest(
  enrollmentId: number,
  ): CancellationRequestResponse | undefined {
  return this.cancellationRequests()
    .filter((request) => request.enrollmentId === enrollmentId)
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() -
        new Date(a.requestedAt).getTime(),
    )[0];
  }

  cancellationStatusLabel(status: CancellationStatus): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'Pending';
      case CancellationStatus.Approved:
        return 'Approved';
      case CancellationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body?.detail) {
      return body.detail;
    }
    if (body?.message) {
      return body.message;
    }
    if (body?.title) {
      return body.title;
    }
    if (body?.errors) {
      const messages = Object.values(body.errors).flat();
      if (messages.length > 0) {
        return messages.map((message) => String(message)).join(' ');
      }
    }

    return fallback;
  }
}