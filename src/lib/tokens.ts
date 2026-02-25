import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Funções para Verification Token (Email Verification)

export async function generateVerificationToken(email: string) {
  // Gera token aleatório seguro
  const token = crypto.randomBytes(32).toString('hex');

  // Token expira em 24 horas
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Remove tokens antigos para este email
  await prisma.verificationToken.deleteMany({
    where: { email }
  });

  // Cria novo token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return verificationToken;
}

export async function getVerificationTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    return verificationToken;
  } catch {
    return null;
  }
}

export async function deleteVerificationToken(id: string) {
  await prisma.verificationToken.delete({
    where: { id }
  });
}

// Funções para Password Reset Token

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString('hex');

  // Token expira em 1 hora
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  // Remove tokens antigos
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  const resetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return resetToken;
}

export async function getPasswordResetTokenByToken(token: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    return resetToken;
  } catch {
    return null;
  }
}

export async function deletePasswordResetToken(id: string) {
  await prisma.passwordResetToken.delete({
    where: { id }
  });
}
