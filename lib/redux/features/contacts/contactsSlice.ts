import { createAppSlice } from "../../createAppSlice";
import type { ReducerCreators } from "@reduxjs/toolkit";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { firebaseFireStore } from "@/utils/shared/firebase";

export type ChatContact = {
    id: string;
    phone: string;
    pageId: string;
    psid: string;
    conversationId: string;
    lastSeenAt: string;
    customerName?: string;
    name?: string;
    messageSnippet?: string;
    pageName?: string;
};

export type ContactCandidateData = {
    phone: string;
    pageId: string;
    pageName?: string;
    customerName?: string;
    name?: string;
    psid: string;
    conversationId: string;
    lastSeenAt: string;
    messageSnippet?: string;
};

export interface ContactsSliceState {
    items: ChatContact[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

const initialState: ContactsSliceState = {
    items: [],
    status: "idle",
    error: null,
};

export const contactsSlice = createAppSlice({
    name: "contacts",
    initialState,
    reducers: (create: ReducerCreators<ContactsSliceState>) => ({
        fetchContactCandidatesAsync: create.asyncThunk(
            async () => {
                try {
                    // Get all existing user phones
                    const usersRef = collection(firebaseFireStore, "users");
                    const usersSnap = await getDocs(usersRef);
                    const existingPhones = new Set<string>();
                    usersSnap.docs.forEach(doc => {
                        const phone = (doc.data() as ContactCandidateData)?.phone;
                        if (phone) existingPhones.add(phone);
                    });

                    const ref = collection(firebaseFireStore, "contact_candidates");
                    const q = query(ref, orderBy("lastSeenAt", "desc"));
                    const snap = await getDocs(q);
                    const rows: ChatContact[] = snap.docs
                        .filter(d => {
                            const phone = (d.data() as ContactCandidateData)?.phone;
                            // Only include if NOT already in users collection
                            return phone && !existingPhones.has(phone);
                        })
                        .map((d) => {
                            const data = d.data() as ContactCandidateData;
                            const contactName = data.customerName || data.name || data.psid || "";
                            return {
                                id: d.id,
                                phone: data.phone || "",
                                pageId: data.pageId || "",
                                pageName: data.pageName || "",
                                customerName: contactName,
                                name: data.name || "",
                                psid: data.psid || "",
                                conversationId: data.conversationId || "",
                                lastSeenAt: data.lastSeenAt || "",
                                messageSnippet: data.messageSnippet || "",
                            };
                        });
                    return rows;
                } catch (error) {
                    throw error;
                }
            },
            {
                pending: (state) => {
                    state.status = "loading";
                    state.error = null;
                },
                fulfilled: (state, action) => {
                    state.status = "succeeded";
                    state.items = action.payload;
                    state.error = null;
                },
                rejected: (state, action) => {
                    state.status = "failed";
                    state.error = action.error.message || "Failed to fetch contacts";
                },
            }
        ),
        deleteContactCandidateAsync: create.asyncThunk(
            async (docId: string) => {
                const docRef = doc(firebaseFireStore, "contact_candidates", docId);
                await deleteDoc(docRef);
                return docId;
            },
            {
                pending: (state) => {
                    state.status = "loading";
                },
                fulfilled: (state, action) => {
                    state.status = "succeeded";
                    state.items = state.items.filter(item => item.id !== action.payload);
                },
                rejected: (state, action) => {
                    state.status = "failed";
                    state.error = action.error.message || "Failed to delete contact";
                },
            }
        ),
    }),
    selectors: {
        selectContacts: (state) => state.items,
        selectContactsStatus: (state) => state.status,
        selectContactsError: (state) => state.error,
    },
});

export const { fetchContactCandidatesAsync, deleteContactCandidateAsync } = contactsSlice.actions;
export const { selectContacts, selectContactsStatus, selectContactsError } = contactsSlice.selectors;
