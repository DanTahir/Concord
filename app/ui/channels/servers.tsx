import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import ConcordGlobe from '../concord-globe';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function Servers() {
  return (
    <div className="flex h-full flex-col bg-blue-600">
      <Link
        className="mb-2 flex flex-row h-20 items-end justify-start rounded-md"
        href="/channels/me"
      >
        <div className="w-16 text-white">
          <ConcordGlobe />
        </div>
      </Link>
      <div className="h-auto w-full grow block"></div>
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <button className="flex h-[48px] my-3 items-center justify-center gap-2 text-white text-sm font-medium rounded-full hover:bg-sky-100 hover:text-blue-600">
            <PowerIcon className="w-16" />
          </button>
        </form>
    </div>
  );
}
