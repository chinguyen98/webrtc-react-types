import { ChangeEventHandler, HTMLInputTypeAttribute, VFC } from 'react';
import styles from './input-style.module.css';

interface InputProps {
  type?: HTMLInputTypeAttribute | undefined;
  value?: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

const Input: VFC<InputProps> = ({
  type = 'text',
  value = '',
  placeholder = '',
  onChange,
}) => {
  return (
    <input
      className={styles['input']}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
};

export default Input;
