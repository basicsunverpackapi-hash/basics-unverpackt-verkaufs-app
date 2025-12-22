import Produkte from './pages/Produkte';
import verkUfe from './pages/Verkäufe';
import Analyse from './pages/Analyse';
import Merkzettel from './pages/Merkzettel';
import Bearbeiten from './pages/Bearbeiten';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Produkte": Produkte,
    "Verkäufe": verkUfe,
    "Analyse": Analyse,
    "Merkzettel": Merkzettel,
    "Bearbeiten": Bearbeiten,
}

export const pagesConfig = {
    mainPage: "Produkte",
    Pages: PAGES,
    Layout: __Layout,
};