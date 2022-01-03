import { FC } from 'react';
import styles from './app.module.css';
import EnterNamePage from './pages/EnterNamePage';

const App: FC = () => {
  return (
    <div className={styles['app']}>
      <EnterNamePage />
    </div>
  );
};

export default App;
