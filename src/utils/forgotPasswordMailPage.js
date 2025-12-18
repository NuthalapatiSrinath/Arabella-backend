export const forgotPasswordEmail = (resetLink, userName = "User") => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        background-color: #f4f4f7;
        font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #333333;
      }
      .container {
        width: 100%;
        padding: 40px 0;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      }
      .header {
        background-color: #0d6efd;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 30px 40px;
      }
      .content h2 {
        font-size: 20px;
        color: #333333;
        margin-bottom: 16px;
      }
      .content p {
        line-height: 1.6;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #0d6efd;
        color: #ffffff !important;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        transition: background-color 0.3s ease;
      }
      .button:hover {
        background-color: #0b5ed7;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #888888;
        padding: 20px;
        border-top: 1px solid #eeeeee;
      }
      @media (max-width: 600px) {
        .content {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="email-wrapper">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>

          <p style="text-align: center;">
            <a href="${resetLink}" class="button" target="_blank">Reset Password</a>
          </p>

          <p>If you did not request a password reset, please ignore this email. Your account is safe.</p>
          <p>For security reasons, this link will expire in <strong>15 minutes</strong>.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;
