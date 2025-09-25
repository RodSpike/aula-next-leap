-- Fase 1: Criação das tabelas e estrutura para o sistema de pagamento Stripe

-- Tabela para capturar prospects que inseriram email mas não finalizaram pagamento
CREATE TABLE prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  utm_source text,
  utm_campaign text,
  agreed_terms boolean DEFAULT false,
  agreed_marketing boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS para a tabela prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem todos os prospects
CREATE POLICY "Admins can view all prospects" 
ON prospects 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para permitir inserção de prospects (público)
CREATE POLICY "Anyone can create prospects" 
ON prospects 
FOR INSERT 
WITH CHECK (true);

-- Tabela para gerenciar sessões de checkout do Stripe
CREATE TABLE payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  prospect_email text,
  stripe_session_id text UNIQUE,
  status text DEFAULT 'pending', -- pending, completed, expired
  amount integer, -- em centavos
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Habilitar RLS para a tabela payment_sessions
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Política para admins visualizarem todas as sessões de pagamento
CREATE POLICY "Admins can view all payment sessions" 
ON payment_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para usuários visualizarem suas próprias sessões
CREATE POLICY "Users can view their own payment sessions" 
ON payment_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para criação de sessões de pagamento
CREATE POLICY "Users can create their own payment sessions" 
ON payment_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Atualizar tabela user_subscriptions para adicionar colunas relacionadas ao Stripe
ALTER TABLE user_subscriptions 
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text,
ADD COLUMN subscription_status text DEFAULT 'trial', -- trial, active, past_due, canceled
ADD COLUMN current_period_end timestamptz,
ADD COLUMN canceled_at timestamptz;

-- Atualizar o valor padrão do trial_ends_at para 7 dias
ALTER TABLE user_subscriptions 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + INTERVAL '7 days');

-- Índices para melhor performance
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_created_at ON prospects(created_at);
CREATE INDEX idx_payment_sessions_stripe_session_id ON payment_sessions(stripe_session_id);
CREATE INDEX idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_subscription_status ON user_subscriptions(subscription_status);