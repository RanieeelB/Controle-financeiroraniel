import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Incomes } from './pages/Incomes';
import { Expenses } from './pages/Expenses';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="entradas" element={<Incomes />} />
          <Route path="gastos" element={<Expenses />} />
          
          {/* Placeholder for other routes */}
          <Route path="cartoes" element={<div className="text-on-surface">Página de Cartões em breve</div>} />
          <Route path="faturas" element={<div className="text-on-surface">Página de Faturas em breve</div>} />
          <Route path="contas-fixas" element={<div className="text-on-surface">Página de Contas Fixas em breve</div>} />
          <Route path="investimentos" element={<div className="text-on-surface">Página de Investimentos em breve</div>} />
          <Route path="metas" element={<div className="text-on-surface">Página de Metas em breve</div>} />
          <Route path="relatorios" element={<div className="text-on-surface">Página de Relatórios em breve</div>} />
          <Route path="configuracoes" element={<div className="text-on-surface">Página de Configurações em breve</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
