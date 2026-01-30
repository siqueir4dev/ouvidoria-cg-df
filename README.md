# Participa DF Mobile (PWA) 📱

O **Participa DF Mobile** é uma aplicação Web Progressiva (PWA) desenvolvida para a Ouvidoria Geral do Distrito Federal. Seu objetivo é facilitar o registro de manifestações (denúncias, elogios, sugestões) por cidadãos, garantindo acessibilidade, segurança e facilidade de uso em dispositivos móveis.

> ⚠️ **Aviso**: Este projeto é apenas para fins demonstrativos e não possui vínculo oficial com órgãos públicos.

## 🚀 Funcionalidades Principais

* **Registro de Manifestações**: Envio de texto, áudio, imagens e vídeo.
* **IZA - IA da Ouvidoria**: Assistente virtual que analisa e classifica manifestações automaticamente.
* **Identidade Flexível**: Opção de envio anônimo ou identificado (com validação de CPF).
* **Acessibilidade**: Menu de acessibilidade (Alto contraste, Tamanho de fonte, VLibras).
* **Comprovante Oficial**: Geração de PDF com protocolo único para acompanhamento.
* **Offline First**: Funciona mesmo sem internet (armazena dados localmente e sincroniza depois).
* **Consulta de Protocolos**: Histórico de protocolos enviados e busca por número.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
* React + TypeScript + Vite
* TailwindCSS (Estilização Moderna)
* Lucide React (Ícones)
* jsPDF (Geração de Comprovantes)
* React Google reCAPTCHA

**Backend:**
* Node.js + Fastify (Alta Performance)
* MySQL (Banco de Dados Relacional)
* TypeScript (Segurança de Tipagem)
* Google Generative AI (Gemini API)

## 📋 Pré-requisitos

Para rodar este projeto localmente, você precisará de:

1. **Node.js** (versão 18 ou superior)
2. **MySQL** (ou MariaDB, como no Laragon/XAMPP)
3. **Chave de API do Google Gemini** - [Obter aqui](https://ai.google.dev/)
4. **Chaves do Google reCAPTCHA v2** - [Obter aqui](https://www.google.com/recaptcha/admin)

## ⚙️ Configuração e Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/siqueir4dev/ouvidoria-cg-df.git
cd ouvidoria-cg-df
```

### 2. Configurar o Backend

Entre na pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:

```env
# Banco de Dados MySQL
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha_mysql
DB_NAME=participa_df

# Porta do Servidor
PORT=3000

# API do Google Gemini (obrigatório para IZA funcionar)
GEMINI_API_KEY=sua_chave_gemini_aqui

# reCAPTCHA v2 - Chave Secreta (obrigatório para login admin)
RECAPTCHA_SECRET_KEY=sua_chave_secreta_recaptcha
```

Inicie o servidor:

```bash
npm run dev
```

### 3. Configurar o Frontend

Em um novo terminal, entre na pasta do frontend:

```bash
cd frontend
npm install
```

Crie um arquivo `.env` na pasta `frontend`:

```env
# reCAPTCHA v2 - Chave do Site (obrigatório para login admin)
VITE_RECAPTCHA_SITE_KEY=sua_chave_site_recaptcha
```

Inicie a aplicação:

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🔑 Obtendo as Chaves

### Google Gemini API
1. Acesse [Google AI Studio](https://ai.google.dev/)
2. Crie um novo projeto ou use um existente
3. Gere uma API Key
4. Copie para `GEMINI_API_KEY` no backend

### Google reCAPTCHA v2
1. Acesse [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Registre um novo site com reCAPTCHA v2 (checkbox)
3. Adicione `localhost` nos domínios
4. Copie a **Chave do site** para `VITE_RECAPTCHA_SITE_KEY` (frontend)
5. Copie a **Chave secreta** para `RECAPTCHA_SECRET_KEY` (backend)

## 🌐 Acesso via ngrok (Teste em dispositivos externos)

Para testar em dispositivos móveis ou compartilhar externamente:

```bash
# Terminal 1 - Frontend
ngrok http 5173

# Terminal 2 - Backend  
ngrok http 3000
```

> **Importante**: O frontend está configurado para aceitar hosts externos (`allowedHosts: true`).

## 📱 Como Usar

1. **Fazer uma Manifestação**: Preencha o formulário, anexe mídias se desejar, aceite os termos e envie.
2. **Consultar Protocolo**: Acesse "Consultar Protocolos" no menu para buscar pelo número.
3. **Instalar PWA**: No celular, acesse pelo navegador e clique em "Adicionar à Tela Inicial".

## 👤 Acesso Administrativo

* URL: `/admin/login`
* Usuário padrão: `admin`
* Senha padrão: `admin123`

## 🤖 IZA - Inteligência Artificial

A **IZA** é o assistente virtual integrado que:
- Analisa o relato do cidadão em tempo real
- Sugere a classificação correta (Denúncia, Reclamação, Sugestão, etc.)
- Apresenta feedback justificado se a classificação do usuário diferir

## 🤝 Contribuição

Sinta-se à vontade para abrir *Issues* ou enviar *Pull Requests* com melhorias.

## 📄 Licença

Este projeto é distribuído sob a licença MIT.
