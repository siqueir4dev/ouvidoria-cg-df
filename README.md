# Participa DF Mobile (PWA) 📱

O **Participa DF Mobile** é uma aplicação Web Progressiva (PWA) desenvolvida para a Ouvidoria Geral do Distrito Federal. Seu objetivo é facilitar o registro de manifestações (denúncias, elogios, sugestões) por cidadãos, garantindo acessibilidade, segurança e facilidade de uso em dispositivos móveis.

> ⚠️ **Aviso**: Este projeto é apenas para fins demonstrativos e não possui vínculo oficial com órgãos públicos.

## 🚀 Funcionalidades Principais

* **Registro de Manifestações**: Envio de texto, áudio, imagens e vídeo.
* **IZA - IA da Ouvidoria**: Assistente virtual que analisa semanticamente o relato e sugere a classificação correta.
* **Identidade Flexível**: Opção clara entre envio anônimo (sigilo total) ou identificado (com Nome e CPF).
* **Acessibilidade Universal**: Conformidade com WCAG 2.1 Nível AA, incluindo VLibras, alto contraste e navegação por teclado.
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
* VLibras (Acessibilidade para Surdos)

**Backend:**
* Node.js + Fastify (Alta Performance)
* MySQL (Banco de Dados Relacional)
* TypeScript (Segurança de Tipagem)
* Google Generative AI (Gemini API)

## 🤖 Documentação da I.A. (Item 13.9)

A plataforma utiliza Inteligência Artificial para auxiliar na triagem e classificação das manifestações, garantindo maior precisão no encaminhamento das demandas e eficiência na gestão pública.

*   **Modelo Utilizado**: `gemini-3-flash-preview` (Google DeepMind) - Escolhido por sua alta capacidade de raciocínio e velocidade.
*   **Biblioteca**: `@google/generative-ai` (SDK Oficial do Google para Node.js)
*   **Propósito**: Análise semântica do texto da manifestação para sugerir a tipologia correta (Denúncia, Reclamação, Elogio, Sugestão ou Informação).
*   **Funcionamento Técnico**:
    1.  **Entrada**: O texto do cidadão é higienizado e enviado (de forma anônima) para a API do Google.
    2.  **Processamento**: O modelo `gemini-3-flash-preview` analisa o contexto, sentimento e intenção do relato.
    3.  **Saída Estruturada**: Retorna um JSON contendo a categoria sugerida e uma "justificativa amigável" explicada em linguagem natural.
    4.  **Decisão Humana**: O usuário visualiza a sugestão e decide se aceita ou mantém a classificação original.

## ♿ Acessibilidade e Inclusão (WCAG 2.1 AA)

Este projeto foi desenvolvido com foco rigoroso em acessibilidade, atendendo aos critérios da WCAG 2.1 Nível AA:

*   **VLibras**: Widget de tradução automática para Libras disponível em todas as páginas.
*   **Navegação por Teclado**: Todos os menus, formulários e modais são plenamente operáveis sem mouse.
*   **Leitores de Tela**: Uso correto de etiquetas semânticas, `aria-labels` e `alt text` em imagens.
*   **Contraste e Legibilidade**: Modos de Alto Contraste e Leitura (fonte aumentada) nativos.

## 📋 Pré-requisitos

Para rodar este projeto localmente, você precisará de:

1. **Node.js** (versão 18 ou superior)
2. **MySQL** (Pode usar **XAMPP** ou **Laragon** para facilitar o servidor MySQL local)
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

1. **Fazer uma Manifestação**: Escolha entre se identificar ou ser anônimo, preencha o formulário e envie.
2. **Consultar Protocolo**: Acesse "Consultar Protocolos" no menu para buscar pelo número.
3. **Instalar PWA**: No celular, acesse pelo navegador e clique em "Adicionar à Tela Inicial".

## 👤 Acesso Administrativo

* URL: `/admin/login`
* Usuário padrão: `admin`
* Senha padrão: `admin123`

## 🤝 Contribuição

Sinta-se à vontade para abrir *Issues* ou enviar *Pull Requests* com melhorias.


