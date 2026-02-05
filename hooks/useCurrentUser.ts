import { useUser } from "@clerk/nextjs"

type TypePublicMetaData = {
    role: "admin" | "sale" | "manage" | "leader",
    team_id: string
    db: string
}

const defaultPublicMetaData: TypePublicMetaData = {
    role: "sale",
    team_id: "",
    db: ""
}

export const useCurrentUser = () => {
    const user = useUser()
    const isLeader = user.user?.publicMetadata.role === "leader"
    const isAdmin = user.user?.publicMetadata.role === "admin"
    return {
        userId: user.user?.id || "",
        userName: user.user?.username || "",
        isLeader: isAdmin || isLeader || "",
        isAdmin: isAdmin || "",
        publicMetaData: {
            ...defaultPublicMetaData,
            ...user.user?.publicMetadata
        } as TypePublicMetaData,
        user: user.user || "",
        role: user.user?.publicMetadata.role as string || "sale"
    }
}