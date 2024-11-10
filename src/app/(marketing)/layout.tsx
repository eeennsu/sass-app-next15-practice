import { MainNavbar } from '@/features/marketing/main-navbar'
import type { FC, PropsWithChildren } from 'react'

const MarketingLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className='selection:bg-[hsla(320,36%,60%,0)]'>
            <MainNavbar />
            {children}
        </div>
    )
}

export default MarketingLayout
