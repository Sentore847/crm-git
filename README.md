# 🚀 Repository Projects CRM

> Зручний додаток для управління GitHub/GitLab/Bitbucket-проєктами з авторизацією, бекендом на Node.js/Express, фронтендом на React та базою даних PostgreSQL.  
> Запускай усі сервіси одразу через Docker Compose!

---

## 🛠️ Технології

- **Backend:** Node.js, Express, TypeScript  
- **Frontend:** React, Vite, TypeScript  
- **База даних:** PostgreSQL  
- **ORM:** Prisma  
- **Аутентифікація:** JWT (JSON Web Token)  
- **Контейнеризація:** Docker + Docker Compose

---

## ⚙️ Функціонал

- Реєстрація та авторизація користувачів (email + пароль, збереження сесії через JWT)
- Додавання репозиторіїв з GitHub, GitLab, Bitbucket:
  - GitHub: `facebook/react` або `github:facebook/react`
  - GitLab: `gitlab:gitlab-org/gitlab`
  - Bitbucket: `bitbucket:atlassian/python-bitbucket`
  - Також підтримуються повні URL (`https://github.com/...`, `https://gitlab.com/...`, `https://bitbucket.org/...`)
- Автоматичне отримання та збереження даних з API провайдера:
  - Власник репозиторію
  - Назва
  - URL
  - Кількість зірок
  - Кількість форків
  - Кількість відкритих issues
  - Дата створення (UTC timestamp)
- Перегляд, оновлення та видалення збережених проєктів
- Інсайти по кожному репозиторію:
  - Усі гілки (branches) з останнім комітом
  - Усі issues
  - Усі pull requests
- Сортування в UI:
  - Issues за датою створення (нові/старі)
  - Branches за датою останнього коміту (останні/старі)
- AI-аналіз:
  - `Ask latest changes` для конкретної гілки
  - Короткий AI overview для latest issues
  - Короткий AI overview для latest pull requests
- Повна валідація на бекенді та фронтенді
- Запуск усіх сервісів за допомогою `docker-compose`

---

## 🏃‍♂️ Запуск проєкту

### Змінні оточення (`.env`)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345
POSTGRES_DB=github_crm

PORT_BACKEND=5001
PORT_FRONTEND=5173

JWT_SECRET=your_jwt_secret
VITE_API_URL=http://localhost:5001/api

# Optional, recommended to avoid GitHub API limits
GITHUB_TOKEN=your_github_token
# Optional, for higher GitLab limits/private repos
GITLAB_TOKEN=your_gitlab_token
# Optional, for higher Bitbucket limits/private repos
BITBUCKET_USERNAME=your_bitbucket_username
BITBUCKET_APP_PASSWORD=your_bitbucket_app_password

# Required for AI endpoints
OPENAI_API_KEY=your_openai_api_key
# Optional model override
OPENAI_MODEL=gpt-4o-mini
```

### Перелік потрібних команд

```bash
git clone https://github.com/yourusername/github-projects-crm.git
cd github-projects-crm
docker compose up --build
```
