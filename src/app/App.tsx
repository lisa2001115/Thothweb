import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SMELoginScreen } from './components/SMELoginScreen';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { SMEInterviewScreen } from './components/SMEInterviewScreen';
import { UserChatScreen } from './components/UserChatScreen';
import { AdminDashboard } from './components/AdminDashboard';
import logo from '../imports/9f1c0fff6db140c699c14f229a52b1f2.png';

type Screen = 'login' | 'admin-login' | 'admin' | 'sme-login' | 'sme' | 'user' | 'support';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  const handleSelectRole = (role: 'admin' | 'sme' | 'user' | 'support') => {
    if (role === 'sme')   { setCurrentScreen('sme-login');   return; }
    if (role === 'admin') { setCurrentScreen('admin-login'); return; }
    setCurrentScreen(role);
  };
  const handleBack = () => setCurrentScreen('login');

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-white">
      {/* Top Banner */}
      <div
        className="w-full flex items-center flex-shrink-0 px-6 py-3"
        style={{ backgroundColor: '#E20074' }}
      >
        <img src={logo} alt="Thoth" className="h-8 object-contain" />
      </div>

      {/* Screen content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'login'       && <LoginScreen onSelectRole={handleSelectRole} />}
        {currentScreen === 'sme-login'   && (
          <SMELoginScreen
            onSuccess={() => setCurrentScreen('sme')}
            onBack={handleBack}
          />
        )}
        {currentScreen === 'admin-login' && (
          <AdminLoginScreen
            onSuccess={() => setCurrentScreen('admin')}
            onBack={handleBack}
          />
        )}
        {currentScreen === 'sme'         && <SMEInterviewScreen onBack={handleBack} />}
        {currentScreen === 'user'        && <UserChatScreen onBack={handleBack} />}
        {currentScreen === 'support'     && <UserChatScreen onBack={handleBack} />}
        {currentScreen === 'admin'       && <AdminDashboard onBack={handleBack} />}
      </div>
    </div>
  );
}