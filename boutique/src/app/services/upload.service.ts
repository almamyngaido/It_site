import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private apiUrl = `${environment.apiUrl}/upload/image`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder = 'products'): Observable<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post<UploadResult>(this.apiUrl, formData).pipe(
      catchError(error => {
        console.error('[UploadService]', error);
        return throwError(() => new Error(error.error?.error?.message ?? 'Upload failed'));
      })
    );
  }

  deleteImage(publicId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/upload/image/${encodeURIComponent(publicId)}`).pipe(
      catchError(error => throwError(() => new Error(error.error?.error?.message ?? 'Delete failed')))
    );
  }
}
