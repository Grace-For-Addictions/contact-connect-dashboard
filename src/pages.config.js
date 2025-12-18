import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import AddParticipant from './pages/AddParticipant';
import Interactions from './pages/Interactions';
import GroupSessions from './pages/GroupSessions';
import GoalsMilestones from './pages/GoalsMilestones';
import NewInteraction from './pages/NewInteraction';
import CheckIns from './pages/CheckIns';
import RecoveryCapitalPage from './pages/RecoveryCapitalPage';
import Referrals from './pages/Referrals';
import StrengthQuizzes from './pages/StrengthQuizzes';
import Surveys from './pages/Surveys';
import Affirmations from './pages/Affirmations';
import RecoveryTracker from './pages/RecoveryTracker';
import Reports from './pages/Reports';
import ParticipantDetail from './pages/ParticipantDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Participants": Participants,
    "AddParticipant": AddParticipant,
    "Interactions": Interactions,
    "GroupSessions": GroupSessions,
    "GoalsMilestones": GoalsMilestones,
    "NewInteraction": NewInteraction,
    "CheckIns": CheckIns,
    "RecoveryCapitalPage": RecoveryCapitalPage,
    "Referrals": Referrals,
    "StrengthQuizzes": StrengthQuizzes,
    "Surveys": Surveys,
    "Affirmations": Affirmations,
    "RecoveryTracker": RecoveryTracker,
    "Reports": Reports,
    "ParticipantDetail": ParticipantDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};