import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';

import { AvaliacaoForm } from './pages/AvaliacaoForm';
import { Ocorrencias } from './pages/Ocorrencias';
import { OcorrenciaForm } from './pages/OcorrenciaForm';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/avaliar/:id" element={<AvaliacaoForm />} />
            <Route path="/ocorrencias" element={<Ocorrencias />} />
            <Route path="/ocorrencias/nova" element={<OcorrenciaForm />} />
            {/* Outras rotas protegidas serão adicionadas aqui nas próximas sprints */}
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
