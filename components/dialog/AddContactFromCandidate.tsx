'use client'
import {
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { FaPlus } from 'react-icons/fa'
import NewContactForm from '../form/NewContactForm'
import PrimaryDialog from "./PrimaryDialog"
import { Button } from "../ui/button"

interface AddContactFromCandidateProps {
    phone: string
    customerName?: string
    buttonContent?: React.ReactNode
}

const AddContactFromCandidate = ({ phone, customerName, buttonContent }: AddContactFromCandidateProps) => {
    return (
        <PrimaryDialog
            buttonOpen={
                buttonContent ?? (
                    <Button >
                        <FaPlus />  Thêm Khách Hàng
                    </Button>
                )
            }
            isShowFooter={false}
        >
            <DialogHeader>
                <DialogTitle>Thêm Thông Tin Liên Hệ</DialogTitle>
            </DialogHeader>
            <div className="mt-5">
                <NewContactForm initialPhone={phone} initialCustomerName={customerName} initialSource="QC" />
            </div>
        </PrimaryDialog>

    )
}

export default AddContactFromCandidate
