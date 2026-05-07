import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Incomes } from './pages/Incomes';
import { Expenses } from './pages/Expenses';
import { Cards } from './pages/Cards';
import { Invoices } from './pages/Invoices';
import { FixedBills } from './pages/FixedBills';
import { Investments } from './pages/Investments';
import { Goals } from './pages/Goals';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="entradas" element={<Incomes />} />
          <Route path="gastos" element={<Expenses />} />
          <Route path="cartoes" element={<Cards />} />
          <Route path="faturas" element={<Invoices />} />
          <Route path="contas-fixas" element={<FixedBills />} />
          <Route path="investimentos" element={<Investments />} />
          <Route path="metas" element={<Goals />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
