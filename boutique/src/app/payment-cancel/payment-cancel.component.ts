import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  templateUrl: './payment-cancel.component.html',
  styleUrls: ['./payment-cancel.component.css']
})
export class PaymentCancelComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {}

  /**
   * Return to cart
   */
  returnToCart(): void {
    this.router.navigate(['/panier']);
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/catalogue']);
  }

  /**
   * Go to home
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
