# 🧬 DNA AUTO — Plataforma Digital de Veículos

Passaporte Digital do Veículo. Cada veículo possui um DNA permanente com todo histórico documentado.

---

## 🚀 Iniciar o Servidor

```bash
cd DNA-AUTO
node server/src/server.js
```

Acesse: **http://localhost:3000**

---

## 🔐 Credenciais de Acesso (Demo)

### 🚗 Cliente (Proprietário)
- **Link de acesso:** http://localhost:3000
- **E-mail:** `carlos.silva@email.com`
- **Senha:** `senha123`
- Selecione a aba **"Sou Cliente"** na tela de login

### 🔧 Oficina Parceira
- **Link de acesso:** http://localhost:3000
- **E-mail:** `marcos@veloce.com.br`
- **Senha:** `senha123`
- Selecione a aba **"Oficina Parceira"** na tela de login

### 🛡️ Administrador (Acesso Restrito)
- **Link de acesso:** http://localhost:3000/admin *(link exclusivo!)*
- **E-mail:** `admin@dnaauto.com.br`
- **Senha:** `admin123`
- ⚠️ O admin NÃO aparece na tela de login normal. Acesse apenas pelo link `/admin`

---

## 📋 Regras de Acesso

| Regra | Descrição |
|-------|-----------|
| **Login Obrigatório** | Nenhuma tela é acessível sem autenticação |
| **Isolamento de Perfil** | Cliente não vê funções da Oficina e vice-versa |
| **Admin Oculto** | O login de admin só aparece acessando `/admin` |
| **RBAC Estrito** | Cada perfil só vê seus próprios módulos na sidebar |

---

## 📁 Estrutura do Projeto

```
DNA-AUTO/
├── public/             # Frontend (HTML, CSS, JS)
│   ├── index.html      # SPA principal
│   ├── css/            # Estilos
│   └── js/             # Lógica do frontend
│       ├── app.js      # Orquestrador (RBAC, sessão, login)
│       ├── api.js      # Cliente HTTP da API
│       └── components/ # Views (login, owner, workshop, admin, dossier)
├── server/             # Backend Node.js + Express
│   └── src/
│       ├── server.js   # Servidor Express
│       ├── database/   # SQLite (better-sqlite3)
│       ├── middlewares/ # Auth JWT, Audit
│       └── modules/    # Rotas REST (auth, vehicles, services, etc.)
└── README.md
```
