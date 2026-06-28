import { Text } from '@react-email/components';
import Layout from './reuseable/layout';
import { tableStyle, tdStyle, thStyle } from './utils/styles';

interface PaymentFailureEmailProps {
    firstName: string;
    donorEmail: string;
    campaignTitle: string;
    campaignId: string;
    amount: number;
    currency: string;
    reference: string;
    reason?: string | null;
}

const text = {
    fontSize: '16px',
    color: '#404040',
    lineHeight: '26px',
};

export const PaymentFailureEmail = ({
    firstName,
    donorEmail,
    campaignTitle,
    campaignId,
    amount,
    currency,
    reference,
    reason,
}: PaymentFailureEmailProps) => {
    return (
        <Layout firstName={firstName} preview="Donation payment update">
            <div>
                <Text style={text}>
                    We could not confirm your donation payment. No successful donation has been recorded for this
                    transaction yet.
                </Text>

                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <th style={thStyle}>Campaign</th>
                            <td style={tdStyle}>{campaignTitle}</td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Campaign ID</th>
                            <td style={tdStyle}>{campaignId}</td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Donor Email</th>
                            <td style={tdStyle}>{donorEmail}</td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Amount</th>
                            <td style={tdStyle}>
                                {currency} {amount.toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Reference</th>
                            <td style={tdStyle}>{reference}</td>
                        </tr>
                        {reason && (
                            <tr>
                                <th style={thStyle}>Reason</th>
                                <td style={tdStyle}>{reason}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Text style={text}>You can try the donation again using the same campaign page if needed.</Text>
            </div>
        </Layout>
    );
};

export default PaymentFailureEmail;
