import React from 'react';
import MoneyRequestList from '@/components/admin/MoneyRequestList';
import { useWithdrawals } from '@/hooks/useData';
import { backend } from '@/services/backend';

export default function AdminWithdrawals() {
  const { items: withdrawals, loading } = useWithdrawals();
  return (
    <MoneyRequestList
      title="Withdrawals"
      requests={withdrawals}
      approveLabel="Mark Paid"
      onApprove={(r) => backend.approveWithdrawal(r)}
      onReject={(r) => backend.rejectWithdrawal(r)}
    />
  );
}
