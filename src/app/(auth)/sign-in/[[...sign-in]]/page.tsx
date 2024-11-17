import { SignIn } from '@clerk/nextjs'
import { FC } from 'react'

const SignInPage: FC = () => {
    return <SignIn redirectUrl='/dashboard' />
}

export default SignInPage
