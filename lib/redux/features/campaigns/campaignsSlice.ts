import { TypeCampaign, TypeDailyAdsReport } from '@/types/form';
import { ReducerCreators } from '@reduxjs/toolkit';
import { createAppSlice } from '../../createAppSlice';
import { addCampaignToFirebase, addDailyReportAds, getCampaigns, getDailyReportAdsByRange, updateCampaignByDocId, updateDailyReportAds } from './campaignsAPI';

export interface CampaignSliceState {
    campaigns: TypeCampaign[],
    isLoading: boolean,
    error: string | null,
    dailyAdsReports: TypeDailyAdsReport[],
    allDailyAdsReports: TypeDailyAdsReport[],
}

const initialState: CampaignSliceState = {
    campaigns: [] as TypeCampaign[],
    isLoading: false,
    error: null as string | null,
    dailyAdsReports: [] as TypeDailyAdsReport[],
    allDailyAdsReports: [] as TypeDailyAdsReport[],
};

export const campaignsSlice = createAppSlice({
    name: "campaigns",
    initialState,
    reducers: (create: ReducerCreators<CampaignSliceState>) => ({
        addCampaignAsync: create.asyncThunk(
            async (data: TypeCampaign) => {
                await addCampaignToFirebase(data);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state,) => {
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
        updateCampaignAsync: create.asyncThunk(
            async ({ id, data }: { id: string, data: Partial<TypeCampaign> }) => {
                await updateCampaignByDocId({ id, data });
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state,) => {
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
        getCampaignsAsync: create.asyncThunk(
            async () => {
                const response = await getCampaigns();
                return response as TypeCampaign[];
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.campaigns = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),

        addDailyReportAdsAsync: create.asyncThunk(
            async (data: TypeDailyAdsReport) => {
                await addDailyReportAds(data);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
        updateDailyReportAdsAsync: create.asyncThunk(
            async ({ id, data }: { id: string, data: Partial<TypeDailyAdsReport> }) => {
                await updateDailyReportAds({ id, data });
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
        getDailyReportAdsByRangeAsync: create.asyncThunk(
            async ({ start, end }: { start?: number, end?: number }) => {
                const res = await getDailyReportAdsByRange(start, end);
                return res as TypeDailyAdsReport[]
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.dailyAdsReports = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
    }),
    selectors: {
        selectCampaigns: (campaigns) => campaigns.campaigns,
        selectCampaignsIsLoading: (campaigns) => campaigns.isLoading,
        selectDailyAdsReports: (campaigns) => campaigns.dailyAdsReports,
        selectAllDailyAdsReports: (campaigns) => campaigns.allDailyAdsReports,
    },
});

export const {
    addCampaignAsync,
    getCampaignsAsync,
    updateCampaignAsync,
    addDailyReportAdsAsync,
    getDailyReportAdsByRangeAsync,
    updateDailyReportAdsAsync
} = campaignsSlice.actions;

export const { selectCampaigns, selectCampaignsIsLoading, selectDailyAdsReports, selectAllDailyAdsReports } = campaignsSlice.selectors;

export default campaignsSlice.reducer;
