import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './pages/Layout';
import { PropertyList } from './pages/PropertyList';
import { PropertyEditor } from './pages/PropertyEditor';
import { ProfileEditor } from './pages/ProfileEditor';
import { Showcase } from './pages/Showcase';
import { Login } from './pages/Login';
import { Analytics } from './pages/Analytics';
import { Leads } from './pages/Leads';
import { Owners } from './pages/Owners';
import { CRM } from './pages/CRM';
import { Radar } from './pages/Radar';
import { Captacao } from './pages/Captacao';
import { ClientUpload } from './pages/ClientUpload';
import { FormGenerator } from './pages/FormGenerator';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<PropertyList />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="leads" element={<Leads />} />
          <Route path="owners" element={<Owners />} />
          <Route path="crm" element={<CRM />} />
          <Route path="radar" element={<Radar />} />
          <Route path="captacao" element={<Captacao />} />
          <Route path="form-generator" element={<FormGenerator />} />
          <Route path="properties/new" element={<PropertyEditor />} />
          <Route path="properties/:id" element={<PropertyEditor />} />
          <Route path="profile" element={<ProfileEditor />} />
        </Route>
        
        {/* Showcase and Client Portal routes outside layout */}
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/upload/:id" element={<ClientUpload />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;