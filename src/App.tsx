import { FC } from 'react';
import styles from './app.module.css';
import useAppContext from './hooks/useAppContext';
import EnterNamePage from './pages/EnterNamePage';
import MainPage from './pages/MainPage';

const App: FC = () => {
  const { ownUsername } = useAppContext();

  return (
    <div className={styles['app']}>
      {ownUsername ? <MainPage /> : <EnterNamePage />}
    </div>
  );
};

export default App;
