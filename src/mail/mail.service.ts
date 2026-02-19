/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactUsDto } from 'src/dto/contactUs.dto';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('BREVO_USER'),
        pass: this.configService.get<string>('BREVO_PASS'),
      },
    });
  }

  async sendContactMail(contactData: ContactUsDto) {
    const { email, subject, message } = contactData;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('BREVO_FROM'), // Verified sender
        to: this.configService.get<string>('ADMIN_EMAIL'),
        replyTo: email, // Allows the admin to hit 'Reply' and reply directly to the user
        subject: `📩 Contact Request: ${subject}`,
        html: `
        <div style="background-color: #f4f5f7; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ef4444; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">ROKTO DIN</h1>
              <p style="color: #fecaca; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Blood Donation Platform</p>
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; font-weight: bold;">New Contact Request</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                You have received a new message via the website's contact form. Here are the details:
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #374151;">
                  <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Sender Email</span>
                  <a href="mailto:${email}" style="color: #ef4444; text-decoration: none; font-weight: 600;">${email}</a>
                </p>
                <p style="margin: 0; font-size: 15px; color: #374151;">
                  <span style="color: #9ca3af; font-size: 13px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Subject</span>
                  <strong>${subject}</strong>
                </p>
              </div>

              <h3 style="color: #1f2937; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Message</h3>
              <div style="background-color: #ffffff; border-left: 4px solid #ef4444; padding: 15px 20px; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 0 8px 8px 0;">
${message}
              </div>
            </div>

            <div style="background-color: #f9fafb; padding: 25px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                This is an automated message from <strong>Rokto Din</strong>.
              </p>
              <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 12px;">
                Reply directly to this email to respond to the user.
              </p>
            </div>

          </div>
        </div>
        `,
      });

      return { success: true, message: 'Contact message sent successfully!' };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }
}
