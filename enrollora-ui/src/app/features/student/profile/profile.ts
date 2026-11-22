import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { StudentService } from '../../admin/students/student.service';
import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly studentService = inject(StudentService);

  // Profile data
  profile = signal<StudentResponse | null>(null);

  // UI states
  isLoading = signal(true);
  isEditing = signal(false);
  isSaving = signal(false);

  errorMessage = signal('');
  successMessage = signal('');

  // Profile Form
  profileForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.maxLength(120),
    ]),

    department: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
    ]),

    age: new FormControl(17, [
      Validators.required,
      Validators.min(17),
      Validators.max(60),
    ]),

    cgpa: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(10),
    ]),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  // Load Profile
  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.getMyProfile().subscribe({
      next: (response) => {
        this.profile.set(response);
        this.setFormValues(response);

        this.isLoading.set(false);
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load your profile.'),
        );

        this.isLoading.set(false);
      },
    });
  }

  // Set Form Values
  private setFormValues(student: StudentResponse): void {
    this.profileForm.patchValue({
      name: student.name,
      department: student.department,
      age: student.age,
      cgpa: student.cgpa,
    });
  }

  // Enable Editing
  editProfile(): void {
    const student = this.profile();

    if (!student) {
      return;
    }

    this.setFormValues(student);

    this.successMessage.set('');
    this.errorMessage.set('');

    this.isEditing.set(true);
  }

  // Cancel Editing
  cancelEdit(): void {
    const student = this.profile();

    if (student) {
      this.setFormValues(student);
    }

    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  // Update Profile
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (this.isSaving()) {
      return;
    }

    const formValue = this.profileForm.getRawValue();

    const request: UpdateStudentRequest = {
      email: this.profile()?.email ?? '',
      name: formValue.name!.trim(),
      department: formValue.department!.trim(),
      age: formValue.age!,
      cgpa: formValue.cgpa!,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.studentService.updateMyProfile(request).subscribe({
      next: (response) => {
        this.profile.set(response);
        this.setFormValues(response);

        this.isEditing.set(false);
        this.isSaving.set(false);

        this.successMessage.set('Profile updated successfully.');
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to update your profile.'),
        );

        this.isSaving.set(false);
      },
    });
  }

  // Student Status
  statusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending Approval';

      case 1:
        return 'Approved';

      case 2:
        return 'Rejected';

      default:
        return 'Unknown';
    }
  }

  // Error Handling
  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
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

    return fallback;
  }
}