import React from 'react';

const AppContext = React.createContext({});
const AppProvider = AppContext.Provider;
const AppConsumer = AppContext.Consumer;

export { AppContext, AppProvider, AppConsumer };
