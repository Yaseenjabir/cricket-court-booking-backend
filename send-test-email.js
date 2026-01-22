const nodemailer = require("nodemailer");

// Use the correct SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: "contact@jeddahcricketnets.com",
    pass: "Welcome223070!",
  },
});

const mailOptions = {
  from: "Jeddah Nets Cricket <contact@jeddahcricketnets.com>",
  to: "yaseenjabir791@gmail.com",
  subject: "🏏 Test Email from Jeddah Cricket Nets",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
        }
        .content {
          padding: 40px 30px;
        }
        .success-box {
          background: #d4edda;
          border-left: 4px solid #28a745;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏏 Test Email Successful!</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Your email service is working perfectly</p>
        </div>
        
        <div class="content">
          <h2 style="color: #667eea;">Congratulations! 🎉</h2>
          
          <p>This is a test email from your <strong>Jeddah Cricket Nets</strong> booking system.</p>
          
          <div class="success-box">
            <strong>✅ Email Service Status:</strong><br>
            Your SMTP configuration is working correctly and you can now send booking confirmations, cancellations, and payment receipts to your customers!
          </div>
          
          <h3>Email Service Details:</h3>
          <ul>
            <li><strong>SMTP Server:</strong> smtpout.secureserver.net</li>
            <li><strong>From Email:</strong> contact@jeddahcricketnets.com</li>
            <li><strong>Service:</strong> Titan Email (GoDaddy)</li>
            <li><strong>Status:</strong> ✅ Active and Working</li>
          </ul>
          
          <h3>Next Steps:</h3>
          <ol>
            <li>Email service is ready for production</li>
            <li>Booking confirmation emails will be sent automatically</li>
            <li>Payment receipts will be generated</li>
            <li>Cancellation notifications are configured</li>
          </ol>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Jeddah Nets Cricket Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>Jeddah Nets Cricket | Premium Cricket Facilities</p>
          <p>Test email sent on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

console.log("📧 Sending test email to yaseenjabir791@gmail.com...\n");

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log("❌ Failed to send email:");
    console.log(error);
  } else {
    console.log("✅ Email sent successfully!");
    console.log("📬 Message ID:", info.messageId);
    console.log("📨 To:", mailOptions.to);
    console.log("📤 From:", mailOptions.from);
    console.log("\n🎉 Check your Gmail inbox!");
  }
});
