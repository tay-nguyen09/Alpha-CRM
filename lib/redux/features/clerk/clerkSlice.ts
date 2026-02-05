import { User } from "@clerk/backend";
import type { ReducerCreators } from "@reduxjs/toolkit";
import { createAppSlice } from "../../createAppSlice";
import { getClerkUsers } from "./clerkApi";

export interface ClerkSliceState {
    users: User[];
    isLoading: boolean
}

const initialState: ClerkSliceState = {
    users: [],
    isLoading: false
};

export const clerkSlice = createAppSlice({
    name: "clerk",
    initialState,
    reducers: (create: ReducerCreators<ClerkSliceState>) => ({
        getClerkUsersAsync: create.asyncThunk(
            async () => {
                const response = await getClerkUsers();
                return response.data;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.users = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.isLoading = false;
                },
            },
        ),
    }),
    selectors: {
        selectClerkUsers: (clerk) => clerk.users,
    },
});

export const { getClerkUsersAsync } = clerkSlice.actions;

export const { selectClerkUsers } = clerkSlice.selectors;


