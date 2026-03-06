// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Cuando alguien entra a la raíz, lo mandamos al login
  redirect('/login');
}