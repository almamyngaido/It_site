import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }

  /**
   * Show success notification
   */
  success(message: string, title: string = 'Succès'): void {
    this.toastr.success(message, title);
  }

  /**
   * Show error notification
   */
  error(message: string, title: string = 'Erreur'): void {
    this.toastr.error(message, title);
  }

  /**
   * Show warning notification
   */
  warning(message: string, title: string = 'Attention'): void {
    this.toastr.warning(message, title);
  }

  /**
   * Show info notification
   */
  info(message: string, title: string = 'Information'): void {
    this.toastr.info(message, title);
  }

  /**
   * Show beautiful confirmation dialog using SweetAlert2
   * Returns a promise that resolves to true if user confirms
   */
  async confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a5f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      focusCancel: true
    });

    return result.isConfirmed;
  }

  /**
   * Show success notification for item added to cart
   */
  itemAddedToCart(productName: string): void {
    this.success(`${productName} a été ajouté au panier!`, 'Ajouté au panier');
  }

  /**
   * Show success notification for item removed from cart
   */
  itemRemovedFromCart(): void {
    this.success('Article retiré du panier', 'Supprimé');
  }

  /**
   * Show success notification for cart cleared
   */
  cartCleared(): void {
    this.success('Le panier a été vidé', 'Panier vidé');
  }
}
