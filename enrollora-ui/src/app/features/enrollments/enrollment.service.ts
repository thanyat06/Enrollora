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
} from './enrollment.models';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/enrollments`;

  private readonly cancellationApiUrl =
    `${environment.apiUrl}/cancellation-requests`;

  getEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {
    return this.http.get<PagedResult<EnrollmentResponse>>(this.apiUrl, {
      params: this.buildParams(pageNumber, pageSize, filters),
    });
  }

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

  createEnrollment(
    request: CreateEnrollmentRequest,
  ): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(this.apiUrl, request);
  }

  getMyCancellationRequests(
    pageNumber = 1,
    pageSize = 100,
  ): Observable<PagedResult<CancellationRequestResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<CancellationRequestResponse>>(
      `${this.cancellationApiUrl}/my`,
      { params },
    );
  }

  createCancellationRequest(
  enrollmentId: number,
  request: CreateCancellationRequest,
  ): Observable<CancellationRequestResponse> {
  return this.http.post<CancellationRequestResponse>(
    `${this.apiUrl}/${enrollmentId}/cancellation-request`,
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
}