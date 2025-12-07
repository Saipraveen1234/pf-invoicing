import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice';

@Component({
    selector: 'app-invoice-details',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './invoice-details.html',
    styleUrls: ['./invoice-details.scss']
})
export class InvoiceDetailsComponent implements OnInit {
    invoice: Invoice | null = null;
    loading = true;
    error = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadInvoice(id);
        } else {
            this.error = 'Invoice ID not found';
            this.loading = false;
        }
    }

    loadInvoice(id: string) {
        this.invoiceService.getInvoiceById(id).subscribe({
            next: (invoice) => {
                this.invoice = invoice;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading invoice:', err);
                this.error = 'Failed to load invoice details';
                this.loading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    printInvoice() {
        window.print();
    }

    downloadPDF() {
        // TODO: Implement PDF download functionality
        alert('PDF download will be implemented');
    }

    editInvoice() {
        // TODO: Implement edit functionality
        alert('Edit functionality will be implemented');
    }

    deleteInvoice() {
        if (confirm('Are you sure you want to delete this invoice?')) {
            // TODO: Implement delete functionality
            alert('Delete functionality will be implemented');
        }
    }
}
