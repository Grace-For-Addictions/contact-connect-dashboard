import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import AddParticipant from './pages/AddParticipant';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Participants": Participants,
    "AddParticipant": AddParticipant,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};