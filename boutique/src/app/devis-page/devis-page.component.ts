import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  subject: string;
  message: string;
  requestType: 'quote' | 'support' | 'info' | 'other';
}

@Component({
  selector: 'app-devis-page',
  templateUrl: './devis-page.component.html',
  styleUrls: ['./devis-page.component.css']
})
export class DevisPageComponent implements OnInit, OnDestroy {
  contactForm: ContactForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    requestType: 'quote'
  };

  isLoading: boolean = false;
  isSubmitted: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Contact info
  contactInfo = {
    email: 'contact@intelligtech.sn',
    phone: '+221 77 222 29 34',
    address: 'Hann Maristes PC1, Dakar',
    hours: 'Lun - Ven: 8h00 - 18h00'
  };

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Submit contact form
   */
  submitForm(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    // Prepare request data
    const requestData = {
      ...this.contactForm,
      submittedAt: new Date().toISOString()
    };

    // Send to backend (you'll need to create this endpoint)
    this.http.post(`${environment.apiUrl}/contact-requests`, requestData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Contact form submitted successfully:', response);
          this.isLoading = false;
          this.isSubmitted = true;
          this.successMessage = 'Votre message a été envoyé avec succès! Nous vous contacterons bientôt.';

          // Reset form after 3 seconds
          setTimeout(() => {
            this.resetForm();
          }, 3000);
        },
        error: (err) => {
          console.error('❌ Error submitting contact form:', err);
          this.isLoading = false;
          this.error = 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.';
        }
      });
  }

  /**
   * Validate form
   */
  private validateForm(): boolean {
    if (!this.contactForm.firstName.trim()) {
      this.error = 'Le prénom est requis';
      return false;
    }

    if (!this.contactForm.lastName.trim()) {
      this.error = 'Le nom est requis';
      return false;
    }

    if (!this.contactForm.email.trim()) {
      this.error = 'L\'email est requis';
      return false;
    }

    if (!this.isValidEmail(this.contactForm.email)) {
      this.error = 'L\'email n\'est pas valide';
      return false;
    }

    if (!this.contactForm.phone.trim()) {
      this.error = 'Le téléphone est requis';
      return false;
    }

    if (!this.contactForm.subject.trim()) {
      this.error = 'Le sujet est requis';
      return false;
    }

    if (!this.contactForm.message.trim()) {
      this.error = 'Le message est requis';
      return false;
    }

    if (this.contactForm.message.trim().length < 10) {
      this.error = 'Le message doit contenir au moins 10 caractères';
      return false;
    }

    this.error = null;
    return true;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.contactForm = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
      requestType: 'quote'
    };
    this.isSubmitted = false;
    this.error = null;
    this.successMessage = null;
  }

  /**
   * Get request type label
   */
  getRequestTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'quote': 'Demande de devis',
      'support': 'Support technique',
      'info': 'Demande d\'information',
      'other': 'Autre'
    };
    return labels[type] || type;
  }
}
