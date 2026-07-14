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
import AccountApprovals from './pages/AccountApprovals';
import AddParticipant from './pages/AddParticipant';
import Affirmations from './pages/Affirmations';
import BARC10 from './pages/BARC10';
import CheckIns from './pages/CheckIns';
import CoachTraining from './pages/CoachTraining';
import CommunityResources from './pages/CommunityResources';
import CommunityRooms from './pages/CommunityRooms';
import Connector from './pages/Connector';
import Dashboard from './pages/Dashboard';
import EditProgressReview from './pages/EditProgressReview';
import EventsWall from './pages/EventsWall';
import Intake from './pages/Intake';
import GoalsMilestones from './pages/GoalsMilestones';
import GroupSessions from './pages/GroupSessions';
import Interactions from './pages/Interactions';
import NarcanTracking from './pages/NarcanTracking';
import NewInteraction from './pages/NewInteraction';
import ParticipantDetail from './pages/ParticipantDetail';
import Participants from './pages/Participants';
import ProgressReviews from './pages/ProgressReviews';
import RecoveryCapitalPage from './pages/RecoveryCapitalPage';
import RecoveryResidences from './pages/RecoveryResidences';
import RecoveryTracker from './pages/RecoveryTracker';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import StaffOperations from './pages/StaffOperations';
import StrengthQuizzes from './pages/StrengthQuizzes';
import Surveys from './pages/Surveys';
import WallsOfHonor from './pages/WallsOfHonor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountApprovals": AccountApprovals,
    "AddParticipant": AddParticipant,
    "Affirmations": Affirmations,
    "BARC10": BARC10,
    "CheckIns": CheckIns,
    "CoachTraining": CoachTraining,
    "CommunityResources": CommunityResources,
    "CommunityRooms": CommunityRooms,
    "Connector": Connector,
    "Dashboard": Dashboard,
    "EditProgressReview": EditProgressReview,
    "EventsWall": EventsWall,
    "Intake": Intake,
    "GoalsMilestones": GoalsMilestones,
    "GroupSessions": GroupSessions,
    "Interactions": Interactions,
    "NarcanTracking": NarcanTracking,
    "NewInteraction": NewInteraction,
    "ParticipantDetail": ParticipantDetail,
    "Participants": Participants,
    "ProgressReviews": ProgressReviews,
    "RecoveryCapitalPage": RecoveryCapitalPage,
    "RecoveryResidences": RecoveryResidences,
    "RecoveryTracker": RecoveryTracker,
    "Referrals": Referrals,
    "Reports": Reports,
    "StaffOperations": StaffOperations,
    "StrengthQuizzes": StrengthQuizzes,
    "Surveys": Surveys,
    "WallsOfHonor": WallsOfHonor,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};