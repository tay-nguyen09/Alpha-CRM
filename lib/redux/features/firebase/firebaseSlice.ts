import { TypeUser } from "@/types/firebase";
import { TypeAction, TypeActionDoc, TypeAddNewUserData, TypeAnalyticPostDoc, TypeAnalyticPostForm, TypeShortVideosPostDoc, TypeShortVideosPostForm, UpdateData, UpdateDataAnalyticPost } from "@/types/form";
import type { ReducerCreators } from "@reduxjs/toolkit";
import { createAppSlice } from "../../createAppSlice";
import { addNewAnalyticPost, addNewShortVideosPost, addUser, deleteAnalyticPostByDocId, deleteShortVideosPostByDocId, deleteUserPermanently, getActions, getActionsByClerkId, getAllAnalyticPosts, getDeletedUsers, getShortVideoPosts, getUserCount, getUsers, updateUserByDocId } from "./firebaseAPI";

export interface FirebaseSliceState {
    value: number;
    status: "success" | "loading" | "failed";
    users: Array<TypeUser>
    deletedUsers: Array<TypeUser>
    isLoading: boolean
    userCount: number
    analyticPosts: Array<TypeAnalyticPostDoc>
    shortVideoPosts: Array<TypeShortVideosPostDoc>
    actions: Array<TypeActionDoc>
    databaseName: string
    teamId: string
}

const initialState: FirebaseSliceState = {
    value: 0,
    status: "success",
    users: [],
    deletedUsers: [],
    isLoading: false,
    userCount: 0,
    analyticPosts: [],
    shortVideoPosts: [],
    actions: [],
    databaseName: "blank",
    teamId: ""
};

export const firebaseSlice = createAppSlice({
    name: "firebase",
    initialState,
    reducers: (create: ReducerCreators<FirebaseSliceState>) => ({
        setDatabaseName: create.reducer(
            (state, action: { payload: string }) => {
                state.databaseName = action.payload;
            }
        ),
        setTeamId: create.reducer(
            (state, action: { payload: string }) => {
                state.teamId = action.payload;
            }
        ),
        getUsersAsync: create.asyncThunk(
            async () => {
                const response = await getUsers();
                return response as Array<TypeUser>;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    const all = action.payload as Array<TypeUser>;
                    state.users = all.filter(u => !u.isDelete);
                    state.deletedUsers = all.filter(u => !!u.isDelete);
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        updateUsersAsync: create.asyncThunk(
            async ({ docId, data, action }: { docId: string, data: UpdateData, action: TypeAction }) => {
                await updateUserByDocId(docId, data, action);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        addUsersAsync: create.asyncThunk(
            async ({ data, action }: { data: TypeAddNewUserData, action: TypeAction }) => {
                const response = await addUser({ data, action });
                return response;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getFloatingUsersAsync: create.asyncThunk(
            async () => {
                const response = await getUsers();
                return response as Array<TypeUser>;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getDeletedUsersAsync: create.asyncThunk(
            async () => {
                const response = await getDeletedUsers();
                return response as Array<TypeUser>;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    state.deletedUsers = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        deleteUserPermanentlyAsync: create.asyncThunk(
            async (docId: string) => {
                await deleteUserPermanently(docId);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getUserCountAsync: create.asyncThunk(
            async () => {
                const response = await getUserCount();
                return response as number;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    state.userCount = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getAllAnalyticPostsAsync: create.asyncThunk(
            async () => {
                const res = await getAllAnalyticPosts()
                return res;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    state.analyticPosts = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        addAnalyticPostAsync: create.asyncThunk(
            async (data: TypeAnalyticPostForm) => {
                await addNewAnalyticPost(data);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        updateAnalyticPostAsync: create.asyncThunk(
            async ({ docId, data }: { docId: string, data: UpdateDataAnalyticPost }) => {
                // Replace with your actual API call to update analytic post
                // Example: await updateAnalyticPost(id, data);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        deleteAnalyticPostAsync: create.asyncThunk(
            async (docId: string) => {
                // Replace with your actual API call to delete analytic post
                // Example: await deleteAnalyticPost(docId);
                await deleteAnalyticPostByDocId(docId)
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        addShortVideoPostAsync: create.asyncThunk(
            async (data: TypeShortVideosPostForm) => {
                await addNewShortVideosPost(data);
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getShortVideoPostsAsync: create.asyncThunk(
            async () => {
                const res = await getShortVideoPosts()
                return res;
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    state.shortVideoPosts = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        deleteShortVideoPostAsync: create.asyncThunk(
            async (docId: string) => {
                await deleteShortVideosPostByDocId(docId)
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state) => {
                    state.status = "success";
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
        getActionsAsync: create.asyncThunk(
            async ({ role, user_id }: { role: string, user_id: string }) => {
                switch (role) {
                    case "leader":
                        return await getActions()
                    case "admin":
                        return await getActions()
                    default:
                        return await getActionsByClerkId(user_id)
                }
            },
            {
                pending: (state) => {
                    state.isLoading = true;
                },
                fulfilled: (state, action) => {
                    state.status = "success";
                    state.actions = action.payload;
                    state.isLoading = false;
                },
                rejected: (state) => {
                    state.status = "failed";
                    state.isLoading = false;
                },
            },
        ),
    }),
    selectors: {
        selectUsers: (firebase) => firebase.users,
        selectDeletedUsers: (firebase) => firebase.deletedUsers,
        selectUsersCount: (firebase) => firebase.userCount,
        selectStatus: (firebase) => firebase.status,
        selectAnalyticPosts: (firebase) => firebase.analyticPosts,
        selectIsLoading: (firebase) => firebase.isLoading,
        selectShortVideoPosts: (firebase) => firebase.shortVideoPosts,
        selectActions: (firebase) => firebase.actions,
        selectDatabaseName: (firebase) => firebase.databaseName,
        selectTeamId: (firebase) => firebase.teamId,
    },
});

export const {
    getUsersAsync,
    addUsersAsync,
    updateUsersAsync,
    getUserCountAsync,
    getDeletedUsersAsync,
    deleteUserPermanentlyAsync,
    getAllAnalyticPostsAsync,
    addAnalyticPostAsync,
    updateAnalyticPostAsync,
    deleteAnalyticPostAsync,
    getShortVideoPostsAsync,
    addShortVideoPostAsync,
    deleteShortVideoPostAsync,
    getActionsAsync,
    setDatabaseName,
    setTeamId

} = firebaseSlice.actions;

export const {
    selectUsers,
    selectStatus,
    selectUsersCount,
    selectDeletedUsers,
    selectAnalyticPosts,
    selectIsLoading,
    selectShortVideoPosts,
    selectActions,
    selectDatabaseName,
    selectTeamId
} = firebaseSlice.selectors;


