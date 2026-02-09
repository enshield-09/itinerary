// context/CreateTripContext.js

import { createContext, useState } from 'react';

export const CreateTripContext = createContext({
  tripData: null,
  setTripData: () => {}
});

export const CreateTripProvider = ({ children }) => {
  const [tripData, setTripData] = useState(null);

  return (
    <CreateTripContext.Provider value={{ tripData, setTripData }}>
      {children}
    </CreateTripContext.Provider>
  );
};
