import { useTranslation } from '../../i18n/useTranslation';
export default function RankingPanel({ game }) {
  const { t } = useTranslation();
  return <div className="ranking-bar"><span className="eyebrow">{t('ranking.title')}</span><div>{game.rankings.map(team => <span className="ranking-item" key={team.id}><b>{team.finalRank}</b><i style={{ background: team.shipColor }}/>{team.name}<small>{team.status === 'FINISHED' ? t('ranking.arrived') : team.status === 'ELIMINATED' ? t('ocean.sunk') : t('common.pointsCrew', { points: team.progress, crew: team.crewRemaining })}</small></span>)}</div></div>;
}
