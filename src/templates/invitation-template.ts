export const getInvitationEmailHtml = (
  inviteUrl: string,
  organizationName: string,
  userEmail: string
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 30px 20px; border: 1px solid #e1e4e8; border-top: none; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You've been invited!</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been invited to join the workspace <strong>${organizationName}</strong>.</p>
      <p>Click the button below to accept your invitation and set up your account:</p>
      
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Join ${organizationName}</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteUrl}">${inviteUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>This invitation was sent to ${userEmail}. If you were not expecting this, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};