export const verifyEmailTemplate = (url, name) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #111; margin-top: 0;">Welcome to Arabella, ${name}!</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Thank you for joining us. To complete your registration and start booking your luxury stay, please verify your email address.
    </p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="${url}" style="background-color: #c5a365; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Verify My Email</a>
    </div>
    <p style="color: #999; font-size: 14px; text-align: center;">
      This link will expire in 24 hours. If you did not sign up, please ignore this email.
    </p>
  </div>
</body>
</html>
`;
