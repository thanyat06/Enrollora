import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  CancellationRequestResponse,
  CancellationStatus,
} from '../../../enrollments/enrollment.models';
import { EnrollmentService } from '../../../enrollments/enrollment.service';

@Component({
  selector: 'app-cancellation-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancellation-history.html',
  styleUrl: './cancellation-history.css',
})
export class CancellationHistory implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  cancellationRequests = signal<CancellationRequestResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadCancellationHistory();
  }

  loadCancellationHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyCancellationRequests(this.pageNumber(), this.pageSize())
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
              'Unable to load cancellation history.',
          );

          this.isLoading.set(false);
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
      this.loadCancellationHistory();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCancellationHistory();
    }
  }
}