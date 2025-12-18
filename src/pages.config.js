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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};