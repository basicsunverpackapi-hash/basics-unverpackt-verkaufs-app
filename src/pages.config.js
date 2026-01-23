import Analyse from './pages/Analyse';
import Auth from './pages/Auth';
import Bearbeiten from './pages/Bearbeiten';
import Kasse from './pages/Kasse';
import Merkzettel from './pages/Merkzettel';
import Produkte from './pages/Produkte';
import verkUfe from './pages/Verkäufe';
import Verkaufen from './pages/Verkaufen';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analyse": Analyse,
    "Auth": Auth,
    "Bearbeiten": Bearbeiten,
    "Kasse": Kasse,
    "Merkzettel": Merkzettel,
    "Produkte": Produkte,
    "Verkäufe": verkUfe,
    "Verkaufen": Verkaufen,
}

export const pagesConfig = {
    mainPage: "Produkte",
    Pages: PAGES,
    Layout: __Layout,
};