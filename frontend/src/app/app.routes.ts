import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CreateInvoiceComponent } from './components/create-invoice/create-invoice';
import { InvoiceDetailsComponent } from './components/invoice-details/invoice-details';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'create-invoice', component: CreateInvoiceComponent, canActivate: [authGuard] },
    { path: 'invoice/:id', component: InvoiceDetailsComponent, canActivate: [authGuard] },
];
