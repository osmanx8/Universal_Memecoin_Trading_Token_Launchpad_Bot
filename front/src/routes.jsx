import { Routes, Route } from 'react-router-dom';
import PrepareMint from './pages/PrepareMint';
import PrepareMintPump from './pages/PrepareMintPump';
import PrepareMintBonk from './pages/PrepareMintBonk';
import Sell from './pages/Sell';
import Launch from './pages/Launch';
import MevBundle from './pages/MevBundle';
import ChainBuster from './pages/ChainBuster';
import StaggerMode from './pages/StaggerMode';
import ManualMode from './pages/ManualMode';
import CTMode from './pages/CTMode';
import Account from './pages/Account';
import Admin from './pages/Admin';
import SnipeBundle from './pages/SnipeBundle';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PrepareMint />} />
      <Route path="/prepare-mint" element={<PrepareMint />} />
      <Route path="/prepare-mint-pump" element={<PrepareMintPump />} />
      <Route path="/prepare-mint-bonk" element={<PrepareMintBonk />} />
      <Route path="/wallets" element={<Sell />} />
      <Route path="/prepare-launch" element={<Launch />} />
      <Route path="/mev-bundle" element={<MevBundle />} />
      <Route path="/chainbuster" element={<ChainBuster />} />
      <Route path="/stagger-mode" element={<StaggerMode />} />
      <Route path="/manual-mode" element={<ManualMode />} />
      <Route path="/cto-mode" element={<CTMode />} />
      <Route path="/account" element={<Account />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/snipe-bundle" element={<SnipeBundle />} />
    </Routes>
  );
}

export default AppRoutes; 