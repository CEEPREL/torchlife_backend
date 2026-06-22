import { Text } from '@react-email/components';
import Layout from './reuseable/layout';
import { tableStyle, tdStyle, thStyle } from './utils/styles';

interface PaymentSuccessEmailProps {
    firstName: string;
    donorEmail: string;
    campaignTitle: string;
    campaignId: string;
    amount: number;
    currency: string;
    reference: string;
    channel: string;
    targetAmount?: number | null;
    amountRaised?: number | null;
}

const text = {
    fontSize: '16px',
    color: '#404040',
    lineHeight: '26px',
};

export const PaymentSuccessEmail = ({
    firstName,
    donorEmail,
    campaignTitle,
    campaignId,
    amount,
    currency,
    reference,
    channel,
    targetAmount,
    amountRaised,
}: PaymentSuccessEmailProps) => {
    return (
        <Layout firstName={firstName} preview="Donation payment successful">
            <div>
                <Text style={text}>
                    Your donation was received successfully. Thank you for supporting this campaign through TorchLife.
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
                        <tr>
                            <th style={thStyle}>Channel</th>
                            <td style={tdStyle}>{channel}</td>
                        </tr>
                        {typeof targetAmount === 'number' && (
                            <tr>
                                <th style={thStyle}>Target Amount</th>
                                <td style={tdStyle}>
                                    {currency} {targetAmount.toLocaleString()}
                                </td>
                            </tr>
                        )}
                        {typeof amountRaised === 'number' && (
                            <tr>
                                <th style={thStyle}>Amount Raised</th>
                                <td style={tdStyle}>
                                    {currency} {amountRaised.toLocaleString()}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default PaymentSuccessEmail;
