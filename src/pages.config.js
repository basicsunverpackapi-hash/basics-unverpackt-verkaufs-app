import Analyse from './pages/Analyse';
import Auth from './pages/Auth';
import Bearbeiten from './pages/Bearbeiten';
import Merkzettel from './pages/Merkzettel';
import Produkte from './pages/Produkte';
import verkUfe from './pages/Verkäufe';
import Kaufen from './pages/Kaufen';
import Kasse from './pages/Kasse';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analyse": Analyse,
    "Auth": Auth,
    "Bearbeiten": Bearbeiten,
    "Merkzettel": Merkzettel,
    "Produkte": Produkte,
    "Verkäufe": verkUfe,
    "Kaufen": Kaufen,
    "Kasse": Kasse,
}

export const pagesConfig = {
    mainPage: "Produkte",
    Pages: PAGES,
    Layout: __Layout,
};