import axios from "axios"

export const getClerkUsers = async () => {
    try {
        const res = await axios.get("/api/users")
        if (res.status == 200) {
            return res.data
        } else {
            return []
        }
    } catch (error) {
        console.log(error)
        return []
    }
}