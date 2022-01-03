import { useContext } from 'react';
import { AppContext, IAppContext } from '../contexts/AppContext';

const useAppContext = () => {
  const dataAppContext = useContext(AppContext) as IAppContext;
  return dataAppContext;
};

export default useAppContext;
