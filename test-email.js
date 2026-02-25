// Script de teste para envio de email com Resend
// Execute com: node test-email.js

const { Resend } = require('resend');

const resend = new Resend('re_49fpUFsE_B1CRU6y3VjCrmXg1wSBok4VG');

async function testEmail() {
  try {
    console.log('🚀 Testando envio de email com Resend...\n');

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'raffaelarcego@gmail.com', // MUDE PARA SEU EMAIL REAL
      subject: 'Teste de Email - Aura',
      html: `
        <h1>Email de Teste</h1>
        <p>Se você recebeu este email, a configuração do Resend está funcionando corretamente!</p>
        <p>Sistema: Aura</p>
        <p>Timestamp: ${new Date().toLocaleString('pt-BR')}</p>
      `,
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 ID do email:', data.id);
    console.log('\n📝 Detalhes:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Erro ao enviar email:');
    console.error(error);

    if (error.message?.includes('API key')) {
      console.log('\n💡 Dica: Verifique se a API key está correta');
    }
    if (error.message?.includes('domain')) {
      console.log('\n💡 Dica: Verifique se o domínio está verificado no Resend');
    }
  }
}

testEmail();
