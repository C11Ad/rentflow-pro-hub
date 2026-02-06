import cribhubLogo from "@/assets/cribhub-logo.png";
import jsPDF from "jspdf";

// CribHub branding colors
export const CRIBHUB_COLORS = {
  primary: "#2563eb",
  secondary: "#1e40af",
  accent: "#3b82f6",
  dark: "#1e3a5f",
  light: "#f0f9ff",
};

// Convert image to base64 for embedding in documents
export const getLogoBase64 = async (): Promise<string> => {
  try {
    const response = await fetch(cribhubLogo);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load logo:", error);
    return "";
  }
};

// Load image for PDF
const loadImageForPdf = async (): Promise<HTMLImageElement | null> => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = cribhubLogo;
    });
  } catch {
    return null;
  }
};

// Generate branded HTML document header
export const generateBrandedHeader = (logoBase64: string, documentTitle: string) => `
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${CRIBHUB_COLORS.primary};">
    <img src="${logoBase64}" alt="CribHub" style="height: 60px; margin-bottom: 15px;" />
    <h1 style="margin: 0; color: ${CRIBHUB_COLORS.dark}; font-size: 28px; font-family: 'Georgia', serif;">${documentTitle}</h1>
  </div>
`;

// Generate branded HTML document footer
export const generateBrandedFooter = (documentId?: string) => `
  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid ${CRIBHUB_COLORS.primary}; text-align: center; color: #666; font-size: 11px;">
    <p style="margin: 5px 0;"><strong>CribHub Property Management</strong></p>
    <p style="margin: 5px 0;">This document was generated through the CribHub platform</p>
    ${documentId ? `<p style="margin: 5px 0; color: #999;">Document ID: ${documentId}</p>` : ''}
    <p style="margin: 5px 0; color: #999;">Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
    <p style="margin: 10px 0 0 0; color: ${CRIBHUB_COLORS.primary};">www.cribhub.com</p>
  </div>
`;

