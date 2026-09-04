import React from 'react';
import MoneyRequestList from '@/components/admin/MoneyRequestList';
import { useDeposits } from '@/hooks/useData';
import { backend } from '@/services/backend';

export default function AdminDeposits() {
  const deposits = useDeposits();
  return (
    <MoneyRequestList
      title="Deposits"
      requests={deposits}
      onApprove={(r) => backend.approveDeposit(r)}
      onReject={(r) => backend.rejectDeposit(r)}
    />
  );
}
