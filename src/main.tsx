import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './firebase/AuthContext.tsx';
import { testFirestoreConnection } from './firebase/config.ts';
import './index.css';

// Perform required initial startup validation to Firestore
testFirestoreConnection();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
