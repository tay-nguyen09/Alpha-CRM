"use client"
import React, { memo } from 'react'
import Input from '../form/input/InputField'

export type SearchBarProps = {
    value: string
    onSearchChange: (text: string) => void
}

const SearchBar = memo(function SearchBarComponent({
    value,
    onSearchChange,
}: SearchBarProps) {
    return (
        <Input
            placeholder='UID, Tên, Số Điện Thoại,...'
            value={value}
            onChange={(e) => onSearchChange(String(e.target.value))}
        />
    )
})

export default SearchBar
