import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { addCampaignAsync, addDailyReportAdsAsync, getCampaignsAsync, getDailyReportAdsByRangeAsync, updateCampaignAsync, updateDailyReportAdsAsync } from "./campaignsSlice"

export const campaignsListener = createListenerMiddleware()

campaignsListener.startListening({
    matcher: isAnyOf(
        addCampaignAsync.fulfilled,
        updateCampaignAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getCampaignsAsync())
    }
})


export const adsReportListener = createListenerMiddleware()

adsReportListener.startListening({
    matcher: isAnyOf(
        addDailyReportAdsAsync.fulfilled,
        updateDailyReportAdsAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getDailyReportAdsByRangeAsync({}))
    }
})
