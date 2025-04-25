import React from 'react';

const statusStyles = {
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  noshow: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-800'
};

const statusText = {
  completed: '来店済み',
  cancelled: 'キャンセル',
  noshow: '未来店',
  active: '予約済み',
  pending: '処理中'
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      statusStyles[status] || 'bg-gray-100 text-gray-800'
    }`}>
      {statusText[status] || status}
    </span>
  );
};

export default StatusBadge; 