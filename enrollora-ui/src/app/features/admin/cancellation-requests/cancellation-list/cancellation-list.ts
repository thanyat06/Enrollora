import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CancellationFilter,
  CancellationRequestResponse,
  CancellationStatus,
  ReviewCancellationRequest,
} from '../../../enrollments/enrollment.models';
import { EnrollmentService } from '../../../enrollments/enrollment.service';

@Component({
  selector: 'app-cancellation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancellation-list.html',
  styleUrl: './cancellation-list.css',
})
export class CancellationListComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  cancellationRequests = signal<CancellationRequestResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  searchText = '';
  statusFilter = '';
  fromDate = '';
  toDate = '';

  selectedRequest = signal<CancellationRequestResponse | null>(null);
  reviewAction = signal<'approve' | 'reject' | null>(null);
  adminRemarks = signal('');
  isReviewing = signal(false);
  reviewError = signal('');

  ngOnInit(): void {
    this.loadCancellationRequests();
  }

  loadCancellationRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filters: CancellationFilter = {
      search: this.searchText.trim() || undefined,
      status: this.statusFilter === '' ? null : Number(this.statusFilter),
      fromDate: this.fromDate || undefined,
      toDate: this.toDate ? `${this.toDate}T23:59:59` : undefined,
      sortOrder: 'desc',
    };

    this.enrollmentService
      .getCancellationRequests(this.pageNumber(), this.pageSize(), filters)
      .subscribe({
        next: (response) => {
          this.cancellationRequests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;

          this.errorMessage.set(
            body?.detail ||
              body?.message ||
              body?.title ||
              'Unable to load cancellation requests.',
          );

          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadCancellationRequests();
  }

  resetFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.pageNumber.set(1);
    this.loadCancellationRequests();
  }

  openReview(
    request: CancellationRequestResponse,
    action: 'approve' | 'reject',
  ): void {
    this.selectedRequest.set(request);
    this.reviewAction.set(action);
    this.adminRemarks.set('');
    this.reviewError.set('');
  }

  closeReview(): void {
    if (this.isReviewing()) {
      return;
    }

    this.selectedRequest.set(null);
    this.reviewAction.set(null);
    this.adminRemarks.set('');
    this.reviewError.set('');
  }

  submitReview(): void {
    const request = this.selectedRequest();
    const action = this.reviewAction();

    if (!request || !action) {
      return;
    }

    this.isReviewing.set(true);
    this.reviewError.set('');
    this.successMessage.set('');

    const review: ReviewCancellationRequest = {
      adminRemarks: this.adminRemarks().trim() || null,
    };

    const operation =
      action === 'approve'
        ? this.enrollmentService.approveCancellationRequest(
            request.cancellationRequestId,
            review,
          )
        : this.enrollmentService.rejectCancellationRequest(
            request.cancellationRequestId,
            review,
          );

    operation.subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.selectedRequest.set(null);
        this.reviewAction.set(null);
        this.adminRemarks.set('');

        this.successMessage.set(
          action === 'approve'
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.',
        );

        this.loadCancellationRequests();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error;

        this.reviewError.set(
          body?.detail ||
            body?.message ||
            body?.title ||
            'Unable to review this cancellation request.',
        );

        this.isReviewing.set(false);
      },
    });
  }

  statusLabel(status: CancellationStatus): string {
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

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCancellationRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCancellationRequests();
    }
  }
}