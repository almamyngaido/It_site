import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './auth.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { AdminCatalogueComponent } from './admin-catalogue/admin-catalogue.component';
import { AdminCommandesComponent } from './admin-commandes/admin-commandes.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BarNavigationComponent } from './bar-navigation/bar-navigation.component';
import { AccueilComponent } from './accueil/accueil.component';
import { FooterComponent } from './footer/footer.component';
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

@NgModule({
  declarations: [
    AppComponent,
    BarNavigationComponent,
    AccueilComponent,
    FooterComponent,
    CatalogueComponent,
    ServicesItComponent,
    PanierComponent,
    ProfilComponent,
    LoginPageComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    EmailVerifyComponent,
    DevisPageComponent,
    NosProjetsComponent,
    AdminCatalogueComponent,
    AdminCommandesComponent,
    AdminDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      newestOnTop: true
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
