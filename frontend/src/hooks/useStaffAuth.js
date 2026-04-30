import { useContext } from 'react';
import { StaffAuthContext } from '../context/StaffAuthContext';

export const useStaffAuth = () => useContext(StaffAuthContext);