# Email Service Setup Guide

## 📧 Nodemailer Integration for Jeddah Nets Cricket

This guide will help you set up email functionality for the booking system.

---

## 1. Install Dependencies

```bash
cd backend
npm install nodemailer @types/nodemailer
```

---

## 2. Email Service Provider Options

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Generate password and copy it

3. **Update `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=noreply@jeddahnets.com
SMTP_FROM_NAME=Jeddah Nets Cricket
```

### Option B: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=noreply@jeddahnets.com
SMTP_FROM_NAME=Jeddah Nets Cricket
```

### Option C: Custom SMTP Server

If you have a custom email service or domain email:

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Jeddah Nets Cricket
```

---

## 3. Email Templates Included

### ✅ Booking Confirmation Email
- Sent after successful booking creation
- Includes all booking details
- Shows payment status (paid/partial/pending)
- Displays remaining balance if partial payment

### ❌ Booking Cancellation Email
- Sent when booking is cancelled
- Shows refund amount (if applicable)
- Includes cancellation details

### 💳 Payment Receipt Email
- Sent after payment completion
- Transaction reference included
- Full payment breakdown

---

## 4. Usage in Controllers

### Send Booking Confirmation
```typescript
import { EmailService } from "../services/email.service";
import { format } from "date-fns";

// After creating booking
await EmailService.sendBookingConfirmation({
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "0512345678",
  bookingId: "BK-2024-001",
  courtName: "Court 1",
  bookingDate: format(new Date(), "EEEE, MMMM d, yyyy"),
  startTime: "18:00",
  endTime: "21:00",
  durationHours: 3,
  totalPrice: 300,
  amountPaid: 150,
  paymentStatus: "partial",
  paymentMethod: "Credit Card"
});
```

### Send Cancellation Email
```typescript
await EmailService.sendBookingCancellation(
  {
    customerName: "John Doe",
    bookingId: "BK-2024-001",
    courtName: "Court 1",
    bookingDate: format(new Date(), "EEEE, MMMM d, yyyy"),
    startTime: "18:00",
    endTime: "21:00",
    refundAmount: 145,
    cancellationReason: "Customer request"
  },
  "john@example.com"
);
```

### Send Payment Receipt
```typescript
await EmailService.sendPaymentReceipt({
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "0512345678",
  bookingId: "BK-2024-001",
  courtName: "Court 1",
  bookingDate: format(new Date(), "EEEE, MMMM d, yyyy"),
  startTime: "18:00",
  endTime: "21:00",
  durationHours: 3,
  totalPrice: 300,
  amountPaid: 300,
  paymentStatus: "paid",
  paymentMethod: "Credit Card",
  paymentReference: "TXN-123456",
  paymentDate: format(new Date(), "MMMM d, yyyy HH:mm")
});
```

---

## 5. Testing Email Service

The server automatically tests the email connection on startup. Check console for:
- ✅ `Email service is ready` - Configuration is correct
- ❌ `Email service error` - Check your credentials

To manually test:
```typescript
import { EmailService } from "./services/email.service";

// Test connection
const isReady = await EmailService.testConnection();
console.log("Email ready:", isReady);

// Send test email
await EmailService.sendEmail({
  to: "test@example.com",
  subject: "Test Email",
  html: "<h1>Hello from Jeddah Nets Cricket!</h1>"
});
```

---

## 6. Important Notes

### Gmail Security
- Use App Passwords (NOT your regular password)
- Enable 2FA before generating app password
- App passwords are 16 characters without spaces

### Email Best Practices
- Always check if `customerEmail` exists before sending
- All emails fail silently (return false) if email is not provided
- Errors are logged but don't break the booking flow
- Email sending is asynchronous and non-blocking

### Email Deliverability
- Emails might go to spam initially
- For production, use a professional email service (SendGrid, AWS SES, etc.)
- Configure SPF, DKIM, and DMARC records for your domain

---

## 7. Integration with Booking Flow

The email service is designed to be called after:

1. **Booking Creation** → Send confirmation email
2. **Payment Completion** → Send payment receipt
3. **Booking Cancellation** → Send cancellation email with refund info

### Example Integration (customer booking):
```typescript
// After successful booking creation
const booking = await Booking.create({ ... });

// Send confirmation email (non-blocking)
EmailService.sendBookingConfirmation({
  customerName: customer.name,
  customerEmail: customer.email,
  customerPhone: customer.phone,
  bookingId: booking.id,
  courtName: court.name,
  bookingDate: format(booking.bookingDate, "EEEE, MMMM d, yyyy"),
  startTime: booking.startTime,
  endTime: booking.endTime,
  durationHours: booking.durationHours,
  totalPrice: booking.finalPrice,
  amountPaid: booking.amountPaid,
  paymentStatus: booking.paymentStatus,
  paymentMethod: booking.paymentMethod
}).catch(err => console.error("Email failed:", err));
```

---

## 8. Next Steps (After Payment Integration)

When payment gateway is integrated:
1. Send confirmation email after successful booking
2. Send payment receipt after payment webhook confirms payment
3. Update `sendPaymentReceipt` calls with actual payment references
4. Handle partial payments with remaining balance emails

---

## 9. Troubleshooting

### "Invalid login" error with Gmail
- Make sure you're using App Password, not regular password
- Enable 2FA first
- App password is 16 characters with no spaces

### Emails not sending
- Check SMTP credentials in `.env`
- Verify port and host are correct
- Check firewall settings (port 587 should be open)
- Look for errors in console logs

### Emails going to spam
- Use a verified domain email
- Configure SPF records
- Consider using professional email service for production

---

## Ready to Use! 🚀

The email service is now set up and ready to be integrated into your booking and payment workflows.
