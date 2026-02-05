import PrimaryDialog from '@/components/dialog/PrimaryDialog'
import EditContactForm from '@/components/form/EditContactForm'
import {
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import Link from "next/link"
import { FaInfo } from 'react-icons/fa'
import { Button } from "../button"
type Props = {
    docId: string
}

const DetailContact = ({ docId }: Props) => {
    const { isLeader } = useCurrentUser()
    if (isLeader) {
        return (
            <Link href={`/contacts/${docId}`}>
                <Button variant='outline' >
                    <FaInfo />
                </Button>
            </Link>
        )
    }
    return (
        <PrimaryDialog
            buttonOpen={
                <Button variant="outline">
                    <FaInfo />
                </Button>
            }
            isShowFooter={false}
        >
            <DialogHeader>
                <DialogTitle>Chi Tiết</DialogTitle>
            </DialogHeader>
            <EditContactForm isDisable={true} docId={docId} />
        </PrimaryDialog>

    )
}

export default DetailContact