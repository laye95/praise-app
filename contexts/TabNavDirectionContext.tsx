import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

export type TabNavDirection = "forward" | "back" | undefined;

interface TabNavDirectionContextType {
  direction: TabNavDirection;
  setDirection: (direction: TabNavDirection) => void;
}

const TabNavDirectionContext = createContext<TabNavDirectionContextType>({
  direction: undefined,
  setDirection: () => {},
});

export function TabNavDirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirectionState] = useState<TabNavDirection>(undefined);

  const setDirection = useCallback((d: TabNavDirection) => {
    setDirectionState(d);
  }, []);

  return (
    <TabNavDirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </TabNavDirectionContext.Provider>
  );
}

export function useTabNavDirection() {
  return useContext(TabNavDirectionContext);
}
