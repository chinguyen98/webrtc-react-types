import { MouseEventHandler, VFC } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  value: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

const Button: VFC<ButtonProps> = ({ value, onClick }) => {
  return (
    <button className={styles['button']} onClick={onClick}>
      {value}
    </button>
  );
};

export default Button;
