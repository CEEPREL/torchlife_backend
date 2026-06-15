import { Text } from '@react-email/components';
import Layout from './reuseable/layout';

interface DropboxResetPasswordEmailProps {
    firstName: string;
    code: string;
}

export const VerifyEmail = ({ firstName, code }: DropboxResetPasswordEmailProps) => {
    return (
        <Layout firstName={firstName} preview="Email verification">
            <div>
                <Text style={text}>Use the code below to complete your email verification:</Text>
                <code style={codeStyle}>{code}</code>
                <Text style={text}>To keep your account secure, please don&apos;t forward this email to anyone.</Text>
            </div>
        </Layout>
    );
};

export default VerifyEmail;

const text = {
    fontSize: '16px',
    color: '#404040',
    lineHeight: '26px',
};

const codeStyle = {
    display: 'inline-block',
    padding: '16px 4.5%',
    width: '90.5%',
    backgroundColor: '#F5EFCA',
    borderRadius: '5px',
    border: '1px solid #eee',
    color: '#000',
    textAlign: 'center' as const,
    fontSize: '20px',
};
