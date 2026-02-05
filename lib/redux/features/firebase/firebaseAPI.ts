import { TypeUser } from "@/types/firebase";
import { TypeAction, TypeActionDoc, TypeAddNewUserData, TypeAnalyticPostDoc, TypeAnalyticPostForm, TypeShortVideosPostDoc, TypeShortVideosPostForm, UpdateData, UpdateDataAnalyticPost, UpdateDataShortVideosPost } from "@/types/form";
import { timeStamp } from "@/utils/shared/common";
import { firebaseFireStore } from "@/utils/shared/firebase";
import { addDoc, arrayUnion, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

export const getUsers = async () => {
  try {
    const contactRef = collection(firebaseFireStore, "users")
    const querySnapshot = await getDocs(contactRef)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeUser,
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
}

export const getDeletedUsers = async () => {
  try {
    const contactRef = collection(firebaseFireStore, "users")
    const queryContact = query(contactRef, where("isDelete", "==", true))
    const querySnapshot = await getDocs(queryContact)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeUser,
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
}

export const getUsersRange = async (start: number, end: number) => {
  try {
    const contactRef = collection(firebaseFireStore, "users")
    const queryContact = query(contactRef, where("isDelete", "==", false), where("createdAt", ">=", start), where("createdAt", "<=", end))
    const querySnapshot = await getDocs(queryContact)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeUser,
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
}

export const getUserByDocId = async (docId: string) => {
  try {
    const docRef = doc(firebaseFireStore, "users", docId)

    const res = await getDoc(docRef)
    if (res.exists()) {
      return res.data() as TypeUser
    } else {
      return []
    }
  } catch (error) {
    console.log(error)
    return []
  }
}

export const addUser = async ({ data, action }: { data: TypeAddNewUserData, action: TypeAction }) => {
  try {
    const metadata = {
      createdAt: timeStamp(),
      actions: [],
      isDelete: false,
      lasteUpadteAt: timeStamp(),
      ...data,
    }

    const res = await addDoc(collection(firebaseFireStore, "users"), metadata)

    await addAction({ ...action, userDocId: res.id })

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

export const addUserAsync = async ({ data, action }: { data: TypeAddNewUserData, action: TypeAction }) => {
  try {
    const metadata = {
      createdAt: timeStamp(),
      actions: [],
      isDelete: false,
      lasteUpadteAt: timeStamp(),
      ...data,
    }

    const res = await addDoc(collection(firebaseFireStore, "users"), metadata)

    await addAction({ ...action, userDocId: res.id })

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

export const addUserDataManually = async (index: number, contacts: Array<{ uid: string, phone: string }>) => {
  const user = contacts[index];
  const metadata = {
    "phone": user.phone,
    "name": "DATA ĐÃ NẠP",
    "source": "DATA VIP",
    "uid": user.uid,
    "status": "Chưa Tiếp Cận",
    "email": "",
    "note": "Vui Lòng Cập Nhật tình trạng liên hệ tại đây",
    "labels": [],
    "isFloating": true,
    "assign": [
      {
        "assignAt": new Date().getTime(),
        "employeeName": "steven",
        "uid": "user_36V5SRlFh66CpT6KhDNp7ZqRTZN"
      }
    ]
  }

  const contactRef = collection(firebaseFireStore, "users")
  const queryContact = query(contactRef, where("phone", "==", user.phone))
  const querySnapshot = await getDocs(queryContact)

  if (querySnapshot.empty) {
    await addUserAsync({
      data: metadata,
      action: {
        userDocId: "",
        actionById: "user_36V5SRlFh66CpT6KhDNp7ZqRTZN",
        actionByName: "steven",
        action: "add_contact",
        note: "Thêm mới liên hệ",
      }
    })
    console.log("success", user.phone, user.uid);

    setTimeout(() => {
      if (index + 1 < contacts.length) {
        addUserDataManually(index + 1, contacts);
      }
    }, 1000);
  } else {
    console.log("Đã Tồn Tại");
    setTimeout(() => {
      if (index + 1 < contacts.length) {
        addUserDataManually(index + 1, contacts);
      }
    }, 1000);
  }
}

export const addAction = async (action: TypeAction) => {
  try {
    const metadata = {
      createdAt: timeStamp(),
      ...action,
    }
    const res = await addDoc(collection(firebaseFireStore, "actions"), metadata)
    return res.id
  } catch (error) {
    console.log(error);
  }
}

export const updateUserByDocId = async (
  docId: string,
  data: UpdateData,
  action: TypeAction
) => {
  try {
    const docRef = doc(firebaseFireStore, "users", docId);
    const actionId = await addAction(action)
    await updateDoc(docRef, {
      ...data,
      lasteUpadteAt: timeStamp(),
      actions: arrayUnion(actionId)
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteUserPermanently = async (docId: string) => {
  try {
    const docRef = doc(firebaseFireStore, "users", docId);
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const getUserCount = async () => {
  try {
    const q = query(
      collection(firebaseFireStore, "users"),
      where("isDelete", "==", false)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;

  } catch (error) {
    console.log(error)
    return []
  }
}

export const getAllAnalyticPosts = async () => {
  try {
    const analyticPostsRef = collection(firebaseFireStore, "analytic-posts")
    const querySnapshot = await getDocs(analyticPostsRef)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeAnalyticPostDoc,
          id: doc.id
        }
      });
      return contacts
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

export const addNewAnalyticPost = async (data: TypeAnalyticPostForm) => {
  try {
    const metadata = {
      ...data,
      createdAt: timeStamp(),
      updatedAt: timeStamp(),
    };
    const res = await addDoc(collection(firebaseFireStore, "analytic-posts"), metadata);
    return res.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const updateAnalyticPostByDocId = async (
  docId: string,
  data: UpdateDataAnalyticPost,
) => {
  try {
    const docRef = doc(firebaseFireStore, "analytic-posts", docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: timeStamp(),
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteAnalyticPostByDocId = async (
  docId: string,
) => {
  try {
    const docRef = doc(firebaseFireStore, "analytic-posts", docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getShortVideoPosts = async () => {
  try {
    const shortVideosPostsRef = collection(firebaseFireStore, "short-videos-posts")
    const querySnapshot = await getDocs(shortVideosPostsRef)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeShortVideosPostDoc,
          id: doc.id
        }
      });
      return contacts
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

export const addNewShortVideosPost = async (data: TypeShortVideosPostForm) => {
  try {
    const metadata = {
      ...data,
      createdAt: timeStamp(),
      updatedAt: timeStamp(),
    };
    const res = await addDoc(collection(firebaseFireStore, "short-videos-posts"), metadata);
    return res.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const updateShortVideosPostByDocId = async (
  docId: string,
  data: UpdateDataShortVideosPost,
) => {
  try {
    const docRef = doc(firebaseFireStore, "short-videos-posts", docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: timeStamp(),
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteShortVideosPostByDocId = async (
  docId: string,
) => {
  try {
    const docRef = doc(firebaseFireStore, "short-videos-posts", docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const getActions = async () => {
  try {
    const actionRef = collection(firebaseFireStore, "actions")
    const querySnapshot = await getDocs(actionRef)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeActionDoc,
          id: doc.id
        }
      });
      return contacts
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

export const getActionsByClerkId = async (clerkId: string) => {
  try {
    const actionRef = collection(firebaseFireStore, "actions")
    const queryContact = query(actionRef, where("actionById", "==", clerkId))
    const querySnapshot = await getDocs(queryContact)
    if (!querySnapshot.empty) {
      const contacts = querySnapshot.docs.map((doc) => {
        return {
          ...doc.data() as TypeActionDoc,
          id: doc.id
        }
      });
      return contacts
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}