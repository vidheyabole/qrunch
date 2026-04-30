import { Navigate } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import StaffLayout from './StaffLayout';
import KitchenDisplay from './KitchenDisplay';
import WaiterView from './WaiterView';
import ManagerView from './ManagerView';
import Loader from '../../components/common/Loader';

export default function StaffDashboard() {
  const { staff, loading } = useStaffAuth();

  if (loading) return <Loader />;
  if (!staff)  return <Navigate to="/staff/login" />;

  const VIEW = {
    manager: <ManagerView />,
    chef:    <KitchenDisplay />,
    waiter:  <WaiterView />
  };

  return (
    <StaffLayout>
      {VIEW[staff.role] || <Navigate to="/staff/login" />}
    </StaffLayout>
  );
}