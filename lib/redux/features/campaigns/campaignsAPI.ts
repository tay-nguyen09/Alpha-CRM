import { collection, addDoc, getDocs, getDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { firebaseFireStore } from "@/utils/shared/firebase";
import { TypeCampaign, TypeDailyAdsReport } from "@/types/form";
import { timeStamp } from "@/utils/shared/common";
import { query, where } from "firebase/firestore";

export const addCampaignToFirebase = async (data: TypeCampaign) => {
    const campaignsRef = collection(firebaseFireStore, "campaigns");
    const docRef = await addDoc(campaignsRef, data);
    return { ...data, id: docRef.id };
};


export const getCampaigns = async () => {
    try {
        const contactRef = collection(firebaseFireStore, "campaigns")
        const querySnapshot = await getDocs(contactRef)
        if (!querySnapshot.empty) {
            const contacts = querySnapshot.docs.map((doc) => {
                return {
                    ...doc.data() as TypeCampaign,
                    id: doc.id
                }
            });
            return contacts
        } else {
            return []
        }
    } catch (error) {
        console.log(error)
        return []
    }
};


export const getCampaignByDocId = async (id: string) => {
    try {
        const contactRef = doc(firebaseFireStore, "campaigns", id)
        const querySnapshot = await getDoc(contactRef)
        if (querySnapshot.exists()) {
            return {
                ...querySnapshot.data() as TypeCampaign,
                id: querySnapshot.id
            }
        } else {
            return []
        }
    } catch (error) {
        console.log(error)
        return []
    }
};

export const updateCampaignByDocId = async ({ id, data }: { id: string, data: Partial<TypeCampaign> }) => {
    try {
        const contactRef = doc(firebaseFireStore, "campaigns", id)
        await updateDoc(contactRef, {
            lastUpdatedAt: new Date().getTime(),
            ...data
        })
        return true;
    } catch (error) {
        console.log(error)
        return []
    }
};


export const addDailyReportAds = async (data: TypeDailyAdsReport) => {
    try {
        const reportRef = doc(firebaseFireStore, "ads-reports", timeStamp().toString());
        await setDoc(reportRef, data);
        return true
    } catch (error) {
        return false
    }
};
export const updateDailyReportAds = async ({ id, data }: { id: string, data: Partial<TypeDailyAdsReport> }) => {
    try {
        const reportRef = doc(firebaseFireStore, "ads-reports", id);
        await updateDoc(reportRef, data);
        return true
    } catch (error) {
        return false
    }
};


export const getDailyReportAds = async () => {
    try {
        const adsReports = collection(firebaseFireStore, "ads-reports")
        const querySnapshot = await getDocs(adsReports)

        if (!querySnapshot.empty) {
            const contacts = querySnapshot.docs.map((doc) => {
                return {
                    ...doc.data() as TypeDailyAdsReport,
                    id: doc.id
                }
            });
            return contacts
        } else {
            return []
        }
    } catch (error) {
        return []
    }
};


export const getDailyReportAdsByRange = async (start?: number, end?: number) => {
    try {
        const adsReports = collection(firebaseFireStore, "ads-reports");
        let querySnapshot;
        if (typeof start === 'number' && typeof end === 'number') {
            const q = query(
                adsReports,
                where('createdAt', '>=', start),
                where('createdAt', '<=', end)
            );
            querySnapshot = await getDocs(q);
        } else {
            querySnapshot = await getDocs(adsReports);
        }

        if (!querySnapshot.empty) {
            const contacts = querySnapshot.docs.map((doc) => ({
                ...doc.data() as TypeDailyAdsReport,
                id: doc.id
            }));
            return contacts;
        } else {
            return [];
        }
    } catch (error) {
        return [];
    }
};
