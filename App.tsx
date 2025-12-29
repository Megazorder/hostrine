import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PropertyList } from './pages/PropertyList';
import { PropertyEditor } from './pages/PropertyEditor';
import { ProfileEditor } from './pages/ProfileEditor';
import { Showcase } from './pages/Showcase';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PropertyList />} />
          <Route path="properties/new" element={<PropertyEditor />} />
          <Route path="properties/:id" element={<PropertyEditor />} />
          <Route path="profile" element={<ProfileEditor />} />
        </Route>
        {/* Showcase route outside layout to have its own design */}
        <Route path="/showcase" element={<Showcase />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
