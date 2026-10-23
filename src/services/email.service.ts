import { Resend } from 'resend';
import { env } from '../config/env.js';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendContactNotification(data: { name: string; email: string; subject?: string | undefined; body: string }) {
    const { name, email, subject, body } = data;
    
    try {
      const response = await this.resend.emails.send({
        from: 'Portfolio Contact Form <onboarding@resend.dev>', // Update this to your verified domain in production
        to: env.CONTACT_EMAIL_TO,
        replyTo: email,
        subject: `New Contact Message: ${subject || 'No Subject'}`,
        html: `
          <h2>New Message from ${name}</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${body}</p>
        `,
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error };
    }
  }
}
