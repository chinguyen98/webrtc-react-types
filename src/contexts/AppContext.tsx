import { createContext, FC, useState } from 'react';

export interface IAppContext {
  ownUsername: string | null;
  setOwnUsername: (value: string | null) => void;
  pc: RTCPeerConnection | null;
  setPc: (value: RTCPeerConnection | null) => void;
}

export const AppContext = createContext<IAppContext | null>(null);

const AppContextProvider: FC = ({ children }) => {
  const [ownUsername, setOwnUsername] = useState<string | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);

  return (
    <AppContext.Provider
      value={{
        pc,
        setPc,
        ownUsername,
        setOwnUsername,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
