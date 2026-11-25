
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';
import {
  CreateEnrollmentRequest,
  EnrollmentFilter,
  EnrollmentResponse,
  CancellationRequestResponse,
  CreateCancellationRequest,
  CancellationFilter,
  ReviewCancellationRequest,
} from './enrollment.models';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/enrollments`;

  private readonly cancellationApiUrl =
    `${environment.apiUrl}/cancellation-requests`;

  // GET: Retrieve all enrollments (Admin)
  getEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {
    return this.http.get<PagedResult<EnrollmentResponse>>(this.apiUrl, {
      params: this.buildParams(pageNumber, pageSize, filters),
    });
  }

  // GET: Retrieve current student's enrollments
  getMyEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {
    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/my`,
      {
        params: this.buildParams(pageNumber, pageSize, filters),
      },
    );
  }

  // GET: Retrieve enrollments by student
  getEnrollmentsByStudent(
    studentId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/student/${studentId}`,
      { params },
    );
  }

  // GET: Retrieve enrollments by course
  getEnrollmentsByCourse(
    courseId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/course/${courseId}`,
      { params },
    );
  }

  // POST: Create enrollment
  createEnrollment(
    request: CreateEnrollmentRequest,
  ): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(this.apiUrl, request);
  }

  // POST: Create cancellation request
  createCancellationRequest(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationRequestResponse> {
    return this.http.post<CancellationRequestResponse>(
      `${this.apiUrl}/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  // GET: Retrieve all cancellation requests (Admin)
  getCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationFilter,
  ): Observable<PagedResult<CancellationRequestResponse>> {
    return this.http.get<PagedResult<CancellationRequestResponse>>(
      this.cancellationApiUrl,
      {
        params: this.buildCancellationParams(pageNumber, pageSize, filters),
      },
    );
  }

  // GET: Retrieve current student's cancellation history
  getMyCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<CancellationRequestResponse>> {
    const params = this.buildCancellationParams(pageNumber, pageSize, {
      sortOrder: 'desc',
    });

    return this.http.get<PagedResult<CancellationRequestResponse>>(
      `${this.cancellationApiUrl}/my`,
      { params },
    );
  }

  // PUT: Approve cancellation request
  approveCancellationRequest(
    id: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationRequestResponse> {
    return this.http.put<CancellationRequestResponse>(
      `${this.cancellationApiUrl}/${id}/approve`,
      request,
    );
  }

  // PUT: Reject cancellation request
  rejectCancellationRequest(
    id: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationRequestResponse> {
    return this.http.put<CancellationRequestResponse>(
      `${this.cancellationApiUrl}/${id}/reject`,
      request,
    );
  }

  private buildParams(
    pageNumber: number,
    pageSize: number,
    filters?: EnrollmentFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return params;
  }

  private buildCancellationParams(
    pageNumber: number,
    pageSize: number,
    filters?: CancellationFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortOrder', filters?.sortOrder ?? 'desc');

    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return params;
  }
}
