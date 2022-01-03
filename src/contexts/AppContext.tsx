import { createContext, FC, useState } from 'react';

export interface IAppContext {
  ownUsername: string | null;
  setOwnUsername: (value: string | null) => void;
  isAudioReady: boolean;
  setIsAudioReady: (value: boolean) => void;
  isVideoReady: boolean;
  setIsVideoReady: (value: boolean) => void;
}

export const AppContext = createContext<IAppContext | null>(null);

const AppContextProvider: FC = ({ children }) => {
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [ownUsername, setOwnUsername] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        isAudioReady,
        isVideoReady,
        setIsAudioReady,
        setIsVideoReady,
        ownUsername,
        setOwnUsername,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
