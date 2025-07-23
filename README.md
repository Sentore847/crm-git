# 🚀 GitHub Projects CRM

> Зручний додаток для управління GitHub-проєктами з авторизацією, бекендом на Node.js/Express, фронтендом на React та базою даних PostgreSQL.  
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
- Додавання GitHub-репозиторіїв за шляхом (наприклад, `facebook/react`)
- Автоматичне отримання та збереження даних з GitHub API:
  - Власник репозиторію
  - Назва
  - URL
  - Кількість зірок
  - Кількість форків
  - Кількість відкритих issues
  - Дата створення (UTC timestamp)
- Перегляд, оновлення та видалення збережених проєктів
- Повна валідація на бекенді та фронтенді
- Запуск усіх сервісів за допомогою `docker-compose`

---

## 🏃‍♂️ Запуск проєкту

### 1. Клонування репозиторію

```bash
git clone https://github.com/yourusername/github-projects-crm.git
cd github-projects-crm
docker-compose up --build
````
