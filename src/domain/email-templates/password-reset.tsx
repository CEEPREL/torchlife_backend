import { Link, Text } from '@react-email/components';
import Layout from './reuseable/layout';

interface PasswordResetEmailProps {
    firstName: string;
    resetUrl: string;
}

const text = {
    fontSize: '16px',
    color: '#404040',
    lineHeight: '26px',
};

const linkStyle = {
    display: 'inline-block',
    margin: '16px 0',
    color: '#2250f4',
    fontSize: '16px',
    textDecoration: 'underline',
};

export const PasswordResetEmail = ({ firstName, resetUrl }: PasswordResetEmailProps) => {
    return (
        <Layout firstName={firstName} preview="Password reset request">
            <div>
                <Text style={text}>
                    We received a request to reset your TorchLife password. Use the secure link below to choose a new
                    password.
                </Text>
                <Link href={resetUrl} style={linkStyle}>
                    Reset your password
                </Link>
                <Text style={text}>If you did not request this change, you can safely ignore this email.</Text>
            </div>
        </Layout>
    );
};

export default PasswordResetEmail;
