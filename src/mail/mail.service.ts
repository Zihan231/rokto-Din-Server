/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactUsDto } from '../dto/contactUs.dto';

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

  // contact Mail
  async sendContactMail(contactData: ContactUsDto) {
    const { email, subject, message } = contactData;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('BREVO_FROM'), // Verified sender
        to: this.configService.get<string>('ADMIN_EMAIL'),
        replyTo: email, // Allows the admin to hit 'Reply' and reply directly to the user
        subject: `📩 Contact Request: ${subject}`,
        html: `
        <div style="background-color: #EAEFEF; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000;">
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #FEFEFD; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            
            <div style="background-color: #8A1119; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; font-style: italic;">Rokto Din</h1>
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="margin-top: 0; color: #000000; font-size: 22px; font-weight: bold;">New Contact Request</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                You have received a new message via the website's contact form. Here are the details:
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #374151;">
                  <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Sender Email</span>
                  <a href="mailto:${email}" style="color: #8A1119; text-decoration: none; font-weight: 600;">${email}</a>
                </p>
                <p style="margin: 0; font-size: 15px; color: #374151;">
                  <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Subject</span>
                  <strong>${subject}</strong>
                </p>
              </div>

              <h3 style="color: #000000; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Message</h3>
              <div style="background-color: #ffffff; border-left: 4px solid #8A1119; padding: 15px 20px; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 0 8px 8px 0;">
${message}
              </div>
            </div>

            <div style="background-color: #2A2C2B; padding: 25px 20px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold;">Rokto Din Team</p>
              <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 12px;">
                This is an automated message. Reply directly to this email to respond to the user.
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

  // Reset Mail
  async sendResetEmail(to: string, resetLink: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('BREVO_FROM'), // verified sender
        to,
        subject: '🔒 Reset Your Password | পাসওয়ার্ড রিসেট করুন - Rokto Din',
        html: `
        <div style="background-color: #EAEFEF; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000;">
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #FEFEFD; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            
            <div style="background-color: #8A1119; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; font-style: italic;">Rokto Din</h1>
            </div>

            <div style="padding: 30px 30px 20px 30px; text-align: center;">
              <h2 style="margin-top: 0; color: #000000; font-size: 22px; font-weight: bold;">Reset Your Password</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset the password for your <strong>Rokto Din</strong> account. Click the button below to set a new password.
              </p>

              <a href="${resetLink}" style="display: inline-block; background-color: #8A1119; color: #ffffff; padding: 14px 35px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 50px; text-align: center;">
                Reset Password
              </a>

              <p style="color: #ef4444; font-size: 13px; margin-top: 15px; font-weight: 600;">
                ⏳ This link is valid for 5 minutes.
              </p>
            </div>

            <div style="padding: 0 30px;">
                <hr style="border: none; border-top: 2px dashed #EAEFEF; margin: 0;">
            </div>

            <div style="padding: 20px 30px 30px 30px; text-align: center;">
              <h2 style="margin-top: 0; color: #000000; font-size: 22px; font-weight: bold;">পাসওয়ার্ড পরিবর্তন করুন</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                আমরা আপনার <strong>Rokto Din</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার একটি অনুরোধ পেয়েছি। নতুন পাসওয়ার্ড সেট করতে নিচের বাটনে ক্লিক করুন।
              </p>

              <a href="${resetLink}" style="display: inline-block; background-color: #8A1119; color: #ffffff; padding: 14px 35px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 50px; text-align: center;">
                পাসওয়ার্ড রিসেট করুন
              </a>

              <p style="color: #ef4444; font-size: 13px; margin-top: 15px; font-weight: 600;">
                ⏳ এই লিংকটি মাত্র ৫ মিনিটের জন্য কার্যকর।
              </p>
            </div>

            <div style="padding: 0 30px 30px 30px; text-align: center;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; text-align: left;">
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                    <strong>En:</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not change until you create a new one.
                  </p>
                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
                    <strong>Bn:</strong> আপনি যদি পাসওয়ার্ড পরিবর্তনের অনুরোধ না করে থাকেন, তবে এই ইমেইলটি এড়িয়ে চলুন। আপনি নতুন পাসওয়ার্ড তৈরি না করা পর্যন্ত আপনার বর্তমান পাসওয়ার্ডটিই থাকবে।
                  </p>
              </div>
            </div>

            <div style="background-color: #2A2C2B; padding: 25px 20px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold;">Rokto Din Team</p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                Blood Donation Platform, Bangladesh
              </p>
            </div>

          </div>
        </div>
        `,
      });

      return { success: true, message: 'Reset email sent successfully' };
    } catch (error) {
      console.error('Password reset email failed:', error);
      throw new InternalServerErrorException(
        'Failed to send reset email. Please try again later.',
      );
    }
  }

  // success email after reset password
  async sendPasswordChangeSuccessEmail(to: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('BREVO_FROM'), // verified sender
        to,
        subject:
          '✅ Password Changed Successfully | পাসওয়ার্ড পরিবর্তন সফল হয়েছে',
        html: `
        <div style="background-color: #EAEFEF; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000;">
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #FEFEFD; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            
            <div style="background-color: #8A1119; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; font-style: italic;">Rokto Din</h1>
            </div>

            <div style="padding: 40px 30px 20px 30px; text-align: center;">
              <div style="background-color: #ecfdf5; color: #10b981; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 30px; margin: 0 auto 20px auto;">
                ✓
              </div>
              
              <h2 style="margin-top: 0; color: #000000; font-size: 22px; font-weight: bold;">Password Updated</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                Your <strong>Rokto Din</strong> account password has been changed successfully. You can now use your new password to log in.
              </p>

              <a href="${this.configService.get<string>('FRONTEND_URL')}/login" style="display: inline-block; background-color: #8A1119; color: #ffffff; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 50px; text-align: center;">
                Login to Account
              </a>
            </div>

            <div style="padding: 0 30px;">
                <hr style="border: none; border-top: 2px dashed #EAEFEF; margin: 0;">
            </div>

            <div style="padding: 30px 30px 20px 30px; text-align: center;">
              <h2 style="margin-top: 0; color: #000000; font-size: 22px; font-weight: bold;">পাসওয়ার্ড আপডেট হয়েছে</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                আপনার <strong>Rokto Din</strong> অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন থেকে অ্যাকাউন্টে প্রবেশ করতে আপনার নতুন পাসওয়ার্ডটি ব্যবহার করুন।
              </p>

              <a href="${this.configService.get<string>('FRONTEND_URL')}/login" style="display: inline-block; background-color: #8A1119; color: #ffffff; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 50px; text-align: center;">
                অ্যাকাউন্টে লগইন করুন
              </a>
            </div>

            <div style="padding: 0 30px 30px 30px; text-align: center;">
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 15px; text-align: left;">
                  <p style="color: #991b1b; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                    <strong>Security Alert:</strong> If you did not make this change, please reset your password immediately or contact our support team.
                  </p>
                  <p style="color: #991b1b; font-size: 13px; line-height: 1.6; margin: 0;">
                    <strong>নিরাপত্তা সতর্কতা:</strong> আপনি যদি এই পরিবর্তনটি না করে থাকেন, তবে অনুগ্রহ করে অবিলম্বে আপনার পাসওয়ার্ড পুনরায় রিসেট করুন বা আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
                  </p>
              </div>
            </div>

            <div style="background-color: #2A2C2B; padding: 25px 20px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: bold;">Rokto Din Team</p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                Blood Donation Platform, Bangladesh
              </p>
            </div>

          </div>
        </div>
        `,
      });

      return { success: true, message: 'Password success email sent' };
    } catch (error) {
      console.error('Password success email failed:', error);
    }
  }
}
