# BackEnd Teste BeTalent

# API de Gateway de Pagamento

Uma API robusta de processamento de pagamentos que suporta múltiplos gateways com capacidade de failover.

## Funcionalidades

- Processamento de pagamentos com múltiplos gateways
- Failover automático entre gateways
- Rastreamento de status de pagamento
- Processamento de reembolsos
- Tratamento de webhooks
- Sistema de logs abrangente
- Documentação da API com Swagger
- Implementação em TypeScript
- Autenticação e autorização seguras
- Limitação de taxa e recursos de segurança

## Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL
- npm ou yarn

## Instalação

1. Clone o repositório:

git clone [url-do-repositorio]
cd payment-gateway-api


2. Instale as dependências:

npm install


3. Crie um arquivo `.env` no diretório raiz:

# Configuração do Servidor
PORT=3000
NODE_ENV=development
JWT_SECRET=seu_jwt_secret_aqui

# Configuração do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=payment_gateway

# Configuração do Stripe
STRIPE_SECRET_KEY=sua_stripe_secret_key
STRIPE_WEBHOOK_SECRET=seu_stripe_webhook_secret

# Configuração do PayPal
PAYPAL_CLIENT_ID=seu_paypal_client_id
PAYPAL_CLIENT_SECRET=seu_paypal_client_secret
PAYPAL_MODE=sandbox


## Executando a Aplicação

Modo de desenvolvimento:

npm run dev


Modo de produção:

npm run build
npm start


## Documentação da API

Com o servidor em execução, acesse a documentação Swagger em:

http://localhost:3000/api-docs
```

## Endpoints da API

### Pagamentos
- `POST /api/payments` - Processar novo pagamento
- `GET /api/payments/:paymentId` - Consultar status do pagamento
- `POST /api/payments/:paymentId/refund` - Realizar reembolso
- `POST /api/payments/webhooks/:gateway` - Tratar webhooks do gateway
- `GET /api/payments/order/:orderId` - Consultar pagamentos por pedido

## Autenticação

A API utiliza JWT para autenticação. Inclua o token no cabeçalho Authorization:

Authorization: Bearer seu_jwt_token


## Tratamento de Erros

A API retorna códigos de status HTTP padrão e respostas JSON:

{
  "error": "Mensagem de erro aqui"
}


## Testes

Execute a suite de testes:

npm test


## Logs

Os logs são armazenados no diretório `logs`:
- `error.log` - Logs de erro
- `combined.log` - Todos os logs

## Recursos de Segurança

- Proteção CORS
- Limitação de taxa
- Headers de segurança Helmet
- Autenticação JWT
- Controle de acesso baseado em funções

## Como Contribuir

1. Faça um fork do repositório
2. Crie sua branch de feature
3. Faça commit das suas alterações
4. Push para a branch
5. Crie um novo Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.
