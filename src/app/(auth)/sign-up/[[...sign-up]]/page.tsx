import { SignUp } from '@clerk/nextjs'
import { FC } from 'react'

const SignUpPage: FC = () => {
    return <SignUp redirectUrl='/dashboard' />
}

export default SignUpPage
