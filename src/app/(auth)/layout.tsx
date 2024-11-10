import type { FC, PropsWithChildren } from 'react'

const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <main className='min-h-screen flex flex-col justify-center items-center'>
            {children}
        </main>
    )
}

export default AuthLayout
