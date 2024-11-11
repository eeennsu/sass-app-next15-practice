import { BrandLogo } from '@/shared/layout/brand-logo'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { FC } from 'react'

export const MainNavbar: FC = () => {
    return (
        <header className='flex py-6 shadow-sm fixed top-0 w-full z-10 bg-background/95'>
            <nav className='flex items-center gap-10 container font-semibold'>
                <Link
                    href='/'
                    className='mr-auto'>
                    <BrandLogo />
                </Link>
                <Link
                    className='text-lg'
                    href='#'>
                    Features
                </Link>
                <Link
                    className='text-lg'
                    href='/#pricing'>
                    Pricing
                </Link>
                <Link
                    className='text-lg'
                    href='#'>
                    se About
                </Link>
                <span className='text-lg'>
                    <SignedIn>
                        <Link href='/dashboard'>Dashboard</Link>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton>Login</SignInButton>
                    </SignedOut>
                </span>
            </nav>
        </header>
    )
}
