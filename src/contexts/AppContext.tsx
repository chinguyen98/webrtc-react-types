import { createContext, FC, useState } from 'react';

export interface IAppContext {
  isAudioReady: boolean;
  setIsAudioReady: (value: boolean) => void;
  isVideoReady: boolean;
  setIsVideoReady: (value: boolean) => void;
}

export const AppContext = createContext<IAppContext | null>(null);

const AppContextProvider: FC = ({ children }) => {
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        isAudioReady,
        isVideoReady,
        setIsAudioReady,
        setIsVideoReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
