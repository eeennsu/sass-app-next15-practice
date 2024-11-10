import { DashboardNavBar } from '@/features/dashboard/dashboard-navbar'
import type { FC, PropsWithChildren } from 'react'

const Layout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className='bg-accent/5 min-h-screen'>
            <DashboardNavBar />
            <div className='container py-6'>{children}</div>
        </div>
    )
}

export default Layout
