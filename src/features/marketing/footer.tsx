import { BrandLogo } from '@/shared/layout/brand-logo'
import Link from 'next/link'
import type { FC } from 'react'

export const Footer: FC = () => {
    return (
        <footer className='container pt-16 pb-8 flex flex-col sm:flex-row gap-8 sm:gap-4 justify-between items-start'>
            <Link href='/'>
                <BrandLogo />
            </Link>
            <div className='flex flex-col sm:flex-row gap-8'>
                <div className='flex flex-col gap-8'>
                    <FooterLinkGroup
                        title='Help'
                        links={[
                            { label: 'PPP Discounts', href: '#' },
                            { label: 'Discount API', href: '#' },
                        ]}
                    />
                    <FooterLinkGroup
                        title='Solutions'
                        links={[
                            { label: 'Newsletter', href: '#' },
                            { label: 'SaaS Business', href: '#' },
                            { label: 'Online Courses', href: '#' },
                        ]}
                    />
                </div>
                <div className='flex flex-col gap-8'>
                    <FooterLinkGroup
                        title='Features'
                        links={[{ label: 'PPP Discounts', href: '#' }]}
                    />
                    <FooterLinkGroup
                        title='Tools'
                        links={[
                            { label: 'Salary Converter', href: '#' },
                            { label: 'Coupon Generator', href: '#' },
                            { label: 'Stripe App', href: '#' },
                        ]}
                    />
                    <FooterLinkGroup
                        title='Company'
                        links={[
                            { label: 'Affiliate', href: '#' },
                            { label: 'Twitter', href: '#' },
                            { label: 'Terms of Service', href: '#' },
                        ]}
                    />
                </div>
                <div className='flex flex-col gap-8'>
                    <FooterLinkGroup
                        title='Integrations'
                        links={[
                            { label: 'Lemon Squeezy', href: '#' },
                            { label: 'Gumroad', href: '#' },
                            { label: 'Stripe', href: '#' },
                            { label: 'Chargebee', href: '#' },
                            { label: 'Paddle', href: '#' },
                        ]}
                    />
                    <FooterLinkGroup
                        title='Tutorials'
                        links={[
                            { label: 'Any Website', href: '#' },
                            { label: 'Lemon Squeezy', href: '#' },
                            { label: 'Gumroad', href: '#' },
                            { label: 'Stripe', href: '#' },
                            { label: 'Chargebee', href: '#' },
                            { label: 'Paddle', href: '#' },
                        ]}
                    />
                </div>
            </div>
        </footer>
    )
}

const FooterLinkGroup: FC<{
    title: string
    links: { label: string; href: string }[]
}> = ({ title, links }) => {
    return (
        <div className='flex flex-col gap-4'>
            <h3 className='font-semibold'>{title}</h3>
            <ul className='flex flex-col gap-2 text-sm'>
                {links.map((link, i) => (
                    <li key={i}>
                        <Link href={link.href}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
