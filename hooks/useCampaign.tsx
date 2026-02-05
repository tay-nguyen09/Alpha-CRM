import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useCurrentUser } from "./useCurrentUser";
import { addCampaignAsync, addDailyReportAdsAsync, getCampaignsAsync, getDailyReportAdsByRangeAsync, selectCampaigns, selectCampaignsIsLoading, selectDailyAdsReports, updateCampaignAsync, updateDailyReportAdsAsync } from "@/lib/redux/features/campaigns/campaignsSlice";
import { TypeCampaign, TypeDailyAdsReport } from "@/types/form";

export const useCampaign = () => {

    const { isLeader, userId } = useCurrentUser()

    const dispatch = useAppDispatch();
    const getCampaign = () => {
        dispatch(getCampaignsAsync())
    }

    const updateCampaignByDocId = ({ id, data }: { id: string, data: Partial<TypeCampaign> }) => {
        dispatch(updateCampaignAsync({ id, data }))
    }

    const addCampaign = (data: TypeCampaign) => {
        dispatch(addCampaignAsync(data))
    }

    const addDailyReportAds = (data: TypeDailyAdsReport) => {
        dispatch(addDailyReportAdsAsync(data))
    }

    const updateDailyReportAds = (id: string, data: Partial<TypeDailyAdsReport>) => {
        dispatch(updateDailyReportAdsAsync({ id, data }))
    }

    const getReportAdsToDay = () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        dispatch(getDailyReportAdsByRangeAsync({ start: startOfDay, end: endOfDay }));
    }

    const getAllDailyReportAds = () => {
        dispatch(getDailyReportAdsByRangeAsync({}))
    }

    const campaigns = useAppSelector(selectCampaigns).filter((doc) => isLeader ? isLeader : doc.teamMembers.find(member => member.clerkId === userId)?.activitys.slice(-1)[0]?.type === "added");
    const isLoading = useAppSelector(selectCampaignsIsLoading)
    const dailyReportAdsToDay = useAppSelector(selectDailyAdsReports).filter((_) => _.clerkId === userId);
    return {
        campaigns,
        isLoading,
        dailyReportAdsToDay,

        updateCampaignByDocId,
        getCampaign,
        addCampaign,
        getReportAdsToDay,
        addDailyReportAds,
        updateDailyReportAds
    }

}