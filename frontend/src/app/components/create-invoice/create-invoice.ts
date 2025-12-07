import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice';
import { PdfService } from '../../services/pdf';

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss'
})
export class CreateInvoiceComponent {
  invoiceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private pdfService: PdfService,
    private router: Router
  ) {
    this.invoiceForm = this.fb.group({
      invoiceNumber: [{ value: 'Loading...', disabled: true }, Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      clientName: ['', Validators.required],
      clientAddress: ['', Validators.required],
      // Company Details (Non-editable by default)
      panNumber: [{ value: 'ABGFP0171N', disabled: true }, Validators.required],
      accountNumber: [{ value: '80970200001259', disabled: true }, Validators.required],
      accountName: [{ value: 'Paper Flight Studios', disabled: true }, Validators.required],
      ifscCode: [{ value: 'BARB0VJGACH', disabled: true }, Validators.required],
      branch: [{ value: 'Gachibowli', disabled: true }, Validators.required],
      status: ['Pending', Validators.required],
      items: this.fb.array([])
    });

    // Fetch next invoice number
    this.invoiceService.getNextInvoiceNumber().subscribe({
      next: (response) => {
        this.invoiceForm.patchValue({ invoiceNumber: response.nextInvoiceNumber });
      },
      error: (err) => console.error('Error fetching next invoice number:', err)
    });

    // Add initial item
    this.addItem();
  }

  customColumns: string[] = [];

  addCustomColumn() {
    const columnName = prompt('Enter column name:');
    if (columnName && !this.customColumns.includes(columnName)) {
      this.customColumns.push(columnName);

      // Add control for this column to all existing items
      this.items.controls.forEach((control: any) => {
        control.addControl(columnName, this.fb.control(''));
      });
    }
  }

  removeCustomColumn(index: number) {
    const columnName = this.customColumns[index];
    this.customColumns.splice(index, 1);

    // Remove control from all items
    this.items.controls.forEach((control: any) => {
      control.removeControl(columnName);
    });
  }

  enableEditing() {
    const password = prompt('Enter password to edit company details:');
    if (password === 'admin123') {
      this.invoiceForm.get('panNumber')?.enable();
      this.invoiceForm.get('accountNumber')?.enable();
      this.invoiceForm.get('accountName')?.enable();
      this.invoiceForm.get('ifscCode')?.enable();
      this.invoiceForm.get('branch')?.enable();
    } else {
      alert('Incorrect password!');
    }
  }

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    const itemGroup = this.fb.group({
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]]
    });

    // Add controls for existing custom columns
    this.customColumns.forEach(col => {
      (itemGroup as any).addControl(col, this.fb.control(''));
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  get totalAmount(): number {
    return this.items.controls.reduce((sum, control) => {
      return sum + (control.get('price')?.value || 0);
    }, 0);
  }

  onSubmit() {
    if (this.invoiceForm.valid) {
      // Get raw value to include disabled fields
      const formValue = this.invoiceForm.getRawValue();

      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: formValue.invoiceNumber,
        date: formValue.date,
        clientName: formValue.clientName,
        clientAddress: formValue.clientAddress,
        companyDetails: {
          panNumber: formValue.panNumber,
          accountNumber: formValue.accountNumber,
          accountName: formValue.accountName,
          ifscCode: formValue.ifscCode,
          branch: formValue.branch,
          customColumns: this.customColumns // Save custom columns
        },
        status: formValue.status,
        totalAmount: this.totalAmount,
        items: formValue.items
      };

      // Generate PDF Preview
      this.pdfService.previewInvoicePdf(newInvoice);

      // Save and Navigate
      this.invoiceService.addInvoice(newInvoice).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => console.error('Error adding invoice:', err)
      });
    }
  }
}
