import { Resend } from 'resend';
import { env } from '../config/env.js';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });

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
          <h2>New Message from ${escapeHtml(name)}</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject || 'N/A')}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(body)}</p>
        `,
      });

      if (response.error) {
        console.error('Resend rejected contact notification:', response.error);
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error };
    }
  }
}
