export const formatAccountingNumber = (val: string) => {
    if (!val) return '';
    const num = Number(val.replace(/[^\d]/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN');
};

export const emptyData = (t: string | number) => !!t ? t : "-";
