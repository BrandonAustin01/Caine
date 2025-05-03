## README.md

<h1 align="center">🛡️ Caine — The Guardian of Your Discord</h1>

<p align="center">
  <b>Caine</b> is a modular, security-first Discord bot designed for communities that demand stability, control, and customizability.
  <br><br>
  <img alt="License" src="https://img.shields.io/github/license/BrandonAustin01/Caine?style=flat-square">
  <img alt="Built With" src="https://img.shields.io/badge/Built%20With-Node.js%20%7C%20Discord.js-blue?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/status-under%20active%20development-yellow?style=flat-square">
</p>

---

### 🚀 Features

* 🎯 Anti-Raid Protection
* 🧠 XP + Level Ranking with Role Rewards
* ⚙️ Slash + Prefix Commands
* 🤖 Fully Modular Command Loading
* 🛠️ Admin Toolkits (`/rank admin`)
* 🔍 Logging, Spam Filtering, Kick Abuse Detection

---

### 🏗️ Folder Structure

```
discord-bot/
├── commands/        # Command files (slash and legacy)
├── events/          # Event handlers like messageCreate, guildMemberAdd
├── utils/           # XP, logging, permissions, formatting
├── security/        # Spam/raid protections
├── data/            # xp.json, config.json, etc.
├── .env             # Bot token, client ID, etc.
└── index.js         # Entry point
```

---

### 🧰 Setup

```bash
git clone https://github.com/BrandonAustin01/Caine.git
cd Caine
npm install
```

Create a `.env` file:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-client-id
GUILD_ID=your-test-guild-id
```

Deploy commands:

```bash
node deploy-commands.js
node index.js
```

---

### 🔧 Admin Slash Commands

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `/rank view`          | View user XP and level            |
| `/rank admin setxp`   | Set a user’s XP                   |
| `/rank admin addxp`   | Add XP to a user                  |
| `/rank admin reset`   | Reset a user’s level              |
| `/rank admin promote` | Promote user by N levels          |
| `/rank admin demote`  | Demote user by N levels           |
| `/rank admin info`    | Show raw XP/level and role status |

---

### 🧩 XP Role Rewards

```json
"rankRoles": {
  "5": "🟢 Rookie",
  "10": "🔵 Member",
  "20": "🟡 Veteran",
  "50": "💠 Champion"
}
```

Set `autoCreateRankRoles` in `config.json`:

```json
"rankingSystem": {
  "enabled": true,
  "autoCreateRankRoles": true
}
```

---

### 🤝 Contributing

We welcome all improvements, big or small. Please see [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

---

### 💬 Support & Feedback

Need help or want to contribute to Caine's mission?

* 📖 See the full Wiki: [CaineBot Wiki](https://github.com/BrandonAustin01/cain/wiki)
* 🛠️ [Join the Caine Community Server](https://discord.gg/3fzCgEHYqU)
* 📬 Feature requests and bug reports are welcome in [GitHub Issues](https://github.com/BrandonAustin01/Caine/issues)
* 💡 PRs should target the `main` branch after local testing

Thanks for being part of the Caine initiative.
