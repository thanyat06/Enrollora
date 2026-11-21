import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Signals
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  // Course Form
  isModalOpen = signal(false);
  isEditMode = signal(false);
  isSaving = signal(false);

  editingCourseId: number | null = null;
  formError = signal('');

  courseForm = new FormGroup({
    courseName: new FormControl('', [
      Validators.required,
      Validators.maxLength(150),
    ]),

    duration: new FormControl('', [
      Validators.required,
      Validators.maxLength(80),
    ]),

    fees: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(999999999),
    ]),

    capacity: new FormControl(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(100000),
    ]),

    isActive: new FormControl(true, {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  // Load courses from backend
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);

        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading courses:', error);

        this.errorMessage.set('Unable to load courses.');

        this.isLoading.set(false);
      },
    });
  }

  // Open Add Course Modal
  openAddModal(): void {
    this.isEditMode.set(false);
    this.editingCourseId = null;
    this.formError.set('');

    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    });

    this.isModalOpen.set(true);
  }

  // Open Edit Course Modal
  editCourse(id: number): void {
    this.isEditMode.set(true);
    this.editingCourseId = id;
    this.formError.set('');

    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.courseForm.patchValue({
          courseName: course.courseName,
          duration: course.duration,
          fees: course.fees,
          capacity: course.capacity,
          isActive: course.isActive,
        });

        this.isModalOpen.set(true);
      },

      error: (error) => {
        console.error('Error loading course:', error);
        alert('Unable to load course details.');
      },
    });
  }

  // Close Modal
  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCourseId = null;
    this.formError.set('');
    this.isSaving.set(false);

    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    });
  }

  // Create or Update Course
  saveCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    if (this.isSaving()) {
      return;
    }

    const formValue = this.courseForm.getRawValue();

    const courseData: SaveCourseRequest = {
      courseName: formValue.courseName!.trim(),
      duration: formValue.duration!.trim(),
      fees: formValue.fees!,
      capacity: formValue.capacity!,
      isActive: formValue.isActive!,
    };

    this.isSaving.set(true);
    this.formError.set('');

    // Update Course
    if (this.isEditMode() && this.editingCourseId !== null) {
      this.courseService
        .updateCourse(this.editingCourseId, courseData)
        .subscribe({
          next: () => {
            this.closeModal();
            this.successMessage.set('Course updated successfully.');
            this.loadCourses();
          },

          error: (error) => {
            console.error('Error updating course:', error);

            this.formError.set(
              error.error?.message || 'Unable to update course.',
            );

            this.isSaving.set(false);
          },
        });
    }

    // Create Course
    else {
      this.courseService.createCourse(courseData).subscribe({
        next: () => {
          this.closeModal();
          this.successMessage.set('Course created successfully.');

          // Return to first page to display the new course
          this.pageNumber.set(1);
          this.loadCourses();
        },

        error: (error) => {
          console.error('Error creating course:', error);

          this.formError.set(
            error.error?.message || 'Unable to create course.',
          );

          this.isSaving.set(false);
        },
      });
    }
  }

  // Deactivate Course
  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to deactivate "${course.courseName}"?\n\n` +
      `Students will no longer be able to enroll in this course. ` +
      `Historical enrollments will be preserved.`,
    );

    if (!confirmed) {
      return;
    }

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.loadCourses();
      },

      error: (error) => {
        console.error('Error deactivating course:', error);
        alert('Unable to deactivate course.');
      },
    });
  }

  // Navigate to next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  // Navigate to previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}