// Full branded document template
export const generateBrandedDocument = async (
  title: string,
  content: string,
  documentId?: string
): Promise<string> => {
  const logoBase64 = await getLogoBase64();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | CribHub</title>
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    body { 
      font-family: 'Georgia', 'Times New Roman', serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px 20px; 
      line-height: 1.8; 
      color: #333;
      background: #fff;
    }
    .document-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${CRIBHUB_COLORS.primary};
    }
    .document-header img {
      height: 60px;
      margin-bottom: 15px;
    }
    .document-header h1 {
      margin: 0;
      color: ${CRIBHUB_COLORS.dark};
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .document-meta {
      background: ${CRIBHUB_COLORS.light};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 12px;
      color: #555;
    }
    .document-content {
      white-space: pre-wrap;
      font-size: 14px;
    }
    .document-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${CRIBHUB_COLORS.primary};
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    .document-footer p {
      margin: 5px 0;
    }
    .cribhub-watermark {
      position: fixed;
      bottom: 10px;
      right: 10px;
      opacity: 0.1;
      font-size: 48px;
      font-weight: bold;
      color: ${CRIBHUB_COLORS.primary};
      transform: rotate(-45deg);
      pointer-events: none;
    }
    @media print { 
      body { margin: 0; padding: 20px; }
      .cribhub-watermark { display: none; }
    }
  </style>
</head>
<body>
  <div class="document-header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="CribHub" />` : '<div style="height: 60px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: ' + CRIBHUB_COLORS.primary + ';">CribHub</div>'}
    <h1>${title}</h1>
  </div>
  
  <div class="document-content">${content}</div>
  
  <div class="document-footer">
    <p><strong>CribHub Property Management</strong></p>
    <p>This document was generated through the CribHub platform</p>
    ${documentId ? `<p style="color: #999;">Document ID: ${documentId}</p>` : ''}
    <p style="color: #999;">Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
    <p style="margin-top: 10px; color: ${CRIBHUB_COLORS.primary};">www.cribhub.com</p>
  </div>
  
  <div class="cribhub-watermark">CribHub</div>
</body>
</html>`;
};

// Receipt specific branded template
export const generatePaymentReceipt = async (
  receiptData: {
    receiptNumber: string;
    tenantName: string;
    propertyAddress: string;
    unitNumber: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    description: string;
    landlordName?: string;
  }
): Promise<string> => {
  const logoBase64 = await getLogoBase64();
  const currencySymbols: Record<string, string> = {
    GHS: "GH₵",
    USD: "$",
    EUR: "€",
    GBP: "£",
    NGN: "₦"
  };
  const symbol = currencySymbols[receiptData.currency] || receiptData.currency;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptData.receiptNumber} | CribHub</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 40px 20px; 
      color: #333;
      background: #fff;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${CRIBHUB_COLORS.primary};
    }
    .receipt-header img { height: 50px; margin-bottom: 10px; }
    .receipt-header h1 { 
      margin: 10px 0 0 0; 
      color: ${CRIBHUB_COLORS.dark}; 
      font-size: 24px; 
      letter-spacing: 2px;
    }
    .receipt-number {
      background: ${CRIBHUB_COLORS.light};
      padding: 10px 20px;
      border-radius: 5px;
      display: inline-block;
      margin-top: 10px;
      font-size: 14px;
      color: ${CRIBHUB_COLORS.primary};
      font-weight: bold;
    }
    .receipt-body { padding: 20px 0; }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .receipt-row:last-child { border-bottom: none; }
    .receipt-label { color: #666; font-size: 14px; }
    .receipt-value { font-weight: 600; color: #333; font-size: 14px; text-align: right; }
    .receipt-amount {
      background: linear-gradient(135deg, ${CRIBHUB_COLORS.primary}, ${CRIBHUB_COLORS.secondary});
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      margin: 20px 0;
    }
    .receipt-amount .label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
    .receipt-amount .value { font-size: 32px; font-weight: bold; }
    .receipt-status {
      background: #10b981;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      display: inline-block;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .receipt-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${CRIBHUB_COLORS.primary};
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    .receipt-footer p { margin: 5px 0; }
    @media print { body { margin: 0; padding: 20px; } }
  </style>
</head>
<body>
  <div class="receipt-header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="CribHub" />` : '<div style="font-size: 28px; font-weight: bold; color: ' + CRIBHUB_COLORS.primary + ';">CribHub</div>'}
    <h1>PAYMENT RECEIPT</h1>
    <div class="receipt-number">Receipt #${receiptData.receiptNumber}</div>
  </div>
  
  <div style="text-align: center; margin-bottom: 20px;">
    <span class="receipt-status">✓ Payment Successful</span>
  </div>
  
  <div class="receipt-amount">
    <div class="label">Amount Paid</div>
    <div class="value">${symbol} ${receiptData.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
  </div>
  
  <div class="receipt-body">
    <div class="receipt-row">
      <span class="receipt-label">Date & Time</span>
      <span class="receipt-value">${receiptData.paymentDate}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Tenant Name</span>
      <span class="receipt-value">${receiptData.tenantName}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Property</span>
      <span class="receipt-value">${receiptData.propertyAddress}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Unit</span>
      <span class="receipt-value">${receiptData.unitNumber}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Description</span>
      <span class="receipt-value">${receiptData.description}</span>
    </div>
    <div class="receipt-row">
      <span class="receipt-label">Payment Method</span>
      <span class="receipt-value">${receiptData.paymentMethod}</span>
    </div>
    ${receiptData.landlordName ? `
    <div class="receipt-row">
      <span class="receipt-label">Landlord</span>
      <span class="receipt-value">${receiptData.landlordName}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="receipt-footer">
    <p><strong>CribHub Property Management</strong></p>
    <p>Thank you for your payment!</p>
    <p style="color: #999;">This is an official receipt generated by CribHub</p>
    <p style="margin-top: 10px; color: ${CRIBHUB_COLORS.primary};">www.cribhub.com | support@cribhub.com</p>
  </div>
</body>
</html>`;
};

// Generate PDF document with CribHub branding
export const generateBrandedPdf = async (
  title: string,
  content: string,
  documentType: string,
  location: string,
  documentId?: string
): Promise<jsPDF> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Load logo
  const logoImg = await loadImageForPdf();

  // Header with logo
  if (logoImg) {
    const logoHeight = 15;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    pdf.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, yPosition, logoWidth, logoHeight);
    yPosition += logoHeight + 5;
  } else {
    // Text fallback for logo
    pdf.setFontSize(24);
    pdf.setTextColor(37, 99, 235); // Primary blue
    pdf.text('CribHub', pageWidth / 2, yPosition + 10, { align: 'center' });
    yPosition += 15;
  }

  // Document title
  pdf.setFontSize(18);
  pdf.setTextColor(30, 58, 95); // Dark color
  pdf.text(title.toUpperCase(), pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += 15;

  // Subtitle
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Facilitated by CribHub Property Management', pageWidth / 2, yPosition + 5, { align: 'center' });
  yPosition += 10;

  // Blue separator line
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.8);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Document meta info box
  pdf.setFillColor(240, 249, 255); // Light blue
  pdf.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  pdf.text(`Document Type: ${documentType.replace(/_/g, ' ')}  |  Jurisdiction: ${location}  |  Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 7, { align: 'center' });
  yPosition += 20;

  // Content
  pdf.setFontSize(11);
  pdf.setTextColor(51, 51, 51);
  
  // Split content into lines that fit the page width
  const lines = pdf.splitTextToSize(content, contentWidth);
  const lineHeight = 5;

  for (let i = 0; i < lines.length; i++) {
    // Check if we need a new page
    if (yPosition + lineHeight > pageHeight - 40) {
      // Add page footer before new page
      addPdfFooter(pdf, pageWidth, pageHeight, documentId);
      pdf.addPage();
      yPosition = margin;
      
      // Add header to new page
      pdf.setFontSize(8);
      pdf.setTextColor(37, 99, 235);
      pdf.text('CribHub', margin, yPosition);
      pdf.setTextColor(150, 150, 150);
      pdf.text(title, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 10;
      
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
      
      pdf.setFontSize(11);
      pdf.setTextColor(51, 51, 51);
    }
    
    pdf.text(lines[i], margin, yPosition);
    yPosition += lineHeight;
  }

  // Add footer to last page
  addPdfFooter(pdf, pageWidth, pageHeight, documentId);

  return pdf;
};

// Add footer to PDF page
const addPdfFooter = (pdf: jsPDF, pageWidth: number, pageHeight: number, documentId?: string) => {
  const footerY = pageHeight - 25;
  
  // Footer separator
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(20, footerY, pageWidth - 20, footerY);
  
  // Footer text
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('CribHub Property Management', pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.text('This document was generated through CribHub  |  www.cribhub.com', pageWidth / 2, footerY + 9, { align: 'center' });
  
  if (documentId) {
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Document ID: ${documentId}`, pageWidth / 2, footerY + 13, { align: 'center' });
  }
  
  // Page number
  const pageCount = pdf.getNumberOfPages();
  const currentPage = pdf.getCurrentPageInfo().pageNumber;
  pdf.setFontSize(8);
  pdf.setTextColor(37, 99, 235);
  pdf.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 20, footerY + 13, { align: 'right' });
};

