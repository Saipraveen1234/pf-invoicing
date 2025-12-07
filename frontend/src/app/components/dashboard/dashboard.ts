import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Invoice, InvoiceService } from '../../services/invoice';
import { PdfService } from '../../services/pdf';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  stats = {
    totalInvoices: 0,
    paidAmount: 0,
    pendingAmount: 0
  };
  invoices$: Observable<Invoice[]> | undefined;

  constructor(
    private invoiceService: InvoiceService,
    private pdfService: PdfService
  ) { }

  activeMenuId: string | null = null;

  ngOnInit() {
    this.invoices$ = this.invoiceService.invoices$;
    this.invoices$.subscribe(invoices => {
      this.calculateStats(invoices);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!(event.target as Element).closest('.action-menu-container')) {
        this.activeMenuId = null;
      }
    });
  }

  // ... (calculateStats remains same) ...

  calculateStats(invoices: Invoice[]) {
    this.stats.totalInvoices = invoices.length;

    // Calculate paid amount: Full 'Paid' + 'Partial' amounts
    this.stats.paidAmount = invoices.reduce((sum, inv) => {
      if (inv.status === 'Paid') return sum + inv.totalAmount;
      if (inv.status === 'Partial') return sum + (inv.paidAmount || 0);
      return sum;
    }, 0);

    // Calculate pending amount: Full 'Pending' + remaining from 'Partial'
    this.stats.pendingAmount = invoices.reduce((sum, inv) => {
      if (inv.status === 'Pending') return sum + inv.totalAmount;
      if (inv.status === 'Partial') return sum + (inv.totalAmount - (inv.paidAmount || 0));
      return sum;
    }, 0);
  }

  toggleMenu(event: Event, invoiceId: string) {
    event.stopPropagation();
    if (this.activeMenuId === invoiceId) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = invoiceId;
    }
  }

  viewPdf(invoice: Invoice) {
    this.activeMenuId = null; // Close menu
    this.pdfService.previewInvoicePdf(invoice);
  }

  updateStatus(invoice: Invoice, newStatus: 'Paid' | 'Pending' | 'Partial') {
    this.activeMenuId = null; // Close menu

    let amountToPay: number | undefined;

    if (newStatus === 'Partial') {
      const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
      const amountStr = prompt(`Enter amount being paid now (Remaining: ₹${remainingAmount}):`);
      if (amountStr === null) return; // Cancelled

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount. Please enter a value greater than 0.');
        return;
      }
      if (amount > remainingAmount) {
        alert(`Amount exceeds the remaining balance of ₹${remainingAmount}.`);
        return;
      }
      amountToPay = amount;
    }

    // If marking as Paid/Pending directly, we don't send an amount, backend handles it (Paid=Total, Pending=0)

    const confirmMsg = newStatus === 'Partial'
      ? `Record payment of ₹${amountToPay}?`
      : `Are you sure you want to mark this invoice as ${newStatus}?`;

    if (confirm(confirmMsg)) {
      this.invoiceService.updateStatus(invoice.id, newStatus, amountToPay).subscribe({
        next: () => {
          this.invoiceService.loadInvoices();
        },
        error: (err) => console.error('Error updating status:', err)
      });
    }
  }
}
