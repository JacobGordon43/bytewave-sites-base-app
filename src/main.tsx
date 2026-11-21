import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Provider } from 'react-redux';
import store from './redux/store.ts';
import { Amplify } from 'aws-amplify';
import { outputs, authConfigured } from "./config/runtime";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.tsx';
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { sessionStorage } from 'aws-amplify/utils';
if (authConfigured)
    Amplify.configure(outputs);
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
createRoot(document.getElementById('root')!).render(<StrictMode>
    <AuthProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </AuthProvider>
  </StrictMode>);
