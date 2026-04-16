import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/auth';

export default async function Home() {
  const session = await getUserFromSession();
  
  if (session) {
    redirect('/notes');
  } else {
    redirect('/login');
  }
}