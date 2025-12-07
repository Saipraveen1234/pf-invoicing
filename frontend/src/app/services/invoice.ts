import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  price: number;
  [key: string]: any; // Allow dynamic properties for custom columns
}

export interface CompanyDetails {
  name?: string;
  address?: string;
  pan?: string;
  email?: string;
  panNumber?: string;
  accountNumber?: string;
  accountName?: string;
  ifscCode?: string;
  branch?: string;
  bankDetails?: string;
  customColumns?: string[]; // Store custom column headers
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  companyDetails: CompanyDetails;
  status: string;
  totalAmount: number;
  paidAmount?: number; // Optional for partial payments
  items: InvoiceItem[];
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'http://localhost:3000/api/invoices';
  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  invoices$ = this.invoicesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInvoices();
  }

  loadInvoices() {
    this.http.get<Invoice[]>(this.apiUrl).subscribe({
      next: (invoices) => {
        this.invoicesSubject.next(invoices);
      },
      error: (error) => console.error('Error loading invoices:', error)
    });
  }

  addInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice).pipe(
      tap(newInvoice => {
        const currentInvoices = this.invoicesSubject.value;
        this.invoicesSubject.next([newInvoice, ...currentInvoices]);
      })
    );
  }

  getNextInvoiceNumber(): Observable<{ nextInvoiceNumber: string }> {
    return this.http.get<{ nextInvoiceNumber: string }>(`${this.apiUrl}/next-number`);
  }

  updateStatus(id: string, status: string, paidAmount?: number): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, { status, paidAmount });
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }
}

