'use client';
import ComponentCard from '@/components/common/ComponentCard';
import { getCampaignByDocId } from '@/lib/redux/features/campaigns/campaignsAPI';
import { TypeCampaign, TypeTeamMember } from '@/types/form';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { formatAccountingNumber } from '@/utils/shared/string';
import { ChartRadarDots } from '../chart/ChartRadar';
import { ChartPie } from '../chart/ChartPie';
import SourceImgAndVideo from '../common/SourceImgAndVideo';
import { Button } from '../ui/button';

export default function CampaignInfoOnly() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [campaign, setCampaign] = React.useState<TypeCampaign | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await getCampaignByDocId(id) as TypeCampaign;
                setCampaign(res);
            } catch (e) {
                setError('Không thể tải dữ liệu chiến dịch.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return <div className="p-4">Đang tải...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!campaign) return <div className="p-4">Không tìm thấy chiến dịch.</div>;

    return (
        <div className="p-4 flex gap-5 flex-3">
            <ComponentCard title="Thông tin chiến dịch"
                button={
                    <Button variant='outline' onClick={() => router.push(`/ads/${id}?isEdit=true`)}>
                        Chỉnh sửa
                    </Button>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <SourceImgAndVideo url={campaign.sourceUrl || ""} />
                        <div className="text-xl font-bold mt-2">{campaign.name}</div>
                        <div className="text-sm text-gray-500">Trạng thái: <span className="font-semibold capitalize">{campaign.status}</span></div>
                    </div>
                    <div className="">
                        <div><span className="font-semibold dark:text-white">Ngân sách:</span> {formatAccountingNumber(campaign.budget)} vnđ</div>
                        <div><span className="font-semibold dark:text-white">Link quảng cáo:</span> <a href={campaign.adsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{campaign.adsLink}</a></div>
                        <div><span className="font-semibold dark:text-white">Ngày bắt đầu:</span> {campaign.startAt ? new Date(campaign.startAt).toLocaleDateString() : '-'}</div>
                        <div><span className="font-semibold dark:text-white">Ngày kết thúc:</span> {campaign.endAt ? new Date(campaign.endAt).toLocaleDateString() : '-'}</div>
                        <div><span className="font-semibold dark:text-white">Nội dung quảng cáo:</span> <span className="whitespace-pre-line">{campaign.content}</span></div>
                        <div><span className="font-semibold dark:text-white">Thành viên tham gia:</span> {Array.isArray(campaign.teamMembers) && campaign.teamMembers.length > 0 ? campaign.teamMembers.map((m: TypeTeamMember) => m.name).join(', ') : 'Không có'}</div>
                    </div>
                </div>
            </ComponentCard>
            <ComponentCard className='flex-1' title="Tổng Quan Chất Lượng Mess">
                <ChartRadarDots />
            </ComponentCard>
            <ComponentCard className='flex-1'>
                <ChartPie />
            </ComponentCard>
        </div>
    );
}
