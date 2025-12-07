import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from './invoice';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    previewInvoicePdf(invoice: Invoice) {
        const doc = new jsPDF();

        const loadImage = (url: string): Promise<HTMLImageElement> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img); // Resolve even on error to continue
            });
        };

        Promise.all([
            loadImage('/logo.png'),
            loadImage('/vibhu sign.png')
        ]).then(([logoImg, signImg]) => {
            // Add Logo (Top Right)
            if (logoImg.width > 0) {
                doc.addImage(logoImg, 'PNG', 150, 10, 40, 20); // x, y, w, h
            }
            this.renderContent(doc, invoice, signImg);
        });
    }

    private renderContent(doc: jsPDF, invoice: Invoice, signImg: HTMLImageElement) {
        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', 15, 20);

        // Reset Font
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Left Column (Date, Invoice No, Bill To)
        let yPos = 40;

        doc.text(`Date: ${this.formatDate(invoice.date)}`, 15, yPos);
        yPos += 5;
        doc.line(15, yPos, 80, yPos); // Underline
        yPos += 10;

        doc.text(`No. Invoice : ${invoice.invoiceNumber.replace('INV-', '')}`, 15, yPos);
        yPos += 5;
        doc.line(15, yPos, 80, yPos); // Underline
        yPos += 15;

        doc.text(`Bill to: ${invoice.clientName}`, 15, yPos);
        yPos += 10;

        // Address (Multi-line)
        const addressLines = doc.splitTextToSize(`Address: ${invoice.clientAddress}`, 80);
        doc.text(addressLines, 15, yPos);

        // Right Column (Company Details)
        yPos = 40;
        const rightColX = 120;
        const details = invoice.companyDetails;

        // Helper to render bold label and normal value
        const renderField = (label: string, value: string, x: number, y: number) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, x, y);
            const labelWidth = doc.getTextWidth(label);
            doc.setFont('helvetica', 'normal');
            doc.text(value || '', x + labelWidth, y);
        };

        renderField('Payment Method: ', 'Bank Transfer', rightColX, yPos);
        yPos += 6;
        renderField('Account number: ', details.accountNumber || '', rightColX, yPos);
        yPos += 6;
        renderField('Account name: ', details.accountName || '', rightColX, yPos);
        yPos += 6;
        renderField('IFSC Code: ', details.ifscCode || '', rightColX, yPos);
        yPos += 6;
        renderField('Branch: ', details.branch || '', rightColX, yPos);
        yPos += 6;
        renderField('PAN Card: ', details.panNumber || '', rightColX, yPos);

        // Table
        yPos = 110; // Start table below address

        const customColumns = invoice.companyDetails.customColumns || [];
        const headRow = ['S.No', 'Item Description', ...customColumns, 'Price in Rs'];

        autoTable(doc, {
            startY: yPos,
            head: [headRow],
            body: invoice.items.map((item, index) => {
                const row = [
                    index + 1,
                    item.description,
                    ...customColumns.map(col => item[col] || '-'), // Add custom column values
                    `${item.price.toLocaleString()}/-`
                ];
                return row;
            }),
            theme: 'plain',
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0],
                fontSize: 10
            },
            headStyles: {
                fillColor: [240, 240, 240], // Light gray header
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 }, // S.No
                1: { halign: 'center' }, // Description - Center aligned
                // Custom columns - Center align them
                ...customColumns.reduce((acc, _, i) => ({ ...acc, [i + 2]: { halign: 'center' } }), {}),
                [headRow.length - 1]: { halign: 'center', cellWidth: 40 }   // Price - Center aligned
            },
            margin: { left: 15, right: 15 },
            tableWidth: 'auto' // Ensure full width
        });

        // Total Box
        const finalY = (doc as any).lastAutoTable.finalY + 20;

        // "Amount to be transferred" box
        doc.rect(15, finalY, 110, 10);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount to be transferred', 70, finalY + 7, { align: 'center' });

        // "Total Rs" box
        doc.rect(135, finalY, 60, 10); // Aligned right
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Rs: ${invoice.totalAmount.toLocaleString()}/-`, 140, finalY + 7);

        // Footer / Signature
        const footerY = 270;

        // Contact Info
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('+91-9848423737', 20, footerY);
        doc.text('hello@paperflightstudios.com', 20, footerY + 5);
        doc.text('www.paperflightstudios.com', 20, footerY + 10);

        // Signature
        if (signImg.width > 0) {
            doc.addImage(signImg, 'PNG', 145, footerY - 25, 30, 15); // Adjust position and size
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Vibhu Yadati', 160, footerY + 5, { align: 'center' });
        doc.line(140, footerY, 180, footerY); // Line under signature

        // Preview (Open in new tab)
        window.open(doc.output('bloburl'), '_blank');
    }

    private formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
}
