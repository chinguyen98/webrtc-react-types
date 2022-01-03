import { ChangeEventHandler, InputHTMLAttributes, useState, VFC } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import styles from './entername.module.css';

const EnterNamePage: VFC = () => {
  const [name, setName] = useState<string>('');

  const handleChangeName: ChangeEventHandler<HTMLInputElement> = (e) => {
    setName(e.target.value);
  };

  const handleClick = () => {
    console.log({ name });
  };

  return (
    <>
      <div className={styles['enter-name']}>
        <h1>Please enter your name!</h1>
        <Input
          type="text"
          value={name}
          placeholder="Please enter your awesome name!"
          onChange={handleChangeName}
        />
        <div style={{ width: '100px' }}>
          <Button value="Start" onClick={handleClick} />
        </div>
      </div>
    </>
  );
};

export default EnterNamePage;
