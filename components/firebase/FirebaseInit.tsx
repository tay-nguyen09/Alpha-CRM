"use client";
import { setDatabaseName, setTeamId } from '@/lib/redux/features/firebase/firebaseSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { initFirestore } from '@/utils/shared/firebase'
import { useUser } from '@clerk/nextjs';
import React from 'react'

const FirebaseInit = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const { isLoaded, user } = useUser()
    const dispatch = useAppDispatch()

    React.useLayoutEffect(() => {
        initFirestore(user?.publicMetadata.db as string);
        dispatch(setDatabaseName(user?.publicMetadata.db as string || "(default)"))
        dispatch(setTeamId(user?.publicMetadata.team_id as string || "2f"))
    }, [user, isLoaded])

    if (!isLoaded) return <>...loading</>
    return children
}

export default FirebaseInit