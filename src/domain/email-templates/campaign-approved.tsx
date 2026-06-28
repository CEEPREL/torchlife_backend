import { Text } from '@react-email/components';
import Layout from './reuseable/layout';
import { tableStyle, tdStyle, thStyle } from './utils/styles';

interface CampaignApprovedEmailProps {
    firstName: string;
    campaignTitle: string;
    campaignId: string;
    status: string;
    currency: string;
    targetAmount: number;
    amountRaised: number;
    deadline: string;
    location?: string | null;
}

const text = {
    fontSize: '16px',
    color: '#404040',
    lineHeight: '26px',
};

export const CampaignApprovedEmail = ({
    firstName,
    campaignTitle,
    campaignId,
    status,
    currency,
    targetAmount,
    amountRaised,
    deadline,
    location,
}: CampaignApprovedEmailProps) => {
    return (
        <Layout firstName={firstName} preview="Campaign approved">
            <div>
                <Text style={text}>
                    Your campaign has been approved and is now ready for supporters to discover and donate to.
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
                            <th style={thStyle}>Status</th>
                            <td style={tdStyle}>{status}</td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Target Amount</th>
                            <td style={tdStyle}>
                                {currency} {targetAmount.toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Amount Raised</th>
                            <td style={tdStyle}>
                                {currency} {amountRaised.toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <th style={thStyle}>Deadline</th>
                            <td style={tdStyle}>{deadline}</td>
                        </tr>
                        {location && (
                            <tr>
                                <th style={thStyle}>Location</th>
                                <td style={tdStyle}>{location}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default CampaignApprovedEmail;
