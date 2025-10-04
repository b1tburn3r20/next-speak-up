import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

interface ContactEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export const sendContactEmail = async (data: ContactEmailData) => {
  const { firstName, lastName, email, phone, message } = data;

  // Create full name
  const fullName = `${firstName} ${lastName}`.trim() || "Anonymous";

  // HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: white;
          padding: 30px 20px;
          border: 1px solid #e1e5e9;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .field {
          margin-bottom: 20px;
        }
        .field-label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 5px;
        }
        .field-value {
          background: #f7fafc;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }
        .message-content {
          background: #f7fafc;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #48bb78;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e5e9;
          color: #718096;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Cool Bills Website</p>
      </div>
      
      <div class="content">
        <div class="field">
          <div class="field-label">From:</div>
          <div class="field-value">${fullName}</div>
        </div>
        
        <div class="field">
          <div class="field-label">Email:</div>
          <div class="field-value">
            <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
          </div>
        </div>
        
        ${
          phone
            ? `
        <div class="field">
          <div class="field-label">Phone:</div>
          <div class="field-value">
            <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a>
          </div>
        </div>
        `
            : ""
        }
        
        <div class="field">
          <div class="field-label">Message:</div>
          <div class="message-content">${message}</div>
        </div>
      </div>
      
      <div class="footer">
        <p>This message was sent from your Cool Bills contact form.</p>
        <p>Received on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `;

  // Plain text fallback
  const textContent = `
New Contact Form Submission - Cool Bills

From: ${fullName}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}

Message:
${message}

---
Received on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Cool Bills Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      replyTo: email, // Allow easy reply to the customer
      subject: `New Contact Form Message from ${fullName}`,
      html: htmlContent,
      text: textContent,
    });

    console.log("Message sent: %s", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Optional: Send auto-reply to customer
export const sendAutoReply = async (
  customerEmail: string,
  customerName: string
) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for contacting Cool Bills</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: white;
          padding: 30px 20px;
          border: 1px solid #e1e5e9;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e5e9;
          color: #718096;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Thank You!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">We've received your message</p>
      </div>
      
      <div class="content">
        <p>Hi ${customerName},</p>
        
        <p>Thank you for reaching out to Cool Bills! We've successfully received your message and will get back to you within 24 hours.</p>
        
        <p>Our team is reviewing your inquiry and will respond with the information you requested or next steps as appropriate.</p>
        
        <p>If you have any urgent questions in the meantime, feel free to reply to this email.</p>
        
        <p>Best regards,<br>
        The Cool Bills Team</p>
      </div>
      
      <div class="footer">
        <p>Cool Bills | info@coolbills.com</p>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Cool Bills" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: "Thank you for contacting Cool Bills - We'll be in touch soon!",
      html: htmlContent,
      text: `Hi ${customerName},\n\nThank you for reaching out to Cool Bills! We've successfully received your message and will get back to you within 24 hours.\n\nBest regards,\nThe Cool Bills Team`,
    });

    console.log("Auto-reply sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending auto-reply:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
