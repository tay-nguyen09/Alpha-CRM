import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { getUsersAsync, addUsersAsync, updateUsersAsync, deleteUserPermanentlyAsync, getAllAnalyticPostsAsync, addAnalyticPostAsync, updateAnalyticPostAsync, deleteAnalyticPostAsync, addShortVideoPostAsync, getShortVideoPostsAsync, deleteShortVideoPostAsync } from "./firebaseSlice"

export const firebaseListener = createListenerMiddleware()

firebaseListener.startListening({
    matcher: isAnyOf(
        addUsersAsync.fulfilled,
        updateUsersAsync.fulfilled,
        deleteUserPermanentlyAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getUsersAsync())
    }
})
export const analyticPostsListener = createListenerMiddleware()

analyticPostsListener.startListening({
    matcher: isAnyOf(
        addAnalyticPostAsync.fulfilled,
        updateAnalyticPostAsync.fulfilled,
        deleteAnalyticPostAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getAllAnalyticPostsAsync())
    }
})


export const shortVideosPostsListener = createListenerMiddleware()

shortVideosPostsListener.startListening({
    matcher: isAnyOf(
        addShortVideoPostAsync.fulfilled,
        deleteShortVideoPostAsync.fulfilled
    ),
    effect: async (action, api) => {
        api.dispatch(getShortVideoPostsAsync())
    }
})
