import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

import type { TemplateEntry } from './registry'

export interface ConfirmarEmailProps {
  link: string
}

export function ConfirmarEmail({ link }: ConfirmarEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Confirme seu e-mail para começar a usar o Rota Control</Preview>
      <Body style={body}>
        <Container style={card}>
          <Heading style={titulo}>ROTA CONTROL</Heading>
          <Text style={texto}>Olá! Sua conta foi criada com sucesso.</Text>
          <Text style={texto}>
            Para começar a registrar seus ganhos, gastos e repasses, confirme seu e-mail
            no botão abaixo.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={link} style={botao}>
              Confirmar meu e-mail
            </Button>
          </Section>
          <Text style={aviso}>
            O link é válido por 24 horas. Se o botão não funcionar, copie e cole este
            endereço no navegador:
          </Text>
          <Text style={linkTexto}>{link}</Text>
          <Text style={rodape}>
            Se você não criou esta conta, pode ignorar esta mensagem.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#0d1526',
  margin: 0,
  padding: '32px 12px',
  fontFamily: 'Helvetica, Arial, sans-serif',
}

const card: React.CSSProperties = {
  backgroundColor: '#131f36',
  borderRadius: '14px',
  padding: '32px',
  maxWidth: '520px',
  margin: '0 auto',
}

const titulo: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  letterSpacing: '2px',
  textAlign: 'center',
  margin: '0 0 20px',
}

const texto: React.CSSProperties = {
  color: '#d7deeb',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const botao: React.CSSProperties = {
  backgroundColor: '#f2b705',
  color: '#10192b',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
}

const aviso: React.CSSProperties = {
  color: '#9aa7bd',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const linkTexto: React.CSSProperties = {
  color: '#f2b705',
  fontSize: '12px',
  wordBreak: 'break-all',
  margin: '0 0 20px',
}

const rodape: React.CSSProperties = {
  color: '#6d7a90',
  fontSize: '12px',
  margin: 0,
}

export const template: TemplateEntry = {
  component: ConfirmarEmail,
  subject: 'Confirme seu e-mail — Rota Control',
  displayName: 'Confirmação de cadastro',
  previewData: { link: 'https://rotacontrolapp.com.br/confirmado' },
}

export default ConfirmarEmail
