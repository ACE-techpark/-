import { useTranslation } from '../i18n/useTranslation';
import LanguageEffects from '../i18n/LanguageEffects';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from '../components/Landing';
import AdminPanel from '../components/admin/AdminPanel';
import GameScreen from '../components/game/GameScreen';
import TeamAnswerScreen from '../components/team/TeamAnswerScreen';
import FinishPodium from '../components/game/FinishPodium';
import NetworkGate from '../components/common/NetworkGate';
import TeamJoinScreen from '../components/team/TeamJoinScreen';
import { useGameStore } from '../store/gameStore';
function AppRoutes() {
  const { t, errorText } = useTranslation();
  const { error, clearError } = useGameStore();
  return <><NetworkGate><Routes><Route path="/" element={<Landing/>}/><Route path="/admin" element={<AdminPanel/>}/><Route path="/game" element={<GameScreen/>}/><Route path="/join/:joinToken" element={<TeamJoinScreen/>}/><Route path="/team/:joinToken" element={<TeamAnswerScreen/>}/><Route path="/results" element={<FinishPodium/>}/><Route path="*" element={<Landing/>}/></Routes></NetworkGate>
    {error && <div role="alert" className="error-toast">{errorText(error)}<button onClick={clearError} aria-label={t('common.dismiss')}>×</button></div>}</>;
}
export default function App() { return <BrowserRouter><LanguageEffects/><AppRoutes/></BrowserRouter>; }
