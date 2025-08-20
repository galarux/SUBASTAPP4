
import { AuctionProvider, useAuction } from './context/AuctionContext';
import { LoginPage } from './pages/LoginPage';
import { AuctionPage } from './pages/AuctionPage';
import './App.css';

function AppContent() {
  const { state } = useAuction();
  const { usuario, error } = state;

  return (
    <div className="App">
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {usuario ? <AuctionPage /> : <LoginPage />}
    </div>
  );
}

function App() {
  return (
    <AuctionProvider>
      <AppContent />
    </AuctionProvider>
  );
}

export default App;
