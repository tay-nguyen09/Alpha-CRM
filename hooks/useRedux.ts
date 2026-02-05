import { addAnalyticPostAsync, addShortVideoPostAsync, deleteAnalyticPostAsync, deleteShortVideoPostAsync, getActionsAsync, getAllAnalyticPostsAsync, getShortVideoPostsAsync, selectActions, selectAnalyticPosts, selectDatabaseName, selectIsLoading, selectShortVideoPosts, selectTeamId, updateAnalyticPostAsync } from '@/lib/redux/features/firebase/firebaseSlice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { TypeAnalyticPostForm, TypeShortVideosPostForm, UpdateDataAnalyticPost } from '@/types/form'
import { useCurrentUser } from './useCurrentUser';

export const useRedux = () => {
    const dispatch = useAppDispatch();
    const { userId, role } = useCurrentUser()

    const getAnalyticPosts = () => {
        dispatch(getAllAnalyticPostsAsync())
    }

    const updateAnalyticPostByDocId = ({ docId, data }: { docId: string, data: UpdateDataAnalyticPost }) => {
        dispatch(updateAnalyticPostAsync({ docId, data }))
    }
    const addAnalyticPost = (data: TypeAnalyticPostForm) => {
        dispatch(addAnalyticPostAsync(data))

    }

    const deleteAnalyticPost = (id: string) => {
        dispatch(deleteAnalyticPostAsync(id))

    }

    const getShortVideoPosts = () => {
        dispatch(getShortVideoPostsAsync())
    }

    const addShortVideoPost = (data: TypeShortVideosPostForm) => {
        dispatch(addShortVideoPostAsync(data))

    }
    const deleteShortVideoPost = (id: string) => {
        dispatch(deleteShortVideoPostAsync(id))

    }

    const getActions = () => {
        dispatch(getActionsAsync({ role: role, user_id: userId }))
    }
    const analyticPosts = useAppSelector(selectAnalyticPosts)
    const isLoading = useAppSelector(selectIsLoading);
    const shortVideoPosts = useAppSelector(selectShortVideoPosts);
    const actions = useAppSelector(selectActions);
    const teamId = useAppSelector(selectTeamId);
    const databaseName = useAppSelector(selectDatabaseName);

    return {
        analyticPosts,
        isLoading,
        shortVideoPosts,
        actions,
        teamId,
        databaseName,

        getAnalyticPosts,
        updateAnalyticPostByDocId,
        addAnalyticPost,
        deleteAnalyticPost,
        getShortVideoPosts,
        addShortVideoPost,
        deleteShortVideoPost,
        getActions
    }
}

