/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddParticipant from './pages/AddParticipant';
import Affirmations from './pages/Affirmations';
import CheckIns from './pages/CheckIns';
import CoachTraining from './pages/CoachTraining';
import CommunityResources from './pages/CommunityResources';
import Dashboard from './pages/Dashboard';
import EditProgressReview from './pages/EditProgressReview';
import GoalsMilestones from './pages/GoalsMilestones';
import GroupSessions from './pages/GroupSessions';
import Interactions from './pages/Interactions';
import NewInteraction from './pages/NewInteraction';
import ParticipantDetail from './pages/ParticipantDetail';
import Participants from './pages/Participants';
import ProgressReviews from './pages/ProgressReviews';
import RecoveryCapitalPage from './pages/RecoveryCapitalPage';
import RecoveryTracker from './pages/RecoveryTracker';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import StrengthQuizzes from './pages/StrengthQuizzes';
import Surveys from './pages/Surveys';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddParticipant": AddParticipant,
    "Affirmations": Affirmations,
    "CheckIns": CheckIns,
    "CoachTraining": CoachTraining,
    "CommunityResources": CommunityResources,
    "Dashboard": Dashboard,
    "EditProgressReview": EditProgressReview,
    "GoalsMilestones": GoalsMilestones,
    "GroupSessions": GroupSessions,
    "Interactions": Interactions,
    "NewInteraction": NewInteraction,
    "ParticipantDetail": ParticipantDetail,
    "Participants": Participants,
    "ProgressReviews": ProgressReviews,
    "RecoveryCapitalPage": RecoveryCapitalPage,
    "RecoveryTracker": RecoveryTracker,
    "Referrals": Referrals,
    "Reports": Reports,
    "StrengthQuizzes": StrengthQuizzes,
    "Surveys": Surveys,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};