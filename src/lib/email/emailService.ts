import { Resend } from 'resend';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
) {
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Verifique seu email - Azimov',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bem-vindo ao Azimov!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">
                Olá ${name || 'usuário'},
              </p>
              <p style="font-size: 16px; color: #374151;">
                Obrigado por se registrar no Azimov! Para começar a usar todos os recursos,
                precisamos verificar seu endereço de email.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 40px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: bold;">
                  Verificar Email
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${verificationUrl}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Este link expira em 24 horas.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Se você não criou esta conta, ignore este email.
              </p>
            </div>
            <div style="background: #374151; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 Azimov. Todos os direitos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Redefinição de Senha - Azimov',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">Redefinição de Senha</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">
                Olá ${name || 'usuário'},
              </p>
              <p style="font-size: 16px; color: #374151;">
                Recebemos uma solicitação para redefinir a senha da sua conta no Azimov.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 40px;
                          text-decoration: none;
                          border-radius: 8px;
                          display: inline-block;
                          font-weight: bold;">
                  Redefinir Senha
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Este link expira em 1 hora por questões de segurança.
              </p>
              <p style="font-size: 14px; color: #ef4444; font-weight: bold;">
                ⚠️ Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.
              </p>
            </div>
            <div style="background: #374151; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2025 Azimov. Todos os direitos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de reset de senha:', error);
    return { success: false, error };
  }
}
