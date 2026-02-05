import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { campaignsSlice } from "./features/campaigns/campaignsSlice";
import { adsReportListener, campaignsListener } from "./features/campaigns/listeners";
import { clerkSlice } from "./features/clerk/clerkSlice";
import { contactsSlice } from "./features/contacts/contactsSlice";
import { firebaseSlice } from "./features/firebase/firebaseSlice";
import { analyticPostsListener, firebaseListener, shortVideosPostsListener } from "./features/firebase/listeners";
import { messagesSlice } from "./features/messages/messagesSlice";

const rootReducer = combineSlices(firebaseSlice, clerkSlice, messagesSlice, contactsSlice, campaignsSlice);
export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend([
      firebaseListener.middleware,
      campaignsListener.middleware,
      adsReportListener.middleware,
      analyticPostsListener.middleware,
      shortVideosPostsListener.middleware
    ]),
  });
};

// Infer the return type of `makeStore`
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
