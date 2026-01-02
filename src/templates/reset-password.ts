export const getResetPasswordEmailHtml = (resetUrl: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #007bff;">Reset Your Password</h2>
    <p>You requested a password reset. Click the link below to set a new password. This link is valid for 1 hour.</p>
    <a href="${resetUrl}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p style="margin-top: 20px; font-size: 0.9em; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
`;