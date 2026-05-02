import { Users, UserCog, Shield, Headphones } from 'lucide-react';

interface LoginScreenProps {
  onSelectRole: (role: 'admin' | 'sme' | 'user' | 'support') => void;
}

const roles = [
  {
    key: 'admin'   as const,
    icon: Shield,
    title: 'Admin',
    desc:  'Access dashboard and analytics',
  },
  {
    key: 'sme'     as const,
    icon: UserCog,
    title: 'SME',
    desc:  'Subject Matter Expert interview',
  },
  {
    key: 'user'    as const,
    icon: Users,
    title: 'User',
    desc:  'Chat with Thoth AI',
  },
  {
    key: 'support' as const,
    icon: Headphones,
    title: 'Support',
    desc:  'Chat with Thoth AI',
  },
];

export function LoginScreen({ onSelectRole }: LoginScreenProps) {
  return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center">
      {/* Title */}
      <h1 className="text-6xl mb-3" style={{ color: '#E20074' }}>Thoth</h1>
      <h2 className="text-2xl text-gray-900 mb-2">Welcome back</h2>
      <p className="text-sm text-gray-400 mb-10">Select your role to continue</p>

      {/* Role cards */}
      <div className="w-full max-w-sm space-y-3 px-4">
        {roles.map(({ key, icon: Icon, title, desc }) => {
          const isDisabled = key === 'support';
          return (
            <button
              key={key}
              onClick={() => !isDisabled && onSelectRole(key)}
              disabled={isDisabled}
              className={`w-full bg-white border rounded-2xl px-5 py-4 flex items-center space-x-4 text-left transition-all duration-200 ${
                isDisabled
                  ? 'border-gray-100 opacity-40 cursor-not-allowed'
                  : 'border-gray-200 hover:border-[#E20074] hover:shadow-md cursor-pointer'
              }`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isDisabled ? '#ccc' : '#E20074' }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-900">{title}{isDisabled && <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>}</p>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}