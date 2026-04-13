import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import RawExplorer from './pages/RawExplorer';
import ManageStock from './pages/ManageStock';
import TimeTravel from './pages/TimeTravel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="raw" element={<RawExplorer />} />
          <Route path="stock-manager" element={<ManageStock />} />
          <Route path="time-travel" element={<TimeTravel />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