// Generate Payment Receipt PDF with enhanced professional layout
export const generateReceiptPdf = async (
  receiptData: {
    receiptNumber: string;
    tenantName: string;
    propertyAddress: string;
    unitNumber: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    description: string;
    landlordName?: string;
    transactionId?: string;
    paymentPeriod?: string;
  }
): Promise<jsPDF> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const currencySymbols: Record<string, string> = {
    GHS: "GH₵",
    USD: "$",
    EUR: "€",
    GBP: "£",
    NGN: "₦"
  };
  const symbol = currencySymbols[receiptData.currency] || receiptData.currency;

  // Helper function to format currency amounts properly (e.g., GH₵ 5,000.00)
  const formatCurrency = (amount: number): string => {
    const parts = amount.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = parts[1];
    return `${symbol} ${integerPart}.${decimalPart}`;
  };

  // Helper function to add a row with label and value
  const addDetailRow = (label: string, value: string, isLast = false) => {
    // Background alternating
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text(label, margin + 5, yPosition);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont("helvetica", "bold");
    // Handle long values by wrapping
    const maxValueWidth = contentWidth - 80;
    const lines = pdf.splitTextToSize(value, maxValueWidth);
    pdf.text(lines, pageWidth - margin - 5, yPosition, { align: 'right' });
    pdf.setFont("helvetica", "normal");
    yPosition += 4;
    if (!isLast) {
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.2);
      pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    }
    yPosition += 8;
  };

  // Load logo
  const logoImg = await loadImageForPdf();

  // === HEADER SECTION ===
  // Background header bar
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 50, 'F');

  // Logo on header
  if (logoImg) {
    const logoHeight = 12;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    pdf.addImage(logoImg, 'PNG', margin, 10, logoWidth, logoHeight);
  } else {
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text('CribHub', margin, 20);
    pdf.setFont("helvetica", "normal");
  }

  // Title on right side of header
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text('PAYMENT RECEIPT', pageWidth - margin, 20, { align: 'right' });
  pdf.setFont("helvetica", "normal");
  
  // Receipt number under title
  pdf.setFontSize(10);
  pdf.setTextColor(220, 230, 255);
  pdf.text(`Receipt No: ${receiptData.receiptNumber}`, pageWidth - margin, 30, { align: 'right' });
  
  // Generation date
  pdf.setFontSize(8);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })}`, pageWidth - margin, 38, { align: 'right' });

  yPosition = 60;

  // === PAYMENT STATUS BADGE ===
  pdf.setFillColor(16, 185, 129);
  pdf.roundedRect(margin, yPosition, 45, 8, 2, 2, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text('PAID', margin + 22.5, yPosition + 5.5, { align: 'center' });
  pdf.setFont("helvetica", "normal");
  
  // Date next to badge
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text(receiptData.paymentDate, margin + 50, yPosition + 5.5);
  
  yPosition += 18;

  // === AMOUNT SECTION ===
  // Amount box with gradient effect simulation
  pdf.setFillColor(250, 251, 255);
  pdf.roundedRect(margin, yPosition, contentWidth, 35, 4, 4, 'F');
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(margin, yPosition, contentWidth, 35, 4, 4, 'S');
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Total Amount Paid', margin + 10, yPosition + 12);
  
  pdf.setFontSize(28);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(receiptData.amount), margin + 10, yPosition + 27);
  pdf.setFont("helvetica", "normal");
  
  // Currency label on right
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text(receiptData.currency, pageWidth - margin - 10, yPosition + 27, { align: 'right' });
  
  yPosition += 45;

  // === TENANT INFORMATION SECTION ===
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont("helvetica", "bold");
  pdf.text('TENANT INFORMATION', margin + 5, yPosition + 7);
  pdf.setFont("helvetica", "normal");
  yPosition += 16;

  addDetailRow('Name', receiptData.tenantName);
  addDetailRow('Property Address', receiptData.propertyAddress);
  addDetailRow('Unit Number', receiptData.unitNumber, true);
  
  yPosition += 5;

  // === PAYMENT DETAILS SECTION ===
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont("helvetica", "bold");
  pdf.text('PAYMENT DETAILS', margin + 5, yPosition + 7);
  pdf.setFont("helvetica", "normal");
  yPosition += 16;

  addDetailRow('Description', receiptData.description);
  addDetailRow('Payment Method', receiptData.paymentMethod);
  
  if (receiptData.paymentPeriod) {
    addDetailRow('Payment Period', receiptData.paymentPeriod);
  }
  
  if (receiptData.transactionId) {
    addDetailRow('Transaction ID', receiptData.transactionId);
  }
  
  if (receiptData.landlordName) {
    addDetailRow('Landlord/Property Owner', receiptData.landlordName, true);
  }

  yPosition += 10;

  // === QR CODE PLACEHOLDER / VERIFICATION SECTION ===
  pdf.setFillColor(250, 250, 250);
  pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'S');
  
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('For verification, reference this receipt number:', margin + 5, yPosition + 8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(37, 99, 235);
  pdf.text(receiptData.receiptNumber, margin + 5, yPosition + 15);
  pdf.setFont("helvetica", "normal");
  
  // Verification text on right
  pdf.setTextColor(100, 100, 100);
  pdf.text('This receipt is electronically generated', pageWidth - margin - 5, yPosition + 12, { align: 'right' });

  // === FOOTER ===
  const footerY = pageHeight - 35;
  
  // Footer line
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.8);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  // Thank you message
  pdf.setFontSize(11);
  pdf.setTextColor(37, 99, 235);
  pdf.setFont("helvetica", "bold");
  pdf.text('Thank you for your payment!', pageWidth / 2, footerY + 8, { align: 'center' });
  pdf.setFont("helvetica", "normal");
  
  // Company info
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  pdf.text('CribHub Property Management Platform', pageWidth / 2, footerY + 15, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setTextColor(37, 99, 235);
  pdf.text('www.cribhub.com  •  support@cribhub.com', pageWidth / 2, footerY + 21, { align: 'center' });
  
  // Legal note
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This is an official payment receipt. Please retain for your records.', pageWidth / 2, footerY + 28, { align: 'center' });

  return pdf;
};
