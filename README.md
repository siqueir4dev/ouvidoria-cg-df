# Participa DF Mobile (PWA) 📱

O **Participa DF Mobile** é uma aplicação Web Progressiva (PWA) desenvolvida para a Ouvidoria Geral do Distrito Federal. Seu objetivo é facilitar o registro de manifestações (denúncias, elogios, sugestões) por cidadãos, garantindo acessibilidade, segurança e facilidade de uso em dispositivos móveis.

![Preview](frontend/public/vite.svg)

## 🚀 Funcionalidades Principais

*   **Registro de Manifestações**: Envio de texto, áudio, imagens e vídeo.
*   **Identidade Flexível**: Opção de envio anônimo ou identificado (com validação de CPF).
*   **Acessibilidade**: Menu de acessibilidade (Alto contraste, Tamanho de fonte, VLibras).
*   **Comprovante Oficial**: Geração de PDF com protocolo único para acompanhamento.
*   **Offline First**: Funciona mesmo sem internet (armazena dados localmente e sincroniza depois).
*   **Consultas**: Possibilidade de consultar o status de manifestações anteriores.

## 🛠️ Tecnologias Utilizadas

**Frontend:**
*   React + Vite
*   TailwindCSS (Estilização Moderna)
*   Lucide React (Ícones)
*   jsPDF (Geração de Comprovantes)

**Backend:**
*   Node.js + Fastify (Alta Performance)
*   MySQL (Banco de Dados Relacional)
*   TypeScript (Segurança de Tipagem)

## 📋 Pré-requisitos

Para rodar este projeto localmente, você precisará de:

1.  **Node.js** (versão 18 ou superior).
2.  **MySQL** (ou MariaDB, como no Laragon/XAMPP).

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

Crie um arquivo `.env` na pasta `backend` com as credenciais do seu banco de dados:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=participa_df
PORT=3000
GEMINI_API_KEY=sua_chave_aqui
### 🤖 IZA - Inteligência Artificial da Ouvidoria
A **IZA** é um assistente virtual integrado que analisa o relato do cidadão em tempo real.
- **Classificação Cega**: A IA analisa o texto sem saber a escolha do usuário para garantir imparcialidade.
- **Feedback Inteligente**: Se a classificação do usuário diferir da sugestão da IA, a IZA apresenta uma recomendação justificada.
- **Interface Profissional**: Design institucional para transmitir confiança e seriedade.

### 📂 Upload de Mídia e Anexos
O sistema suporta o envio de múltiplos tipos de mídia:
- **Imagens**: Múltiplas fotos.
- **Vídeo**: Gravações de ocorrências.
- **Áudio**: Gravação de voz diretamente no navegador.
- **Armazenamento Seguro**: Arquivos são salvos localmente e linkados ao protocolo no banco de dados.

### 🔍 Consulta de Protocolo
- O cidadão pode consultar o status de sua manifestação.
- Visualização completa do relato e **lista de arquivos anexados**.
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

Inicie a aplicação:

```bash
npm run dev
```

Acesse o sistema através do link gerado pelo terminal.

## 📱 Como Usar

1.  **Fazer uma Manifestação**: Clique em "Registrar Manifestação", preencha os dados (anônimo ou não) e anexe mídias se desejar.
2.  **Consultar Protocolo**: Use o código gerado ao final do cadastro para verificar o andamento na tela inicial.
3.  **Instalar PWA**: No celular, acesse pelo navegador e clique em "Adicionar à Tela Inicial" para instalar como aplicativo.

## 🤝 Contribuição

Sinta-se à vontade para abrir *Issues* ou enviar *Pull Requests* com melhorias.
