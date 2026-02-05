import { TypeUser } from "./firebase"

export type UpdateData = Partial<TypeUser> & Record<string, unknown>

export type TypeAddNewUserFormData = {
    name: string
    phone: string
    email: string
    source: string
    note: string
    isFloating?: boolean
    assignId?: string
    status: string
    uid: string
    labels?: Array<string>
}
export type TypeEdiUserFormData = TypeAddNewUserFormData & {}

export type TypeAddNewUserData = TypeAddNewUserFormData & {
    assign: Array<{
        assignAt: number,
        employeeName: string
        uid: string
    }>
}

export type TypeCampaignStatus = 'running' | 'paused' | 'stopped';


export type TypeAddNewCampaign = {
    name: string;
    status: TypeCampaignStatus;
    adsLink: string;
    budget: string;
    startAt: number;
    endAt?: number | null;
    content: string;
    sourceUrl: string;
};


export type TypeTeamMember = {
    clerkId: string;
    createdAt: number;
    activitys: Array<{
        createdAt: number;
        type: "added" | "removed";
    }>;
    name: string;
};

export type TypeCampaign = TypeAddNewCampaign & {
    teamMembers: TypeTeamMember[];
    createdAt: number;
    createdBy: string;
    updatedAt?: number;
    id?: string
};

export type TypeAdsReport = {
    spam: number;
    note: string;
    total: number;
    replied: number;
    campaignId: string;
    refCustomers: number;
    newRegisters: number;
    paidCustomers: number;
};

export type TypeDailyAdsReport = {
    campaignId: string;
    createdAt: number;
    clerkId: string;
    username: string;
    metadata: TypeAdsReport
    updatedAt?: number;
    id?: string
}

export type TypeActionType = "add_contact" | "edit_contact" | "delete_contact" | "restore_contact" | "push_floating_user" | "update_daily_report" | "get_floating_contact"

export type TypeActionForm = {
    note: string;
    action: TypeActionType
}

export type TypeAction = TypeActionForm & {
    actionById: string;
    actionByName: string;
    userDocId: string;
}

export type TypeActionDoc = TypeAction & TypeActionForm & {
    createdAt: number,
    id: string
}


export type TypeAnalyticPostForm = {
    title: string;
    content: string;
    sourceUrl: string;
}

export type TypeAnalyticPostDoc = TypeAnalyticPostForm & {
    createdAt: number;
    updatedAt: number;
    id: string;
}

export type UpdateDataAnalyticPost = Partial<TypeAnalyticPostDoc> & Record<string, unknown>


export type TypeShortVideosPostForm = {
    title: string;
    sourceUrl: string;
}

export type TypeShortVideosPostDoc = TypeShortVideosPostForm & {
    createdAt: number;
    updatedAt: number;
    id: string;
}

export type UpdateDataShortVideosPost = Partial<TypeShortVideosPostDoc> & Record<string, unknown>