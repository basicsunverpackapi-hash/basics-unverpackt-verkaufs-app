import Analyse from './pages/Analyse';
import Bearbeiten from './pages/Bearbeiten';
import Merkzettel from './pages/Merkzettel';
import Produkte from './pages/Produkte';
import verkUfe from './pages/Verkäufe';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analyse": Analyse,
    "Bearbeiten": Bearbeiten,
    "Merkzettel": Merkzettel,
    "Produkte": Produkte,
    "Verkäufe": verkUfe,
}

export const pagesConfig = {
    mainPage: "Produkte",
    Pages: PAGES,
    Layout: __Layout,
};