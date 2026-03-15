import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './accueil/accueil.component';
import { CatalogueComponent } from './catalogue/catalogue.component';
import { ServicesItComponent } from './services-it/services-it.component';
import { PanierComponent } from './panier/panier.component';
import { ProfilComponent } from './profil/profil.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentCancelComponent } from './payment-cancel/payment-cancel.component';
import { EmailVerifyComponent } from './email-verify/email-verify.component';
import { DevisPageComponent } from './devis-page/devis-page.component';
import { NosProjetsComponent } from './nos-projets/nos-projets.component';
import { AdminCatalogueComponent } from './admin-catalogue/admin-catalogue.component';
import { AdminCommandesComponent } from './admin-commandes/admin-commandes.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: AccueilComponent },
  { path: 'catalogue', component: CatalogueComponent },
  { path: 'service-it', component: ServicesItComponent },
  { path: 'panier', component: PanierComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'contact', component: DevisPageComponent },
  { path: 'devis-contact', component: DevisPageComponent },
  { path: 'auth/verify-email', component: EmailVerifyComponent },
  { path: 'payment/success', component: PaymentSuccessComponent },
  { path: 'payment/cancel', component: PaymentCancelComponent },
  { path: 'nos-projets', component: NosProjetsComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/catalogue', component: AdminCatalogueComponent, canActivate: [AdminGuard] },
  { path: 'admin/commandes', component: AdminCommandesComponent, canActivate: [AdminGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
