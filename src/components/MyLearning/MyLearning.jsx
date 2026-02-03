import { useState } from 'react';
import Dashboard from './Dashboard';
import BadgeCollection from './BadgeCollection';
import Statistics from './Statistics';
import DataManagement from './DataManagement';
import './MyLearning.css';

const TABS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'badges', label: '배지', icon: '🏆' },
  { id: 'statistics', label: '통계', icon: '📈' },
  { id: 'data', label: '데이터', icon: '💾' },
];

const MyLearning = ({ books }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="my-learning">
      <div className="my-learning-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="my-learning-content">
        {activeTab === 'dashboard' && <Dashboard books={books} />}
        {activeTab === 'badges' && <BadgeCollection />}
        {activeTab === 'statistics' && <Statistics books={books} />}
        {activeTab === 'data' && <DataManagement />}
      </div>
    </div>
  );
};

export default MyLearning;
