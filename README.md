# StayBase

CRM для керування довгостроковими хостелами: хостели, кімнати, ліжка,
мешканці та платежі.

## Реалізовані модулі

- Hostels: список і створення хостелів.
- Rooms: CRUD, створення кімнати разом із ліжками, статистика місткості.
- Beds: створення, редагування, примітки, вимкнення та безпечне видалення.
- Residents: заселення, переселення, виселення, архів та історія проживання.
- Payments: оренда, застави та інші нарахування; статуси, борги й оплати.
- Dashboard: завантаженість, борги, місячні надходження та найближчі оплати.
- Auth: реєстрація та вхід через email/пароль із захищеними сесіями.
- Workspaces: окремі дані для кожного власника та ролі OWNER/ADMIN.
- Team: додавання адміністратора за email та прийняття запрошення після реєстрації.

Після реєстрації новий власник створює свій робочий простір. Хостели,
мешканці, платежі, кімнати та ліжка доступні лише учасникам цього простору.

Номер ліжка є унікальним у межах кімнати. Зайняте ліжко не можна вимкнути або
видалити. Вимкнені ліжка не враховуються в активній місткості.

## Getting Started

Copy `.env.example` to `.env`, add the Neon connection string, and generate an
authentication secret with `openssl rand -base64 32`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
